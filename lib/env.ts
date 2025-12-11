import { z } from "zod";

const EnvSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),

  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1),
  AZURE_STORAGE_CONTAINER: z.string().min(1),

  COSMOSDB_ENDPOINT: z.string().url(),
  COSMOSDB_KEY: z.string().min(1),
  COSMOSDB_DATABASE: z.string().min(1),
  COSMOSDB_CONTAINER_USERS: z.string().min(1),
  COSMOSDB_CONTAINER_NEWS: z.string().min(1),
  COSMOSDB_CONTAINER_COMMENTS: z.string().min(1),
  COSMOSDB_CONTAINER_COURSES: z.string().min(1),
  COSMOSDB_CONTAINER_MODULES: z.string().min(1),
  COSMOSDB_CONTAINER_INTERESTS: z.string().min(1),

  // Optional containers used when TRAINER_BACKEND=cosmos
  COSMOSDB_CONTAINER_TAGS: z.string().min(1).optional(),
  COSMOSDB_CONTAINER_ARTICLE_TAGS: z.string().min(1).optional(),

  PHE_PUBLIC_KEY_N: z.string().optional(),
  PHE_PUBLIC_KEY_G: z.string().optional(),
  PHE_PRIVATE_KEY_LAMBDA: z.string().optional(),
  PHE_PRIVATE_KEY_MU: z.string().optional(),

  // Optional: Article repository backend selection
  ARTICLES_BACKEND: z.enum(["mock", "cosmos", "cms"]).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
