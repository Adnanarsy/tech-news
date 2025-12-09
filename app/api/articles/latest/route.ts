import { NextRequest } from "next/server";
import { getArticleRepository } from "@/lib/articles/repository";

// Alias endpoint for latest articles across all categories, sorted by createdAt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 12);
  const repo = getArticleRepository();
  const data = await repo.latest({ cursor, limit });
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
