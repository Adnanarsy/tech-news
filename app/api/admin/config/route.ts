import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { forbidden, jsonError } from "@/lib/http/errors";
import { ScoringSchema, getScoring, setScoring } from "@/lib/config/scoring";

function isAdmin(role?: string) {
  return role === "admin";
}

// GET available to trainers and admins for transparency
export async function GET() {
  const scoring = await getScoring();
  return Response.json(scoring, { headers: { "Cache-Control": "no-store" } });
}

// PUT admin-only
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  const adminId = (token as any)?.uid as string | undefined;
  if (!isAdmin(role)) return forbidden();
  const body = await req.json().catch(() => null);
  const parsed = ScoringSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  await setScoring(parsed.data, adminId);
  const updated = await getScoring();
  return Response.json(updated);
}
