# Backend Starter Kit

Backend Express + TypeScript starter that mirrors Vercel's serverless runtime. It exposes a health endpoint and a sample message preview endpoint to help you plug in WhatsApp automation logic later.

## Features
- Express server shared between local dev server and Vercel serverless function
- TypeScript + ts-node-dev for fast reloads
- Basic routing + 404/error handlers
- Environment variable helper with `dotenv`
- Lightweight logging helper with log-level filtering
- Error logging writes to `backend/logs/error.log` with function/context metadata
- Placeholder repository/use case/handler structure
- Example outlet & product repositories with raw SQL modules
- Database config file + connection pool stub ready for your provider of choice
- Graceful shutdown hooks that drain HTTP server + DB pool
- Standardized JSON response templates for 200/400/401/500
- Request parsers, middleware, and entity folders ready for expansion
- Ready-to-use `vercel.json` pointing at the serverless entry point

## Getting Started

```bash
cd backend
npm install
npm run dev
```

The dev server listens on `http://localhost:4000` by default (configurable via `.env`). Example endpoints:
- `GET /` – service metadata
- `GET /health` – uptime + timestamp
- `POST /messages/preview` – returns a simple WhatsApp message preview (expects `customerName`, `product`, and `price` in the JSON body)

## Environment Variables

The loader automatically picks `.env.<NODE_ENV>` (falling back to `.env` if it doesn’t exist). Recommended workflow:

1. Copy `.env.development.example` to `.env.development` for local work:
   - `NODE_ENV=development`
   - Use local Postgres credentials via `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
2. Copy `.env.production.example` to `.env.production` (optional) or configure variables in Vercel/Supabase dashboard:
   - `NODE_ENV=production`
   - Provide `DATABASE_URL` from Supabase and set `DB_PROVIDER=supabase`.

Shared options:
- `PORT`, `APP_NAME`, `LOG_LEVEL`
- `DB_HOST`, `DB_PORT` – host/port for local Postgres when `DATABASE_URL` is empty
- `DB_MAX_CONNECTIONS` – connection pool size (default `5`)
- `SKIP_ENV_FILE=true` can be set to prevent loading local files (useful in CI).

## Building

```bash
npm run build
npm start
```

## Deploying to Vercel
1. In Vercel, set the **root directory** to `backend/`.
2. Vercel automatically runs `npm install` and `npm run build` as defined in `vercel.json`.
3. Provide environment variables in the Vercel dashboard (`APP_NAME`, etc.).
4. Deploy – the serverless function entry lives at `/api/index.ts` and exposes every Express route under `/api/*`.

## Project Structure
```
backend/
├── api/index.ts          # Vercel serverless entry, shares the Express app
├── src/app.ts            # Express app + middleware
├── src/config            # Env, database, logger helpers
├── src/constants         # Base JSON response templates
├── src/entities          # Domain entities / models
├── src/handlers          # HTTP handlers/controllers
├── src/middleware        # Express middleware (logger, auth, etc.)
├── src/parsers           # Request parsers & validators
├── src/repositories      # Data access abstractions + raw query modules
├── src/routes            # Feature routes (health, sample)
├── src/usecases          # Business logic layer
├── src/server.ts         # Local dev server bootstrap + graceful shutdown
├── .env.example
├── package.json
├── tsconfig.json
└── vercel.json
```

Feel free to add new routers inside `src/routes` and mount them in `src/routes/index.ts`. For more complex use cases (databases, auth, etc.), extend the repository/use case layers and wire up your actual DB client inside `src/config/database.ts` so the serverless handler and local server share the same configuration. Replace the pool stub with your real database driver and tie into the graceful shutdown flow by closing external connections in `closeDatabasePool`.
