// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";

// export default function Dashboard() {
//   const navigate = useNavigate();

//   const videos = [
//     { id: "1", title: "Youtube Video Title" },
//     { id: "2", title: "Youtube Video Title" },
//   ];

//   return (
//     <div className="min-h-screen flex justify-center">
//       <div className="w-full max-w-[1400px] p-3">

//         <Header />

//         <p className="mb-3 text-sm opacity-70">Your Notes:</p>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

//           {/* Add New */}
//           <div
//             className="h-32 flex flex-col items-center justify-center cursor-pointer border-3 rounded-xl
//             hover:scale-105 hover:shadow-md transition-all duration-200"
//             style={{
//               background: "var(--card-green)",
//               borderColor: "var(--border)",
//             }}
//           >
//             <span className="text-4xl font-bold">+</span>
//             <p>Create New Book</p>
//           </div>

//           {/* Videos */}
//           {videos.map((video) => (
//             <div
//               key={video.id}
//               onClick={() => navigate(`/studio/${video.id}`)}
//               className="h-32 p-3 cursor-pointer border-3 rounded-xl
//               hover:scale-105 hover:shadow-md transition-all duration-200"
//               style={{
//                 background: "var(--card-blue)",
//                 borderColor: "var(--border)",
//               }}
//             >
//               <p className="text-xs text-right opacity-70">yt_id</p>
//               <p className="mt-6 text-sm font-medium">{video.title}</p>
//             </div>
//           ))}
//         </div>

//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { getSessionId } from "../utils/session";
import Header from "../components/Header";

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");

  const navigate = useNavigate();
  const session_id = getSessionId();

  const deleteVideo = async (video_id) => {
    try {
      await API.delete(`/video/video/${video_id}`, {
        params: { session_id },
      });

      fetchVideos(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };


  // 📦 Fetch videos
  const fetchVideos = async () => {
    try {
      const res = await API.get("/video/videos", {
        params: { session_id },
      });

      console.log("API RESPONSE:", res.data); // 🔥 ADD THIS

      setVideos(res.data.videos); // 👈 suspect line
    } catch (err) {
      console.error(err);
    }
  };

  // ➕ Add video
  const addVideo = async () => {
    if (!url) return;

    try {
      const res = await API.post("/video/video", {
        youtube_url: url,   // ✅ MATCH BACKEND
        session_id,
      });

      setShowModal(false);
      setUrl("");

      // refresh list
      fetchVideos();

      // go to studio
      navigate(`/studio/${res.data.video_id}`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-[1400px] p-3">

        <Header />

        <p className="mb-3 text-sm opacity-70">Your Notes:</p>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {/* ➕ Add New */}
          <div
            onClick={() => setShowModal(true)}
            className="h-32 flex flex-col items-center justify-center cursor-pointer border-2 rounded-2xl
            hover:scale-105 transition"
            style={{
              background: "var(--card-green)",
              borderColor: "var(--border)",
            }}
          >
            <span className="text-4xl font-bold">+</span>
            <p>Create New</p>
          </div>

          {/* 🎥 Videos */}
          {videos.map((video) => (
            <div
              key={video._id || video.video_id}
              className="relative h-32 p-3 cursor-pointer border-2 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                background: "var(--card-blue)",
                borderColor: "var(--border)",
              }}
            >

              {/* 🗑 DELETE BUTTON (TOP RIGHT) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteVideo(video.video_id);
                }}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md border text-xs transition-all duration-200 hover:scale-110"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--btn-bg-hover)",
                }}
              >
                ✕
              </button>

              {/* CLICK AREA */}
              <div
                onClick={() => navigate(`/studio/${video.video_id}`)}
                className="h-full flex flex-col justify-between"
              >

                {/* TITLE */}
                <p className="text-sm font-medium">
                  YouTube Video
                </p>

                {/* VIDEO ID (BOTTOM RIGHT) */}
                <p className="text-[10px] text-right opacity-70">
                  {video.video_id}
                </p>

              </div>

            </div>
          ))}
        </div>

        {/* 🧩 Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
            <div
              className="p-4 rounded-xl w-[300px] border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              <p className="mb-2 font-semibold">Add YouTube Video</p>

              <input
                placeholder="Paste URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border rounded mb-3 outline-none"
                style={{
                  background: "var(--bg-main)",
                  borderColor: "var(--border)",
                }}
              />

              <div className="flex justify-between">
                <button onClick={() => setShowModal(false)}>
                  Cancel
                </button>

                <button
                  onClick={addVideo}
                  className="px-3 py-1 border rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}