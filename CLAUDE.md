# ListForge - Claude Instructions

AI-powered multi-marketplace listing tool. Users upload item photos → AI extracts attributes → researches comps → generates listings → publishes to eBay/Amazon/Facebook.

## Quick Reference

```bash
pnpm dev          # Start all apps
pnpm build        # Build all packages
pnpm db:migrate   # Run migrations
pnpm type-check   # TypeScript check
```

```typescript
// Package imports - ALWAYS use these, never duplicate functionality
import { Item, LifecycleStatus } from '@listforge/core-types';
import { CreateItemDto } from '@listforge/api-types';
import { SocketEvents, Rooms } from '@listforge/socket-types';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { useListItemsQuery } from '@listforge/api-rtk';
```

## Monorepo Structure

```
apps/
  listforge-api/      # NestJS backend
  listforge-web/      # React + Vite + TanStack Router
  listforge-mobile/   # React Native (Expo SDK 54)
  listforge-landing/  # Marketing landing page
packages/
  core-types/         # Domain entity types (Item, Organization, etc.)
  api-types/          # Request/response DTOs with class-validator
  api-rtk/            # RTK Query hooks for React
  socket-types/       # WebSocket events and room helpers
  queue-types/        # BullMQ queue names and job payloads
  ui/                 # ShadCN-wrapped React components
  marketplace-adapters/  # eBay/Amazon API adapters
  config/             # Shared tsconfig, eslint, tailwind
```

## Critical Rules

### Multi-Tenancy - YOU MUST FOLLOW

1. Every org-scoped entity has `organizationId` column
2. **NEVER trust `orgId` from request body** - read from JWT/RequestContext only
3. All queries MUST filter by `organizationId` unless explicitly global
4. JWT contains: `userId`, `globalRole`, `currentOrgId`

### Package Usage - MANDATORY

- **NEVER call `fetch` directly** in React - use `@listforge/api-rtk` hooks
- **NEVER define inline DTOs** - import from `@listforge/api-types`
- **NEVER import raw ShadCN** - use `@listforge/ui` wrapped components
- **NEVER hardcode queue names** - import from `@listforge/queue-types`
- Do not introduce alternative state managers, HTTP clients, or ORMs

### Code Style

- Controllers: thin, validate inputs, call services, return DTOs
- Business logic: belongs in services only
- Prefer clarity over cleverness
- Keep it simple - avoid over-engineering
- **Use enums for status/state/source values** - define in `core-types`, import downstream for validated type safety across all apps

## Backend Patterns (NestJS)

### Request Context
```typescript
// OrgGuard populates this, access via @ReqCtx() decorator
interface RequestContext {
  userId: string;
  globalRole: 'user' | 'staff' | 'superadmin';
  currentOrgId: string;
  orgRole: 'owner' | 'admin' | 'member';
}

// Controller usage
@UseGuards(JwtAuthGuard, OrgGuard)
@Get()
async list(@ReqCtx() ctx: RequestContext) {
  return this.service.findAll(ctx);
}

// Service - ALWAYS filter by org
async findAll(ctx: RequestContext) {
  return this.repo.find({ where: { organizationId: ctx.currentOrgId } });
}
```

### Entity Conventions
- UUID primary keys
- JSONB for nested data (attributes, media)
- Composite indexes: `[organizationId, createdAt]`
- Explicit foreign key columns

### Guards
- `JwtAuthGuard` - validates JWT
- `OrgGuard` - validates org membership, populates RequestContext
- `AdminGuard` - requires `globalRole` in `['staff', 'superadmin']`

### BullMQ Jobs
```typescript
// Import from queue-types, not hardcoded strings
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';

@InjectQueue(QUEUE_AI_WORKFLOW) private queue: Queue<StartResearchRunJob>
```

## Frontend Patterns (React)

### Data Fetching - RTK Query Only
```typescript
// CORRECT - use hooks from @listforge/api-rtk
const { data, isLoading } = useListItemsQuery({ status: 'draft' });
const [updateItem] = useUpdateItemMutation();

// WRONG - never do this
const data = await fetch('/api/items');
```

### TanStack Router Structure
```
src/routes/
├── _authenticated/     # Protected layout
│   ├── items/
│   │   ├── index.tsx  # /items
│   │   └── $id.tsx    # /items/:id
│   └── settings/
└── login.tsx          # Public
```

### Socket Events
```typescript
import { SocketEvents, Rooms } from '@listforge/socket-types';
socket.emit('join', { room: Rooms.chatSession(sessionId) });
socket.on(SocketEvents.CHAT_MESSAGE, handler);
```

## Type System

### Key Domain Types (core-types)
```typescript
LifecycleStatus: 'draft' | 'ready' | 'listed' | 'sold' | 'archived'
AiReviewState: 'none' | 'pending' | 'researching' | 'ai_reviewed' | 'approved' | 'rejected'
ItemSource: 'ai_capture' | 'manual'
GlobalRole: 'user' | 'staff' | 'superadmin'
OrgRole: 'owner' | 'admin' | 'member'
```

### Package Responsibilities
- `core-types`: Pure TS types/interfaces, NO runtime logic, NO framework imports
- `api-types`: DTOs with class-validator decorators, API boundary types only
- `socket-types`: Event names as const, payload interfaces, Room helpers
- `queue-types`: Queue name constants, job payload interfaces

**IMPORTANT**: In `core-types/index.ts`, export order matters - `research.ts` before `evidence.ts`

## AI Workflows (LangGraph)

Located in `apps/listforge-api/src/ai-workflows/graphs/research/`

Graph phases: `identification` → `parallel` (comps/pricing) → `assembly`

State uses bounded reducers to prevent memory leaks:
```typescript
comps: Annotation<ResearchEvidenceRecord[]>({
  reducer: boundedCompsReducer,  // Keeps top 100 by score
})
```

Keep AI workflow logic in services, separate from HTTP controllers.

## Error Handling

```typescript
// Use AppException for business logic errors
throw new AppException(
  ErrorCodes.ITEM_NOT_FOUND,
  HttpStatus.NOT_FOUND,
  'Item not found',
);
```

- Log full errors server-side
- Return sanitized errors to client
- Use error codes, not just messages

## Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types: `PascalCase`

## Security Checklist

- Validate all input with DTOs
- NEVER trust orgId from request body
- Encrypt sensitive data (OAuth tokens)
- Rate limiting via ThrottlerModule
- Never expose internal errors in production

## Mobile (React Native/Expo)

Offline-first with SQLite + background sync. Camera capture via expo-camera.

Redux store matches web app, uses same `@listforge/api-rtk` when online.

## Development Setup

```bash
docker-compose up -d    # Postgres, Redis, MinIO
pnpm install
pnpm db:migrate
pnpm dev
```

Servers: API :3001, Web :3000, Mobile: Expo QR

## Key Architecture Decisions

- **Unified Item Model**: Single `Item` entity with `lifecycleStatus` + `aiReviewState` (no separate draft/inventory)
- **LangGraph**: Checkpointing for resumability, conditional routing
- **Field-Driven Research**: Per-field confidence tracking for targeted re-research
- **Offline-First Mobile**: SQLite sync for poor connectivity environments
- **Marketplace Adapters**: Common interface, isolated marketplace logic
