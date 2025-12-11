import { NextRequest, NextResponse } from "next/server";
import { newsContainer } from "@/lib/azure/cosmos";
import type { NewsPost } from "@/types/domain";

// GET /api/news/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const container = await newsContainer();
  try {
    const { resource } = await container.item(id, `news#${id}`).read<NewsPost>();
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(resource);
  } catch (e) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
