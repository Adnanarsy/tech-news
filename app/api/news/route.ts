import { NextRequest, NextResponse } from "next/server";
import { newsContainer } from "@/lib/azure/cosmos";
import { newId, nowIso } from "@/lib/utils";
import type { NewsPost } from "@/types/domain";

// GET /api/news?tag=ai
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");
  const container = await newsContainer();
  const query = tag
    ? {
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(c.tags, @tag) ORDER BY c.createdAt DESC",
        parameters: [{ name: "@tag", value: tag }],
      }
    : { query: "SELECT * FROM c WHERE c.type = 'news' ORDER BY c.createdAt DESC" };
  const { resources } = await container.items.query<NewsPost>(query).fetchAll();
  return NextResponse.json(resources);
}

// POST /api/news
// body: { title, content, imageUrls?, tags?, authorId }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = newId();
  const now = nowIso();
  const doc: NewsPost = {
    id,
    pk: `news#${id}`,
    type: "news",
    title: body.title,
    content: body.content,
    imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    authorId: body.authorId || "",
    createdAt: now,
    updatedAt: now,
  };
  const container = await newsContainer();
  const { resource } = await container.items.create(doc);
  return NextResponse.json(resource, { status: 201 });
}
