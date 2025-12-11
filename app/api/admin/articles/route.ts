import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ArticleCreateSchema } from "@/lib/validation/articles";
import { getArticleRepository } from "@/lib/articles/repository";
import { forbidden, jsonError } from "@/lib/http/errors";
import { v4 as uuid } from "uuid";

function isAdmin(role?: string) {
  return role === "admin";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();
  
  // Use repository to get all articles (Cosmos DB in production)
  try {
    const repo = getArticleRepository();
    // Get a large batch of articles (admin view)
    const result = await repo.list({ limit: 1000 });
    return Response.json({ items: result.items });
  } catch (error: any) {
    console.error("[Admin Articles] Error fetching articles:", error);
    return jsonError({ message: `Failed to fetch articles: ${error.message || "Unknown error"}` }, 500);
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = ArticleCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);

  // Use repository to save (handles both mock and Cosmos)
  const repo = getArticleRepository();
  const now = new Date().toISOString();
  const articleId = `u-${uuid()}`;
  
  const article = {
    id: articleId,
    title: parsed.data.title,
    image: parsed.data.imageUrl,
    content: parsed.data.body,
    category: parsed.data.category,
    createdAt: now,
    author: parsed.data.author,
    tags: parsed.data.tags || [],
    orientation: parsed.data.orientation,
    cardDesc: parsed.data.description,
  };

  // Save via repository (Cosmos DB in production)
  try {
    const saved = await repo.save(article);
    console.log(`[Admin Articles] Article saved to repository: ${saved.id}`);
    
    // Verify the article was saved by reading it back (helps catch issues early)
    try {
      const verified = await repo.getById(saved.id);
      if (!verified) {
        console.warn(`[Admin Articles] Warning: Article ${saved.id} was saved but could not be retrieved immediately. This may be a Cosmos DB consistency issue.`);
      } else {
        console.log(`[Admin Articles] Article verified in repository: ${saved.id}`);
      }
    } catch (verifyError) {
      console.warn(`[Admin Articles] Could not verify article ${saved.id} after save:`, verifyError);
      // Continue anyway - the save might have succeeded but read might fail due to consistency
    }
    
    return Response.json(saved, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Articles] Save error:", error);
    // Don't fallback to mock - throw error so admin knows there's an issue
    return jsonError({ message: `Failed to save article: ${error.message || "Unknown error"}` }, 500);
  }
}
