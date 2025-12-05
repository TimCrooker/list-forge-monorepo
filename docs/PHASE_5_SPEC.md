# Phase 5 Product Spec
## ListForge – Listing Engine & AI Intake

> **Goal:** Turn raw item photos (plus optional hints) into **fully enriched, reviewable listing drafts** through autonomous AI research, designed to scale from solo resellers to high-volume multi-employee operations.

---

## 1. Overview

Phase 5 introduces the **Listing Engine** and **AI Intake pipeline** for ListForge.

The system will:

1. Allow users to **capture items quickly**, primarily via mobile:
   - Upload “listing-ready” photos.
   - Optionally provide a short description or title hint.

2. Run a **heavy, accuracy-focused AI pipeline in the background**:
   - Identify the item using images + hints.
   - Fetch comps and data from eBay’s APIs (sold + active listings).
   - Infer category, condition, attributes.
   - Recommend pricing and shipping.
   - Generate marketplace-ready title & description.
   - Attach a rich set of **evidence** (comps, articles, metadata) to justify its decisions.

3. Provide a **desktop “human-in-the-loop” Review Deck**:
   - High-throughput UI for reviewing listing drafts.
   - “Swipe right/left” style approve/deny interactions.
   - Component-level flags (title/description/price/category).
   - Evidence panel showing all comps and sources.

Publishing to eBay is **explicitly out of scope** for this phase; we focus solely on building the internal, high-quality meta listing and review pipeline.

---

## 2. Goals & Non-goals

### 2.1 Goals

- **G1 – Scale-agnostic architecture**
  - Support both solo sellers and large operations with multiple employees and heavy listing volume.
  - Intake and review must be decoupled to allow different people/roles to handle each.

- **G2 – Fully automated listing content**
  - Transform photos + hints into a near-complete listing:
    - Title, description, condition, category, attributes, price, and shipping.
  - Designed as a superset of eBay’s requirements.

- **G3 – High-accuracy background AI**
  - Latency of **tens of seconds or minutes is acceptable**.
  - Accuracy and completeness are more important than speed.
  - AI pipeline can be complex and multi-step (“agents cooking in the background”).

- **G4 – Rich evidence-based review**
  - Expose **all evidence** (eBay comps, articles, metadata) used to construct each listing.
  - Make it easy for humans to approve/deny listings and flag individual components.

- **G5 – Mobile-first ingestion, desktop-first review**
  - Mobile UX focused on **capture and ingestion**.
  - Desktop UX focused on **powerful review & editing**.

- **G6 – Ready for eBay comps and future valuation-only pipeline**
  - Pricing must lean heavily on **eBay sold & active data**.
  - Architecture should later support a “quick valuation only” pipeline reusing much of the research stack.

### 2.2 Non-goals (for this phase)

- Publishing listings to eBay or other marketplaces.
- Implementing a separate, fast **valuation-only** pipeline (design only).
- Complex multi-SKU/variant handling (we design the model to evolve, but don’t implement full variants).
- Rich workflow automation beyond basic review/approval/rejection.

---

## 3. Personas & Usage Contexts

### 3.1 Solo Reseller

- Uses mobile to capture items (photos + minimal hints).
- Uses laptop/desktop for review & final decisions.
- Wants a **high degree of automation**, but still reviews pricing and titles for high-value items.

### 3.2 Large Operation

- **Intake operators**:
  - Use mobile or tablets to rapidly capture items in a warehouse or intake area.
  - Capture hundreds of items per day.
  - Do not wait for AI; they just feed the system.

- **Reviewers / Listing specialists**:
  - Use desktop Review Deck.
  - Process large queues of listing drafts.
  - Approve, reject, or flag components at high speed.
  - Need clear evidence for pricing and condition decisions.

- **Admins / Team leads**:
  - Monitor queue size and throughput.
  - Ensure items are reviewed and approved/rejected promptly.
  - Occasionally adjust policies and validation rules.

---

## 4. Core Concepts & Data Structures (Product-level)

> **Note:** These are **conceptual models** and **data contracts**, not implementation classes.

### 4.1 ListingDraft – internal meta listing

Represents a **candidate listing** that could be published later.

**Identity & ownership**

- `id`
- `organizationId`
- `createdByUserId`
- `createdAt`, `updatedAt`
- Optional:
  - `ingestionSessionId` (batch capture)
  - `assignedReviewerUserId` (for large teams)

**Lifecycle / statuses**

- **Ingestion Status** (AI lifecycle):
  - `uploaded` → `ai_queued` → `ai_running` → `ai_complete` → `ai_error`.

- **Review Status** (human/organizational state):
  - `unreviewed` – created, AI may or may not have run yet.
  - `auto_approved` – AI deems it ready, no human touched it.
  - `needs_review` – AI completed, but system thinks human should verify.
  - `approved` – human explicitly approved.
  - `rejected` – human explicitly rejected.

**User hints**

- `userTitleHint` – short text hint or working title.
- `userDescriptionHint` – rough description.
- `userNotes` – optional notes for internal use.

**Media**

- Array of media items:
  - `id`
  - `url`
  - `sortOrder`
  - `isPrimary`
  - `width`, `height` (optional, if known)

**Listing content (AI + human editable)**

- **Core:**
  - `title`
  - `subtitle` (optional)
  - `description`
  - `condition` (generic; mappable to eBay’s condition enums)

- **Category (AI primary, human overridable):**
  - `categoryPath` (generic path, e.g. `["Electronics", "Cameras", "Film Cameras"]`)
  - `primaryCategoryId` (internal generic category ID)
  - `ebayCategoryId` (most likely eBay category for this item)

- **Attributes (item specifics):**
  - Array of:
    - `key` (e.g. `"Brand"`, `"Model"`, `"Size"`)
    - `value`
    - `source` (`"ai"` | `"user"` | `"imported"`)
    - `confidence` (0–1, for AI-derived)

- **Pricing:**
  - `suggestedPrice` (core number)
  - `priceMin` / `priceMax` (optional range)
  - `currency` (e.g. `"USD"`)
  - `pricingStrategy` (e.g. `"aggressive"`, `"balanced"`, `"premium"`)

- **Shipping:**
  - `shippingType` (`"flat"`, `"local_pickup"`, `"calculated"`)
  - `flatRateAmount` (if `shippingType = "flat"`)
  - `domesticOnly` (boolean)
  - Optional notes (e.g. “Recommend free shipping to match comps”).

**Component-level QA flags**

For each major component:

- `titleStatus` (`"ok" | "needs_review" | "flagged"`)
- `descriptionStatus`
- `categoryStatus`
- `pricingStatus`
- `attributesStatus`

These can be set by AI (low confidence) or by human reviewers.

**AI metadata**

- `aiPipelineVersion` (e.g. `"listing-intake-v1"`)
- `aiStatus` (`"idle" | "queued" | "running" | "complete" | "error"`)
- `aiLastRunAt`
- `aiErrorMessage` (if any)
- Optional `aiConfidenceScore` (composite).

---

### 4.2 EvidenceBundle – why AI thinks what it thinks

For each ListingDraft, an **EvidenceBundle** stores the data the AI used to support decisions.

**Fields:**

- `id`
- `listingDraftId`
- `generatedAt`
- `sources: EvidenceItem[]`

**Example EvidenceItem types:**

- `type: "marketplace_sold"` – eBay sold listing:
  - `marketplace` (e.g. `"ebay"`)
  - `url`
  - `title`
  - `price`
  - `shippingCost`
  - `soldDate`
  - `condition`
  - `thumbUrl`
  - `relevanceScore` (similarity to subject item)

- `type: "marketplace_active"` – eBay active listing:
  - `url`, `title`, `price`, `shippingCost`, `timeLeft`, `sellerRating`, etc.

- `type: "article_metadata"` – external metadata:
  - `url`
  - `title`
  - `snippet`
  - `siteName`

- `type: "summary"` – AI-generated, human-readable summary:
  - `kind` (e.g. `"pricing_overview"`, `"condition_overview"`, `"category_justification"`)
  - `text`
  - Optional structured fields (e.g. `avgPrice`, `medianPrice`).

EvidenceBundle is surfaced in the review UI so humans can see the rationale, not just the output.

---

### 4.3 ResearchSnapshot – compressed summary for fast UI

A denser, UI-friendly summary extracted from the EvidenceBundle:

- `pricingStats`:
  - `avgPrice`, `medianPrice`, `minPrice`, `maxPrice`
  - counts of sold & active comps

- `conditionStats`:
  - Most common condition across comps
  - Condition distribution

- `titlePatterns`:
  - Common keywords in comp titles (e.g. “vintage”, “rare”, specific model codes)

- `shippingPatterns`:
  - % of comps with free shipping vs paid
  - Typical shipping price range

This snapshot powers a sidebar or “overview chip” in the review UI without requiring the UI to parse raw evidence every time.

---

## 5. System Overview: Three Zones

1. **Ingestion Zone (Mobile-first)**
   - Quick capture of items via photos + optional hints.
   - No expectation of waiting for AI results.

2. **Autonomous Investigation Zone (Background AI)**
   - Heavy AI pipeline:
     - Item understanding (vision + text),
     - Category and attributes inference,
     - eBay comps research,
     - Pricing & shipping suggestion,
     - Title & description generation,
     - Validation & status assignment.
   - Designed to be latency-tolerant (seconds to minutes).

3. **Human-in-the-loop Zone (Desktop Review Deck)**
   - High-throughput, queue-based review experience.
   - “Swipe right/left” style decisions.
   - Component-level flags and evidence exploration.

---

## 6. Detailed Flows

### 6.1 Mobile Ingestion Flow

**Goal:** Let a user (or intake operator) rapidly capture items without waiting for AI.

#### UX: Capture

1. **Open “Capture” mode** on mobile:
   - Shows:
     - Large “New Item” button.
     - Optional display of a current “Intake Session” (e.g. “Today’s batch”).

2. **Add photos:**
   - Opens camera or gallery.
   - User selects or takes one or multiple photos.
   - UI shows thumbnails and allows:
     - Reordering.
     - Marking a primary image.

3. **Optional hints:**
   - Short text input:
     - “What is this?” (title/description hint).
   - User can skip, type a quick phrase, or paste details.

4. **Save item:**
   - User taps “Save” or “Add to batch.”
   - Immediately sees confirmation:
     - “Item captured. AI is researching in the background.”
   - Can quickly move on to the next item.

#### Data Flow: Ingestion

1. **Photos uploaded** to storage:
   - Mobile app uploads photos.
   - Receives media URLs or IDs.

2. **Create ListingDraft (Ingestion API)**
   - Client sends:
     - `media` references,
     - `userTitleHint`, optional `userDescriptionHint`,
     - optional `ingestionSessionId`.
   - Backend creates ListingDraft:
     - `ingestionStatus = "ai_queued"`
     - `reviewStatus = "unreviewed"`
     - media & hints stored.
   - Backend schedules AI job.
   - Returns the newly created ListingDraft (or summary) to the client.

3. **Mobile UI**
   - Displays item in a “Captured items” list with:
     - Thumbnail.
     - Status label (“AI processing”).

No AI result is shown at this stage; the operator is optimized for speed of capture.

---

### 6.2 Background AI Investigation Flow

**Goal:** Turn ListingDraft + media + hints → enriched ListingDraft + EvidenceBundle + ResearchSnapshot.

#### Conceptual Pipeline Steps

1. **Item Understanding (Vision + Hints)**

   Inputs:
   - Item images.
   - `userTitleHint` / `userDescriptionHint`.

   Outputs:
   - Combined **item understanding**:
     - Text from images (labels, model numbers, logos).
     - Visual cues for category and condition.
     - Consolidated textual description (“itemContext”).

2. **Category & Attribute Inference**

   Using `itemContext`, AI:

   - Classifies category:
     - Suggests a generic category path.
     - Suggests `ebayCategoryId`.

   - Extracts candidate attributes:
     - `Brand`, `Model`, `Size`, `Color`, `Material`, etc.
     - Marks each attribute with source=`"ai"` & confidence score.

   - Estimates **condition**:
     - `new`, `used_good`, `used_very_good`, etc.,
     - based on visible wear and any hint text describing condition.

3. **eBay Comps Research**

   Using the inferred attributes (esp. brand and model):

   - Query **eBay sold listings**:
     - Filter by category, brand, model, condition, etc.
   - Query **eBay active listings**:
     - Same filters to gauge competition.
   - Results are stored as:
     - Individual EvidenceItems (sold/active comp records),
     - Raw pricing data for ResearchSnapshot.

4. **Pricing Recommendation**

   AI uses comps & condition to:

   - Compute:
     - average, median, min, max sold prices.
   - Generate a **pricing recommendation**:
     - Suggest one main `suggestedPrice` (e.g. slightly below median to ensure sale).
     - Optionally fill `priceMin` / `priceMax`:
       - `priceMin`: quick-sale price.
       - `priceMax`: high-end hold-out price.
   - Provide a **short explanation text** (EvidenceItem summary) like:
     - “Most similar sold items are between $70–$90. Recommended price $79.99 to move quickly.”

5. **Title & Description Generation**

   Using category, attributes, and pricing insights, AI generates:

   - **Title**:
     - Marketplace-friendly.
     - Includes brand, model, and key attributes.
     - Respects length constraints.

   - **Description**:
     - Describes the item, condition, included accessories, notable flaws.
     - Summarizes key attributes as bullet points or structured text.

6. **Shipping Suggestion**

   AI suggests:

   - `shippingType`:
     - `flat` (with amount),
     - `local_pickup` (for heavy/bulky),
     - or `calculated`.
   - Leverages eBay comps:
     - If most comps offer free shipping, consider recommending that.
   - Provide a short reasoning in an EvidenceItem summary.

7. **Validation & Status Assignment**

   The pipeline validates whether essential fields are present and high-confidence:

   - Check:
     - At least one valid image.
     - Non-empty title.
     - Category assigned.
     - Suggested price exists.
     - Description not too short.
   - Based on results:
     - If all required fields are present with acceptable confidence:
       - `reviewStatus` may be set to `auto_approved`.
     - If some are missing or low-confidence:
       - `reviewStatus` set to `needs_review`.

   - Component-level flags (e.g. `pricingStatus`, `categoryStatus`) are set based on confidence or rule violations.

#### Data Updates

At the end of the pipeline:

- **ListingDraft is updated** with:
  - AI-generated title, description, condition, category, attributes, price, shipping.
  - `ingestionStatus = "ai_complete"`
  - Updated `reviewStatus` (auto_approved or needs_review).
  - Component flags and AI metadata (version, timestamps, error info if any).

- **EvidenceBundle is created/updated**:
  - Contains raw comps (sold & active) as EvidenceItems.
  - Contains any article or metadata references.
  - Contains AI-generated summary items.

- **ResearchSnapshot is stored or derivable**:
  - Pricing stats, title/keyword patterns, condition and shipping patterns.

---

### 6.3 Desktop Review Deck Flow (Human-in-the-loop)

**Goal:** Provide a high-throughput, evidence-rich UI for review and approval.

#### Review Deck Screen Layout

1. **Left: Review Queue**
   - Filterable list:
     - Filter by `reviewStatus` (unreviewed, auto_approved, needs_review, approved, rejected).
     - Filter by assigned reviewer, category, time range.
   - Each queue item shows:
     - Thumbnail.
     - Title (AI-generated).
     - Suggested price.
     - Status badges (e.g., “Needs Pricing Review”).
     - Basic evidence count (e.g., “18 comps”).

2. **Center: Listing Card**
   - Primary photo large enough to inspect.
   - Key details:
     - Title.
     - Condition.
     - Suggested price (with min/max, if available).
     - Category path.
   - Inline components, each with:
     - Label.
     - Indicator if AI-suggested & confidence level.
     - Quick status icons:
       - ✅ OK
       - ⚠️ Needs manual

3. **Right: Evidence Panel**
   - Tabs:
     - **Pricing Comps**:
       - Sold comps table.
       - Active comps table.
     - **Attributes & Specs**:
       - Attributes list and where they came from.
     - **Articles / Metadata**:
       - External references, if any.
     - (Optional) **AI Reasoning**:
       - Summaries explaining decisions.

   - Each table or list entry:
     - Clickable to open the source URL in a new tab (eBay listing, article, etc.).

#### Actions (“Swipe-style” Review)

Main actions:

- **Approve listing (swipe right)**:
  - Signals: “This listing is ready for future publishing.”
  - Effects:
    - `reviewStatus = "approved"`.
    - Component flags updated (e.g. all marked OK unless manually set).

- **Reject listing (swipe left)**:
  - Signals: “Do not list this item as-is.”
  - Effects:
    - `reviewStatus = "rejected"`.
    - Optional `rejectionReason` recorded.

- **Send to manual refinement**:
  - Signals: “Specific components need manual edit by a listing specialist.”
  - Effects:
    - `reviewStatus` could remain `needs_review` (but with a special substatus) or moved to a separate “manual editing” queue.
    - Component flags updated, e.g.:
      - `pricingStatus = "needs_review"`
      - `titleStatus = "ok"`

Component-level flags:

- Each component (title, description, category, pricing, attributes) has a small UI control:
  - Click to toggle between:
    - OK
    - Needs manual
    - Flagged (for serious concern)

#### Post-action Behavior

- After a decision (approve/reject/send-to-manual):

  - The listing:
    - Is moved to the corresponding state.
    - Is removed from the current reviewer’s active queue (or marked as done).
  - The UI:
    - Automatically loads the next listing in the queue into the center card.
    - For large teams, the queue retrieval can respect reviewer assignments.

---

### 6.4 Editing and Re-running AI

**Editing**

- From the Listing Detail view (accessible from Review Deck or a dedicated listing page):

  - Users can edit:
    - Title.
    - Description.
    - Category (via a simple search/select UI).
    - Attributes (add/remove/edit rows).
    - Price and shipping.

- When users edit fields:

  - Those changes are sent to the backend via **Update ListingDraft**.
  - Backend revalidates:
    - If the listing now has all required fields, it could move toward `auto_approved` or remain `needs_review` depending on business rules.

**Re-running AI**

- A “Re-run AI” button is available on the detail page or review card.

- Behavior:
  - Shows confirmation: “Re-run AI on this item? We will update suggestions based on your current edits.”
  - Backend:
    - Schedules a new AI job using the current version of the listing (with user edits).
    - Updates `aiStatus` to queued/running.
  - When AI finishes:
    - Updates suggestions (e.g., price and description).
    - Attempts not to overwrite fields clearly set by the user (policy TBD).
    - Updates statuses and evidence accordingly.

---

## 7. API Surface (Conceptual)

> These are **conceptual endpoints** – names and responsibilities, *not* controller definitions or code.

### 7.1 Ingestion APIs

- **POST `/ingestion/listings`**
  - Purpose:
    - Capture a new item and create a ListingDraft.
  - Input:
    - Media references (image URLs or upload IDs).
    - Optional `userTitleHint`, `userDescriptionHint`.
    - Optional `ingestionSessionId`.
  - Output:
    - ListingDraft summary (id, thumbnail, statuses).
  - Side effects:
    - AI job scheduled for listing-intake pipeline.

- **GET `/ingestion/listings`**
  - Purpose:
    - Show recently captured listings for a user/session on mobile.
  - Filters:
    - session, creator, status.
  - Output:
    - Lightweight listing summaries (thumbnail, status, createdAt).

---

### 7.2 Listing Draft APIs

- **GET `/listings/drafts`**
  - Purpose:
    - Provide data for listing lists and Review Deck queue.
  - Filters:
    - `reviewStatus`, `ingestionStatus`, `assignedReviewer`, date ranges, etc.
  - Output:
    - Paginated list of ListingDraft **summaries**.

- **GET `/listings/drafts/:id`**
  - Purpose:
    - Load full details for a single listing draft.
  - Output:
    - Complete ListingDraft object (all fields, statuses, flags).

- **PATCH `/listings/drafts/:id`**
  - Purpose:
    - Apply user edits to listing contents.
  - Input:
    - Partial listing object with changed fields.
  - Behavior:
    - Updates fields.
    - Re-runs validation to recompute `reviewStatus` if warranted.

---

### 7.3 AI & Pipeline Control APIs

- **POST `/listings/drafts/:id/ai-run`**
  - Purpose:
    - Manually trigger an AI pipeline run/re-run for a specific listing.
  - Input:
    - Optional pipeline options (simple for now; just re-run).
  - Output:
    - Updated AI metadata (status, pipeline version).

- (Optional) **GET `/listings/drafts/:id/ai-status`**
  - Purpose:
    - Lightweight status polling if needed.

---

### 7.4 Evidence & Research APIs

- **GET `/listings/drafts/:id/evidence`**
  - Purpose:
    - Provide all evidence data for the Evidence panel.
  - Output:
    - EvidenceBundle:
      - EvidenceItem[] (sold comps, active comps, articles, summaries).
    - ResearchSnapshot:
      - Aggregated pricing stats, patterns, etc.

This endpoint is heavily used by the desktop Review Deck, allowing it to show a rich explanation behind AI decisions.

---

### 7.5 Review APIs

- **GET `/review/queue`**
  - Purpose:
    - Provide the list of listings to be reviewed next for a given reviewer or group.
  - Filters:
    - `reviewStatus` (e.g. `needs_review`), `assignedReviewer`, category, etc.
  - Output:
    - Ordered list of ListingDraft summaries for review.

- **POST `/listings/drafts/:id/review`**
  - Purpose:
    - Apply a high-level review decision (approve/reject/send-to-manual).
  - Input:
    - `action: "approve" | "reject" | "needs_manual"`
    - Optional:
      - Component statuses.
      - Review comment.
  - Output:
    - Updated ListingDraft (reviewStatus and flags).

- **POST `/listings/drafts/:id/review/components`** (optional if you want fine-grained)
  - Purpose:
    - Update component-level flags independently from the overall decision.
  - Input:
    - Component name → status mappings.
  - Output:
    - Updated component flags.

---

## 8. Scaling & Operational Considerations (Product-level)

- **Decoupled ingestion & review:**
  - Intake operators can continue adding items even if AI or review is backlogged.
  - ListingDraft statuses show backlog clearly (`unreviewed`, `needs_review`).

- **Multi-employee support:**
  - Listings can be:
    - Unassigned (any reviewer can pick).
    - Assigned to specific reviewers.
  - Locks for active review sessions can avoid double review (e.g., soft lock for a short window).

- **Async & latency tolerance:**
  - AI jobs may take tens of seconds or minutes.
  - System treats AI as eventual:
    - Mobile users move on to next item.
    - Desktop reviewers always see the latest `aiStatus` before taking action.

- **eBay dependency:**
  - Comps and pricing rely on eBay APIs.
  - If eBay is unavailable:
    - AI pipeline can mark `pricingStatus = "needs_review"` and leave pricing unfinished.
    - Listing remains in `needs_review` until human sets price.

---

## 9. Future Extension: Valuation-only Pipeline (Design Hook)

Although not implemented in this phase, the architecture should enable:

- A separate “Valuation Request” mode that:
  - Uses the same research steps (eBay comps, EvidenceBundle, ResearchSnapshot).
  - Outputs **only**:
    - Estimated value,
    - Pricing stats,
    - Evidence.
  - Does **not** generate full listing content.

This can be added later by:

- Reusing:
  - AI research components.
  - EvidenceBundle model.
- Adding:
  - `POST /valuation` endpoints.
  - Separate UI surfaces for quick valuations.

No changes to the core ListingDraft/EvidenceBundle design are needed to support this.

Device & UX assumptions

Desktop web is the primary, full-power client:

Can perform all actions: ingestion, bulk uploads, editing, review, evidence exploration, and AI re-runs.

Hosts the full Review Deck experience.

Mobile web is a focused subset of the same app:

Optimized for item ingestion (photos + hints) and quick status checks.

Uses the exact same ingestion and listing APIs as desktop.

May expose a slimmed-down view of drafts, but not the full evidence-heavy Review Deck in Phase 5.

---

## 10. Open Questions / TBD (for future phases)

These are intentionally left flexible and can be refined as you implement:

1. **Component override policy:**
   - When re-running AI after user edits, how aggressively can AI override user-set fields?
   - Possible rule: AI only suggests alternative values but doesn’t overwrite user-set fields unless explicit.

2. **Auto-approval thresholds:**
   - Under what exact conditions should a listing be marked `auto_approved` vs `needs_review`?
   - Example: only auto-approve low-value items, or when confidence scores exceed a threshold.

3. **Detailed condition model:**
   - How granular should conditions be at first (e.g., eBay’s full condition set vs a simpler internal set)?
   - Mapping strategy to eBay’s condition enums will matter in the publishing phase.

4. **Review routing for large teams:**
   - Should items be auto-assigned to specific reviewers based on category, value, or workload?
   - For now, a simple unassigned pool + “assign to me” may be sufficient.

5. **Mobile offline/low-connectivity behavior:**
   - Should ingestion support capturing items offline and uploading later?

6. **Audit & logging:**
   - To what extent should review decisions and AI pipeline steps be auditable for compliance or QA?

---

This spec gives you a **single source of truth** for Phase 5: what the system does, what users see, how data flows, and how it’s structured — without diving into implementation details like frameworks, controllers, or specific classes. You can now drop this into the repo as something like:

`docs/PHASE5_LISTING_ENGINE.md`

and use it to drive implementation and feed into your Cursor rules / agents.

---

## 11. Implementation Subphases

Phase 5 is broken into 5 vertical slices, each delivering end-to-end usable functionality. This allows incremental development with working features at each milestone.

### Subphase Dependencies

```
5.1 Foundation ──┬──> 5.2 Evidence ──┬──> 5.4 Evidence UI
                 │                    │
                 └──> 5.3 Review Deck ┘
                                      │
                                      └──> 5.5 Polish
```

5.1 and 5.2 can partially overlap. 5.3 depends on 5.1. 5.4 depends on 5.2 and 5.3. 5.5 is polish on top of everything.

---

### Subphase 5.1 – ListingDraft Foundation & Basic Ingestion

**Goal:** Establish the core ListingDraft data model and fast capture workflow.

**Deliverables:**

1. **Database & Entity**
   - `listing_drafts` table with:
     - Dual status tracking (`ingestion_status`, `review_status`)
     - User hint fields (`user_title_hint`, `user_description_hint`, `user_notes`)
     - Media array (JSONB)
     - AI-generated content fields (title, description, condition, category, attributes, pricing, shipping)
     - Component-level QA flags (`title_status`, `pricing_status`, etc.)
     - AI metadata (`ai_pipeline_version`, `ai_last_run_at`, `ai_confidence_score`)
   - `ListingDraft` TypeORM entity

2. **API Endpoints**
   - `POST /ingestion/listings` – Create draft from photos + hints, schedule AI job
   - `GET /ingestion/listings` – List recent drafts for mobile (lightweight summaries)
   - `GET /listings/drafts/:id` – Full draft details
   - `PATCH /listings/drafts/:id` – Update draft fields

3. **Types Package Updates**
   - `@listforge/core-types`: `IngestionStatus`, `ReviewStatus`, `ComponentStatus` enums
   - `@listforge/api-types`: `ListingDraftDto`, `CreateListingDraftRequest`, etc.
   - `@listforge/api-rtk`: RTK Query hooks for new endpoints

4. **Frontend: Capture UI**
   - New `/capture` route with mobile-first UX
   - Large "New Item" button
   - Photo upload with drag-to-reorder
   - Collapsible hints input (title hint, description hint)
   - "Add to batch" action with immediate feedback
   - Recently captured items list with status badges ("AI Processing", "Ready for Review")

**Key Files:**

```
packages/core-types/src/listing-draft.ts          (new)
packages/api-types/src/listing-drafts.ts          (new)
packages/api-rtk/src/api.ts                       (update)
apps/listforge-api/src/listing-drafts/            (new module)
  ├── entities/listing-draft.entity.ts
  ├── listing-drafts.module.ts
  ├── listing-drafts.controller.ts
  ├── listing-drafts.service.ts
  └── dto/
apps/listforge-web/src/routes/_authenticated/
  └── capture/
      └── index.tsx                               (new)
```

**Migration Strategy:**

ListingDraft is introduced as a new concept parallel to the existing `Item` + `MetaListing` flow. Existing functionality remains unchanged; Phase 5 adds a new path optimized for the intake/review workflow.

---

### Subphase 5.2 – Evidence Infrastructure & Enhanced AI Pipeline

**Goal:** Capture and store all evidence the AI uses for decisions.

**Deliverables:**

1. **Database & Entities**
   - `evidence_bundles` table with `listing_draft_id` FK
   - `evidence_items` table with polymorphic `type` field:
     - `marketplace_sold` – eBay sold listing comp
     - `marketplace_active` – eBay active listing comp
     - `article_metadata` – external reference
     - `summary` – AI-generated explanation
   - `ResearchSnapshot` stored as JSONB on `ListingDraft`

2. **Enhanced AI Pipeline**
   - New `ListingIntakeWorkflow` (evolves from `PhotoIntakeWorkflow`)
   - Pipeline steps:
     1. Vision Extract → item understanding
     2. Category & Attribute Inference → with confidence scores
     3. eBay Comps Research → store as EvidenceItems
     4. Pricing Recommendation → with min/max/suggested + reasoning
     5. Title & Description Generation
     6. Shipping Suggestion
     7. Validation & Status Assignment → set component flags
   - All comps persisted to `evidence_items`
   - ResearchSnapshot computed (pricing stats, condition distribution, shipping patterns)

3. **API Updates**
   - Evidence data included in `GET /listings/drafts/:id` response
   - Dedicated `GET /listings/drafts/:id/evidence` endpoint (optional, for lazy loading)

**Key Files:**

```
packages/core-types/src/evidence.ts                      (new)
apps/listforge-api/src/evidence/                         (new module)
  ├── entities/evidence-bundle.entity.ts
  ├── entities/evidence-item.entity.ts
  ├── evidence.module.ts
  └── evidence.service.ts
apps/listforge-api/src/ai-workflows/
  └── workflows/listing-intake.workflow.ts               (new)
```

---

### Subphase 5.3 – Review Deck MVP

**Goal:** High-throughput queue-based review experience.

**Deliverables:**

1. **API Endpoints**
   - `GET /review/queue` – Filterable queue (status, assignee, category, date range)
   - `POST /listings/drafts/:id/review` – Apply review decision:
     - `action: "approve" | "reject" | "needs_manual"`
     - Optional component status overrides
     - Optional review comment

2. **Review Module**
   - `ReviewService` with queue retrieval logic
   - Reviewer assignment support (optional `assigned_reviewer_user_id`)

3. **Frontend: Review Deck Layout**
   - New `/review` route
   - Three-column layout:
     - **Left:** Review Queue (filterable list with thumbnails, titles, prices, status badges)
     - **Center:** Listing Card (primary image, title, condition, price, category, component flags)
     - **Right:** Placeholder for Evidence Panel (built in 5.4)
   - Action buttons: Approve, Reject, Needs Manual
   - Auto-advance to next item after action
   - Keyboard shortcuts (optional in this phase)

**Key Files:**

```
packages/api-types/src/review.ts                         (new)
apps/listforge-api/src/review/                           (new module)
  ├── review.module.ts
  ├── review.controller.ts
  └── review.service.ts
apps/listforge-web/src/routes/_authenticated/
  └── review/
      └── index.tsx                                      (new)
apps/listforge-web/src/components/review/
  ├── ReviewQueue.tsx                                    (new)
  ├── ListingCard.tsx                                    (new)
  └── ReviewActions.tsx                                  (new)
```

---

### Subphase 5.4 – Evidence Panel & Research UI

**Goal:** Expose all AI reasoning and evidence to reviewers.

**Deliverables:**

1. **API Endpoint**
   - `GET /listings/drafts/:id/evidence` – Full evidence bundle with:
     - `EvidenceItem[]` (sold comps, active comps, summaries)
     - `ResearchSnapshot` (pricing stats, patterns)

2. **Frontend: Evidence Panel**
   - Tabbed interface in right column of Review Deck:
     - **Pricing Comps** tab:
       - Sold comps table (title, price, sold date, condition, thumbnail, link)
       - Active comps table (title, price, time left, seller rating, link)
       - Pricing stats summary (avg, median, min, max, comp counts)
     - **Attributes & Specs** tab:
       - Attribute list with source indicators (AI/user/imported)
       - Confidence scores where applicable
     - **AI Reasoning** tab:
       - Summary items explaining decisions
       - Pricing rationale, category justification, etc.
   - External links open in new tab (eBay listing URLs)

3. **ResearchSnapshot Display**
   - Compact summary chip on Listing Card showing:
     - "18 comps · $70–$90 range"
     - Click to expand Evidence Panel

**Key Files:**

```
packages/api-types/src/evidence.ts                       (update)
apps/listforge-api/src/listing-drafts/
  └── listing-drafts.controller.ts                       (add evidence endpoint)
apps/listforge-web/src/components/review/
  ├── EvidencePanel.tsx                                  (new)
  ├── PricingCompsTab.tsx                                (new)
  ├── AttributesTab.tsx                                  (new)
  └── AiReasoningTab.tsx                                 (new)
```

---

### Subphase 5.5 – Polish & Advanced Features

**Goal:** Power-user features and team workflow support.

**Deliverables:**

1. **Keyboard Shortcuts**
   - `→` or `A` – Approve
   - `←` or `R` – Reject
   - `↓` or `S` – Skip / Needs Manual
   - `E` – Focus edit mode

2. **Re-run AI**
   - "Re-run AI" button on Listing Card
   - Confirmation dialog explaining behavior
   - Backend: `POST /listings/drafts/:id/ai-run`
   - Preserves user-edited fields (policy: AI suggests but doesn't overwrite)

3. **Inline Editing**
   - Click-to-edit on title, description, price, category
   - Attribute row add/edit/delete
   - Immediate save via `PATCH /listings/drafts/:id`

4. **Component Flag Toggles**
   - Visual toggle on each component (OK / Needs Review / Flagged)
   - Updates component status via API

5. **Auto-approval Rules**
   - Configurable thresholds:
     - Confidence score minimum (e.g., > 0.8)
     - Price range (e.g., < $100 auto-approve)
   - Stored as org-level settings

6. **Reviewer Assignment (for teams)**
   - `assigned_reviewer_user_id` field on ListingDraft
   - "Assign to me" action in queue
   - Filter queue by assigned reviewer
   - Optional: auto-assignment based on category or workload

**Key Files:**

```
apps/listforge-web/src/routes/_authenticated/review/
  └── index.tsx                                          (keyboard shortcuts)
apps/listforge-web/src/components/review/
  ├── ListingCard.tsx                                    (inline editing)
  └── ComponentFlagToggle.tsx                            (new)
apps/listforge-api/src/listing-drafts/
  └── listing-drafts.controller.ts                       (ai-run endpoint)
apps/listforge-api/src/organizations/
  └── entities/organization.entity.ts                    (auto-approval settings)
```

---

### Summary: What Each Subphase Delivers

| Subphase | User Can... | Technical Milestone |
|----------|-------------|---------------------|
| **5.1** | Capture items with photos + hints, see AI processing status | ListingDraft entity, Ingestion APIs, Capture UI |
| **5.2** | (Backend) AI stores all evidence and reasoning | EvidenceBundle, ResearchSnapshot, Enhanced pipeline |
| **5.3** | Review listings in a queue-based deck, approve/reject | Review APIs, Review Deck layout |
| **5.4** | See all comps, pricing stats, AI reasoning | Evidence Panel, Comps tables |
| **5.5** | Use keyboard shortcuts, re-run AI, edit inline, auto-approve | Power-user features, Team workflows |