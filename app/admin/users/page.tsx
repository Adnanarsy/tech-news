"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type UserItem = {
  id: string;
  email: string;
  name?: string;
  role: string;
  updatedAt?: string;
  updatedBy?: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      setItems(data.items as UserItem[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "loading") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function changeRole(u: UserItem, role: string) {
    if (u.role === role) return;
    const prev = items.slice();
    setItems((arr) => arr.map((x) => (x.id === u.id ? { ...x, role } : x)));
    setSavingId(u.id);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(u.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Save failed (${res.status})`);
      }
      const updated = (await res.json()) as UserItem;
      setItems((arr) => arr.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      alert(e?.message || "Failed to update role");
      setItems(prev);
    } finally {
      setSavingId(null);
    }
  }

  const roleOptions = useMemo(() => ["reader", "trainer", "admin"], []);

  if (status === "loading") return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Users & Roles</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage user roles. Only admins can access this page.</p>
      <div className="rounded-lg border">
        <div className="p-3 border-b text-sm font-medium">Users</div>
        {loading ? (
          <div className="p-4 text-sm opacity-70">Loading…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm opacity-70">No users found.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--divider-color)" }}>
            {items.map((u) => (
              <div key={u.id} className="p-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{u.name || u.email || u.id}</div>
                  <div className="text-xs text-zinc-500 truncate">{u.email || u.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs opacity-70">Role</label>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    className="rounded border px-2 py-1 bg-transparent text-sm"
                    disabled={savingId === u.id}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-zinc-500 w-52 truncate text-right">
                  {u.updatedAt ? `Updated ${new Date(u.updatedAt).toLocaleString()}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
