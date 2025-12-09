"use client";
import { useEffect, useRef, useState } from "react";
import type { Article } from "@/types/article";
import ArticleGrid from "./ArticleGrid";

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q) return setResults([]);
      const res = await fetch(`/api/articles/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.items);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // Close on Escape and trap focus within dialog
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    // focus input when opening
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search articles"
        className="w-full max-w-2xl rounded border"
        style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--divider-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "var(--divider-color)" }}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-transparent outline-none text-sm"
          />
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Esc</button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto">
          {q ? <ArticleGrid items={results} /> : <p className="text-sm text-zinc-500">Type to search...</p>}
        </div>
      </div>
    </div>
  );
}
