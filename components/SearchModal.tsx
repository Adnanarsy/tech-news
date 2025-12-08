"use client";
import { useEffect, useState } from "react";
import type { Article } from "@/types/article";
import ArticleGrid from "./ArticleGrid";

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Article[]>([]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q) return setResults([]);
      const res = await fetch(`/api/articles/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.items);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24" onClick={onClose}>
      <div className="w-full max-w-2xl rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <input
            autoFocus
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
