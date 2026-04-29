import { useParams } from "react-router-dom";
import Header from "../components/Header";
import { useState } from "react";

export default function Studio() {
  const { videoId } = useParams();
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-[1400px] p-3 flex flex-col">

        <Header />
      
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">

          {/* Sidebar */}
          <div
            className="border-3 rounded-xl p-3 col-span-1"
            style={{
              background: "var(--sidebar)",
              borderColor: "var(--border)",
            }}
          >
            <p className="font-semibold mb-2">Source</p>

            <div
              className="border rounded-xl p-2 hover:scale-[1.02] transition"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              Video-1
            </div>
          </div>

          {/* Chat */}
          <div
            className="border-3 rounded-xl p-3 col-span-3 flex flex-col justify-between"
            style={{
              background: "var(--chat)",
              borderColor: "var(--border)",
            }}
          >
            <div>
              <p className="font-semibold mb-2">Chat</p>

              <div className="space-y-2 text-sm opacity-80">
                {/* messages */}
              </div>
            </div>

            <input
              placeholder="Start Typing..."
              className="mt-3 p-2 rounded-xl outline-none border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-main)",
              }}
            />
          </div>

          {/* Studio Panel */}
          <div
            className="border-3 rounded-xl p-3 col-span-1"
            style={{
              background: "var(--studio)",
              borderColor: "var(--border)",
            }}
          >
            <p className="font-semibold mb-3">Studio</p>

            <div className="space-y-2">

              <button
                className="w-full p-2 rounded-xl border hover:scale-[1.02] transition"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                Summary
              </button>

              <button
                className="w-full p-2 rounded-xl border hover:scale-[1.02] transition"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                Flashcards
              </button>

            </div>


            {/* Generated Content */}
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Your Outputs</p>

              <div className="space-y-2">

                {["Video Summary", "The Report", "Flash Cards"].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer hover:scale-[1.02] transition"
                    style={{
                      background: "var(--card-blue)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <span className="text-sm">{item}</span>

                    {/* Actions */}
                    <div className="flex gap-2 items-center">

                      {/* Menu dots */}
                      <button className="text-lg">⋮</button>

                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}