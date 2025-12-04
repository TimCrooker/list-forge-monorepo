# ListForge Monorepo

AI-powered listing forge for resellers – snap photos, ListForge does the rest across marketplaces.

## Architecture

This is a Turborepo monorepo containing:

- **`apps/listforge-api`** - NestJS backend API with Passport.js JWT auth, TypeORM/Postgres, multi-tenant Users/Orgs
- **`apps/listforge-web`** - React + Vite frontend with Redux Toolkit, RTK Query, ShadCN UI
- **`packages/`** - Shared packages for types, API clients, UI components, and configs

See `ARCHITECTURE.md` for detailed architecture documentation.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for local Postgres/Redis)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start Docker services (Postgres & Redis):
   ```bash
   docker-compose up -d
   ```

3. Set up environment variables:
   ```bash
   cp apps/listforge-api/.env.example apps/listforge-api/.env
   cp apps/listforge-web/.env.example apps/listforge-web/.env
   ```

4. Run database migrations (when migrations are added):
   ```bash
   pnpm db:migrate
   ```

5. Start development servers:
   ```bash
   pnpm dev
   ```

   This will start:
   - API server at `http://localhost:3001`
   - Web app at `http://localhost:3000`

## Available Scripts

- `pnpm dev` - Run both apps in dev mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint entire monorepo
- `pnpm type-check` - Type check all packages
- `pnpm db:migrate` - Run TypeORM migrations
- `pnpm db:seed` - Seed dev data (when implemented)

## Project Structure

```
listforge/
  apps/
    listforge-web/          # React + Vite frontend
    listforge-api/          # NestJS backend
  packages/
    ui/                     # @listforge/ui (ShadCN-wrapped components)
    config/                 # @listforge/config (ESLint, TS, Tailwind configs)
    core-types/             # @listforge/core-types (domain types)
    api-types/              # @listforge/api-types (request/response DTOs)
    api-client/             # @listforge/api-client (Node fetch wrapper)
    api-rtk/                # @listforge/api-rtk (RTK Query slice)
    queue-types/            # @listforge/queue-types (BullMQ job definitions)
```

## Development

### Backend (listforge-api)

- NestJS 10+ with TypeORM and PostgreSQL
- Passport.js JWT authentication
- Multi-tenant architecture with Organizations
- Admin endpoints under `/admin/*`

### Frontend (listforge-web)

- React 18 + TypeScript + Vite
- Redux Toolkit + RTK Query for state management
- React Router v6 for routing
- Tailwind CSS for styling
- Uses `@listforge/ui` for components

## License

Private
