import { describe, it, expect } from "vitest";
import { getArticleRepository } from "@/lib/articles/repository";

describe("Article repository (mock)", () => {
  it("list() returns paginated items with nextCursor stability", async () => {
    const repo = getArticleRepository();
    const page1 = await repo.list({ limit: 5 });
    expect(Array.isArray(page1.items)).toBe(true);
    expect(page1.items.length).toBe(5);
    expect(page1.nextCursor == null || typeof page1.nextCursor === "string").toBe(true);

    if (page1.nextCursor) {
      const page2 = await repo.list({ limit: 5, cursor: page1.nextCursor });
      expect(page2.items.length).toBe(5);
      // Ensure no overlap between page1 and page2 ids
      const ids1 = new Set(page1.items.map((i) => i.id));
      const overlap = page2.items.some((i) => ids1.has(i.id));
      expect(overlap).toBe(false);
    }
  });

  it("latest() returns items and respects limit", async () => {
    const repo = getArticleRepository();
    const data = await repo.latest({ limit: 7 });
    expect(data.items.length).toBe(7);
    expect(data.nextCursor == null || typeof data.nextCursor === "string").toBe(true);
  });

  it("trending() returns a reasonable number of items by default", async () => {
    const repo = getArticleRepository();
    const { items } = await repo.trending();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("search() returns at most the requested limit", async () => {
    const repo = getArticleRepository();
    const { items } = await repo.search({ q: "Sample", limit: 3 });
    expect(items.length).toBeLessThanOrEqual(3);
  });

  it("getById() returns an item or null", async () => {
    const repo = getArticleRepository();
    const one = await repo.getById("1");
    expect(one === null || typeof one?.id === "string").toBe(true);
    const missing = await repo.getById("9999");
    expect(missing === null || typeof missing?.id === "string").toBe(true);
  });
});
