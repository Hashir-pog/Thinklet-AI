import {
  Moon,
  Sun,
  MessageCircle,
  FileText,
  Brain,
  Repeat,
  BookOpen
} from "lucide-react";

function Sidebar({ setPage, setTheme, theme, page }) {

  const btnStyle = (active) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200
    ${
      active
        ? "bg-blue-500 text-gray-900 dark:text-white shadow-md"
        : "hover:bg-white/10 dark:hover:bg-white/10"
    }`;

  return (
    <div className="w-64 h-screen p-5 border-r transition-colors duration-300
bg-[#dbeafe] text-gray-900 dark:text-white
dark:bg-[#0f172a] border-black/10 dark:border-white/10">

      {/* LOGO */}
      <div className="mb-10 relative">

        {/* glow */}
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-blue-400/20 rounded-full blur-2xl"></div>

        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-300">
            Thinklet
          </span>
        </h1>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
          AI Study Companion
        </p>
      </div>

      <div className="mb-6 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">

  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
    Workspace
  </p>

  <div className="text-sm font-medium">
    📚 Study Mode
  </div>

</div>

      {/* NAV */}
      <div className="space-y-2">

        <button
          onClick={() => setPage("chat")}
          className={btnStyle(page === "chat")}
        >
          <MessageCircle size={18} />
          Chat
        </button>

        <button
          onClick={() => setPage("summarizer")}
          className={btnStyle(page === "summarizer")}
        >
          <FileText size={18} />
          Summarizer
        </button>

        <button
          onClick={() => setPage("quiz")}
          className={btnStyle(page === "quiz")}
        >
          <Brain size={18} />
          Quiz
        </button>

        <button
          onClick={() => setPage("recall")}
          className={btnStyle(page === "recall")}
        >
          <Repeat size={18} />
          Active Recall
        </button>

        <button
          onClick={() => setPage("feynman")}
          className={btnStyle(page === "feynman")}
        >
          <BookOpen size={18} />
          Feynman
        </button>

      </div>

      <div className="mt-8 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20">

  <p className="text-xs text-blue-500 font-medium">
    Tip 💡
  </p>

  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
    Use Chat for explanations, Quiz for testing yourself, and Recall for memory practice.
  </p>

</div>

      {/* THEME TOGGLE */}
      <div className="mt-10">
        <button
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl w-full 
          bg-black/10 dark:bg-white/10 
          hover:scale-[1.03] transition-all duration-200"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

    </div>
  );
}

export default Sidebar;