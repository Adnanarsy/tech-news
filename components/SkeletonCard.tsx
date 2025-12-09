export default function SkeletonCard({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div className={`animate-pulse`}> 
      <div className={`rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 ${size === "lg" ? "h-56" : "h-40"}`}></div>
      <div className="mt-3 flex items-start gap-2">
        <div className="mt-1 h-4 w-4 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="w-full">
          <div className={`h-4 bg-zinc-100 dark:bg-zinc-900 rounded ${size === "lg" ? "w-3/4" : "w-2/3"}`} />
          <div className="mt-2 h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-full" />
          <div className="mt-2 h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
