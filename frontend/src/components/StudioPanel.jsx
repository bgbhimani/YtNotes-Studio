// export default function StudioPanel({ activeTab }) {
//   const items = ["Video Summary", "The Report", "Flash Cards"];

//   return (
//     <div
//       className={`border-2 rounded-2xl p-3 col-span-1 ${
//         activeTab !== "studio" ? "hidden md:block" : ""
//       }`}
//       style={{
//         background: "var(--studio)",
//         borderColor: "var(--border)",
//       }}
//     >
//       <p className="font-semibold mb-3">Studio</p>

//       {/* Action Buttons */}
//       <button
//         className="w-full p-2 mb-2 rounded-xl border hover:scale-[1.02] transition"
//         style={{
//           background: "var(--bg-card)",
//           borderColor: "var(--border)",
//         }}
//       >
//         Summary
//       </button>

//       <button
//         className="w-full p-2 mb-3 rounded-xl border hover:scale-[1.02] transition"
//         style={{
//           background: "var(--bg-card)",
//           borderColor: "var(--border)",
//         }}
//       >
//         Flashcards
//       </button>

//       {/* Generated Content */}
//       <div>
//         <p className="text-sm font-semibold mb-2">Your Outputs</p>

//         <div className="space-y-2">
//           {items.map((item, i) => (
//             <div
//               key={i}
//               className="flex justify-between items-center px-3 py-2 rounded-xl border hover:scale-[1.02] transition"
//               style={{
//                 background: "var(--card-blue)",
//                 borderColor: "var(--border)",
//               }}
//             >
//               <span className="text-sm">{item}</span>
//               <button className="text-lg">⋮</button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import API from "../api";

export default function StudioPanel({ setMode, setSelectedOutput, videoId }) {
    const [outputs, setOutputs] = useState([]);

    const session_id = localStorage.getItem("session_id");

    // 📥 fetch outputs
    const fetchOutputs = async () => {
        if (!videoId) return;

        try {
            const res = await API.get("/chat/outputs", {
                params: { session_id, video_id: videoId },
            });

            // 🔥 reverse so newest comes first
            setOutputs((res.data.outputs || []).reverse());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOutputs();
    }, [videoId]);

    // ❌ delete
    const deleteOutput = async (id) => {
        try {
            await API.delete(`/chat/output/${id}`);
            fetchOutputs();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-full flex flex-col">

            <p className="font-semibold mb-3">Studio</p>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 mb-4">
                <button
                    onClick={() => setMode("chat")}
                    className="w-full p-2 rounded-xl border transition-all duration-200 hover:scale-[1.03]"
                    style={{
                        background: "var(--btn-bg)",
                        borderColor: "var(--border)",
                    }}
                >
                    Chat
                </button>

                <button
                    onClick={async () => {
                        if (!videoId) return;

                        try {
                            const res = await API.post("/summary/summary", {
                                video_id: videoId,
                                session_id,
                            });

                            const summaryData = {
                                answer: res.data.summary,
                                _id: Date.now(), // temp id for UI
                            };

                            // show it immediately
                            setSelectedOutput(summaryData);
                            setMode("summary");

                            // refresh stored summaries
                            fetchOutputs();

                        } catch (err) {
                            console.error("Summary error:", err);
                        }
                    }}
                    className="w-full p-2 rounded-xl border transition-all duration-200 hover:scale-[1.03]"
                    style={{
                        background: "var(--btn-bg)",
                        borderColor: "var(--border)",
                    }}
                >
                    Summarize Video
                </button>
            </div>

            {/* OUTPUT LIST */}
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar p-1   ">

                {outputs.map((item, index) => (
                    <div
                        key={item._id || item.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                        style={{
                            background: "var(--btn-bg)",
                            borderColor: "var(--border)",
                        }}
                    >

                        {/* LEFT TEXT */}
                        <div
                            onClick={() => {
                                setMode("summary");
                                setSelectedOutput(item);
                            }}
                            className="cursor-pointer flex-1 pr-2 truncate"
                        >
                            Summary {outputs.length - index}
                        </div>

                        {/* DELETE BUTTON */}
                        <button
                            onClick={() => deleteOutput(item._id || item.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 hover:scale-110"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--btn-bg-hover)",
                            }}
                        >
                            ✕
                        </button>

                    </div>
                ))}

            </div>
        </div>
    );
}