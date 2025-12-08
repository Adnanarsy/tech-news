import { NextRequest } from "next/server";
import { searchArticles } from "@/app/api/articles/data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const items = q ? searchArticles(q, 20) : [];
  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
}
