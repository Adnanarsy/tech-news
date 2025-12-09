"use client";
import { useState } from "react";
import type { Article } from "@/types/article";

type FormState = {
  title: string;
  description: string;
  category: string;
  author: string;
  imageUrl: string;
  body: string;
  tags: string; // comma separated
  orientation: "portrait" | "landscape" | "";
  status: "draft" | "published";
};

export default function AdminUploadPage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "analysis",
    author: "",
    imageUrl: "",
    body: "",
    tags: "",
    orientation: "",
    status: "published",
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim(),
        author: form.author.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        body: form.body.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        orientation: (form.orientation || undefined) as any,
        status: form.status,
      };
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Create failed (${res.status})`);
      }
      const data = (await res.json()) as Article;
      setCreated(data);
    } catch (e: any) {
      setError(e?.message || "Failed to create article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Article</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Upload a new article. Published posts immediately appear in feeds.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-4">
          <label className="block text-xs mb-1">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Compilers meet AI: what's next?"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
          >
            <option value="trending">trending</option>
            <option value="deep">deep</option>
            <option value="analysis">analysis</option>
            <option value="news">news</option>
            <option value="opinion">opinion</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs mb-1">Author</label>
          <input
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Ada Lovelace"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs mb-1">Image URL</label>
          <input
            required
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="md:col-span-6">
          <label className="block text-xs mb-1">Description (card)</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Short summary for cards"
          />
        </div>

        <div className="md:col-span-6">
          <label className="block text-xs mb-1">Body</label>
          <textarea
            required
            rows={8}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full rounded border px-2 py-2 bg-transparent"
            placeholder="Full article content..."
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs mb-1">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="ID_02, ID_03"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Orientation</label>
          <select
            value={form.orientation}
            onChange={(e) => setForm((f) => ({ ...f, orientation: e.target.value as any }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
          >
            <option value="">auto</option>
            <option value="portrait">portrait</option>
            <option value="landscape">landscape</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </div>

        <div className="md:col-span-6">
          <button
            disabled={submitting}
            className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            type="submit"
          >
            {submitting ? "Saving..." : "Create Article"}
          </button>
          {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {created && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Created</h2>
              <p className="text-sm opacity-70">ID: {created.id}</p>
            </div>
            <a
              className="text-sm underline"
              href={`/news/${created.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open article
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
