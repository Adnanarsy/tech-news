import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ArticleCreateSchema } from "@/lib/validation/articles";
import { addCreatedArticle, listCreated } from "@/lib/articles/created_store";
import { forbidden, jsonError } from "@/lib/http/errors";

function isAdmin(role?: string) {
  return role === "admin";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();
  const items = listCreated();
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = ArticleCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  const created = addCreatedArticle(parsed.data);
  return Response.json(created, { status: 201 });
}
