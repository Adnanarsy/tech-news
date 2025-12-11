import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getArticleRepository } from "@/lib/articles/repository";
import { forbidden, jsonError } from "@/lib/http/errors";
import { articlesContainer } from "@/lib/azure/cosmos";

function isAdmin(role?: string) {
  return role === "admin";
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const { id } = await params;
  
  try {
    const container = await articlesContainer();
    await container.item(id, "article").delete();
    
    return Response.json({ ok: true, deleted: id });
  } catch (error: any) {
    if (error.code === 404) {
      return jsonError({ message: "Article not found" }, 404);
    }
    console.error("[Admin Articles] Delete error:", error);
    return jsonError({ message: `Failed to delete article: ${error.message || "Unknown error"}` }, 500);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const { id } = await params;
  const repo = getArticleRepository();
  const article = await repo.getById(id);
  
  if (!article) {
    return jsonError({ message: "Article not found" }, 404);
  }
  
  return Response.json(article);
}

