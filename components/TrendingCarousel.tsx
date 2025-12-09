"use client";
import { useMemo, useRef, useState } from "react";
import type { Article } from "@/types/article";
import ArticleCard from "./ArticleCard";

export default function TrendingCarousel({ items }: { items: Article[] }) {
  const slides = useMemo(() => items.slice(0, 5), [items]);
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const ptrStartX = useRef<number | null>(null);
  const ptrDeltaX = useRef(0);

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  function onPointerDown(e: React.PointerEvent) {
    ptrStartX.current = e.clientX;
    ptrDeltaX.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (ptrStartX.current == null) return;
    ptrDeltaX.current = e.clientX - ptrStartX.current;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (ptrStartX.current == null) return;
    const dx = ptrDeltaX.current;
    ptrStartX.current = null;
    ptrDeltaX.current = 0;
    const THRESH = 48; // px
    if (dx > THRESH) prev();
    else if (dx < -THRESH) next();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  }

  if (total === 0) return null;

  return (
    <div className="relative" role="region" aria-label="Trending carousel" onKeyDown={onKeyDown}>
      <div
        className="overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Single visible slide; container width adapts to parent */}
        <div className="w-full">
          <ArticleCard
            article={slides[index]}
            trendingColor
            size="lg"
            tall
            sizes="(min-width: 768px) 30vw, 100vw"
          />
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            aria-label="Previous trending"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-black/60 grid place-items-center hover:bg-white dark:hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            ◀
          </button>
          <button
            aria-label="Next trending"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-black/60 grid place-items-center hover:bg-white dark:hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            ▶
          </button>
        </>
      )}
      {total > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2" aria-hidden="true">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-zinc-700 dark:bg-zinc-200" : "bg-zinc-300 dark:bg-zinc-700"}`}
            />)
          )}
        </div>
      )}
    </div>
  );
}
