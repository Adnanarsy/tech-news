"use client";
import { useEffect, useMemo, useState } from "react";
import type { Tag, Confidence } from "@/types/taxonomy";

type Scoring = { open: number; read: number; interested: number };

export default function TrainerSimulatePage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [config, setConfig] = useState<Scoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, Confidence>>({});
  const [events, setEvents] = useState<{ open: boolean; read: boolean; interested: boolean }>({ open: true, read: true, interested: false });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [tRes, cRes] = await Promise.all([
          fetch("/api/trainer/tags", { cache: "no-store" }),
          fetch("/api/admin/config", { cache: "no-store" }),
        ]);
        if (!tRes.ok) throw new Error(`Tags load failed (${tRes.status})`);
        if (!cRes.ok) throw new Error(`Config load failed (${cRes.status})`);
        const t = await tRes.json();
        const c = await cRes.json();
        setTags((t.items as Tag[]).slice().sort((a, b) => a.index - b.index));
        setConfig(c as Scoring);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const baseK = useMemo(() => {
    if (!config) return 0;
    let k = 0;
    if (events.open) k += config.open;
    if (events.read) k += config.read;
    if (events.interested) k += config.interested;
    return k;
  }, [config, events]);

  function confidenceMultiplier(c: Confidence): number {
    switch (c) {
      case "primary":
        return 2;
      case "related":
        return 1;
      case "mention":
      default:
        return 1;
    }
  }

  const rows = useMemo(() => {
    if (!config) return [] as { tag: Tag; k: number }[];
    return tags
      .filter((t) => selected[t.id])
      .map((t) => {
        const mult = confidenceMultiplier(selected[t.id]);
        return { tag: t, k: baseK * mult };
      });
  }, [tags, selected, baseK, config]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulate Impact</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Preview homomorphic updates (no decryption). Uses current scoring constants.</p>
      </div>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !config ? (
        <div className="text-sm opacity-70">No config.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="rounded-lg border">
            <div className="p-3 border-b text-sm font-medium">Events</div>
            <div className="p-3 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={events.open} onChange={(e) => setEvents((s) => ({ ...s, open: e.target.checked }))} />
                open (+{config.open})
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={events.read} onChange={(e) => setEvents((s) => ({ ...s, read: e.target.checked }))} />
                read (+{config.read})
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={events.interested} onChange={(e) => setEvents((s) => ({ ...s, interested: e.target.checked }))} />
                interested (+{config.interested})
              </label>
              <div className="mt-2 text-xs text-zinc-500">Base k = {baseK}</div>
            </div>
          </div>

          <div className="rounded-lg border md:col-span-2">
            <div className="p-3 border-b text-sm font-medium">Select Tags & Confidence</div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tags.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={!!selected[t.id]}
                        onChange={(e) =>
                          setSelected((s) => {
                            const next = { ...s } as Record<string, Confidence | undefined>;
                            if (e.target.checked) next[t.id] = (next[t.id] ?? "related") as Confidence;
                            else delete next[t.id];
                            return next as Record<string, Confidence>;
                          })
                        }
                      />
                      <span className="truncate"><span className="text-xs px-2 py-0.5 rounded-full border">#{t.index}</span> <code className="opacity-70">{t.id}</code> {t.name}</span>
                    </label>
                    <select
                      value={(selected[t.id] as string) || "related"}
                      onChange={(e) => setSelected((s) => ({ ...s, [t.id]: e.target.value as Confidence }))}
                      disabled={!selected[t.id]}
                      className="rounded border px-2 py-1 bg-transparent text-sm"
                    >
                      <option value="mention">mention</option>
                      <option value="related">related</option>
                      <option value="primary">primary</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="rounded border mt-3">
                <div className="p-2 border-b text-xs font-medium">Operation Log ({rows.length})</div>
                {rows.length === 0 ? (
                  <div className="p-3 text-sm opacity-70">Select at least one tag.</div>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--divider-color)" }}>
                    {rows.map(({ tag, k }) => (
                      <li key={tag.id} className="p-2 text-sm whitespace-pre-wrap">
                        <div>
                          Slot index #{tag.index} • {tag.id} • {tag.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          k = base({baseK}) × confidence({selected[tag.id]}) = {k}
                        </div>
                        <code className="block text-xs opacity-90">
                          E(v[{tag.index}]) * g^{"{"}{k}{"}"} mod n^2
                        </code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
