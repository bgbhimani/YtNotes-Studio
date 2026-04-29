// import { useState } from "react";
// import Header from "../components/Header";

// import SourcePanel from "../components/SourcePanel";
// import ChatPanel from "../components/ChatPanel";
// import StudioPanel from "../components/StudioPanel";

// export default function MainScreen() {
//   const [activeTab, setActiveTab] = useState("chat");

//   return (
//     <div className="min-h-screen flex justify-center">
//       <div className="w-full max-w-[1400px] p-3 flex flex-col">

//         {/* Header */}
//         <Header />

//         {/* Mobile Tabs */}
//         <div className="flex md:hidden gap-2 mb-2">
//           {["source", "chat", "studio"].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className="flex-1 py-1 rounded-xl border text-sm capitalize"
//               style={{
//                 background:
//                   activeTab === tab
//                     ? "var(--card-blue)"
//                     : "var(--bg-card)",
//                 borderColor: "var(--border)",
//               }}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Layout */}
//         <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">

//           <SourcePanel activeTab={activeTab} />
//           <ChatPanel activeTab={activeTab} />
//           <StudioPanel activeTab={activeTab} />

//         </div>

//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import Header from "../components/Header";
import SourcePanel from "../components/SourcePanel";
import ChatPanel from "../components/ChatPanel";
import StudioPanel from "../components/StudioPanel";

export default function MainScreen() {
  const [videoId, setVideoId] = useState(null);
  const [mode, setMode] = useState("chat");
  const [selectedOutput, setSelectedOutput] = useState(null);

  return (
    <div className="h-screen flex justify-center bg-[var(--bg-main)] overflow-hidden">
      
      {/* 🔥 MAIN CONTAINER (LOCKED HEIGHT) */}
      <div className="w-full max-w-[1400px] p-3 flex flex-col h-full overflow-hidden">

        {/* HEADER (FIXED HEIGHT) */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* MOBILE TABS (FIXED HEIGHT) */}
        <div className="flex md:hidden gap-2 mt-2 shrink-0">
          {["source", "chat", "studio"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className="flex-1 py-1 rounded-xl border text-sm capitalize"
              style={{
                background:
                  mode === tab
                    ? "var(--card-blue)"
                    : "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 🔥 MAIN GRID (TAKES REMAINING HEIGHT ONLY) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 mt-3 min-h-0">

          {/* SOURCE */}
          <div
            className={`md:col-span-1 min-h-0 ${
              mode !== "source" ? "hidden md:block" : ""
            }`}
          >
            <div
              className="h-full border-2 rounded-3xl p-3 overflow-hidden"
              style={{
                background: "var(--sidebar)",
                borderColor: "var(--border)",
              }}
            >
              <SourcePanel setVideoId={setVideoId} />
            </div>
          </div>

          {/* CHAT */}
          <div
            className={`md:col-span-3 min-h-0 ${
              mode !== "chat" ? "hidden md:block" : ""
            }`}
          >
            <div
              className="h-full border-2 rounded-3xl p-3 flex flex-col min-h-0 overflow-hidden"
              style={{
                background: "var(--chat)",
                borderColor: "var(--border)",
              }}
            >
              <ChatPanel
                videoId={videoId}
                mode={mode}
                selectedOutput={selectedOutput}
              />
            </div>
          </div>

          {/* STUDIO */}
          <div
            className={`md:col-span-1 min-h-0 ${
              mode !== "studio" ? "hidden md:block" : ""
            }`}
          >
            <div
              className="h-full border-2 rounded-3xl p-3 overflow-y-auto"
              style={{
                background: "var(--studio)",
                borderColor: "var(--border)",
              }}
            >
              <StudioPanel
                setMode={setMode}
                setSelectedOutput={setSelectedOutput}
                videoId={videoId}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}