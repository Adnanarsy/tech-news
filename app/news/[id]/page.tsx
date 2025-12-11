import Image from "next/image";
import type { Article } from "@/types/article";
import type { Tag, ArticleTag } from "@/types/taxonomy";
import { timeAgo } from "@/lib/time";
import type { Metadata } from "next";
import { getArticleRepository } from "@/lib/articles/repository";

async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const repo = getArticleRepository();
    const article = await repo.getById(id);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[NewsDetail] Fetching article ID: ${id}`);
      if (!article) {
        console.warn(`[NewsDetail] Article ID ${id} not found in repository.`);
      }
    }
    return article;
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return null;
  }
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await fetchArticleById(id);
  if (!article) {
    return <div className="text-sm text-red-600">Article not found.</div>;
  }
  // Fetch trainer labels and canonical tags to show badges on the article page
  async function fetchBadges(): Promise<{ id: string; index: number; name: string }[]> {
    try {
      // Use absolute URL for server-side fetch
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const [lRes, tRes] = await Promise.all([
        fetch(`${baseUrl}/api/trainer/article-tags?articleId=${encodeURIComponent(article.id)}`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/trainer/tags`, { cache: "no-store" }),
      ]);
      if (!lRes.ok || !tRes.ok) {
        // Fallback to article.tags if API fails
        if (Array.isArray(article.tags) && article.tags.length > 0) {
          const tRes = await fetch(`${baseUrl}/api/trainer/tags`, { cache: "no-store" }).catch(() => null);
          if (tRes?.ok) {
            const t = await tRes.json();
            const tags = t.items as Tag[];
            const byId = new Map<string, Tag>(tags.map((x) => [x.id, x]));
            return article.tags
              .map((tid) => {
                const tag = byId.get(tid);
                return tag ? { id: tag.id, index: tag.index, name: tag.name } : null;
              })
              .filter((x): x is { id: string; index: number; name: string } => x !== null)
              .sort((a, b) => a.index - b.index);
          }
        }
        return [];
      }
      const l = (await lRes.json()).items as ArticleTag[];
      const t = (await tRes.json()).items as Tag[];
      const byId = new Map<string, Tag>(t.map((x) => [x.id, x]));
      const out: { id: string; index: number; name: string }[] = [];
      for (const lab of l) {
        const tag = byId.get(lab.tagId);
        if (tag) out.push({ id: tag.id, index: tag.index, name: tag.name });
      }
      // fallback: show article.tags if no trainer labels
      if (out.length === 0 && Array.isArray(article.tags)) {
        for (const tid of article.tags) {
          const tag = byId.get(tid);
          if (tag) out.push({ id: tag.id, index: tag.index, name: tag.name });
        }
      }
      return out.sort((a, b) => a.index - b.index);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
      return [];
    }
  }
  const badges = await fetchBadges();
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-extrabold uppercase tracking-tight">{article.title}</h1>
      <p className="mt-2 text-xs text-zinc-500">
        {article.author && <span>{article.author} — </span>}
        {timeAgo(article.createdAt)} — {article.category}
      </p>
      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.id} className="text-xs px-2 py-0.5 rounded-full border" title={`#${b.index} ${b.id}`}>
              #{b.index} {b.name}
            </span>
          ))}
        </div>
      )}
      {article.image && (
        <div className="relative w-full aspect-[16/9] my-6 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <Image 
            src={article.image} 
            alt={article.title} 
            fill 
            className="object-cover"
            unoptimized={article.image.includes('blob.core.windows.net')}
          />
        </div>
      )}
      {/* SEO: JSON-LD Article schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            datePublished: article.createdAt,
            image: article.image ? [article.image] : [],
          }),
        }}
      />
      <div className="prose prose-zinc dark:prose-invert">
        <p>{article.content}</p>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticleById(id);
  if (!article) return { title: 'Article not found' };
  const url = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL || '' : '';
  const canonical = `${url}/news/${article.id}`;
  return {
    title: article.title,
    description: article.content?.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description: article.content?.slice(0, 160),
      url: canonical,
      images: article.image ? [{ url: article.image }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.content?.slice(0, 160),
      images: article.image ? [article.image] : undefined,
    },
  };
}
