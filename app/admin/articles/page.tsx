"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@/types/article";

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadArticles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/articles");
      if (!res.ok) throw new Error("Failed to load articles");
      const data = await res.json();
      setArticles(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete article");
      await loadArticles(); // Reload list
    } catch (e: any) {
      alert(e.message || "Failed to delete article");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Articles</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Edit or delete articles</p>
        </div>
        <Link
          href="/admin/upload"
          className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          Create New Article
        </Link>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-sm text-zinc-600">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="text-sm text-zinc-600">No articles found.</div>
      ) : (
        <div className="rounded-lg border divide-y">
          {articles.map((article) => (
            <div key={article.id} className="p-4 flex items-start justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-24 h-16 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{article.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {article.author && <span>{article.author} • </span>}
                      {new Date(article.createdAt).toLocaleDateString()} • {article.category}
                    </p>
                    {article.cardDesc && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {article.cardDesc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/news/${article.id}`}
                  target="_blank"
                  className="h-8 rounded-full border px-3 text-xs border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  View
                </Link>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="h-8 rounded-full border px-3 text-xs border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(article.id)}
                  disabled={deleting === article.id}
                  className="h-8 rounded-full border px-3 text-xs border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {deleting === article.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

