# Research Quality Improvement Plan

## Vision: Google Lens for Resellers

> **Goal**: Transform ListForge's research system from "AI that guesses" to "AI that investigates like an expert human reseller"

Google Lens succeeds because it:
1. Uses **visual similarity** as the primary identification method
2. **Cross-references multiple sources** before committing to an answer
3. Presents **evidence** (matching products, sources) not just conclusions
4. **Iterates** - if the first approach doesn't work, it tries alternatives

Our research system should work the same way. A human expert doesn't ask "what is this?" once - they investigate systematically until they're confident.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Quality Bottleneck Theories](#quality-bottleneck-theories)
3. [Solution Architecture](#solution-architecture)
4. [Vertical Slices](#vertical-slices)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Success Metrics](#success-metrics)

---

## Current State Analysis

### What We Do Well
- ✅ Per-field confidence tracking with source attribution
- ✅ Multiple research tools (OCR, UPC lookup, Vision AI, Web Search)
- ✅ Goal-driven research graph with adaptive planning
- ✅ Graceful failure handling and loop termination
- ✅ Match type weighting for comps (UPC_EXACT > KEYWORD)

### Where We Fall Short

| Area | Current Behavior | Expert Human Behavior |
|------|-----------------|----------------------|
| **Visual Analysis** | Generic "what is this?" prompt | Examines specific locations based on category |
| **Identification** | One-shot, commit early | Iterative, validates against evidence |
| **Search Strategy** | Single query, hope it works | Multiple query variations, refines based on results |
| **Image Search** | Only for comps (eBay) | Primary identification method (Google Lens) |
| **Comp Selection** | Title keyword matching | Structured attribute comparison |
| **Domain Knowledge** | Generic across all categories | Category-specific expertise |
| **Validation** | Trust AI confidence scores | Cross-reference multiple independent sources |

---

## Quality Bottleneck Theories

### Theory 1: The "First Answer" Trap

**Observation**: Our AI models are trained to give confident, complete answers. When we ask "what is this product?", the model gives its best guess with high confidence, even when uncertain.

**Evidence**:
- Vision analysis returns brand/model with 0.70+ confidence even for ambiguous items
- We rarely see "I don't know" responses
- Confidence scores don't correlate with actual accuracy

**Root Cause**: We prompt for answers, not for investigation. We accept the first plausible response.

**Solution**: Prompt for multiple hypotheses with evidence. Validate before committing.

---

### Theory 2: The "Missing Visual Search" Gap

**Observation**: The single most effective identification tool humans use - reverse image search - is not in our toolbox for identification.

**Evidence**:
- `searchByImage` exists but only for finding comps, not for identification
- When text-based identification fails, we have no fallback
- Many products are identifiable only through visual matching

**Root Cause**: We treat vision AI as "describe what you see" instead of "find what this matches."

**Solution**: Add reverse image search (Google Lens API, Bing Visual Search, or TinEye) as a primary identification tool.

---

### Theory 3: The "One-Shot Search" Problem

**Observation**: We build one search query and execute it. If it fails or returns irrelevant results, we give up or move to a different tool.

**Evidence**:
```typescript
// Current: Single query construction
const searchResult = await this.webSearchService.searchProduct({
  brand: context.brand,
  model: context.model,
});
```

**Root Cause**: Linear pipeline thinking. Each tool runs once and passes to the next.

**Solution**: Implement iterative search refinement - analyze results, generate better queries, repeat.

---

### Theory 4: The "Generic Vision Prompt" Problem

**Observation**: We use the same vision prompt structure regardless of product category.

**Evidence**:
```typescript
// Current: Same prompt for watches, handbags, electronics, clothing
const fieldDescriptions = {
  brand: 'Brand name visible on the product',
  model: 'Model number or name',
  // ...generic descriptions
};
```

**Root Cause**: We don't leverage category-specific knowledge about where identifying information is located.

**Solution**: Category-specific visual inspection guides that tell the AI exactly where to look.

---

### Theory 5: The "Early Commitment" Problem

**Observation**: Once we identify a product (deep_identify node), we never reconsider, even if subsequent evidence contradicts it.

**Evidence**:
- Graph flow: `deep_identify → update_item → search_comps → calculate_price`
- No feedback loop from comps/pricing back to identification
- If comps are all $20 but we identified a $200 item, we don't question it

**Root Cause**: Linear pipeline without validation checkpoints.

**Solution**: Add identification validation after market research. If evidence doesn't match, trigger re-identification.

---

### Theory 6: The "Loose Comp Matching" Problem

**Observation**: Our comp relevance scoring uses simple title keyword matching, which can't distinguish important variants.

**Evidence**:
```typescript
// Current: Title substring matching
if (brand && titleLower.includes(brand)) {
  score += 0.15;
}
if (model && titleLower.includes(model)) {
  score += 0.10;
}
```

**Problem Cases**:
- "Nike Air Max 90" vs "Nike Air Max 97" - both match "Nike Air Max"
- "iPhone 14 Pro 128GB" vs "iPhone 14 Pro Max 256GB" - very different values
- Size/color variants with 2-3x price differences

**Root Cause**: We treat product matching as a text similarity problem, not a structured attribute comparison.

**Solution**: Extract structured attributes from comps, compare at attribute level, weight by attribute importance.

---

### Theory 7: The "No Domain Knowledge" Problem

**Observation**: Our system has no category-specific expertise. It doesn't know that:
- Vintage Levi's "Big E" vs "small e" is a 10x value difference
- Louis Vuitton date codes can be decoded to verify authenticity
- Nike colorway codes indicate specific releases
- "Made in USA" vs "Made in Mexico" matters for certain brands

**Evidence**: All tools use generic prompts and scoring regardless of category.

**Root Cause**: We built a general-purpose system without domain specialization.

**Solution**: Inject category-specific knowledge through specialized prompts, validation rules, and known patterns.

---

### Theory 8: The "Confidence ≠ Accuracy" Problem

**Observation**: We optimize for confidence thresholds, but confidence measures "how sure the AI is" not "how correct it is."

**Evidence**:
- Fields reach 0.85 confidence from a single source
- No cross-validation between independent sources
- Hallucinated values can have high confidence

**Root Cause**: We trust individual tool outputs without triangulation.

**Solution**: Require corroborating evidence from independent sources for high confidence. Track source independence.

---

### Theory 9: The "Extract But Don't Search" Problem

**Observation**: OCR extracts text (model numbers, serial numbers, codes), but we only use it if we can parse it into known fields.

**Evidence**:
```typescript
// Current: Only use parsed values
if (ocrResult.modelNumber) {
  updates.model = { value: ocrResult.modelNumber, ... };
}
// Raw extracted text is largely ignored
```

**Human Behavior**: "I see 'WL574EGG' on the shoe - let me Google that exact string"

**Root Cause**: We try to understand extracted text rather than using it as search input.

**Solution**: Every extracted text chunk becomes a search query candidate.

---

### Theory 10: The "No Learning Loop" Problem

**Observation**: We don't know if our research led to good outcomes. Did items sell? At our recommended price?

**Evidence**: No feedback mechanism from sales data back to research quality.

**Root Cause**: Research system is disconnected from outcome tracking.

**Solution**: Track research accuracy over time, adjust tool weights based on outcomes.

---

## Solution Architecture

### New Tool Registry

```
IDENTIFICATION TOOLS (Finding what the item IS)
├── vision_analysis          [EXISTING] Generic visual analysis
├── vision_analysis_guided   [NEW] Category-specific guided inspection
├── reverse_image_search     [NEW] Google Lens / visual similarity search
├── ocr_extraction           [EXISTING] Text extraction from images
├── ocr_search               [NEW] Search using raw extracted text
├── upc_lookup               [EXISTING] UPC database lookup
├── web_search_targeted      [EXISTING] Brand+model keyword search
├── web_search_iterative     [NEW] Multi-query refinement loop
└── product_page_extraction  [NEW] Extract specs from product pages

VALIDATION TOOLS (Confirming identification is correct)
├── image_comparison         [EXISTING] Compare item to comp images
├── cross_source_validation  [NEW] Verify across independent sources
├── price_sanity_check       [NEW] Does price match identification?
└── attribute_consistency    [NEW] Do extracted attributes make sense?

MARKET RESEARCH TOOLS (Finding value)
├── ebay_sold_comps          [EXISTING] eBay completed listings
├── ebay_active_comps        [EXISTING] eBay active listings
├── amazon_lookup            [EXISTING] Amazon product data
├── keepa_lookup             [EXISTING] Amazon price history
└── structured_comp_analysis [NEW] Attribute-level comp matching

DOMAIN KNOWLEDGE TOOLS (Category expertise)
├── category_inspection_guide [NEW] Where to look for each category
├── variant_decoder          [NEW] Decode date codes, colorways, etc.
├── authenticity_markers     [NEW] What to look for per brand
└── value_drivers            [NEW] What attributes affect price
```

### Enhanced Graph Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 0: VISUAL INVESTIGATION                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌───────────────────┐    ┌─────────────────┐  │
│  │ Load Context │───▶│ Detect Category   │───▶│ Get Inspection  │  │
│  │              │    │ (coarse-grained)  │    │ Guide           │  │
│  └──────────────┘    └───────────────────┘    └────────┬────────┘  │
│                                                         │           │
│                                                         ▼           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              GUIDED VISUAL INSPECTION                        │   │
│  │  • Category-specific prompts (where to look)                 │   │
│  │  • Multi-region analysis (labels, tags, markings)            │   │
│  │  • Extract ALL visible text for later search                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  PHASE 1: MULTI-MODAL IDENTIFICATION                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PARALLEL IDENTIFICATION STRATEGIES              │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ UPC Lookup  │  │ Reverse     │  │ OCR Text Search     │  │   │
│  │  │ (if found)  │  │ Image Search│  │ (every text chunk)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  │                                                              │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Iterative Web Search    │  │ Product Page Extraction │   │   │
│  │  │ (query refinement loop) │  │ (specs from matches)    │   │   │
│  │  └─────────────────────────┘  └─────────────────────────┘   │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              HYPOTHESIS AGGREGATION                          │   │
│  │  • Collect all identification candidates                     │   │
│  │  • Score by source reliability and evidence strength         │   │
│  │  • Require corroboration for high confidence                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: MARKET RESEARCH                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              STRUCTURED COMP SEARCH                          │   │
│  │  • Search with identified product attributes                 │   │
│  │  • Include variant-specific queries (size, color, etc.)      │   │
│  │  • eBay sold + active, Amazon, specialized marketplaces      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              ATTRIBUTE-LEVEL COMP ANALYSIS                   │   │
│  │  • Extract structured attributes from each comp              │   │
│  │  • Compare: brand, model, size, color, condition, variant    │   │
│  │  • Score by attribute match, not just title similarity       │   │
│  │  • Flag comps with missing critical attributes               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: VALIDATION CHECKPOINT                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              IDENTIFICATION VALIDATION                       │   │
│  │                                                              │   │
│  │  □ Do comps match our identification?                        │   │
│  │  □ Is the price range plausible for this product?            │   │
│  │  □ Do extracted attributes make sense together?              │   │
│  │  □ Visual comparison: does our item match comp images?       │   │
│  │                                                              │   │
│  │  If validation fails:                                        │   │
│  │  └──▶ Return to PHASE 1 with new constraints                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: PRICING & ASSEMBLY                        │
├─────────────────────────────────────────────────────────────────────┤
│  • Calculate price bands from validated comps                        │
│  • Generate optimized listing content                                │
│  • Determine review recommendation (approve/review)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Vertical Slices

### Slice 1: Reverse Image Search Integration
**Priority**: 🔴 Critical | **Effort**: Medium | **Impact**: Very High

#### Problem Solved
When text-based identification fails (no UPC, unrecognized model number), we have no fallback. Reverse image search is how humans identify unknown products.

#### Deliverables
1. **ReverseImageSearchService** - Abstract interface for visual search providers
2. **GoogleLensAdapter** - Integration with Google Cloud Vision Product Search or SerpApi
3. **BingVisualSearchAdapter** - Backup provider using Bing Visual Search API
4. **reverse_image_identify tool** - New tool in research planner
5. **Integration into identification phase** - Run parallel to web search

#### Technical Approach
```typescript
// New service interface
interface ReverseImageSearchService {
  searchByImage(imageUrl: string): Promise<VisualSearchResult[]>;
}

interface VisualSearchResult {
  productName: string;
  brand?: string;
  model?: string;
  confidence: number;
  sourceUrl: string;
  matchingImageUrl: string;
  priceRange?: { min: number; max: number };
}

// Tool implementation
const reverseImageSearchTool: ResearchToolMetadata = {
  type: 'reverse_image_search',
  displayName: 'Visual Product Search',
  description: 'Find matching products using image similarity',
  canProvideFields: ['brand', 'model', 'title', 'category', 'price'],
  requiresFields: [], // No prerequisites - can run on any item with images
  baseCost: 0.02,
  baseTimeMs: 3000,
  priority: 95, // High priority - often most effective
  confidenceWeight: 0.85, // High confidence when match found
};
```

#### API Options
1. **Google Cloud Vision Product Search** - Best accuracy, requires product catalog setup
2. **SerpApi Google Lens** - Scrapes Google Lens results, easy integration
3. **Bing Visual Search API** - Microsoft alternative, good for diverse products
4. **TinEye** - Specialized in finding exact image matches

#### Success Metrics
- Identification success rate for items where text methods failed
- Time to identification reduction
- Confidence score improvement

---

### Slice 2: Category-Specific Visual Inspection Guides
**Priority**: 🔴 Critical | **Effort**: Medium | **Impact**: High

#### Problem Solved
Generic vision prompts miss category-specific identifying information. A watch expert knows to look at the movement; a handbag expert checks the date code location.

#### Deliverables
1. **CategoryInspectionGuide** type definition
2. **Inspection guide database** for top 20 categories
3. **GuidedVisionAnalysisService** that uses category-specific prompts
4. **vision_analysis_guided tool**
5. **Category detection node** to select appropriate guide

#### Technical Approach
```typescript
interface CategoryInspectionGuide {
  categoryId: string;
  categoryName: string;
  inspectionRegions: InspectionRegion[];
  identifyingFeatures: IdentifyingFeature[];
  commonBrands: BrandGuide[];
  valueDrivers: string[];
  authenticityMarkers?: AuthenticityMarker[];
}

interface InspectionRegion {
  name: string;           // "Interior Label", "Case Back", "Tongue Tag"
  description: string;    // Human-readable description
  lookFor: string[];      // What to extract from this region
  examplePrompt: string;  // Specific prompt for this region
}

// Example: Luxury Handbags
const luxuryHandbagGuide: CategoryInspectionGuide = {
  categoryId: 'luxury_handbags',
  categoryName: 'Luxury Handbags & Purses',
  inspectionRegions: [
    {
      name: 'Interior Stamp',
      description: 'Leather stamp inside the bag, usually near pocket',
      lookFor: ['brand name', 'made in country', 'date code'],
      examplePrompt: 'Look inside the bag for a leather stamp. Read ALL text including any codes like "SD1234" or "AR2189".',
    },
    {
      name: 'Hardware Engravings',
      description: 'Text engraved on zippers, clasps, and metal hardware',
      lookFor: ['brand name', 'logo style', 'material stamp'],
      examplePrompt: 'Examine all metal hardware (zippers, clasps, D-rings). Read any engraved text or logos.',
    },
    {
      name: 'Heat Stamp / Embossing',
      description: 'Brand logo pressed into leather',
      lookFor: ['brand logo', 'font style', 'depth/quality'],
      examplePrompt: 'Find the main brand logo/name embossed on the bag. Note the font style and quality.',
    },
  ],
  identifyingFeatures: [
    { feature: 'Date Code', decodingPattern: 'LV: 2 letters (factory) + 4 digits (week/year)', example: 'SD1234 = USA, 12th week of 2034' },
    { feature: 'Stitching Count', description: 'Authentic bags have consistent stitch count per inch' },
  ],
  commonBrands: [
    { brand: 'Louis Vuitton', identifiers: ['LV monogram', 'date code format', 'made in France/USA/Spain'] },
    { brand: 'Chanel', identifiers: ['CC logo', 'authenticity card', 'serial sticker'] },
    { brand: 'Hermès', identifiers: ['blindstamp', 'craftsman mark', 'Hermès Paris Made in France'] },
  ],
  valueDrivers: [
    'Limited edition / collaboration',
    'Discontinued style',
    'Rare color/material',
    'Size (certain sizes more valuable)',
    'Condition of hardware',
  ],
};
```

#### Initial Categories to Support
1. Luxury Handbags (LV, Chanel, Hermès, Gucci)
2. Sneakers (Nike, Adidas, Jordan, New Balance)
3. Vintage Denim (Levi's, Lee, Wrangler)
4. Watches (Rolex, Omega, Seiko, vintage)
5. Electronics (iPhone, MacBook, gaming consoles)
6. Designer Clothing (tags, labels, care instructions)
7. Vintage T-Shirts (tag dating, print quality)
8. Trading Cards (grading markers, set identification)
9. Vinyl Records (pressing info, matrix numbers)
10. Collectible Toys (production codes, variations)

---

### Slice 3: Iterative Search Refinement
**Priority**: 🟠 High | **Effort**: Medium | **Impact**: High

#### Problem Solved
One-shot searches often fail or return irrelevant results. Humans try multiple query variations and refine based on partial matches.

#### Deliverables
1. **IterativeSearchService** with query generation and refinement
2. **Search result analysis** to extract refinement signals
3. **Query variation strategies** (exact, partial, descriptive, synonyms)
4. **web_search_iterative tool**
5. **Max iteration limits** to prevent infinite loops

#### Technical Approach
```typescript
interface SearchIteration {
  query: string;
  strategy: 'exact_identifier' | 'brand_model' | 'descriptive' | 'extracted_text' | 'refined';
  results: WebSearchResult[];
  refinementSignals: RefinementSignal[];
}

interface RefinementSignal {
  type: 'found_brand' | 'found_model' | 'found_variant' | 'price_cluster' | 'no_results';
  value: string;
  confidence: number;
}

class IterativeSearchService {
  async searchWithRefinement(
    context: SearchContext,
    maxIterations: number = 3,
  ): Promise<IterativeSearchResult> {
    const iterations: SearchIteration[] = [];
    let bestResult: ProductIdentification | null = null;

    // Strategy 1: Exact identifier (model number, SKU)
    if (context.extractedIdentifiers.length > 0) {
      for (const identifier of context.extractedIdentifiers) {
        const result = await this.search(identifier, 'exact_identifier');
        iterations.push(result);

        if (result.results.length > 0 && this.hasStrongMatch(result)) {
          bestResult = this.extractIdentification(result);
          break;
        }
      }
    }

    // Strategy 2: Brand + Model
    if (!bestResult && context.brand && context.model) {
      const result = await this.search(`${context.brand} ${context.model}`, 'brand_model');
      iterations.push(result);

      if (this.hasStrongMatch(result)) {
        bestResult = this.extractIdentification(result);
      }
    }

    // Strategy 3: Refine based on partial matches
    if (!bestResult && iterations.length > 0) {
      const signals = this.aggregateRefinementSignals(iterations);
      const refinedQuery = this.buildRefinedQuery(signals, context);

      const result = await this.search(refinedQuery, 'refined');
      iterations.push(result);

      bestResult = this.extractIdentification(result);
    }

    // Strategy 4: Descriptive fallback
    if (!bestResult) {
      const descriptiveQuery = this.buildDescriptiveQuery(context);
      const result = await this.search(descriptiveQuery, 'descriptive');
      iterations.push(result);

      bestResult = this.extractIdentification(result);
    }

    return {
      identification: bestResult,
      iterations,
      totalSearches: iterations.length,
      confidence: this.calculateAggregateConfidence(iterations),
    };
  }
}
```

---

### Slice 4: OCR-to-Search Pipeline
**Priority**: 🟠 High | **Effort**: Low | **Impact**: Medium-High

#### Problem Solved
We extract text from images but only use it if we can parse it into known fields. Raw text chunks (model numbers, codes) are often searchable directly.

#### Deliverables
1. **Enhanced OCR output** that preserves all extracted text
2. **Text chunk classifier** (identifier vs descriptive vs noise)
3. **ocr_search tool** that searches with raw text
4. **Integration with iterative search** as query candidates

#### Technical Approach
```typescript
interface EnhancedOCRResult {
  // Existing parsed fields
  upc?: string;
  modelNumber?: string;
  serialNumber?: string;

  // NEW: All extracted text chunks
  textChunks: TextChunk[];
}

interface TextChunk {
  text: string;
  region: 'label' | 'tag' | 'packaging' | 'product' | 'unknown';
  confidence: number;
  isLikelyIdentifier: boolean;  // Looks like a model number/SKU
  boundingBox?: BoundingBox;
}

// Identifier detection heuristics
function isLikelyIdentifier(text: string): boolean {
  // Patterns that look like product identifiers
  const identifierPatterns = [
    /^[A-Z]{2,4}[-]?\d{3,}$/,           // AB-12345, ABC1234
    /^\d{3,}[-]?[A-Z]{2,4}$/,           // 12345-AB
    /^[A-Z]\d{2,}[A-Z]\d{2,}$/,         // A12B34 (LV date codes)
    /^[A-Z]{2,}\d+[A-Z]*\d*$/,          // Model numbers like WL574EGG
    /^\d{12,14}$/,                       // UPC/EAN without parsing
  ];

  return identifierPatterns.some(p => p.test(text.trim()));
}

// New tool that searches with each identifier-like chunk
async function executeOcrSearch(
  targetFields: string[],
  context: ResearchExecutionContext,
): Promise<Record<string, ExtractedFieldValue>> {
  const updates: Record<string, ExtractedFieldValue> = {};

  // Get text chunks that look like identifiers
  const searchableChunks = context.ocrResult?.textChunks
    ?.filter(chunk => chunk.isLikelyIdentifier && chunk.confidence > 0.7)
    ?.slice(0, 5); // Limit to top 5 candidates

  if (!searchableChunks?.length) return updates;

  for (const chunk of searchableChunks) {
    const searchResult = await webSearchService.search(chunk.text);

    if (searchResult.hasProductMatch) {
      // Extract product info from search results
      const extracted = await extractProductFromResults(searchResult);

      if (extracted.confidence > 0.6) {
        // Update fields with extracted data
        for (const [field, value] of Object.entries(extracted.fields)) {
          if (targetFields.includes(field)) {
            updates[field] = {
              value,
              confidence: extracted.confidence * 0.85,
              source: {
                type: 'web_search',
                timestamp: new Date().toISOString(),
                confidence: extracted.confidence * 0.85,
                rawValue: { searchedText: chunk.text, ...extracted },
              },
            };
          }
        }

        break; // Found a match, stop searching
      }
    }
  }

  return updates;
}
```

---

### Slice 5: Structured Comp Attribute Matching
**Priority**: 🟠 High | **Effort**: Medium | **Impact**: High

#### Problem Solved
Title keyword matching can't distinguish important variants. "Nike Air Max 90" matches both $80 retros and $300 OG releases.

#### Deliverables
1. **CompAttributeExtractor** - Extract structured attributes from comp titles/data
2. **AttributeMatchScorer** - Score comps by attribute-level matching
3. **Variant importance weights** by category
4. **Enhanced comp validation** with attribute comparison

#### Technical Approach
```typescript
interface CompAttributes {
  brand?: string;
  model?: string;
  variant?: string;
  size?: string;
  color?: string;
  year?: number;
  condition?: string;
  edition?: string;    // "OG", "Retro", "Limited"
  gender?: string;
  material?: string;
}

interface AttributeMatchResult {
  attribute: string;
  itemValue: string | null;
  compValue: string | null;
  matchType: 'exact' | 'partial' | 'missing' | 'mismatch';
  importance: number;  // How much this affects price
  scoreImpact: number; // Calculated impact on relevance score
}

class CompAttributeMatcher {
  // Category-specific attribute importance
  private attributeImportance: Record<string, Record<string, number>> = {
    'sneakers': {
      brand: 1.0,
      model: 1.0,
      colorway: 0.9,    // Colorway is critical for sneakers
      size: 0.8,
      year: 0.7,        // OG vs Retro matters
      condition: 0.6,
    },
    'electronics': {
      brand: 1.0,
      model: 1.0,
      storage: 0.9,     // 128GB vs 256GB is big price diff
      color: 0.3,       // Color matters less for electronics
      condition: 0.8,
    },
    'luxury_handbags': {
      brand: 1.0,
      model: 1.0,
      size: 0.9,        // PM vs MM vs GM
      color: 0.7,
      material: 0.8,    // Canvas vs Leather
      condition: 0.9,
    },
  };

  scoreCompByAttributes(
    itemAttrs: CompAttributes,
    compAttrs: CompAttributes,
    category: string,
  ): { score: number; matchResults: AttributeMatchResult[] } {
    const importance = this.attributeImportance[category] || this.attributeImportance['default'];
    const matchResults: AttributeMatchResult[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const [attr, weight] of Object.entries(importance)) {
      const itemValue = itemAttrs[attr as keyof CompAttributes];
      const compValue = compAttrs[attr as keyof CompAttributes];

      let matchType: AttributeMatchResult['matchType'];
      let scoreImpact: number;

      if (!itemValue && !compValue) {
        continue; // Skip if both missing
      } else if (!itemValue || !compValue) {
        matchType = 'missing';
        scoreImpact = 0.5 * weight; // Partial credit for missing
      } else if (this.isExactMatch(itemValue, compValue)) {
        matchType = 'exact';
        scoreImpact = 1.0 * weight;
      } else if (this.isPartialMatch(itemValue, compValue)) {
        matchType = 'partial';
        scoreImpact = 0.6 * weight;
      } else {
        matchType = 'mismatch';
        scoreImpact = 0.1 * weight; // Heavy penalty for mismatch
      }

      matchResults.push({
        attribute: attr,
        itemValue: String(itemValue ?? null),
        compValue: String(compValue ?? null),
        matchType,
        importance: weight,
        scoreImpact,
      });

      totalScore += scoreImpact;
      totalWeight += weight;
    }

    return {
      score: totalWeight > 0 ? totalScore / totalWeight : 0,
      matchResults,
    };
  }
}
```

---

### Slice 6: Identification Validation Checkpoint
**Priority**: 🟡 Medium | **Effort**: Medium | **Impact**: High

#### Problem Solved
We commit to identification early and never reconsider. If comps/pricing contradict our identification, we should re-investigate.

#### Deliverables
1. **IdentificationValidator** service
2. **Validation checkpoint node** in research graph
3. **Re-identification trigger** with new constraints
4. **Validation failure reasons** for debugging

#### Technical Approach
```typescript
interface ValidationCheckResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  shouldReidentify: boolean;
  reidentificationHints?: ReidentificationHint[];
}

interface ValidationIssue {
  type: 'price_mismatch' | 'no_matching_comps' | 'attribute_inconsistency' | 'visual_mismatch';
  severity: 'warning' | 'error';
  message: string;
  evidence: Record<string, unknown>;
}

class IdentificationValidator {
  async validate(state: ResearchGraphState): Promise<ValidationCheckResult> {
    const issues: ValidationIssue[] = [];

    // Check 1: Price Sanity
    const pricingIssue = await this.checkPriceSanity(state);
    if (pricingIssue) issues.push(pricingIssue);

    // Check 2: Comp Matching
    const compIssue = await this.checkCompMatching(state);
    if (compIssue) issues.push(compIssue);

    // Check 3: Visual Comparison
    const visualIssue = await this.checkVisualConsistency(state);
    if (visualIssue) issues.push(visualIssue);

    // Check 4: Attribute Consistency
    const attrIssue = await this.checkAttributeConsistency(state);
    if (attrIssue) issues.push(attrIssue);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const shouldReidentify = errorCount >= 2 ||
      issues.some(i => i.type === 'no_matching_comps' && i.severity === 'error');

    return {
      isValid: errorCount === 0,
      confidence: this.calculateValidationConfidence(issues),
      issues,
      shouldReidentify,
      reidentificationHints: shouldReidentify
        ? this.generateReidentificationHints(state, issues)
        : undefined,
    };
  }

  private async checkPriceSanity(state: ResearchGraphState): Promise<ValidationIssue | null> {
    const identifiedCategory = state.productIdentification?.category;
    const avgCompPrice = this.calculateAverageCompPrice(state.comps);
    const expectedPriceRange = this.getCategoryPriceRange(identifiedCategory);

    if (avgCompPrice && expectedPriceRange) {
      if (avgCompPrice < expectedPriceRange.min * 0.3 || avgCompPrice > expectedPriceRange.max * 3) {
        return {
          type: 'price_mismatch',
          severity: 'error',
          message: `Comp prices ($${avgCompPrice} avg) don't match expected range for ${identifiedCategory}`,
          evidence: {
            avgCompPrice,
            expectedRange: expectedPriceRange,
            identifiedProduct: state.productIdentification,
          },
        };
      }
    }

    return null;
  }

  private async checkCompMatching(state: ResearchGraphState): Promise<ValidationIssue | null> {
    const validComps = state.comps.filter(c => c.relevanceScore >= 0.6);

    if (state.comps.length > 0 && validComps.length === 0) {
      return {
        type: 'no_matching_comps',
        severity: 'error',
        message: 'Found comps but none match our identification well',
        evidence: {
          totalComps: state.comps.length,
          validComps: 0,
          topCompScores: state.comps.slice(0, 5).map(c => c.relevanceScore),
        },
      };
    }

    return null;
  }
}
```

#### Graph Integration
```typescript
// Add validation checkpoint after market research
.addNode('validate_identification', validateIdentificationNode)
.addConditionalEdges(
  'validate_identification',
  identificationValidationRouter,
  {
    valid: 'calculate_price',           // Continue to pricing
    reidentify: 'guided_visual_analysis', // Go back with new hints
    accept_with_warnings: 'calculate_price', // Proceed but flag for review
  },
)
```

---

### Slice 7: Cross-Source Validation
**Priority**: 🟡 Medium | **Effort**: Low | **Impact**: Medium

#### Problem Solved
We trust single-source values. High confidence should require corroboration from independent sources.

#### Deliverables
1. **SourceIndependenceTracker** - Track which sources are truly independent
2. **CrossValidationScorer** - Boost confidence when sources agree
3. **Conflict resolution logic** - Handle disagreements
4. **Enhanced confidence calculation** incorporating source count

#### Technical Approach
```typescript
// Source independence groups (sources in same group are NOT independent)
const sourceIndependenceGroups = {
  'amazon': ['amazon_catalog', 'keepa', 'amazon_sp_api'],
  'vision': ['vision_ai', 'vision_analysis_guided'],
  'text_extraction': ['ocr', 'ocr_search'],
  'ebay': ['ebay_sold', 'ebay_active', 'ebay_taxonomy'],
  'web': ['web_search_targeted', 'web_search_general', 'reverse_image_search'],
};

interface CrossValidatedField {
  fieldName: string;
  value: unknown;
  baseConfidence: number;
  sources: FieldSource[];
  independentSourceCount: number;
  crossValidatedConfidence: number;
  conflicts: FieldConflict[];
}

function calculateCrossValidatedConfidence(sources: FieldSource[]): number {
  if (sources.length === 0) return 0;
  if (sources.length === 1) return sources[0].confidence * 0.8; // Single source penalty

  // Count independent source groups
  const groups = new Set<string>();
  for (const source of sources) {
    const group = Object.entries(sourceIndependenceGroups)
      .find(([_, types]) => types.includes(source.type))?.[0] || source.type;
    groups.add(group);
  }

  const independentCount = groups.size;
  const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;

  // Confidence boost for independent corroboration
  // 1 source: 80% of base
  // 2 independent sources agreeing: 100% of base
  // 3+ independent sources agreeing: up to 110% of base
  const corroborationMultiplier = Math.min(1.1, 0.8 + (independentCount * 0.15));

  return Math.min(0.98, avgConfidence * corroborationMultiplier);
}
```

---

### Slice 8: Product Page Extraction
**Priority**: 🟡 Medium | **Effort**: Medium | **Impact**: Medium

#### Problem Solved
Web search finds product pages, but we don't extract structured specifications from them.

#### Deliverables
1. **ProductPageExtractor** service
2. **Site-specific extractors** (Amazon, manufacturer sites, etc.)
3. **Generic extraction fallback** using LLM
4. **product_page_extraction tool**

#### Technical Approach
```typescript
interface ProductPageData {
  url: string;
  title: string;
  brand?: string;
  model?: string;
  price?: number;
  specifications: Record<string, string>;
  images: string[];
  description?: string;
  confidence: number;
}

class ProductPageExtractor {
  private siteExtractors: Map<string, SiteExtractor>;

  constructor(private llm: BaseChatModel) {
    this.siteExtractors = new Map([
      ['amazon.com', new AmazonExtractor()],
      ['ebay.com', new EbayExtractor()],
      ['walmart.com', new WalmartExtractor()],
      // Add more site-specific extractors
    ]);
  }

  async extract(url: string): Promise<ProductPageData> {
    const domain = new URL(url).hostname.replace('www.', '');

    // Try site-specific extractor first
    const siteExtractor = this.siteExtractors.get(domain);
    if (siteExtractor) {
      return siteExtractor.extract(url);
    }

    // Fall back to generic LLM extraction
    return this.extractWithLLM(url);
  }

  private async extractWithLLM(url: string): Promise<ProductPageData> {
    const pageContent = await this.fetchAndClean(url);

    const prompt = `Extract product information from this page content:

${pageContent}

Return JSON with:
{
  "title": "product title",
  "brand": "brand name",
  "model": "model number",
  "price": 123.45,
  "specifications": {
    "key": "value",
    ...
  },
  "description": "product description"
}

Only include fields you can confidently extract.`;

    const response = await this.llm.invoke(prompt);
    return JSON.parse(response.content);
  }
}
```

---

### Slice 9: Domain Knowledge Database
**Priority**: 🟢 Lower | **Effort**: High | **Impact**: Medium-High (for covered categories)

#### Problem Solved
Our system lacks category-specific expertise that expert resellers have.

#### Deliverables
1. **DomainKnowledge** type definitions
2. **Knowledge database** for top categories
3. **Variant decoder** for date codes, colorway codes, etc.
4. **Value driver detector** that identifies price-affecting attributes
5. **Authenticity marker checker** for luxury goods

#### Technical Approach
```typescript
interface DomainKnowledge {
  category: string;
  brands: BrandKnowledge[];
  variantPatterns: VariantPattern[];
  valueDrivers: ValueDriver[];
  authenticityMarkers?: AuthenticityMarker[];
  commonMisidentifications: Misidentification[];
}

interface VariantPattern {
  name: string;
  pattern: RegExp;
  decoder: (match: RegExpMatchArray) => VariantInfo;
  examples: string[];
}

// Example: Louis Vuitton Date Code Decoder
const lvDateCodePattern: VariantPattern = {
  name: 'Louis Vuitton Date Code',
  pattern: /^([A-Z]{2})(\d{2})(\d{2})$/,
  decoder: (match) => {
    const factory = match[1];
    const factoryLocations: Record<string, string> = {
      'SD': 'USA (San Dimas)',
      'FL': 'USA (Florida)',
      'AR': 'France',
      'SP': 'France',
      // ... more
    };

    // New format (2007+): WWYY
    const week = parseInt(match[2]);
    const year = 2000 + parseInt(match[3]);

    return {
      manufacturingLocation: factoryLocations[factory] || 'Unknown',
      manufactureDate: { week, year },
      authenticityIndicator: true,
    };
  },
  examples: ['SD1234', 'AR2189', 'FL0192'],
};

interface ValueDriver {
  attribute: string;
  condition: (value: string) => boolean;
  priceMultiplier: number;
  description: string;
}

// Example: Levi's Value Drivers
const levisValueDrivers: ValueDriver[] = [
  {
    attribute: 'label_type',
    condition: (v) => v === 'Big E',
    priceMultiplier: 5.0,
    description: 'Big E label (pre-1971) significantly increases value',
  },
  {
    attribute: 'selvedge',
    condition: (v) => v === 'true' || v === 'redline',
    priceMultiplier: 2.5,
    description: 'Selvedge/redline denim commands premium',
  },
  {
    attribute: 'made_in',
    condition: (v) => v === 'USA',
    priceMultiplier: 1.8,
    description: 'Made in USA worth more than overseas production',
  },
];
```

---

### Slice 9.1: Admin-Configurable Domain Expertise
**Priority**: 🟡 Medium | **Effort**: High | **Impact**: High (long-term scalability)

#### Problem Solved
Slice 9's domain knowledge is **hardcoded in TypeScript**. Adding a new Louis Vuitton factory, discovering a new value driver, or updating authenticity patterns requires:
- Code changes by developers
- Pull request review and deployment
- No involvement from domain experts (staff)

This creates a bottleneck: **the people who know reselling can't contribute to the system's expertise**.

Additionally:
- No version control or rollback for expertise changes
- No audit trail of who changed what and when
- Can't A/B test different expertise configurations
- Can't expand to new categories without code changes

#### Vision
ListForge staff (not developers) should be able to:
1. Add new brands/categories to the expertise system
2. Create and update factory lookup tables (LV factories, Hermes year codes, etc.)
3. Define new value drivers with custom conditions and multipliers
4. Add authenticity markers as new counterfeits are discovered
5. Test changes in a sandbox before publishing to production
6. Roll back bad changes instantly

#### Deliverables

1. **Database Entities**
   - `DomainExpertiseModule` - Top-level container per category/brand
   - `DecoderDefinition` - Pattern-based decoders with field extraction rules
   - `LookupTable` + `LookupEntry` - Reference data (factories, year codes, references)
   - `ValueDriverDefinition` - Configurable conditions and multipliers
   - `AuthenticityMarkerDefinition` - Patterns with importance levels
   - `DomainExpertiseVersion` - Published snapshots for rollback

2. **Admin API Endpoints**
   - Full CRUD for all domain expertise entities
   - Publish/rollback workflow
   - Test endpoints (decode sample, check value drivers, assess authenticity)
   - Bulk import/export for lookup tables

3. **Refactored DomainKnowledgeService**
   - Load expertise from database instead of static files
   - Aggressive caching with invalidation on publish
   - Fallback to static data if DB unavailable
   - Hot-reload when new versions published

4. **Admin UI Components**
   - Module manager (list, create, duplicate, archive)
   - Decoder builder with visual regex tester
   - Lookup table editor with spreadsheet-like interface
   - Value driver editor with condition builder
   - Authenticity marker editor
   - Test console for trying sample inputs

5. **Migration Tooling**
   - Script to seed database from existing static data
   - Validation that migrated data produces same outputs

#### Data Model

```typescript
// Top-level container for all expertise related to a category/brand
interface DomainExpertiseModule {
  id: string;
  name: string;                          // "Louis Vuitton Authentication"
  description: string;
  categoryId: CategoryId;
  applicableBrands: string[];            // ["Louis Vuitton", "LV"]

  // Version control
  currentVersion: number;
  status: 'draft' | 'published' | 'archived';

  // Audit
  createdBy: string;                     // userId
  createdAt: Date;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  publishedAt: Date | null;

  // Relations (loaded separately)
  decoders?: DecoderDefinition[];
  lookupTables?: LookupTable[];
  valueDrivers?: ValueDriverDefinition[];
  authenticityMarkers?: AuthenticityMarkerDefinition[];
}

// Pattern-based decoder that replaces hardcoded functions
interface DecoderDefinition {
  id: string;
  moduleId: string;

  name: string;                          // "LV Date Code (Post-2007)"
  identifierType: string;                // "lv_date_code"
  description: string;

  // Pattern matching
  inputPattern: string;                  // "^([A-Z]{2})(\\d{4})$"
  inputMaxLength: number;                // ReDoS prevention

  // Field extraction rules
  extractionRules: ExtractionRule[];

  // Optional lookup for enrichment
  lookupTableId: string | null;          // Link to factory codes table
  lookupKeyGroup: number;                // Which capture group is the key

  // Validation
  validationRules: ValidationRule[];

  // Output
  outputFields: OutputFieldMapping[];
  baseConfidence: number;                // 0.95

  priority: number;                      // Order to try decoders
  isActive: boolean;

  // Testing
  testCases: DecoderTestCase[];
}

interface ExtractionRule {
  captureGroup: number;                  // 1, 2, etc.
  outputField: string;                   // "factoryCode", "week", "year"
  transform?: 'none' | 'parseInt' | 'parseYear' | 'lookup';
  transformConfig?: Record<string, unknown>;
}

interface ValidationRule {
  field: string;
  type: 'range' | 'regex' | 'lookup_exists' | 'custom';
  config: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage: string;
    failureConfidence?: number;          // Confidence if validation fails
  };
}

interface OutputFieldMapping {
  sourceField: string;                   // From extraction or lookup
  outputField: string;                   // In decoded result
  type: 'string' | 'number' | 'boolean';
}

interface DecoderTestCase {
  input: string;
  expectedSuccess: boolean;
  expectedOutput?: Record<string, unknown>;
  description: string;
}

// Reference data tables
interface LookupTable {
  id: string;
  moduleId: string;

  name: string;                          // "LV Factory Codes"
  description: string;
  keyField: string;                      // "code"

  // Schema for values
  valueSchema: LookupValueField[];

  // Entries stored separately or embedded
  entryCount: number;

  createdAt: Date;
  lastModifiedAt: Date;
}

interface LookupValueField {
  name: string;                          // "location", "country"
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

interface LookupEntry {
  id: string;
  tableId: string;

  key: string;                           // "SD"
  values: Record<string, unknown>;       // { location: "San Dimas", country: "USA", active: true }

  isActive: boolean;
  createdAt: Date;
  lastModifiedAt: Date;
}

// Configurable value drivers
interface ValueDriverDefinition {
  id: string;
  moduleId: string;

  name: string;                          // "Big E Label"
  description: string;                   // "Pre-1971 LEVI'S with capital E"

  // Condition
  attribute: string;                     // Field to check: "label_type"
  conditionType: 'contains' | 'equals' | 'regex' | 'range' | 'custom';
  conditionValue: string | ConditionConfig;
  caseSensitive: boolean;

  // Effect
  priceMultiplier: number;               // 5.0
  priority: number;                      // Higher = checked first

  // Metadata
  applicableBrands: string[];            // Empty = all brands in module
  isActive: boolean;

  createdAt: Date;
  lastModifiedAt: Date;
}

interface ConditionConfig {
  // For 'range' type
  min?: number;
  max?: number;

  // For 'regex' type
  pattern?: string;
  flags?: string;

  // For 'custom' type (advanced)
  expression?: string;                   // Simple expression language
}

// Authenticity markers
interface AuthenticityMarkerDefinition {
  id: string;
  moduleId: string;

  name: string;                          // "LV Date Code Format"
  checkDescription: string;              // Human-readable: "Date code should be 2 letters + 4 digits"

  // Pattern (optional)
  pattern: string | null;                // "^[A-Z]{2}\\d{4}$"
  patternMaxLength: number;              // ReDoS prevention

  // Classification
  importance: 'critical' | 'important' | 'helpful';
  indicatesAuthentic: boolean;           // true = match is good, false = match is suspicious

  // Scope
  applicableBrands: string[];

  isActive: boolean;
  createdAt: Date;
  lastModifiedAt: Date;
}

// Version snapshots for rollback
interface DomainExpertiseVersion {
  id: string;
  moduleId: string;

  version: number;
  snapshot: {
    module: Omit<DomainExpertiseModule, 'id' | 'currentVersion'>;
    decoders: DecoderDefinition[];
    lookupTables: LookupTable[];
    lookupEntries: LookupEntry[];
    valueDrivers: ValueDriverDefinition[];
    authenticityMarkers: AuthenticityMarkerDefinition[];
  };

  changelog: string;                     // "Added new factory code XY"

  publishedBy: string;                   // userId
  publishedAt: Date;

  isActive: boolean;                     // Which version is currently live
}
```

#### API Design

```typescript
// ============================================================================
// MODULE ENDPOINTS (Staff Only)
// ============================================================================

// List all modules with filtering
GET /admin/domain-expertise/modules
  ?categoryId=luxury_handbags
  ?status=published
  ?search=louis

// Create new module
POST /admin/domain-expertise/modules
Body: { name, description, categoryId, applicableBrands }

// Get module with all relations
GET /admin/domain-expertise/modules/:id
  ?include=decoders,lookupTables,valueDrivers,markers

// Update module metadata
PUT /admin/domain-expertise/modules/:id
Body: { name, description, applicableBrands }

// Delete module (soft delete → archived)
DELETE /admin/domain-expertise/modules/:id

// Duplicate module (for creating variations)
POST /admin/domain-expertise/modules/:id/duplicate
Body: { newName }

// ============================================================================
// VERSION CONTROL
// ============================================================================

// Publish current draft as new version
POST /admin/domain-expertise/modules/:id/publish
Body: { changelog: "Added factory code XY" }

// List version history
GET /admin/domain-expertise/modules/:id/versions

// Rollback to specific version
POST /admin/domain-expertise/modules/:id/rollback
Body: { versionId }

// Compare two versions
GET /admin/domain-expertise/modules/:id/compare
  ?fromVersion=3&toVersion=5

// ============================================================================
// DECODER ENDPOINTS
// ============================================================================

// List decoders for module
GET /admin/domain-expertise/modules/:moduleId/decoders

// Create decoder
POST /admin/domain-expertise/modules/:moduleId/decoders
Body: { name, inputPattern, extractionRules, ... }

// Update decoder
PUT /admin/domain-expertise/decoders/:id

// Delete decoder
DELETE /admin/domain-expertise/decoders/:id

// Test decoder with sample input
POST /admin/domain-expertise/decoders/:id/test
Body: { input: "SD1234" }
Response: { success, decoded, confidence, errors }

// Validate decoder pattern (check for ReDoS)
POST /admin/domain-expertise/decoders/validate-pattern
Body: { pattern: "^([A-Z]{2})(\\d{4})$" }
Response: { valid, warnings, estimatedComplexity }

// ============================================================================
// LOOKUP TABLE ENDPOINTS
// ============================================================================

// List lookup tables for module
GET /admin/domain-expertise/modules/:moduleId/lookup-tables

// Create lookup table
POST /admin/domain-expertise/modules/:moduleId/lookup-tables
Body: { name, keyField, valueSchema }

// Get lookup table with entries
GET /admin/domain-expertise/lookup-tables/:id
  ?page=1&limit=100

// Update lookup table metadata
PUT /admin/domain-expertise/lookup-tables/:id

// Delete lookup table
DELETE /admin/domain-expertise/lookup-tables/:id

// Import entries from CSV/JSON
POST /admin/domain-expertise/lookup-tables/:id/import
Body: FormData with file OR { entries: [...] }

// Export entries to CSV/JSON
GET /admin/domain-expertise/lookup-tables/:id/export
  ?format=csv|json

// ============================================================================
// LOOKUP ENTRY ENDPOINTS (for individual edits)
// ============================================================================

// List entries with search/filter
GET /admin/domain-expertise/lookup-tables/:tableId/entries
  ?search=SD&page=1&limit=50

// Create entry
POST /admin/domain-expertise/lookup-tables/:tableId/entries
Body: { key: "SD", values: { location: "San Dimas", country: "USA" } }

// Update entry
PUT /admin/domain-expertise/lookup-entries/:id

// Delete entry
DELETE /admin/domain-expertise/lookup-entries/:id

// Bulk operations
POST /admin/domain-expertise/lookup-tables/:tableId/entries/bulk
Body: {
  operation: 'create' | 'update' | 'delete',
  entries: [...]
}

// ============================================================================
// VALUE DRIVER ENDPOINTS
// ============================================================================

// List value drivers for module
GET /admin/domain-expertise/modules/:moduleId/value-drivers

// Create value driver
POST /admin/domain-expertise/modules/:moduleId/value-drivers
Body: { name, attribute, conditionType, conditionValue, priceMultiplier, ... }

// Update value driver
PUT /admin/domain-expertise/value-drivers/:id

// Delete value driver
DELETE /admin/domain-expertise/value-drivers/:id

// Reorder value drivers (priority)
POST /admin/domain-expertise/modules/:moduleId/value-drivers/reorder
Body: { orderedIds: ["id1", "id2", "id3"] }

// ============================================================================
// AUTHENTICITY MARKER ENDPOINTS
// ============================================================================

// List markers for module
GET /admin/domain-expertise/modules/:moduleId/authenticity-markers

// Create marker
POST /admin/domain-expertise/modules/:moduleId/authenticity-markers

// Update marker
PUT /admin/domain-expertise/authenticity-markers/:id

// Delete marker
DELETE /admin/domain-expertise/authenticity-markers/:id

// ============================================================================
// TESTING ENDPOINTS
// ============================================================================

// Test full decode pipeline for a module
POST /admin/domain-expertise/modules/:id/test-decode
Body: {
  identifierType: "date_code",
  value: "SD1234"
}
Response: {
  matched: true,
  decoder: { id, name },
  result: { factoryCode: "SD", year: 2024, ... },
  confidence: 0.95,
  lookupUsed: { table: "LV Factory Codes", key: "SD" }
}

// Test value driver detection
POST /admin/domain-expertise/modules/:id/test-value-drivers
Body: {
  fields: {
    label_type: "LEVI'S BIG E",
    material: "selvedge denim"
  }
}
Response: {
  matches: [
    { driver: "Big E Label", multiplier: 5.0, confidence: 0.9 },
    { driver: "Selvedge Denim", multiplier: 2.5, confidence: 0.85 }
  ],
  combinedMultiplier: 8.75
}

// Test authenticity check
POST /admin/domain-expertise/modules/:id/test-authenticity
Body: {
  identifiers: [{ type: "date_code", value: "SD1234" }],
  extractedText: ["LOUIS VUITTON PARIS MADE IN FRANCE"]
}
Response: {
  assessment: "likely_authentic",
  confidence: 0.87,
  markersChecked: [...],
  warnings: []
}
```

#### Service Layer Changes

```typescript
@Injectable()
export class DomainKnowledgeService {
  private moduleCache = new Map<string, CachedModule>();
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly moduleRepository: DomainExpertiseModuleRepository,
    private readonly cacheInvalidator: CacheInvalidationService,
  ) {
    // Subscribe to publish events for cache invalidation
    this.cacheInvalidator.on('module-published', (moduleId) => {
      this.moduleCache.delete(moduleId);
    });
  }

  /**
   * Load published module for a category, with caching
   */
  async getModuleForCategory(
    categoryId: CategoryId,
    brand?: string,
  ): Promise<DomainExpertiseModule | null> {
    const cacheKey = `${categoryId}:${brand || '*'}`;
    const cached = this.moduleCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.module;
    }

    // Load from database
    const module = await this.moduleRepository.findPublishedForCategory(
      categoryId,
      brand,
    );

    if (module) {
      this.moduleCache.set(cacheKey, {
        module,
        expiresAt: Date.now() + DomainKnowledgeService.CACHE_TTL_MS,
      });
    }

    return module;
  }

  /**
   * Decode identifier using dynamic decoders from module
   */
  async decodeIdentifier(
    identifier: ExtractedIdentifier,
    categoryId: CategoryId,
  ): Promise<DecodedValue | null> {
    const module = await this.getModuleForCategory(categoryId);

    if (!module?.decoders?.length) {
      // Fallback to static decoders if no module found
      return this.fallbackDecodeIdentifier(identifier, categoryId);
    }

    // Try each decoder in priority order
    const sortedDecoders = [...module.decoders]
      .filter(d => d.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const decoder of sortedDecoders) {
      const result = await this.applyDecoder(decoder, identifier.value);
      if (result?.success) {
        return result;
      }
    }

    return null;
  }

  /**
   * Apply a single decoder definition to an input
   */
  private async applyDecoder(
    decoder: DecoderDefinition,
    input: string,
  ): Promise<DecodedValue | null> {
    // Length validation (ReDoS prevention)
    if (input.length > decoder.inputMaxLength) {
      return null;
    }

    // Pattern matching
    const pattern = new RegExp(decoder.inputPattern);
    const match = input.toUpperCase().trim().match(pattern);

    if (!match) {
      return null;
    }

    // Extract fields from capture groups
    const extracted: Record<string, unknown> = {};

    for (const rule of decoder.extractionRules) {
      const rawValue = match[rule.captureGroup];
      extracted[rule.outputField] = this.applyTransform(
        rawValue,
        rule.transform,
        rule.transformConfig,
      );
    }

    // Apply lookup if configured
    if (decoder.lookupTableId && decoder.lookupKeyGroup) {
      const lookupKey = match[decoder.lookupKeyGroup];
      const lookupResult = await this.lookupService.get(
        decoder.lookupTableId,
        lookupKey,
      );

      if (lookupResult) {
        Object.assign(extracted, lookupResult.values);
      }
    }

    // Validate
    let confidence = decoder.baseConfidence;
    for (const rule of decoder.validationRules) {
      const valid = this.validateField(extracted, rule);
      if (!valid && rule.config.failureConfidence) {
        confidence = Math.min(confidence, rule.config.failureConfidence);
      }
    }

    // Build output
    const decoded: Record<string, unknown> = {};
    for (const mapping of decoder.outputFields) {
      decoded[mapping.outputField] = extracted[mapping.sourceField];
    }

    return {
      rawValue: input,
      identifierType: decoder.identifierType,
      success: true,
      confidence,
      decoded,
      decoderUsed: decoder.name,
    };
  }

  private applyTransform(
    value: string,
    transform?: string,
    config?: Record<string, unknown>,
  ): unknown {
    switch (transform) {
      case 'parseInt':
        return parseInt(value, 10);
      case 'parseYear':
        // Handle 2-digit years with century inference
        const year = parseInt(value, 10);
        return year < 100 ? 2000 + year : year;
      case 'lookup':
        // Handled separately
        return value;
      default:
        return value;
    }
  }
}
```

#### Admin UI Components

```
Admin Section: /admin/domain-expertise

├── Module List Page
│   ├── Search/filter bar (category, status, search)
│   ├── Module cards with quick actions
│   └── Create new module button
│
├── Module Editor Page
│   ├── Header: Name, status, publish button
│   ├── Tabs:
│   │   ├── Overview: Basic info, brands, stats
│   │   ├── Decoders: List + editor
│   │   ├── Lookup Tables: List + spreadsheet editor
│   │   ├── Value Drivers: List + condition builder
│   │   ├── Authenticity: List + marker editor
│   │   └── Testing: Input sandbox
│   └── Version history sidebar
│
├── Decoder Builder
│   ├── Pattern input with syntax highlighting
│   ├── Capture group visualizer
│   ├── Extraction rule builder
│   ├── Lookup table linker
│   ├── Validation rule builder
│   ├── Test input with live results
│   └── Example test cases
│
├── Lookup Table Editor
│   ├── Spreadsheet-style grid
│   ├── Add/edit/delete rows
│   ├── Import CSV/JSON
│   ├── Export options
│   └── Search/filter
│
├── Value Driver Editor
│   ├── Condition type selector
│   ├── Condition builder (visual)
│   ├── Multiplier slider with preview
│   ├── Priority drag-and-drop
│   └── Test with sample data
│
└── Test Console
    ├── Input section (identifier, text, fields)
    ├── Decode results viewer
    ├── Value driver matches
    ├── Authenticity assessment
    └── Side-by-side draft vs published comparison
```

#### Migration Strategy

**Phase 1: Database Setup**
1. Create all new entities and migrations
2. Keep existing static data unchanged
3. Both systems can run in parallel

**Phase 2: Data Seeding**
```typescript
// Script: seed-domain-expertise.ts
async function seedFromStatic() {
  // Create module for LV
  const lvModule = await moduleRepo.create({
    name: 'Louis Vuitton Authentication',
    categoryId: 'luxury_handbags',
    applicableBrands: ['Louis Vuitton', 'LV'],
    status: 'published',
  });

  // Create lookup table for factory codes
  const factoryTable = await lookupTableRepo.create({
    moduleId: lvModule.id,
    name: 'LV Factory Codes',
    keyField: 'code',
    valueSchema: [
      { name: 'location', type: 'string', required: true },
      { name: 'country', type: 'string', required: true },
      { name: 'active', type: 'boolean', required: false },
    ],
  });

  // Import entries from static LV_FACTORY_CODES
  for (const [code, info] of Object.entries(LV_FACTORY_CODES)) {
    await entryRepo.create({
      tableId: factoryTable.id,
      key: code,
      values: info,
    });
  }

  // Create decoder definition
  await decoderRepo.create({
    moduleId: lvModule.id,
    name: 'LV Date Code (Post-2007)',
    identifierType: 'lv_date_code',
    inputPattern: '^([A-Z]{2})(\\d{4})$',
    inputMaxLength: 10,
    extractionRules: [
      { captureGroup: 1, outputField: 'factoryCode', transform: 'none' },
      { captureGroup: 2, outputField: 'rawDigits', transform: 'none' },
    ],
    lookupTableId: factoryTable.id,
    lookupKeyGroup: 1,
    // ... more config
  });

  // Migrate value drivers...
  // Migrate authenticity markers...
}
```

**Phase 3: Dual-Read Mode**
```typescript
// Service checks DB first, falls back to static
async decodeIdentifier(identifier, categoryId) {
  const dbResult = await this.tryDatabaseDecode(identifier, categoryId);
  if (dbResult) return dbResult;

  // Fallback to static implementation
  return this.staticDecode(identifier, categoryId);
}
```

**Phase 4: Admin UI Launch**
- Deploy admin interface
- Staff can create/edit modules
- Changes only affect new modules (existing still static)

**Phase 5: Full Cutover**
- Migrate all static modules to DB
- Remove static fallback
- Archive static files (keep for reference)

#### Security Considerations

1. **Access Control**: Only `globalRole` staff/superadmin can access admin endpoints
2. **Regex Validation**: All user-supplied patterns validated for ReDoS vulnerability before save
3. **Audit Logging**: Every change logged with userId, timestamp, before/after
4. **Version Control**: Can't delete published versions, only archive
5. **Input Sanitization**: All user inputs validated, no code execution
6. **Rate Limiting**: Admin endpoints rate-limited to prevent abuse

#### Success Criteria

- [ ] All entities created with migrations
- [ ] Admin API endpoints functional with tests
- [ ] Static data successfully seeded to database
- [ ] DomainKnowledgeService loads from DB with caching
- [ ] Admin UI allows full CRUD for all entity types
- [ ] Publish/rollback workflow functional
- [ ] Test console shows accurate results
- [ ] Audit logging captures all changes
- [ ] No regression in existing decode/value-driver/authenticity functionality
- [ ] Performance: decode latency < 10ms with caching

---

### Slice 10: Learning and Feedback Loop
**Priority**: 🟢 Lower | **Effort**: High | **Impact**: Long-term High

#### Problem Solved
We don't know if our research was accurate. No feedback from actual sales outcomes.

#### Deliverables
1. **ResearchOutcomeTracker** - Link research to sales outcomes
2. **Tool effectiveness metrics** - Track which tools lead to successful sales
3. **Confidence calibration** - Adjust tool weights based on accuracy
4. **Anomaly detection** - Flag patterns of bad research

#### Technical Approach
```typescript
interface ResearchOutcome {
  itemId: string;
  researchRunId: string;

  // Research predictions
  predictedPrice: number;
  predictedCategory: string;
  identifiedBrand: string;
  identifiedModel: string;

  // Actual outcomes
  soldPrice?: number;
  daysToSell?: number;
  wasReturned?: boolean;
  returnReason?: string;

  // Calculated accuracy
  priceAccuracy?: number;  // |predicted - actual| / actual
  identificationCorrect?: boolean;
}

interface ToolEffectiveness {
  toolType: string;
  totalUses: number;
  contributedToSale: number;
  averagePriceAccuracy: number;
  averageConfidenceWhenUsed: number;
  calibrationScore: number;  // How well does confidence predict accuracy?
}

class ResearchLearningService {
  async recordOutcome(itemId: string, outcome: SaleOutcome): Promise<void> {
    const research = await this.getResearchForItem(itemId);

    // Calculate accuracy metrics
    const priceAccuracy = Math.abs(research.predictedPrice - outcome.soldPrice) / outcome.soldPrice;

    // Record outcome
    await this.outcomeRepository.save({
      itemId,
      researchRunId: research.id,
      predictedPrice: research.predictedPrice,
      soldPrice: outcome.soldPrice,
      priceAccuracy,
      // ...
    });

    // Update tool effectiveness stats
    for (const tool of research.toolsUsed) {
      await this.updateToolEffectiveness(tool.type, {
        priceAccuracy,
        sold: true,
        confidenceUsed: tool.confidence,
      });
    }
  }

  async recalibrateToolWeights(): Promise<void> {
    // Analyze outcomes over last 90 days
    const outcomes = await this.outcomeRepository.findRecent(90);

    for (const [toolType, stats] of this.groupByTool(outcomes)) {
      // Calculate calibration score
      // (how well does tool confidence predict actual accuracy)
      const calibration = this.calculateCalibration(stats);

      // Adjust tool's base confidence weight
      const currentWeight = this.toolRegistry.getConfidenceWeight(toolType);
      const adjustedWeight = currentWeight * calibration.adjustmentFactor;

      await this.toolRegistry.updateConfidenceWeight(toolType, adjustedWeight);
    }
  }
}
```

---

## Implementation Roadmap

### Phase 1: High-Impact Foundation (Weeks 1-4)
| Slice | Description | Dependencies |
|-------|-------------|--------------|
| **1** | Reverse Image Search | None |
| **4** | OCR-to-Search Pipeline | None |
| **3** | Iterative Search Refinement | None |

**Goal**: Add the tools that will have immediate impact on identification success rate.

### Phase 2: Visual Intelligence (Weeks 5-8)
| Slice | Description | Dependencies |
|-------|-------------|--------------|
| **2** | Category-Specific Visual Inspection | Slice 1 (uses visual results for category detection) |
| **8** | Product Page Extraction | Slice 3 (extracts from search results) |

**Goal**: Make the AI "see" like an expert - knowing where to look and what to extract.

### Phase 3: Validation & Quality (Weeks 9-12)
| Slice | Description | Dependencies |
|-------|-------------|--------------|
| **5** | Structured Comp Attribute Matching | None |
| **6** | Identification Validation Checkpoint | Slices 1-5 |
| **7** | Cross-Source Validation | None |

**Goal**: Add verification layers that catch errors before they reach users.

### Phase 4: Domain Expertise (Weeks 13-20)
| Slice | Description | Dependencies |
|-------|-------------|--------------|
| **9** | Domain Knowledge Database | Slice 2 |
| **9.1** | Admin-Configurable Domain Expertise | Slice 9 |

**Goal**: Inject expert knowledge for high-value categories, then make it dynamically configurable by staff.

### Phase 5: Learning Loop (Weeks 17-20)
| Slice | Description | Dependencies |
|-------|-------------|--------------|
| **10** | Learning and Feedback Loop | All previous slices |

**Goal**: Close the loop so the system improves over time.

---

## Success Metrics

### Primary Metrics
| Metric | Current (Estimated) | Phase 1 Target | Phase 3 Target |
|--------|---------------------|----------------|----------------|
| Identification Success Rate | ~60% | 75% | 85% |
| Price Accuracy (within 20%) | ~50% | 65% | 80% |
| Time to Research (avg) | 45s | 40s | 35s |
| Human Review Reduction | Baseline | -20% | -40% |

### Tool-Level Metrics
| Metric | Definition |
|--------|------------|
| Tool Hit Rate | % of times tool returns useful data |
| Tool Accuracy | % of tool outputs that prove correct |
| Tool Efficiency | Value generated / cost |
| Tool Contribution | % of successful IDs where tool was key |

### Quality Indicators
| Indicator | Target |
|-----------|--------|
| Cross-validated identifications | >60% of high-confidence items |
| Comp relevance score (avg) | >0.7 |
| Validation checkpoint pass rate | >80% |
| Re-identification trigger rate | <15% |

---

## Appendix A: API Cost Estimates

| Service | Cost per Call | Estimated Calls/Item | Cost/Item |
|---------|--------------|---------------------|-----------|
| Google Cloud Vision (Product Search) | $0.015 | 1-2 | $0.015-0.030 |
| SerpApi (Google Lens) | $0.005 | 1-2 | $0.005-0.010 |
| OpenAI GPT-4V | $0.01-0.03 | 2-4 | $0.02-0.12 |
| Bing Visual Search | $0.001 | 1-2 | $0.001-0.002 |
| Web Search (SerpApi) | $0.005 | 3-6 | $0.015-0.030 |
| **Total per item** | | | **$0.05-0.20** |

---

## Appendix B: Technical Dependencies

### New External Services
1. **Google Cloud Vision Product Search** OR **SerpApi Google Lens**
2. **Bing Visual Search API** (backup)

### Internal Dependencies
1. Enhanced OCR output format
2. Category detection service
3. Comp attribute extraction
4. Validation checkpoint in graph

### Database Changes
1. `research_outcomes` table for learning loop
2. `tool_effectiveness` metrics table
3. `domain_knowledge` configuration tables (Slice 9.1):
   - `domain_expertise_modules` - Top-level containers
   - `decoder_definitions` - Pattern-based decoders
   - `lookup_tables` + `lookup_entries` - Reference data
   - `value_driver_definitions` - Configurable value multipliers
   - `authenticity_marker_definitions` - Pattern markers
   - `domain_expertise_versions` - Version snapshots for rollback

---

*Document Version: 1.1*
*Created: December 2024*
*Updated: December 2024 - Added Slice 9.1 (Admin-Configurable Domain Expertise)*
*Author: Research Quality Task Force*
