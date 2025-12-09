"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string>("system");
  const [mql, setMql] = useState<MediaQueryList | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") || "system";
    // Prepare system theme listener
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setMql(media);
    const handleChange = () => {
      const current = localStorage.getItem("theme") || "system";
      if (current === "system") applyTheme("system");
    };
    media.addEventListener?.("change", handleChange);
    // Initial apply
    applyTheme(saved);
    setTheme(saved);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  function applyTheme(next: string) {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = next === "dark" || (next === "system" && prefersDark);
    const light = next === "light" || (next === "system" && !prefersDark);
    // Ensure mutual exclusivity
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", light);
  }

  function toggle() {
    const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  if (!mounted) return null;

  const label = theme === "dark" ? "D" : theme === "light" ? "L" : "S";

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="h-8 w-8 rounded-full border border-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900 transition-colors"
      title={`Theme: ${theme}`}
    >
      {label}
    </button>
  );
}
