"use client";
import { useEffect, useRef, useState } from "react";
import { PheEmitter } from "@/lib/phe/emitter";

export default function ArticleInteractions({ articleId }: { articleId: string }) {
  const [readEmitted, setReadEmitted] = useState(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    const READ_TIME_MS = Number(process.env.NEXT_PUBLIC_PHE_READ_TIME_MS ?? 10000);
    const INTERVAL = 500;
    let t: any;
    function tick() {
      if (readEmitted) return;
      const elapsed = Date.now() - startedAt.current;
      const halfScrolled = (() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (docHeight <= 0) return true;
        return scrollTop / docHeight >= 0.5;
      })();
      if (elapsed >= READ_TIME_MS && halfScrolled) {
        try { PheEmitter.emitRead(articleId); } catch {}
        setReadEmitted(true);
        return;
      }
      t = setTimeout(tick, INTERVAL);
    }
    t = setTimeout(tick, INTERVAL);
    return () => clearTimeout(t);
  }, [articleId, readEmitted]);

  function interestedClick() {
    try { PheEmitter.emitInterested(articleId); } catch {}
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        onClick={interestedClick}
        className="h-9 rounded-full border px-4 text-sm border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        aria-label="Mark as interested"
      >
        Interested
      </button>
      {!readEmitted && (
        <span className="text-xs text-zinc-500">Reading…</span>
      )}
    </div>
  );
}
