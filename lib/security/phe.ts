import { getEnv } from "@/lib/env";
import { generateRandomKeys, PublicKey, PrivateKey } from "paillier-bigint";

// Utilities to handle Paillier BigInt keys and base64 encoding of ciphertexts

export type PheKeys = {
  publicKey: PublicKey;
  privateKey?: PrivateKey;
};

function bigintFromBase64(b64: string): bigint {
  const buf = Buffer.from(b64, "base64");
  return BigInt("0x" + buf.toString("hex"));
}

function base64FromBigint(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex; // even length
  return Buffer.from(hex, "hex").toString("base64");
}

let cached: PheKeys | null = null;

export async function getPheKeys(): Promise<PheKeys> {
  if (cached) return cached;
  const env = getEnv();

  if (env.PHE_PUBLIC_KEY_N && env.PHE_PUBLIC_KEY_G) {
    const n = BigInt(env.PHE_PUBLIC_KEY_N);
    const g = BigInt(env.PHE_PUBLIC_KEY_G);
    const publicKey = new PublicKey(n, g);
    let privateKey: PrivateKey | undefined = undefined;
    if (env.PHE_PRIVATE_KEY_LAMBDA && env.PHE_PRIVATE_KEY_MU) {
      const lambda = BigInt(env.PHE_PRIVATE_KEY_LAMBDA);
      const mu = BigInt(env.PHE_PRIVATE_KEY_MU);
      privateKey = new PrivateKey(lambda, mu, publicKey);
    }
    cached = { publicKey, privateKey };
    return cached;
  }

  // Safety: do not silently generate keys in production.
  const isProd = process.env.NODE_ENV === "production";
  const devAutoGenFlag = (process.env.DEV_PHE_AUTO_GEN || "").toLowerCase();
  const allowDevAutoGen = devAutoGenFlag ? (devAutoGenFlag === "1" || devAutoGenFlag === "true") : true;
  if (isProd) {
    throw new Error(
      "PHE keys are missing. In production, set PHE_PUBLIC_KEY_N/G (and optional private key) via environment or Key Vault."
    );
  }
  if (!allowDevAutoGen) {
    throw new Error(
      "PHE keys are missing and DEV_PHE_AUTO_GEN is disabled. Provide dev keys in env to proceed."
    );
  }
  // Dev fallback: generate ephemeral keys for local development only.
  const { publicKey, privateKey } = await generateRandomKeys(2048);
  cached = { publicKey, privateKey };
  return cached;
}

export async function encryptScore(value: number): Promise<string> {
  const { publicKey } = await getPheKeys();
  const c = publicKey.encrypt(BigInt(value));
  return base64FromBigint(c);
}

export async function addEncrypted(aB64: string, bB64: string): Promise<string> {
  const { publicKey } = await getPheKeys();
  const a = bigintFromBase64(aB64);
  const b = bigintFromBase64(bB64);
  const sum = publicKey.addition(a, b);
  return base64FromBigint(sum);
}

export async function decryptScore(cB64: string): Promise<number | null> {
  const { privateKey } = await getPheKeys();
  if (!privateKey) return null;
  const c = bigintFromBase64(cB64);
  const m = privateKey.decrypt(c);
  return Number(m);
}
