# How to Sign In as Admin

This guide explains how to create and sign in as an admin user.

## Prerequisites

1. Cosmos DB configured with `users` container
2. Environment variables set in `.env.local`:
   - `COSMOSDB_ENDPOINT`
   - `COSMOSDB_KEY`
   - `COSMOSDB_DATABASE`
   - `COSMOSDB_CONTAINER_USERS`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

## Create Admin User

### Using the Script

```bash
npm run create-admin your-email@example.com yourpassword123 "Your Name"
```

Example:
```bash
npm run create-admin admin@technews.com admin123 "Admin User"
```

### Manual Creation

If the script doesn't work, you can create a user manually in Cosmos DB:

1. Open Azure Portal → Cosmos DB → Data Explorer
2. Navigate to your `users` container
3. Create a new item with this structure:

```json
{
  "id": "user-uuid-here",
  "pk": "user#user-uuid-here",
  "email": "admin@technews.com",
  "password": "hashed-password-here",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2024-12-20T10:00:00.000Z"
}
```

**Note**: Password must be hashed using bcrypt. Use the script for proper hashing.

## Sign In

1. Navigate to: `http://localhost:3000/signin`
2. Enter your email and password
3. Click "Sign in"
4. You should be redirected to `/admin` dashboard

## Troubleshooting

### "Invalid email or password"
- Verify user exists in Cosmos DB
- Check password hash is correct
- Ensure `NEXTAUTH_SECRET` is set

### "Too Many Requests"
- Rate limiting is active
- Wait 10 minutes or adjust limits in `middleware.ts`

### User not found
- Check Cosmos DB connection
- Verify container name matches `COSMOSDB_CONTAINER_USERS`
- Check user document structure

## Verify Admin Access

After signing in, you should be able to:
- Access `/admin` dashboard
- Create articles at `/admin/upload`
- Manage users at `/admin/users`

