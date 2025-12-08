"use client";
import { useEffect, useRef } from "react";

interface Props {
  onLoadMore: () => void;
  hasMore: boolean;
  rootMargin?: string;
  children: React.ReactNode;
}

export default function InfiniteScrollContainer({ onLoadMore, hasMore, rootMargin = "600px", children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoadMore();
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, rootMargin]);

  return (
    <div>
      {children}
      <div ref={ref} />
    </div>
  );
}
