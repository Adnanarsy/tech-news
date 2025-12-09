import { getArticleRepository } from "@/lib/articles/repository";

export async function GET() {
  const repo = getArticleRepository();
  const { items } = await repo.trending();
  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
