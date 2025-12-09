import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { forbidden, jsonError } from "@/lib/http/errors";

// In-memory config store for dev. For production, persist to Cosmos `config` container.
type Scoring = { open: number; read: number; interested: number };
let SCORING: Scoring = { open: 1, read: 2, interested: 1 };

const ScoringSchema = z.object({
  open: z.number().int().min(0).max(10),
  read: z.number().int().min(0).max(10),
  interested: z.number().int().min(0).max(10),
});

function isAdmin(role?: string) {
  return role === "admin";
}

// GET available to trainers and admins for transparency
export async function GET() {
  return Response.json(SCORING, { headers: { "Cache-Control": "no-store" } });
}

// PUT admin-only
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();
  const body = await req.json().catch(() => null);
  const parsed = ScoringSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  SCORING = parsed.data;
  return Response.json(SCORING);
}
