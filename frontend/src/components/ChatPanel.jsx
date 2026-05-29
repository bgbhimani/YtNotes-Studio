// // export default function ChatPanel({ activeTab }) {
// //   return (
// //     <div
// //       className={`border-2 rounded-2xl p-3 col-span-3 flex flex-col ${
// //         activeTab !== "chat" ? "hidden md:flex" : ""
// //       }`}
// //       style={{
// //         background: "var(--chat)",
// //         borderColor: "var(--border)",
// //       }}
// //     >
// //       <p className="font-semibold mb-2">Chat</p>

// //       <div className="flex-1 overflow-y-auto text-sm opacity-80">
// //         {/* Chat messages will come here */}
// //       </div>

// //       <input
// //         placeholder="Start Typing..."
// //         className="mt-3 p-2 rounded-xl border outline-none"
// //         style={{
// //           background: "var(--bg-card)",
// //           borderColor: "var(--border)",
// //         }}
// //       />
// //     </div>
// //   );
// // }



// import { useEffect, useState } from "react";
// import API from "../api";
// import { getSessionId } from "../utils/session";

// export default function ChatPanel({ videoId, mode }) {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");

//     const session_id = getSessionId();

//     const fetchHistory = async () => {
//         const res = await API.get("/chat/chat/history", {
//             params: { session_id, video_id: videoId },
//         });

//         setMessages(res.data.history);
//     };

//     useEffect(() => {
//         if (videoId) fetchHistory();
//     }, [videoId]);

//     const sendMessage = async () => {
//         const res = await API.post("/chat/chat", {
//             video_id: videoId,
//             question: input,
//             session_id,
//         });

//         setMessages((prev) => [
//             ...prev,
//             { question: input, answer: res.data.answer },
//         ]);

//         setInput("");
//     };

//     const generateSummary = async () => {
//         const res = await API.post("/summary/summary", {
//             video_id: videoId,
//             session_id,
//         });

//         setMessages([
//             {
//                 question: "Summary",
//                 answer: res.data.summary,
//             },
//         ]);
//     };

//     useEffect(() => {
//         if (mode === "summary") {
//             generateSummary();
//         }
//     }, [mode]);

//     return (
//         <div className="flex flex-col h-full border rounded-xl p-3">

//             <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-2">

//                 {messages.map((m, i) => (
//                     <div key={i} className="border p-2 rounded">
//                         <p className="text-xs opacity-60">
//                             {m.provider || ""}
//                         </p>
//                         <p><b>Q:</b> {m.question}</p>
//                         <p><b>A:</b> {m.answer}</p>
//                     </div>
//                 ))}

//             </div>

//             {mode === "chat" && (
//                 <div className="mt-2 flex">
//                     <input
//                         value={input}
//                         onChange={(e) => setInput(e.target.value)}
//                         className="border p-2 flex-1"
//                     />
//                     <button onClick={sendMessage}>Send</button>
//                 </div>
//             )}
//         </div>
//     );
// }


import { useEffect, useRef, useState } from "react";
import API from "../api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPanel({ videoId, mode, selectedOutput }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const scrollRef = useRef(null);

    // 🔐 Session
    const getSessionId = () => {
        let id = localStorage.getItem("session_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("session_id", id);
        }
        return id;
    };

    const session_id = getSessionId();

    // 📜 Fetch chat history
    const fetchHistory = async () => {
        if (!videoId) return;

        try {
            const res = await API.get("/chat/chat/history", {
                params: { session_id, video_id: videoId },
            });

            setMessages(res.data.history || []);
        } catch (err) {
            console.error("History error:", err);
        }
    };

    useEffect(() => {
        if (mode === "chat") {
            fetchHistory();
        }
    }, [videoId, mode]);

    // 🔽 Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // 💬 Send message
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = {
            question: input,
            answer: "...",
            provider: "loading",
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        try {
            const res = await API.post("/chat/chat", {
                video_id: videoId,
                question: input,
                session_id,
            });

            const aiMsg = {
                question: input,
                answer: res.data.answer,
                provider: res.data.provider, // 🔥 IMPORTANT
            };

            setMessages((prev) => [...prev.slice(0, -1), aiMsg]);

        } catch (err) {
            console.error(err);
        }
    };

    // ❌ No video
    if (!videoId) {
        return (
            <div className="h-full flex items-center justify-center">
                Select a video to start
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            {/* 🧠 MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 min-h-0">

                {/* 🔹 SUMMARY VIEW */}
                {mode === "summary" && selectedOutput && (
                    <div
                        className="p-3 rounded-xl"
                        style={{ background: "var(--card-blue)" }}
                    >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{selectedOutput.answer}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* 🔹 CHAT VIEW */}
                {mode === "chat" &&
                    messages.map((m, i) => (
                        <div key={i} className="space-y-1">

                            {/* USER */}
                            <div
                                className="p-2 rounded-xl max-w-[80%] md:max-w-[65%]"
                                style={{ background: "var(--bg-card)" }}
                            >
                                {m.question}
                            </div>

                            {/* AI */}
                            <div
                                className="p-2 rounded-xl max-w-[80%] md:max-w-[65%] ml-auto"
                                style={{ background: "var(--card-blue)" }}
                            >
                               <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mb-3">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mb-2">
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mb-2">
        {children}
      </h3>
    ),

    p: ({ children }) => (
      <p className="mb-2 leading-7">
        {children}
      </p>
    ),

    ul: ({ children }) => (
      <ul className="list-disc ml-5 mb-2">
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol className="list-decimal ml-5 mb-2">
        {children}
      </ol>
    ),

    li: ({ children }) => (
      <li className="mb-1">
        {children}
      </li>
    ),

    code: ({ children }) => (
      <code
        className="px-1 py-[2px] rounded bg-black/10 text-sm"
      >
        {children}
      </code>
    ),

    pre: ({ children }) => (
      <pre
        className="p-3 rounded-xl overflow-x-auto mb-3"
        style={{
          background: "var(--bg-card)",
        }}
      >
        {children}
      </pre>
    ),
  }}
>
  {m.answer}
</ReactMarkdown>

                                <div className="text-xs opacity-70 mt-1">
                                    {m.provider || m.source || "ai"}
                                </div>
                            </div>

                        </div>
                    ))}

                {/* ⏳ LOADING */}
                {loading && (
                    <div className="text-sm opacity-60">Thinking...</div>
                )}

                {/* 🔽 SCROLL TARGET */}
                <div ref={scrollRef} />
            </div>

            {/* ✏️ INPUT (FIXED BOTTOM) */}
            {mode === "chat" && (
                <div
                    className="flex gap-2 pt-2"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    {/* <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl outline-none border"
            placeholder="Start typing..."
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-main)",
            }}
          /> */}

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Start typing..."
                        rows={1}
                        className="flex-1 px-3 py-2 rounded-xl border outline-none resize-none overflow-hidden"
                        style={{
                            background: "var(--bg-card)",
                            borderColor: "var(--border)",
                            color: "var(--text-main)",
                        }}

                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === "Enter") {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}

                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        className="px-4 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--btn-bg)",
                        }}
                    >
                        Send
                    </button>
                </div>
            )}
        </div>
    );
}