import { getArticleRepository } from "@/lib/articles/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getArticleRepository();
  const item = await repo.getById(id);
  if (!item) return new Response("Not found", { status: 404 });
  return Response.json(item, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
