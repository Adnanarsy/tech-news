import { z } from "zod";

export const ArticleCategorySchema = z.enum(["trending", "deep", "analysis", "news", "opinion"]);

export const ArticleCreateSchema = z.object({
  title: z.string().min(4).max(180),
  description: z.string().min(10).max(500).optional(),
  category: z.union([ArticleCategorySchema, z.string().min(2).max(40)]),
  author: z.string().min(2).max(80).optional(),
  imageUrl: z.string().url(),
  body: z.string().min(20),
  tags: z.array(z.string().min(1)).max(32).optional().default([]),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  status: z.enum(["draft", "published"]).optional().default("published"),
});

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>;
