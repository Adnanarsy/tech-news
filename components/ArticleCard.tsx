"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/time";
import type { Article } from "@/types/article";
import { PheEmitter } from "@/lib/phe/emitter";

interface Props {
  article: Article;
  trendingColor?: boolean; // if true, show color even without hover
  onClick?: (id: string) => void;
  hideTime?: boolean;
  size?: "md" | "lg"; // lg for deep dives featured
  aspect?: "landscape" | "portrait" | "square"; // dynamic aspect for Deep Dives
  sizes?: string; // next/image sizes attribute for responsive loading
  overlay?: boolean; // when true, render title/desc over the image (used in Analysis)
  tall?: boolean; // when true, use a taller aspect for hero/trending
}

export default function ArticleCard({ article, trendingColor, onClick, hideTime = false, size = "md", aspect, sizes, overlay = false, tall = false }: Props) {
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
    // Fire-and-forget homomorphic scoring event for "open"
    try {
      PheEmitter.emitOpen(article.id);
    } catch {}
    // Track click for trending
    fetch(`/api/articles/${article.id}/click`, { method: "POST" }).catch(() => {});
    localStorage.setItem(keyViewed, "1");
    setViewed(true);
    onClick?.(article.id);
    router.push(`/news/${article.id}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      markViewed();
    }
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

  const imageClasses = `${trendingColor ? "" : "grayscale"} group-hover:grayscale-0 w-full h-full object-cover transition duration-200`;
  const containerClasses = `group cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500`;
  const isPortrait = aspect === "portrait";
  // Aspect logic: allow a special tall variant (for Trending), else follow size/aspect
  const aspectClass = tall
    ? "aspect-[4/5]"
    : (size === "lg"
        ? "aspect-[16/9]"
        : isPortrait
        ? "aspect-[3/4]"
        : "aspect-[16/9]");
  // Keep image boxed by aspect ratio
  const imgWrapperClasses = `relative overflow-hidden ${aspectClass}`;

  return (
    <article
      role="link"
      aria-label={`Open article: ${article.title}`}
      tabIndex={0}
      onKeyDown={onKey}
      onClick={markViewed}
      className={containerClasses}
    >
      <div className={imgWrapperClasses}>        
        <Image
          src={article.image}
          alt={article.title}
          fill
          className={imageClasses}
          sizes={sizes || "(min-width: 768px) 33vw, 100vw"}
          loading="lazy"
          unoptimized={article.image.includes('blob.core.windows.net')}
        />

        {/* Overlay background bar (Analysis). We use a themed solid background and cap width so right side image remains visible. */}
        {/* Removed gradient; use theme background for clarity across light/dark. */}

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
      {/* Overlay text block rendered in normal flow (md+). Visual overlap of 20% of image height. */}
      {overlay && (
        <div className="hidden md:block relative text-[color:var(--foreground)]"
          /* width 80%, background theme, overlap amount depends on aspect */
          style={{ width: "80%", background: "var(--background)",
            // Compute negative margin based on image height by aspect:
            // 16/9 => imageH = 56.25% of width; 20% of that = 11.25%
            // 3/4  => imageH = 133.33% of width; 20% = 26.666%
            // 4/5  => imageH = 125% of width; 20% = 25%
            // default to 11.25%
            marginTop: tall ? "-25%" : (isPortrait ? "-26.6667%" : "-11.25%")
          }}
        >
          <div className="px-0 py-2 flex flex-col">
            <h3 className={`font-extrabold uppercase tracking-tight ${size === "lg" ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} leading-tight`}>
              {article.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {article.cardDesc || article.content}
            </p>
            {!hideTime && (
              <div className="mt-2 flex items-end justify-between text-xs text-zinc-500">
                <span>{timeAgo(article.createdAt)}</span>
                {/* Monochrome book icon that reflects viewed state */}
                <span aria-hidden="true" className="ml-3 text-current">
                  {viewed ? (
                    // Filled book
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2h9a3 3 0 0 1 3 3v14.5a.5.5 0 0 1-.79.407C15.69 18.82 14.1 18 12.5 18H6a2 2 0 0 0 0 4h12a1 1 0 1 0 0-2H6a0 0 0 0 1 0 0v-2h6.5c1.69 0 3.38.74 4.71 1.66.5.34 1.29-.02 1.29-.66V5a5 5 0 0 0-5-5H6a2 2 0 0 0-2 2v17a1 1 0 1 0 2 0V2z"/>
                    </svg>
                  ) : (
                    // Outline book
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/>
                    </svg>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-overlay text block (default; and visible on small screens for overlay variant) */}
      <div className={`mt-3 ${overlay ? "md:hidden" : ""}`}>
        <div className="w-full">
          <h3 className={`font-extrabold uppercase tracking-tight text-[color:var(--foreground)] ${size === "lg" ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} leading-tight group-hover:scale-[1.03] transition-transform origin-left`}>
            {article.title}
          </h3>
          <p className={`mt-1 text-sm text-zinc-600 dark:text-zinc-400 ${isPortrait ? "overflow-hidden" : "line-clamp-2"}`} style={isPortrait ? { maxHeight: "6.75rem" } : undefined}>
            {article.cardDesc || article.content}
          </p>
          {!hideTime && (
            <div className="mt-1 flex items-end justify-between text-xs text-zinc-500">
              <span>{timeAgo(article.createdAt)}</span>
              <span aria-hidden="true" className="ml-3 text-current">
                {viewed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2h9a3 3 0 0 1 3 3v14.5a.5.5 0 0 1-.79.407C15.69 18.82 14.1 18 12.5 18H6a2 2 0 0 0 0 4h12a1 1 0 1 0 0-2H6a0 0 0 0 1 0 0v-2h6.5c1.69 0 3.38.74 4.71 1.66.5.34 1.29-.02 1.29-.66V5a5 5 0 0 0-5-5H6a2 2 0 0 0-2 2v17a1 1 0 1 0 2 0V2z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/>
                  </svg>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
