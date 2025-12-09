/**
 * Script to create an admin user in Cosmos DB
 * 
 * Usage:
 *   node scripts/create-admin.js <email> <password> <name>
 * 
 * Example:
 *   node scripts/create-admin.js admin@example.com password123 "Admin User"
 * 
 * Make sure your .env.local has Cosmos DB credentials configured:
 *   COSMOSDB_ENDPOINT=...
 *   COSMOSDB_KEY=...
 *   COSMOSDB_DATABASE=...
 *   COSMOSDB_CONTAINER_USERS=...
 */

const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin User";

  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.js <email> <password> [name]");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Error: Password must be at least 6 characters");
    process.exit(1);
  }

  const endpoint = process.env.COSMOSDB_ENDPOINT;
  const key = process.env.COSMOSDB_KEY;
  const database = process.env.COSMOSDB_DATABASE;
  const containerName = process.env.COSMOSDB_CONTAINER_USERS;

  if (!endpoint || !key || !database || !containerName) {
    console.error("Error: Missing Cosmos DB environment variables");
    console.error("Required: COSMOSDB_ENDPOINT, COSMOSDB_KEY, COSMOSDB_DATABASE, COSMOSDB_CONTAINER_USERS");
    process.exit(1);
  }

  try {
    const client = new CosmosClient({ endpoint, key });
    const databaseClient = client.database(database);
    const container = databaseClient.container(containerName);

    // Check if user already exists
    const { resources: existing } = await container.items
      .query({
        query: "SELECT TOP 1 c.id FROM c WHERE c.type = 'user' AND c.email = @e",
        parameters: [{ name: "@e", value: email }],
      })
      .fetchAll();

    if (existing.length > 0) {
      console.error(`Error: User with email ${email} already exists`);
      process.exit(1);
    }

    // Create admin user
    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id,
      pk: `user#${id}`,
      type: "user",
      email,
      name,
      passwordHash,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await container.items.create(user);
    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: admin`);
    console.log(`   ID: ${id}`);
    console.log("\nYou can now sign in at http://localhost:3000/signin");
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdmin();

