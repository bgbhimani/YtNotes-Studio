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
    const [ppts, setPpts] = useState([]);
    const [voices, setVoices] = useState([]);
    const [pptLoading, setPptLoading] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);

    const session_id = localStorage.getItem("session_id");
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const downloadVoice = (voiceId, filename = "summary.mp3") => {
        const link = document.createElement("a");
        link.href = `${backendUrl}/voice/download/${voiceId}`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

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
        fetchPpts();
        fetchVoices();
    }, [videoId]);

    const generations = [
        ...outputs.map((o) => ({
            ...o,
            type: "summary",
        })),

        ...ppts.map((p) => ({
            ...p,
            type: "ppt",
        })),

        ...voices.map((v) => ({
            ...v,
            type: "audio",
        })),
    ];
    generations.reverse();
    const generatePPT = async () => {

        if (!videoId) return;

        try {

            setPptLoading(true);

            const res = await API.post(
                "/ppt/generate",
                null,
                {
                    params: {
                        video_id: videoId,
                        session_id,
                    },
                    responseType: "blob",
                }
            );

            // 🔽 download instantly
            const url = window.URL.createObjectURL(
                new Blob([res.data])
            );

            const link = document.createElement("a");

            link.href = url;

            link.setAttribute(
                "download",
                "presentation.pptx"
            );

            document.body.appendChild(link);

            link.click();

            fetchPpts();

        } catch (err) {

            console.error(err);

        } finally {

            setPptLoading(false);

        }
    };

    // ❌ delete
    const deleteOutput = async (id) => {
        try {
            await API.delete(`/chat/output/${id}`);
            fetchOutputs();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPpts = async () => {
        try {
            const res = await API.get("/ppt/all", {
                params: {
                    session_id,
                    video_id: videoId,
                }
            });

            setPpts((res.data.ppts || []).reverse());

        } catch (err) {
            console.error(err);
        }
    };

    const fetchVoices = async () => {
        if (!videoId) return;

        try {
            const res = await API.get("/voice/all", {
                params: {
                    session_id,
                    video_id: videoId,
                },
            });

            setVoices((res.data.voices || []).reverse());
        } catch (err) {
            console.error(err);
        }
    };

    const generateAudio = async () => {
        if (!videoId) return;

        try {
            setAudioLoading(true);

            const res = await API.post("/voice/generate", null, {
                params: {
                    video_id: videoId,
                    session_id,
                },
            });

            setSelectedOutput({
                summary: res.data.summary,
                audioUrl: `${backendUrl}/${res.data.path}`,
                audioDownloadUrl: `${backendUrl}/voice/download/${res.data._id}`,
                _id: res.data._id,
            });
            setMode("audio");

            fetchOutputs();
            fetchVoices();
        } catch (err) {
            console.error("Audio error:", err);
        } finally {
            setAudioLoading(false);
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

                <button
                    onClick={generatePPT}
                    className="w-full p-2 rounded-xl border transition-all duration-200 hover:scale-[1.03]"
                    style={{
                        background: "var(--btn-bg)",
                        borderColor: "var(--border)",
                    }}
                >
                    {pptLoading ? "Generating PPT..." : "Generate PPT"}
                </button>

                <button
                    onClick={generateAudio}
                    disabled={audioLoading}
                    className="w-full p-2 rounded-xl border transition-all duration-200 hover:scale-[1.03] disabled:opacity-60"
                    style={{
                        background: "var(--btn-bg)",
                        borderColor: "var(--border)",
                    }}
                >
                    {audioLoading ? "Generating Audio..." : "Generate Audio"}
                </button>
            </div>

            {/* OUTPUT LIST */}
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar p-1   ">


                <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar p-1">

                    {generations.map((item, index) => (

                        <div
                            key={item._id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                            style={{
                                background: "var(--btn-bg)",
                                borderColor: "var(--border)",
                            }}
                        >

                            {/* LEFT */}
                            <div
                                onClick={() => {

                                    // 🔹 SUMMARY
                                    if (item.type === "summary") {

                                        setMode("summary");
                                        setSelectedOutput(item);

                                    }

                                    // 🔹 PPT
                                    else if (item.type === "ppt") {

                                        const link = document.createElement("a");

                                        link.href = `${backendUrl}/${item.path}`;

                                        link.setAttribute(
                                            "download",
                                            item.filename || "presentation.pptx"
                                        );

                                        document.body.appendChild(link);

                                        link.click();

                                    }

                                    // 🔹 AUDIO
                                    else if (item.type === "audio") {

                                        downloadVoice(
                                            item._id,
                                            item.filename || "summary.mp3"
                                        );

                                        setMode("audio");
                                        setSelectedOutput({
                                            summary: item.summary,
                                            audioUrl: `${backendUrl}/${item.path}`,
                                            audioDownloadUrl: `${backendUrl}/voice/download/${item._id}`,
                                            _id: item._id,
                                        });

                                    }

                                }}
                                className="cursor-pointer flex-1 pr-2 truncate"
                            >

                                {item.type === "summary"
                                    ? `Summary ${generations.length - index}`
                                    : item.type === "ppt"
                                    ? `PPT ${generations.length - index}`
                                    : `Audio ${generations.length - index}`
                                }

                            </div>

                            {/* DELETE */}
                            <button
                                onClick={async () => {

                                    try {

                                        // 🔹 DELETE SUMMARY
                                        if (item.type === "summary") {

                                            await API.delete(
                                                `/chat/output/${item._id}`
                                            );

                                        }

                                        // 🔹 DELETE PPT
                                        else if (item.type === "ppt") {

                                            await API.delete(
                                                `/ppt/${item._id}`
                                            );

                                        }

                                        // 🔹 DELETE AUDIO
                                        else {

                                            await API.delete(
                                                `/voice/${item._id}`
                                            );

                                        }

                                        fetchOutputs();
                                        fetchPpts();
                                        fetchVoices();

                                    } catch (err) {

                                        console.error(err);

                                    }

                                }}
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
        </div>
    );
}