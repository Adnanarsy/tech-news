import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { forbidden } from "@/lib/http/errors";
import { getArticleTagsContainer } from "@/lib/azure/cosmos";

function isTrainerOrAdmin(role?: string) {
  return role === "trainer" || role === "admin";
}

// GET /api/trainer/article-tags/history?articleId=123
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();

  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  if (!articleId) return Response.json({ items: [] });

  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getArticleTagsContainer();
    const { resources } = await c.items
      .query<any>({
        query:
          "SELECT c.id, c.articleId, c.articleTagId, c.action, c.tagId, c.confidence, c.changedBy, c.changedAt FROM c WHERE c.type='articleTagHistory' AND c.articleId=@aid ORDER BY c.changedAt DESC",
        parameters: [{ name: "@aid", value: articleId }],
      })
      .fetchAll();
    return Response.json({ items: resources || [] });
  }

  return Response.json({ items: [] });
}

