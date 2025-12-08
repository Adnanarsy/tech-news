import { NextRequest } from "next/server";
import { getPage } from "@/app/api/articles/data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 12);
  const category = searchParams.get("category") || undefined;
  const data = getPage(cursor, limit, category as any);
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
