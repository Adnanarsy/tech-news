# TechNews Application - Summary

## Overview

TechNews is a Next.js 16 (App Router) application that showcases technology news with a focus on a clean reading experience and privacy-preserving interest scoring using Paillier Homomorphic Encryption (PHE).

## Technology Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js (Credentials provider, JWT sessions)
- **Database**: Azure Cosmos DB (NoSQL API)
- **Storage**: Azure Blob Storage
- **Encryption**: Paillier Homomorphic Encryption (paillier-bigint)
- **Validation**: Zod schemas
- **Testing**: Vitest for unit tests

## Key Features

### Public Features
- Article browsing with categories (Trending, Deep Dives, Analysis)
- Article search functionality
- Responsive design with dark/light theme
- Infinite scroll pagination

### Admin Features
- Article creation and management
- User management
- Scoring configuration
- Image upload (URL or file)

### Trainer Features
- Tag management
- Article labeling
- Tag history tracking

### PHE (Privacy-Preserving Interest Scoring)
- Encrypted interest scoring
- Homomorphic addition without decryption
- Encrypted score persistence in Cosmos DB

## Architecture

### Repository Pattern
- Supports multiple backends: `mock` (default) or `cosmos`
- Set `ARTICLES_BACKEND=cosmos` to use Cosmos DB
- Consistent API regardless of backend

### Data Storage
- **Cosmos DB Containers**:
  - `users` - User accounts
  - `articles` - Article content
  - `news` - News posts
  - `interests` - Encrypted interest scores
  - `tags` - Taxonomy tags
  - `articleTags` - Article-tag relationships

### Security
- Role-based access control (RBAC)
- Rate limiting on API routes
- Secure cookie configuration
- PHE encryption for privacy-preserving scoring

## Environment Variables

### Required
- `NEXTAUTH_SECRET` - JWT signing secret (min 16 chars)
- `NEXTAUTH_URL` - Application URL

### Cosmos DB
- `COSMOSDB_ENDPOINT`
- `COSMOSDB_KEY`
- `COSMOSDB_DATABASE`
- `COSMOSDB_CONTAINER_*` - Container names

### Optional
- `ARTICLES_BACKEND` - `mock` (default) or `cosmos`
- `TRAINER_BACKEND` - `memory` (default) or `cosmos`
- `PHE_PUBLIC_KEY_N` - PHE public key modulus
- `PHE_PUBLIC_KEY_G` - PHE public key generator

## Quick Start

1. Install dependencies: `npm install`
2. Configure `.env.local` with required variables
3. Create admin user: `npm run create-admin`
4. Start server: `npm run dev`
5. Access: `http://localhost:3000`

## Documentation

- `README.md` - Main project documentation
- `docs/QUICK_START.md` - Quick setup guide
- `docs/SIGNIN_ADMIN.md` - Admin sign-in guide
- `docs/SWITCH_TO_COSMOS.md` - Cosmos DB setup guide

## API Endpoints

### Public
- `GET /api/articles` - List articles
- `GET /api/articles/latest` - Latest articles
- `GET /api/articles/trending` - Trending articles
- `GET /api/articles/search` - Search articles
- `GET /api/phe/public-key` - Get PHE public key

### Admin (Protected)
- `POST /api/admin/articles` - Create article
- `GET /api/admin/articles` - List all articles
- `PUT /api/admin/articles` - Update article
- `DELETE /api/admin/articles` - Delete article

### Trainer (Protected)
- `GET/POST/PATCH/DELETE /api/trainer/tags` - Tag management
- `GET/POST/DELETE /api/trainer/article-tags` - Article tagging

### PHE (Protected)
- `POST /api/phe/score` - Submit encrypted interest score

## User Roles

- **Public**: Browse articles, search
- **User**: All public features + authenticated features
- **Trainer**: User features + tag management, article labeling
- **Admin**: All features + article management, user management

## Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run unit tests
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure all environment variables
3. Set `ARTICLES_BACKEND=cosmos`
4. Generate PHE keys
5. Build: `npm run build`
6. Start: `npm start`

---

**Version**: 0.1.0  
**Last Updated**: December 2024

