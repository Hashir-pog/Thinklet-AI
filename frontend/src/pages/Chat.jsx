import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

function Chat({ theme }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi 👋 I'm Thinklet. What are you studying today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("tutor");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // placeholder assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, mode, history }),
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
        updated[updated.length - 1] = {
          role: "assistant",
          content: "⚠️ Could not connect to backend. Make sure Ollama and FastAPI are both running.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const modes = ["tutor", "active_recall", "feynman"];

  return (
    <div className="flex flex-col h-full">

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💬 Chat</h2>
          <p className="text-gray-400 text-sm">Your AI study assistant</p>
        </div>
        <div className="flex gap-2">
          {modes.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
              }`}>
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border
        bg-[#f6f9ff] border-gray-200 dark:bg-[#0b0f19] dark:border-gray-800 transition-colors duration-300">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-3 rounded-2xl max-w-[70%] text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300 ${
              msg.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
            }`}>
              {msg.content}
              {loading && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={loading ? "Thinklet is thinking..." : "Ask anything... (Enter to send)"}
          disabled={loading}
          className="flex-1 p-3 rounded-xl border focus:outline-none focus:border-blue-500
            bg-white border-gray-300 text-black
            dark:bg-gray-900 dark:border-gray-700 dark:text-white
            disabled:opacity-50 transition-colors duration-300"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:opacity-90 transition disabled:opacity-40">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
