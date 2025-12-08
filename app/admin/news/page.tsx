"use client";
import { useEffect, useState } from "react";

type NewsPost = {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
  createdAt: string;
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to load news");
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let imageUrls: string[] = [];
      if (imageFile) {
        const fd = new FormData();
        fd.set("file", imageFile);
        fd.set("folder", "news");
        const up = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!up.ok) throw new Error("Upload failed");
        const uj = await up.json();
        imageUrls = [uj.url];
      }
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          imageUrls,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      setTitle("");
      setContent("");
      setTags("");
      setImageFile(null);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin · News</h1>
        <p className="text-sm text-zinc-600">Create and manage news posts.</p>
      </header>

      <section className="rounded border bg-white p-4">
        <h2 className="font-medium mb-3">Create new post</h2>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Content (HTML or text)</label>
            <textarea
              className="w-full border rounded px-3 py-2 h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ai, cloud, security"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Hero image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">All posts</h2>
        {loading ? (
          <p className="text-sm text-zinc-600">Loading…</p>
        ) : (
          <ul className="divide-y rounded border bg-white">
            {items.map((n) => (
              <li key={n.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-zinc-600">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <a href={`/news/${n.id}`} className="text-sm text-blue-600 hover:underline">View</a>
              </li>
            ))}
            {items.length === 0 && <li className="p-3 text-sm text-zinc-600">No posts yet.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}
