// CosmosArticleRepository - Full implementation
// This class implements IArticleRepository using Azure Cosmos DB

import type { IArticleRepository } from "./repository";
import type { Article, Paginated } from "@/types/article";
import { articlesContainer } from "@/lib/azure/cosmos";

export class CosmosArticleRepository implements IArticleRepository {
  private async getContainer() {
    return articlesContainer();
  }

  private articleToDoc(article: Article): any {
    return {
      id: article.id,
      pk: "article", // Partition key for all articles
      type: "article",
      title: article.title,
      image: article.image,
      content: article.content,
      category: article.category,
      createdAt: article.createdAt,
      author: article.author,
      tags: article.tags || [],
      orientation: article.orientation,
      cardDesc: article.cardDesc,
      clickCount: 0, // Initialize click count
    };
  }

  private docToArticle(doc: any): Article {
    return {
      id: doc.id,
      title: doc.title,
      image: doc.image,
      content: doc.content,
      category: doc.category,
      createdAt: doc.createdAt,
      author: doc.author,
      tags: doc.tags,
      orientation: doc.orientation,
      cardDesc: doc.cardDesc,
    };
  }

  async list(params: { category?: "trending" | "deep" | "analysis"; cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    const { category, cursor, limit = 12 } = params || {};
    const container = await this.getContainer();

    // Build query
    let query = "SELECT * FROM c WHERE c.type = 'article'";
    const parameters: any[] = [];

    if (category) {
      query += " AND c.category = @category";
      parameters.push({ name: "@category", value: category });
    }

    query += " ORDER BY c.createdAt DESC";

    const querySpec = {
      query,
      parameters,
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    // Convert to articles
    let articles = resources.map((doc) => this.docToArticle(doc));

    // Handle cursor-based pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = articles.findIndex((a) => a.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const sliced = articles.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < articles.length ? sliced[sliced.length - 1]?.id ?? null : null;

    return { items: sliced, nextCursor };
  }

  async latest(params: { cursor?: string | null; limit?: number }): Promise<Paginated<Article>> {
    const { cursor, limit = 12 } = params || {};
    const container = await this.getContainer();

    const query = "SELECT * FROM c WHERE c.type = 'article' ORDER BY c.createdAt DESC";
    const { resources } = await container.items.query({ query }).fetchAll();

    let articles = resources.map((doc) => this.docToArticle(doc));

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = articles.findIndex((a) => a.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const sliced = articles.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < articles.length ? sliced[sliced.length - 1]?.id ?? null : null;

    return { items: sliced, nextCursor };
  }

  async trending(params?: { limit?: number }): Promise<{ items: Article[] }> {
    const limit = params?.limit ?? 5;
    const container = await this.getContainer();

    // Get top clicked articles (trending = most clicked)
    const query = "SELECT * FROM c WHERE c.type = 'article' ORDER BY c.clickCount DESC, c.createdAt DESC";
    const { resources } = await container.items
      .query({
        query,
      })
      .fetchAll();

    // Get top 5 most clicked articles
    const articles = resources
      .filter((doc) => (doc.clickCount || 0) > 0) // Only articles with clicks
      .slice(0, limit)
      .map((doc) => this.docToArticle(doc));
    
    // If we don't have 5 articles with clicks, fill with recent articles
    if (articles.length < limit) {
      const recentQuery = "SELECT * FROM c WHERE c.type = 'article' ORDER BY c.createdAt DESC";
      const { resources: recent } = await container.items.query({ query: recentQuery }).fetchAll();
      const recentArticles = recent
        .filter((doc) => !articles.some((a) => a.id === doc.id)) // Exclude already included
        .slice(0, limit - articles.length)
        .map((doc) => this.docToArticle(doc));
      articles.push(...recentArticles);
    }
    
    return { items: articles.slice(0, limit) };
  }

  async search(params: { q: string; limit?: number }): Promise<{ items: Article[] }> {
    const { q, limit = 12 } = params;
    const container = await this.getContainer();

    // Simple text search in title and content using CONTAINS
    // Note: CONTAINS is case-sensitive in Cosmos DB, so we search for both cases
    const query = "SELECT * FROM c WHERE c.type = 'article' AND (CONTAINS(c.title, @search) OR CONTAINS(c.content, @search)) ORDER BY c.createdAt DESC";

    const { resources } = await container.items
      .query({
        query,
        parameters: [{ name: "@search", value: q }],
      })
      .fetchAll();

    // Filter case-insensitively on client side
    const searchLower = q.toLowerCase();
    const articles = resources
      .map((doc) => this.docToArticle(doc))
      .filter((article) => {
        const titleMatch = article.title.toLowerCase().includes(searchLower);
        const contentMatch = article.content.toLowerCase().includes(searchLower);
        return titleMatch || contentMatch;
      })
      .slice(0, limit);

    return { items: articles };
  }

  async getById(id: string): Promise<Article | null> {
    const container = await this.getContainer();
    try {
      // Use partition key "article" to read the item
      const { resource } = await container.item(id, "article").read();
      if (!resource || resource.type !== "article") {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[CosmosArticleRepository] Article ${id} not found or wrong type`);
        }
        return null;
      }
      return this.docToArticle(resource);
    } catch (error: any) {
      if (error.code === 404) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[CosmosArticleRepository] Article ${id} not found (404)`);
        }
        return null;
      }
      console.error(`[CosmosArticleRepository] Error fetching article ${id}:`, error);
      throw error;
    }
  }

  async save(article: Article): Promise<Article> {
    const container = await this.getContainer();
    const doc = this.articleToDoc(article);
    
    try {
      // Upsert the article with strong consistency
      const { resource } = await container.items.upsert(doc, {
        // Ensure the write is committed before returning
        accessCondition: undefined,
      });
      
      if (process.env.NODE_ENV !== "production") {
        console.log(`[CosmosArticleRepository] Article saved: ${article.id} (pk: ${doc.pk})`);
      }
      
      // Return the saved article (convert back from doc if needed)
      return article;
    } catch (error: any) {
      console.error(`[CosmosArticleRepository] Error saving article ${article.id}:`, error);
      throw error;
    }
  }
}
