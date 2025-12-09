// CosmosArticleRepository (stub)
// This class satisfies IArticleRepository but throws a clear error until
// Cosmos DB is wired. It is lazy-required by getArticleRepository() when
// ARTICLES_BACKEND=cosmos, so it must export the class symbol.

import type { IArticleRepository } from "./repository";
import type { Article, Paginated } from "@/types/article";

export class CosmosArticleRepository implements IArticleRepository {
  private notConfigured(): never {
    throw new Error("Cosmos backend not configured yet. Implement repository_cosmos.ts with real queries, or set ARTICLES_BACKEND=mock.");
  }

  async list(_params: { category?: "trending" | "deep" | "analysis"; cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    this.notConfigured();
  }
  async latest(_params: { cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    this.notConfigured();
  }
  async trending(_params?: { limit?: number }): Promise<{ items: Article[] }> {
    this.notConfigured();
  }
  async search(_params: { q: string; limit?: number }): Promise<{ items: Article[] }> {
    this.notConfigured();
  }
  async getById(_id: string): Promise<Article | null> {
    this.notConfigured();
  }
}
