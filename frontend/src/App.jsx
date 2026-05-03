import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./pages/Chat";
import Summarizer from "./pages/Summarizer";
import Quiz from "./pages/Quiz";
import ActiveRecall from "./pages/ActiveRecall";
import Feynman from "./pages/Feynman";

import {
  FileText,
  Brain,
  Repeat,
  BookOpen,
  MessageCircle,
  Sparkles
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [started, setStarted] = useState(false);
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("dark");

  const [userName, setUserName] = useState("");
  const [tempName, setTempName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  /* ================= START SCREEN ================= */
  if (!started) {
    return (
      <div className="h-screen relative overflow-hidden flex items-center justify-center bg-[#0b0f19] text-white">

        <div className="absolute w-[600px] h-[600px] bg-blue-500/20 blur-[160px] rounded-full top-[-150px] left-[-150px]" />
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/20 blur-[160px] rounded-full bottom-[-150px] right-[-150px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
          className="text-center max-w-2xl z-10"
        >

          <h1 className="text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 text-transparent bg-clip-text">
              Thinklet
            </span>{" "}
            AI
          </h1>

          <p className="text-gray-300 mb-10">
            Your intelligent study companion for notes, quizzes, summaries and deep learning.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-white/10">📄 Summarize Notes</div>
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-white/10">🧠 Quiz Generator</div>
            <div className="p-5 rounded-2xl bg-green-500/10 border border-white/10">🔁 Active Recall</div>
            <div className="p-5 rounded-2xl bg-yellow-500/10 border border-white/10">🧑‍🏫 Feynman Mode</div>
          </div>

          <button
            onClick={() => {
              setStarted(true);

              setTimeout(() => {
                setShowNamePrompt(true);
              }, 1200);
            }}
            className="px-8 py-4 text-lg font-semibold rounded-2xl 
            bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 
            hover:scale-105 transition shadow-[0_0_50px_rgba(59,130,246,0.4)]"
          >
            Enter Thinklet →
          </button>

        </motion.div>
      </div>
    );
  }

  /* ================= MAIN APP ================= */
  return (
    <div className={`${theme === "dark" ? "dark" : ""}`}>

      {/* ================= NAME PROMPT ================= */}
      <AnimatePresence>
        {showNamePrompt && !userName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="
                w-[420px] p-8 rounded-2xl relative overflow-hidden
                bg-white/10 backdrop-blur-2xl
                border border-white/20
                shadow-[0_0_60px_rgba(59,130,246,0.2)]
              "
            >

              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full" />

              <div className="relative z-10">

                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-blue-400 animate-pulse" size={18} />
                  <h2 className="text-xl font-semibold text-white">
                    Welcome to Thinklet
                  </h2>
                </div>

                <p className="text-gray-300 text-sm mb-1">
                  Before we start
                </p>

                <p className="text-white font-medium mb-4">
                  what should I call you?
                </p>

                <input
                  className="
                    w-full p-4 rounded-xl
                    bg-black/40 text-white
                    border border-white/10
                    focus:border-blue-400 outline-none
                  "
                  placeholder="Enter your name..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                />

                <button
                  onClick={() => {
                    if (tempName.trim()) {
                      setUserName(tempName.trim());
                      setShowNamePrompt(false);
                    }
                  }}
                  className="
                    w-full mt-5 py-3 rounded-xl
                    bg-gradient-to-r from-blue-600 to-indigo-500
                    hover:scale-[1.02] transition text-white font-medium
                  "
                >
                  Continue →
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= APP LAYOUT ================= */}
      <div className="flex h-screen bg-[#f6f9ff] dark:bg-[#0b0f19]">

        <Sidebar setPage={setPage} setTheme={setTheme} theme={theme} page={page} />

        <div className="flex-1 p-8 overflow-y-auto">

          <div className="max-w-5xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-2">

  <span className="
    bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400
    text-transparent bg-clip-text
    animate-pulse
  ">
    Thinklet
  </span>

  <span className="text-gray-900 dark:text-white">
    AI
  </span>

</h1>
<div className="absolute w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -z-10 top-0 left-6 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">
                Learn smarter, not harder
              </p>
            </div>

            {/* MAIN CARD */}
            <div className="
              p-6 rounded-2xl border
              bg-white/70 dark:bg-white/5
              border-gray-200 dark:border-white/10
              text-gray-900 dark:text-white
              backdrop-blur-xl
            ">

              <AnimatePresence mode="wait">

                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >

                  {page === "chat" && <Chat theme={theme} />}

                  {page === "home" && (
                    <div className="space-y-6">

                      {/* WELCOME CARD */}
                      <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5">

                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                          >
                            <Sparkles className="text-blue-500" />
                          </motion.div>

                          <h2 className="text-xl font-semibold">
                            Welcome back, {userName}
                          </h2>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          What would you like to do today?
                        </p>

                      </div>

                      {/* ACTION GRID */}
                      <div className="grid grid-cols-2 gap-4">

                        {[
                          ["Chat", MessageCircle],
                          ["Summarize", FileText],
                          ["Quiz", Brain],
                          ["Recall", Repeat]
                        ].map(([label, Icon], i) => (
                          <button
                            key={i}
                            onClick={() => setPage(label.toLowerCase())}
                            className="
                              p-5 rounded-2xl border
                              bg-white dark:bg-white/5
                              border-gray-200 dark:border-white/10
                              hover:scale-[1.02] transition
                              flex items-center gap-3
                              text-gray-900 dark:text-white
                            "
                          >
                            <Icon className="text-blue-500 dark:text-blue-400" />
                            <span className="font-medium">{label}</span>
                          </button>
                        ))}

                      </div>

                    </div>
                  )}

                  {page === "summarizer" && <Summarizer />}
                  {page === "quiz" && <Quiz />}
                  {page === "recall" && <ActiveRecall />}
                  {page === "feynman" && <Feynman />}

                </motion.div>

              </AnimatePresence>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default App;