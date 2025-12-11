import type { Article, Paginated } from "@/types/article";
import { getById as getMockById, ARTICLES } from "@/app/api/articles/data";
import { listCreated, getCreatedById } from "@/lib/articles/created_store";

// Optional Cosmos implementation (stub) lives in a separate module to avoid
// importing Azure SDKs in environments that don't need them.
// We lazy-require it only when ARTICLES_BACKEND=cosmos.

export interface IArticleRepository {
  list(params: { category?: "trending" | "deep" | "analysis"; cursor?: string | null; limit?: number }): Promise<Paginated<Article>>;
  latest(params: { cursor?: string | null; limit?: number }): Promise<Paginated<Article>>;
  trending(params?: { limit?: number }): Promise<{ items: Article[] }>;
  search(params: { q: string; limit?: number }): Promise<{ items: Article[] }>;
  getById(id: string): Promise<Article | null>;
  save(article: Article): Promise<Article>;
}

class MockArticleRepository implements IArticleRepository {
  private merged(category?: "trending" | "deep" | "analysis") {
    const created = listCreated();
    const base = category ? ARTICLES.filter((a) => a.category === category) : ARTICLES;
    // Merge created (already newest) with base; sort by createdAt desc to ensure deterministic order
    const combined = [...created, ...base].sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
    return combined;
  }

  async list(params: { category?: "trending" | "deep" | "analysis"; cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    const { category, cursor, limit = 12 } = params || {};
    const source = this.merged(category);
    const start = cursor ? source.findIndex((a) => a.id === cursor) + 1 : 0;
    const slice = source.slice(start, start + limit);
    const nextCursor = start + limit < source.length ? slice[slice.length - 1]?.id ?? null : null;
    return { items: slice, nextCursor };
  }

  async latest(params: { cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    const { cursor, limit = 12 } = params || {};
    const source = this.merged();
    const start = cursor ? source.findIndex((a) => a.id === cursor) + 1 : 0;
    const slice = source.slice(start, start + limit);
    const nextCursor = start + limit < source.length ? slice[slice.length - 1]?.id ?? null : null;
    return { items: slice, nextCursor };
  }

  async trending(params?: { limit?: number }): Promise<{ items: Article[] }> {
    const limit = params?.limit ?? 6;
    const items = this.merged("trending").slice(0, limit);
    return { items };
  }

  async search(params: { q: string; limit?: number }): Promise<{ items: Article[] }> {
    const { q, limit = 12 } = params;
    const s = q.toLowerCase();
    const items = this.merged().filter((a) => a.title.toLowerCase().includes(s)).slice(0, limit);
    return { items };
  }

  async getById(id: string): Promise<Article | null> {
    return getCreatedById(id) || getMockById(id);
  }

  async save(article: Article): Promise<Article> {
    // For mock, add to created store with existing ID
    const { addCreatedArticle } = await import("@/lib/articles/created_store");
    addCreatedArticle(
      {
        title: article.title,
        description: article.cardDesc,
        category: article.category,
        author: article.author,
        imageUrl: article.image,
        body: article.content,
        tags: article.tags,
        orientation: article.orientation,
        status: "published",
      },
      article.id // Preserve the existing ID
    );
    return article;
  }
}

// Factory: Default to Cosmos DB for production, can override with ARTICLES_BACKEND env var
export function getArticleRepository(): IArticleRepository {
  // Default to cosmos, but allow override via env var (e.g., ARTICLES_BACKEND=mock for testing)
  const backend = (process.env.ARTICLES_BACKEND || "cosmos").toLowerCase();
  
  if (backend === "cosmos") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CosmosArticleRepository } = require("./repository_cosmos");
      return new CosmosArticleRepository();
    } catch (e) {
      // Fallback to mock if cosmos repo isn't available; log error for visibility.
      console.error("ARTICLES_BACKEND=cosmos, but CosmosArticleRepository is not available. Error:", e);
      console.warn("Falling back to mock repository. Set ARTICLES_BACKEND=mock explicitly if this is intended.");
      return new MockArticleRepository();
    }
  }
  
  // Explicitly use mock if ARTICLES_BACKEND=mock is set
  if (backend === "mock") {
    return new MockArticleRepository();
  }
  
  // Future: add `cms` implementation here.
  // Default fallback to cosmos (should not reach here if cosmos works)
  console.warn(`Unknown ARTICLES_BACKEND="${backend}", defaulting to cosmos`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CosmosArticleRepository } = require("./repository_cosmos");
    return new CosmosArticleRepository();
  } catch (e) {
    console.error("Failed to load CosmosArticleRepository, falling back to mock:", e);
    return new MockArticleRepository();
  }
}
