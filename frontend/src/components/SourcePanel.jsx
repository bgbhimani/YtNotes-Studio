// export default function SourcePanel({ activeTab }) {
//   return (
//     <div
//       className={`border-2 rounded-2xl p-3 col-span-1 ${
//         activeTab !== "source" ? "hidden md:block" : ""
//       }`}
//       style={{
//         background: "var(--sidebar)",
//         borderColor: "var(--border)",
//       }}
//     >
//       <p className="font-semibold mb-2">Source</p>

//       <div
//         className="border rounded-xl p-2"
//         style={{
//           background: "var(--bg-card)",
//           borderColor: "var(--border)",
//         }}
//       >
//         Video-1
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import API from "../api";
import { getSessionId } from "../utils/session";

export default function SourcePanel({ setVideoId }) {
  const [videos, setVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");

  const session_id = getSessionId();

  const fetchVideos = async () => {
    const res = await API.get("/video/videos", {
      params: { session_id },
    });
    setVideos(res.data.videos);
  };

  const addVideo = async () => {
    await API.post("/video/video", {
      url,
      session_id,
    });

    setShowModal(false);
    setUrl("");
    fetchVideos();
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="h-full flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-base">Source</p>

        <button
          onClick={() => setShowModal(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-200 hover:scale-110 hover:shadow-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--btn-bg)",
          }}
        >
          +
        </button>
      </div>

      {/* VIDEO LIST */}
      <div className="space-y-2 overflow-y-auto no-scrollbar p-1">

        {videos.map((v) => (
          <div
            key={v._id}
            onClick={() => setVideoId(v.video_id)}
            className="p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            {v.video_id}
          </div>
        ))}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div
            className="w-[90%] max-w-md p-4 rounded-2xl border shadow-lg"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >

            <p className="font-semibold mb-3">Add YouTube Video</p>

            <input
              placeholder="Paste YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 rounded-xl border mb-3 outline-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-main)",
                color: "var(--text-main)",
              }}
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 rounded-lg border transition hover:scale-105"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>

              <button
                onClick={addVideo}
                className="px-3 py-1 rounded-lg border transition hover:scale-105"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--btn-bg)",
                }}
              >
                Add
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}