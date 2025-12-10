# Research Agent: Confirmed Specification

**Date:** 2025-12-09
**Status:** Requirements confirmed, ready for implementation

---

## Confirmed Requirements

| # | Decision | Confirmed Choice |
|---|----------|------------------|
| 1 | Goal Execution Order | **Hybrid** - Strict sequence until product ID confirmed with high confidence, then parallelize metadata + market research |
| 2 | Unvalidatable Comps | **Context-dependent** - Discard if 5+ validated comps exist, keep with discount (0.25-0.30) if comps are scarce. Note: eBay keyword→image validation always possible since both our items and eBay listings have images |
| 3 | Min Comps for Pricing | **Tiered thresholds** - 3 comps = "low confidence estimate", 5 comps = "recommended", 10+ comps = "high confidence" |
| 4 | Low ID Confidence | **Continue with best guess** - Try diverse tools, but if still low confidence, proceed rather than loop forever. Better to automate something than nothing |
| 5 | Match Type Weights | **Approved** - UPC=0.95, ASIN=0.90, eBay Item ID=0.90, Brand+Model+Image=0.85, Brand+Model keyword=0.50, Image similarity=0.65, Generic keyword=0.30 |
| 6 | Planning Depth | **Medium** (~1000 tokens) - Structured plan with tool sequence and challenge anticipation |
| 7 | Human Review Thresholds | **User-configurable with conservative default** - New organization setting required |
| 8 | Research Budget | **No limit, optimize for quality** - Track costs for analytics but never cap spending |
| 9 | Data Source Priority | **Field-dependent** - Different sources authoritative for different fields (UPC DBs for identifiers, Vision AI for condition, eBay for pricing) |
| 10 | Listing Assembly | **Include everything, flag low-confidence** - Visual indicators draw user attention to fields needing review |

---

## Architecture Overview

### Goal-Driven Hybrid Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: IDENTIFICATION (STRICT SEQUENCE)            │
│                                                                             │
│  START → plan_research → load_context → extract_identifiers                 │
│        → identify_product → validate_identification                         │
│                                                                             │
│  EXIT CRITERIA: Product identification confidence ≥ 0.85                    │
│  IF NOT MET: Try alternative methods, then continue with best guess         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 2: PARALLEL RESEARCH                              │
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────┐              │
│  │   METADATA GATHERING     │    │    MARKET RESEARCH       │              │
│  │                          │    │                          │              │
│  │  detect_marketplace      │    │  search_comps            │              │
│  │  → field_research_loop   │    │  → validate_comps        │              │
│  │  → validate_readiness    │    │  → analyze_comps         │              │
│  │                          │    │  → calculate_price       │              │
│  └──────────────────────────┘    └──────────────────────────┘              │
│                                                                             │
│  RUNS IN PARALLEL - Both branches execute concurrently                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 3: ASSEMBLY & ROUTING                             │
│                                                                             │
│  assemble_listing → calculate_overall_confidence → route_by_confidence      │
│                   → persist_results → END                                   │
│                                                                             │
│  ROUTING: Based on user-configurable thresholds (conservative default)      │
│  - High confidence → Auto-proceed                                           │
│  - Medium confidence → Spot check                                           │
│  - Low confidence → Full review                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Comp Validation System

### Match Type Confidence Matrix

```typescript
const MATCH_TYPE_CONFIDENCE = {
  'UPC_EXACT': 0.95,           // Almost certainly same product
  'ASIN_EXACT': 0.90,          // Very reliable
  'EBAY_ITEM_ID': 0.90,        // Same as ASIN
  'BRAND_MODEL_IMAGE': 0.85,   // High confidence with visual confirmation
  'BRAND_MODEL_KEYWORD': 0.50, // Needs image validation (always available for eBay)
  'IMAGE_SIMILARITY': 0.65,    // Needs metadata validation
  'GENERIC_KEYWORD': 0.30,     // Low value, likely noise
};
```

### Validation Flow for eBay Keyword Matches

```typescript
// eBay keyword matches ALWAYS get image validated
// (both our items and eBay listings guaranteed to have images)

async function validateKeywordMatch(comp: Comp, itemImages: string[]): Promise<number> {
  const baseConfidence = 0.50; // BRAND_MODEL_KEYWORD

  // Always perform image validation for eBay keyword matches
  const imageScore = await checkImageSimilarity(comp.images, itemImages);

  if (imageScore >= 0.80) {
    return 0.85; // Upgrade to BRAND_MODEL_IMAGE confidence
  } else if (imageScore >= 0.50) {
    return baseConfidence * imageScore; // Partial match
  } else {
    return 0.20; // Images don't match - probably wrong product
  }
}
```

### Context-Dependent Comp Filtering

```typescript
function filterComps(comps: ValidatedComp[]): ValidatedComp[] {
  const validatedComps = comps.filter(c => c.validationScore >= 0.60);

  if (validatedComps.length >= 5) {
    // We have enough good comps - be strict
    return validatedComps;
  } else {
    // Comps are scarce - include lower-quality with discount
    const marginalComps = comps
      .filter(c => c.validationScore >= 0.25 && c.validationScore < 0.60)
      .map(c => ({ ...c, validationScore: c.validationScore * 0.5 })); // Heavy discount

    return [...validatedComps, ...marginalComps];
  }
}
```

---

## Pricing Confidence Tiers

```typescript
interface PricingResult {
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidenceLevel: 'low' | 'recommended' | 'high';
  confidenceScore: number;
  compCount: number;
  reasoning: string;
}

function determinePricingConfidence(validatedCompCount: number): PricingConfidenceLevel {
  if (validatedCompCount >= 10) {
    return {
      level: 'high',
      label: 'High Confidence',
      description: 'Strong pricing data from 10+ validated comparables',
    };
  } else if (validatedCompCount >= 5) {
    return {
      level: 'recommended',
      label: 'Recommended',
      description: 'Good pricing data from 5+ validated comparables',
    };
  } else if (validatedCompCount >= 3) {
    return {
      level: 'low',
      label: 'Low Confidence Estimate',
      description: 'Limited pricing data - recommend manual verification',
    };
  } else {
    return {
      level: 'insufficient',
      label: 'Insufficient Data',
      description: 'Not enough comparables to estimate price reliably',
    };
  }
}
```

---

## Data Source Authority by Field

```typescript
const FIELD_SOURCE_AUTHORITY: Record<string, string[]> = {
  // Identifiers - structured databases most reliable
  'upc': ['upc_lookup', 'amazon_catalog', 'keepa'],
  'ean': ['upc_lookup', 'amazon_catalog'],
  'asin': ['amazon_catalog', 'keepa'],
  'mpn': ['amazon_catalog', 'web_search'],

  // Product info - catalog data preferred
  'brand': ['amazon_catalog', 'upc_lookup', 'vision_ai', 'web_search'],
  'model': ['amazon_catalog', 'upc_lookup', 'vision_ai', 'web_search'],
  'category': ['ebay_taxonomy', 'amazon_catalog', 'vision_ai'],

  // Physical attributes - vision AI best
  'condition': ['vision_ai', 'user_input'],
  'color': ['vision_ai', 'amazon_catalog'],
  'size': ['vision_ai', 'amazon_catalog', 'ocr'],

  // Pricing - marketplace data best
  'estimatedPrice': ['ebay_comps', 'amazon_catalog', 'keepa'],
  'priceRange': ['ebay_comps', 'amazon_catalog', 'keepa'],

  // Text content - AI generation best
  'title': ['ai_generation', 'amazon_catalog'],
  'description': ['ai_generation', 'amazon_catalog'],
};

function getSourceConfidenceForField(field: string, source: string): number {
  const authorityOrder = FIELD_SOURCE_AUTHORITY[field] || [];
  const position = authorityOrder.indexOf(source);

  if (position === -1) return 0.50; // Unknown source for this field
  if (position === 0) return 1.00;  // Primary authority
  if (position === 1) return 0.90;  // Secondary authority
  if (position === 2) return 0.75;  // Tertiary authority
  return 0.60; // Lower priority source
}
```

---

## Planning Phase (Medium Depth)

```typescript
const PLANNING_PROMPT = `
You are planning product research for an e-commerce listing.

ITEM CONTEXT:
- Title hint: {userTitleHint}
- Description hint: {userDescriptionHint}
- Images: {imageCount} photos available
- User notes: {userNotes}

ANALYZE AND PLAN:

1. VISUAL ASSESSMENT
   - What can you determine from the images alone?
   - Category, brand indicators, condition assessment
   - Any visible text (model numbers, labels, tags)?

2. IDENTIFICATION STRATEGY
   - Primary approach: What's most likely to identify this product?
   - Fallback approaches: If primary fails, what next?
   - Expected confidence level for identification?

3. TOOL SEQUENCE
   - Which tools should we use and in what order?
   - What inputs does each tool need?
   - What's the expected yield from each?

4. ANTICIPATED CHALLENGES
   - What might go wrong?
   - How should we handle each scenario?

5. SUCCESS CRITERIA
   - What constitutes successful identification?
   - What minimum data do we need for a good listing?

OUTPUT FORMAT (JSON):
{
  "visualAssessment": {
    "category": "...",
    "brandIndicators": [],
    "conditionEstimate": "...",
    "visibleText": []
  },
  "identificationStrategy": {
    "primaryApproach": "...",
    "fallbackApproaches": [],
    "expectedConfidence": 0.0-1.0
  },
  "toolSequence": [
    { "tool": "...", "inputs": "...", "expectedYield": "..." }
  ],
  "challenges": [
    { "risk": "...", "mitigation": "..." }
  ],
  "successCriteria": {
    "identification": "...",
    "minimumFields": []
  }
}
`;
```

---

## User-Configurable Review Thresholds

### New Organization Setting Required

```typescript
interface OrganizationResearchSettings {
  // Confidence thresholds for routing
  autoApproveThreshold: number;    // Default: 0.90 (conservative)
  spotCheckThreshold: number;      // Default: 0.70
  // Below spotCheckThreshold = full review required

  // Pricing display preferences
  showLowConfidencePricing: boolean;  // Default: true
  minCompsForPricing: number;         // Default: 3

  // Field flagging
  flagFieldsBelowConfidence: number;  // Default: 0.70
}

// Conservative defaults
const DEFAULT_RESEARCH_SETTINGS: OrganizationResearchSettings = {
  autoApproveThreshold: 0.90,
  spotCheckThreshold: 0.70,
  showLowConfidencePricing: true,
  minCompsForPricing: 3,
  flagFieldsBelowConfidence: 0.70,
};
```

### Settings UI Addition Needed

Add to Organization Settings page:

- **Research Confidence Thresholds** section
- Sliders for auto-approve and spot-check thresholds
- Preview of what percentage of items would fall into each bucket

---

## Listing Assembly: Field Flagging

```typescript
interface AssembledField {
  name: string;
  value: unknown;
  confidence: number;
  source: string;
  needsReview: boolean;  // True if confidence < threshold
}

interface AssembledListing {
  fields: AssembledField[];
  overallConfidence: number;
  reviewRequired: 'none' | 'spot_check' | 'full_review';
  flaggedFieldCount: number;
}

function assembleListing(
  researchData: ResearchData,
  settings: OrganizationResearchSettings,
): AssembledListing {
  const fields: AssembledField[] = [];

  for (const [name, data] of Object.entries(researchData.fields)) {
    fields.push({
      name,
      value: data.value,
      confidence: data.confidence,
      source: data.source,
      needsReview: data.confidence < settings.flagFieldsBelowConfidence,
    });
  }

  const flaggedCount = fields.filter(f => f.needsReview).length;
  const overallConfidence = calculateOverallConfidence(fields);

  return {
    fields,
    overallConfidence,
    reviewRequired: determineReviewLevel(overallConfidence, settings),
    flaggedFieldCount: flaggedCount,
  };
}
```

### Frontend Display

Flagged fields should have visual indicator:

- Yellow/amber highlight or border
- Confidence badge showing percentage
- Tooltip explaining why flagged
- Easy inline editing

---

## Cost Tracking (No Limits)

```typescript
interface ResearchCostTracking {
  // Per-run tracking
  runId: string;
  totalCostUsd: number;

  // Breakdown by tool
  toolCosts: {
    tool: string;
    calls: number;
    tokensUsed: number;
    costUsd: number;
  }[];

  // For analytics
  itemCategory?: string;
  itemComplexity?: 'simple' | 'moderate' | 'complex';
  finalConfidence: number;
}

// Track but NEVER limit
async function trackToolCost(
  runId: string,
  tool: string,
  tokens: number,
  cost: number,
): Promise<void> {
  await updateResearchRunCost(runId, {
    tool,
    tokens,
    cost,
    timestamp: new Date(),
  });

  // Analytics only - no enforcement
  logger.info(`Research cost update`, { runId, tool, cost, totalSoFar: await getTotalCost(runId) });
}
```

---

## Implementation: Vertical Slices

Each slice is a **complete, testable deliverable** that adds value independently.

### Slice 1: Goal System Foundation & Hybrid Graph Structure

**Goal:** Establish goal-driven architecture with strict ID phase, then parallel execution.

**Backend Changes:**

- `packages/core-types/src/research.ts` - Add goal types:
  - `ResearchGoal` interface with id, type, status, confidence, dependencies
  - `GoalType` enum: `IDENTIFY_PRODUCT`, `VALIDATE_IDENTIFICATION`, `GATHER_METADATA`, `RESEARCH_MARKET`, `ASSEMBLE_LISTING`
  - `GoalStatus` enum: `pending`, `in_progress`, `completed`, `failed`, `skipped`

- `apps/listforge-api/src/ai-workflows/graphs/research/research-graph.state.ts` - Add to state:
  - `goals: ResearchGoal[]`
  - `activeGoal: string | null`
  - `completedGoals: string[]`
  - `identificationConfidence: number`

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/initialize-goals.node.ts` - New node:
  - Creates goal DAG with dependencies
  - Sets initial goal to `IDENTIFY_PRODUCT`

- `apps/listforge-api/src/ai-workflows/graphs/research/research-graph.builder.ts` - Restructure graph:
  - Phase 1 (strict): `initialize_goals` → `load_context` → `extract_identifiers` → `identify_product` → `check_identification_confidence`
  - Conditional: If confidence < 0.85, try alternative ID methods, then continue anyway
  - Phase 2 (parallel): Fork to metadata gathering AND market research
  - Phase 3: Join and assemble

**Testable Outcome:** Research runs show goal progression in activity logs. Identification phase completes before market research begins.

---

### Slice 2: Planning Node (Pre-Act Pattern)

**Goal:** Add strategic planning before research execution.

**Backend Changes:**

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/plan-research.node.ts` - New node:
  - Analyzes item images and hints
  - Generates structured research plan (JSON)
  - Identifies likely category, brand indicators
  - Recommends tool sequence
  - Anticipates challenges

- `apps/listforge-api/src/ai-workflows/config/research.constants.ts` - Add planning prompt template

- `packages/core-types/src/research.ts` - Add types:
  - `ResearchPlan` interface
  - `ToolSequenceItem` interface

- Update graph to run `plan_research` after `initialize_goals`, before `load_context`

- Store plan in state and reference during tool selection

**Testable Outcome:** Research runs include a planning step. Activity logs show the generated plan. Tool selection becomes more intelligent.

---

### Slice 3: Comp Match Type Tracking & Base Validation

**Goal:** Track HOW each comp was matched and assign base confidence accordingly.

**Backend Changes:**

- `packages/core-types/src/research.ts` - Add types:
  - `CompMatchType` enum: `UPC_EXACT`, `ASIN_EXACT`, `EBAY_ITEM_ID`, `BRAND_MODEL_IMAGE`, `BRAND_MODEL_KEYWORD`, `IMAGE_SIMILARITY`, `GENERIC_KEYWORD`
  - `MATCH_TYPE_CONFIDENCE` constant map
  - Update `ResearchEvidenceRecord` to include `matchType`

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/search-comps.node.ts` - Update:
  - Tag each comp with its `matchType` based on how it was found
  - UPC search results → `UPC_EXACT`
  - ASIN search results → `ASIN_EXACT`
  - Keyword search results → `BRAND_MODEL_KEYWORD` or `GENERIC_KEYWORD`
  - Image search results → `IMAGE_SIMILARITY`

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/analyze-comps.node.ts` - Update:
  - Use `matchType` as base confidence instead of flat 0.5
  - Apply match-type-specific validation rules

**Testable Outcome:** Comps in database have `matchType` field. Validation scores vary by match type. UPC matches score higher than keyword matches.

---

### Slice 4: Image Cross-Validation for Keyword Comps

**Goal:** Validate keyword-matched comps by comparing images.

**Backend Changes:**

- `apps/listforge-api/src/ai-workflows/services/image-comparison.service.ts` - New service:
  - `compareImages(itemImages: string[], compImages: string[]): Promise<number>` - Returns similarity score 0-1
  - Uses OpenAI vision to compare product images
  - Caches results to avoid duplicate comparisons

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/validate-comps.node.ts` - New node (or update analyze-comps):
  - For `BRAND_MODEL_KEYWORD` comps: Call image comparison
  - If image score >= 0.80: Upgrade to `BRAND_MODEL_IMAGE` (0.85 confidence)
  - If image score >= 0.50: Partial match (0.50 * imageScore)
  - If image score < 0.50: Downgrade to 0.20 (probably wrong product)

- Apply context-dependent filtering:
  - If 5+ comps with score >= 0.60: Discard lower-scored comps
  - If < 5 good comps: Keep marginal comps with 0.5x discount

**Testable Outcome:** Keyword comps that visually match get upgraded confidence. Keyword comps that don't match visually get downgraded or discarded.

---

### Slice 5: Tiered Pricing Confidence

**Goal:** Communicate pricing confidence based on validated comp count.

**Backend Changes:**

- `packages/core-types/src/research.ts` - Add types:
  - `PricingConfidenceLevel`: `insufficient`, `low`, `recommended`, `high`
  - `PricingConfidenceTier` interface with level, label, description

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/calculate-price.node.ts` - Update:
  - Count validated comps (score >= 0.60)
  - Assign confidence tier: 0-2 = insufficient, 3-4 = low, 5-9 = recommended, 10+ = high
  - Include tier in pricing result

- `packages/core-types/src/research.ts` - Update `ItemResearchData.pricing`:
  - Add `confidenceLevel: PricingConfidenceLevel`
  - Add `validatedCompCount: number`

**Frontend Changes:**

- `apps/listforge-web/src/components/research/PriceBandsCard.tsx` - Update:
  - Display confidence tier badge
  - Color-code: insufficient=red, low=amber, recommended=green, high=blue
  - Show validated comp count

**Testable Outcome:** Pricing displays confidence tier. Users see "High Confidence (12 comps)" vs "Low Confidence (3 comps)".

---

### Slice 6: Organization Research Settings

**Goal:** Allow users to configure confidence thresholds.

**Backend Changes:**

- `packages/core-types/src/organization.ts` - Add to `OrganizationSettings`:
  - `researchSettings: OrganizationResearchSettings`

- `apps/listforge-api/src/organizations/entities/organization.entity.ts` - Add column:
  - `researchSettings: OrganizationResearchSettings` (JSONB, nullable, with defaults)

- Migration: Add `research_settings` column with default values

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/route-by-confidence.node.ts` - New node:
  - Load org settings
  - Compare overall confidence to thresholds
  - Set `reviewRequired: 'none' | 'spot_check' | 'full_review'`

**Frontend Changes:**

- `apps/listforge-web/src/components/settings/ResearchSettingsCard.tsx` - New component:
  - Sliders for autoApproveThreshold and spotCheckThreshold
  - Toggle for showLowConfidencePricing
  - Number input for minCompsForPricing
  - Save to organization settings

- Add to organization settings page

**Testable Outcome:** Users can adjust thresholds. Items get routed to different review queues based on settings.

---

### Slice 7: Field Flagging & UI Indicators

**Goal:** Flag low-confidence fields for user attention.

**Backend Changes:**

- `packages/core-types/src/research.ts` - Add to field types:
  - `needsReview: boolean`

- `apps/listforge-api/src/ai-workflows/graphs/research/nodes/assemble-listing.node.ts` - Update:
  - For each field, set `needsReview = confidence < settings.flagFieldsBelowConfidence`
  - Count flagged fields
  - Include in assembled listing

**Frontend Changes:**

- `apps/listforge-web/src/components/common/ConfidenceBadge.tsx` - Update:
  - Add "needs review" visual state (amber border/highlight)

- `apps/listforge-web/src/components/items/ItemBasicFields.tsx` (and other field components) - Update:
  - Check `needsReview` flag
  - Apply visual indicator (amber highlight, icon)
  - Tooltip: "Low confidence (X%) - please verify"

- Item detail page: Show count of flagged fields in header

**Testable Outcome:** Low-confidence fields have visual indicators. Users can quickly spot fields needing attention.

---

### Slice 8: Cost Tracking Infrastructure

**Goal:** Track research costs per run and per tool (no limits).

**Backend Changes:**

- `apps/listforge-api/src/research/entities/item-research-run.entity.ts` - Add columns:
  - `toolCosts: ToolCostRecord[]` (JSONB)

- `packages/core-types/src/research.ts` - Add types:
  - `ToolCostRecord` interface

- `apps/listforge-api/src/ai-workflows/services/cost-tracker.service.ts` - New service:
  - `trackToolUsage(runId, tool, tokens, cost)` - Accumulates costs
  - `getRunCosts(runId)` - Returns breakdown

- Update all tool-using nodes to call cost tracker

- Activity logs: Include cost in tool operation logs

**Frontend Changes:**

- `apps/listforge-web/src/components/research/ResearchPanel.tsx` - Update:
  - Show total research cost for run
  - Expandable breakdown by tool

**Testable Outcome:** Research runs show cost breakdown. Users can see which tools cost most.

---

## Implementation Order

| Slice | Name | Dependencies | Priority |
|-------|------|--------------|----------|
| 1 | Goal System & Hybrid Graph | None | **Start here** |
| 2 | Planning Node | Slice 1 | High |
| 3 | Comp Match Type Tracking | None (can parallel with 1-2) | High |
| 4 | Image Cross-Validation | Slice 3 | High |
| 5 | Tiered Pricing Confidence | Slice 3, 4 | Medium |
| 6 | Organization Research Settings | Slice 5 | Medium |
| 7 | Field Flagging & UI | Slice 6 | Medium |
| 8 | Cost Tracking | None (can parallel) | Low |

**Recommended approach:** Start with Slice 1, then Slice 3 in parallel. This establishes the goal system AND improves comp quality simultaneously.

---

## Success Metrics

**Quality Metrics:**

- Average comp validation score: Target ≥ 0.80
- Product identification accuracy: Target ≥ 85%
- Pricing within 10% of manual research: Target ≥ 80% of items

**Efficiency Metrics:**

- Auto-approve rate (confidence ≥ threshold): Target 30-50%
- Average research time: Track but no target (quality first)
- Average cost per item: Track for analytics

**User Experience Metrics:**

- Time to review flagged fields: Should decrease
- Override rate (user changes AI suggestion): Track to improve
- User satisfaction with pricing accuracy: Survey

---

## Next Steps

1. Review this spec document
2. Decide on implementation order (recommend Phase 1 first)
3. Create detailed technical tasks for Phase 1
4. Begin implementation

**Ready to proceed with implementation?**
