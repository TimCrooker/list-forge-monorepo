import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import {
  AutoApprovalSettings,
  GeneratedListingContent,
  ItemAttribute,
  ResearchSnapshot,
  VisionExtractResult,
} from '@listforge/core-types';
import { CompResult, MarketplaceAdapter } from '@listforge/marketplace-adapters';
import { OpenAIService } from './openai.service';
import { MarketplaceAccountService } from '../../marketplaces/services/marketplace-account.service';

type PricingStrategy = 'balanced';

export interface AgentRunInput {
  itemId: string;
  orgId: string;
  userId: string;
  photoUrls: string[];
  userHint: string | null;
  autoApprovalSettings: AutoApprovalSettings;
}

export interface AgentRunOutput {
  extracted: VisionExtractResult;
  attributes: ItemAttribute[];
  soldComps: CompResult[];
  activeComps: CompResult[];
  researchSnapshot: ResearchSnapshot | null;
  pricing: {
    suggested: number;
    min: number;
    max: number;
    strategy: PricingStrategy;
  };
  listingContent: GeneratedListingContent;
  shipping: {
    type: 'flat' | 'calculated' | 'free';
    flatRateAmount: number | null;
  };
  confidence: number;
  aiError?: string | null;
  loopCount: number;
}

// Define state using LangGraph's Annotation for proper channel management
const AgentStateAnnotation = Annotation.Root({
  loopCount: Annotation<number>({
    reducer: (left, right) => right ?? left ?? 0,
    default: () => 0,
  }),
  maxLoops: Annotation<number>({
    reducer: (left, right) => right ?? left ?? 3,
    default: () => 3,
  }),
  searchKeywords: Annotation<string | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  photoUrls: Annotation<string[]>({
    reducer: (left, right) => right ?? left ?? [],
    default: () => [],
  }),
  userHint: Annotation<string | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  autoApprovalSettings: Annotation<AutoApprovalSettings>({
    reducer: (left, right) => right ?? left,
  }),
  extracted: Annotation<VisionExtractResult | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  attributes: Annotation<ItemAttribute[] | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  soldComps: Annotation<CompResult[]>({
    reducer: (left, right) => right ?? left ?? [],
    default: () => [],
  }),
  activeComps: Annotation<CompResult[]>({
    reducer: (left, right) => right ?? left ?? [],
    default: () => [],
  }),
  researchSnapshot: Annotation<ResearchSnapshot | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  pricing: Annotation<{
    suggested: number;
    min: number;
    max: number;
    strategy: string;
  } | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  listingContent: Annotation<GeneratedListingContent | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  shipping: Annotation<{
    type: string;
    flatRateAmount: number | null;
  } | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  confidence: Annotation<number | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  done: Annotation<boolean>({
    reducer: (left, right) => right ?? left ?? false,
    default: () => false,
  }),
  aiError: Annotation<string | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
});

type AgentStateType = typeof AgentStateAnnotation.State;

@Injectable()
export class ListingAgentService {
  private readonly logger = new Logger(ListingAgentService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly marketplaceAccountService: MarketplaceAccountService,
  ) {}

  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    // Simple wrapper functions to avoid complex LangChain tool typing issues
    const analyzeMediaFunc = async (photoUrls: string[]) =>
      this.openaiService.analyzePhotos(photoUrls);

    const searchCompsFunc = async (params: {
      orgId: string;
      keywords: string;
      brand: string | null;
      model: string | null;
      condition: string | null;
      soldOnly: boolean;
      limit: number;
    }) => {
      const accounts = await this.marketplaceAccountService.listAccounts(params.orgId);
      const ebayAccount = accounts.find(
        (acc) => acc.marketplace === 'EBAY' && acc.status === 'active',
      );

      if (!ebayAccount) {
        return [] as CompResult[];
      }

      const adapter: MarketplaceAdapter = await this.marketplaceAccountService.getAdapter(
        ebayAccount.id,
      );

      return adapter.searchComps({
        keywords: params.keywords,
        brand: params.brand,
        model: params.model,
        condition: params.condition,
        soldOnly: params.soldOnly,
        limit: params.limit,
      });
    };

    const generateContentFunc = async (extracted: any, priceSuggested: number) =>
      this.openaiService.generateListingContent(extracted, priceSuggested);

    const builder = new StateGraph(AgentStateAnnotation)
      .addNode('analyze_media', async (state: AgentStateType) => {
        const extracted = await analyzeMediaFunc(state.photoUrls);
        const attributes = this.buildAttributes(extracted);
        const keywords = this.buildKeywords(extracted, state.userHint);
        return {
          extracted,
          attributes,
          searchKeywords: keywords,
        };
      })
      .addNode('fetch_comps', async (state: AgentStateType) => {
        const keywords = state.searchKeywords || '';
        const extracted = state.extracted as VisionExtractResult;
        const soldComps = await searchCompsFunc({
          orgId: input.orgId,
          keywords,
          brand: extracted.brand,
          model: extracted.model,
          condition: extracted.condition,
          soldOnly: true,
          limit: 20,
        });
        const activeComps = await searchCompsFunc({
          orgId: input.orgId,
          keywords,
          brand: extracted.brand,
          model: extracted.model,
          condition: extracted.condition,
          soldOnly: false,
          limit: 20,
        });

        return {
          soldComps,
          activeComps,
          researchSnapshot: this.calculateResearchSnapshot(soldComps, activeComps),
        };
      })
      .addNode('price', async (state: AgentStateType) => {
        const extracted = state.extracted as VisionExtractResult;
        const researchSnapshot = state.researchSnapshot as ResearchSnapshot | null;
        const pricing = this.calculatePricing(extracted, researchSnapshot);
        return { pricing };
      })
      .addNode('content', async (state: AgentStateType) => {
        const extracted = state.extracted as VisionExtractResult;
        const priceSuggested = (state.pricing as { suggested: number }).suggested;
        const listingContent = await generateContentFunc(extracted, priceSuggested);
        return { listingContent };
      })
      .addNode('calculate_shipping', async (state: AgentStateType) => {
        const extracted = state.extracted as VisionExtractResult;
        const price = (state.pricing as { suggested: number }).suggested;
        const shipping = {
          type: this.suggestShippingType(extracted, price),
          flatRateAmount:
            this.suggestShippingType(extracted, price) === 'flat'
              ? this.estimateFlatRate(extracted)
              : null,
        };
        return { shipping };
      })
      .addNode('validate', async (state: AgentStateType) => {
        const extracted = state.extracted as VisionExtractResult;
        const listingContent = state.listingContent as GeneratedListingContent;
        const researchSnapshot = state.researchSnapshot as ResearchSnapshot | null;
        const pricing = state.pricing as { suggested: number };

        const { confidenceScore } = this.validateAndAssignStatus(
          extracted,
          state.attributes as ItemAttribute[],
          listingContent,
          researchSnapshot,
          input.autoApprovalSettings,
          pricing.suggested,
        );

        return {
          confidence: confidenceScore,
          done: true,
        };
      })
      .addNode('decide', async (state: AgentStateType) => {
        const nextLoop = state.loopCount + 1;
        if (state.done) {
          return { done: true };
        }

        if (nextLoop >= state.maxLoops) {
          return { done: true, loopCount: nextLoop };
        }

        const broadenedKeywords = this.buildFallbackKeywords(
          state.extracted as VisionExtractResult,
          state.userHint,
          state.searchKeywords,
        );

        return {
          loopCount: nextLoop,
          searchKeywords: broadenedKeywords,
        };
      })
      .addEdge(START, 'analyze_media')
      .addEdge('analyze_media', 'fetch_comps')
      .addEdge('fetch_comps', 'price')
      .addEdge('price', 'content')
      .addEdge('content', 'calculate_shipping')
      .addEdge('calculate_shipping', 'validate')
      .addConditionalEdges(
        'validate',
        (state: AgentStateType) => (state.done ? END : 'decide'),
        { decide: 'decide', [END]: END },
      )
      .addConditionalEdges(
        'decide',
        (state: AgentStateType) => (state.done ? END : 'fetch_comps'),
        { fetch_comps: 'fetch_comps', [END]: END },
      );

    const graph = builder.compile();

    const initialState: AgentStateType = {
      loopCount: 0,
      maxLoops: 3,
      photoUrls: input.photoUrls,
      userHint: input.userHint,
      autoApprovalSettings: input.autoApprovalSettings,
      searchKeywords: null,
      extracted: null,
      attributes: null,
      soldComps: [],
      activeComps: [],
      researchSnapshot: null,
      pricing: null,
      listingContent: null,
      shipping: null,
      confidence: null,
      done: false,
      aiError: null,
    };

    const result = await graph.invoke(initialState);

    if (!result.extracted || !result.pricing || !result.listingContent || !result.shipping) {
      throw new Error('Agent run did not complete required fields');
    }

    return {
      extracted: result.extracted as VisionExtractResult,
      attributes: (result.attributes as ItemAttribute[]) || [],
      soldComps: (result.soldComps as CompResult[]) || [],
      activeComps: (result.activeComps as CompResult[]) || [],
      researchSnapshot: (result.researchSnapshot as ResearchSnapshot | null) || null,
      pricing: result.pricing as {
        suggested: number;
        min: number;
        max: number;
        strategy: PricingStrategy;
      },
      listingContent: result.listingContent as GeneratedListingContent,
      shipping: result.shipping as {
        type: 'flat' | 'calculated' | 'free';
        flatRateAmount: number | null;
      },
      confidence: result.confidence ?? 0,
      aiError: result.aiError || null,
      loopCount: result.loopCount,
    };
  }

  private buildKeywords(extracted: VisionExtractResult, userHint: string | null): string {
    const parts: string[] = [];
    if (extracted.brand) parts.push(extracted.brand);
    if (extracted.model) parts.push(extracted.model);
    if (parts.length === 0 && userHint) parts.push(userHint);
    if (parts.length === 0 && extracted.category) parts.push(extracted.category);
    return parts.join(' ').trim();
  }

  private buildFallbackKeywords(
    extracted: VisionExtractResult,
    userHint: string | null,
    current: string | null,
  ): string {
    if (current && userHint && !current.includes(userHint)) {
      return `${current} ${userHint}`.trim();
    }
    if (extracted.description) {
      return `${current || ''} ${extracted.description}`.trim();
    }
    return current || userHint || extracted.category || 'resale item';
  }

  private buildAttributes(extracted: VisionExtractResult): ItemAttribute[] {
    const attrs: ItemAttribute[] = [];

    if (extracted.attributes.color) {
      attrs.push({
        key: 'Color',
        value: String(extracted.attributes.color),
        source: 'ai',
        confidence: 0.8,
      });
    }

    if (extracted.attributes.size) {
      attrs.push({
        key: 'Size',
        value: String(extracted.attributes.size),
        source: 'ai',
        confidence: 0.8,
      });
    }

    if (extracted.attributes.material) {
      attrs.push({
        key: 'Material',
        value: String(extracted.attributes.material),
        source: 'ai',
        confidence: 0.7,
      });
    }

    if (extracted.condition) {
      attrs.push({
        key: 'Condition',
        value: extracted.condition,
        source: 'ai',
        confidence: 0.85,
      });
    }

    if (extracted.brand) {
      attrs.push({
        key: 'Brand',
        value: extracted.brand,
        source: 'ai',
        confidence: 0.9,
      });
    }

    if (extracted.model) {
      attrs.push({
        key: 'Model',
        value: extracted.model,
        source: 'ai',
        confidence: 0.85,
      });
    }

    return attrs;
  }

  private calculateResearchSnapshot(
    soldComps: CompResult[],
    activeComps: CompResult[],
  ): ResearchSnapshot {
    const soldPrices = soldComps.map((c) => c.price).filter((p) => p > 0);
    const activePrices = activeComps.map((c) => c.price).filter((p) => p > 0);

    return {
      soldComps: soldComps.length,
      activeComps: activeComps.length,
      soldPrices:
        soldPrices.length > 0
          ? {
              min: Math.min(...soldPrices),
              max: Math.max(...soldPrices),
              avg: soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length,
              median: this.median(soldPrices),
            }
          : null,
      activePrices:
        activePrices.length > 0
          ? {
              min: Math.min(...activePrices),
              max: Math.max(...activePrices),
              avg: activePrices.reduce((a, b) => a + b, 0) / activePrices.length,
              median: this.median(activePrices),
            }
          : null,
      searchedAt: new Date().toISOString(),
    };
  }

  private calculatePricing(
    extracted: VisionExtractResult,
    researchSnapshot: ResearchSnapshot | null,
  ): { suggested: number; min: number; max: number; strategy: PricingStrategy } {
    let basePrice = 25;

    if (researchSnapshot?.soldPrices) {
      basePrice = researchSnapshot.soldPrices.median * 0.95;
      basePrice = Math.max(basePrice, researchSnapshot.soldPrices.min * 0.9);
    } else if (researchSnapshot?.activePrices) {
      basePrice = researchSnapshot.activePrices.median * 0.9;
      basePrice = Math.max(basePrice, researchSnapshot.activePrices.min * 0.85);
    } else {
      const categoryDefaults: Record<string, number> = {
        Electronics: 50,
        Clothing: 20,
        'Home & Garden': 30,
        Books: 10,
        Collectibles: 40,
        'Sports & Outdoors': 35,
        Other: 25,
      };
      basePrice = categoryDefaults[extracted.category] || 25;
    }

    const suggested = Math.round(basePrice * 100) / 100;
    const min = Math.round(suggested * 0.8 * 100) / 100;
    const max = Math.round(suggested * 1.2 * 100) / 100;

    return { suggested, min, max, strategy: 'balanced' };
  }

  private suggestShippingType(
    extracted: VisionExtractResult,
    price: number,
  ): 'flat' | 'calculated' | 'free' {
    if (price >= 75) {
      return 'free';
    }

    const lightCategories = ['Clothing', 'Books', 'Collectibles', 'Jewelry'];
    if (lightCategories.includes(extracted.category)) {
      return 'flat';
    }

    return 'calculated';
  }

  private estimateFlatRate(extracted: VisionExtractResult): number {
    const categoryRates: Record<string, number> = {
      Books: 4.99,
      Clothing: 6.99,
      Collectibles: 5.99,
      Jewelry: 4.99,
      Electronics: 9.99,
      'Home & Garden': 12.99,
    };

    return categoryRates[extracted.category] || 8.99;
  }

  private validateAndAssignStatus(
    extracted: VisionExtractResult,
    attributes: ItemAttribute[],
    listingContent: GeneratedListingContent,
    researchSnapshot: ResearchSnapshot | null,
    autoApprovalSettings: AutoApprovalSettings,
    suggestedPrice: number | null,
  ): {
    confidenceScore: number;
  } {
    let confidence = 1.0;

    // Reduce confidence for missing or poor quality fields
    if (!listingContent.title || listingContent.title.length < 10) {
      confidence -= 0.1;
    }

    if (!listingContent.description || listingContent.description.length < 50) {
      confidence -= 0.1;
    }

    if (!extracted.category) {
      confidence -= 0.15;
    }

    if (!researchSnapshot?.soldPrices && !researchSnapshot?.activePrices) {
      confidence -= 0.1;
    }

    if (attributes.length < 2) {
      confidence -= 0.05;
    }

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      confidenceScore: confidence,
    };
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
}
