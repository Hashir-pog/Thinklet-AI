import { useState } from "react";
import { Brain } from "lucide-react";

const API = "http://localhost:8000";

function Quiz() {
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("new");

  const generateQuiz = async () => {
    if (!notes.trim()) return;
    setLoading(true); setError(""); setQuestions([]);
    setSelected({}); setRevealed({}); setScore(null); setMode("new");
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Generate a quiz on: ${notes}`, mode: "quiz" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuestions(JSON.parse(data.reply));
      setTopic(notes);
    } catch { setError("⚠️ Could not generate quiz. Make sure Ollama and FastAPI are running."); }
    finally { setLoading(false); }
  };

  const loadReview = async () => {
    setLoading(true); setError(""); setSelected({}); setRevealed({}); setScore(null); setMode("review");
    try {
      const res = await fetch(`${API}/spaced-repetition/review`);
      const data = await res.json();
      if (data.total === 0) { setError("No weak questions yet — take a quiz first!"); setMode("new"); }
      else setQuestions(data.questions);
    } catch { setError("⚠️ Could not load review questions."); }
    finally { setLoading(false); }
  };

  const pick = (qi, opt) => { if (!revealed[qi]) setSelected((p) => ({ ...p, [qi]: opt[0] })); };

  const submit = async () => {
    const r = {}; questions.forEach((_, i) => { r[i] = true; }); setRevealed(r);
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (selected[i] === q.answer) {
        correct++;
        if (mode === "review")
          await fetch(`${API}/spaced-repetition/remove?question=${encodeURIComponent(q.question)}`, { method: "DELETE" });
      } else {
        await fetch(`${API}/spaced-repetition/add`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q.question, options: q.options, answer: q.answer, explanation: q.explanation, topic: topic || "General" }),
        });
      }
    }
    setScore(correct);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Brain className="text-purple-500" /> Quiz Generator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate MCQs or review your weak questions.</p>
      </div>

      <div className="p-6 rounded-2xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 space-y-4">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 outline-none resize-none text-sm"
          placeholder="Enter a topic or paste notes..." />
        <div className="flex gap-3">
          <button onClick={generateQuiz} disabled={loading || !notes.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium disabled:opacity-50 transition">
            {loading && mode === "new" ? "Generating..." : "Generate Quiz"}
          </button>
          <button onClick={loadReview} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium disabled:opacity-50 transition">
            🔁 Review Weak Questions
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {mode === "review" && questions.length > 0 && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-400/20 text-sm text-orange-400">
          🔁 Reviewing {questions.length} question{questions.length > 1 ? "s" : ""} you got wrong before
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="p-5 rounded-2xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 space-y-3">
              <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const letter = opt[0];
                  const isSel = selected[qi] === letter;
                  const isCorrect = q.answer === letter;
                  let style = "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10";
                  if (revealed[qi]) { if (isCorrect) style = "bg-green-500/20 border-green-500"; else if (isSel) style = "bg-red-500/20 border-red-400"; }
                  else if (isSel) style = "bg-blue-500/20 border-blue-400";
                  return (
                    <button key={oi} onClick={() => pick(qi, opt)}
                      className={`w-full text-left px-4 py-2 rounded-xl border text-sm transition ${style}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {revealed[qi] && <p className="text-xs text-gray-500 dark:text-gray-400">💡 {q.explanation}</p>}
            </div>
          ))}

          {score === null ? (
            <button onClick={submit} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium transition">
              Submit & See Score
            </button>
          ) : (
            <div className="p-5 rounded-2xl bg-green-500/10 border border-green-400/30 text-center space-y-1">
              <p className="text-2xl font-bold">{score} / {questions.length}</p>
              <p className="text-sm text-gray-500">{score === questions.length ? "Perfect! 🎉" : score >= questions.length * 0.6 ? "Good job! 👍" : "Keep studying! 💪"}</p>
              {score < questions.length && <p className="text-xs text-orange-400">Wrong answers saved to your review pool automatically.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Quiz;
