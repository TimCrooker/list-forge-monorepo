import { Injectable, Logger } from '@nestjs/common';
import { ItemMedia } from '@listforge/core-types';
import { QuickEvalResult } from '../dto/quick-eval.dto';
import { OpenAIService } from '../../ai-workflows/services/openai.service';
import { WebSearchService } from '../../ai-workflows/services/web-search.service';
import { UPCLookupService } from '../../ai-workflows/services/upc-lookup.service';

/**
 * Quick Eval Service
 *
 * Provides fast product evaluation for mobile quick capture.
 * Target response time: 5-15 seconds
 *
 * Simplified workflow:
 * 1. Extract identifiers from photos/hints
 * 2. Quick product identification
 * 3. Fast comp search (limited results)
 * 4. Basic pricing analysis
 * 5. Return quick results
 */
@Injectable()
export class QuickEvalService {
  private readonly logger = new Logger(QuickEvalService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly webSearchService: WebSearchService,
    private readonly upcLookupService: UPCLookupService,
  ) {}

  async evaluateItem(
    media: ItemMedia[],
    title?: string,
    description?: string,
    barcode?: string,
  ): Promise<QuickEvalResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      this.logger.log('Starting quick evaluation');

      // Step 1: Try barcode lookup first (fastest)
      let productInfo: any = null;
      if (barcode) {
        const upcResult = await this.upcLookupService.lookup(barcode);
        if (upcResult.found) {
          productInfo = {
            title: upcResult.title,
            brand: upcResult.brand,
            category: upcResult.category,
            confidence: 0.9,
          };
        }
      }

      // Step 2: If no barcode or not found, use AI identification
      if (!productInfo && media.length > 0) {
        productInfo = await this.quickIdentify(media[0].url, title, description);
      }

      if (!productInfo) {
        warnings.push('Could not identify product');
        return {
          success: false,
          processingTimeMs: Date.now() - startTime,
          warnings,
        };
      }

      // Step 3: Quick comp search (parallel with pricing)
      const [compResults, pricingAnalysis] = await Promise.all([
        this.quickCompSearch(productInfo.title, productInfo.brand),
        this.quickPricing(productInfo.title, productInfo.brand),
      ]);

      // Step 4: Assess demand
      const demand = this.assessDemand(compResults);

      const processingTimeMs = Date.now() - startTime;
      this.logger.log(`Quick eval completed in ${processingTimeMs}ms`);

      return {
        success: true,
        identifiedAs: productInfo,
        pricing: pricingAnalysis,
        demand,
        comparables: {
          count: compResults.length,
          averagePrice: this.calculateAveragePrice(compResults),
          recentSales: compResults.filter(c => c.isSold).length,
        },
        processingTimeMs,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.logger.error('Quick eval error:', error);
      return {
        success: false,
        processingTimeMs: Date.now() - startTime,
        warnings: ['Evaluation failed: ' + error.message],
      };
    }
  }

  /**
   * Quick product identification using vision + text
   */
  private async quickIdentify(
    imageUrl: string,
    title?: string,
    description?: string,
  ): Promise<any> {
    const prompt = `Identify this product quickly. ${title ? `User hint: ${title}` : ''} ${description ? `Description: ${description}` : ''}

Return JSON with:
{
  "title": "Product name",
  "brand": "Brand name",
  "category": "Category",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.openaiService.createChatCompletion({
        model: 'gpt-4o-mini', // Use faster model for quick eval
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      this.logger.error('Quick identify error:', error);
      return null;
    }
  }

  /**
   * Quick comp search - limit to 5 results for speed
   */
  private async quickCompSearch(title: string, brand?: string): Promise<any[]> {
    const searchQuery = brand ? `${brand} ${title}` : title;

    try {
      // Use web search to find recent sold listings (simplified)
      const results = await this.webSearchService.search(
        `${searchQuery} sold ebay`,
        { maxResults: 5 },
      );

      return results.map(r => ({
        title: r.title,
        price: this.extractPrice(r.snippet),
        url: r.url,
        isSold: true,
      }));
    } catch (error) {
      this.logger.error('Quick comp search error:', error);
      return [];
    }
  }

  /**
   * Quick pricing analysis
   */
  private async quickPricing(title: string, brand?: string): Promise<any> {
    const searchQuery = brand ? `${brand} ${title} price` : `${title} price`;

    try {
      const results = await this.webSearchService.search(searchQuery, {
        maxResults: 3,
      });

      const prices = results
        .map(r => this.extractPrice(r.snippet))
        .filter(p => p > 0);

      if (prices.length === 0) {
        return {
          suggestedPrice: 0,
          priceRangeLow: 0,
          priceRangeHigh: 0,
          currency: 'USD',
          confidence: 0,
        };
      }

      prices.sort((a, b) => a - b);
      const low = prices[0];
      const high = prices[prices.length - 1];
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      return {
        suggestedPrice: Math.round(avg * 100) / 100,
        priceRangeLow: Math.round(low * 100) / 100,
        priceRangeHigh: Math.round(high * 100) / 100,
        currency: 'USD',
        confidence: prices.length >= 3 ? 0.7 : 0.5,
      };
    } catch (error) {
      this.logger.error('Quick pricing error:', error);
      return null;
    }
  }

  /**
   * Assess demand level based on comp results
   */
  private assessDemand(compResults: any[]): any {
    const soldCount = compResults.filter(c => c.isSold).length;
    const totalCount = compResults.length;

    let level: 'low' | 'medium' | 'high' = 'low';
    const indicators: string[] = [];

    if (soldCount >= 4) {
      level = 'high';
      indicators.push(`${soldCount} recent sales found`);
    } else if (soldCount >= 2) {
      level = 'medium';
      indicators.push(`${soldCount} recent sales`);
    } else {
      level = 'low';
      indicators.push('Limited recent sales data');
    }

    return { level, indicators };
  }

  /**
   * Extract price from text (simple regex)
   */
  private extractPrice(text: string): number {
    const priceMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(',', ''));
    }
    return 0;
  }

  /**
   * Calculate average price from comp results
   */
  private calculateAveragePrice(compResults: any[]): number {
    const prices = compResults.map(c => c.price).filter(p => p > 0);
    if (prices.length === 0) return 0;

    const sum = prices.reduce((a, b) => a + b, 0);
    return Math.round((sum / prices.length) * 100) / 100;
  }
}
