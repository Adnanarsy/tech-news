import type { Article } from "@/types/article";
import { v4 as uuid } from "uuid";

type CreateInput = {
  title: string;
  description?: string;
  category: string;
  author?: string;
  imageUrl: string;
  body: string;
  tags?: string[];
  orientation?: "portrait" | "landscape";
  status?: "draft" | "published";
};

let CREATED: Article[] = [];

export function listCreated(): Article[] {
  return CREATED.slice();
}

export function getCreatedById(id: string): Article | null {
  return CREATED.find((a) => a.id === id) || null;
}

export function addCreatedArticle(input: CreateInput, existingId?: string): Article {
  const now = new Date().toISOString();
  const id = existingId || `u-${uuid()}`;
  const article: Article = {
    id,
    title: input.title,
    image: input.imageUrl,
    content: input.body,
    category: input.category,
    createdAt: now,
    author: input.author,
    tags: input.tags ?? [],
    orientation: input.orientation,
    cardDesc: input.description,
  };
  // Only store if published (drafts can be added later if needed)
  if (input.status !== "draft") {
    // Check if article already exists (update instead of duplicate)
    const existingIndex = CREATED.findIndex((a) => a.id === id);
    if (existingIndex !== -1) {
      CREATED[existingIndex] = article;
    } else {
      CREATED.unshift(article);
    }
  }
  return article;
}

export function clearCreated() {
  CREATED = [];
}
