"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type CryptoInfo = {
  n: string;
  g: string;
  version: number;
  generated: boolean;
};

export default function AdminCryptoPage() {
  const { data: session, status } = useSession();
  const [info, setInfo] = useState<CryptoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phe/public-key", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = (await res.json()) as CryptoInfo;
      setInfo(data);
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

  if (status === "loading") return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Crypto Parameters</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        View Paillier homomorphic encryption public key metadata. Private keys are never exposed.
      </p>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !info ? (
        <div className="text-sm opacity-70">No crypto info available.</div>
      ) : (
        <div className="rounded-lg border">
          <div className="p-3 border-b text-sm font-medium">Public Key Metadata</div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs mb-1 opacity-70">Key Version</label>
              <div className="text-sm font-mono">{info.version}</div>
            </div>
            <div>
              <label className="block text-xs mb-1 opacity-70">Key Source</label>
              <div className="text-sm">
                {info.generated ? (
                  <span className="text-yellow-600 dark:text-yellow-400">Auto-generated (dev mode)</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">From environment variables</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 opacity-70">Modulus (N)</label>
              <div className="text-xs font-mono break-all p-2 rounded border bg-zinc-50 dark:bg-zinc-900">
                {info.n}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Length: {info.n.length} characters</p>
            </div>
            <div>
              <label className="block text-xs mb-1 opacity-70">Generator (G)</label>
              <div className="text-xs font-mono break-all p-2 rounded border bg-zinc-50 dark:bg-zinc-900">
                {info.g}
              </div>
            </div>
            <div className="pt-2 border-t" style={{ borderColor: "var(--divider-color)" }}>
              <div className="text-xs text-zinc-500">
                <p>• This public key is used to encrypt user interest scores</p>
                <p>• Encrypted scores are stored in Cosmos DB and can be aggregated without decryption</p>
                <p>• Private key is required only for decryption (not used in normal operations)</p>
                <p>• Key rotation requires updating environment variables and re-encrypting existing scores</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

