import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getArticleRepository } from "@/lib/articles/repository";
import { interestsContainer } from "@/lib/azure/cosmos";
import { getPheKeys } from "@/lib/security/phe";
import type { Article } from "@/types/article";

// Get user interests (decrypted) from Cosmos DB
async function getUserInterests(uid: string): Promise<Map<number, number>> {
  const container = await interestsContainer();
  const query = "SELECT * FROM c WHERE c.type = 'interest' AND c.uid = @uid";
  const { resources } = await container.items
    .query({
      query,
      parameters: [{ name: "@uid", value: uid }],
    })
    .fetchAll();

  const { privateKey } = await getPheKeys();
  if (!privateKey) {
    return new Map(); // Can't decrypt without private key
  }

  const interests = new Map<number, number>();
  for (const doc of resources) {
    if (doc.type === "interest" && doc.index !== undefined && doc.value) {
      try {
        // Value is stored as bigint string, convert to bigint and decrypt
        const ciphertext = BigInt(doc.value);
        const decrypted = privateKey.decrypt(ciphertext);
        interests.set(doc.index, Number(decrypted));
      } catch (error) {
        console.error(`[Personalized] Failed to decrypt interest for index ${doc.index}:`, error);
      }
    }
  }
  return interests;
}

// Get tag indices for an article
async function getArticleTagIndices(articleId: string): Promise<number[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const [labelsRes, tagsRes] = await Promise.all([
      fetch(`${baseUrl}/api/trainer/article-tags?articleId=${encodeURIComponent(articleId)}`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/trainer/tags`, { cache: "no-store" }),
    ]);
    if (!labelsRes.ok || !tagsRes.ok) return [];
    const { items: labels } = await labelsRes.json();
    const { items: tags } = await tagsRes.json();
    const indexById = new Map<string, number>(tags.map((t: any) => [t.id, t.index]));
    const set = new Set<number>();
    for (const l of labels as any[]) {
      const idx = indexById.get(l.tagId);
      if (typeof idx === "number") set.add(idx);
    }
    return Array.from(set.values());
  } catch {
    return [];
  }
}

// Compute relevance score for an article based on user interests
async function computeRelevanceScore(article: Article, userInterests: Map<number, number>): Promise<number> {
  if (userInterests.size === 0) return 0;
  
  const tagIndices = await getArticleTagIndices(article.id);
  if (tagIndices.length === 0) return 0;

  // Sum up interest scores for matching tags
  let score = 0;
  for (const index of tagIndices) {
    const interest = userInterests.get(index);
    if (interest !== undefined) {
      score += interest;
    }
  }

  return score;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 12);
  const category = searchParams.get("category") || undefined;

  // Get user if authenticated
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const uid = token && (token as any).uid ? (token as any).uid as string : null;

  // Get articles
  const repo = getArticleRepository();
  const data = await repo.list({ cursor, limit: limit * 2, category: category as any }); // Get more to rank

  // If user is authenticated, rank by interests
  if (uid) {
    try {
      const userInterests = await getUserInterests(uid);
      
      if (userInterests.size > 0) {
        // Compute relevance scores for all articles
        const articlesWithScores = await Promise.all(
          data.items.map(async (article) => ({
            article,
            score: await computeRelevanceScore(article, userInterests),
          }))
        );

        // Sort by score (descending), then by createdAt (descending)
        // For latest news, prioritize recent articles even with low scores
        articlesWithScores.sort((a, b) => {
          // If scores are very close (within 10%), prioritize recency
          const scoreDiff = Math.abs(b.score - a.score);
          const avgScore = (a.score + b.score) / 2;
          if (avgScore > 0 && scoreDiff / avgScore < 0.1) {
            // Scores are close, sort by recency
            return new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime();
          }
          // Otherwise sort by score first
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime();
        });

        // Take top articles
        const rankedArticles = articlesWithScores.slice(0, limit).map((item) => item.article);
        
        // Determine next cursor
        const nextCursor = data.items.length > limit ? rankedArticles[rankedArticles.length - 1]?.id ?? null : null;

        return Response.json(
          { items: rankedArticles, nextCursor },
          { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } }
        );
      }
    } catch (error) {
      console.error("[Personalized Articles] Error computing relevance:", error);
      // Fall through to return unranked articles
    }
  }

  // Return unranked articles sorted by createdAt DESC (latest first)
  // data.items are already sorted by createdAt DESC from repository
  return Response.json(
    { items: data.items.slice(0, limit), nextCursor: data.nextCursor },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}

