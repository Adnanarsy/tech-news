import { NextRequest } from "next/server";
import { getArticleRepository } from "@/lib/articles/repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || 20);
  const repo = getArticleRepository();
  const { items } = q ? await repo.search({ q, limit }) : { items: [] };
  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
}
