import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { usersContainer } from "@/lib/azure/cosmos";
import { UserRoleUpdateSchema } from "@/lib/validation/users";
import { forbidden, jsonError, notFound } from "@/lib/http/errors";

type UserLite = {
  id: string;
  email: string;
  name?: string;
  role: "reader" | "trainer" | "admin" | string;
  updatedAt?: string;
  updatedBy?: string;
};

function isAdmin(role?: string) {
  return role === "admin";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const container = await usersContainer();
  const { resources } = await container.items
    .query<UserLite>({
      query: "SELECT c.id, c.email, c.name, c.role, c.updatedAt, c.updatedBy FROM c WHERE c.type = 'user'",
    })
    .fetchAll();
  return Response.json({ items: resources || [] });
}

// PATCH /api/admin/users?id=...  body: { role }
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  const adminId = (token as any)?.uid as string | undefined;
  if (!isAdmin(role)) return forbidden();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);

  const body = await req.json().catch(() => null);
  const parsed = UserRoleUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error, 400);

  const container = await usersContainer();
  // Read existing user document
  const { resource: existing } = await container.item(id, undefined).read<any>();
  if (!existing || existing.type !== "user") return notFound();
  const updated = {
    ...existing,
    role: parsed.data.role,
    updatedAt: new Date().toISOString(),
    updatedBy: adminId ?? "system",
  };
  const { resource } = await container.items.upsert(updated);
  const lite: UserLite = {
    id: resource.id,
    email: resource.email,
    name: resource.name,
    role: resource.role,
    updatedAt: resource.updatedAt,
    updatedBy: resource.updatedBy,
  };
  return Response.json(lite);
}
