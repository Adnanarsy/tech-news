# Quick Start Guide

Get your TechNews application up and running quickly.

## Installation

```bash
# Install dependencies
npm install

# Copy environment template (if exists)
cp .env.example .env.local
```

## Basic Setup (Mock Data)

The app can run with minimal configuration:

1. **Set NEXTAUTH_SECRET** (required for auth):
   ```bash
   # In .env.local
   NEXTAUTH_SECRET=your-secret-min-16-chars-long
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   ```
   http://localhost:3000
   ```

## Full Setup (With Cosmos DB)

1. **Configure Cosmos DB** in `.env.local`:
   ```bash
   COSMOSDB_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOSDB_KEY=your-key
   COSMOSDB_DATABASE=technews
   COSMOSDB_CONTAINER_USERS=users
   COSMOSDB_CONTAINER_NEWS=news
   ```

2. **Create admin user**:
   ```bash
   npm run create-admin admin@test.com password123 "Admin User"
   ```

3. **Start server**:
   ```bash
   npm run dev
   ```

4. **Sign in**:
   - Go to `http://localhost:3000/signin`
   - Use admin credentials

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run create-admin # Create admin user
```

## Next Steps

- Read `README.md` for detailed documentation
- Check `docs/SIGNIN_ADMIN.md` for admin setup
- See `docs/SWITCH_TO_COSMOS.md` for Cosmos DB setup

