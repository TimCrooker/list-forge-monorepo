```markdown
# Phase 6 – Single Item Model & Unified Flows

_ListForge_

> **Goal:** Simplify the system by consolidating “draft” and “inventory” into a **single AI-native `Item` model**, while still supporting:
>
> - AI capture → review → inventory → marketplace flows
> - Manual item creation
> - Future AI chat agent that can reason about and mutate items at any point

This phase replaces the separate `ListingDraft` vs `InventoryItem` concept with one central **Item** entity + linked research and marketplace records.

---

## 1. Scope of Phase 6

This phase focuses on:

1. Defining and implementing a **single `Item` model** that:
   - Represents both draft & live inventory.
   - Holds a superset of listing fields.
   - Tracks AI review state and lifecycle state.

2. Supporting **two main creation flows**:
   - **AI capture**: images + minimal description → AI pipeline → human approval/rejection.
   - **Manual listing**: user fills details via form, with optional AI assist.

3. Designing clear **status-driven workflows**:
   - Where items show up based on:
     - `lifecycleStatus`: draft/ready/listed/sold/archived
     - `aiReviewState`: none/pending/approved/rejected
     - `source`: ai_capture/manual

4. Defining **Research & Evidence** models:
   - `ItemResearchRun` + `EvidenceBundle` attached to Item.
   - Kept long-term as a “research cache” for future agents.

5. Defining **MarketplaceListing** model linking out from Item:
   - Marketplace-specific listing state and config.
   - Divergence allowed; Item is still the master.

6. Designing high-level **APIs & UI surfaces**:
   - Capture, AI Review Deck, Needs Work queue, Inventory, Marketplace listings, and Item Detail view with chat.

> **Non-goals for Phase 6:**
>
> - Actual marketplace publish flows (eBay API calls) beyond minimal stubbing.
> - SKU/templates or reusable catalog structures.
> - Concurrency controls (locks, conflict resolution).
> - Versioning of Item fields.

---

## 2. Core Domain Models

### 2.1 Item – single master entity

**Item** is the central entity.
It is simultaneously:

- The **draft** when first created.
- The **inventory record** once it’s ready.
- The **historical record** after sale or archival.
- The primary context for AI chat, research, and marketplace links.

#### 2.1.1 Identity & provenance

- `id`
- `organizationId`
- `createdByUserId`
- `createdAt`, `updatedAt`
- `source`:
  - `"ai_capture"` – created via AI capture tool (images + minimal description).
  - `"manual"` – created via manual form.

#### 2.1.2 Status fields

Two orthogonal status axes:

1. **Lifecycle status** – where the item is in its lifecycle:
   - `lifecycleStatus`:
     - `"draft"` – not yet inventory-ready; needs AI/ human work.
     - `"ready"` – considered inventory-ready; can be listed.
     - `"listed"` – at least one active marketplace listing (live).
     - `"sold"` – all quantity sold.
     - `"archived"` – no longer active (disposed, permanently removed).

2. **AI review state** – how the AI flow was used and evaluated:
   - `aiReviewState`:
     - `"none"` – no AI review/pipeline involved (e.g., manually created items).
     - `"pending"` – AI processing/review in progress or awaiting human AI-approval decision.
     - `"approved"` – AI-produced details were accepted as “good enough” without needing deeper human rework.
     - `"rejected"` – AI output was not sufficient; human intervention was required/is required.

**Interpretation:**

- **AI capture path:**
  - New AI item: `lifecycleStatus="draft"`, `aiReviewState="pending"`.
  - AI-approved item: `lifecycleStatus="ready"`, `aiReviewState="approved"`.
  - AI-rejected item needing work: `lifecycleStatus="draft"`, `aiReviewState="rejected"`.

- **Manual path:**
  - Manual item: `lifecycleStatus="ready"`, `aiReviewState="none"`.

#### 2.1.3 Superset listing fields

These fields are a generic superset that cover common needs across marketplaces.

**Core listing fields:**

- `title`
- `subtitle` (optional)
- `description`
- `condition` (generic enum, later mapped to marketplace-specific enums)
  - e.g. `"new"`, `"used_like_new"`, `"used_very_good"`, `"used_good"`, `"used_acceptable"`.

**Category:**

- `categoryPath`: array of strings, e.g. `["Electronics", "Cameras", "Film Cameras"]`
- `categoryId`: internal generic category ID

**Attributes (item specifics):**

- `attributes`: array of objects:
  - `key` – e.g. `"Brand"`, `"Model"`, `"Size"`, `"Color"`
  - `value`
  - `source` – `"ai" | "user" | "imported"`
  - `confidence` – float 0–1 for AI-sourced

**Quantity & pricing:**

- `quantity` – integer, supports quantity > 1 where needed.
- `defaultPrice` – numeric
- `currency` – e.g. `"USD"`
- Optional range hints:
  - `priceMin`, `priceMax`
- `pricingStrategy` – optional label (`"aggressive"`, `"balanced"`, `"premium"`)

**Shipping (generic):**

- `shippingType` – `"flat" | "local_pickup" | "calculated"`
- `flatRateAmount` – numeric (if `flat`)
- `domesticOnly` – boolean
- Optional:
  - `weight`, `dimensions` for future shipping logic.

**Media:**

- `media`: array of:
  - `url`
  - `sortOrder`
  - `isPrimary`
  - optional `width`, `height`

**Operational fields:**

- `location` – internal warehouse/bin label.
- `costBasis` – cost of acquiring the item.
- `tags` – internal labels; e.g. `["high_priority", "bulk_intake"]`.

#### 2.1.4 AI metadata on Item

Stored directly on the Item:

- `aiPipelineVersion` – last pipeline version that updated the item.
- `aiLastRunAt`
- `aiLastRunError` (optional string)
- Optional `aiConfidenceScore` (aggregate confidence).

---

### 2.2 ItemResearchRun – research history

Represents a single research session executed against an Item.

**Fields:**

- `id`
- `itemId`
- `runType`: e.g. `"initial_intake"`, `"pricing_refresh"`, `"category_check"`
- `startedAt`
- `completedAt`
- `status`: `"pending" | "running" | "success" | "error"`
- `pipelineVersion` – which AI pipeline or agent flow was used.
- Optional:
  - `errorMessage`
  - brief `summary` of the run’s purpose/results.

ItemResearchRuns allow:

- Storing multiple research passes over time.
- Using them as a **research cache** and timeline.

---

### 2.3 EvidenceBundle & EvidenceItem

Attached to a specific research run (and item), not directly embedded in the Item.

**EvidenceBundle:**

- `id`
- `itemId`
- `researchRunId`
- `createdAt`
- `items: EvidenceItem[]`

**EvidenceItem examples:**

- `type: "marketplace_sold"`
  - `marketplace` (e.g. `"ebay"`)
  - `url`
  - `title`
  - `price`
  - `shippingCost`
  - `soldDate`
  - `condition`
  - `thumbUrl`
  - `relevanceScore`

- `type: "marketplace_active"`
  - Similar fields; may include `timeLeft`, `sellerRating`, etc.

- `type: "article_metadata"`
  - `url`
  - `title`
  - `snippet`
  - `siteName`

- `type: "summary"`
  - `kind`: `"pricing_overview" | "condition_overview" | "category_justification" | ...`
  - `text`
  - optional structured stats, e.g. `avgPrice`, `medianPrice`, `minPrice`, `maxPrice`.

All EvidenceBundles are kept for the long term (no compaction in MVP).

---

### 2.4 MarketplaceListing

Represents how a given Item is configured/listed on a specific marketplace.

**Fields:**

- `id`
- `itemId`
- `organizationId`
- `marketplace`: `"ebay"` (initially), later `"amazon"`, etc.
- `marketplaceItemId` – external ID once published (or null if not listed yet)

- Marketplace-specific listing state:
  - `listingStatus`:
    - `"not_listed"` – configuration exists, but not published.
    - `"listing_pending"` – in process of being created.
    - `"listed"` – live.
    - `"sold"` – sold on this marketplace.
    - `"ended"` – ended/cancelled.
    - `"error"` – error in publish/update.

- Marketplace-specific data (can diverge from Item):
  - `title`
  - `description`
  - `price`
  - `currency`
  - `marketplaceCategoryId`
  - `marketplaceAttributes` – mapping of Item attributes to marketplace-specific schema.
  - `shippingProfile` or shipping configuration.

**Sync semantics (MVP):**

- Master is **Item**:
  - When Item fields change, we **may** sync those changes to MarketplaceListings via explicit actions (e.g. “Sync to eBay” button).
- Marketplace divergence is allowed:
  - Changes on the marketplace DO NOT get written back into the Item.
  - The Item remains the canonical source of truth internally.

---

## 3. Creation & Review Flows

### 3.1 Flow A – AI Capture → AI Review → Inventory

**Goal:** User uses capture tool to create items via images + hints; AI populates details; human approves or sends to work queue.

#### 3.1.1 Capture (mobile or desktop)

**User experience:**

- Capture screen (mobile-first, but also available on desktop):
  - Large photo upload / camera component.
  - Optional “What is this?” text field for hints.

**System behavior:**

1. On save, create `Item`:
   - `source = "ai_capture"`
   - `lifecycleStatus = "draft"`
   - `aiReviewState = "pending"`
   - Minimal fields:
     - Media
     - Optional `title`/`description` hints

2. Kick off an `ItemResearchRun` with `runType="initial_intake"`:
   - Launch AI pipeline (vision, OCR, comps, etc.).

3. When AI pipeline completes:
   - Populate Item fields:
     - `title`, `description`, `condition`, `categoryPath`, `categoryId`, `attributes`, `defaultPrice`, `shippingType`, etc.
   - Create `EvidenceBundle` linked to this `ItemResearchRun`.
   - Update `aiPipelineVersion`, `aiLastRunAt`.
   - Keep:
     - `lifecycleStatus = "draft"`
     - `aiReviewState = "pending"` (until human explicit decision).

AI-captured items now appear in the **AI Review Deck**.

---

### 3.2 Flow B – AI Review Deck (Approve vs Reject)

**Goal:** Let reviewers quickly decide whether AI got it right “first try”, or whether human work is needed.

**Filter for AI Review Deck:**

- Items where:
  - `source = "ai_capture"`
  - `lifecycleStatus = "draft"`
  - `aiReviewState = "pending"`

**Reviewer actions:**

1. **Approve**
   Meaning: “AI output is good enough; this item is inventory-ready.”
   - System updates:
     - `aiReviewState = "approved"`
     - `lifecycleStatus = "ready"` ← now part of inventory.
   - Item disappears from AI Review Deck.
   - Item appears in **Inventory** / “Ready to List” views.

2. **Reject**
   Meaning: “AI didn’t nail it; needs human intervention.”
   - System updates:
     - `aiReviewState = "rejected"`
     - `lifecycleStatus = "draft"` (still not inventory-ready)
   - Item disappears from AI Review Deck.
   - Item appears in **Needs Work** queue.

Reviewer can still open Item Detail for deeper inspection (evidence, etc.) before deciding.

---

### 3.3 Flow C – Needs Work Queue (Human Intervention after Reject)

**Goal:** Provide a dedicated UI for items where AI failed and human edits are required.

**Filter for Needs Work:**

- Items where:
  - `lifecycleStatus = "draft"`
  - `aiReviewState = "rejected"`

**Needs Work UI:**

For each Item:

- Show:
  - Current Item fields (title, description, pricing, condition, attributes, media).
  - AI-generated evidence (via latest relevant `EvidenceBundle`).
- Provide:
  - Full edit form for manual corrections.
  - **Chat agent panel**:
    - Ask questions about comps, condition, category.
    - Ask AI to refine title/description/price with new human inputs.
  - Button: **“Mark Ready”** when human is satisfied.

**On “Mark Ready”:**

- System sets:
  - `lifecycleStatus = "ready"`
  - `aiReviewState` remains `"rejected"` (historic truth: AI needed help).
- Item now appears in Inventory and can be listed.

---

### 3.4 Flow D – Manual Item Creation (Inventory-first)

**Goal:** User creates item manually, optionally using AI helpers, and it is immediately inventory-ready.

**UX (desktop-first):**

- “New Item (Manual)” page with:
  - Media upload.
  - Title, description, condition, category, attributes.
  - Quantity, price, shipping, location, costBasis.
  - Optional “Use AI” buttons:
    - “Suggest price from comps.”
    - “Improve title/description.”

**System behavior:**

On save:

- Create `Item`:
  - `source = "manual"`
  - `lifecycleStatus = "ready"` (inventory-ready)
  - `aiReviewState = "none"`

- Optionally create a small `ItemResearchRun` if user used any AI helpers, but this is not required for MVP.

**Result:**

- Item immediately appears in **Inventory** and “Ready to List”.
- It never appears in AI Review Deck (since `aiReviewState = "none"`).

---

### 3.5 Flow E – Inventory → Marketplace Listings (structural)

**Goal:** From inventory-ready items, define the shape of marketplace configs (full publishing implementation is later phase).

**Filter for Ready-to-List:**

- Items where:
  - `lifecycleStatus = "ready"`.

**From Item Detail > Marketplaces tab:**

1. User clicks **“Create eBay Listing”**:
   - UI:
     - Pre-fills marketplace listing form from Item fields.
       - Title, description, price, condition, category suggestion, attributes, shipping.
     - Allows user to adjust marketplace-specific details (category ID, price, shipping profile).
   - System:
     - Creates `MarketplaceListing` with:
       - `itemId = this Item`
       - `marketplace = "ebay"`
       - `listingStatus = "not_listed"`.

2. **Publish (stubbed in Phase 6)**:
   - “Publish to eBay” button:
     - For now: stub behavior that:
       - Sets `listingStatus = "listed"`.
       - Sets `marketplaceItemId = "stubbed-id"`.

3. Updating Item status on listing:
   - When any `MarketplaceListing` transitions to `"listed"`, set:
     - `Item.lifecycleStatus = "listed"`.

4. Sale (future): when MarketplaceListing is `"sold"` and quantity hits zero, set:
   - `Item.lifecycleStatus = "sold"`.

---

## 4. UI & Navigation

### 4.1 Top-level sections

1. **Capture / Intake**
   - Purpose: Rapid ingestion via AI capture.
   - Shows:
     - Capture UI (camera/upload + hint).
     - List of recently captured Items (`source="ai_capture"`) with mini statuses:
       - `aiReviewState` + `lifecycleStatus`.

2. **AI Review Deck**
   - Purpose: Approve/reject AI outputs.
   - Shows Items with:
     - `source = "ai_capture"`
     - `lifecycleStatus = "draft"`
     - `aiReviewState = "pending"`

3. **Needs Work**
   - Purpose: Human intervention queue for AI-rejected items.
   - Shows Items with:
     - `lifecycleStatus = "draft"`,
     - `aiReviewState = "rejected"`.

4. **Inventory**
   - Purpose: Manage items that are inventory-ready or beyond.
   - Default filter:
     - `lifecycleStatus IN ("ready", "listed", "sold")`.
   - Columns:
     - Title, quantity, price, status (lifecycle + AI), marketplace summary badges.

5. **Marketplace Listings**
   - Purpose: View and manage `MarketplaceListing`s.
   - Filters:
     - Marketplace, `listingStatus`, etc.

6. **Search / All Items**
   - Purpose: Unified item search.
   - Shows any Item regardless of status.
   - Useful for global lookup and chat integration.

---

### 4.2 Item Detail Page (Hub for everything)

The Item Detail page is the central hub for all operations on an item.

**Sections:**

- **Header:**
  - Title, ID.
  - Badges:
    - `lifecycleStatus` (draft/ready/listed/sold/archived).
    - `aiReviewState` (none/pending/approved/rejected).
    - `source` (manual/ai_capture).
- **Media gallery**
- **Core details:**
  - Title, description, condition, category, attributes, pricing, quantity.
- **Inventory panel:**
  - location, costBasis, tags.
- **Marketplaces tab:**
  - List of `MarketplaceListing`s.
  - Buttons to create new marketplace listings.
- **Research tab:**
  - List of `ItemResearchRun`s with dates and run types.
  - Expand to see EvidenceBundle for each run (comps, summaries, etc.).
- **AI metadata snippet:**
  - Last pipeline version, last run time, last error if any.

**Chat agent panel (persistent on Item detail):**

- Context-aware of this Item.
- Core capabilities (design target for future implementation):
  - Answer questions about comps, condition, and listing quality.
  - Trigger new `ItemResearchRun`s (e.g. “re-check pricing with latest comps”).
  - Suggest edits (titles, descriptions, attribute changes).
  - Apply edits to the Item when the user confirms.

MVP: Chat may be stubbed or partially implemented; the **page-level integration point** must exist.

---

## 5. API Surface (Conceptual)

> Naming/routes are conceptual; adjust as needed.
> All APIs are org-scoped and must enforce organization-level access.

### 5.1 Item APIs

- **POST `/items/ai-capture`**
  - Purpose:
    - Create an AI-capture Item (from media + hint).
  - Input:
    - Media references (URLs/IDs).
    - Optional hint text.
  - Output:
    - Newly created Item summary (with `source="ai_capture"`, `lifecycleStatus="draft"`, `aiReviewState="pending"`).
  - Side effects:
    - Enqueue `ItemResearchRun` (initial_intake).

- **POST `/items/manual`**
  - Purpose:
    - Create a manual Item.
  - Input:
    - All relevant fields: title, description, condition, category, attributes, price, shipping, quantity, etc.
  - Output:
    - Newly created Item (`source="manual"`, `lifecycleStatus="ready"`, `aiReviewState="none"`).

- **GET `/items`**
  - Purpose:
    - General list/search endpoint.
  - Filters:
    - `lifecycleStatus`, `aiReviewState`, `source`, date ranges, etc.
  - Used to power Inventory, Needs Work, AI Review Deck lists (with appropriate filters).

- **GET `/items/:id`**
  - Purpose:
    - Load full Item details for Item Detail page.

- **PATCH `/items/:id`**
  - Purpose:
    - Update Item fields (title, description, attributes, inventory info, etc.).
  - Behavior:
    - Does not automatically change AI statuses; those are controlled by review actions and explicit status changes.

---

### 5.2 AI Review & Needs Work APIs

- **GET `/items/review/ai-queue`**
  - Purpose:
    - Items for AI Review Deck.
  - Internal filter:
    - `source="ai_capture"`, `lifecycleStatus="draft"`, `aiReviewState="pending"`.

- **POST `/items/:id/review/ai-approve`**
  - Purpose:
    - Approve AI result.
  - Behavior:
    - Set:
      - `aiReviewState = "approved"`
      - `lifecycleStatus = "ready"`.

- **POST `/items/:id/review/ai-reject`**
  - Purpose:
    - Reject AI result.
  - Behavior:
    - Set:
      - `aiReviewState = "rejected"`
      - `lifecycleStatus = "draft"`.

- **GET `/items/review/needs-work`**
  - Purpose:
    - Items that need human intervention.
  - Internal filter:
    - `lifecycleStatus="draft"`, `aiReviewState="rejected"`.

- **POST `/items/:id/mark-ready`**
  - Purpose:
    - Mark an item as inventory-ready after human fixes (from Needs Work).
  - Behavior:
    - Set:
      - `lifecycleStatus = "ready"` (AI state unchanged, usually `"rejected"`).

---

### 5.3 Research & Evidence APIs

- **POST `/items/:id/research`**
  - Purpose:
    - Trigger a new research run (e.g., for pricing refresh).
  - Input:
    - `runType` (optional, default `"manual_request"`).
  - Behavior:
    - Creates `ItemResearchRun` with `status="pending"`.
    - Enqueues AI pipeline.

- **GET `/items/:id/research-runs`**
  - Purpose:
    - List research runs for an item.

- **GET `/research-runs/:id/evidence`**
  - Purpose:
    - Load EvidenceBundle for a specific research run.

---

### 5.4 MarketplaceListing APIs

- **POST `/items/:id/marketplace-listings`**
  - Purpose:
    - Create marketplace listing config for an Item.
  - Input:
    - `marketplace`
    - Optional overrides (price, marketplaceCategoryId, etc.).
  - Output:
    - MarketplaceListing with `listingStatus="not_listed"`.

- **GET `/items/:id/marketplace-listings`**
  - Purpose:
    - List marketplace listings for an item.

- **GET `/marketplace-listings`**
  - Purpose:
    - Global view of marketplace listings.
  - Filters:
    - marketplace, listingStatus, itemId, etc.

- **PATCH `/marketplace-listings/:id`**
  - Purpose:
    - Update marketplace listing configuration.

- **POST `/marketplace-listings/:id/publish`** (stub for MVP)
  - Purpose:
    - Simulate publishing listing.
  - Behavior (Phase 6):
    - Set:
      - `listingStatus = "listed"`
      - `marketplaceItemId = "stubbed-id"`.
    - Also set:
      - `item.lifecycleStatus = "listed"` if not already.

---

## 6. State Transitions & Invariants

### 6.1 Lifecycle status transitions

Allowed transitions:

- `"draft"` → `"ready"` (AI approve or Mark Ready)
- `"ready"` → `"listed"` (when at least one MarketplaceListing is listed)
- `"listed"` → `"sold"` (when quantity hits 0 or marketplace indicates sold)
- `"ready"` → `"archived"` (manual action)
- `"listed"` → `"archived"` (manual action: pulled from sale)
- `"sold"` → `"archived"` (optional manual clean-up)

No automatic transitions back into `"draft"`.

### 6.2 AI review state transitions

Allowed transitions:

- `"pending"` → `"approved"` (AI Review Deck approve)
- `"pending"` → `"rejected"` (AI Review Deck reject)
- `"none"` remains `"none"` unless later you decide to annotate manual items with AI outcomes.

No automatic transitions back to `"pending"`. Re-running AI does not reset review state in MVP; it just refreshes research and suggestions.

### 6.3 Creation invariants

- AI capture:
  - Starts as: `source="ai_capture"`, `lifecycleStatus="draft"`, `aiReviewState="pending"`.
- Manual:
  - Starts as: `source="manual"`, `lifecycleStatus="ready"`, `aiReviewState="none"`.

### 6.4 Marketplace invariants

- Each MarketplaceListing belongs to exactly one `itemId`.
- MarketplaceListings do not mutate Item; Item is master.

---

## 7. Acceptance Criteria (what must be true at end of Phase 6)

1. **Single Item model is implemented** as central entity.
2. **Status fields exist and are used as designed:**
   - `lifecycleStatus` with values `"draft" | "ready" | "listed" | "sold" | "archived"`.
   - `aiReviewState` with values `"none" | "pending" | "approved" | "rejected"`.
   - `source` with values `"ai_capture" | "manual"`.

3. **AI capture flow works end-to-end:**
   - POST `/items/ai-capture` creates Item with correct statuses.
   - AI pipeline populates fields and attaches at least one `ItemResearchRun` + `EvidenceBundle`.
   - Item appears in AI Review Deck.
   - Approve/Reject actions set statuses per spec.
   - Approved items appear in Inventory (`ready`).
   - Rejected items appear in Needs Work (`draft/rejected`), and Mark Ready works.

4. **Manual flow works:**
   - POST `/items/manual` creates Item with `ready/none`.
   - Manual items appear in Inventory immediately.

5. **Needs Work queue exists:**
   - View/API for items with `draft/rejected`.
   - Ability to edit and Mark Ready correctly promotes them to `ready`.

6. **MarketplaceListing exists and links from Item:**
   - Can create marketplace listings from Items.
   - Can change `listingStatus`.
   - Setting any MarketplaceListing to `"listed"` can mark Item as `"listed"`.

7. **Research & Evidence models exist and link correctly:**
   - `ItemResearchRun` linked to Item.
   - `EvidenceBundle` linked to ResearchRun and Item.
   - Multiple research runs are stored; no deletion/compaction.

8. **UI surfaces exist (even if minimal initially):**
   - Capture UI.
   - AI Review Deck.
   - Needs Work queue.
   - Inventory list.
   - Item Detail page that shows statuses, marketplaces, research list.
   - Marketplace listings view.

9. **Chat agent integration point exists on Item Detail page:**
   - Even if the full agent behavior is stubbed, the UI and conceptual contract are in place for future implementation.

---

Phase 6 is complete when the codebase reflects this **single-Item, status-driven architecture**, and you can walk test items through:

- AI capture → AI pipeline → AI Review → approve → ready inventory → stubbed marketplace listing.
- AI capture → AI pipeline → reject → Needs Work → edit → mark ready.
- Manual item → ready inventory → marketplace listing.

All without any separate draft models or competing sources of truth.

---

## 8. Current State Analysis

This section documents the existing infrastructure from Phase 5 and identifies what needs to change or be added for Phase 6.

### 8.1 Existing Infrastructure (Phase 5)

#### 8.1.1 Data Models

**ListingDraft Entity** (`apps/listforge-api/src/listing-drafts/entities/listing-draft.entity.ts`)

The current central model with:
- **IngestionStatus**: `'uploaded' | 'ai_queued' | 'ai_running' | 'ai_complete' | 'ai_error'`
- **ReviewStatus**: `'unreviewed' | 'auto_approved' | 'needs_review' | 'approved' | 'rejected'`
- **ComponentStatus** flags: `titleStatus`, `descriptionStatus`, `categoryStatus`, `pricingStatus`, `attributesStatus`
- **Research data**: Embedded as JSONB `researchSnapshot`
- **Core fields**: title, description, condition, brand, model, categoryPath, attributes, media
- **Pricing**: suggestedPrice, priceMin, priceMax, currency, pricingStrategy
- **Shipping**: shippingType, flatRateAmount, domesticOnly
- **AI metadata**: aiPipelineVersion, aiLastRunAt, aiErrorMessage, aiConfidenceScore
- **Review tracking**: assignedReviewerUserId, reviewedByUserId, reviewedAt, reviewComment

**Evidence Models** (`apps/listforge-api/src/evidence/entities/`)
- `EvidenceBundle`: Links to `ListingDraft` via `listingDraftId`
- `EvidenceItem`: Stores marketplace comps, summaries, and other AI reasoning

**MarketplaceListing** (`apps/listforge-api/src/marketplaces/entities/marketplace-listing.entity.ts`)
- Links to `ListingDraft` via `listingDraftId`
- Status: `'draft' | 'pending' | 'live' | 'ended' | 'sold' | 'error'`
- Fields: remoteListingId, url, price, lastSyncedAt, errorMessage

**WorkflowRun** (`apps/listforge-api/src/ai-workflows/entities/workflow-run.entity.ts`)
- Tracks AI workflow executions
- Links to `ListingDraft` via `listingDraftId`
- Status: `'pending' | 'running' | 'completed' | 'failed'`

#### 8.1.2 API Layer

**Ingestion Endpoints** (`/ingestion/`)
- `POST /ingestion/listings` – Create draft from photos + hints
- `GET /ingestion/listings` – List recent drafts

**Listing Drafts CRUD** (`/listings/drafts/`)
- `GET /listings/drafts` – List all drafts
- `GET /listings/drafts/:id` – Get single draft
- `PATCH /listings/drafts/:id` – Update draft
- `DELETE /listings/drafts/:id` – Delete draft
- `POST /listings/drafts/:id/ai-run` – Re-run AI
- `POST /listings/drafts/:id/assign` – Assign reviewer
- `GET /listings/drafts/:id/evidence` – Get evidence bundle
- `POST /listings/drafts/:id/publish` – Publish to marketplace
- `GET /listings/drafts/:id/marketplace-listings` – Get marketplace listings

**Review Endpoints** (`/review/`)
- `GET /review/queue` – Get review queue
- `POST /review/drafts/:id/decision` – Apply review decision (approve/reject/needs_manual)

#### 8.1.3 Frontend Pages

| Route | Purpose | Current Behavior |
|-------|---------|------------------|
| `/capture` | Mobile-first photo capture | Creates ListingDraft, shows recent captures |
| `/capture/$id` | Capture detail | Shows draft details during AI processing |
| `/review` | AI Review Deck | Three-column layout with queue, card, evidence |
| `/items` | Inventory list | Shows all ListingDrafts in ProductGrid |
| `/items/$id` | Item detail | Draft details, publish UI, marketplace listings |
| `/items/new` | Create item | Photo upload → AI capture (not manual form) |

#### 8.1.4 AI Workflows

**ListingIntakeWorkflow** (`apps/listforge-api/src/ai-workflows/workflows/listing-intake.workflow.ts`)
- Full AI pipeline: vision analysis → comp search → pricing → content generation
- Creates WorkflowRun records
- Creates EvidenceBundle with comps and summaries
- Updates ListingDraft with AI-generated content
- Sets reviewStatus based on auto-approval settings

**ListingAgentService** (`apps/listforge-api/src/ai-workflows/services/listing-agent.service.ts`)
- LLM-based content generation using LangGraph
- Handles vision extraction, comp analysis, pricing, and listing content

### 8.2 Gap Analysis

The following table maps current state to Phase 6 requirements:

| Component | Current State | Phase 6 Target | Change Type |
|-----------|---------------|----------------|-------------|
| **Core Model** | `ListingDraft` entity | `Item` (single unified model) | Refactor/Rename |
| **Source Tracking** | Not tracked | `source`: `'ai_capture' \| 'manual'` | New Field |
| **Lifecycle Status** | Combined `ingestionStatus` + `reviewStatus` | `lifecycleStatus`: `'draft' \| 'ready' \| 'listed' \| 'sold' \| 'archived'` | Restructure |
| **AI Review State** | `ReviewStatus` enum (5 values) | `aiReviewState`: `'none' \| 'pending' \| 'approved' \| 'rejected'` | Rename/Restructure |
| **Inventory Fields** | Partial (price, condition) | Full (quantity, location, costBasis, tags) | Extend |
| **Research Runs** | `WorkflowRun` (single per draft) | `ItemResearchRun` (multiple per item, typed) | New Model |
| **Evidence Relations** | `EvidenceBundle` → `ListingDraft` | `EvidenceBundle` → `Item` + `ItemResearchRun` | Update Relations |
| **Marketplace Relations** | `listingDraftId` | `itemId` + divergence fields | Update Relations |
| **Manual Creation** | Not supported (all items via AI capture) | Full form with AI helpers | New Flow |
| **Needs Work Queue** | No dedicated view (filtered in review) | Dedicated page for rejected items | New Feature |
| **Chat Integration** | Not present | Chat panel stub on Item detail | New Feature |

### 8.3 Status Field Mapping

**Current → Phase 6 Status Mapping:**

| Current `ingestionStatus` | Current `reviewStatus` | Phase 6 `lifecycleStatus` | Phase 6 `aiReviewState` |
|---------------------------|------------------------|---------------------------|-------------------------|
| `uploaded` | `unreviewed` | `draft` | `pending` |
| `ai_queued` | `unreviewed` | `draft` | `pending` |
| `ai_running` | `unreviewed` | `draft` | `pending` |
| `ai_complete` | `unreviewed` | `draft` | `pending` |
| `ai_complete` | `needs_review` | `draft` | `pending` |
| `ai_complete` | `auto_approved` | `ready` | `approved` |
| `ai_complete` | `approved` | `ready` | `approved` |
| `ai_complete` | `rejected` | `draft` | `rejected` |
| `ai_error` | any | `draft` | `pending` (with error) |
| N/A (manual) | N/A | `ready` | `none` |

### 8.4 Migration Considerations

1. **Database Migration Strategy:**
   - Option A: Rename `listing_drafts` table to `items`, add new columns
   - Option B: Create new `items` table, migrate data, deprecate old table
   - Recommendation: Option A with careful column additions/renames

2. **API Transition:**
   - Maintain backward compatibility during transition
   - New endpoints under `/items/` prefix
   - Deprecate `/listings/drafts/` endpoints after frontend migration

3. **Frontend Updates:**
   - Update RTK Query endpoints and hooks
   - Update component props to use new status fields
   - Add new routes for Needs Work queue

---

## 9. Implementation Sub-Phases

Phase 6 is broken into **9 independent vertical slices** that can be implemented incrementally. Each sub-phase delivers end-to-end value and has clear dependencies.

### Sub-Phase 1: Core Item Model & Types Foundation

**Goal:** Establish the new unified Item model as the foundation for all subsequent work.

**Scope:**
- Define new types in `@listforge/core-types`
- Create `Item` entity with all required fields
- Database migration
- API DTOs in `@listforge/api-types`

**Tasks:**

1. **New Types** (`packages/core-types/src/item.ts`):
   ```typescript
   export type LifecycleStatus = 'draft' | 'ready' | 'listed' | 'sold' | 'archived';
   export type AiReviewState = 'none' | 'pending' | 'approved' | 'rejected';
   export type ItemSource = 'ai_capture' | 'manual';

   export interface ItemMedia {
     id: string;
     url: string;
     storagePath: string;
     sortOrder: number;
     isPrimary: boolean;
     width?: number;
     height?: number;
   }

   export interface ItemAttribute {
     key: string;
     value: string;
     source: 'ai' | 'user' | 'imported';
     confidence?: number;
   }
   ```

2. **Item Entity** (`apps/listforge-api/src/items/entities/item.entity.ts`):
   - All fields from Section 2.1
   - New fields: `source`, `lifecycleStatus`, `aiReviewState`
   - Inventory fields: `quantity`, `location`, `costBasis`, `tags`

3. **Database Migration**:
   - Create `items` table (or rename/migrate from `listing_drafts`)
   - Add indexes on `organizationId`, `lifecycleStatus`, `aiReviewState`

4. **API DTOs** (`packages/api-types/src/items.ts`):
   - `ItemDto`, `ItemSummaryDto`
   - `CreateAiCaptureItemRequest`, `CreateManualItemRequest`
   - `UpdateItemRequest`, `UpdateItemResponse`

**Dependencies:** None (foundation slice)

**Deliverable:** New Item model ready for use by other sub-phases.

---

### Sub-Phase 2: AI Capture Flow Migration

**Goal:** Migrate the existing AI capture flow to use the new Item model.

**Scope:**

- Update ingestion controller to create Items
- Refactor AI workflow to work with Item entity
- Update evidence relations
- Update frontend RTK Query hooks

**Tasks:**

1. **Update Ingestion Controller** (`apps/listforge-api/src/items/`):
   - New `POST /items/ai-capture` endpoint
   - Creates Item with:
     - `source = 'ai_capture'`
     - `lifecycleStatus = 'draft'`
     - `aiReviewState = 'pending'`

2. **Refactor ListingIntakeWorkflow**:
   - Work with `Item` entity instead of `ListingDraft`
   - Update field mappings
   - Maintain same AI pipeline logic

3. **Update Evidence Relations**:
   - `EvidenceBundle.itemId` instead of `listingDraftId`
   - Migration script for existing evidence

4. **RTK Query Updates** (`packages/api-rtk/`):
   - New `useCreateAiCaptureItemMutation`
   - New `useGetItemQuery`, `useListItemsQuery`
   - Update Capture page to use new hooks

**Dependencies:** Sub-Phase 1

**Deliverable:** AI capture creates Items with proper status fields.

---

### Sub-Phase 3: AI Review Deck Updates

**Goal:** Update the review flow with new approve/reject semantics and status transitions.

**Scope:**

- New review API endpoints
- Update Review Deck UI
- Implement state transitions

**Tasks:**

1. **New Review Endpoints** (`apps/listforge-api/src/review/`):
   - `GET /items/review/ai-queue` – Items with `source='ai_capture'`, `lifecycleStatus='draft'`, `aiReviewState='pending'`
   - `POST /items/:id/review/ai-approve` – Sets `aiReviewState='approved'`, `lifecycleStatus='ready'`
   - `POST /items/:id/review/ai-reject` – Sets `aiReviewState='rejected'`, `lifecycleStatus='draft'`

2. **State Transition Logic**:
   - Validate transitions per Section 6
   - Emit socket events for real-time updates

3. **Update Review Deck UI** (`apps/listforge-web/src/routes/_authenticated/review/`):
   - Use new status fields for filtering
   - Update badges to show `lifecycleStatus` + `aiReviewState`
   - Update action handlers for approve/reject

4. **RTK Query Updates**:
   - `useGetAiReviewQueueQuery`
   - `useApproveItemMutation`
   - `useRejectItemMutation`

**Dependencies:** Sub-Phases 1, 2

**Deliverable:** Review Deck works with new Item model and status semantics.

---

### Sub-Phase 4: Needs Work Queue

**Goal:** Create dedicated queue and UI for AI-rejected items requiring human intervention.

**Scope:**

- New Needs Work API endpoint
- Mark Ready functionality
- New Needs Work page

**Tasks:**

1. **New API Endpoints**:
   - `GET /items/review/needs-work` – Items with `lifecycleStatus='draft'`, `aiReviewState='rejected'`
   - `POST /items/:id/mark-ready` – Sets `lifecycleStatus='ready'` (aiReviewState unchanged)

2. **Needs Work Page** (`apps/listforge-web/src/routes/_authenticated/needs-work/index.tsx`):
   - List of rejected items
   - Full edit form for each item
   - Evidence panel showing AI reasoning
   - "Mark Ready" button

3. **Navigation Update**:
   - Add "Needs Work" to sidebar
   - Show badge count of items needing work

4. **RTK Query Hooks**:
   - `useGetNeedsWorkQueueQuery`
   - `useMarkItemReadyMutation`

**Dependencies:** Sub-Phase 3

**Deliverable:** Dedicated workflow for fixing AI-rejected items.

---

### Sub-Phase 5: Manual Item Creation

**Goal:** Enable manual item creation that bypasses AI capture.

**Scope:**

- Manual item creation API
- Full manual item form UI
- Optional AI assist stubs

**Tasks:**

1. **New API Endpoint**:
   - `POST /items/manual` – Creates Item with:
     - `source = 'manual'`
     - `lifecycleStatus = 'ready'`
     - `aiReviewState = 'none'`
   - Accepts all item fields directly

2. **Manual Item Form** (`apps/listforge-web/src/routes/_authenticated/items/new.tsx`):
   - Redesign from AI-capture to full manual form
   - Fields: title, description, condition, category, attributes
   - Inventory fields: quantity, price, location, costBasis
   - Media upload
   - Optional: "AI Assist" button stubs (pricing, title improvement)

3. **Form Validation**:
   - Required fields: title, at least one image
   - Price validation
   - Category selection

4. **RTK Query**:
   - `useCreateManualItemMutation`

**Dependencies:** Sub-Phase 1

**Deliverable:** Users can create inventory-ready items manually.

---

### Sub-Phase 6: Inventory Views & Filtering

**Goal:** Create proper inventory views with status-based filtering.

**Scope:**

- Enhanced list API with filters
- Updated Inventory page with filter controls
- Status badges on item cards

**Tasks:**

1. **Enhanced List API**:
   - `GET /items` with query params:
     - `lifecycleStatus` (array)
     - `aiReviewState` (array)
     - `source` (array)
     - `search` (title/description)
     - Pagination

2. **Inventory Page Updates** (`apps/listforge-web/src/routes/_authenticated/items/index.tsx`):
   - Filter tabs/dropdown: All, Ready to List, Listed, Sold
   - Source filter: AI Capture, Manual
   - Search input
   - Sort options: Date, Price, Title

3. **Item Card Updates**:
   - Lifecycle status badge (color-coded)
   - AI review state indicator
   - Source icon (AI vs Manual)

4. **RTK Query**:
   - Update `useListItemsQuery` with filter params

**Dependencies:** Sub-Phases 1, 2

**Deliverable:** Filterable inventory view showing all items by status.

---

### Sub-Phase 7: MarketplaceListing Integration

**Goal:** Update marketplace listing model to link to Items with proper status sync.

**Scope:**

- Update MarketplaceListing entity
- Add divergence fields
- Lifecycle status sync

**Tasks:**

1. **Update MarketplaceListing Entity**:
   - Rename `listingDraftId` → `itemId`
   - Add divergence fields:
     - `title` (marketplace-specific)
     - `description` (marketplace-specific)
     - `price` (already exists)
   - Update `listingStatus` enum to match spec:
     - `'not_listed' | 'listing_pending' | 'listed' | 'sold' | 'ended' | 'error'`

2. **Database Migration**:
   - Rename foreign key column
   - Add new columns

3. **Lifecycle Status Sync**:
   - When MarketplaceListing → `'listed'`, update Item → `lifecycleStatus = 'listed'`
   - When MarketplaceListing → `'sold'` and quantity = 0, update Item → `lifecycleStatus = 'sold'`

4. **Item Detail Marketplace Tab**:
   - Show MarketplaceListings linked to Item
   - "Create eBay Listing" button
   - Display divergence fields

5. **API Updates**:
   - Update `POST /items/:id/marketplace-listings`
   - Update `GET /items/:id/marketplace-listings`

**Dependencies:** Sub-Phases 1, 6

**Deliverable:** MarketplaceListings link to Items with proper status sync.

---

### Sub-Phase 8: ItemResearchRun & Research History

**Goal:** Support multiple research runs per item with full history.

**Scope:**

- New ItemResearchRun entity
- Link EvidenceBundle to research runs
- Research history UI

**Tasks:**

1. **ItemResearchRun Entity** (`apps/listforge-api/src/research/entities/item-research-run.entity.ts`):

   ```typescript
   @Entity('item_research_runs')
   export class ItemResearchRun {
     id: string;
     itemId: string;
     runType: string; // 'initial_intake' | 'pricing_refresh' | 'manual_request'
     status: string;  // 'pending' | 'running' | 'success' | 'error'
     pipelineVersion: string;
     startedAt: Date;
     completedAt: Date | null;
     errorMessage: string | null;
     summary: string | null;
   }
   ```

2. **Update EvidenceBundle**:
   - Add `researchRunId` foreign key
   - Keep `itemId` for direct item lookup

3. **Research APIs**:
   - `POST /items/:id/research` – Trigger new research run
   - `GET /items/:id/research-runs` – List all research runs for item
   - `GET /research-runs/:id/evidence` – Get evidence for specific run

4. **Item Detail Research Tab**:
   - List of research runs with dates and types
   - Expandable to show evidence bundle
   - "Run New Research" button

5. **Migrate WorkflowRun → ItemResearchRun**:
   - Data migration script
   - Deprecate WorkflowRun table

**Dependencies:** Sub-Phases 1, 2

**Deliverable:** Full research history with multiple runs per item.

---

### Sub-Phase 9: Chat Agent Integration Point

**Goal:** Establish UI and API contract for future AI chat agent.

**Scope:**

- Chat panel placeholder UI
- Context interface definition
- Stub API endpoint

**Tasks:**

1. **Chat Panel Component** (`apps/listforge-web/src/components/chat/ItemChatPanel.tsx`):
   - Collapsible/expandable panel
   - Message input
   - Message history display
   - "Coming Soon" or stub responses

2. **Chat Context Interface** (`packages/core-types/src/chat.ts`):

   ```typescript
   export interface ItemChatContext {
     itemId: string;
     currentFields: Partial<Item>;
     latestEvidence: EvidenceBundle | null;
     conversationHistory: ChatMessage[];
   }

   export interface ChatMessage {
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: string;
     actions?: ChatAction[]; // Suggested edits, research triggers
   }
   ```

3. **Stub API Endpoint**:
   - `POST /items/:id/chat` – Accepts message, returns stub response
   - Structure ready for future LLM integration

4. **Integration in Item Detail**:
   - Add chat panel to Item detail page
   - Context-aware of current item

5. **Documentation**:
   - Document chat integration contract
   - Define future agent capabilities

**Dependencies:** Sub-Phase 6

**Deliverable:** Chat UI placeholder ready for future agent implementation.

---

## 10. Implementation Order Recommendation

### 10.1 Dependency Graph

```
Sub-Phase 1: Core Item Model (Foundation)
    │
    ├──────────────────┬──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
Sub-Phase 2       Sub-Phase 5       Sub-Phase 8
AI Capture        Manual Item       Research History
Migration         Creation          (can start early)
    │                  │
    │                  │
    ▼                  │
Sub-Phase 3            │
AI Review Updates      │
    │                  │
    ▼                  │
Sub-Phase 4            │
Needs Work Queue       │
    │                  │
    ├──────────────────┘
    │
    ▼
Sub-Phase 6
Inventory Views
    │
    ├──────────────────┐
    │                  │
    ▼                  ▼
Sub-Phase 7       Sub-Phase 9
Marketplace       Chat Agent
Integration       Stub
```

### 10.2 Recommended Implementation Waves

**Wave 1: Foundation (Week 1)**

- Sub-Phase 1: Core Item Model & Types
- Start Sub-Phase 8: ItemResearchRun entity (can parallelize)

**Wave 2: Core Flows (Weeks 2-3)**

- Sub-Phase 2: AI Capture Migration
- Sub-Phase 5: Manual Item Creation (parallel track)

**Wave 3: Review System (Week 4)**

- Sub-Phase 3: AI Review Deck Updates
- Sub-Phase 4: Needs Work Queue

**Wave 4: Integration & Polish (Weeks 5-6)**

- Sub-Phase 6: Inventory Views & Filtering
- Sub-Phase 7: MarketplaceListing Integration
- Sub-Phase 8: Research History (complete)
- Sub-Phase 9: Chat Agent Stub

### 10.3 Critical Path

The critical path determines the minimum time to complete Phase 6:

```
1 → 2 → 3 → 4 → 6 → 7
│   │   │   │   │   │
▼   ▼   ▼   ▼   ▼   ▼
Core → AI → Review → Needs → Inventory → Marketplace
Model  Capture Updates  Work   Views      Integration
```

**Critical Path Duration:** ~6 weeks (assuming 1 week per major sub-phase)

### 10.4 Parallel Work Opportunities

These sub-phases can be worked in parallel:

| Parallel Track A | Parallel Track B |
|------------------|------------------|
| Sub-Phase 2 (AI Capture) | Sub-Phase 5 (Manual Creation) |
| Sub-Phase 3 (Review) | Sub-Phase 8 (Research History) |
| Sub-Phase 7 (Marketplace) | Sub-Phase 9 (Chat Stub) |

### 10.5 Risk Mitigation

**High-Risk Items:**

1. **Database Migration** (Sub-Phase 1)
   - Risk: Data loss or corruption during ListingDraft → Item migration
   - Mitigation: Test migration on staging with production data copy first

2. **Status Field Restructuring** (Sub-Phases 1-3)
   - Risk: Inconsistent state during transition
   - Mitigation: Implement dual-write during transition, validate before cutover

3. **AI Workflow Changes** (Sub-Phase 2)
   - Risk: Breaking existing AI pipeline
   - Mitigation: Maintain backward compatibility, feature flag new flow

**Rollback Strategy:**

- Each sub-phase should be deployable independently
- Feature flags for new UI components
- Database migrations should be reversible

### 10.6 Testing Checkpoints

After each wave, verify these user flows work:

**After Wave 1:**

- [ ] Item entity exists with all required fields
- [ ] New types compile without errors

**After Wave 2:**

- [ ] AI capture creates Items (not ListingDrafts)
- [ ] Manual item creation works end-to-end
- [ ] AI pipeline populates Item fields correctly

**After Wave 3:**

- [ ] Review Deck shows pending Items
- [ ] Approve moves Item to `ready` status
- [ ] Reject moves Item to Needs Work queue
- [ ] Mark Ready promotes Item to `ready`

**After Wave 4:**

- [ ] Inventory shows filtered Items by status
- [ ] MarketplaceListing links to Item correctly
- [ ] Research history shows multiple runs
- [ ] Chat panel placeholder renders

### 10.7 Definition of Done for Phase 6

Phase 6 is complete when:

1. **All acceptance criteria from Section 7 are met**
2. **All sub-phases are implemented and tested**
3. **These user journeys work end-to-end:**
   - AI capture → AI Review → Approve → Inventory → Marketplace listing
   - AI capture → AI Review → Reject → Needs Work → Mark Ready → Inventory
   - Manual creation → Inventory → Marketplace listing
4. **No remaining references to `ListingDraft` in active code paths**
5. **Documentation updated to reflect new architecture**

```
