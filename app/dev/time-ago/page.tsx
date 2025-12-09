import { timeAgo } from "@/lib/time";

function isoOffset(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

const cases = [
  { label: "just now (<1 min)", iso: new Date().toISOString(), expectOneOf: ["just now"] },
  { label: "1 min ago", iso: isoOffset(1), expect: "1 min ago" },
  { label: "59 mins ago", iso: isoOffset(59), expect: "59 mins ago" },
  { label: "1 hour ago", iso: isoOffset(60), expect: "1 hour ago" },
  { label: "23 hours ago", iso: isoOffset(23 * 60), expect: "23 hours ago" },
  { label: "1 day ago", iso: isoOffset(24 * 60), expect: "1 day ago" },
];

export default function TimeAgoDev() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-3">
      <h1 className="text-xl font-bold">timeAgo checks</h1>
      <ul className="text-sm">
        {cases.map((c) => {
          const actual = timeAgo(c.iso);
          const ok = c.expect ? actual === c.expect : c.expectOneOf?.includes(actual);
          return (
            <li key={c.label} className="flex items-center gap-2">
              <span className="w-56 text-zinc-500">{c.label}</span>
              <code className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">{actual}</code>
              <span className={ok ? "text-emerald-600" : "text-red-600"}>{ok ? "PASS" : `FAIL${c.expect ? ` (expected ${c.expect})` : ""}`}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-zinc-500">This page is for quick manual verification; not part of production UI.</p>
    </div>
  );
}
