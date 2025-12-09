"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Scoring = { open: number; read: number; interested: number };

export default function AdminScoringPage() {
  const { data: session, status } = useSession();
  const [scoring, setScoring] = useState<Scoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Scoring>({ open: 1, read: 2, interested: 1 });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/config", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = (await res.json()) as Scoring;
      setScoring(data);
      setFormData(data);
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

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : `Save failed (${res.status})`);
      }
      const updated = (await res.json()) as Scoring;
      setScoring(updated);
      setFormData(updated);
      alert("Scoring constants updated successfully");
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Scoring Constants</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Adjust the weights for user interaction events. These values are used to compute interest scores via homomorphic encryption.
      </p>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="rounded-lg border">
          <div className="p-3 border-b text-sm font-medium">Current Values</div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1">Open Event Weight</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.open}
                  onChange={(e) => setFormData({ ...formData, open: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border px-2 py-1 bg-transparent"
                />
                <p className="text-xs text-zinc-500 mt-1">Points when user opens an article</p>
              </div>
              <div>
                <label className="block text-xs mb-1">Read Event Weight</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.read}
                  onChange={(e) => setFormData({ ...formData, read: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border px-2 py-1 bg-transparent"
                />
                <p className="text-xs text-zinc-500 mt-1">Points when user reads an article (time + scroll)</p>
              </div>
              <div>
                <label className="block text-xs mb-1">Interested Event Weight</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.interested}
                  onChange={(e) => setFormData({ ...formData, interested: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border px-2 py-1 bg-transparent"
                />
                <p className="text-xs text-zinc-500 mt-1">Points when user clicks "Interested"</p>
              </div>
            </div>
            <div className="pt-2 border-t" style={{ borderColor: "var(--divider-color)" }}>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="opacity-70">Total base score (all events): </span>
                  <span className="font-semibold">{formData.open + formData.read + formData.interested}</span>
                </div>
                <button
                  onClick={save}
                  disabled={saving || JSON.stringify(formData) === JSON.stringify(scoring)}
                  className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

