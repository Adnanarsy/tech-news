# How to Sign In as Admin

## Prerequisites

1. **Cosmos DB configured**: Make sure your `.env.local` has:
   ```
   COSMOSDB_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOSDB_KEY=your-key
   COSMOSDB_DATABASE=your-database
   COSMOSDB_CONTAINER_USERS=users
   NEXTAUTH_SECRET=your-secret-min-16-chars
   ```

2. **Admin user exists**: You need a user account with `role: "admin"` in Cosmos DB.

## Method 1: Create Admin User via Script (Recommended)

1. Install dependencies if not already:
   ```bash
   npm install
   ```

2. Run the create-admin script:
   ```bash
   node scripts/create-admin.js admin@example.com yourpassword "Admin Name"
   ```

   Replace:
   - `admin@example.com` with your desired email
   - `yourpassword` with your desired password (min 6 characters)
   - `Admin Name` with the user's display name (optional)

3. The script will create the admin user in Cosmos DB.

## Method 2: Create Admin User via API

You can also create an admin user by making a POST request to `/api/users`:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword",
    "name": "Admin User",
    "role": "admin"
  }'
```

**Note**: This endpoint is not protected, so only use it in development or secure it in production.

## Method 3: Create Admin User via Cosmos DB Portal

1. Go to Azure Portal → Your Cosmos DB account
2. Navigate to Data Explorer
3. Select your database and `users` container
4. Click "New Item" and create a document:

```json
{
  "id": "unique-id-here",
  "pk": "user#unique-id-here",
  "type": "user",
  "email": "admin@example.com",
  "name": "Admin User",
  "passwordHash": "<bcrypt-hashed-password>",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note**: You'll need to hash the password using bcrypt. You can use the script method above or an online bcrypt tool (not recommended for production).

## Signing In

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the sign-in page:
   ```
   http://localhost:3000/signin
   ```

3. Enter your admin credentials:
   - **Email**: The email you used when creating the admin user
   - **Password**: The password you set

4. Click "Sign in"

5. You'll be redirected to the admin dashboard at `/admin`

## Admin Features

Once signed in as admin, you can access:

- `/admin` - Admin dashboard
- `/admin/users` - Manage user roles
- `/admin/scoring` - Configure scoring constants
- `/admin/crypto` - View PHE crypto parameters
- `/admin/upload` - Create new articles

## Troubleshooting

### "Cannot sign in" / "Invalid credentials"
- Verify the user exists in Cosmos DB with the correct email
- Check that the password hash matches (if created manually)
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`

### "Access denied" after signing in
- Verify the user's `role` field is set to `"admin"` (not `"user"` or `"trainer"`)
- Check the Cosmos DB document structure matches the User interface

### "Cosmos DB connection error"
- Verify all Cosmos DB environment variables are set correctly
- Check that the container exists (it will be created automatically if it doesn't)
- Ensure your Cosmos DB account is accessible

### Change existing user to admin
If you already have a user account, you can change their role to admin:

1. Sign in as that user (if possible) or use another admin account
2. Go to `/admin/users`
3. Change the user's role dropdown to "admin"

Or update directly in Cosmos DB:
```json
{
  "role": "admin"
}
```

