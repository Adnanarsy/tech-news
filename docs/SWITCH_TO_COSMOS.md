# Switching to Cosmos DB Backend

This guide explains how to switch from mock data to Azure Cosmos DB.

## Prerequisites

1. Azure Cosmos DB account created
2. Database and containers created
3. Environment variables configured

## Step 1: Configure Environment Variables

Add to `.env.local`:

```bash
# Cosmos DB Configuration
COSMOSDB_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOSDB_KEY=your-primary-key
COSMOSDB_DATABASE=technews
COSMOSDB_CONTAINER_USERS=users
COSMOSDB_CONTAINER_NEWS=news
COSMOSDB_CONTAINER_ARTICLES=articles
COSMOSDB_CONTAINER_COMMENTS=comments
COSMOSDB_CONTAINER_COURSES=courses
COSMOSDB_CONTAINER_MODULES=modules
COSMOSDB_CONTAINER_INTERESTS=interests

# Backend Selection
ARTICLES_BACKEND=cosmos
TRAINER_BACKEND=cosmos  # Optional, for trainer features
```

## Step 2: Create Containers

Ensure these containers exist in your Cosmos DB:

- `users` - User accounts
- `news` - News posts
- `articles` - Articles (when using Cosmos backend)
- `comments` - User comments
- `courses` - Course content
- `modules` - Course modules
- `interests` - Encrypted interest scores
- `tags` - Taxonomy tags (if TRAINER_BACKEND=cosmos)
- `articleTags` - Article-tag relationships

## Step 3: Test Connection

```bash
npm run test:cosmos
```

This will verify:
- Connection to Cosmos DB
- Container existence
- Read/write permissions

## Step 4: Verify Backend Switch

Check server logs when starting:

```bash
npm run dev
```

You should see:
```
[Repository] Using CosmosArticleRepository
```

Instead of:
```
[Repository] Using MockArticleRepository
```

## Step 5: Test Article Operations

1. Create an article via `/admin/upload`
2. Verify it appears in Cosmos DB Data Explorer
3. Check homepage shows the article
4. Verify article detail page loads

## Troubleshooting

### "Failed to load CosmosArticleRepository"
- Check `lib/articles/repository_cosmos.ts` exists
- Verify environment variables are set
- Check Cosmos DB connection

### Articles not appearing
- Verify `ARTICLES_BACKEND=cosmos` is set
- Check articles container exists
- Verify article documents have correct structure

### Fallback to mock
- In production, set `STRICT_BACKEND=true` to fail hard
- In development, fallback is allowed for easier testing

## Production Considerations

For production:
- Set `STRICT_BACKEND=true` to prevent fallback
- Use Azure Key Vault for secrets
- Enable connection pooling
- Monitor Cosmos DB metrics

