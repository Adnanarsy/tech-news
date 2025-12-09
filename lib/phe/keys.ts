import { getEnv } from "@/lib/env";
import * as paillier from "paillier-bigint";

type PublicKeyJSON = { n: string; g: string; version: number; generated: boolean };

let cachedPub: paillier.PublicKey | null = null;
let cachedJson: PublicKeyJSON | null = null;

async function generateDevKeys() {
  const { publicKey } = await paillier.generateRandomKeys(2048);
  return publicKey;
}

export async function getPublicKey(): Promise<paillier.PublicKey> {
  if (cachedPub) return cachedPub;
  // Try env
  const nStr = process.env.PHE_PUBLIC_KEY_N;
  const gStr = process.env.PHE_PUBLIC_KEY_G;
  if (nStr && gStr) {
    const n = BigInt(nStr);
    const g = BigInt(gStr);
    // @ts-ignore construct directly
    cachedPub = new (paillier as any).PublicKey(n, g) as paillier.PublicKey;
    cachedJson = { n: nStr, g: gStr, version: 1, generated: false };
    return cachedPub;
  }
  // Dev auto-gen if allowed (default true)
  const auto = (process.env.DEV_PHE_AUTO_GEN ?? "true").toLowerCase() !== "false";
  if (!auto) {
    throw new Error("PHE public key missing. Set PHE_PUBLIC_KEY_N/G or enable DEV_PHE_AUTO_GEN.");
  }
  const pub = await generateDevKeys();
  cachedPub = pub;
  cachedJson = { n: pub.n.toString(), g: pub.g.toString(), version: 1, generated: true };
  return pub;
}

export async function getPublicKeyJSON(): Promise<PublicKeyJSON> {
  if (cachedJson) return cachedJson;
  await getPublicKey();
  return cachedJson!;
}
