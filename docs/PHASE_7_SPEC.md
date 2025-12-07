# Phase 7: Advanced AI Research & Chat Agents

> **Status**: Specification Draft
> **Depends On**: Phase 6 (Unified Item Model & AI Capture)
> **Duration Estimate**: 4-6 weeks

---

## Executive Summary

Phase 7 evolves ListForge's AI capabilities from the current sequential pipeline (`ListingAgentService`) into two specialized, purpose-built LangGraph agents:

1. **ResearchGraph** - A long-running, evidence-gathering research agent that builds comprehensive pricing intelligence and product identification
2. **ChatGraph** - A lightweight, latency-optimized conversational agent for user interaction with items and research data

This phase also introduces structured research persistence (`ItemResearch`, `ResearchEvidence`), real-time WebSocket communication for agent progress, and an enhanced chat interface in the frontend.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Domain Model Extensions](#3-domain-model-extensions)
4. [ResearchGraph Agent](#4-researchgraph-agent)
5. [ChatGraph Agent](#5-chatgraph-agent)
6. [Tool Definitions](#6-tool-definitions)
7. [API Surface](#7-api-surface)
8. [WebSocket Events](#8-websocket-events)
9. [Frontend Changes](#9-frontend-changes)
10. [Implementation Sub-Phases](#10-implementation-sub-phases)
11. [Testing Strategy](#11-testing-strategy)
12. [Migration Notes](#12-migration-notes)

---

## 1. Current State Analysis

### 1.1 Existing AI Infrastructure (Phase 6)

The current implementation in `listing-agent.service.ts` uses a LangGraph `StateGraph` with the following sequential nodes:

```
START → analyze_media → fetch_comps → price → content → calculate_shipping → validate → decide → END
                                                                                    ↓
                                                                              (loop if not done)
```

**Key Characteristics:**

- Single monolithic workflow handles all AI processing
- State managed via `AgentStateAnnotation` with `messages`, `item`, `done`, `fallbackKeywords`, `loopCount`
- Direct OpenAI calls for vision analysis (`gpt-4o` with images)
- eBay completed listings search for comps via `MarketplaceAdaptersService`
- No persistent checkpointing (in-memory only)
- Evidence stored via `EvidenceService.recordBundle()` at workflow completion

### 1.2 Existing Entities

| Entity | Purpose | Location |
|--------|---------|----------|
| `Item` | Unified listing/inventory model | `items/entities/item.entity.ts` |
| `ItemResearchRun` | Tracks AI workflow executions | `research/entities/item-research-run.entity.ts` |
| `EvidenceBundle` | Groups evidence items for a research run | `evidence/entities/evidence-bundle.entity.ts` |
| `EvidenceItem` | Individual evidence records (comps, sources) | `evidence/entities/evidence-item.entity.ts` |

### 1.3 Gaps to Address

1. **No structured research output** - Current workflow updates `Item` directly but doesn't persist research conclusions separately
2. **No conversational interface** - Users can't ask questions about items or research
3. **No research resumption** - If workflow fails mid-way, entire process restarts
4. **No real-time progress** - Frontend polls for completion status
5. **Tight coupling** - Research logic embedded in single service

---

## 2. Architecture Overview

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (listforge-web)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ItemDetailPage          ChatPanel              ResearchProgressPanel        │
│       │                     │                          │                     │
│       └─────────────────────┴──────────────────────────┘                     │
│                              │                                               │
│                    WebSocket (socket.io-client)                              │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────────┐
│                          API Gateway                                         │
├──────────────────────────────┼───────────────────────────────────────────────┤
│                              │                                               │
│  ┌───────────────┐  ┌────────┴────────┐  ┌───────────────────┐              │
│  │ ItemsModule   │  │ ChatModule      │  │ ResearchModule    │              │
│  │               │  │                 │  │                   │              │
│  │ - CRUD        │  │ - ChatGateway   │  │ - ResearchService │              │
│  │ - Status mgmt │  │   (WebSocket)   │  │ - ResearchProcessor│             │
│  └───────┬───────┘  │ - ChatService   │  │   (BullMQ)        │              │
│          │          └────────┬────────┘  └─────────┬─────────┘              │
│          │                   │                     │                         │
│          │          ┌────────┴────────┐  ┌─────────┴─────────┐              │
│          │          │  ChatGraph      │  │  ResearchGraph    │              │
│          │          │  (LangGraph)    │  │  (LangGraph)      │              │
│          │          │                 │  │                   │              │
│          │          │  - Fast         │  │  - Checkpointed   │              │
│          │          │  - No checkpoint│  │  - Multi-source   │              │
│          │          │  - Read-heavy   │  │  - Evidence-based │              │
│          │          └────────┬────────┘  └─────────┬─────────┘              │
│          │                   │                     │                         │
│          │                   └──────────┬──────────┘                         │
│          │                              │                                    │
│          │                    ┌─────────┴─────────┐                         │
│          │                    │   Tool Registry    │                         │
│          │                    │                    │                         │
│          │                    │ - getItemSnapshot  │                         │
│          │                    │ - searchComps      │                         │
│          │                    │ - saveResearch     │                         │
│          │                    │ - lookupProduct    │                         │
│          └────────────────────┴─────────┬─────────┘                         │
│                                         │                                    │
│                           ┌─────────────┴─────────────┐                     │
│                           │     External Services      │                     │
│                           │                            │                     │
│                           │ - eBay API                 │                     │
│                           │ - OpenAI API               │                     │
│                           │ - (Future: Amazon, etc.)   │                     │
│                           └────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate graphs for Research vs Chat** | Different requirements: Research needs checkpointing, retries, evidence persistence; Chat needs <2s latency, read-only access |
| **Tool-based architecture** | Enables graph nodes to interact with system via well-defined interfaces; same tools usable by both graphs |
| **BullMQ for research jobs** | Long-running research (minutes) shouldn't block HTTP requests; provides retry, monitoring |
| **WebSocket for real-time updates** | Research progress, chat messages need push-based delivery |
| **Postgres checkpointing for ResearchGraph** | LangGraph supports custom checkpointers; Postgres ensures durability |

---

## 3. Domain Model Extensions

### 3.1 New Types (`packages/core-types/src/research.ts`)

```typescript
// Existing (from Phase 6)
export type ResearchRunType = 'initial_intake' | 'pricing_refresh' | 'manual_request';
export type ResearchRunStatus = 'pending' | 'running' | 'success' | 'error';

// NEW: Structured research output
export interface PriceBand {
  label: 'floor' | 'target' | 'ceiling';
  amount: number;
  currency: string;
  confidence: number; // 0-1
  reasoning: string;
}

export interface DemandSignal {
  metric: 'sell_through_rate' | 'days_to_sell' | 'active_competition' | 'search_volume';
  value: number;
  unit: string;
  period?: string; // e.g., "30d", "90d"
  source: string;
}

export interface MissingInfoHint {
  field: string; // e.g., "model_number", "capacity", "color"
  importance: 'required' | 'recommended' | 'optional';
  reason: string;
  suggestedPrompt?: string; // Question to ask user
}

export interface ProductIdentification {
  confidence: number; // 0-1
  brand?: string;
  model?: string;
  mpn?: string;
  upc?: string;
  category?: string[];
  attributes: Record<string, string | number | boolean>;
}

export interface ItemResearchData {
  productId?: ProductIdentification;
  priceBands: PriceBand[];
  demandSignals: DemandSignal[];
  missingInfo: MissingInfoHint[];
  competitorCount?: number;
  recommendedMarketplaces: string[];
  generatedAt: string; // ISO timestamp
  version: string; // Schema version for migrations
}

// Research evidence record
export interface ResearchEvidenceRecord {
  id: string;
  type: 'sold_listing' | 'active_listing' | 'product_page' | 'price_guide' | 'ai_analysis';
  source: string; // e.g., "ebay", "amazon", "terapeak"
  sourceId?: string; // External ID from source
  url?: string;
  title: string;
  price?: number;
  currency?: string;
  soldDate?: string;
  condition?: string;
  imageUrl?: string;
  relevanceScore: number; // 0-1, how relevant to our item
  extractedData: Record<string, unknown>;
  fetchedAt: string;
}
```

### 3.2 New Entity: `ItemResearch`

This entity stores the structured research conclusions separately from evidence.

**Location**: `apps/listforge-api/src/research/entities/item-research.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { ItemResearchRun } from './item-research-run.entity';
import { ItemResearchData } from '@listforge/core-types';

@Entity('item_research')
@Index(['itemId', 'createdAt'])
export class ItemResearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid', { nullable: true })
  researchRunId?: string;

  @ManyToOne(() => ItemResearchRun, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'researchRunId' })
  researchRun?: ItemResearchRun;

  @Column('jsonb')
  data: ItemResearchData;

  @Column('varchar', { length: 20, default: '1.0.0' })
  schemaVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('boolean', { default: true })
  isCurrent: boolean; // Only one research per item should be current
}
```

### 3.3 Updated `ItemResearchRun` Entity

Add checkpointing support for LangGraph resumption.

```typescript
// Add to existing entity
@Column('jsonb', { nullable: true })
checkpoint?: Record<string, unknown>; // LangGraph checkpoint state

@Column('varchar', { length: 100, nullable: true })
currentNode?: string; // Current node in the graph for progress tracking

@Column('int', { default: 0 })
stepCount: number; // Number of steps executed

@Column('jsonb', { nullable: true })
stepHistory?: Array<{
  node: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
}>;
```

### 3.4 Chat Entities

**Location**: `apps/listforge-api/src/chat/entities/`

```typescript
// chat-session.entity.ts
@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatMessage, (msg) => msg.session)
  messages: ChatMessage[];
}

// chat-message.entity.ts
@Entity('chat_messages')
@Index(['sessionId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Column('varchar', { length: 20 })
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  actions?: Array<{
    type: 'update_field' | 'start_research' | 'suggest_price';
    payload: Record<string, unknown>;
    applied: boolean;
  }>;

  @Column('jsonb', { nullable: true })
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 4. ResearchGraph Agent

### 4.1 Purpose

The ResearchGraph is a multi-step, evidence-gathering agent that:

- Identifies products from media/text
- Searches multiple sources for comparable sales
- Calculates pricing recommendations with confidence scores
- Identifies missing information that would improve accuracy
- Persists all evidence and conclusions

### 4.2 Graph Architecture

```
                    ┌─────────────────┐
                    │      START      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  load_context   │ ← Hydrate item, existing research
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ analyze_media   │ ← Vision analysis, extract attributes
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ identify_product│ ← Match to known products, UPC lookup
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  search_comps   │ ← Parallel source queries
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ analyze_comps   │ ← Score relevance, extract patterns
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ calculate_price │ ← Price bands with confidence
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ assess_missing  │ ← Identify info gaps
                    └────────┬────────┘
                             │
                    ┌────────▼────────────┐
                    │    should_refine    │
                    └────────┬────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
      [has_gaps &&    [confident]     [max_iterations]
       can_refine]          │                │
            │               │                │
            ▼               │                │
    ┌───────────────┐       │                │
    │ refine_search │       │                │
    └───────┬───────┘       │                │
            │               │                │
            └───────────────┼────────────────┘
                            │
                   ┌────────▼────────┐
                   │ persist_results │ ← Save research + evidence
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │      END        │
                   └─────────────────┘
```

### 4.3 State Definition

```typescript
// research-graph.state.ts
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export const ResearchGraphAnnotation = Annotation.Root({
  // Core identifiers
  itemId: Annotation<string>(),
  researchRunId: Annotation<string>(),
  organizationId: Annotation<string>(),

  // LLM conversation
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Loaded data
  item: Annotation<ItemSnapshot | null>({
    default: () => null,
  }),
  existingResearch: Annotation<ItemResearchData | null>({
    default: () => null,
  }),

  // Analysis results
  mediaAnalysis: Annotation<MediaAnalysisResult | null>({
    default: () => null,
  }),
  productIdentification: Annotation<ProductIdentification | null>({
    default: () => null,
  }),

  // Evidence collection
  comps: Annotation<ResearchEvidenceRecord[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => [],
  }),
  searchQueries: Annotation<string[]>({
    reducer: (existing, update) => [...new Set([...existing, ...update])],
    default: () => [],
  }),

  // Calculated outputs
  priceBands: Annotation<PriceBand[]>({
    default: () => [],
  }),
  demandSignals: Annotation<DemandSignal[]>({
    default: () => [],
  }),
  missingInfo: Annotation<MissingInfoHint[]>({
    default: () => [],
  }),

  // Control flow
  iteration: Annotation<number>({
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    default: () => 3,
  }),
  confidenceThreshold: Annotation<number>({
    default: () => 0.7,
  }),
  overallConfidence: Annotation<number>({
    default: () => 0,
  }),
  done: Annotation<boolean>({
    default: () => false,
  }),
  error: Annotation<string | null>({
    default: () => null,
  }),
});

export type ResearchGraphState = typeof ResearchGraphAnnotation.State;
```

### 4.4 Node Implementations

```typescript
// research-graph.nodes.ts

export const loadContext = async (
  state: ResearchGraphState,
  config: { configurable: { tools: ResearchTools } }
): Promise<Partial<ResearchGraphState>> => {
  const { tools } = config.configurable;

  const item = await tools.getItemSnapshot.invoke({ itemId: state.itemId });
  const existingResearch = await tools.getLatestResearch.invoke({ itemId: state.itemId });

  return {
    item,
    existingResearch,
  };
};

export const analyzeMedia = async (
  state: ResearchGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ResearchGraphState>> => {
  const { llm } = config.configurable;

  if (!state.item?.media?.length) {
    return { mediaAnalysis: null };
  }

  const imageUrls = state.item.media
    .filter(m => m.type === 'image')
    .slice(0, 4) // Limit to 4 images for cost
    .map(m => m.url);

  const response = await llm.invoke([
    new SystemMessage(MEDIA_ANALYSIS_PROMPT),
    new HumanMessage({
      content: [
        { type: 'text', text: 'Analyze these product images:' },
        ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
      ],
    }),
  ]);

  const analysis = parseMediaAnalysis(response.content);

  return {
    mediaAnalysis: analysis,
    messages: [response],
  };
};

export const identifyProduct = async (
  state: ResearchGraphState,
  config: { configurable: { tools: ResearchTools; llm: BaseChatModel } }
): Promise<Partial<ResearchGraphState>> => {
  const { tools, llm } = config.configurable;

  // Combine item data with media analysis
  const context = {
    title: state.item?.title,
    description: state.item?.description,
    attributes: state.item?.attributes,
    mediaAnalysis: state.mediaAnalysis,
  };

  // Try UPC/MPN lookup if available
  if (state.mediaAnalysis?.extractedText?.upc) {
    const productMatch = await tools.lookupByUpc.invoke({
      upc: state.mediaAnalysis.extractedText.upc,
    });
    if (productMatch) {
      return {
        productIdentification: {
          confidence: 0.95,
          ...productMatch,
        },
      };
    }
  }

  // LLM-based identification
  const response = await llm.invoke([
    new SystemMessage(PRODUCT_IDENTIFICATION_PROMPT),
    new HumanMessage(JSON.stringify(context)),
  ]);

  return {
    productIdentification: parseProductIdentification(response.content),
    messages: [response],
  };
};

export const searchComps = async (
  state: ResearchGraphState,
  config: { configurable: { tools: ResearchTools } }
): Promise<Partial<ResearchGraphState>> => {
  const { tools } = config.configurable;

  // Generate search queries based on product identification
  const queries = generateSearchQueries(state);

  // Search across sources in parallel
  const searchPromises = queries.flatMap(query => [
    tools.searchSoldListings.invoke({ query, source: 'ebay', limit: 20 }),
    tools.searchActiveListings.invoke({ query, source: 'ebay', limit: 10 }),
  ]);

  const results = await Promise.allSettled(searchPromises);

  const comps = results
    .filter((r): r is PromiseFulfilledResult<ResearchEvidenceRecord[]> =>
      r.status === 'fulfilled'
    )
    .flatMap(r => r.value);

  return {
    comps,
    searchQueries: queries,
  };
};

export const analyzeComps = async (
  state: ResearchGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ResearchGraphState>> => {
  const { llm } = config.configurable;

  // Score relevance of each comp
  const scoredComps = await scoreCompRelevance(state.comps, state.item, llm);

  // Filter to relevant comps
  const relevantComps = scoredComps.filter(c => c.relevanceScore >= 0.5);

  return {
    comps: relevantComps,
  };
};

export const calculatePrice = async (
  state: ResearchGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ResearchGraphState>> => {
  const { llm } = config.configurable;

  const relevantComps = state.comps.filter(c => c.relevanceScore >= 0.7);

  if (relevantComps.length === 0) {
    return {
      priceBands: [],
      overallConfidence: 0.1,
    };
  }

  // Statistical analysis
  const prices = relevantComps
    .filter(c => c.price != null)
    .map(c => c.price!);

  const stats = calculatePriceStats(prices);

  // LLM reasoning for price bands
  const response = await llm.invoke([
    new SystemMessage(PRICING_PROMPT),
    new HumanMessage(JSON.stringify({
      item: state.item,
      productId: state.productIdentification,
      comps: relevantComps.slice(0, 10),
      stats,
    })),
  ]);

  const priceBands = parsePriceBands(response.content);

  // Calculate demand signals
  const demandSignals = calculateDemandSignals(relevantComps);

  return {
    priceBands,
    demandSignals,
    overallConfidence: calculateOverallConfidence(priceBands, relevantComps.length),
    messages: [response],
  };
};

export const assessMissing = async (
  state: ResearchGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ResearchGraphState>> => {
  const { llm } = config.configurable;

  const response = await llm.invoke([
    new SystemMessage(MISSING_INFO_PROMPT),
    new HumanMessage(JSON.stringify({
      item: state.item,
      productId: state.productIdentification,
      confidence: state.overallConfidence,
      compCount: state.comps.length,
    })),
  ]);

  return {
    missingInfo: parseMissingInfo(response.content),
    messages: [response],
  };
};

export const shouldRefine = (state: ResearchGraphState): 'refine' | 'persist' => {
  if (state.iteration >= state.maxIterations) {
    return 'persist';
  }

  if (state.overallConfidence >= state.confidenceThreshold) {
    return 'persist';
  }

  // Check if we have actionable refinement paths
  const canRefine = state.missingInfo.some(
    m => m.importance !== 'optional' && m.suggestedPrompt
  );

  return canRefine ? 'refine' : 'persist';
};

export const refineSearch = async (
  state: ResearchGraphState,
  config: { configurable: { tools: ResearchTools } }
): Promise<Partial<ResearchGraphState>> => {
  const { tools } = config.configurable;

  // Generate refined queries based on missing info
  const refinedQueries = state.missingInfo
    .filter(m => m.importance !== 'optional')
    .map(m => generateRefinedQuery(state, m));

  const results = await Promise.all(
    refinedQueries.map(q =>
      tools.searchSoldListings.invoke({ query: q, source: 'ebay', limit: 10 })
    )
  );

  return {
    comps: results.flat(),
    searchQueries: refinedQueries,
    iteration: state.iteration + 1,
  };
};

export const persistResults = async (
  state: ResearchGraphState,
  config: { configurable: { tools: ResearchTools } }
): Promise<Partial<ResearchGraphState>> => {
  const { tools } = config.configurable;

  // Save structured research
  await tools.saveItemResearch.invoke({
    itemId: state.itemId,
    researchRunId: state.researchRunId,
    data: {
      productId: state.productIdentification,
      priceBands: state.priceBands,
      demandSignals: state.demandSignals,
      missingInfo: state.missingInfo,
      competitorCount: state.comps.filter(c => c.type === 'active_listing').length,
      recommendedMarketplaces: determineMarketplaces(state),
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  });

  // Save evidence bundle
  await tools.saveEvidenceBundle.invoke({
    itemId: state.itemId,
    researchRunId: state.researchRunId,
    evidence: state.comps,
  });

  return { done: true };
};
```

### 4.5 Graph Builder

```typescript
// research-graph.builder.ts
import { StateGraph, START, END } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

export function buildResearchGraph(checkpointer: PostgresSaver) {
  const graph = new StateGraph(ResearchGraphAnnotation)
    .addNode('load_context', loadContext)
    .addNode('analyze_media', analyzeMedia)
    .addNode('identify_product', identifyProduct)
    .addNode('search_comps', searchComps)
    .addNode('analyze_comps', analyzeComps)
    .addNode('calculate_price', calculatePrice)
    .addNode('assess_missing', assessMissing)
    .addNode('refine_search', refineSearch)
    .addNode('persist_results', persistResults)

    .addEdge(START, 'load_context')
    .addEdge('load_context', 'analyze_media')
    .addEdge('analyze_media', 'identify_product')
    .addEdge('identify_product', 'search_comps')
    .addEdge('search_comps', 'analyze_comps')
    .addEdge('analyze_comps', 'calculate_price')
    .addEdge('calculate_price', 'assess_missing')
    .addConditionalEdges('assess_missing', shouldRefine, {
      refine: 'refine_search',
      persist: 'persist_results',
    })
    .addEdge('refine_search', 'analyze_comps')
    .addEdge('persist_results', END);

  return graph.compile({ checkpointer });
}
```

---

## 5. ChatGraph Agent

### 5.1 Purpose

The ChatGraph is a lightweight, reactive agent that:

- Answers user questions about items using existing research
- Suggests field updates based on conversation
- Can trigger new research if data is stale
- Maintains conversation context per session

### 5.2 Key Design Constraints

| Constraint | Implementation |
|------------|----------------|
| **Latency < 2s** | No checkpointing, streaming responses |
| **Read-heavy** | Preload research/evidence, avoid writes |
| **Tool-based** | Defined set of read-only + update tools |
| **Stateless** | Session state in DB, not graph |

### 5.3 Graph Architecture

```
               ┌─────────────┐
               │    START    │
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │ load_context│ ← Item, research, recent messages
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │  route_intent│ ← Classify user message
               └──────┬──────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
[question]      [action]          [research]
    │                 │                 │
    ▼                 ▼                 ▼
┌───────────┐  ┌───────────┐    ┌───────────┐
│answer_query│  │handle_action│  │start_research│
└─────┬─────┘  └─────┬─────┘    └─────┬─────┘
      │              │                │
      └──────────────┼────────────────┘
                     │
              ┌──────▼──────┐
              │   respond   │ ← Format + send response
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │     END     │
              └─────────────┘
```

### 5.4 State Definition

```typescript
// chat-graph.state.ts
export const ChatGraphAnnotation = Annotation.Root({
  // Session context
  sessionId: Annotation<string>(),
  itemId: Annotation<string>(),
  userId: Annotation<string>(),

  // Messages
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  userMessage: Annotation<string>(),

  // Loaded context (read-only)
  item: Annotation<ItemSnapshot | null>({
    default: () => null,
  }),
  research: Annotation<ItemResearchData | null>({
    default: () => null,
  }),
  recentEvidence: Annotation<ResearchEvidenceRecord[]>({
    default: () => [],
  }),

  // Routing
  intent: Annotation<'question' | 'action' | 'research' | 'unknown'>({
    default: () => 'unknown',
  }),

  // Response
  response: Annotation<string>({
    default: () => '',
  }),
  actions: Annotation<ChatAction[]>({
    default: () => [],
  }),
});
```

### 5.5 Tool Bindings

The ChatGraph uses a subset of tools:

```typescript
const chatTools = [
  getItemSnapshotTool,      // Read current item state
  getResearchTool,          // Read latest research
  getEvidenceTool,          // Read evidence records
  updateItemFieldTool,      // Update single field with reason
  startResearchJobTool,     // Trigger background research
];
```

### 5.6 Node Implementations (Simplified)

```typescript
export const routeIntent = async (
  state: ChatGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ChatGraphState>> => {
  const { llm } = config.configurable;

  const response = await llm.invoke([
    new SystemMessage(INTENT_CLASSIFICATION_PROMPT),
    new HumanMessage(state.userMessage),
  ]);

  const intent = parseIntent(response.content);

  return { intent };
};

export const answerQuery = async (
  state: ChatGraphState,
  config: { configurable: { llm: BaseChatModel } }
): Promise<Partial<ChatGraphState>> => {
  const { llm } = config.configurable;

  // Build context from item + research
  const context = buildChatContext(state.item, state.research, state.recentEvidence);

  const response = await llm.invoke([
    new SystemMessage(CHAT_ANSWER_PROMPT),
    new HumanMessage(`Context:\n${JSON.stringify(context)}\n\nQuestion: ${state.userMessage}`),
  ]);

  return {
    response: response.content as string,
    messages: [response],
  };
};

export const handleAction = async (
  state: ChatGraphState,
  config: { configurable: { tools: ChatTools; llm: BaseChatModel } }
): Promise<Partial<ChatGraphState>> => {
  const { tools, llm } = config.configurable;

  // Use LLM to determine which field to update
  const response = await llm.invoke([
    new SystemMessage(ACTION_EXTRACTION_PROMPT),
    new HumanMessage(state.userMessage),
  ]);

  const proposedAction = parseAction(response.content);

  // Return action for user confirmation (don't auto-apply)
  return {
    response: `I can update the ${proposedAction.field} to "${proposedAction.value}". Should I make this change?`,
    actions: [{
      type: 'update_field',
      payload: proposedAction,
      applied: false,
    }],
  };
};
```

---

## 6. Tool Definitions

### 6.1 Shared Tools

These tools are available to both ResearchGraph and ChatGraph.

```typescript
// tools/item.tools.ts
export const getItemSnapshotTool = tool(
  async ({ itemId }: { itemId: string }) => {
    const item = await itemsService.findOne(itemId);
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      condition: item.condition,
      attributes: item.attributes,
      media: item.media,
      defaultPrice: item.defaultPrice,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
    };
  },
  {
    name: 'getItemSnapshot',
    description: 'Get current state of an item including title, description, attributes, media, and status',
    schema: z.object({
      itemId: z.string().uuid(),
    }),
  }
);

export const updateItemFieldTool = tool(
  async ({ itemId, field, value, reason }: UpdateItemFieldInput) => {
    await itemsService.updateField(itemId, field, value, reason);
    return { success: true, field, newValue: value };
  },
  {
    name: 'updateItemField',
    description: 'Update a single field on an item with an audit reason',
    schema: z.object({
      itemId: z.string().uuid(),
      field: z.enum(['title', 'description', 'condition', 'defaultPrice', 'attributes']),
      value: z.unknown(),
      reason: z.string(),
    }),
  }
);
```

### 6.2 Research-Only Tools

```typescript
// tools/research.tools.ts
export const searchSoldListingsTool = tool(
  async ({ query, source, limit }: SearchSoldInput) => {
    const adapter = marketplaceAdaptersService.getAdapter(source);
    const results = await adapter.searchSoldListings(query, { limit });
    return results.map(toEvidenceRecord);
  },
  {
    name: 'searchSoldListings',
    description: 'Search completed/sold listings on a marketplace to find comparable sales',
    schema: z.object({
      query: z.string(),
      source: z.enum(['ebay', 'amazon']),
      limit: z.number().default(20),
    }),
  }
);

export const saveItemResearchTool = tool(
  async ({ itemId, researchRunId, data }: SaveResearchInput) => {
    // Mark previous research as non-current
    await researchService.markPreviousAsHistorical(itemId);

    // Save new research
    const research = await researchService.create({
      itemId,
      researchRunId,
      data,
      isCurrent: true,
    });

    return { researchId: research.id };
  },
  {
    name: 'saveItemResearch',
    description: 'Persist structured research conclusions for an item',
    schema: z.object({
      itemId: z.string().uuid(),
      researchRunId: z.string().uuid().optional(),
      data: ItemResearchDataSchema,
    }),
  }
);

export const saveEvidenceBundleTool = tool(
  async ({ itemId, researchRunId, evidence }: SaveEvidenceInput) => {
    const bundle = await evidenceService.recordBundle({
      itemId,
      researchRunId,
      evidence,
    });
    return { bundleId: bundle.id, evidenceCount: evidence.length };
  },
  {
    name: 'saveEvidenceBundle',
    description: 'Persist evidence records collected during research',
    schema: z.object({
      itemId: z.string().uuid(),
      researchRunId: z.string().uuid().optional(),
      evidence: z.array(ResearchEvidenceRecordSchema),
    }),
  }
);
```

### 6.3 Chat-Only Tools

```typescript
// tools/chat.tools.ts
export const startResearchJobTool = tool(
  async ({ itemId, type, priority }: StartResearchInput) => {
    const job = await researchService.queueJob({
      itemId,
      type,
      priority,
    });
    return { jobId: job.id, status: 'queued' };
  },
  {
    name: 'startResearchJob',
    description: 'Queue a new research job for an item. Use when data is stale or user requests fresh research.',
    schema: z.object({
      itemId: z.string().uuid(),
      type: z.enum(['pricing_refresh', 'manual_request']),
      priority: z.enum(['low', 'normal', 'high']).default('normal'),
    }),
  }
);

export const getResearchTool = tool(
  async ({ itemId }: { itemId: string }) => {
    const research = await researchService.findLatest(itemId);
    return research?.data ?? null;
  },
  {
    name: 'getResearch',
    description: 'Get the most recent research conclusions for an item',
    schema: z.object({
      itemId: z.string().uuid(),
    }),
  }
);
```

---

## 7. API Surface

### 7.1 Research Endpoints

```typescript
// research.controller.ts

@Controller('items/:itemId/research')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class ResearchController {

  @Post()
  @ApiOperation({ summary: 'Start a new research job' })
  async startResearch(
    @Param('itemId') itemId: string,
    @Body() dto: StartResearchDto,
    @User() user: AuthUser,
  ): Promise<{ jobId: string }> {
    const job = await this.researchService.queueJob({
      itemId,
      organizationId: user.organizationId,
      type: dto.type ?? 'manual_request',
      priority: dto.priority ?? 'normal',
    });
    return { jobId: job.id };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest research for item' })
  async getLatest(
    @Param('itemId') itemId: string,
  ): Promise<ItemResearchDto | null> {
    return this.researchService.findLatest(itemId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get research history for item' })
  async getHistory(
    @Param('itemId') itemId: string,
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponse<ItemResearchDto>> {
    return this.researchService.findHistory(itemId, query);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get research job status' })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<ResearchJobStatusDto> {
    return this.researchService.getJobStatus(jobId);
  }
}
```

### 7.2 Chat Endpoints

```typescript
// chat.controller.ts

@Controller('items/:itemId/chat')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class ChatController {

  @Post('sessions')
  @ApiOperation({ summary: 'Create new chat session' })
  async createSession(
    @Param('itemId') itemId: string,
    @User() user: AuthUser,
  ): Promise<{ sessionId: string }> {
    const session = await this.chatService.createSession({
      itemId,
      userId: user.id,
      organizationId: user.organizationId,
    });
    return { sessionId: session.id };
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get messages for session' })
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponse<ChatMessageDto>> {
    return this.chatService.getMessages(sessionId, query);
  }

  // Note: Message sending happens via WebSocket (ChatGateway)
}
```

### 7.3 API Types (`packages/api-types/src/research.ts`)

```typescript
// Request DTOs
export interface StartResearchDto {
  type?: 'pricing_refresh' | 'manual_request';
  priority?: 'low' | 'normal' | 'high';
}

// Response DTOs
export interface ItemResearchDto {
  id: string;
  itemId: string;
  data: ItemResearchData;
  createdAt: string;
  researchRunId?: string;
}

export interface ResearchJobStatusDto {
  id: string;
  itemId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  currentNode?: string;
  stepCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Chat types (packages/api-types/src/chat.ts)
export interface ChatSessionDto {
  id: string;
  itemId: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChatMessageDto {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: ChatAction[];
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
}

export interface ApplyActionDto {
  messageId: string;
  actionIndex: number;
}
```

---

## 8. WebSocket Events

### 8.1 Gateway Implementation

```typescript
// chat.gateway.ts
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' }, // Configure properly for production
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGraph: ChatGraphService,
  ) {}

  async handleConnection(client: Socket) {
    const user = await this.authenticateSocket(client);
    if (!user) {
      client.disconnect();
      return;
    }
    client.data.user = user;
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const session = await this.chatService.findSession(data.sessionId);
    if (!session || session.userId !== client.data.user.id) {
      return { error: 'Session not found' };
    }

    await client.join(`session:${data.sessionId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; content: string },
  ) {
    const { sessionId, content } = data;

    // Save user message
    const userMessage = await this.chatService.saveMessage({
      sessionId,
      role: 'user',
      content,
    });

    // Broadcast user message
    this.server.to(`session:${sessionId}`).emit('message', userMessage);

    // Stream assistant response
    const session = await this.chatService.findSession(sessionId);

    await this.chatGraph.streamResponse({
      sessionId,
      itemId: session.itemId,
      userId: client.data.user.id,
      userMessage: content,
      onToken: (token) => {
        this.server.to(`session:${sessionId}`).emit('token', { token });
      },
      onComplete: async (response, actions) => {
        const assistantMessage = await this.chatService.saveMessage({
          sessionId,
          role: 'assistant',
          content: response,
          actions,
        });
        this.server.to(`session:${sessionId}`).emit('message', assistantMessage);
      },
    });
  }

  @SubscribeMessage('apply_action')
  async handleApplyAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; actionIndex: number },
  ) {
    const result = await this.chatService.applyAction(
      data.messageId,
      data.actionIndex,
      client.data.user.id,
    );

    const message = await this.chatService.findMessage(data.messageId);
    this.server.to(`session:${message.sessionId}`).emit('action_applied', result);

    return result;
  }
}
```

### 8.2 Research Progress Gateway

```typescript
// research.gateway.ts
@WebSocketGateway({ namespace: '/research' })
export class ResearchGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe_job')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    await client.join(`job:${data.jobId}`);

    // Send current status immediately
    const status = await this.researchService.getJobStatus(data.jobId);
    client.emit('job_status', status);
  }

  // Called by ResearchProcessor when graph node completes
  emitNodeComplete(jobId: string, node: string, status: 'success' | 'error') {
    this.server.to(`job:${jobId}`).emit('node_complete', {
      node,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitJobComplete(jobId: string, result: ResearchJobResultDto) {
    this.server.to(`job:${jobId}`).emit('job_complete', result);
  }
}
```

### 8.3 Client Event Types (`packages/socket-types/src/index.ts`)

```typescript
// Server -> Client events
export interface ServerToClientEvents {
  // Chat
  message: (msg: ChatMessageDto) => void;
  token: (data: { token: string }) => void;
  action_applied: (result: { success: boolean; field?: string; error?: string }) => void;

  // Research
  job_status: (status: ResearchJobStatusDto) => void;
  node_complete: (data: { node: string; status: string; timestamp: string }) => void;
  job_complete: (result: ResearchJobResultDto) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  // Chat
  join_session: (data: { sessionId: string }) => void;
  send_message: (data: { sessionId: string; content: string }) => void;
  apply_action: (data: { messageId: string; actionIndex: number }) => void;

  // Research
  subscribe_job: (data: { jobId: string }) => void;
}
```

---

## 9. Frontend Changes

### 9.1 New Components

#### ChatPanel

```tsx
// components/chat/ChatPanel.tsx
export function ChatPanel({ itemId }: { itemId: string }) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [inputValue, setInputValue] = useState('');

  const socket = useSocket('/chat');

  // Create or resume session
  useEffect(() => {
    const initSession = async () => {
      const existingSession = await api.chat.getActiveSession(itemId);
      if (existingSession) {
        setSession(existingSession);
        const msgs = await api.chat.getMessages(existingSession.id);
        setMessages(msgs);
      } else {
        const newSession = await api.chat.createSession(itemId);
        setSession(newSession);
      }
    };
    initSession();
  }, [itemId]);

  // Socket event handlers
  useEffect(() => {
    if (!session || !socket) return;

    socket.emit('join_session', { sessionId: session.id });

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setStreamingContent('');
    });

    socket.on('token', ({ token }) => {
      setStreamingContent((prev) => prev + token);
    });

    return () => {
      socket.off('message');
      socket.off('token');
    };
  }, [session, socket]);

  const sendMessage = () => {
    if (!inputValue.trim() || !session) return;

    socket?.emit('send_message', {
      sessionId: session.id,
      content: inputValue,
    });
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {streamingContent && (
          <div className="text-gray-600 animate-pulse">
            {streamingContent}
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about this item..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
}
```

#### ResearchProgress

```tsx
// components/research/ResearchProgress.tsx
const RESEARCH_NODES = [
  { id: 'load_context', label: 'Loading item' },
  { id: 'analyze_media', label: 'Analyzing photos' },
  { id: 'identify_product', label: 'Identifying product' },
  { id: 'search_comps', label: 'Finding comparables' },
  { id: 'analyze_comps', label: 'Analyzing prices' },
  { id: 'calculate_price', label: 'Calculating recommendations' },
  { id: 'assess_missing', label: 'Checking for gaps' },
  { id: 'persist_results', label: 'Saving results' },
];

export function ResearchProgress({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<ResearchJobStatus | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  const socket = useSocket('/research');

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe_job', { jobId });

    socket.on('job_status', setStatus);

    socket.on('node_complete', ({ node, status }) => {
      if (status === 'success') {
        setCompletedNodes((prev) => new Set([...prev, node]));
      }
    });

    socket.on('job_complete', (result) => {
      setStatus((prev) => prev ? { ...prev, status: 'success' } : null);
    });

    return () => {
      socket.off('job_status');
      socket.off('node_complete');
      socket.off('job_complete');
    };
  }, [socket, jobId]);

  return (
    <div className="space-y-2">
      {RESEARCH_NODES.map((node) => {
        const isComplete = completedNodes.has(node.id);
        const isCurrent = status?.currentNode === node.id;

        return (
          <div
            key={node.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded',
              isComplete && 'bg-green-50',
              isCurrent && 'bg-blue-50 animate-pulse',
            )}
          >
            {isComplete ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : isCurrent ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Circle className="h-4 w-4 text-gray-300" />
            )}
            <span className={cn(isComplete && 'text-green-600')}>
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### 9.2 Updated Item Detail Page

```tsx
// routes/_authenticated/items/$id.tsx
export function ItemDetailPage() {
  const { id } = useParams();
  const { data: item } = useGetItemQuery(id);
  const { data: research } = useGetLatestResearchQuery(id);

  const [activeTab, setActiveTab] = useState<'details' | 'research' | 'chat'>('details');
  const [showResearchProgress, setShowResearchProgress] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const [startResearch] = useStartResearchMutation();

  const handleStartResearch = async () => {
    const result = await startResearch({ itemId: id }).unwrap();
    setActiveJobId(result.jobId);
    setShowResearchProgress(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="research">
              Research
              {research && (
                <Badge variant="secondary" className="ml-2">
                  {formatDistanceToNow(new Date(research.createdAt))} ago
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ItemDetailsPanel item={item} />
          </TabsContent>

          <TabsContent value="research">
            {research ? (
              <ResearchPanel research={research} />
            ) : (
              <EmptyState
                title="No research yet"
                description="Run AI research to get pricing recommendations"
                action={
                  <Button onClick={handleStartResearch}>
                    Start Research
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="chat">
            <ChatPanel itemId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <PricingCard research={research} />

        {showResearchProgress && activeJobId && (
          <Card>
            <CardHeader>
              <CardTitle>Research in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResearchProgress jobId={activeJobId} />
            </CardContent>
          </Card>
        )}

        <EvidenceCard itemId={id} />
      </div>
    </div>
  );
}
```

---

## 10. Implementation Sub-Phases

### Phase 7.1: Research Infrastructure (Week 1-2)

**Goal**: Establish research persistence and job processing without changing AI logic.

**Tasks**:

1. Create `ItemResearch` entity and migration
2. Update `ItemResearchRun` with checkpoint fields
3. Create `ResearchService` with CRUD operations
4. Set up BullMQ queue for research jobs (`research.processor.ts`)
5. Implement Postgres checkpointer for LangGraph
6. Add research API endpoints
7. Update `@listforge/api-types` with new DTOs

**Acceptance Criteria**:

- [ ] Can persist `ItemResearch` records
- [ ] Research jobs process via BullMQ
- [ ] Checkpoints survive API restart
- [ ] API endpoints return research data

### Phase 7.2: ResearchGraph Implementation (Week 2-3)

**Goal**: Migrate current `ListingAgentService` logic to ResearchGraph with proper tooling.

**Tasks**:

1. Define `ResearchGraphAnnotation` state
2. Implement tool functions (refactor from existing service)
3. Build graph nodes (extract from `ListingAgentService`)
4. Wire up checkpointing
5. Emit WebSocket events for progress
6. Add retry logic for failed nodes
7. Comprehensive integration tests

**Acceptance Criteria**:

- [ ] ResearchGraph produces `ItemResearch` records
- [ ] Evidence persisted via `EvidenceService`
- [ ] Graph resumes from checkpoint after failure
- [ ] WebSocket events emit for each node

### Phase 7.3: WebSocket & Real-time (Week 3)

**Goal**: Enable real-time progress updates and chat infrastructure.

**Tasks**:

1. Create `ChatGateway` and `ResearchGateway`
2. Implement socket authentication
3. Create `@listforge/socket-types` package
4. Build `ChatSession` and `ChatMessage` entities
5. Update frontend socket integration
6. Add `ResearchProgress` component
7. E2E tests for WebSocket flows

**Acceptance Criteria**:

- [ ] Research progress visible in real-time
- [ ] Socket connections authenticated
- [ ] Chat sessions persist to DB
- [ ] Frontend receives streaming tokens

### Phase 7.4: ChatGraph Implementation (Week 4)

**Goal**: Build conversational interface for item interaction.

**Tasks**:

1. Define `ChatGraphAnnotation` state
2. Implement intent routing
3. Build response generation nodes
4. Wire up chat tools
5. Implement action suggestion/application
6. Build `ChatPanel` component
7. Streaming response rendering

**Acceptance Criteria**:

- [ ] Chat responds < 2s for simple queries
- [ ] Can suggest field updates
- [ ] User can apply suggested actions
- [ ] Conversation history persists

### Phase 7.5: Integration & Polish (Week 5-6)

**Goal**: Full integration, edge cases, and UX polish.

**Tasks**:

1. Update item detail page with tabs
2. Research <-> Chat handoff (trigger research from chat)
3. Handle stale research (auto-suggest refresh)
4. Error states and recovery UI
5. Loading states and skeletons
6. Performance optimization
7. Documentation
8. End-to-end testing

**Acceptance Criteria**:

- [ ] Smooth UX flow between details/research/chat
- [ ] Error states handled gracefully
- [ ] Performance targets met (research < 60s, chat < 2s)
- [ ] All tests passing

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Example: Tool tests
describe('searchSoldListingsTool', () => {
  it('returns normalized evidence records', async () => {
    mockEbayAdapter.searchSoldListings.mockResolvedValue([
      { itemId: '123', title: 'Test Item', price: 99.99 },
    ]);

    const result = await searchSoldListingsTool.invoke({
      query: 'test',
      source: 'ebay',
      limit: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'sold_listing',
      source: 'ebay',
      price: 99.99,
    });
  });
});

// Example: Graph node tests
describe('calculatePrice node', () => {
  it('produces price bands from comps', async () => {
    const state = {
      comps: [
        { price: 100, relevanceScore: 0.9 },
        { price: 120, relevanceScore: 0.8 },
        { price: 90, relevanceScore: 0.85 },
      ],
    };

    const result = await calculatePrice(state, { configurable: { llm: mockLlm } });

    expect(result.priceBands).toHaveLength(3);
    expect(result.priceBands[0].label).toBe('floor');
    expect(result.overallConfidence).toBeGreaterThan(0.5);
  });
});
```

### 11.2 Integration Tests

```typescript
// Example: Full research flow
describe('ResearchGraph integration', () => {
  it('completes research and persists results', async () => {
    // Arrange
    const item = await createTestItem({ title: 'iPhone 13 Pro Max 256GB' });

    // Act
    const graph = buildResearchGraph(testCheckpointer);
    const result = await graph.invoke({
      itemId: item.id,
      researchRunId: 'test-run',
      organizationId: item.organizationId,
    });

    // Assert
    expect(result.done).toBe(true);
    expect(result.priceBands).toHaveLength(3);

    const savedResearch = await researchService.findLatest(item.id);
    expect(savedResearch).not.toBeNull();
    expect(savedResearch.data.priceBands).toEqual(result.priceBands);

    const evidence = await evidenceService.findByItem(item.id);
    expect(evidence.length).toBeGreaterThan(0);
  });
});
```

### 11.3 E2E Tests (Playwright)

```typescript
// Example: Chat flow
test('user can chat about item pricing', async ({ page }) => {
  await page.goto(`/items/${testItem.id}`);

  // Navigate to chat tab
  await page.click('text=Chat');

  // Send message
  await page.fill('input[placeholder*="Ask about"]', 'What price should I list this for?');
  await page.click('button:has-text("Send")');

  // Wait for response
  await expect(page.locator('.chat-message.assistant')).toBeVisible();

  // Check response mentions price
  const response = await page.locator('.chat-message.assistant').textContent();
  expect(response).toMatch(/\$\d+/);
});
```

---

## 12. Migration Notes

### 12.1 Database Migrations

```sql
-- Migration: CreateItemResearch
CREATE TABLE item_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  research_run_id UUID REFERENCES item_research_runs(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  schema_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_current BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_item_research_item_current ON item_research(item_id, created_at DESC) WHERE is_current = true;

-- Migration: AddCheckpointToResearchRun
ALTER TABLE item_research_runs
  ADD COLUMN checkpoint JSONB,
  ADD COLUMN current_node VARCHAR(100),
  ADD COLUMN step_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN step_history JSONB;

-- Migration: CreateChatTables
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_item ON chat_sessions(item_id);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  actions JSONB,
  tool_calls JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

### 12.2 Deprecation Path for `ListingAgentService`

The existing `ListingAgentService` will remain operational during Phase 7 implementation. Once ResearchGraph is validated:

1. **Week 1-2**: ResearchGraph runs in shadow mode (both run, compare outputs)
2. **Week 3**: Feature flag to route new research to ResearchGraph
3. **Week 4**: Default to ResearchGraph, fallback to ListingAgentService on error
4. **Week 5**: Remove fallback, deprecate ListingAgentService
5. **Week 6**: Delete deprecated code

### 12.3 Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| New research structure | Frontend needs to parse `ItemResearchData` | Update RTK Query types |
| WebSocket namespaces | Old socket connections won't work | Deploy frontend + backend together |
| Chat sessions required | No more ad-hoc questions | Auto-create session on first message |

---

## Appendix A: Prompt Templates

### Media Analysis Prompt

```
You are an expert product analyst. Analyze the provided product images and extract:

1. **Product Category**: What type of product is this?
2. **Brand**: Can you identify the brand? Look for logos, labels.
3. **Model/Version**: Any model numbers, version indicators?
4. **Condition**: Rate 1-5 (1=poor, 5=like new). Note any damage.
5. **Key Features**: Size, color, capacity, material, etc.
6. **Text Extraction**: Any visible text (serial numbers, labels, etc.)
7. **Completeness**: Is this a complete item or missing parts?

Respond in JSON format:
{
  "category": string,
  "brand": string | null,
  "model": string | null,
  "conditionScore": number,
  "conditionNotes": string,
  "features": { [key: string]: string },
  "extractedText": { [label: string]: string },
  "completeness": "complete" | "partial" | "unknown",
  "confidence": number (0-1)
}
```

### Pricing Prompt

```
You are a pricing expert. Based on the comparable sales data provided, determine optimal price bands for selling this item.

Consider:
- Recent sale prices (weight more recent higher)
- Condition differences between comps and our item
- Market velocity (how fast similar items sell)
- Seasonal factors if applicable
- Platform fees and shipping considerations

Provide three price bands:
1. **Floor**: Minimum viable price (quick sale, still profitable)
2. **Target**: Optimal price balancing speed and margin
3. **Ceiling**: Maximum realistic price (patient seller, best condition)

For each band, include:
- Amount in USD
- Confidence score (0-1)
- Reasoning (1-2 sentences)

Respond in JSON:
{
  "priceBands": [
    { "label": "floor", "amount": number, "confidence": number, "reasoning": string },
    { "label": "target", "amount": number, "confidence": number, "reasoning": string },
    { "label": "ceiling", "amount": number, "confidence": number, "reasoning": string }
  ]
}
```

---

## Appendix B: Error Handling

### ResearchGraph Errors

| Error Type | Handling | User Experience |
|------------|----------|-----------------|
| API timeout (eBay/OpenAI) | Retry 3x with backoff, then checkpoint | "Research paused, will resume automatically" |
| Invalid item state | Abort, mark job failed | "Item not ready for research" |
| No comps found | Continue with low confidence | "Limited data available, prices are estimates" |
| Checkpointer failure | Log, continue without checkpoint | Silent (degrades to non-resumable) |

### ChatGraph Errors

| Error Type | Handling | User Experience |
|------------|----------|-----------------|
| LLM timeout | Return fallback response | "I'm having trouble right now. Try again?" |
| Invalid session | Return error event | "Session expired, please refresh" |
| Tool failure | Retry once, then apologize | "I couldn't access that data. Let me try differently." |

---

*Document Version: 1.0.0*
*Last Updated: Phase 7 Specification Draft*
