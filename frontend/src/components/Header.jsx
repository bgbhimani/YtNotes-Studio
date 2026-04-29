import { useState, useEffect } from "react";
import { toggleTheme } from "../utils/theme";
import { Link } from "react-router-dom";


export default function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const handleToggle = () => {
    toggleTheme();
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  return (
    <div
      className="border-3 rounded-xl p-4 mb-3 flex justify-between items-center"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >

      <h1 className="text-xl font-semibold">
        <Link to="/" className="hover:opacity-80 transition">
          YtNotes Studio
        </Link>
      </h1>

      <button
        onClick={handleToggle}
        className="px-3 py-1 border rounded-lg hover:scale-105 transition"
        style={{ borderColor: "var(--border)" }}
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  );
}