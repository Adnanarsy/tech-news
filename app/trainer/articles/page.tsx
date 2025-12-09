"use client";
import { useEffect, useMemo, useState } from "react";
import type { Article } from "@/types/article";

type Feed = { items: Article[]; cursor: string | null };

export default function TrainerArticlesListPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"all" | "trending" | "deep" | "analysis">("all");
  const [missingOnly, setMissingOnly] = useState(false);
  const [feed, setFeed] = useState<Feed>({ items: [], cursor: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false); // for missing labels pass

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      let url = "";
      if (q.trim()) {
        const params = new URLSearchParams({ q: q.trim(), limit: "20" });
        url = `/api/articles/search?${params.toString()}`;
      } else {
        const params = new URLSearchParams({ limit: "12" });
        const useLatest = category === "all";
        if (!useLatest) params.set("category", category);
        if (!reset && feed.cursor) params.set("cursor", feed.cursor);
        url = `${useLatest ? "/api/articles/latest" : "/api/articles"}?${params.toString()}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed: ${res.status}`);
      const data = await res.json();
      const items: Article[] = q.trim() ? data.items : [...(reset ? [] : feed.items), ...data.items];
      const cursor: string | null = q.trim() ? null : data.nextCursor ?? null;
      let final = items;
      if (missingOnly) {
        setFiltering(true);
        // Filter by missing labels: keep items that have zero labels
        const checks = await Promise.all(
          items.map(async (a) => {
            const r = await fetch(`/api/trainer/article-tags?articleId=${encodeURIComponent(a.id)}`, { cache: "no-store" });
            if (!r.ok) return true; // fail-open to show
            const d = await r.json();
            return (d.items?.length || 0) === 0;
          })
        );
        final = items.filter((_, i) => checks[i]);
        setFiltering(false);
      }
      setFeed({ items: final, cursor });
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change
  useEffect(() => {
    const t = setTimeout(() => load(true), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, missingOnly]);

  const canLoadMore = useMemo(() => !q.trim() && !!feed.cursor, [q, feed.cursor]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Articles (Trainer)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Search and filter articles. Label them with canonical tags on the detail page.</p>
      </div>

      <div className="rounded-lg border p-3 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-3">
          <label className="block text-xs mb-1">Search by title</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded border px-2 py-1 bg-transparent" placeholder="Search…" />
        </div>
        <div>
          <label className="block text-xs mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full rounded border px-2 py-1 bg-transparent">
            <option value="all">all (latest)</option>
            <option value="trending">trending</option>
            <option value="deep">deep</option>
            <option value="analysis">analysis</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            Missing labels only
          </label>
        </div>
        <div className="flex items-end">
          <button onClick={() => load(true)} className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900">
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="p-3 border-b text-sm font-medium">Results</div>
        {loading ? (
          <div className="p-4 text-sm opacity-70">Loading… {filtering ? "(filtering)" : ""}</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : feed.items.length === 0 ? (
          <div className="p-4 text-sm opacity-70">No articles.</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--divider-color)" }}>
            {feed.items.map((a) => (
              <li key={a.id} className="p-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs text-zinc-500 truncate">{new Date(a.createdAt).toLocaleString()} • {a.category}</div>
                </div>
                <a className="text-sm underline" href={`/trainer/articles/${a.id}`}>Manage labels</a>
              </li>
            ))}
          </ul>
        )}
        {canLoadMore && (
          <div className="p-3">
            <button
              onClick={() => load(false)}
              disabled={loading}
              className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
