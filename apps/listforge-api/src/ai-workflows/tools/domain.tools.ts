/**
 * Domain Knowledge Tools - Slice 1
 *
 * Tools for accessing domain-specific knowledge and AI reasoning:
 * - Decoding identifiers (date codes, style numbers, references)
 * - Checking authenticity markers
 * - Detecting value drivers
 * - Explaining pricing decisions
 * - Validating comparable listings
 *
 * These tools allow users to understand and interrogate the AI's reasoning.
 */

import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';

// ============================================================================
// Schemas
// ============================================================================

export const DecodeIdentifierSchema = z.object({
  identifierType: z
    .enum(['date_code', 'style_number', 'serial_number', 'model_number', 'upc', 'other'])
    .describe('Type of identifier to decode'),
  value: z
    .string()
    .min(1, 'Identifier value cannot be empty')
    .max(100, 'Identifier value too long')
    .describe('The identifier value to decode (e.g., "SD1234", "CW2288-111")'),
  brand: z
    .string()
    .max(100, 'Brand name too long')
    .optional()
    .describe('Brand hint to improve decoding accuracy (e.g., "Louis Vuitton", "Nike")'),
  category: z
    .string()
    .max(100, 'Category too long')
    .optional()
    .describe('Category hint (e.g., "luxury_handbags", "sneakers", "watches")'),
});

export const CheckAuthenticitySchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('The item ID to check authenticity for'),
});

export const GetValueDriversSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('The item ID to get value drivers for'),
});

export const ExplainPricingSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('The item ID to explain pricing for'),
});

export const ValidateCompSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('The item ID to compare against'),
  compId: z
    .string()
    .min(1, 'Comp ID cannot be empty')
    .describe('The comparable listing ID to validate'),
  compData: z
    .object({
      title: z.string().optional().describe('Comp listing title'),
      price: z.number().optional().describe('Comp listing price'),
      condition: z.string().optional().describe('Comp listing condition'),
      soldDate: z.string().optional().describe('Date the comp sold (ISO format)'),
      brand: z.string().optional().describe('Brand from comp listing'),
      model: z.string().optional().describe('Model from comp listing'),
    })
    .optional()
    .describe('Optional comp data if not stored in database'),
});

// ============================================================================
// Extended ChatToolDependencies Interface
// ============================================================================

/**
 * Additional dependencies for domain knowledge tools
 */
export interface DomainToolDependencies {
  decodeIdentifier: (params: {
    type: string;
    value: string;
    brand?: string;
    category?: string;
  }) => Promise<{
    success: boolean;
    identifierType?: string;
    decoded?: Record<string, unknown>;
    confidence?: number;
    details?: string;
  } | null>;

  checkAuthenticity: (
    itemId: string,
    orgId: string,
  ) => Promise<{
    assessment: 'likely_authentic' | 'likely_fake' | 'uncertain' | 'insufficient_data';
    confidence: number;
    markersChecked: Array<{
      name: string;
      passed: boolean;
      confidence: number;
      details?: string;
    }>;
    summary: string;
    warnings: string[];
  } | null>;

  getValueDrivers: (
    itemId: string,
    orgId: string,
  ) => Promise<
    Array<{
      driverId: string;
      name: string;
      matchedValue: string;
      priceMultiplier: number;
      confidence: number;
      reasoning: string;
    }>
  >;

  explainPricing: (
    itemId: string,
    orgId: string,
  ) => Promise<{
    hasResearch: boolean;
    priceBands?: Array<{
      label: string;
      amount: number;
      currency: string;
      confidence: number;
      reasoning: string;
    }>;
    compsUsed?: number;
    validComps?: number;
    outlierFiltering?: {
      removed: number;
      q1: number;
      q3: number;
    };
    valueDriversApplied?: Array<{
      name: string;
      multiplier: number;
    }>;
    marketConditions?: {
      sellThroughRate?: number;
      competition?: number;
      priceTrend?: string;
    };
    summary: string;
  } | null>;

  validateComp: (
    itemId: string,
    compId: string,
    orgId: string,
    compData?: {
      title?: string;
      price?: number;
      condition?: string;
      soldDate?: string;
      brand?: string;
      model?: string;
    },
  ) => Promise<{
    isValid: boolean;
    overallScore: number;
    criteria: {
      brandMatch: { matches: boolean; confidence: number; itemBrand?: string; compBrand?: string };
      modelMatch: { matches: boolean; confidence: number; itemModel?: string; compModel?: string };
      conditionMatch: { matches: boolean; withinGrade: number; itemCondition?: string; compCondition?: string };
      variantMatch: { matches: boolean; confidence: number; details?: string };
      recency: { valid: boolean; daysSinceSold?: number | null; threshold: number };
      priceOutlier: { isOutlier: boolean; zScore?: number };
    };
    reasoning: string;
  } | null>;
}

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Decode Identifier Tool
 *
 * Decodes product identifiers like date codes, style numbers, and serial numbers.
 * Uses domain knowledge to extract manufacturing info, origin, and authenticity indicators.
 */
export function decodeIdentifierTool(
  deps: ChatToolDependencies & Partial<DomainToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof DecodeIdentifierSchema>) => {
      try {
        if (!deps.decodeIdentifier) {
          return JSON.stringify({
            error: true,
            message: 'Identifier decoding not available. This feature requires domain expertise modules.',
          });
        }

        const result = await deps.decodeIdentifier({
          type: input.identifierType,
          value: input.value,
          brand: input.brand,
          category: input.category,
        });

        if (!result || !result.success) {
          return JSON.stringify({
            decoded: false,
            identifierType: input.identifierType,
            value: input.value,
            message: `Could not decode identifier "${input.value}". It may not match known patterns for ${input.brand || 'this brand'}.`,
            suggestion: input.brand
              ? 'Verify the identifier format is correct.'
              : 'Try providing a brand hint for better decoding accuracy.',
          });
        }

        return JSON.stringify(
          {
            decoded: true,
            identifierType: result.identifierType,
            value: input.value,
            interpretation: result.decoded,
            confidence: result.confidence
              ? `${Math.round(result.confidence * 100)}%`
              : undefined,
            details: result.details,
          },
          null,
          2,
        );
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

/**
 * Check Authenticity Tool
 *
 * Runs authenticity marker checks against an item's extracted data.
 * Uses brand-specific and category-specific authenticity indicators.
 */
export function checkAuthenticityTool(
  deps: ChatToolDependencies & Partial<DomainToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof CheckAuthenticitySchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.checkAuthenticity) {
          return JSON.stringify({
            error: true,
            message: 'Authenticity checking not available. This feature requires domain expertise modules.',
          });
        }

        const result = await deps.checkAuthenticity(input.itemId, ctx.organizationId);

        if (!result) {
          return JSON.stringify({
            hasResult: false,
            message: 'Could not perform authenticity check. Item may not have sufficient data extracted.',
            suggestion: 'Ensure item has photos and identifiers extracted before checking authenticity.',
          });
        }

        // Format markers for display
        const formattedMarkers = result.markersChecked.map((m) => ({
          marker: m.name,
          status: m.passed ? 'PASS' : 'FAIL',
          confidence: `${Math.round(m.confidence * 100)}%`,
          details: m.details,
        }));

        return JSON.stringify(
          {
            hasResult: true,
            itemId: input.itemId,
            assessment: result.assessment,
            assessmentLabel: formatAssessment(result.assessment),
            confidence: `${Math.round(result.confidence * 100)}%`,
            summary: result.summary,
            markersChecked: formattedMarkers,
            warnings: result.warnings.length > 0 ? result.warnings : undefined,
            disclaimer:
              'This is an AI-assisted assessment based on extracted data. It is not a guarantee of authenticity. Professional authentication is recommended for high-value items.',
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to check authenticity: ${message}`,
        });
      }
    },
    {
      name: 'check_authenticity',
      description: `Run authenticity marker checks for an item.

Checks brand-specific and category-specific authenticity indicators:
- Date code format validation
- Serial number patterns
- Logo and hardware markers
- Material and construction indicators

Returns:
- Overall assessment (likely_authentic, likely_fake, uncertain, insufficient_data)
- Confidence score
- Individual marker results with pass/fail status
- Warnings for critical marker failures

Use this when users ask "is this real?" or "does this look authentic?"

Note: This is AI-assisted and not a replacement for professional authentication.`,
      schema: CheckAuthenticitySchema,
    },
  );
}

/**
 * Get Value Drivers Tool
 *
 * Returns the value drivers that affect an item's price.
 * Value drivers are attributes that increase price (rare colors, limited editions, etc.)
 */
export function getValueDriversTool(
  deps: ChatToolDependencies & Partial<DomainToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetValueDriversSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.getValueDrivers) {
          return JSON.stringify({
            error: true,
            message: 'Value driver detection not available. This feature requires domain expertise modules.',
          });
        }

        const drivers = await deps.getValueDrivers(input.itemId, ctx.organizationId);

        if (!drivers || drivers.length === 0) {
          return JSON.stringify({
            hasDrivers: false,
            itemId: input.itemId,
            message: 'No specific value drivers detected for this item.',
            explanation:
              'Value drivers are special attributes that can increase price (rare colors, limited editions, collaborations, etc.). This item may have standard attributes.',
          });
        }

        // Calculate combined multiplier
        let combinedMultiplier = 1.0;
        for (let i = 0; i < drivers.length; i++) {
          const driver = drivers[i];
          if (i === 0) {
            combinedMultiplier *= driver.priceMultiplier;
          } else {
            // Diminishing returns for additional drivers
            combinedMultiplier *= 1 + (Math.sqrt(driver.priceMultiplier) - 1) * 0.7;
          }
        }
        combinedMultiplier = Math.min(combinedMultiplier, 15.0); // Cap at 15x

        const formattedDrivers = drivers.map((d) => ({
          name: d.name,
          matchedValue: d.matchedValue,
          priceMultiplier: `${d.priceMultiplier.toFixed(2)}x`,
          confidence: `${Math.round(d.confidence * 100)}%`,
          reasoning: d.reasoning,
        }));

        return JSON.stringify(
          {
            hasDrivers: true,
            itemId: input.itemId,
            driversFound: drivers.length,
            valueDrivers: formattedDrivers,
            combinedEffect: {
              multiplier: `${combinedMultiplier.toFixed(2)}x`,
              explanation:
                drivers.length > 1
                  ? 'Multiple value drivers compound with diminishing returns.'
                  : 'Single value driver applied.',
            },
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get value drivers: ${message}`,
        });
      }
    },
    {
      name: 'get_value_drivers',
      description: `Get the value drivers that affect an item's price.

Value drivers are special attributes that can significantly increase an item's value:
- Rare colors/colorways (e.g., "Travis Scott" colorway for sneakers)
- Limited editions (e.g., anniversary editions)
- Collaborations (e.g., designer collaborations)
- Vintage status (e.g., Big E Levi's)
- Special materials (e.g., exotic leathers for luxury goods)

Returns:
- List of matched value drivers
- Price multiplier for each driver (e.g., 1.5x, 2.0x)
- Combined multiplier effect
- Reasoning for each match

Use this when users ask "why is this valuable?" or "what makes this special?"`,
      schema: GetValueDriversSchema,
    },
  );
}

/**
 * Explain Pricing Tool
 *
 * Provides a detailed explanation of how price bands were calculated.
 * Shows the comparable sales, filtering, and adjustments used.
 */
export function explainPricingTool(
  deps: ChatToolDependencies & Partial<DomainToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof ExplainPricingSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.explainPricing) {
          // Fallback: try to explain from research data if available
          const research = await deps.getLatestResearch(input.itemId, ctx.organizationId);
          if (!research) {
            return JSON.stringify({
              hasExplanation: false,
              message: 'No research data available for this item.',
              suggestion: 'Use trigger_research to get pricing data first.',
            });
          }

          // Build explanation from research data
          const data = research.data;
          return JSON.stringify(
            {
              hasExplanation: true,
              itemId: input.itemId,
              priceBands: data.priceBands?.map((b: any) => ({
                label: b.label,
                amount: `$${b.amount.toFixed(2)}`,
                confidence: `${Math.round(b.confidence * 100)}%`,
                reasoning: b.reasoning,
              })),
              basedOn: {
                compsAnalyzed: data.competitorCount || 'Unknown',
              },
              demandSignals: data.demandSignals?.map((s: any) => ({
                metric: s.metric,
                value: s.value,
                unit: s.unit,
                direction: s.direction,
              })),
              summary: 'Pricing based on comparable sales analysis.',
            },
            null,
            2,
          );
        }

        const result = await deps.explainPricing(input.itemId, ctx.organizationId);

        if (!result || !result.hasResearch) {
          return JSON.stringify({
            hasExplanation: false,
            message: 'No research data available for pricing explanation.',
            suggestion: 'Use trigger_research to get pricing data first.',
          });
        }

        // Format the explanation
        const explanation: Record<string, unknown> = {
          hasExplanation: true,
          itemId: input.itemId,
        };

        if (result.priceBands) {
          explanation.priceBands = result.priceBands.map((b) => ({
            label: b.label,
            amount: `$${b.amount.toFixed(2)}`,
            confidence: `${Math.round(b.confidence * 100)}%`,
            reasoning: b.reasoning,
          }));
        }

        explanation.methodology = {
          compsAnalyzed: result.compsUsed,
          validComps: result.validComps,
          outlierFiltering: result.outlierFiltering
            ? {
                removed: result.outlierFiltering.removed,
                priceRange: `$${result.outlierFiltering.q1.toFixed(2)} - $${result.outlierFiltering.q3.toFixed(2)} (IQR)`,
              }
            : undefined,
        };

        if (result.valueDriversApplied && result.valueDriversApplied.length > 0) {
          explanation.valueDriversApplied = result.valueDriversApplied.map((v) => ({
            name: v.name,
            effect: `${v.multiplier.toFixed(2)}x`,
          }));
        }

        if (result.marketConditions) {
          explanation.marketConditions = {
            sellThroughRate: result.marketConditions.sellThroughRate
              ? `${Math.round(result.marketConditions.sellThroughRate * 100)}%`
              : undefined,
            activeCompetition: result.marketConditions.competition,
            priceTrend: result.marketConditions.priceTrend,
          };
        }

        explanation.summary = result.summary;

        return JSON.stringify(explanation, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to explain pricing: ${message}`,
        });
      }
    },
    {
      name: 'explain_pricing',
      description: `Explain how price bands were calculated for an item.

Returns detailed breakdown of pricing methodology:
- Price bands (floor, target, ceiling) with reasoning
- Number of comparable sales analyzed
- Outlier filtering applied (IQR method)
- Value drivers that affected pricing
- Market conditions (sell-through rate, competition, trends)

Use this when users ask "why did you recommend $X?" or "how was this price calculated?"`,
      schema: ExplainPricingSchema,
    },
  );
}

/**
 * Validate Comp Tool
 *
 * Validates whether a comparable listing is truly comparable to the item.
 * Uses structured criteria including brand, model, condition, recency, and price outlier detection.
 */
export function validateCompTool(
  deps: ChatToolDependencies & Partial<DomainToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof ValidateCompSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.validateComp) {
          return JSON.stringify({
            error: true,
            message: 'Comp validation not available. This feature requires research data.',
          });
        }

        const result = await deps.validateComp(
          input.itemId,
          input.compId,
          ctx.organizationId,
          input.compData,
        );

        if (!result) {
          return JSON.stringify({
            hasValidation: false,
            message: 'Could not validate comparable. Item or comp data may be missing.',
          });
        }

        // Format criteria for display
        const formattedCriteria = {
          brand: {
            status: result.criteria.brandMatch.matches ? 'MATCH' : 'MISMATCH',
            confidence: `${Math.round(result.criteria.brandMatch.confidence * 100)}%`,
            details:
              result.criteria.brandMatch.itemBrand && result.criteria.brandMatch.compBrand
                ? `"${result.criteria.brandMatch.itemBrand}" vs "${result.criteria.brandMatch.compBrand}"`
                : undefined,
          },
          model: {
            status: result.criteria.modelMatch.matches ? 'MATCH' : 'MISMATCH',
            confidence: `${Math.round(result.criteria.modelMatch.confidence * 100)}%`,
            details:
              result.criteria.modelMatch.itemModel && result.criteria.modelMatch.compModel
                ? `"${result.criteria.modelMatch.itemModel}" vs "${result.criteria.modelMatch.compModel}"`
                : undefined,
          },
          condition: {
            status: result.criteria.conditionMatch.matches ? 'MATCH' : 'MISMATCH',
            gradeDistance: result.criteria.conditionMatch.withinGrade,
            details:
              result.criteria.conditionMatch.itemCondition &&
              result.criteria.conditionMatch.compCondition
                ? `"${result.criteria.conditionMatch.itemCondition}" vs "${result.criteria.conditionMatch.compCondition}"`
                : undefined,
          },
          variant: {
            status: result.criteria.variantMatch.matches ? 'MATCH' : 'MISMATCH',
            confidence: `${Math.round(result.criteria.variantMatch.confidence * 100)}%`,
            details: result.criteria.variantMatch.details,
          },
          recency: {
            status: result.criteria.recency.valid ? 'VALID' : 'TOO_OLD',
            daysSinceSold: result.criteria.recency.daysSinceSold,
            threshold: `${result.criteria.recency.threshold} days`,
          },
          priceOutlier: {
            status: result.criteria.priceOutlier.isOutlier ? 'OUTLIER' : 'NORMAL',
            zScore: result.criteria.priceOutlier.zScore?.toFixed(2),
          },
        };

        return JSON.stringify(
          {
            hasValidation: true,
            itemId: input.itemId,
            compId: input.compId,
            isValid: result.isValid,
            overallScore: `${Math.round(result.overallScore * 100)}%`,
            verdict: result.isValid
              ? 'This comparable is valid for pricing analysis.'
              : 'This comparable may not be suitable for pricing this item.',
            criteria: formattedCriteria,
            reasoning: result.reasoning,
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to validate comp: ${message}`,
        });
      }
    },
    {
      name: 'validate_comp',
      description: `Validate whether a comparable listing is truly comparable to an item.

Checks multiple criteria:
- Brand match: Does the brand match (with fuzzy matching)?
- Model match: Does the model/style match?
- Condition match: Are conditions within 2 grades?
- Variant match: Do colors, sizes, editions match?
- Recency: Was it sold within the last 90 days?
- Price outlier: Is the price unusually high/low (z-score)?

Returns:
- Overall validity (true/false)
- Score (0-100%)
- Individual criteria results
- Human-readable reasoning

Use this when users ask "is this a good comp?" or "why is this comp included/excluded?"`,
      schema: ValidateCompSchema,
    },
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format assessment label for display
 */
function formatAssessment(
  assessment: 'likely_authentic' | 'likely_fake' | 'uncertain' | 'insufficient_data',
): string {
  const labels: Record<typeof assessment, string> = {
    likely_authentic: 'Likely Authentic',
    likely_fake: 'Likely Fake',
    uncertain: 'Uncertain - Manual Review Recommended',
    insufficient_data: 'Insufficient Data',
  };
  return labels[assessment];
}
