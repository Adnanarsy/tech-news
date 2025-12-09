import { z } from "zod";

export const TagSchema = z.object({
  id: z.string().min(1).regex(/^ID_\d{2,}$/i, "id must look like ID_01"),
  index: z.number().int().min(0),
  name: z.string().min(2).max(64),
  active: z.boolean().default(true),
});

export const TagCreateSchema = z.object({
  id: TagSchema.shape.id,
  index: TagSchema.shape.index,
  name: TagSchema.shape.name,
  active: TagSchema.shape.active.optional(),
});

export const TagUpdateSchema = z.object({
  name: TagSchema.shape.name.optional(),
  active: TagSchema.shape.active.optional(),
});

export type TagCreateInput = z.infer<typeof TagCreateSchema>;
export type TagUpdateInput = z.infer<typeof TagUpdateSchema>;

export const ConfidenceSchema = z.enum(["mention", "related", "primary"]);

export const ArticleTagSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string().min(1),
  tagId: TagSchema.shape.id,
  confidence: ConfidenceSchema,
});

export const ArticleTagCreateSchema = z.object({
  articleId: z.string().min(1),
  tagId: TagSchema.shape.id,
  confidence: ConfidenceSchema,
});
