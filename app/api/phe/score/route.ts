import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import * as paillier from "paillier-bigint";
import { getPublicKey } from "@/lib/phe/keys";
import { interestsContainer } from "@/lib/azure/cosmos";
import { jsonError, forbidden } from "@/lib/http/errors";
import { getScoring } from "@/lib/config/scoring";

const ItemSchema = z.object({
  articleId: z.string().min(1),
  events: z.object({ open: z.boolean().optional(), read: z.boolean().optional(), interested: z.boolean().optional() }),
  nonce: z.string().min(8).optional(),
  ts: z.number().optional(),
});
const BodySchema = z.union([
  ItemSchema,
  z.object({ batch: z.array(ItemSchema).min(1) }),
]);

type Replay = { resetAt: number };
const replays: Map<string, Replay> = new Map(); // key: uid:nonce

function checkReplay(uid: string, nonce?: string) {
  if (!nonce) return { ok: true };
  const key = `${uid}:${nonce}`;
  const now = Date.now();
  const r = replays.get(key);
  if (r && r.resetAt > now) return { ok: false };
  replays.set(key, { resetAt: now + 10 * 60 * 1000 }); // 10 min TTL
  return { ok: true };
}

async function resolveTagIndices(articleId: string): Promise<number[]> {
  // Fetch trainer labels and canonical tags; map tagId -> index
  try {
    const [labelsRes, tagsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/trainer/article-tags?articleId=${encodeURIComponent(articleId)}`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/trainer/tags`, { cache: "no-store" }),
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
    return Array.from(set.values()).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !(token as any).uid) return forbidden();
  const uid = (token as any).uid as string;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  const scoring = getScoring();
  const items: z.infer<typeof ItemSchema>[] = (parsed.data as any).batch ? (parsed.data as any).batch : [parsed.data as any];

  // Early replay check: ensure all nonces are fresh (if provided)
  for (const it of items) {
    if (!checkReplay(uid, it.nonce).ok) return jsonError("Duplicate nonce", 409);
  }

  const pub = await getPublicKey();
  const cont = await interestsContainer();
  let updatedTotal = 0;

  for (const input of items) {
    // Compute base k from admin scoring config
    let k = 0;
    if (input.events.open) k += scoring.open;
    if (input.events.read) k += scoring.read;
    if (input.events.interested) k += scoring.interested;
    if (k === 0) continue;

    const indices = await resolveTagIndices(input.articleId);
    if (indices.length === 0) continue;

    const ek = pub.encrypt(BigInt(k)); // E(k)
    for (const index of indices) {
      const id = `${uid}:${index}`;
      // read existing
      const { resource: existing } = await cont
        .item(id, `u:${uid}`)
        .read<any>()
        .catch(() => ({ resource: null } as any));
      let current: bigint;
      if (existing && existing.type === "interest") {
        current = BigInt(existing.value);
      } else {
        current = (pub as any).encrypt(0n) as bigint; // ensure type; paillier encrypt returns bigint
      }
      // c' = c * E(k)
      const next = (pub as any).addition
        ? (pub as any).addition(current, ek)
        : (current * (ek % (pub as any).n2)) % (pub as any).n2;
      const doc = {
        type: "interest",
        pk: `u:${uid}`,
        id,
        uid,
        index,
        value: next.toString(),
        updatedAt: new Date().toISOString(),
      };
      await cont.items.upsert(doc);
      updatedTotal++;
    }
  }

  return Response.json({ ok: true, updated: updatedTotal });
}
