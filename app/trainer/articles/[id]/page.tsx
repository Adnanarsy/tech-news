"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Article } from "@/types/article";
import type { ArticleTag, Tag, Confidence } from "@/types/taxonomy";

export default function TrainerArticleLabelingPage() {
  const params = useParams<{ id: string }>();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [labels, setLabels] = useState<ArticleTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedTag, setSelectedTag] = useState<string>("");
  const [confidence, setConfidence] = useState<Confidence>("related");

  async function loadAll() {
    if (!articleId) return;
    setLoading(true);
    setError(null);
    try {
      const [aRes, tRes, lRes] = await Promise.all([
        fetch(`/api/articles/${encodeURIComponent(articleId)}`, { cache: "no-store" }),
        fetch("/api/trainer/tags", { cache: "no-store" }),
        fetch(`/api/trainer/article-tags?articleId=${encodeURIComponent(articleId)}`, { cache: "no-store" }),
      ]);
      if (!aRes.ok) throw new Error(`Article load failed (${aRes.status})`);
      if (!tRes.ok) throw new Error(`Tags load failed (${tRes.status})`);
      if (!lRes.ok) throw new Error(`Labels load failed (${lRes.status})`);
      const a: Article = await aRes.json();
      const t = await tRes.json();
      const l = await lRes.json();
      setArticle(a);
      setTags((t.items as Tag[]).slice().sort((x, y) => x.index - y.index));
      setLabels(l.items as ArticleTag[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const assignedTagIds = useMemo(() => new Set(labels.map((x) => x.tagId)), [labels]);

  async function addLabel() {
    if (!selectedTag) return;
    if (assignedTagIds.has(selectedTag)) {
      alert("Tag already assigned");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/trainer/article-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, tagId: selectedTag, confidence }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Create failed (${res.status})`);
      }
      const created = (await res.json()) as ArticleTag;
      setLabels((arr) => [...arr, created]);
      setSelectedTag("");
    } catch (e: any) {
      alert(e?.message || "Failed to add label");
    } finally {
      setSaving(false);
    }
  }

  async function removeLabel(id: string) {
    setSaving(true);
    const prev = labels.slice();
    setLabels((arr) => arr.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/trainer/article-tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Delete failed (${res.status})`);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to remove label");
      setLabels(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Label Article</h1>
        {article && (
          <a className="text-sm underline" href={`/news/${article.id}`} target="_blank" rel="noreferrer">
            Open public page
          </a>
        )}
      </div>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !article ? (
        <div className="text-sm opacity-70">Article not found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: preview */}
          <div className="rounded-lg border overflow-hidden">
            <div className="p-3 border-b text-sm font-medium">Preview</div>
            <div className="p-4 space-y-2">
              <div className="text-lg font-semibold leading-tight">{article.title}</div>
              <div className="text-xs text-zinc-500">
                {new Date(article.createdAt).toLocaleString()} • {article.category}
              </div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {(article.cardDesc || article.content)?.slice(0, 600)}{(article.cardDesc || article.content).length > 600 ? "…" : ""}
              </div>
            </div>
          </div>

          {/* Right: labeling panel */}
          <div className="rounded-lg border">
            <div className="p-3 border-b text-sm font-medium">Assign Tags</div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Tag</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full rounded border px-2 py-1 bg-transparent"
                  >
                    <option value="">— choose —</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id} disabled={!t.active}>
                        #{t.index} • {t.id} • {t.name} {t.active ? "" : "(inactive)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Confidence</label>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value as Confidence)}
                    className="w-full rounded border px-2 py-1 bg-transparent"
                  >
                    <option value="mention">mention</option>
                    <option value="related">related</option>
                    <option value="primary">primary</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={addLabel}
                    disabled={saving || !selectedTag}
                    className="h-9 w-full rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {saving ? "Saving…" : "Add"}
                  </button>
                </div>
              </div>

              <div className="rounded border">
                <div className="p-2 border-b text-xs font-medium">Assigned ({labels.length})</div>
                {labels.length === 0 ? (
                  <div className="p-3 text-sm opacity-70">No tags assigned yet.</div>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--divider-color)" }}>
                    {labels.map((l) => {
                      const t = tags.find((x) => x.id === l.tagId);
                      return (
                        <li key={l.id} className="p-2 flex items-center gap-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border">#{t?.index ?? "?"}</span>
                          <code className="text-xs opacity-70">{l.tagId}</code>
                          <span className="text-sm">{t?.name || "(unknown)"}</span>
                          <span className="ml-auto text-xs opacity-70">{l.confidence}</span>
                          <button
                            onClick={() => removeLabel(l.id)}
                            className="h-7 rounded-full border px-3 text-xs border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
