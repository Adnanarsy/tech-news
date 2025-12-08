import { getById } from "@/app/api/articles/data";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = getById(params.id);
  if (!item) return new Response("Not found", { status: 404 });
  return Response.json(item, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
