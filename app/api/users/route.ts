import { NextRequest, NextResponse } from "next/server";
import { usersContainer } from "@/lib/azure/cosmos";
import { newId, nowIso } from "@/lib/utils";
import type { User } from "@/types/domain";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function GET() {
  const container = await usersContainer();
  const { resources } = await container.items
    .query<User>({ query: "SELECT * FROM c WHERE c.type = 'user' ORDER BY c.createdAt DESC" })
    .fetchAll();
  return NextResponse.json(resources);
}

// POST: create user { email, name, password, role }
export async function POST(req: NextRequest) {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(6),
    role: z.enum(["admin", "trainer", "user"]).default("user"),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { email, name, password, role } = parsed.data;
  const container = await usersContainer();
  // ensure unique email
  const { resources } = await container.items
    .query<User>({
      query: "SELECT TOP 1 c.id FROM c WHERE c.type = 'user' AND c.email = @e",
      parameters: [{ name: "@e", value: email }],
    })
    .fetchAll();
  if (resources.length) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  const id = newId();
  const now = nowIso();
  const passwordHash = await bcrypt.hash(password, 10);
  const doc: User = {
    id,
    pk: `user#${id}`,
    type: "user",
    email,
    name,
    passwordHash,
    role,
    createdAt: now,
    updatedAt: now,
  };
  const { resource } = await container.items.create(doc);
  // do not return passwordHash
  const { passwordHash: _, ...safe } = resource as any;
  return NextResponse.json(safe, { status: 201 });
}
