"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/time";
import type { Article } from "@/types/article";

interface Props {
  article: Article;
  trendingColor?: boolean; // if true, show color even without hover
  onClick?: (id: string) => void;
}

export default function ArticleCard({ article, trendingColor, onClick }: Props) {
  const [viewed, setViewed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const router = useRouter();

  const keyViewed = useMemo(() => `viewed:${article.id}`, [article.id]);
  const keyBook = useMemo(() => `book:${article.id}`, [article.id]);

  useEffect(() => {
    setViewed(localStorage.getItem(keyViewed) === "1");
    setBookmarked(localStorage.getItem(keyBook) === "1");
  }, [keyViewed, keyBook]);

  function markViewed() {
    localStorage.setItem(keyViewed, "1");
    setViewed(true);
    onClick?.(article.id);
    router.push(`/news/${article.id}`);
  }

  function toggleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    localStorage.setItem(keyBook, next ? "1" : "0");
  }

  function share(e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: article.title, url: `/news/${article.id}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(location.origin + `/news/${article.id}`);
    }
  }

  return (
    <article
      onClick={markViewed}
      className="group cursor-pointer select-none"
    >
      <div className={`relative overflow-hidden rounded-sm border border-zinc-200 dark:border-zinc-800`}>        
        <Image
          src={article.image}
          alt={article.title}
          width={800}
          height={500}
          className={`${trendingColor ? "" : "grayscale"} group-hover:grayscale-0 w-full h-auto object-cover transition duration-200`}
          loading="lazy"
        />

        {/* Hover actions */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <button
              onClick={toggleBookmark}
              aria-label="Bookmark"
              className={`h-8 w-8 rounded-full bg-white/80 dark:bg-black/60 border border-zinc-200 dark:border-zinc-700 grid place-items-center text-xs ${bookmarked ? "font-bold" : ""}`}
            >
              {bookmarked ? "★" : "☆"}
            </button>
            <button
              onClick={share}
              aria-label="Share"
              className="h-8 w-8 rounded-full bg-white/80 dark:bg-black/60 border border-zinc-200 dark:border-zinc-700 grid place-items-center text-xs"
            >
              ↗
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <span className="mt-1 text-zinc-500">{viewed ? "📖" : "📕"}</span>
        <div className="min-w-0">
          <h3 className="font-extrabold uppercase tracking-tight text-zinc-950 dark:text-zinc-50 text-lg group-hover:scale-[1.03] transition-transform origin-left">
            {article.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {article.content}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{timeAgo(article.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
