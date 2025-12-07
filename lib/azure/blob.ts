import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { getEnv } from "@/lib/env";

let blobServiceClient: BlobServiceClient | null = null;
let containerClientPromise: Promise<ContainerClient> | null = null;

export function getBlobServiceClient() {
  if (!blobServiceClient) {
    const { AZURE_STORAGE_CONNECTION_STRING } = getEnv();
    blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
  }
  return blobServiceClient;
}
// Optimized: cache the ContainerClient per server lifecycle, and
// avoid createIfNotExists in production unless explicitly enabled.
export async function getContainerClient() {
  if (containerClientPromise) return containerClientPromise;
  containerClientPromise = (async () => {
    const env = getEnv();
    const service = getBlobServiceClient();
    const container = service.getContainerClient(env.AZURE_STORAGE_CONTAINER);
    const isProd = process.env.NODE_ENV === "production";
    const autoCreateFlag = (process.env.BLOB_AUTO_CREATE || "").toLowerCase();
    const shouldAutoCreate = autoCreateFlag
      ? autoCreateFlag === "1" || autoCreateFlag === "true"
      : !isProd; // default: enabled in dev, disabled in prod

    if (shouldAutoCreate) {
      await container.createIfNotExists();
    }
    return container;
  })();
  return containerClientPromise;
}

export async function uploadBuffer(
  path: string,
  data: Buffer,
  contentType?: string
) {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(path);
  const headers = contentType ? { blobHTTPHeaders: { blobContentType: contentType } } : undefined;
  await blobClient.uploadData(data, headers);
  return blobClient.url;
}

export async function deleteBlob(path: string) {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(path);
  await blobClient.deleteIfExists();
}
