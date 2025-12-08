import { getTrending } from "@/app/api/articles/data";

export async function GET() {
  const items = getTrending(6);
  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
