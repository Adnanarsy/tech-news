"use client";
import { useEffect, useMemo, useState } from "react";
import ArticleGrid from "@/components/ArticleGrid";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import type { Article } from "@/types/article";

type FeedState = { items: Article[]; cursor: string | null };

export default function Home() {
  // Three columns: trending, deep, analysis
  const [trending, setTrending] = useState<Article[]>([]);
  const [deep, setDeep] = useState<FeedState>({ items: [], cursor: null });
  const [analysis, setAnalysis] = useState<FeedState>({ items: [], cursor: null });
  const [hasMoreDeep, setHasMoreDeep] = useState(true);
  const [hasMoreAnalysis, setHasMoreAnalysis] = useState(true);

  useEffect(() => {
    // initial fetches
    fetch("/api/articles/trending").then((r) => r.json()).then((d) => setTrending(d.items));
    loadMoreDeep();
    loadMoreAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore(category: "deep" | "analysis", set: (s: FeedState) => void, setHasMore: (b: boolean) => void, current: FeedState) {
    if (!setHasMore || (category === "deep" && !hasMoreDeep) || (category === "analysis" && !hasMoreAnalysis)) return;
    const params = new URLSearchParams({ limit: "9", category });
    if (current.cursor) params.set("cursor", current.cursor);
    const res = await fetch(`/api/articles?${params.toString()}`);
    const data = await res.json();
    const items = [...current.items, ...data.items];
    set({ items, cursor: data.nextCursor });
    setHasMore(Boolean(data.nextCursor));
  }

  const loadMoreDeep = () => loadMore("deep", setDeep, setHasMoreDeep, deep);
  const loadMoreAnalysis = () => loadMore("analysis", setAnalysis, setHasMoreAnalysis, analysis);

  const [hero, restTrending] = useMemo(() => {
    if (!trending.length) return [undefined, [] as Article[]] as const;
    return [trending[0], trending.slice(1)] as const;
  }, [trending]);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Trending column with hero */}
      <section>
        <h2 className="mb-4 text-sm font-bold tracking-wide uppercase text-zinc-500">Trending Stories</h2>
        {hero && (
          <div className="mb-6">
            {/* Hero style: reuse ard with trendingColor */}
            {/* Slightly larger title by wrapping in a div with scale on hover from ArticleCard */}
            <ArticleGrid items={[hero]} trendingColor />
          </div>
        )}
        <ArticleGrid items={restTrending} trendingColor />
      </section>

      {/* Deep Dives with infinite scroll */}
      <section>
        <h2 className="mb-4 text-sm font-bold tracking-wide uppercase text-zinc-500">Deep Dives</h2>
        <InfiniteScrollContainer onLoadMore={loadMoreDeep} hasMore={hasMoreDeep}>
          <ArticleGrid items={deep.items} />
        </InfiniteScrollContainer>
      </section>

      {/* Latest Analysis with infinite scroll */}
      <section>
        <h2 className="mb-4 text-sm font-bold tracking-wide uppercase text-zinc-500">Latest Analysis</h2>
        <InfiniteScrollContainer onLoadMore={loadMoreAnalysis} hasMore={hasMoreAnalysis}>
          <ArticleGrid items={analysis.items} />
        </InfiniteScrollContainer>
      </section>
    </div>
  );
}
