import { useState, useRef } from "react";
import { FileText } from "lucide-react";

const API = "http://localhost:8000";

function Summarizer() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError("");
    setSummary("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/summarize-file`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setError("⚠️ Could not connect to backend. Make sure Ollama and FastAPI are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-blue-500" /> Summarizer
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Upload a PDF and get an instant AI study guide.
        </p>
      </div>

      <div className="p-6 rounded-2xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 space-y-4">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-400/40 rounded-xl p-10 cursor-pointer hover:bg-blue-500/5 transition">
          <FileText size={32} className="text-blue-500 mb-2" />
          <p className="font-medium">{fileName || "Upload PDF File"}</p>
          <p className="text-xs text-gray-500 mt-1">Click to select your document</p>
          <input ref={fileRef} type="file" accept="application/pdf,.docx" className="hidden"
            onChange={() => setFileName(fileRef.current?.files[0]?.name || "")} />
        </label>

        <button onClick={handleFile} disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium disabled:opacity-50 transition">
          {loading ? "Generating summary..." : "Generate Summary"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {summary && (
        <div className="p-6 rounded-2xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="font-semibold mb-3 text-blue-500">📄 Study Guide</h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {summary}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Summarizer;
