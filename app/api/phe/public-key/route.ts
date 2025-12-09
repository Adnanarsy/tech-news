import { getPublicKeyJSON } from "@/lib/phe/keys";

export async function GET() {
  const pub = await getPublicKeyJSON();
  return Response.json(pub, { headers: { "Cache-Control": "no-store" } });
}
