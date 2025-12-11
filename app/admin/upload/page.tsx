"use client";
import { useState, useEffect } from "react";
import type { Article } from "@/types/article";
import type { Tag } from "@/types/taxonomy";

type FormState = {
  title: string;
  description: string;
  category: string;
  author: string;
  imageUrl: string;
  imageFile: File | null;
  imageSource: "url" | "file";
  body: string;
  tags: string[]; // array of tag IDs
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
    imageFile: null,
    imageSource: "url",
    body: "",
    tags: [],
    orientation: "",
    status: "published",
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load available tags on mount
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/trainer/tags");
        if (res.ok) {
          const data = await res.json();
          const tags = (data.items || []) as Tag[];
          // Sort alphabetically by name, only active tags
          const sorted = tags
            .filter((t) => t.active)
            .sort((a, b) => a.name.localeCompare(b.name));
          setAvailableTags(sorted);
        }
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    }
    loadTags();
  }, []);

  function toggleTag(tagId: string) {
    setForm((prev) => {
      const tags = prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId];
      return { ...prev, tags };
    });
  }

  function getTagName(tagId: string): string {
    return availableTags.find((t) => t.id === tagId)?.name || tagId;
  }

  async function handleImageUpload(file: File): Promise<string> {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "articles");

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Image upload failed");
      }

      const data = await res.json();
      return data.url;
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      // Handle image upload if file is selected
      let imageUrl = form.imageUrl.trim();
      if (form.imageSource === "file" && form.imageFile) {
        imageUrl = await handleImageUpload(form.imageFile);
      }

      if (!imageUrl) {
        throw new Error("Image URL or file is required");
      }

      // Convert tag IDs to array (already in array format)
      const tagIds = form.tags;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim(),
        author: form.author.trim() || undefined,
        imageUrl,
        body: form.body.trim(),
        tags: tagIds,
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
          <label className="block text-xs mb-1">Title (max 9 words)</label>
          <input
            required
            value={form.title}
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/).filter(Boolean);
              if (words.length <= 9 || e.target.value.length < form.title.length) {
                setForm((f) => ({ ...f, title: e.target.value }));
              }
            }}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Compilers meet AI: what's next?"
            maxLength={180}
          />
          <p className="text-xs text-zinc-500 mt-1">
            {form.title.trim().split(/\s+/).filter(Boolean).length}/9 words
          </p>
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
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs mb-1">Image</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  checked={form.imageSource === "url"}
                  onChange={() => setForm((f) => ({ ...f, imageSource: "url", imageFile: null }))}
                />
                URL
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  checked={form.imageSource === "file"}
                  onChange={() => setForm((f) => ({ ...f, imageSource: "file", imageUrl: "" }))}
                />
                Upload
              </label>
            </div>
            {form.imageSource === "url" ? (
              <input
                required={form.imageSource === "url"}
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full rounded border px-2 py-1 bg-transparent"
                placeholder="https://images.unsplash.com/..."
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  required={form.imageSource === "file"}
                  onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))}
                  className="w-full rounded border px-2 py-1 bg-transparent text-xs"
                />
                {uploadingImage && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
                {form.imageFile && !uploadingImage && (
                  <p className="text-xs text-zinc-500 mt-1">{form.imageFile.name}</p>
                )}
              </div>
            )}
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs">Tags</label>
            <button
              type="button"
              onClick={() => setShowTagPanel(!showTagPanel)}
              className="text-xs rounded-full border px-2 py-1 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {showTagPanel ? "Hide Tags" : "Show Available Tags"}
            </button>
          </div>
          
          {/* Selected tags display */}
          {form.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {form.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  {getTagName(tagId)}
                  <button
                    type="button"
                    onClick={() => toggleTag(tagId)}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Remove ${getTagName(tagId)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Available tags panel */}
          {showTagPanel && (
            <div className="mb-2 p-3 border rounded max-h-48 overflow-y-auto" style={{ background: "var(--background)" }}>
              <p className="text-xs font-medium mb-2">Available Tags (A-Z):</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.tags.includes(tag.id)
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
