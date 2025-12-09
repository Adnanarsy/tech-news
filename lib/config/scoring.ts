import { z } from "zod";
import { getConfigContainer } from "@/lib/azure/cosmos";

export const ScoringSchema = z.object({
  open: z.number().int().min(0).max(10),
  read: z.number().int().min(0).max(10),
  interested: z.number().int().min(0).max(10),
});

export type Scoring = z.infer<typeof ScoringSchema>;

const DEFAULT_SCORING: Scoring = { open: 1, read: 2, interested: 1 };

let SCORING: Scoring = { ...DEFAULT_SCORING };
let loaded = false;

const CONFIG_ID = "scoring";
const CONFIG_PK = "config";

async function loadFromCosmos(): Promise<Scoring | null> {
  try {
    // Check if config container is configured
    const env = process.env.COSMOSDB_CONTAINER_CONFIG;
    if (!env) {
      // Config container not configured, use in-memory default
      return null;
    }
    const container = await getConfigContainer();
    const { resource } = await container.item(CONFIG_ID, CONFIG_PK).read<any>().catch(() => ({ resource: null }));
    if (resource && resource.type === "config" && resource.key === "scoring") {
      const parsed = ScoringSchema.safeParse(resource.value);
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch (error) {
    // If container doesn't exist or config not found, return null (fallback to in-memory)
    console.warn("Failed to load scoring from Cosmos, using in-memory default:", error);
  }
  return null;
}

async function saveToCosmos(scoring: Scoring, updatedBy?: string): Promise<void> {
  try {
    // Check if config container is configured
    const env = process.env.COSMOSDB_CONTAINER_CONFIG;
    if (!env) {
      // Config container not configured, skip persistence (in-memory only)
      console.warn("COSMOSDB_CONTAINER_CONFIG not set, scoring changes will not persist");
      return;
    }
    const container = await getConfigContainer();
    const existing = await container.item(CONFIG_ID, CONFIG_PK).read<any>().catch(() => ({ resource: null }));
    const version = existing.resource?.version ? existing.resource.version + 1 : 1;
    const doc = {
      type: "config",
      pk: CONFIG_PK,
      id: CONFIG_ID,
      key: "scoring",
      value: scoring,
      version,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || "system",
      createdAt: existing.resource?.createdAt || new Date().toISOString(),
    };
    await container.items.upsert(doc);
  } catch (error) {
    console.error("Failed to save scoring to Cosmos:", error);
    // Don't throw - allow in-memory operation to continue
    console.warn("Continuing with in-memory scoring configuration");
  }
}

export async function getScoring(): Promise<Scoring> {
  // Load from Cosmos on first call if not already loaded
  if (!loaded) {
    const cosmosScoring = await loadFromCosmos();
    if (cosmosScoring) {
      SCORING = cosmosScoring;
    }
    loaded = true;
  }
  return SCORING;
}

export async function setScoring(next: Scoring, updatedBy?: string): Promise<void> {
  SCORING = next;
  loaded = true;
  // Persist to Cosmos
  await saveToCosmos(next, updatedBy);
}

// Sync function for backward compatibility (loads from memory, assumes already initialized)
export function getScoringSync(): Scoring {
  return SCORING;
}
