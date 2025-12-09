import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { v4 as uuid } from "uuid";
import type { ArticleTag } from "@/types/taxonomy";
import { ArticleTagCreateSchema } from "@/lib/validation/taxonomy";
import { forbidden, jsonError, notFound } from "@/lib/http/errors";
import { getArticleTagsContainer } from "@/lib/azure/cosmos";

let ARTICLE_TAGS: ArticleTag[] = [];

function isTrainerOrAdmin(role?: string) {
  return role === "trainer" || role === "admin";
}

// GET /api/trainer/article-tags?articleId=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  if (!articleId) return Response.json({ items: [] });
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getArticleTagsContainer();
    const { resources } = await c.items
      .query<any>({
        query: "SELECT c.id, c.articleId, c.tagId, c.confidence FROM c WHERE c.type='articleTag' AND c.articleId=@aid",
        parameters: [{ name: "@aid", value: articleId }],
      })
      .fetchAll();
    return Response.json({ items: resources as ArticleTag[] });
  }
  const items = ARTICLE_TAGS.filter((t) => t.articleId === articleId);
  return Response.json({ items });
}

// POST body: { articleId, tagId, confidence }
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();
  const body = await req.json().catch(() => null);
  const parsed = ArticleTagCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  const input = parsed.data;
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getArticleTagsContainer();
    const trainerId = (token as any)?.uid as string | undefined;
    // Duplicate check
    const { resources: dup } = await c.items
      .query<any>({
        query: "SELECT TOP 1 c.id FROM c WHERE c.type='articleTag' AND c.articleId=@aid AND c.tagId=@tid",
        parameters: [
          { name: "@aid", value: input.articleId },
          { name: "@tid", value: input.tagId },
        ],
      })
      .fetchAll();
    if (dup.length) return jsonError("Tag already assigned to this article", 409);
    const doc = {
      type: "articleTag",
      pk: `a:${input.articleId}`,
      id: uuid(),
      articleId: input.articleId,
      tagId: input.tagId,
      confidence: input.confidence,
      updatedAt: new Date().toISOString(),
      createdBy: trainerId,
    };
    const { resource } = await c.items.upsert(doc);
    
    // Record history entry
    try {
      const historyDoc = {
        type: "articleTagHistory",
        pk: `a:${input.articleId}`,
        id: uuid(),
        articleId: input.articleId,
        articleTagId: resource.id,
        action: "created",
        tagId: input.tagId,
        confidence: input.confidence,
        changedBy: trainerId || "system",
        changedAt: new Date().toISOString(),
      };
      await c.items.upsert(historyDoc);
    } catch (histError) {
      // Don't fail the main operation if history recording fails
      console.warn("Failed to record article tag history:", histError);
    }
    
    const out: ArticleTag = { id: resource.id, articleId: resource.articleId, tagId: resource.tagId, confidence: resource.confidence };
    return Response.json(out, { status: 201 });
  }
  if (ARTICLE_TAGS.some((x) => x.articleId === input.articleId && x.tagId === input.tagId)) {
    return jsonError("Tag already assigned to this article", 409);
  }
  const item: ArticleTag = { id: uuid(), ...input };
  ARTICLE_TAGS.push(item);
  return Response.json(item, { status: 201 });
}

// DELETE /api/trainer/article-tags?id=uuid
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getArticleTagsContainer();
    const trainerId = (token as any)?.uid as string | undefined;
    const { resource } = await c.item(id, undefined).read<any>();
    if (!resource || resource.type !== "articleTag") return notFound();
    
    // Record history entry before deletion
    try {
      const historyDoc = {
        type: "articleTagHistory",
        pk: `a:${resource.articleId}`,
        id: uuid(),
        articleId: resource.articleId,
        articleTagId: resource.id,
        action: "deleted",
        tagId: resource.tagId,
        confidence: resource.confidence,
        changedBy: trainerId || "system",
        changedAt: new Date().toISOString(),
      };
      await c.items.upsert(historyDoc);
    } catch (histError) {
      // Don't fail the main operation if history recording fails
      console.warn("Failed to record article tag history:", histError);
    }
    
    await c.item(id, resource.pk).delete();
    return Response.json({ ok: true });
  }
  const before = ARTICLE_TAGS.length;
  ARTICLE_TAGS = ARTICLE_TAGS.filter((t) => t.id !== id);
  if (ARTICLE_TAGS.length === before) return notFound();
  return Response.json({ ok: true });
}

// test helper
export function __resetArticleTags(data?: ArticleTag[]) {
  ARTICLE_TAGS = data ? [...data] : [];
}
