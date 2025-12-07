# Phase 6 Complete Implementation Prompt

## Objective

Implement the entire Phase 6 specification (`PHASE_6_SPEC.md`) to migrate from the legacy dual-model system (`ListingDraft` + separate inventory concepts) to a unified single `Item` model with clear status-driven workflows. **All legacy code and references must be removed by the end of this implementation.**

## Critical Success Criteria

### 1. Complete Implementation of All Sub-Phases

You must implement **all 9 sub-phases** described in Section 9 of `PHASE_6_SPEC.md`:

- ✅ **Sub-Phase 1**: Core Item Model & Types Foundation
- ✅ **Sub-Phase 2**: AI Capture Flow Migration
- ✅ **Sub-Phase 3**: AI Review Deck Updates
- ✅ **Sub-Phase 4**: Needs Work Queue
- ✅ **Sub-Phase 5**: Manual Item Creation
- ✅ **Sub-Phase 6**: Inventory Views & Filtering
- ✅ **Sub-Phase 7**: MarketplaceListing Integration
- ✅ **Sub-Phase 8**: ItemResearchRun & Research History
- ✅ **Sub-Phase 9**: Chat Agent Integration Point

### 2. Complete Removal of Legacy System

After implementation, the following **must be completely removed** from the codebase:

#### Backend (API)

- [ ] **Delete** `apps/listforge-api/src/listing-drafts/` directory entirely
  - `entities/listing-draft.entity.ts`
  - `listing-drafts.controller.ts`
  - `listing-drafts.service.ts`
  - `listing-drafts.module.ts`
  - All DTOs related to ListingDraft

- [ ] **Delete** `apps/listforge-api/src/meta-listings/` directory (if still exists)
  - This was marked as deleted in git status but verify complete removal

- [ ] **Update** `apps/listforge-api/src/app.module.ts`
  - Remove `ListingDraftsModule` import
  - Remove from imports array

- [ ] **Update** all references to `ListingDraft` entity
  - Search codebase for: `ListingDraft`, `listingDraft`, `listing-draft`, `listing_drafts` table
  - Replace with `Item`, `item`, `items` table

- [ ] **Update** `WorkflowRun` entity
  - Remove `listingDraftId` field
  - Add `itemId` field
  - Update all queries and relations

- [ ] **Update** `EvidenceBundle` entity
  - Remove `listingDraftId` field
  - Add both `itemId` and `researchRunId` fields
  - Update all relations

- [ ] **Update** `MarketplaceListing` entity
  - Remove `listingDraftId` field
  - Add `itemId` field
  - Add divergence fields: `title`, `description` (marketplace-specific)
  - Update status enum to match spec

- [ ] **Delete** deprecated API endpoints
  - All routes under `/listings/drafts/`
  - `/ingestion/listings` (replace with `/items/ai-capture`)
  - Legacy `/review/drafts/:id/decision` (replace with new review endpoints)

#### Frontend (Web)

- [ ] **Update** all RTK Query endpoints
  - Remove all `listingDraft` API calls
  - Replace with `item` API calls
  - Update `packages/api-rtk/src/api.ts`

- [ ] **Delete** `ItemCard.tsx` if it references old model
  - Already marked as deleted in git status, verify removal

- [ ] **Update** all routes that reference drafts
  - `/capture` → update to use Item model
  - `/capture/$id` → update to use Item model
  - `/review` → update to use new review endpoints
  - `/items` → update to show proper Item status filtering
  - `/items/$id` → update Item detail page
  - `/items/new` → convert to full manual form (not AI-only)

- [ ] **Update** type imports
  - Replace all `@listforge/api-types` imports referencing drafts
  - Use new Item types from `@listforge/core-types`

- [ ] **Delete or update** components that reference old model
  - Search for: `ListingDraft`, `IngestionStatus`, `ReviewStatus`
  - Replace with: `Item`, `LifecycleStatus`, `AiReviewState`

#### Types Packages

- [ ] **Remove** old type definitions
  - Clean up `packages/api-types/` of any draft-related types
  - Ensure `packages/core-types/` has complete Item types

- [ ] **Update** `packages/queue-types/`
  - Remove any job types referencing `listingDraftId`
  - Add job types for `itemId` and research runs

### 3. Database Migration Requirements

Create and execute database migrations for:

#### Migration 1: Core Item Table

```sql
-- Option A: Rename and migrate existing table
ALTER TABLE listing_drafts RENAME TO items;

-- Add new required columns
ALTER TABLE items ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'ai_capture';
ALTER TABLE items ADD COLUMN lifecycle_status VARCHAR(50) NOT NULL DEFAULT 'draft';
ALTER TABLE items ADD COLUMN ai_review_state VARCHAR(50) NOT NULL DEFAULT 'pending';
ALTER TABLE items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE items ADD COLUMN location VARCHAR(255);
ALTER TABLE items ADD COLUMN cost_basis DECIMAL(10,2);
ALTER TABLE items ADD COLUMN tags JSONB DEFAULT '[]';

-- Map old statuses to new (update existing rows)
-- See Section 8.3 in spec for mapping logic
UPDATE items
SET lifecycle_status = CASE
  WHEN review_status IN ('auto_approved', 'approved') THEN 'ready'
  WHEN review_status = 'rejected' THEN 'draft'
  ELSE 'draft'
END;

UPDATE items
SET ai_review_state = CASE
  WHEN review_status IN ('auto_approved', 'approved') THEN 'approved'
  WHEN review_status = 'rejected' THEN 'rejected'
  WHEN review_status IN ('unreviewed', 'needs_review') THEN 'pending'
  ELSE 'pending'
END;

-- Remove old status columns
ALTER TABLE items DROP COLUMN ingestion_status;
ALTER TABLE items DROP COLUMN review_status;
ALTER TABLE items DROP COLUMN title_status;
ALTER TABLE items DROP COLUMN description_status;
ALTER TABLE items DROP COLUMN category_status;
ALTER TABLE items DROP COLUMN pricing_status;
ALTER TABLE items DROP COLUMN attributes_status;
ALTER TABLE items DROP COLUMN research_snapshot;

-- Add indexes
CREATE INDEX idx_items_lifecycle_status ON items(lifecycle_status);
CREATE INDEX idx_items_ai_review_state ON items(ai_review_state);
CREATE INDEX idx_items_source ON items(source);
CREATE INDEX idx_items_org_lifecycle ON items(organization_id, lifecycle_status);
```

#### Migration 2: ItemResearchRun Table

```sql
-- Create new table (migrate from workflow_runs)
CREATE TABLE item_research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  run_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  pipeline_version VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_runs_item ON item_research_runs(item_id);
CREATE INDEX idx_research_runs_status ON item_research_runs(status);

-- Migrate existing workflow_runs
INSERT INTO item_research_runs (
  id, item_id, run_type, status, pipeline_version,
  started_at, completed_at, error_message, created_at, updated_at
)
SELECT
  id,
  listing_draft_id as item_id,
  'initial_intake' as run_type,
  CASE status
    WHEN 'completed' THEN 'success'
    WHEN 'failed' THEN 'error'
    ELSE status
  END,
  pipeline_version,
  created_at,
  updated_at,
  error as error_message,
  created_at,
  updated_at
FROM workflow_runs
WHERE listing_draft_id IS NOT NULL;

-- Keep workflow_runs table for now but mark deprecated
-- Delete after confirming all data migrated
```

#### Migration 3: Update Foreign Keys

```sql
-- Update evidence_bundles
ALTER TABLE evidence_bundles
  ADD COLUMN item_id UUID REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE evidence_bundles
  ADD COLUMN research_run_id UUID REFERENCES item_research_runs(id) ON DELETE SET NULL;

-- Migrate data
UPDATE evidence_bundles
SET item_id = listing_draft_id
WHERE listing_draft_id IS NOT NULL;

-- Add indexes
CREATE INDEX idx_evidence_item ON evidence_bundles(item_id);
CREATE INDEX idx_evidence_research_run ON evidence_bundles(research_run_id);

-- After verifying data migration:
-- ALTER TABLE evidence_bundles DROP COLUMN listing_draft_id;

-- Update marketplace_listings
ALTER TABLE marketplace_listings
  ADD COLUMN item_id UUID REFERENCES items(id) ON DELETE CASCADE;

-- Migrate data
UPDATE marketplace_listings
SET item_id = listing_draft_id
WHERE listing_draft_id IS NOT NULL;

-- Add divergence fields
ALTER TABLE marketplace_listings ADD COLUMN title VARCHAR(255);
ALTER TABLE marketplace_listings ADD COLUMN description TEXT;

-- Update status enum
ALTER TABLE marketplace_listings
  ALTER COLUMN listing_status TYPE VARCHAR(50);
-- Values: 'not_listed', 'listing_pending', 'listed', 'sold', 'ended', 'error'

-- Add indexes
CREATE INDEX idx_marketplace_item ON marketplace_listings(item_id);
CREATE INDEX idx_marketplace_status ON marketplace_listings(marketplace, listing_status);

-- After verifying:
-- ALTER TABLE marketplace_listings DROP COLUMN listing_draft_id;
```

### 4. Implementation Verification Checklist

After completing all sub-phases, verify these user flows work end-to-end:

#### Flow 1: AI Capture → Approve → Inventory → Marketplace

- [ ] Navigate to `/capture`
- [ ] Upload photos and add optional description hint
- [ ] Submit creates Item with:
  - `source = 'ai_capture'`
  - `lifecycleStatus = 'draft'`
  - `aiReviewState = 'pending'`
- [ ] AI pipeline runs and populates fields
- [ ] Item appears in AI Review Deck (`/review`)
- [ ] Click "Approve" updates statuses:
  - `aiReviewState = 'approved'`
  - `lifecycleStatus = 'ready'`
- [ ] Item disappears from Review Deck
- [ ] Item appears in Inventory (`/items`) with "Ready" badge
- [ ] Open Item detail, navigate to Marketplaces tab
- [ ] Create eBay listing configuration
- [ ] Publish listing (stubbed) updates:
  - `MarketplaceListing.listingStatus = 'listed'`
  - `Item.lifecycleStatus = 'listed'`

#### Flow 2: AI Capture → Reject → Needs Work → Fix → Ready

- [ ] AI-captured Item in Review Deck
- [ ] Click "Reject" updates statuses:
  - `aiReviewState = 'rejected'`
  - `lifecycleStatus = 'draft'`
- [ ] Item disappears from Review Deck
- [ ] Item appears in Needs Work queue (`/needs-work`)
- [ ] Open item, see edit form with AI evidence
- [ ] Make manual corrections to title, description, price
- [ ] Click "Mark Ready" updates:
  - `lifecycleStatus = 'ready'`
  - `aiReviewState` stays `'rejected'`
- [ ] Item disappears from Needs Work
- [ ] Item appears in Inventory with "Ready" badge

#### Flow 3: Manual Creation → Inventory → Marketplace

- [ ] Navigate to `/items/new`
- [ ] See full manual item form (not AI-only capture)
- [ ] Fill in:
  - Title, description
  - Upload photos
  - Select category
  - Set condition
  - Add attributes (brand, model, etc.)
  - Set price, quantity
  - Add location, cost basis
- [ ] Submit creates Item with:
  - `source = 'manual'`
  - `lifecycleStatus = 'ready'`
  - `aiReviewState = 'none'`
- [ ] Item immediately appears in Inventory
- [ ] Item never appears in Review Deck or Needs Work
- [ ] Can create marketplace listings as in Flow 1

#### Flow 4: Research History

- [ ] Open any Item detail page
- [ ] Navigate to Research tab
- [ ] See list of `ItemResearchRun` records with dates and types
- [ ] Expand a run to see associated `EvidenceBundle`
- [ ] See comps, pricing summaries, category justifications
- [ ] Click "Run New Research" to trigger additional research
- [ ] New run appears in history

#### Flow 5: Inventory Filtering

- [ ] Navigate to `/items`
- [ ] See filter controls for:
  - Lifecycle Status: Draft, Ready, Listed, Sold, Archived
  - AI Review State: Pending, Approved, Rejected, None
  - Source: AI Capture, Manual
- [ ] Apply filters and verify correct items show
- [ ] See status badges on each item card
- [ ] Search by title/description works

#### Flow 6: Chat Panel (Stub)

- [ ] Open any Item detail page
- [ ] See chat panel (may be collapsed by default)
- [ ] Panel shows "Coming Soon" or accepts messages with stub responses
- [ ] Panel is context-aware of current Item ID

### 5. Code Search and Cleanup

After implementation, perform these searches to ensure complete migration:

#### Search for Legacy Terms (should return 0 active results)

```bash
# Backend
cd apps/listforge-api
rg "ListingDraft" --type ts
rg "listingDraftId" --type ts
rg "listing-draft" --type ts
rg "listing_drafts" --type ts
rg "IngestionStatus" --type ts
rg "ReviewStatus" --type ts  # Check context - may be used in new Item model differently
rg "ComponentStatus" --type ts

# Frontend
cd apps/listforge-web
rg "ListingDraft" --type ts --type tsx
rg "listingDraft" --type ts --type tsx
rg "ingestionStatus" --type ts --type tsx

# Packages
cd packages
rg "ListingDraft" --type ts
rg "listingDraftId" --type ts
```

#### Search for Required New Terms (should return many results)

```bash
# Verify Item model is used
rg "Item\b" --type ts  # The \b ensures we match "Item" as a whole word

# Verify new status fields
rg "lifecycleStatus" --type ts
rg "aiReviewState" --type ts
rg "ItemSource" --type ts

# Verify research runs
rg "ItemResearchRun" --type ts
rg "researchRunId" --type ts
```

### 6. API Endpoint Inventory

**Legacy Endpoints to Remove:**

- `POST /ingestion/listings`
- `GET /ingestion/listings`
- `GET /listings/drafts`
- `GET /listings/drafts/:id`
- `PATCH /listings/drafts/:id`
- `DELETE /listings/drafts/:id`
- `POST /listings/drafts/:id/ai-run`
- `POST /listings/drafts/:id/assign`
- `GET /listings/drafts/:id/evidence`
- `POST /listings/drafts/:id/publish`
- `GET /listings/drafts/:id/marketplace-listings`
- `POST /review/drafts/:id/decision`

**New Required Endpoints:**

- `POST /items/ai-capture` ✅
- `POST /items/manual` ✅
- `GET /items` (with filters) ✅
- `GET /items/:id` ✅
- `PATCH /items/:id` ✅
- `GET /items/review/ai-queue` ✅
- `POST /items/:id/review/ai-approve` ✅
- `POST /items/:id/review/ai-reject` ✅
- `GET /items/review/needs-work` ✅
- `POST /items/:id/mark-ready` ✅
- `POST /items/:id/research` ✅
- `GET /items/:id/research-runs` ✅
- `GET /research-runs/:id/evidence` ✅
- `POST /items/:id/marketplace-listings` ✅
- `GET /items/:id/marketplace-listings` ✅
- `GET /marketplace-listings` (with filters) ✅
- `PATCH /marketplace-listings/:id` ✅
- `POST /marketplace-listings/:id/publish` ✅
- `POST /items/:id/chat` (stub) ✅

### 7. Frontend Route Inventory

**Routes to Update (not delete - keep routes but update logic):**

| Route | Current State | Required Changes |
|-------|---------------|------------------|
| `/capture` | Uses ListingDraft | Update to Item model, use new AI capture endpoint |
| `/capture/$id` | Shows draft details | Update to show Item details with new status fields |
| `/review` | Uses old review statuses | Update to filter Items by new status fields, use new approve/reject endpoints |
| `/items` | Shows drafts | Update to show Items with proper filtering by `lifecycleStatus`, `aiReviewState` |
| `/items/$id` | Item detail page | Update all tabs (Research, Marketplaces, etc.) to use Item model |
| `/items/new` | AI capture only | Convert to full manual form with AI assist options |

**New Routes to Create:**

| Route | Purpose |
|-------|---------|
| `/needs-work` | Queue for AI-rejected items needing human intervention |
| `/needs-work/$id` (optional) | Detail view for needs-work items with edit form |

### 8. Type System Updates

**New Types Required in `packages/core-types/src/item.ts`:**

```typescript
export type LifecycleStatus = 'draft' | 'ready' | 'listed' | 'sold' | 'archived';
export type AiReviewState = 'none' | 'pending' | 'approved' | 'rejected';
export type ItemSource = 'ai_capture' | 'manual';

export interface Item {
  // Identity
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;

  // Status fields
  source: ItemSource;
  lifecycleStatus: LifecycleStatus;
  aiReviewState: AiReviewState;

  // Core listing fields
  title: string;
  subtitle?: string;
  description: string;
  condition: ItemCondition;

  // Category
  categoryPath: string[];
  categoryId?: string;

  // Attributes
  attributes: ItemAttribute[];

  // Quantity & pricing
  quantity: number;
  defaultPrice: number;
  currency: string;
  priceMin?: number;
  priceMax?: number;
  pricingStrategy?: 'aggressive' | 'balanced' | 'premium';

  // Shipping
  shippingType: 'flat' | 'local_pickup' | 'calculated';
  flatRateAmount?: number;
  domesticOnly: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };

  // Media
  media: ItemMedia[];

  // Inventory
  location?: string;
  costBasis?: number;
  tags: string[];

  // AI metadata
  aiPipelineVersion?: string;
  aiLastRunAt?: string;
  aiLastRunError?: string;
  aiConfidenceScore?: number;
}
```

**Types to Remove:**

- Any `ListingDraft` interface definitions
- `IngestionStatus` enum
- Old `ReviewStatus` enum (note: may be reused in Item context, check carefully)
- `ComponentStatus` related types

### 9. Documentation Updates Required

After implementation:

- [ ] Update README files to reference Item model instead of ListingDraft
- [ ] Update API documentation (Swagger/OpenAPI) with new endpoints
- [ ] Update architecture diagrams to show single Item model
- [ ] Mark `PHASE_6_SPEC.md` as implemented with completion date
- [ ] Create migration guide for any external integrations

### 10. Testing Requirements

**Unit Tests:**

- [ ] Item entity validation and relationships
- [ ] ItemResearchRun entity and lifecycle
- [ ] Status transition logic (approve, reject, mark ready)
- [ ] Marketplace listing sync logic

**Integration Tests:**

- [ ] AI capture creates Item correctly
- [ ] Manual creation creates Item correctly
- [ ] Review approve/reject flows
- [ ] Needs work mark ready flow
- [ ] Research run creation and evidence linking
- [ ] Marketplace listing creation and status sync

**E2E Tests:**

- [ ] Complete Flow 1 (AI Capture → Approve → Marketplace)
- [ ] Complete Flow 2 (AI Capture → Reject → Fix → Ready)
- [ ] Complete Flow 3 (Manual → Marketplace)

## Implementation Strategy

### Phase Approach

Follow the implementation order in Section 10 of `PHASE_6_SPEC.md`:

**Wave 1: Foundation** (Do First)

1. Sub-Phase 1: Core Item Model & Types
2. Database migrations
3. Sub-Phase 8: ItemResearchRun entity setup

**Wave 2: Core Flows** (Do Second)
4. Sub-Phase 2: AI Capture Migration
5. Sub-Phase 5: Manual Item Creation (can parallelize)

**Wave 3: Review System** (Do Third)
6. Sub-Phase 3: AI Review Deck Updates
7. Sub-Phase 4: Needs Work Queue

**Wave 4: Integration & Polish** (Do Last)
8. Sub-Phase 6: Inventory Views & Filtering
9. Sub-Phase 7: MarketplaceListing Integration
10. Sub-Phase 8: Complete Research History features
11. Sub-Phase 9: Chat Agent Stub

### Dual-Write Strategy (Optional Safety)

If concerned about data safety during migration:

1. **Phase A**: Dual-write period
   - Keep both `listing_drafts` and `items` tables
   - Write to both during transition
   - Read from `items` only in new code paths

2. **Phase B**: Verification period
   - Verify data consistency between tables
   - Monitor for issues

3. **Phase C**: Cut over
   - Stop writing to `listing_drafts`
   - Archive/drop old table

### Feature Flags

Consider using feature flags for:

- New Item model API endpoints (gradual rollout)
- New UI routes (A/B testing)
- Legacy endpoint deprecation warnings

## Success Metrics

Phase 6 is **100% complete** when:

1. ✅ All 9 sub-phases implemented
2. ✅ All 6 verification flows pass
3. ✅ All legacy code removed (0 search results for deprecated terms)
4. ✅ All new API endpoints working
5. ✅ All frontend routes updated
6. ✅ Database migrations executed successfully
7. ✅ Tests passing (unit, integration, E2E)
8. ✅ Documentation updated

## Final Cleanup Command

After everything is working, run this final cleanup:

```bash
# Delete deprecated directories
rm -rf apps/listforge-api/src/listing-drafts
rm -rf apps/listforge-api/src/meta-listings

# Delete deprecated migration files (after confirming in production)
# (Keep ItemResearchRun migrations)

# Update all package.json if needed (remove deprecated scripts)

# Final verification searches
rg "ListingDraft" --type ts | grep -v "node_modules" | wc -l  # Should be 0
rg "listingDraftId" --type ts | grep -v "node_modules" | wc -l  # Should be 0
```

## Notes

- Follow the existing code style and patterns in the monorepo
- Use TypeScript strict mode
- Maintain existing authentication and organization scoping
- Keep error handling consistent with existing patterns
- Emit appropriate socket events for real-time UI updates
- Log important state transitions for debugging

## Reference

See `docs/PHASE_6_SPEC.md` for complete specifications of:

- Data models (Section 2)
- Workflows (Section 3)
- UI surfaces (Section 4)
- API contracts (Section 5)
- State transitions (Section 6)
- Acceptance criteria (Section 7)
- Current state analysis (Section 8)
- Sub-phase details (Section 9)
- Implementation order (Section 10)

