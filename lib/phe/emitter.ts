"use client";

type Events = { open?: boolean; read?: boolean; interested?: boolean };

function nonce(): string {
  // simple random nonce
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Batching support (opt-in via NEXT_PUBLIC_PHE_CLIENT_BATCH, defaults to true)
const BATCH = (process.env.NEXT_PUBLIC_PHE_CLIENT_BATCH ?? "true").toLowerCase() !== "false";
const WINDOW_MS = Number(process.env.NEXT_PUBLIC_PHE_BATCH_WINDOW_MS ?? 2500);

type Pending = { [articleId: string]: Events };
let pending: Pending = {};
let timer: any = null;

async function flush() {
  const items = Object.entries(pending).map(([articleId, events]) => ({ articleId, events, nonce: nonce(), ts: Date.now() }));
  pending = {};
  timer = null;
  if (items.length === 0) return;
  try {
    await fetch("/api/phe/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch: items }),
      keepalive: true,
    });
  } catch {
    // ignore client errors
  }
}

function enqueue(articleId: string, events: Events) {
  const prev = pending[articleId] || {};
  pending[articleId] = { open: prev.open || !!events.open, read: prev.read || !!events.read, interested: prev.interested || !!events.interested };
  if (!timer) timer = setTimeout(flush, WINDOW_MS);
}

async function postSingle(articleId: string, events: Events) {
  try {
    await fetch("/api/phe/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, events, nonce: nonce(), ts: Date.now() }),
      keepalive: true,
    });
  } catch {
    // ignore client errors
  }
}

export const PheEmitter = {
  emitOpen(articleId: string) {
    return BATCH ? enqueue(articleId, { open: true }) : postSingle(articleId, { open: true });
  },
  emitRead(articleId: string) {
    return BATCH ? enqueue(articleId, { read: true }) : postSingle(articleId, { read: true });
  },
  emitInterested(articleId: string) {
    return BATCH ? enqueue(articleId, { interested: true }) : postSingle(articleId, { interested: true });
  },
  // Expose flush for testing or on page unload if needed
  __flush: flush,
};
