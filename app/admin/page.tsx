"use client";
import { useSession } from "next-auth/react";

export default function AdminHome() {
  const { data: session, status } = useSession();
  const role = (session as any)?.user?.role as string | undefined;
  if (status === "loading") return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as {session?.user?.email || "unknown"} ({role || "no-role"}).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/admin/articles" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Manage Articles</h2>
          <p className="text-sm opacity-70">View, edit, or delete existing articles.</p>
        </a>
        <a href="/admin/upload" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Create Article</h2>
          <p className="text-sm opacity-70">Upload a new article with title, image, body, and tags.</p>
        </a>
        <a href="/admin/users" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Users & Roles</h2>
          <p className="text-sm opacity-70">Manage user roles: reader, trainer, admin.</p>
        </a>
        <a href="/admin/scoring" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Scoring Constants</h2>
          <p className="text-sm opacity-70">Adjust open/read/interested weights.</p>
        </a>
        <a href="/admin/crypto" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Crypto Params</h2>
          <p className="text-sm opacity-70">View public key metadata and service status.</p>
        </a>
      </div>
    </div>
  );
}
