"use client";
import { useEffect, useMemo, useState } from "react";
import type { Tag } from "@/types/taxonomy";

type State = {
  items: Tag[];
  loading: boolean;
  error?: string;
};

export default function TrainerTagsPage() {
  const [state, setState] = useState<State>({ items: [], loading: true });
  const [form, setForm] = useState<{ id: string; index: string; name: string }>({ id: "", index: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const res = await fetch("/api/trainer/tags", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      setState({ items: data.items as Tag[], loading: false });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load" }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { id: form.id.trim(), index: Number(form.index), name: form.name.trim() };
      const res = await fetch("/api/trainer/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Create failed (${res.status})`);
      }
      setForm({ id: "", index: "", name: "" });
      await load();
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateName(id: string, name: string) {
    const res = await fetch(`/api/trainer/tags?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ? JSON.stringify(err.error) : `Update failed (${res.status})`);
    } else {
      await load();
    }
  }

  async function toggleActive(tag: Tag) {
    const res = await fetch(`/api/trainer/tags?id=${encodeURIComponent(tag.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !tag.active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ? JSON.stringify(err.error) : `Update failed (${res.status})`);
    } else {
      await load();
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this tag? It will remain reserved for its index.")) return;
    const res = await fetch(`/api/trainer/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ? JSON.stringify(err.error) : `Deactivate failed (${res.status})`);
    } else {
      await load();
    }
  }

  const sorted = useMemo(() => state.items.slice().sort((a, b) => a.index - b.index), [state.items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ontology (Tags)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage canonical tags with stable indices. Indices are immutable.</p>
      </div>

      {/* Create */}
      <form onSubmit={createTag} className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs mb-1">Id (e.g., ID_04)</label>
          <input
            required
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="ID_04"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Index (0-based)</label>
          <input
            required
            type="number"
            min={0}
            value={form.index}
            onChange={(e) => setForm((f) => ({ ...f, index: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="3"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Cybersecurity"
          />
        </div>
        <div className="md:col-span-4">
          <button
            disabled={submitting}
            className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            type="submit"
          >
            {submitting ? "Creating..." : "Create Tag"}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-lg border">
        <div className="p-3 border-b text-sm font-medium">Existing Tags</div>
        {state.loading ? (
          <div className="p-4 text-sm opacity-70">Loading…</div>
        ) : state.error ? (
          <div className="p-4 text-sm text-red-600">{state.error}</div>
        ) : (
          <ul>
            {sorted.map((t) => (
              <li key={t.id} className="p-3 border-t first:border-t-0 flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full border">#{t.index}</span>
                <code className="text-xs opacity-70">{t.id}</code>
                <input
                  className="ml-3 flex-1 min-w-0 rounded border px-2 py-1 bg-transparent"
                  value={t.name}
                  onChange={(e) => updateName(t.id, e.target.value)}
                />
                <button
                  onClick={() => toggleActive(t)}
                  className={`h-8 rounded-full border px-3 text-sm ${t.active ? "border-emerald-400" : "border-zinc-400 opacity-70"}`}
                  title="Toggle active"
                >
                  {t.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => deactivate(t.id)}
                  className="h-8 rounded-full border px-3 text-sm border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Deactivate"
                >
                  Deactivate
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
