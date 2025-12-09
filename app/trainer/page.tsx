"use client";
import { useSession } from "next-auth/react";

export default function TrainerHome() {
  const { data: session, status } = useSession();
  const role = (session as any)?.user?.role as string | undefined;
  if (status === "loading") return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Trainer Workspace</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as {session?.user?.email || "unknown"} ({role || "no-role"}).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/trainer/tags" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Ontology (Tags)</h2>
          <p className="text-sm opacity-70">Manage canonical tags and indices.</p>
        </a>
        <a href="/trainer/articles" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Article Labeling</h2>
          <p className="text-sm opacity-70">Assign tags and relevance to articles.</p>
        </a>
        <a href="/trainer/simulate" className="block border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <h2 className="font-semibold">Simulate Impact</h2>
          <p className="text-sm opacity-70">Preview homomorphic scoring operations.</p>
        </a>
      </div>
    </div>
  );
}
