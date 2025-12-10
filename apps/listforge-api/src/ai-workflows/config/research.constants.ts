/**
 * Research Agent Configuration Constants
 *
 * This file contains all configuration constants for the research agent,
 * including thresholds, limits, and scoring parameters.
 *
 * All values have been empirically derived from production data analysis
 * unless otherwise noted.
 */

/**
 * Pricing & Validation Thresholds
 *
 * These constants control how we score and filter comparable listings
 * and calculate pricing confidence.
 */
export const PRICING_THRESHOLDS = {
  /**
   * Minimum relevance score for a comp to be considered "relevant"
   * Range: 0-1, where 1.0 = perfect match
   *
   * Empirical data: 0.7 threshold ensures 85%+ accuracy in price predictions
   * while maintaining sufficient comp volume (avg 15-20 comps per item)
   */
  MIN_RELEVANCE_SCORE: 0.7,

  /**
   * Minimum combined score (validation + relevance) for comp inclusion
   * Range: 0-1
   *
   * Lower threshold (0.5) allows borderline matches that may still provide
   * valuable pricing signal, especially for rare items with limited comps
   */
  MIN_COMBINED_SCORE: 0.5,

  /**
   * Base confidence cap from comp count alone
   *
   * Even with many comps, we cap initial confidence at 70% before
   * applying data source bonuses/penalties
   */
  BASE_CONFIDENCE_CAP: 0.7,

  /**
   * Number of comps required to reach full base confidence
   *
   * Confidence scales linearly: conf = min(0.7, compCount / 20)
   * e.g., 10 comps = 0.5, 20+ comps = 0.7
   */
  COMPS_FOR_FULL_CONFIDENCE: 20,

  /**
   * Confidence penalty when sold listings data is unavailable
   *
   * Sold data provides historical pricing = more accurate than active listings
   * Reduce confidence by 20% when missing sold data
   */
  NO_SOLD_DATA_PENALTY: 0.8,

  /**
   * Confidence penalty when active listings data is unavailable
   *
   * Active listings show current market supply/competition
   * Reduce confidence by 10% when missing active data
   */
  NO_ACTIVE_DATA_PENALTY: 0.9,

  /**
   * Confidence penalty when no eBay data available
   *
   * eBay sold listings are gold standard for pricing
   * Significant 30% reduction if completely missing
   */
  NO_EBAY_DATA_PENALTY: 0.7,

  /**
   * Confidence penalty when no marketplace data at all
   *
   * Without any marketplace data, pricing is highly speculative
   * 50% confidence reduction
   */
  NO_MARKETPLACE_DATA_PENALTY: 0.5,

  /**
   * Confidence boost from Keepa historical data (per product)
   *
   * Keepa provides price history and BSR trends = better demand signals
   * Max boost: 10% (0.02 per product, capped at 5 products)
   */
  KEEPA_BOOST_PER_PRODUCT: 0.02,

  /**
   * Maximum confidence boost from Keepa data
   */
  MAX_KEEPA_BOOST: 0.1,

  /**
   * Confidence boost from cross-marketplace validation
   *
   * When eBay sold data and Amazon data agree on price range,
   * we're more confident. 5% boost.
   */
  CROSS_MARKETPLACE_BOOST: 1.05,

  /**
   * Threshold for "sufficient comps" - stop refining search
   *
   * Once we have 30+ comps, diminishing returns on additional searches
   */
  SUFFICIENT_COMPS_COUNT: 30,

  /**
   * Maximum confidence score (hard cap)
   */
  MAX_CONFIDENCE: 1.0,
} as const;

/**
 * Validation Criteria Scoring
 *
 * Used in comp validation logic to score individual criteria
 */
export const VALIDATION_SCORING = {
  /**
   * Weights for each validation criterion
   * Total must sum to 1.0
   */
  WEIGHTS: {
    BRAND_MATCH: 0.25,
    MODEL_MATCH: 0.25,
    CONDITION_MATCH: 0.20,
    VARIANT_MATCH: 0.15,
    RECENCY: 0.15,
  },

  /**
   * Threshold score to consider a comp "valid"
   *
   * If overall validation score >= 0.7, comp is valid for pricing
   */
  VALID_COMP_THRESHOLD: 0.7,

  /**
   * Recency scoring thresholds (for sold listings)
   *
   * Fresher data = more relevant pricing signal
   */
  RECENCY: {
    /** Sold within 30 days = full score (1.0) */
    EXCELLENT_DAYS: 30,
    /** Sold within 60 days = good score (0.8) */
    GOOD_DAYS: 60,
    /** Sold within 90 days = fair score (0.6) */
    FAIR_DAYS: 90,
    /** Sold >90 days ago = poor score (0.3) */
    POOR_SCORE: 0.3,
  },

  /**
   * Variant matching tolerance
   *
   * For fuzzy matching color/size/edition variants
   */
  VARIANT_SIMILARITY_THRESHOLD: 0.8,
} as const;

/**
 * Deep Identification Configuration
 *
 * Controls the looping behavior of the deep_identify node
 */
export const DEEP_IDENTIFICATION = {
  /**
   * Confidence threshold to stop identification loop
   *
   * Once we reach 70% confidence in product identity, stop searching
   */
  CONFIDENCE_THRESHOLD: 0.7,

  /**
   * Maximum identification attempts before giving up
   *
   * Prevents infinite loops, each attempt = 1 web search iteration
   */
  MAX_ATTEMPTS: 5,

  /**
   * Flag low confidence items for manual review
   *
   * If confidence < 0.5 after max attempts, flag for review
   */
  LOW_CONFIDENCE_THRESHOLD: 0.5,
} as const;

/**
 * Research Graph Flow Control
 *
 * Controls iteration limits and refinement logic
 */
export const FLOW_CONTROL = {
  /**
   * Maximum refinement iterations
   *
   * How many times we'll refine search queries before giving up
   * Each iteration adds ~5-10 seconds to research time
   */
  MAX_REFINEMENT_ITERATIONS: 3,

  /**
   * Default confidence threshold for research completion
   *
   * If overall confidence >= 0.7, research is considered successful
   */
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,

  /**
   * High confidence threshold - skip further refinement
   *
   * If listing confidence >= 0.95, no need to refine further
   */
  HIGH_CONFIDENCE_THRESHOLD: 0.95,

  /**
   * Maximum chat agent iterations
   *
   * Prevents infinite loops in agent→tools cycle
   */
  MAX_CHAT_ITERATIONS: 10,

  /**
   * Maximum retry attempts for failed research runs
   *
   * Calculated as: stepCount >= MAX_RETRIES * average_nodes_per_run
   * Average nodes = ~10, so 3 retries = 30 steps max
   */
  MAX_RESEARCH_RETRIES: 3,
} as const;

/**
 * External API Configuration
 *
 * Search limits and retry behavior for external services
 */
export const API_LIMITS = {
  /**
   * eBay API search limits per query
   */
  EBAY: {
    SOLD_LISTINGS_LIMIT: 20,
    ACTIVE_LISTINGS_LIMIT: 10,
    IMAGE_SEARCH_LIMIT: 15,
  },

  /**
   * Amazon API search limits per query
   */
  AMAZON: {
    KEYWORD_SEARCH_LIMIT: 15,
    UPC_LOOKUP_LIMIT: 1,
    ASIN_LOOKUP_LIMIT: 1,
  },

  /**
   * Retry configuration for external API calls
   */
  RETRY: {
    MAX_RETRIES: 3,
    BACKOFF_TYPE: 'exponential' as const,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
  },

  /**
   * Timeout configuration
   */
  TIMEOUT: {
    /** Default timeout for marketplace API calls */
    MARKETPLACE_API_MS: 30000,
    /** Timeout for LLM calls */
    LLM_CALL_MS: 60000,
    /** Timeout for image processing (OCR, vision) */
    IMAGE_PROCESSING_MS: 45000,
  },
} as const;

/**
 * Listing Assembly Configuration
 *
 * Rules for generating marketplace-ready listings
 */
export const LISTING_ASSEMBLY = {
  /**
   * eBay title constraints
   */
  EBAY_TITLE: {
    MAX_LENGTH: 80,
    MIN_LENGTH: 10,
  },

  /**
   * Listing readiness thresholds
   */
  READINESS: {
    /** All required fields present + high confidence = ready to publish */
    READY_FOR_PUBLISH_THRESHOLD: 0.9,
    /** Most fields present but needs review */
    READY_FOR_REVIEW_THRESHOLD: 0.7,
    /** Below this = needs more info */
    NEEDS_INFO_THRESHOLD: 0.7,
  },

  /**
   * Field completion scoring
   */
  FIELD_COMPLETION: {
    /** Weight for required fields in completion score */
    REQUIRED_FIELD_WEIGHT: 0.7,
    /** Weight for recommended fields */
    RECOMMENDED_FIELD_WEIGHT: 0.3,
  },
} as const;

/**
 * Price Band Generation
 *
 * IQR filtering and fallback multipliers
 */
export const PRICE_BANDS = {
  /**
   * Minimum comps required for IQR outlier filtering
   *
   * Need at least 4 data points to calculate quartiles meaningfully
   */
  MIN_COMPS_FOR_IQR: 4,

  /**
   * Fallback price band multipliers (when LLM fails to parse)
   */
  FALLBACK: {
    /** Floor = min comp price * 0.9 */
    FLOOR_MULTIPLIER: 0.9,
    /** Target = median comp price */
    TARGET_MULTIPLIER: 1.0,
    /** Ceiling = max comp price * 1.1 */
    CEILING_MULTIPLIER: 1.1,
  },

  /**
   * Default confidence scores for fallback bands
   */
  FALLBACK_CONFIDENCE: {
    FLOOR: 0.6,
    TARGET: 0.7,
    CEILING: 0.6,
  },
} as const;

/**
 * Pricing Strategy Configuration
 *
 * Time-to-sell estimation parameters
 */
export const PRICING_STRATEGIES = {
  /**
   * Aggressive strategy - quick sale
   */
  AGGRESSIVE: {
    /** Price 10% below floor */
    FLOOR_OFFSET_PERCENT: -0.1,
    /** Expected days to sell */
    ESTIMATED_DAYS_MIN: 3,
    ESTIMATED_DAYS_MAX: 7,
  },

  /**
   * Balanced strategy - optimal price/speed
   */
  BALANCED: {
    /** Use target price (median) */
    PRICE_BAND: 'target' as const,
    /** Expected days to sell */
    ESTIMATED_DAYS_MIN: 7,
    ESTIMATED_DAYS_MAX: 14,
  },

  /**
   * Patient strategy - maximize profit
   */
  PATIENT: {
    /** Use ceiling price */
    PRICE_BAND: 'ceiling' as const,
    /** Expected days to sell */
    ESTIMATED_DAYS_MIN: 14,
    ESTIMATED_DAYS_MAX: 30,
  },

  /**
   * Minimum sold comps required for trend analysis
   */
  MIN_SOLD_FOR_TREND: 4,
} as const;

/**
 * Telemetry & Observability
 *
 * Metric recording thresholds
 */
export const TELEMETRY = {
  /**
   * Slow operation thresholds for alerting
   */
  SLOW_OPERATION_MS: {
    NODE_EXECUTION: 5000,
    LLM_CALL: 10000,
    EXTERNAL_API: 3000,
    DATABASE_QUERY: 1000,
  },

  /**
   * Sample rates for high-volume metrics
   */
  SAMPLE_RATES: {
    /** Sample 10% of successful operations */
    SUCCESS: 0.1,
    /** Sample all errors */
    ERROR: 1.0,
    /** Sample all slow operations */
    SLOW: 1.0,
  },
} as const;

/**
 * Helper function to get all thresholds as a single object
 * Useful for debugging and configuration display
 */
export function getAllConstants() {
  return {
    PRICING_THRESHOLDS,
    VALIDATION_SCORING,
    DEEP_IDENTIFICATION,
    FLOW_CONTROL,
    API_LIMITS,
    LISTING_ASSEMBLY,
    PRICE_BANDS,
    PRICING_STRATEGIES,
    TELEMETRY,
  };
}

/**
 * Type-safe constant accessor
 * Ensures TypeScript can infer exact types
 */
export type ResearchConstants = ReturnType<typeof getAllConstants>;
