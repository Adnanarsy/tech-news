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
}

// Factory: later we can switch by env to Cosmos/CMS implementation
export function getArticleRepository(): IArticleRepository {
  const backend = (process.env.ARTICLES_BACKEND || "mock").toLowerCase();
  if (backend === "cosmos") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CosmosArticleRepository } = require("./repository_cosmos");
      return new CosmosArticleRepository();
    } catch (e) {
      // Fallback to mock if cosmos repo isn't available; log once for visibility.
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("ARTICLES_BACKEND=cosmos, but CosmosArticleRepository is not available. Falling back to mock.");
      }
      return new MockArticleRepository();
    }
  }
  // Future: add `cms` implementation here.
  return new MockArticleRepository();
}
