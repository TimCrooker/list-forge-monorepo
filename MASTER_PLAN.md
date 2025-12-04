# ListForge – High-Level Architecture

## 1. Product Overview

**Product name:** **ListForge**
**Tagline:** _AI-powered listing forge for resellers – snap photos, ListForge does the rest across marketplaces._

### 1.1 Vision & Goals

ListForge is a multi-tenant, AI-driven tool that allows resellers to:

- Log in (desktop or mobile web).
- Snap a few photos of an item.
- Automatically generate a rich, **meta listing** (title, description, attributes, pricing, shipping).
- Cross-post that listing to multiple marketplaces (eBay, Amazon, etc.) with minimal friction.

**Primary goals:**

- **Maximum automation:** Minimize human input. The user ideally just confirms and publishes.
- **Fast UX:** Snappy UI, quick AI results, responsive mobile experience.
- **Multi-tenant ready:** Built for productization (orgs, users, roles) even if first used for your own operation.
- **Admin visibility:** Simple but powerful admin tools for top-level management and debugging.

---

## 2. High-Level System Architecture

### 2.1 Core Components

1. **Frontend App – `listforge-web`**
   - Tech: React + Vite, Redux Toolkit, RTK Query.
   - Uses `@listforge/ui` (ShadCN-wrapped design system).
   - Provides:
     - Seller UI: photo intake, inventory, meta listings, marketplace connections.
     - Admin UI: `/admin` area for users/orgs/system oversight.

2. **Backend API – `listforge-api`**
   - Tech: NestJS, TypeORM, Postgres, Redis, BullMQ.
   - Responsibilities:
     - Auth, users, organizations, roles.
     - Items, meta listings, marketplace accounts.
     - AI workflow orchestration (in-app BullMQ processors).
     - Marketplace integration endpoints & webhooks.
     - Admin endpoints (`/admin/*`).

3. **AI & Orchestration (inside `listforge-api`)**
   - Uses LangChain / LangGraph (via `@listforge/ai-flows`) to:
     - Analyze photos (vision).
     - Research comps (eBay/Amazon).
     - Generate pricing recommendations.
     - Generate titles/descriptions per marketplace.

   - Steps are invoked via BullMQ jobs (in app).

4. **Marketplace Integrations**
   - Implemented in `@listforge/marketplace-adapters`.
   - Unified abstraction for:
     - Research (sold & active comps).
     - Creating/updating listings.
     - Handling webhooks (status updates, errors).

5. **Infrastructure**
   - **Database:** Postgres (TypeORM) for core models (users, orgs, items, listings, etc.).
   - **Cache / Queues:** Redis + BullMQ.
   - **Storage:** S3/R2/Vercel Blob or similar for item photos.
   - **Deployment:**
     - `listforge-web` on Vercel (or similar).
     - `listforge-api` as a long-running Node service (Render/Railway/Fly/Azure/etc.).

---

## 3. Monorepo Structure (Turborepo)

Root of the Turborepo:

```txt
listforge/
  apps/
    listforge-web/               # React + Vite, seller & admin UI
    listforge-api/               # NestJS API, BullMQ processors, AI flows

  packages/
    ui/                          # @listforge/ui          - ShadCN-wrapped components
    config/                      # @listforge/config      - ESLint, TS config, etc.
    core-types/                  # @listforge/core-types  - Cross-cutting domain types
    api-types/                   # @listforge/api-types   - DTOs for listforge-api
    api-client/                  # @listforge/api-client  - Typed API client (Node)
    api-rtk/                     # @listforge/api-rtk     - RTK Query slice
    queue-types/                 # @listforge/queue-types - BullMQ job names & payloads
    ai-flows/                    # @listforge/ai-flows    - LangGraph/LangChain flows & tools
    marketplace-adapters/        # @listforge/marketplace-adapters - eBay, Amazon, etc.
```

**Key patterns:**

- For each API (`listforge-api`):
  - `@listforge/api-types` – request/response DTOs.
  - `@listforge/api-client` – Node client wrapper.
  - `@listforge/api-rtk` – RTK Query wrapper for React.

- APIs **import** their DTOs from `@listforge/api-types` to keep server and clients in sync.

---

## 4. Domain & Data Model (High-Level)

### 4.1 Multi-Tenancy & Roles

**Global roles (system-level):**

```ts
type GlobalRole = 'user' | 'staff' | 'superadmin'
```

**Org roles (tenant-level):**

```ts
type OrgRole = 'owner' | 'admin' | 'member'
```

Core entities (in `@listforge/core-types`):

- `User` – global user identity.
- `Organization` – tenant.
- `UserOrganization` – membership + org role.

In DB (TypeORM):

- `users` – global users (id, email, name, globalRole, createdAt…).
- `organizations` – orgs (id, name, status).
- `user_organizations` – join table (userId, orgId, role).

**Tenancy rule:**
All tenant-scoped entities have an `orgId` column and are always read/written with respect to the **currentOrgId** extracted from the auth context.

### 4.2 Inventory & Listing Model

Key entities:

- `Item`
  - Belongs to an `Organization`.
  - Represents a physical item in inventory.
  - Fields: `id`, `orgId`, `status` (`draft`, `ready`, `listed`, `sold`, `archived`), `title`, etc.

- `ItemPhoto`
  - `itemId`, `storagePath`, `isPrimary`, etc.

- `MetaListing`
  - Canonical, AI-enriched representation of an item:
  - `id`, `itemId`, `attributes` (JSONB), `category`, `brand`, `model`, etc.
  - `priceSuggested`, `priceMin`, `priceMax`.
  - Generated `title`, `description`, `bulletPoints`, `shippingOptions`.
  - `aiStatus` (`pending`, `in_progress`, `complete`, `failed`, `needs_review`).

- `MarketplaceAccount`
  - Connection between an org and a marketplace.
  - Fields: `id`, `orgId`, `userId`, `marketplace` (`EBAY`, `AMAZON`, …), encrypted tokens, `status`.

- `MarketplaceListing`
  - Concrete listing per marketplace.
  - `id`, `metaListingId`, `marketplaceAccountId`, `remoteListingId`, `status`, `url`, `price`, etc.

- `WorkflowRun`
  - Tracks AI workflow execution.
  - `id`, `type` (`photo-intake-v1`, `price-refresh-v1`, …).
  - `itemId`, `orgId`, `userId`, `status`, `state` (JSONB for LangGraph state).

---

## 5. Backend Architecture (`listforge-api`)

### 5.1 Major Modules

- **AuthModule**
  - JWT-based auth.
  - Issues tokens containing `userId`, `globalRole`, `currentOrgId`.
  - `/auth/login`, `/auth/switch-org`, `/auth/me`.

- **UsersModule**
  - User CRUD (primarily for admin/internal use).
  - Provides user data for `/auth/me`.

- **OrganizationsModule**
  - Org creation (on onboarding).
  - List orgs for a user.
  - Org membership management (in collaboration with UsersModule).

- **ItemsModule**
  - `POST /items` – create item from photos.
  - `GET /items/:id` – retrieve item + meta listing status.
  - Applies tenancy based on `currentOrgId`.

- **MetaListingsModule**
  - `GET /meta-listings/:id` – view canonical listing.
  - `POST /meta-listings/:id/publish` – fan out to marketplaces.

- **MarketplaceConnectionsModule**
  - Marketplace OAuth flows.
  - CRUD over `MarketplaceAccount`.
  - Webhook endpoints for marketplace events.

- **AiWorkflowsModule**
  - BullMQ queue registration & processors.
  - Orchestrator that runs LangGraph flows.
  - Entry points for AI job handling (e.g. “photo-intake-v1”).

- **AdminModule**
  - Admin-only controllers under `/admin/*`.
  - User/org overview, marketplace connection visibility.
  - System metrics, job stats, impersonation.

### 5.2 Request Context & Tenancy

Each request passes through:

1. **Auth Guard**
   - Validates JWT.
   - Attaches `userId` and `globalRole` to `req`.

2. **Org Guard**
   - Validates `currentOrgId` in JWT is a real membership for the user.
   - Loads org membership (role).

A `RequestContext` object is attached to the request:

```ts
interface RequestContext {
	userId: string
	globalRole: GlobalRole
	currentOrgId: string
	orgRole: OrgRole
}
```

Controllers use a decorator like `@ReqCtx()` to access this context instead of trusting orgId passed in the body. This enforces multi-tenancy with minimal boilerplate and no overengineering.

### 5.3 API Types & Packages Pattern

- `listforge-api` **never defines external DTOs locally**.
- All request/response DTOs are defined in `@listforge/api-types`.
- The API imports those DTOs for controllers and services.

Example:

```ts
// apps/listforge-api/src/items/items.controller.ts
import {
  CreateItemRequest,
  CreateItemResponse,
} from '@listforge/api-types/items';

@Post()
async create(
  @ReqCtx() ctx: RequestContext,
  @Body() body: CreateItemRequest,
): Promise<CreateItemResponse> {
  const item = await this.itemsService.createFromPhotos({
    ...body,
    orgId: ctx.currentOrgId,
  });
  return { item };
}
```

This guarantees type-safety and sync between server, Node clients, and front-end.

---

## 6. AI & Workflow Architecture

### 6.1 Goals of AI Subsystem

- Automate item enrichment from photos:
  - Recognize item type, brand, model, key attributes.
  - Determine condition, category, and key text via OCR.

- Research comps:
  - Fetch sold & active listings on marketplaces.

- Recommend pricing:
  - Aggressive “sell fast” pricing by default; tuneable later.

- Generate listing content:
  - Titles, descriptions, bullet points tailored to each marketplace.

- Validate completeness:
  - Ensure required attributes for marketplaces are satisfied, or flag for human review.

### 6.2 BullMQ-Based Workflow Execution (Inside `listforge-api`)

- **Queue:** Registered via `AiWorkflowsModule`:
  - `QUEUE_AI_WORKFLOW = 'queue:ai-workflows'`.

- Producers (e.g. `ItemsService`) enqueue jobs when new items are created from photos.
- Processors (within the same NestJS app) run the workflow logic.

Example job payload (in `@listforge/queue-types`):

```ts
export interface StartWorkflowJob {
	workflowType: 'photo-intake-v1' | 'price-refresh-v1'
	itemId: string
	orgId: string
	userId: string
}
```

### 6.3 LangGraph / LangChain Flow

**Photo Intake Workflow (`photo-intake-v1`):**

1. **vision_extract**
   - Input: photos.
   - Uses a vision model to identify category, brand, model; runs OCR on labels.
   - Outputs: `baseAttributes`.

2. **normalize_attributes**
   - Normalizes free-text attributes into canonical enums where possible (condition, categories, brand names).

3. **search_comps**
   - Uses `@listforge/marketplace-adapters`:
     - `searchEbaySold(baseAttributes)`
     - `searchEbayActive(baseAttributes)`
     - `searchAmazonListings(baseAttributes)`

   - Outputs: `ResearchSnapshot` (normalized comps with pricing statistics).

4. **price_recommendation**
   - Uses heuristics and/or an LLM:
     - Derive `priceSuggested`, `priceMin`, `priceMax`.

5. **generate_meta_listing**
   - LLM generates:
     - `generatedTitle`
     - `generatedDescription`
     - `bulletPoints` (for Amazon)
     - Shipping suggestions.

   - Combines attributes + pricing + research summary.

6. **validate_and_finalize**
   - Checks required fields per marketplace capability.
   - Marks `MetaListing.aiStatus` as:
     - `complete` or
     - `needs_review` (with list of missing fields).

7. **persist_result**
   - Updates `Item`, `MetaListing`, `WorkflowRun` tables.

Front-end then polls or subscribes via RTK Query to see when the meta listing is ready.

---

## 7. Marketplace Integration Architecture

### 7.1 Adapters

`@listforge/marketplace-adapters` exposes a unified interface:

```ts
interface MarketplaceAdapter {
	name: 'EBAY' | 'AMAZON' | '...'

	searchComps(params: SearchCompsParams): Promise<ResearchResult>

	createListing(
		meta: CanonicalListing,
		creds: MarketplaceCredentials
	): Promise<PublishResult>

	updateListing?(
		remoteId: string,
		updates: Partial<CanonicalListing>,
		creds: MarketplaceCredentials
	): Promise<void>

	parseWebhook(
		payload: unknown,
		headers: Record<string, string>
	): MarketplaceEvent
}
```

The backend uses these adapters in:

- **AI research steps** (via `searchComps`).
- **Publish flows** (via `createListing`).
- **Webhook processing** (via `parseWebhook`).

### 7.2 Publishing Flow

1. User reviews a ready `MetaListing` in the UI.
2. User selects marketplaces + linked accounts.
3. UI calls `POST /meta-listings/:id/publish` with target marketplace account IDs.
4. Backend:
   - Validates permissions + org.
   - Enqueues one or more `PUBLISH_LISTING` BullMQ jobs.

5. Processor:
   - For each job, uses the corresponding adapter to `createListing`.
   - Stores `MarketplaceListing` with `remoteListingId` and `status`.

6. Webhooks:
   - Marketplaces send status changes.
   - ListForge updates `MarketplaceListing.status` (e.g. `live`, `ended`, `error`, `sold`).
   - Optionally marks `Item.status` as `sold` when all connected listings are sold/ended.

---

## 8. Frontend Architecture (`listforge-web`)

### 8.1 Stack

- React (TypeScript) + Vite.
- Redux Toolkit for global state.
- RTK Query for server data.
- `@listforge/ui` for all UI primitives (ShadCN-wrapped).

### 8.2 RTK Query Integration

`@listforge/api-rtk` provides a shared `api` slice:

- Base query configured with `/api` or direct backend URL.
- Auth token injected via `prepareHeaders`.
- Endpoints:
  - Auth: `me`, `login`, `switchOrg`.
  - Orgs: list orgs, create org.
  - Items & Meta listings.
  - Marketplace connections.
  - Admin endpoints (`adminListUsers`, `adminListOrgs`, `adminSystemMetrics`, etc.).

App store:

```ts
const store = configureStore({
	reducer: {
		[api.reducerPath]: api.reducer,
		auth: authSlice.reducer,
		// other slices...
	},
	middleware: (getDefault) => getDefault().concat(api.middleware),
})
```

### 8.3 Routing Layout

Main route structure:

- `/login` – authentication.
- `/onboarding` – create first org, connect marketplace, etc.
- `/items` – inventory overview.
- `/items/new` – new item from photos.
- `/items/:id` – item + meta listing detail, publish UI.
- `/settings` – user profile, org switcher.
- `/admin` – admin dashboard.
- `/admin/users`, `/admin/orgs`, `/admin/marketplaces` – admin tables & detail views.

Admin routes are **gated** via `globalRole` from `/auth/me`. If not `staff` or `superadmin`, they’re hidden / redirected.

### 8.4 UX Flows

**New Item: Snap → Draft**

- User opens `/items/new`.
- Uploads photos.
- RTK mutation `createItem` fires.
- UI shows “Processing…” state.
- Polls or refetches `GET /items/:id` or `GET /meta-listings/:id` until `aiStatus = 'complete' | 'needs_review'`.
- On completion, user lands on item detail with meta listing fully filled out.

**Publish Flow**

- On item detail, user:
  - Tweaks price/description if needed.
  - Chooses marketplaces & accounts.
  - Clicks “Publish everywhere”.

- RTK mutation `publishMetaListing`.
- UI shows per-marketplace publishing status, fed by `GET /marketplace-listings` or webhooks-triggered refetch.

---

## 9. Admin Features (Minimal but High ROI)

Admin capabilities (via `/admin`):

1. **User Management**
   - View list of users (email, name, globalRole, createdAt, lastLogin).
   - See org memberships.
   - Change `globalRole` between `user`, `staff`, `superadmin`.
   - Optionally disable/lock a user.

2. **Organization Management**
   - List all orgs with basic stats:
     - User count
     - Item count
     - Marketplace account count

   - View org detail:
     - Members + roles
     - Recent activity / items.

   - Toggle org `status` (`active` / `suspended`).

3. **Marketplace Connections**
   - List all marketplace accounts across orgs.
   - Filter by marketplace, status, org.
   - Force-disable bad connections (abuse/spam control).

4. **System Metrics / Health**
   - `GET /admin/system/metrics` exposes:
     - Queue sizes (waiting, active, failed per BullMQ queue).
     - Total counts: users, orgs, items, meta listings.

   - UI shows an admin dashboard card grid summarizing system health.

5. **Impersonation (optional but powerful)**
   - Admin selects a user → obtains an impersonation token.
   - Frontend uses this token to open a new session acting as that user.
   - Extremely useful for debugging tenant-specific issues.

Admin sits entirely in `listforge-web`, using RTK Query hooks from `@listforge/api-rtk`.

---

## 10. Security & Auth

- **Auth mechanism:** JWT-based HTTP auth.

- **Token contents:**
  - `sub` (userId)
  - `globalRole`
  - `currentOrgId`
  - expiry claims (short-lived access tokens).

- **Org switching:**
  - `/auth/switch-org` updates `currentOrgId` in a newly issued JWT.

- **Access control:**
  - Tenant-level: enforced via `currentOrgId` + membership.
  - Admin-level: any `/admin/*` route requires `globalRole ∈ { 'staff', 'superadmin' }`.

- **Credentials:**
  - Marketplace secrets & tokens stored encrypted at rest.
  - Redis credentials secured via environment variables.

---

## 11. Deployment & Environments

### 11.1 Environments

- **Dev**
  - `listforge-web` dev server locally.
  - `listforge-api` on local Node with Dockerized Postgres & Redis.

- **Staging**
  - Hosted `listforge-api` & `listforge-web` against staging DB & Redis.
  - Test marketplace sandbox accounts.

- **Production**
  - `listforge-web` on Vercel or equivalent.
  - `listforge-api` on a long-lived Node platform (Railway/Fly/Azure/etc.).
  - Managed Postgres (e.g., Neon, RDS).
  - Managed Redis (Upstash/Redis Cloud).

### 11.2 CI/CD

- Monorepo CI (GitHub Actions or similar):
  - `pnpm lint`, `pnpm test`, `pnpm build` with Turborepo caching.
  - Deploy `listforge-web` and `listforge-api` from main branch (trunk-based).

---

## 12. Phased Implementation Roadmap (High Level)

**Phase 1 – Skeleton & Core Tenancy**

- Turborepo structure & base configs.
- `listforge-api` with:
  - Auth, Users, Organizations, simple multi-tenancy.

- `listforge-web` with login, org onboarding, and basic layout.
- `@listforge/api-types`, `@listforge/api-rtk`, `@listforge/ui` v1.

**Phase 2 – Items & AI MVP**

- `Item`, `ItemPhoto`, `MetaListing` models.
- Photo upload → `POST /items`.
- BullMQ integration + simple AI pipeline (even if mocked initially).
- Basic item detail page showing AI result.

**Phase 3 – Marketplace Integrations**

- eBay integration via `@listforge/marketplace-adapters`.
- Marketplace connection setup UI.
- Publish flow for eBay only.
- Admin dashboard with simple metrics.

**Phase 4 – Multi-Marketplace & Enhanced Admin**

- Add Amazon adapter.
- Multi-marketplace publish & status sync.
- Flesh out admin tables for users/orgs/marketplace accounts.
- System health dashboard from queues + DB.

---

If you want, next step we can do is turn this into a **living `ARCHITECTURE.md`** with more concrete table schemas / TypeORM entities for the core models (User, Org, Item, MetaListing, MarketplaceAccount), so you can drop it straight into the repo and iterate from there.
