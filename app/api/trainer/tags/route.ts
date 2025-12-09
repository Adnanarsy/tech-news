import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Tag } from "@/types/taxonomy";
import { TagCreateSchema, TagUpdateSchema } from "@/lib/validation/taxonomy";
import { forbidden, jsonError, notFound } from "@/lib/http/errors";
import { getTagsContainer } from "@/lib/azure/cosmos";

// In-memory tag store for prototype/demo
const DEFAULT_TAGS: Tag[] = [
  { id: "ID_01", index: 0, name: "AI", active: true },
  { id: "ID_02", index: 1, name: "Cybersecurity", active: true },
  { id: "ID_03", index: 2, name: "Gaming", active: true },
];

let TAGS: Tag[] = [...DEFAULT_TAGS];

function isTrainerOrAdmin(role?: string) {
  return role === "trainer" || role === "admin";
}

export async function GET() {
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getTagsContainer();
    const { resources } = await c.items.query<any>({
      query: "SELECT c.id, c.index, c.name, c.active FROM c WHERE c.type = 'tag' ORDER BY c.index ASC",
    }).fetchAll();
    return Response.json({ items: resources as Tag[] });
  }
  return Response.json({ items: TAGS });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = TagCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);
  const input = parsed.data;
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getTagsContainer();
    // Uniqueness checks
    const byId = await c.items.query<any>({
      query: "SELECT TOP 1 c.id FROM c WHERE c.type='tag' AND c.id=@id",
      parameters: [{ name: "@id", value: input.id }],
    }).fetchAll();
    if (byId.resources.length) return jsonError("Tag id already exists", 409);
    const byIndex = await c.items.query<any>({
      query: "SELECT TOP 1 c.id FROM c WHERE c.type='tag' AND c.index=@i",
      parameters: [{ name: "@i", value: input.index }],
    }).fetchAll();
    if (byIndex.resources.length) return jsonError("Tag index already in use", 409);
    const doc = { type: "tag", pk: "tag", id: input.id, index: input.index, name: input.name, active: input.active ?? true, updatedAt: new Date().toISOString() };
    await c.items.upsert(doc);
    const tag: Tag = { id: doc.id, index: doc.index, name: doc.name, active: doc.active };
    return Response.json(tag, { status: 201 });
  }
  // In-memory path
  if (TAGS.some((t) => t.id === input.id)) return jsonError("Tag id already exists", 409);
  if (TAGS.some((t) => t.index === input.index)) return jsonError("Tag index already in use", 409);
  const tag: Tag = { id: input.id, index: input.index, name: input.name, active: input.active ?? true };
  TAGS.push(tag);
  return Response.json(tag, { status: 201 });
}

// Utility for tests/dev to reset tags (not exposed by default)
export function __resetTags(data?: Tag[]) {
  TAGS = data ? [...data] : [...DEFAULT_TAGS];
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);
  const body = await req.json().catch(() => null);
  const parsed = TagUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);

  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getTagsContainer();
    const { resource } = await c.item(id, "tag").read<any>();
    if (!resource || resource.type !== "tag") return notFound();
    const updated = { ...resource, ...parsed.data, updatedAt: new Date().toISOString() };
    const { resource: saved } = await c.items.upsert(updated);
    const out: Tag = { id: saved.id, index: saved.index, name: saved.name, active: saved.active };
    return Response.json(out);
  }
  const idx = TAGS.findIndex((t) => t.id === id);
  if (idx === -1) return notFound();
  const current = TAGS[idx];
  const updated: Tag = { ...current, ...parsed.data };
  TAGS[idx] = updated;
  return Response.json(updated);
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isTrainerOrAdmin(role)) return forbidden();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);
  if ((process.env.TRAINER_BACKEND || "memory").toLowerCase() === "cosmos") {
    const c = await getTagsContainer();
    const { resource } = await c.item(id, "tag").read<any>();
    if (!resource || resource.type !== "tag") return notFound();
    resource.active = false;
    resource.updatedAt = new Date().toISOString();
    await c.items.upsert(resource);
    return Response.json({ ok: true });
  }
  const idx = TAGS.findIndex((t) => t.id === id);
  if (idx === -1) return notFound();
  TAGS[idx] = { ...TAGS[idx], active: false };
  return Response.json({ ok: true });
}
