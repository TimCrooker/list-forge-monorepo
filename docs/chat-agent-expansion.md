# Chat Agent Expansion: Full-Power ReAct Agent

## Executive Summary

Transform the ListForge chat agent from a simple Q&A assistant into a full-power ReAct agent capable of executing any operation a user might need through natural language. The agent will have contextual access to 50+ tools across domain knowledge, research, publishing, administration, and analytics.

**Philosophy**: If a user can click it in the UI, they should be able to ask for it in chat.

---

## Current State

### Existing Chat Agent Tools (14)

| Category | Tools | Capability |
|----------|-------|------------|
| Item | `get_item_snapshot`, `get_item_facet`, `update_item_field` | Read/update item data |
| Research | `get_research_data`, `search_comps`, `trigger_research`, `research_field` | View/trigger research |
| Search | `search_items`, `search_research`, `search_evidence` | Query inventory |
| Aggregate | `get_dashboard_stats`, `get_review_queue_summary`, `get_inventory_value` | Overview stats |
| Action | `suggest_action` | UI action suggestions |

### Limitations

1. **Cannot explain decisions** - Can't decode identifiers, explain pricing logic, or validate comps
2. **Cannot manage listings** - Can't publish, sync, or manage marketplace listings
3. **Cannot administer** - Can't manage team, settings, or marketplace connections
4. **Cannot batch operate** - No bulk operations for power users
5. **Cannot analyze deeply** - No access to domain knowledge, authenticity checking, or advanced research tools

---

## Target State

### Tool Architecture by Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOOL UNIVERSE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  UNIVERSAL (Always Available)           ITEM CONTEXT                         │
│  ├── suggest_action                     ├── decode_identifier                │
│  ├── search_items                       ├── check_authenticity               │
│  ├── get_dashboard_stats                ├── get_value_drivers                │
│  ├── explain_feature                    ├── validate_comp                    │
│  └── get_help                           ├── explain_pricing                  │
│                                         ├── compare_to_comp                  │
│  REVIEW CONTEXT                         ├── lookup_upc                       │
│  ├── approve_item                       ├── web_search_product               │
│  ├── reject_item                        ├── detect_category                  │
│  ├── bulk_approve                       ├── create_listing                   │
│  ├── get_needs_work                     ├── get_listing_status               │
│  └── explain_confidence                 ├── end_listing                      │
│                                         └── preview_listing                  │
│  SETTINGS CONTEXT                                                            │
│  ├── get_org_settings                   DASHBOARD CONTEXT                    │
│  ├── update_org_setting                 ├── get_stale_items                  │
│  ├── list_marketplace_accounts          ├── bulk_trigger_research            │
│  ├── connect_marketplace                ├── get_batch_recommendations        │
│  ├── add_team_member                    ├── generate_report                  │
│  ├── update_team_member                 └── export_data                      │
│  └── remove_team_member                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Delivery Slices

### Slice 1: Domain Knowledge Tools
**Theme**: "Explain and Decode"
**User Value**: Users can ask the AI to explain its reasoning and decode identifiers

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `decode_identifier` | Decode LV dates, Nike codes, Rolex refs, Hermes stamps | "What does date code SD1234 mean?" |
| `check_authenticity` | Run authenticity marker checks | "Does this look authentic?" |
| `get_value_drivers` | Get price multipliers for item | "What makes this more valuable?" |
| `explain_pricing` | Explain how price bands were calculated | "Why did you recommend $150?" |
| `validate_comp` | Check if a comparable is truly comparable | "Is this eBay listing a good comp?" |

**Services to Wrap**:
- `DomainKnowledgeService.decodeIdentifier()`
- `DomainKnowledgeService.checkAuthenticity()`
- `DomainKnowledgeService.detectValueDrivers()`
- `PricingStrategyService` (new explain method)
- `validateComp()` from validate-comp.tool.ts

**Estimated Effort**: 2-3 days

---

### Slice 2: Advanced Research Tools
**Theme**: "Deep Research Access"
**User Value**: Users can access powerful research capabilities directly

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `lookup_upc` | Look up product from UPC/barcode | "Look up UPC 012345678901" |
| `web_search_product` | Search web for product info | "Search for this Nike colorway online" |
| `reverse_image_search` | Find similar items from photos | "Find similar items to my photos" |
| `detect_category` | Detect marketplace category | "What eBay category should this be?" |
| `extract_text_from_image` | OCR on item photos | "What text is in photo 2?" |
| `compare_images` | Compare item to comp visually | "How similar is my item to this comp?" |

**Services to Wrap**:
- `UpcLookupService`
- `WebSearchService`
- `ReverseImageSearchService`
- `CategoryDetectionService`
- `OcrService`
- `ImageComparisonService`

**Estimated Effort**: 3-4 days

---

### Slice 3: Listing & Publishing Tools
**Theme**: "Publish Anywhere"
**User Value**: Users can manage marketplace listings through chat

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `create_listing` | Publish to eBay/Amazon/Facebook | "List this on eBay" |
| `get_listing_status` | Check listing status | "Is this listed anywhere?" |
| `sync_listing` | Refresh from marketplace | "Sync my eBay listing" |
| `end_listing` | End active listing | "Take this off eBay" |
| `relist_item` | Relist ended listing | "Relist this on eBay" |
| `preview_listing` | Show listing preview | "Show me the eBay listing preview" |
| `update_listing_price` | Change listing price | "Change the eBay price to $175" |

**Services to Wrap**:
- `MarketplaceListingService`
- `ListingAssemblyService`
- Marketplace adapters (eBay, Amazon, Facebook)

**Estimated Effort**: 3-4 days

---

### Slice 4: Review & Approval Tools
**Theme**: "Streamline Review"
**User Value**: Users can manage review queue through chat

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `approve_item` | Approve AI-generated item | "Approve this item" |
| `reject_item` | Reject with comments | "Reject this, brand is wrong" |
| `bulk_approve` | Approve multiple items | "Approve all items over 90% confidence" |
| `mark_needs_work` | Send back for fixes | "This needs the title fixed" |
| `get_next_review_item` | Get next item to review | "Show me the next item to review" |
| `explain_confidence` | Explain confidence score | "Why is confidence only 60%?" |

**Services to Wrap**:
- `ItemsService` (approve/reject methods)
- `ResearchService` (confidence explanation)

**Estimated Effort**: 2-3 days

---

### Slice 5: Admin & Settings Tools
**Theme**: "Full Control"
**User Value**: Users can manage their organization through chat

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `get_org_settings` | Read organization settings | "What are my current settings?" |
| `update_org_setting` | Update a setting | "Enable auto-approve for high confidence" |
| `list_marketplace_accounts` | View connected marketplaces | "What marketplaces am I connected to?" |
| `connect_marketplace` | Start OAuth flow | "Connect my eBay account" |
| `disconnect_marketplace` | Revoke access | "Disconnect Amazon" |
| `add_team_member` | Invite by email | "Add john@example.com as admin" |
| `update_team_member` | Change role | "Make Sarah an owner" |
| `remove_team_member` | Remove from team | "Remove John from the team" |

**Services to Wrap**:
- `OrganizationsService`
- `MarketplaceAccountService`
- Settings configuration service

**Estimated Effort**: 3-4 days

---

### Slice 6: Dashboard & Analytics Tools
**Theme**: "Insights & Batch Operations"
**User Value**: Power users can get insights and operate at scale

| Tool | Description | Example User Query |
|------|-------------|-------------------|
| `get_stale_items` | Items needing re-research | "What items have old research?" |
| `bulk_trigger_research` | Research multiple items | "Research all my draft items" |
| `get_batch_recommendations` | Bulk pricing suggestions | "Which items should I reprice?" |
| `generate_report` | Create analytics report | "Give me this month's sales report" |
| `export_data` | Export items as CSV/JSON | "Export my inventory to CSV" |
| `get_performance_metrics` | AI accuracy stats | "How accurate has the AI been?" |
| `get_items_by_criteria` | Complex item queries | "Show items listed over 30 days with no sales" |

**Services to Wrap**:
- `ItemsService` (batch queries)
- `ResearchService` (bulk operations)
- `LearningService` (metrics)
- New analytics/reporting service

**Estimated Effort**: 4-5 days

---

## Tool Implementation Pattern

Each tool follows this pattern:

```typescript
// tools/domain/decode-identifier.tool.ts

import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from '../index';

const DecodeIdentifierSchema = z.object({
  identifierType: z.enum(['date_code', 'style_number', 'serial_number', 'model_number', 'upc', 'other'])
    .describe('Type of identifier to decode'),
  value: z.string()
    .describe('The identifier value to decode (e.g., "SD1234", "CW2288-111")'),
  brand: z.string().optional()
    .describe('Brand hint to improve decoding accuracy (e.g., "Louis Vuitton", "Nike")'),
  category: z.string().optional()
    .describe('Category hint (e.g., "luxury_handbags", "sneakers", "watches")'),
});

export function decodeIdentifierTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof DecodeIdentifierSchema>) => {
      const ctx = getToolContext();

      try {
        const result = await deps.decodeIdentifier({
          type: input.identifierType,
          value: input.value,
          brand: input.brand,
          category: input.category,
        });

        if (!result || !result.success) {
          return JSON.stringify({
            decoded: false,
            message: `Could not decode identifier "${input.value}". It may not match known patterns for ${input.brand || 'this brand'}.`,
            suggestion: 'Try providing more context like brand or category.',
          });
        }

        return JSON.stringify({
          decoded: true,
          identifierType: result.identifierType,
          value: input.value,
          interpretation: result.decoded,
          confidence: result.confidence,
          details: result.details,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to decode identifier: ${message}`,
        });
      }
    },
    {
      name: 'decode_identifier',
      description: `Decode product identifiers like date codes, style numbers, and serial numbers.

Supported identifier types:
- date_code: Louis Vuitton date codes (e.g., SD1234), Hermes blind stamps
- style_number: Nike style codes (e.g., CW2288-111), Adidas article numbers
- serial_number: Watch serial numbers, bag serial numbers
- model_number: Rolex references (e.g., 116610LN), model identifiers
- upc: Universal Product Codes

Returns decoded information including:
- Manufacturing date/year
- Factory/origin location
- Product line/collection
- Authenticity indicators

Use this when users ask about identifiers visible on items or when you need to verify product details.`,
      schema: DecodeIdentifierSchema,
    },
  );
}
```

---

## Registry Updates

### New Tool Categories

```typescript
// tools/tool-registry.ts

export type ToolCategory =
  | 'item'       // Existing: item CRUD
  | 'research'   // Existing: research operations
  | 'search'     // Existing: inventory search
  | 'aggregate'  // Existing: dashboard stats
  | 'action'     // Existing: UI actions
  | 'domain'     // NEW: domain knowledge (decode, authenticate, value drivers)
  | 'listing'    // NEW: marketplace listing operations
  | 'review'     // NEW: review queue operations
  | 'admin'      // NEW: organization/team management
  | 'analytics'; // NEW: reports and batch operations
```

### Role-Based Access

```typescript
interface ToolMetadata {
  name: string;
  factory: (deps: ChatToolDependencies) => StructuredTool;
  category: ToolCategory;
  requiredContext: {
    itemId?: boolean;
    organizationId?: boolean;
  };
  availableInPages: PageType[];
  alwaysAvailable?: boolean;

  // NEW: Role-based access control
  requiresRole?: Array<'owner' | 'admin' | 'member'>;

  // NEW: Feature flag for gradual rollout
  featureFlag?: string;
}
```

---

## ChatToolDependencies Expansion

```typescript
// tools/index.ts

export interface ChatToolDependencies {
  // ═══════════════════════════════════════════════════════════════
  // EXISTING
  // ═══════════════════════════════════════════════════════════════
  getItem: (orgId: string, itemId: string) => Promise<Item | null>;
  updateItem: (orgId: string, itemId: string, updates: Record<string, unknown>) => Promise<Item | null>;
  searchItems: (orgId: string, query: SearchQuery) => Promise<Item[]>;
  getLatestResearch: (itemId: string, orgId: string) => Promise<ResearchRun | null>;
  searchComps: (params: CompSearchParams) => Promise<Comp[]>;
  startResearchJob: (params: ResearchJobParams) => Promise<JobResult>;
  searchEvidence: (orgId: string, query: EvidenceQuery) => Promise<Evidence[]>;
  getDashboardStats: (orgId: string) => Promise<DashboardStats>;
  getReviewQueueStats: (orgId: string) => Promise<ReviewQueueStats>;
  emitAction: (sessionId: string, action: ChatAction) => void;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 1: Domain Knowledge
  // ═══════════════════════════════════════════════════════════════
  decodeIdentifier: (params: DecodeParams) => Promise<DecodeResult>;
  checkAuthenticity: (itemId: string, orgId: string) => Promise<AuthenticityResult>;
  getValueDrivers: (itemId: string, orgId: string) => Promise<ValueDriverMatch[]>;
  explainPricing: (itemId: string, orgId: string) => Promise<PricingExplanation>;
  validateComp: (itemId: string, compId: string, orgId: string) => Promise<CompValidation>;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 2: Advanced Research
  // ═══════════════════════════════════════════════════════════════
  lookupUpc: (upc: string) => Promise<UpcResult>;
  webSearchProduct: (query: string, options?: SearchOptions) => Promise<WebSearchResult[]>;
  reverseImageSearch: (imageUrl: string) => Promise<ImageSearchResult[]>;
  detectCategory: (itemId: string, orgId: string) => Promise<CategoryDetection>;
  extractTextFromImage: (imageUrl: string) => Promise<OcrResult>;
  compareImages: (imageUrl1: string, imageUrl2: string) => Promise<ImageComparison>;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 3: Listing & Publishing
  // ═══════════════════════════════════════════════════════════════
  createListing: (itemId: string, marketplaceAccountId: string, orgId: string) => Promise<Listing>;
  getListingStatus: (itemId: string, orgId: string) => Promise<ListingStatus[]>;
  syncListing: (listingId: string, orgId: string) => Promise<Listing>;
  endListing: (listingId: string, orgId: string) => Promise<void>;
  relistItem: (listingId: string, orgId: string) => Promise<Listing>;
  previewListing: (itemId: string, marketplace: string, orgId: string) => Promise<ListingPreview>;
  updateListingPrice: (listingId: string, price: number, orgId: string) => Promise<Listing>;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 4: Review & Approval
  // ═══════════════════════════════════════════════════════════════
  approveItem: (itemId: string, orgId: string, comment?: string) => Promise<Item>;
  rejectItem: (itemId: string, orgId: string, reason: string) => Promise<Item>;
  bulkApprove: (criteria: ApprovalCriteria, orgId: string) => Promise<BulkResult>;
  markNeedsWork: (itemId: string, orgId: string, issues: string[]) => Promise<Item>;
  getNextReviewItem: (orgId: string) => Promise<Item | null>;
  explainConfidence: (itemId: string, orgId: string) => Promise<ConfidenceExplanation>;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 5: Admin & Settings
  // ═══════════════════════════════════════════════════════════════
  getOrgSettings: (orgId: string) => Promise<OrgSettings>;
  updateOrgSetting: (orgId: string, key: string, value: unknown) => Promise<OrgSettings>;
  listMarketplaceAccounts: (orgId: string) => Promise<MarketplaceAccount[]>;
  connectMarketplace: (marketplace: string, orgId: string) => Promise<OAuthUrl>;
  disconnectMarketplace: (accountId: string, orgId: string) => Promise<void>;
  addTeamMember: (email: string, role: string, orgId: string) => Promise<Member>;
  updateTeamMember: (userId: string, role: string, orgId: string) => Promise<Member>;
  removeTeamMember: (userId: string, orgId: string) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════
  // SLICE 6: Analytics & Batch
  // ═══════════════════════════════════════════════════════════════
  getStaleItems: (orgId: string, daysOld?: number) => Promise<Item[]>;
  bulkTriggerResearch: (criteria: ResearchCriteria, orgId: string) => Promise<BulkResult>;
  getBatchRecommendations: (orgId: string) => Promise<PricingRecommendation[]>;
  generateReport: (reportType: string, params: ReportParams, orgId: string) => Promise<Report>;
  exportData: (format: string, criteria: ExportCriteria, orgId: string) => Promise<ExportResult>;
  getPerformanceMetrics: (orgId: string) => Promise<PerformanceMetrics>;
}
```

---

## Testing Strategy

Each slice includes:

1. **Unit Tests**: Test each tool in isolation with mocked dependencies
2. **Integration Tests**: Test tool → service → database flow
3. **Schema Tests**: Validate Zod schemas handle edge cases
4. **Context Tests**: Verify tools are available in correct page contexts

---

## Rollout Plan

| Week | Slice | Tools Added | Cumulative |
|------|-------|-------------|------------|
| 1 | Slice 1: Domain Knowledge | 5 | 19 |
| 2 | Slice 2: Advanced Research | 6 | 25 |
| 3 | Slice 3: Listing & Publishing | 7 | 32 |
| 4 | Slice 4: Review & Approval | 6 | 38 |
| 5 | Slice 5: Admin & Settings | 8 | 46 |
| 6 | Slice 6: Analytics & Batch | 7 | 53 |

---

## Success Metrics

1. **Tool Usage**: Track which tools are called most frequently
2. **Task Completion**: % of user requests fully handled by chat
3. **Fallback Rate**: How often users abandon chat for UI
4. **User Satisfaction**: Feedback on chat capabilities
5. **Error Rate**: Tool execution failures

---

## Appendix: Complete Tool Reference

### Slice 1: Domain Knowledge (5 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `decode_identifier` | type, value, brand?, category? | Decoded info with confidence | item_detail, review, capture |
| `check_authenticity` | itemId | Assessment + markers checked | item_detail, review |
| `get_value_drivers` | itemId | Matched drivers with multipliers | item_detail, review |
| `explain_pricing` | itemId | Price bands + reasoning | item_detail, review |
| `validate_comp` | itemId, compData | Validation score + reasoning | item_detail, review |

### Slice 2: Advanced Research (6 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `lookup_upc` | upc | Product info | item_detail, capture |
| `web_search_product` | query, options? | Search results | item_detail, review |
| `reverse_image_search` | imageUrl | Similar items | item_detail, capture |
| `detect_category` | itemId | Category + required fields | item_detail, review |
| `extract_text_from_image` | imageUrl | OCR text | item_detail, capture |
| `compare_images` | url1, url2 | Similarity score | item_detail, review |

### Slice 3: Listing & Publishing (7 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `create_listing` | itemId, accountId | Listing object | item_detail |
| `get_listing_status` | itemId | Status per marketplace | item_detail, items |
| `sync_listing` | listingId | Updated listing | item_detail |
| `end_listing` | listingId | Success/failure | item_detail |
| `relist_item` | listingId | New listing | item_detail |
| `preview_listing` | itemId, marketplace | Preview HTML/data | item_detail |
| `update_listing_price` | listingId, price | Updated listing | item_detail |

### Slice 4: Review & Approval (6 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `approve_item` | itemId, comment? | Updated item | review, item_detail |
| `reject_item` | itemId, reason | Updated item | review, item_detail |
| `bulk_approve` | criteria | Count approved | review, dashboard |
| `mark_needs_work` | itemId, issues | Updated item | review, item_detail |
| `get_next_review_item` | none | Next item | review |
| `explain_confidence` | itemId | Confidence breakdown | review, item_detail |

### Slice 5: Admin & Settings (8 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `get_org_settings` | none | All settings | settings |
| `update_org_setting` | key, value | Updated settings | settings |
| `list_marketplace_accounts` | none | Account list | settings |
| `connect_marketplace` | marketplace | OAuth URL | settings |
| `disconnect_marketplace` | accountId | Success | settings |
| `add_team_member` | email, role | Member object | settings |
| `update_team_member` | userId, role | Updated member | settings |
| `remove_team_member` | userId | Success | settings |

### Slice 6: Analytics & Batch (7 tools)

| Tool | Input | Output | Page Context |
|------|-------|--------|--------------|
| `get_stale_items` | daysOld? | Item list | dashboard |
| `bulk_trigger_research` | criteria | Job results | dashboard |
| `get_batch_recommendations` | none | Recommendations | dashboard |
| `generate_report` | type, params | Report data | dashboard |
| `export_data` | format, criteria | Download URL | dashboard, items |
| `get_performance_metrics` | none | Metrics | dashboard, settings |
| `get_items_by_criteria` | criteria | Item list | dashboard, items |
