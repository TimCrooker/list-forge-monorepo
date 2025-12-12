/**
 * Identifier Classifier
 * Slice 4: OCR-to-Search Pipeline
 *
 * Classifies OCR-extracted text chunks to determine if they're likely
 * product identifiers (model numbers, SKUs, etc.) vs descriptive text or noise.
 */

import type { TextChunk, TextChunkRegion } from '@listforge/core-types';

/**
 * Pattern definitions for product identifiers
 * Each pattern has a name for tracking which one matched
 */
export const IDENTIFIER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // Model numbers like AB-12345, ABC1234
  { name: 'alpha_prefix', pattern: /^[A-Z]{2,4}[-]?\d{3,}$/i },

  // Model numbers like 12345-AB, 1234AB
  { name: 'numeric_prefix', pattern: /^\d{3,}[-]?[A-Z]{2,4}$/i },

  // Date codes like A12B34 (Louis Vuitton style)
  { name: 'date_code', pattern: /^[A-Z]\d{2,}[A-Z]\d{2,}$/i },

  // Model numbers like WL574EGG, SM-G991B, WH-1000XM4
  { name: 'mixed_model', pattern: /^[A-Z]{2,}\d+[A-Z]*\d*$/i },

  // Hyphenated model numbers like SM-G991B, WH-1000XM4
  { name: 'hyphenated_model', pattern: /^[A-Z]{1,3}[-][A-Z0-9]{3,}$/i },

  // UPC/EAN barcodes (12-14 digits)
  { name: 'upc_ean', pattern: /^\d{12,14}$/ },

  // Part numbers like 123-456-789
  { name: 'part_number', pattern: /^\d{3}[-]\d{3}[-]\d{3}$/ },

  // SKU patterns like SKU12345, SKU-ABC123
  { name: 'sku', pattern: /^SKU[-:]?[A-Z0-9]+$/i },

  // Style numbers (common in fashion) like 574, 990v5
  { name: 'style_number', pattern: /^\d{3,4}v?\d*$/i },

  // Apple-style model numbers like A1234, A2141
  { name: 'apple_model', pattern: /^A\d{4}$/i },

  // ASIN format (Amazon)
  { name: 'asin', pattern: /^B0[A-Z0-9]{8}$/i },
];

/**
 * Minimum text length to be considered an identifier
 */
const MIN_IDENTIFIER_LENGTH = 3;

/**
 * Maximum text length to be considered an identifier (most model numbers are short)
 */
const MAX_IDENTIFIER_LENGTH = 30;

/**
 * Common noise words that should never be classified as identifiers
 */
const NOISE_WORDS = new Set([
  'the', 'and', 'for', 'with', 'new', 'used', 'like',
  'size', 'color', 'made', 'in', 'usa', 'china',
  'authentic', 'genuine', 'original', 'vintage',
  'small', 'medium', 'large', 'xlarge',
  'black', 'white', 'blue', 'red', 'green', 'brown', 'gray', 'grey',
  'cotton', 'leather', 'polyester', 'nylon', 'wool',
]);

/**
 * Check if text looks like a product identifier
 *
 * @param text - The text to classify
 * @returns Object with isIdentifier flag and matched pattern name
 */
export function isLikelyIdentifier(text: string): { isIdentifier: boolean; pattern?: string } {
  // Normalize
  const normalized = text.trim().toUpperCase();

  // Length checks
  if (normalized.length < MIN_IDENTIFIER_LENGTH || normalized.length > MAX_IDENTIFIER_LENGTH) {
    return { isIdentifier: false };
  }

  // Noise word check
  if (NOISE_WORDS.has(normalized.toLowerCase())) {
    return { isIdentifier: false };
  }

  // Skip pure words (no numbers) - most identifiers have numbers
  if (!/\d/.test(normalized) && !/^[A-Z]{2,4}[-][A-Z]{2,}$/.test(normalized)) {
    return { isIdentifier: false };
  }

  // Check against identifier patterns
  for (const { name, pattern } of IDENTIFIER_PATTERNS) {
    if (pattern.test(normalized)) {
      return { isIdentifier: true, pattern: name };
    }
  }

  // Fallback: Check for alphanumeric with at least one letter and one number
  // This catches model numbers that don't match specific patterns
  if (/^[A-Z0-9]+$/.test(normalized) && /[A-Z]/.test(normalized) && /\d/.test(normalized)) {
    // Additional heuristic: should be "code-like" (not too long, no spaces)
    if (normalized.length >= 4 && normalized.length <= 15) {
      return { isIdentifier: true, pattern: 'generic_alphanumeric' };
    }
  }

  return { isIdentifier: false };
}

/**
 * Infer the region of text based on content patterns
 * This is a heuristic when the AI doesn't specify the region
 */
export function inferTextRegion(text: string): TextChunkRegion {
  const lower = text.toLowerCase();

  // Label indicators
  if (lower.includes('size:') || lower.includes('made in') || lower.includes('fabric:')) {
    return 'label';
  }

  // Tag indicators (often have care instructions)
  if (lower.includes('wash') || lower.includes('dry clean') || lower.includes('do not')) {
    return 'tag';
  }

  // Packaging indicators
  if (lower.includes('upc') || lower.includes('sku') || lower.includes('item #')) {
    return 'packaging';
  }

  return 'unknown';
}

/**
 * Classify an array of raw text strings into TextChunks
 *
 * @param rawText - Array of text strings from OCR
 * @param baseConfidence - Base confidence from OCR extraction (0-1)
 * @returns Array of classified TextChunks
 */
export function classifyTextChunks(
  rawText: string[],
  baseConfidence: number = 0.75,
): TextChunk[] {
  const chunks: TextChunk[] = [];

  for (const text of rawText) {
    // Skip very short or empty text
    const trimmed = text.trim();
    if (trimmed.length < 2) continue;

    // Classify as identifier or not
    const classification = isLikelyIdentifier(trimmed);
    const region = inferTextRegion(trimmed);

    // Adjust confidence based on classification
    // Identifiers get higher confidence, noise gets lower
    let adjustedConfidence = baseConfidence;
    if (classification.isIdentifier) {
      // Identifiers are more valuable
      adjustedConfidence = Math.min(0.95, baseConfidence * 1.1);
    } else {
      // Non-identifiers get lower confidence for search purposes
      adjustedConfidence = baseConfidence * 0.7;
    }

    chunks.push({
      text: trimmed,
      region,
      confidence: adjustedConfidence,
      isLikelyIdentifier: classification.isIdentifier,
      matchedPattern: classification.pattern,
    });
  }

  // Sort by identifier likelihood (identifiers first) then by confidence
  chunks.sort((a, b) => {
    if (a.isLikelyIdentifier !== b.isLikelyIdentifier) {
      return a.isLikelyIdentifier ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });

  return chunks;
}

/**
 * Get only the identifier-like chunks, limited to top N
 *
 * @param chunks - Array of TextChunks
 * @param limit - Maximum number to return (default: 5)
 * @returns Array of identifier-like TextChunks
 */
export function getIdentifierChunks(chunks: TextChunk[], limit: number = 5): TextChunk[] {
  return chunks
    .filter(chunk => chunk.isLikelyIdentifier)
    .slice(0, limit);
}

/**
 * Extract potential search queries from text chunks
 * Returns deduplicated, cleaned queries
 *
 * @param chunks - Array of TextChunks
 * @param limit - Maximum number of queries to return
 * @returns Array of search query strings
 */
export function extractSearchQueries(chunks: TextChunk[], limit: number = 5): string[] {
  const identifierChunks = getIdentifierChunks(chunks, limit * 2);
  const queries = new Set<string>();

  for (const chunk of identifierChunks) {
    // Normalize the text for searching
    const query = chunk.text.trim();

    // Skip if too short
    if (query.length < 3) continue;

    // Add the raw query
    queries.add(query);

    // If it contains hyphens, also add without hyphens
    if (query.includes('-')) {
      queries.add(query.replace(/-/g, ''));
    }

    if (queries.size >= limit) break;
  }

  return Array.from(queries).slice(0, limit);
}
