import { useState, useRef, useEffect } from "react";
import { Repeat } from "lucide-react";

const API = "http://localhost:8000";

function ActiveRecall() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startSession = async () => {
    if (!topic.trim()) return;
    setStarted(true);
    setLoading(true);
    const initialMsg = `topic: ${topic}`;
    // user message + empty assistant placeholder to stream into
    setMessages([
      { role: "user", content: initialMsg },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: initialMsg, mode: "active_recall", history: [] }),
      });
      if (!res.ok) throw new Error("Backend error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "⚠️ Could not connect to backend." };
        return updated;
      });
    } finally { setLoading(false); }
  };

  const sendAnswer = async () => {
    if (!input.trim() || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const userMsg = { role: "user", content: input };
    // user message + empty assistant placeholder
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, mode: "active_recall", history }),
      });
      if (!res.ok) throw new Error("Backend error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "⚠️ Backend error." };
        return updated;
      });
    } finally { setLoading(false); }
  };

  if (!started) return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Repeat className="text-green-500" /> Active Recall</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI tests you on a topic and tracks your score.</p>
      </div>
      <div className="p-6 rounded-2xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 space-y-4">
        <input value={topic} onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startSession()}
          className="w-full p-4 rounded-xl bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 outline-none"
          placeholder="Enter a topic (e.g. DNA Replication)" />
        <button onClick={startSession} disabled={!topic.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-500 text-white font-medium disabled:opacity-50 transition">
          Start Session →
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Repeat className="text-green-500" /> Active Recall — {topic}</h2>
        <button onClick={() => { setStarted(false); setMessages([]); setTopic(""); }}
          className="text-xs px-3 py-1 rounded-lg bg-gray-200 dark:bg-white/10 transition">
          New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-xl border bg-[#f6f9ff] dark:bg-[#0b0f19] border-gray-200 dark:border-gray-800">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user" ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-800 dark:text-white text-black"
            }`}>
              {msg.content}
              {loading && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
          disabled={loading} placeholder="Type your answer..."
          className="flex-1 p-3 rounded-xl border focus:outline-none focus:border-green-500 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white border-gray-300 disabled:opacity-50 transition" />
        <button onClick={sendAnswer} disabled={loading || !input.trim()}
          className="px-6 py-3 bg-green-500 text-white rounded-xl disabled:opacity-40 transition">
          {loading ? "..." : "Answer"}
        </button>
      </div>
    </div>
  );
}

export default ActiveRecall;
