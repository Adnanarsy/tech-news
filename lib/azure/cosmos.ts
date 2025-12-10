import { CosmosClient, Database, Container } from "@azure/cosmos";
import { getEnv } from "@/lib/env";

let db: Database | null = null;

function getClient() {
  const { COSMOSDB_ENDPOINT, COSMOSDB_KEY } = getEnv();
  return new CosmosClient({ endpoint: COSMOSDB_ENDPOINT, key: COSMOSDB_KEY });
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  const env = getEnv();
  const client = getClient();
  const { database } = await client.databases.createIfNotExists({ id: env.COSMOSDB_DATABASE });
  db = database;
  return db;
}

async function getOrCreateContainer(id: string, partitionKey: string): Promise<Container> {
  const database = await getDatabase();
  const { container } = await database.containers.createIfNotExists({
    id,
    partitionKey: { paths: [partitionKey] },
  });
  return container;
}

export async function usersContainer() {
  const { COSMOSDB_CONTAINER_USERS } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_USERS, "/pk");
}

export async function newsContainer() {
  const { COSMOSDB_CONTAINER_NEWS } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_NEWS, "/pk");
}

export async function commentsContainer() {
  const { COSMOSDB_CONTAINER_COMMENTS } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_COMMENTS, "/pk");
}

export async function coursesContainer() {
  const { COSMOSDB_CONTAINER_COURSES } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_COURSES, "/pk");
}

export async function modulesContainer() {
  const { COSMOSDB_CONTAINER_MODULES } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_MODULES, "/pk");
}

export async function interestsContainer() {
  const { COSMOSDB_CONTAINER_INTERESTS } = getEnv();
  return getOrCreateContainer(COSMOSDB_CONTAINER_INTERESTS, "/pk");
}

export async function getTagsContainer() {
  const { COSMOSDB_CONTAINER_TAGS } = getEnv();
  if (!COSMOSDB_CONTAINER_TAGS) {
    throw new Error("COSMOSDB_CONTAINER_TAGS is not set. Configure it in environment when TRAINER_BACKEND=cosmos.");
  }
  return getOrCreateContainer(COSMOSDB_CONTAINER_TAGS, "/pk");
}

export async function getArticleTagsContainer() {
  const { COSMOSDB_CONTAINER_ARTICLE_TAGS } = getEnv();
  if (!COSMOSDB_CONTAINER_ARTICLE_TAGS) {
    throw new Error(
      "COSMOSDB_CONTAINER_ARTICLE_TAGS is not set. Configure it in environment when TRAINER_BACKEND=cosmos."
    );
  }
  return getOrCreateContainer(COSMOSDB_CONTAINER_ARTICLE_TAGS, "/pk");
}
