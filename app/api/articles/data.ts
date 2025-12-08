import { Article } from "@/types/article";

const lipsum =
  "The internet culture shifts with every breakthrough. Our analysis explores the why behind the headlines.";

const baseImages = [
  "https://images.unsplash.com/photo-1518779578993-ec3579fee39f",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1517433456452-f9633a875f6f",
  "https://images.unsplash.com/photo-1451186859696-371d9477be93",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
];

// Simple deterministic set so pagination is stable in dev
export const ARTICLES: Article[] = Array.from({ length: 60 }).map((_, i) => {
  const id = (i + 1).toString();
  const createdAt = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
  return {
    id,
    title: `Sample Tech Story ${i + 1}`,
    image: baseImages[i % baseImages.length],
    content: lipsum,
    category: i % 3 === 0 ? "trending" : i % 3 === 1 ? "deep" : "analysis",
    createdAt,
  };
});

export function getPage(cursor?: string | null, limit = 12, category?: "trending" | "deep" | "analysis") {
  const source = category ? ARTICLES.filter((a) => a.category === category) : ARTICLES;
  const startIndex = cursor ? source.findIndex((a) => a.id === cursor) + 1 : 0;
  const slice = source.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < source.length ? slice[slice.length - 1].id : null;
  return { items: slice, nextCursor };
}

export function getTrending(limit = 6) {
  return ARTICLES.filter((a) => a.category === "trending").slice(0, limit);
}

export function searchArticles(q: string, limit = 12) {
  const s = q.toLowerCase();
  return ARTICLES.filter((a) => a.title.toLowerCase().includes(s)).slice(0, limit);
}

export function getById(id: string) {
  return ARTICLES.find((a) => a.id === id) || null;
}
