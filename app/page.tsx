"use client";
import { useEffect, useRef, useState } from "react";
import ArticleGrid from "@/components/ArticleGrid";
import DeepDivesGrid from "@/components/DeepDivesGrid";
import TrendingCarousel from "@/components/TrendingCarousel";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import SkeletonCard from "@/components/SkeletonCard";
import type { Article } from "@/types/article";

type FeedState = { items: Article[]; cursor: string | null };

export default function Home() {
  // Columns: Trending (carousel) + Latest, Deep Dives (2-col), Analysis
  const [trending, setTrending] = useState<Article[]>([]);
  const [latest, setLatest] = useState<FeedState>({ items: [], cursor: null });
  const [deep, setDeep] = useState<FeedState>({ items: [], cursor: null });
  const [analysis, setAnalysis] = useState<FeedState>({ items: [], cursor: null });

  const [hasMoreLatest, setHasMoreLatest] = useState(true);
  const [hasMoreDeep, setHasMoreDeep] = useState(true);
  const [hasMoreAnalysis, setHasMoreAnalysis] = useState(true);

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Error states for baseline hardening
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const trendingRef = useRef<HTMLDivElement | null>(null);
  const deepRef = useRef<HTMLElement | null>(null);
  const analysisRef = useRef<HTMLElement | null>(null);
  const [trendingInView, setTrendingInView] = useState(true);
  const [deepInView, setDeepInView] = useState(false);
  const [analysisInView, setAnalysisInView] = useState(false);

  useEffect(() => {
    // initial fetches
    fetch("/api/articles/trending")
      .then((r) => {
        if (!r.ok) throw new Error(`Trending failed: ${r.status}`);
        return r.json();
      })
      .then((d) => setTrending(d.items))
      .catch((e) => {
        setTrending([]);
        setTrendingError(e?.message || "Failed to load trending");
      })
      .finally(() => setLoadingTrending(false));
    loadMoreLatest();
    loadMoreDeep();
    loadMoreAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore(
    category: "latest" | "deep" | "analysis",
    set: (s: FeedState) => void,
    setHasMore: (b: boolean) => void,
    current: FeedState
  ) {
    if (!setHasMore) return;
    if (category === "deep" && (!hasMoreDeep || loadingDeep)) return;
    if (category === "analysis" && (!hasMoreAnalysis || loadingAnalysis)) return;
    if (category === "latest" && (!hasMoreLatest || loadingLatest)) return;

    // Build URL
    const params = new URLSearchParams({ limit: "9" });
    if (category !== "latest") params.set("category", category);
    if (current.cursor) params.set("cursor", current.cursor);
    const base = category === "latest" ? "/api/articles/latest" : "/api/articles";
    const url = `${base}?${params.toString()}`;

    // set in-flight flag
    category === "deep" && setLoadingDeep(true);
    category === "analysis" && setLoadingAnalysis(true);
    category === "latest" && setLoadingLatest(true);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${category} failed: ${res.status}`);
      const data = await res.json();
      const items = [...current.items, ...data.items];
      set({ items, cursor: data.nextCursor });
      setHasMore(Boolean(data.nextCursor));
      // clear prior error on success
      if (category === "latest") setLatestError(null);
      if (category === "deep") setDeepError(null);
      if (category === "analysis") setAnalysisError(null);
    } catch (e: any) {
      // Stop further loading attempts and surface minimal error
      setHasMore(false);
      const msg = e?.message || "Failed to load";
      if (category === "latest") setLatestError(msg);
      if (category === "deep") setDeepError(msg);
      if (category === "analysis") setAnalysisError(msg);
    }

    // unset in-flight flag
    category === "deep" && setLoadingDeep(false);
    category === "analysis" && setLoadingAnalysis(false);
    category === "latest" && setLoadingLatest(false);
  }

  const loadMoreLatest = () => loadMore("latest", setLatest, setHasMoreLatest, latest);
  const loadMoreDeep = () => loadMore("deep", setDeep, setHasMoreDeep, deep);
  const loadMoreAnalysis = () => loadMore("analysis", setAnalysis, setHasMoreAnalysis, analysis);

  // Observe trending container visibility to flip section title
  useEffect(() => {
    const el = trendingRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        setTrendingInView(vis);
      },
      { rootMargin: "0px 0px -80% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Observe Deep Dives and Analysis to highlight active section in header
  useEffect(() => {
    const targets: { el: Element | null; set: (v: boolean) => void }[] = [
      { el: deepRef.current, set: setDeepInView },
      { el: analysisRef.current, set: setAnalysisInView },
    ];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === deepRef.current) setDeepInView(e.isIntersecting);
          if (e.target === analysisRef.current) setAnalysisInView(e.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach(({ el }) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Fixed section titles bar below navbar */}
      <div className="fixed top-16 inset-x-0 z-40" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="grid grid-cols-1 md:[grid-template-columns:30%_40%_30%] gap-0 h-12 items-center text-xs font-bold tracking-wide uppercase" role="tablist" aria-label="Homepage sections">
            <div
              id="section-label-col1"
              aria-live="polite"
              role="tab"
              aria-current={!deepInView && !analysisInView ? "true" : undefined}
              className={`${!deepInView && !analysisInView ? "text-[color:var(--foreground)]" : "text-zinc-500"}`}
            >
              {trendingInView ? "Trending Stories" : "Latest News"}
            </div>
            <div
              id="section-label-col2"
              role="tab"
              aria-current={deepInView ? "true" : undefined}
              className={`md:border-l md:pl-6 ${deepInView ? "text-[color:var(--foreground)]" : "text-zinc-500"}`}
              style={{ borderColor: "var(--divider-color)" }}
            >
              Deep Dives
            </div>
            <div
              id="section-label-col3"
              role="tab"
              aria-current={analysisInView ? "true" : undefined}
              className={`md:border-l md:pl-6 ${analysisInView ? "text-[color:var(--foreground)]" : "text-zinc-500"}`}
              style={{ borderColor: "var(--divider-color)" }}
            >
              Latest Analysis
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:[grid-template-columns:30%_40%_30%] gap-0">
        {/* First column: Trending (carousel), then Latest (infinite). Title swaps to Latest when Trending leaves viewport */}
      <section className="pr-6" role="region" aria-labelledby="section-label-col1">
        <h2 className="sr-only">{trendingInView ? "Trending Stories" : "Latest News"}</h2>
        <div ref={trendingRef}>
          {loadingTrending ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="min-w-[300px] max-w-[300px]">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : (
            <TrendingCarousel items={trending} />
          )}
        </div>

        {/* Latest feed below trending, monochrome, infinite scroll, no time */}
        <div className="mt-6">
          <InfiniteScrollContainer onLoadMore={loadMoreLatest} hasMore={hasMoreLatest}>
            {latest.items.length === 0 && loadingLatest ? (
              <div className="grid grid-cols-1 gap-6">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <ArticleGrid items={latest.items} hideTime sizes="(min-width: 768px) 30vw, 100vw" />
            )}
          </InfiniteScrollContainer>
        </div>
      </section>

      {/* Deep Dives with 2-column asymmetry and infinite scroll */}
      <section ref={deepRef} className="md:border-l md:pl-6 pr-6" style={{ borderColor: "var(--divider-color)" }} role="region" aria-labelledby="section-label-col2">
        <h2 className="sr-only">Deep Dives</h2>
        <InfiniteScrollContainer onLoadMore={loadMoreDeep} hasMore={hasMoreDeep}>
          {deep.items.length === 0 && loadingDeep ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard size="lg" />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <DeepDivesGrid items={deep.items} />
          )}
        </InfiniteScrollContainer>
      </section>

      {/* Latest Analysis with infinite scroll, fixed size */}
      <section ref={analysisRef} className="md:border-l md:pl-6 min-h-[600px]" style={{ borderColor: "var(--divider-color)" }} role="region" aria-labelledby="section-label-col3">
      <h2 className="sr-only">Latest Analysis</h2>
        <InfiniteScrollContainer onLoadMore={loadMoreAnalysis} hasMore={hasMoreAnalysis}>
          {analysis.items.length === 0 && loadingAnalysis ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <ArticleGrid items={analysis.items} overlay />
          )}
        </InfiniteScrollContainer>
      </section>
    </div>
    </>
  );
}
