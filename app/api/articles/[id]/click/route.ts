import { NextRequest } from "next/server";
import { articlesContainer } from "@/lib/azure/cosmos";
import { getArticleRepository } from "@/lib/articles/repository";

// Track article click/view
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const container = await articlesContainer();
    const repo = getArticleRepository();
    
    // Get the article
    const article = await repo.getById(id);
    if (!article) {
      return new Response("Article not found", { status: 404 });
    }
    
    // Update click count in article document
    try {
      const { resource: doc } = await container.item(id, "article").read();
      if (doc) {
        const currentClicks = doc.clickCount || 0;
        await container.item(id, "article").replace({
          ...doc,
          clickCount: currentClicks + 1,
          lastClickedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      // If article doesn't have clickCount yet, add it
      if (error.code === 404) {
        // Article should exist, but handle gracefully
        console.warn(`[Click Tracking] Article ${id} not found in container`);
      } else {
        console.error(`[Click Tracking] Error updating clicks for ${id}:`, error);
      }
    }
    
    return Response.json({ ok: true });
  } catch (error: any) {
    console.error(`[Click Tracking] Error:`, error);
    // Don't fail the request if tracking fails
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

