TechNews is a Next.js 16 (App Router) application that showcases technology news with a focus on a clean reading experience and privacy‑preserving interest scoring (PHE/Paillier) research. The app currently serves articles from an in‑memory dataset behind API routes and is wired for future integration with Azure Cosmos DB and Azure Blob Storage.

## Contents
- Overview
- Quick start (run locally)
- Environment & configuration
- How the app is structured
- Operating the app (roles, pages, trainer tools)
- Development workflow (scripts, lint, tests)
- API contracts (stable shapes)
- Switching data backends (repository adapter)
- Troubleshooting

## Overview
- Framework: Next.js 16 (App Router), React 19
- Styling: Tailwind CSS v4 (`app/globals.css`)
- Auth: NextAuth (Credentials provider, JWT sessions)
- Data layer (current): In‑memory articles with deterministic pagination
- PHE context: Weighted additive scoring (+1 open, +2 read, +1 interested) suitable for Paillier homomorphic addition. Research features are being built under Admin/Trainer routes.

## Quick start
1) Install dependencies
```
npm i
```
2) Start the dev server
```
npm run dev
```
3) Open the app at
```
http://localhost:3000
```

Notes
- You can edit the homepage at `app/page.tsx`. Changes hot‑reload in dev.
- Articles, Latest/Deep/Analysis sections and search work out of the box using mock data.

## Environment & configuration
The app can run with zero env vars using mock articles. Authentication‑protected pages require a valid `NEXTAUTH_SECRET` and a user in Cosmos DB to sign in.

Recommended `.env.local` keys:
- `NEXTAUTH_SECRET` — required for NextAuth JWT signing.
- Cosmos DB (for future/production article and user storage):
  - `COSMOS_ENDPOINT`
  - `COSMOS_KEY`
  - `COSMOS_DB`
  - Container names depending on your setup (e.g., `COSMOS_USERS_CONTAINER`, `COSMOS_ARTICLES_CONTAINER`, etc.)
- Azure Blob Storage (for uploads; not required for local article mocks):
  - `AZURE_STORAGE_CONNECTION_STRING` or SAS configuration
- Optional backend switches:
  - `ARTICLES_BACKEND=mock|cosmos|cms` — selects article repository backend (mock by default)
  - `TRAINER_BACKEND=memory|cosmos` — selects storage for trainer APIs (tags, article-tags). Default is `memory`.
  - When `TRAINER_BACKEND=cosmos`, also configure:
    - `COSMOSDB_CONTAINER_TAGS`
    - `COSMOSDB_CONTAINER_ARTICLE_TAGS`

## How the app is structured
- `app/` — App Router pages and API route handlers
  - `app/page.tsx` — homepage composition (Trending, Latest, Deep Dives, Analysis)
  - `app/api/articles/*` — articles API backed by mock dataset
  - `app/admin/*` — admin dashboard (scaffolded) and users placeholder
  - `app/trainer/*` — trainer workspace (tags CRUD implemented)
- `components/` — UI components (cards, grids, nav, etc.)
- `lib/` — utilities and repository abstractions
  - `lib/articles/repository.ts` — repository interface + mock implementation
  - `lib/validation/*` — zod schemas (e.g., taxonomy validators)
- `types/` — shared TypeScript interfaces (e.g., `types/article.ts`, `types/taxonomy.ts`)
- `middleware.ts` — role‑based route protection (`/admin`, `/trainer`)

## Operating the app
Public browsing
- Visit `/` to see the feed. Internal API routes power the sections with stable pagination.
- Open an article card to view the detail page under `/news/[id]`.

Search
- Click “Search” in the top nav to open the search modal (title substring search).

Roles and protected areas
- The app uses NextAuth with Credentials. The middleware gates:
  - `/admin/*` → `role = admin`
  - `/trainer/*` → `role = trainer` or `admin`
- Without a configured auth backend (Cosmos users), you won’t be able to sign in. For UI exploration, you can temporarily remove the route protections in `middleware.ts` during development, or configure Cosmos with a test user.

Rate limiting (Phase 2 hardening)
- Basic, per‑IP in‑memory rate limiting is enforced via `middleware.ts`:
  - `/api/auth/*` (sign in and callbacks): 10 requests / 10 minutes
  - `/api/admin/*` and `/api/trainer/*`: 120 requests / minute
- Responses over the limit return HTTP 429 with `Retry-After` and `RateLimit-Remaining` headers. Replace with a distributed store (Redis) for production.

Trainer workspace (implemented)
- `/trainer` — landing page
- `/trainer/tags` — Ontology (Tags) management via:
  - `GET/POST/PATCH/DELETE /api/trainer/tags`
  - Features: create tag with stable `id` and `index`, rename, toggle active, soft‑deactivate.
- `/trainer/articles` — list and filter articles; open per‑article labeling
- `/trainer/articles/[id]` — label an article with tags and confidence
- `/trainer/simulate` — homomorphic operation log (no decryption)

Trainer workspace — APIs
- `/api/trainer/tags` (in‑memory by default; Cosmos when `TRAINER_BACKEND=cosmos`)
- `/api/trainer/article-tags` (in‑memory by default; Cosmos when `TRAINER_BACKEND=cosmos`)

Admin dashboard
- `/admin` — landing page with links to Users, Scoring, Crypto
- `/admin/users` — manage roles (Cosmos users container)
- `/admin/upload` — create article (in‑memory for dev)
- `/api/admin/config` — GET current scoring constants (open/read/interested); PUT (admin only) to update

## Development workflow
Scripts
```
npm run dev      # start Next.js in dev mode
npm run build    # production build
npm run start    # start production server after build
npm run lint     # run ESLint
npm run test     # run Vitest (headless)
npm run test:watch
```

Styling
- Tailwind CSS v4 is used. Utility classes are embedded in components. Global tokens/variables live in `app/globals.css`.

Auth
- Config is in `auth.config.ts`. Credentials provider expects users in Cosmos (`usersContainer()`). JWT session exposes `user.role` and `user.id`.

RBAC
- `middleware.ts` enforces role access to `/admin` and `/trainer`. Client UI also hides nav links for unauthorized roles.

## API contracts (stable shapes)
These routes back the UI. Keep their responses stable when swapping backends.
- `GET /api/articles?category&cursor&limit` → `{ items: Article[], nextCursor: string|null }`
- `GET /api/articles/latest?cursor&limit` → same shape
- `GET /api/articles/trending` → `{ items: Article[] }`
- `GET /api/articles/search?q&limit` → `{ items: Article[] }`
- `GET /api/articles/[id]` → `Article | 404`

Trainer APIs
- `GET/POST/PATCH/DELETE /api/trainer/tags`
- `GET /api/trainer/article-tags?articleId=...`
- `POST /api/trainer/article-tags`
- `DELETE /api/trainer/article-tags?id=...`

All admin/trainer APIs now return JSON error bodies consistently: `{ error: ... }` for 4xx responses (including 403/404).

## Switching data backends (repository adapter)
The article APIs use a repository abstraction:
- File: `lib/articles/repository.ts`
- Replace the mock implementation with a Cosmos/CMS repository while preserving the API contract above. An environment switch like `ARTICLES_BACKEND` can be used to select the implementation.

## Troubleshooting
- I can’t access `/admin` or `/trainer`:
  - Ensure you’re signed in and your user has the proper `role` claim. You need `NEXTAUTH_SECRET` configured and a user in Cosmos. For local UI exploration without auth, you may temporarily relax the `middleware.ts` checks (dev only).
- Images not loading:
  - Ensure external image domains are allowed in `next.config.ts` (Unsplash is used by the mock dataset).
- Build fails on missing Azure env vars:
  - These are only needed for real Cosmos/Blob integrations. Remove usages or set dummy values if you’re not using those features yet.

## Contributing
- Follow the existing code style and component patterns.
- Keep API shapes and pagination behavior stable.
- Use zod schemas for input validation on new route handlers.

## License
MIT (or project‑specific) — add details as needed.
