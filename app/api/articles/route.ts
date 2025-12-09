import { NextRequest } from "next/server";
import { getArticleRepository } from "@/lib/articles/repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 12);
  const category = searchParams.get("category") || undefined;
  const repo = getArticleRepository();
  const data = await repo.list({ cursor, limit, category: category as any });
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
