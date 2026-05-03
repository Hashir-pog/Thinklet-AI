

import json
import httpx
import fitz       
import docx        
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import Optional




OLLAMA_URL    = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2:3b"



SYSTEM_PROMPTS = {

    "tutor": """You are Thinklet, a study assistant for university students.

How to respond:
- If the student asks a factual question (what/when/who/define), answer it directly first, then ask a short follow-up question to check understanding.
- If the student asks a conceptual or "help me understand" question, guide them with one question at a time instead of dumping the full answer.
- If the student answers something incorrectly, don't say "wrong". Point at the part that's off and ask a question that nudges them toward fixing it.
- For math or science, show working step by step. Wrap equations in $$ ... $$ for LaTeX rendering.
- Keep replies focused. No filler, no "great question!", no restating what the student said.

If textbook content is provided to you below, prefer it over your own knowledge. If the question isn't covered by the provided content, say so before answering from general knowledge.""",

    "quiz": """You generate multiple choice quizzes for students.

Return ONLY a JSON array of exactly 5 questions. No intro text, no explanation, no markdown code fences. Just the raw JSON array.

Format (follow exactly):
[
  {
    "question": "the question text",
    "options": ["A) option one", "B) option two", "C) option three", "D) option four"],
    "answer": "A",
    "explanation": "one sentence explaining why the correct answer is right"
  }
]

Rules:
- All 4 options must be plausible. No obvious throwaways.
- The "answer" field is a single letter: A, B, C, or D.
- Mix the position of correct answers across the 5 questions — don't make them all "A".""",

    "summarizer": """You create study guides for university students.

Structure your response in this order:
1. Overview — 2-3 sentences explaining what the material covers
2. Key concepts — bullet points, one idea per bullet
3. Important formulas or definitions — if any exist in the material
4. Exam tips — 2-3 bullets on what to focus on or common pitfalls

Keep the whole guide readable in under 5 minutes. Use the student's material — don't add outside facts that weren't in what they gave you.""",

    "active_recall": """You are running an Active Recall session. Active Recall means testing the student on material to strengthen memory, rather than letting them re-read it.

How the session runs:
1. The student gives you a topic.
2. Ask ONE question about it. Wait for their answer before moving on.
3. If their answer is correct: say "Correct!" then ask the next question.
4. If their answer is wrong: say "Not quite" and give one small hint, then ask the SAME question again.
5. If they get it wrong a second time on the same question: give the full answer briefly, then move to the next question.
6. After 5 questions total, tell them their score like "You got 4 out of 5" and briefly note which topics they should review.

Never give the full answer on the first wrong try — only after the second.""",

    "feynman": """You are running a Feynman Technique session. The Feynman Technique: you truly understand something only when you can explain it simply, like to a 12-year-old.

How the session runs:
1. The student names a concept they want to understand.
2. Ask them to explain it in their own simple words.
3. After they explain, do these in order:
   - One line on what they got right.
   - Point out the specific gaps or mistakes.
   - Ask a question that guides them toward fixing the biggest gap. Don't hand them the answer.
4. Repeat step 3 until their explanation holds together.
5. Once they've got it right, give them a clean final summary they can compare against.

Be encouraging. The goal is understanding, not catching them out.""",
}



app = FastAPI(
    title="Thinklet API",
    description="Backend server for the Thinklet AI study assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)




class ChatRequest(BaseModel):
    message: str
    mode: Optional[str] = "tutor"
    context: Optional[str] = None
    history: Optional[list[dict]] = []
    model: Optional[str] = DEFAULT_MODEL

class ChatResponse(BaseModel):
    reply: str
    model: str
    mode: str


class QuizQuestion(BaseModel):
    question: str
    options: list[str]  
    answer: str          
    explanation: str


class SpacedRepetitionItem(BaseModel):
    question: str
    options: list[str]
    answer: str
    explanation: str
    topic: str
    wrong_count: int = 1   

class SpacedRepetitionStore(BaseModel):
    items: list[SpacedRepetitionItem]


_spaced_store: list[SpacedRepetitionItem] = []



def build_messages(request: ChatRequest) -> list[dict]:
    """
    Builds the full message list to send to the AI.
    Order: system prompt -> RAG context (if any) -> chat history -> new message
    """
    system_text = SYSTEM_PROMPTS.get(request.mode, SYSTEM_PROMPTS["tutor"])

    if request.context:
        system_text += f"""

The following content was retrieved from the student's textbook.
Use it to answer accurately. If the question isn't covered here, say so.

--- TEXTBOOK CONTENT ---
{request.context}
--- END ---"""

    messages = [{"role": "system", "content": system_text}]
    messages.extend(request.history or [])
    messages.append({"role": "user", "content": request.message})
    return messages


async def ollama_running() -> bool:
    
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def read_file(contents: bytes, filename: str) -> str:
    """Extracts plain text from an uploaded PDF or Word document."""
    name = filename.lower()

    if name.endswith(".pdf"):
        pdf = fitz.open(stream=contents, filetype="pdf")
        return "\n".join(page.get_text() for page in pdf)

    elif name.endswith(".docx"):
        with open("/tmp/upload.docx", "wb") as f:
            f.write(contents)
        document = docx.Document("/tmp/upload.docx")
        return "\n".join(p.text for p in document.paragraphs if p.text.strip())

    else:
        raise HTTPException(400, "Please upload a .pdf or .docx file.")


def validate_quiz(raw_reply: str) -> list[QuizQuestion]:
  
    cleaned = raw_reply.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        return [QuizQuestion(**q) for q in parsed]
    except (json.JSONDecodeError, ValidationError, TypeError) as e:
        raise HTTPException(
            422,
            f"AI returned a malformed quiz. Please try again. Details: {str(e)}"
        )




@app.get("/health")
async def health():
    """Confirms the server and Ollama are both running."""
    ok = await ollama_running()
    return {
        "status":  "ok" if ok else "degraded",
        "ollama":  "running" if ok else "not running — open a terminal and run: ollama serve",
        "model":   DEFAULT_MODEL,
        "modes":   list(SYSTEM_PROMPTS.keys()),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    """
    if not await ollama_running():
        raise HTTPException(503, "Ollama is not running. Start it with: ollama serve")

    messages = build_messages(request)

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={"model": request.model, "messages": messages, "stream": False},
            )
            r.raise_for_status()
            reply = r.json()["message"]["content"]

    except httpx.HTTPStatusError as e:
        raise HTTPException(500, f"Ollama returned an error: {e.response.text}")
    except Exception as e:
        raise HTTPException(500, f"Something went wrong: {str(e)}")

    if request.mode == "quiz":
        questions = validate_quiz(reply)
        reply = json.dumps([q.model_dump() for q in questions])
  

    return ChatResponse(reply=reply, model=request.model, mode=request.mode)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming version of /chat.
    """
    if not await ollama_running():
        raise HTTPException(503, "Ollama is not running. Start it with: ollama serve")

    messages = build_messages(request)

    async def stream_tokens():
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={"model": request.model, "messages": messages, "stream": True},
            ) as response:
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if chunk.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue

    return StreamingResponse(stream_tokens(), media_type="text/plain")


@app.post("/summarize-file")
async def summarize_file(file: UploadFile = File(...)):
    """
    Upload a PDF or Word document, get back an AI-generated study guide.

    Uses map-reduce summarization so the WHOLE document is read, not just the start:
      1. Split the document into chunks the model can handle
      2. Summarize each chunk separately ("map" step)
      3. Combine those mini-summaries into one final study guide ("reduce" step)
    """
    if not await ollama_running():
        raise HTTPException(503, "Ollama is not running. Start it with: ollama serve")

    contents = await file.read()
    text = read_file(contents, file.filename)

    if not text.strip():
        raise HTTPException(400, "No readable text found in this file.")

    # ── Split into ~2500-word chunks (safe for an 8k-context model) ──
    words = text.split()
    chunk_size = 2500
    chunks = [
        " ".join(words[i:i + chunk_size])
        for i in range(0, len(words), chunk_size)
    ]

    # Short doc — one shot is fine, skip the map-reduce dance
    if len(chunks) == 1:
        req = ChatRequest(
            message=f"Create a study guide from this text:\n\n{chunks[0]}",
            mode="summarizer",
        )
        messages = build_messages(req)
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={"model": DEFAULT_MODEL, "messages": messages, "stream": False},
            )
            return {"summary": r.json()["message"]["content"], "filename": file.filename, "chunks_processed": 1}

    # ── MAP: summarize each chunk ──
    mini_summaries = []
    async with httpx.AsyncClient(timeout=120) as client:
        for i, chunk in enumerate(chunks, 1):
            map_messages = [
                {
                    "role": "system",
                    "content": (
                        "You are summarizing one section of a longer document. "
                        "Pull out the key concepts, definitions, and any formulas. "
                        "Be concise — bullet points are fine. "
                        "Don't add intro text like 'this section covers...' — just the content."
                    ),
                },
                {"role": "user", "content": f"Section {i} of {len(chunks)}:\n\n{chunk}"},
            ]
            r = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={"model": DEFAULT_MODEL, "messages": map_messages, "stream": False},
            )
            mini_summaries.append(r.json()["message"]["content"])

    # ── REDUCE: combine the mini-summaries into one study guide ──
    combined = "\n\n---\n\n".join(
        f"Section {i} notes:\n{s}" for i, s in enumerate(mini_summaries, 1)
    )
    reduce_req = ChatRequest(
        message=(
            f"Below are notes from {len(chunks)} sections of a document. "
            f"Combine them into ONE clean study guide. Remove duplicates and "
            f"organize logically.\n\n{combined}"
        ),
        mode="summarizer",
    )
    reduce_messages = build_messages(reduce_req)
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": DEFAULT_MODEL, "messages": reduce_messages, "stream": False},
        )
        final_summary = r.json()["message"]["content"]

    return {
        "summary": final_summary,
        "filename": file.filename,
        "chunks_processed": len(chunks),
    }


@app.post("/active-recall")
async def active_recall(request: ChatRequest):
    """
    AI asks the student 5 questions one at a time and tracks score.
    """
    request.mode = "active_recall"
    return await chat(request)


@app.post("/feynman")
async def feynman(request: ChatRequest):
    """
    Student explains a concept; AI finds gaps and guides them to understanding.
    """
    request.mode = "feynman"
    return await chat(request)




@app.post("/spaced-repetition/add")
async def add_wrong_question(item: SpacedRepetitionItem):
    """
    Saves the wrong quiz question to the spaced repetition pool so it can be re-tested later.
    If the same question is already in the pool, increments its wrong_count.
    """
    for existing in _spaced_store:
        if existing.question == item.question:
            existing.wrong_count += 1
            return {"status": "updated", "wrong_count": existing.wrong_count}

    _spaced_store.append(item)
    return {"status": "added", "total_in_pool": len(_spaced_store)}


@app.get("/spaced-repetition/review")
async def get_review_questions(topic: Optional[str] = None):
    """
    Returns questions the student got wrong
    """
    pool = _spaced_store

    if topic:
        pool = [item for item in pool if item.topic.lower() == topic.lower()]

    sorted_pool = sorted(pool, key=lambda x: x.wrong_count, reverse=True)

    return {
        "total": len(sorted_pool),
        "questions": [item.model_dump() for item in sorted_pool]
    }


@app.delete("/spaced-repetition/remove")
async def remove_mastered_question(question: str):
    """
     when a student gets a question right during review.
    Removes it from the spaced repetition pool  they've mastered it.
    """
    global _spaced_store
    before = len(_spaced_store)
    _spaced_store = [item for item in _spaced_store if item.question != question]
    removed = before - len(_spaced_store)
    return {"status": "removed" if removed else "not found", "remaining": len(_spaced_store)}


@app.get("/spaced-repetition/stats")
async def spaced_repetition_stats():
    """
    Returns a summary of the student's weak areas.
    """
    if not _spaced_store:
        return {"total_weak_questions": 0, "topics": {}}

    topic_counts: dict[str, int] = {}
    for item in _spaced_store:
        topic_counts[item.topic] = topic_counts.get(item.topic, 0) + item.wrong_count

    return {
        "total_weak_questions": len(_spaced_store),
        "topics": dict(sorted(topic_counts.items(), key=lambda x: x[1], reverse=True))
    }



@app.get("/models")
async def list_models():

    if not await ollama_running():
        raise HTTPException(503, "Ollama is not running.")
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{OLLAMA_URL}/api/tags")
        models = [m["name"] for m in r.json().get("models", [])]
    return {"models": models}
