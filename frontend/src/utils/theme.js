export function toggleTheme() {
  const root = document.documentElement;

  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

export function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  }
}