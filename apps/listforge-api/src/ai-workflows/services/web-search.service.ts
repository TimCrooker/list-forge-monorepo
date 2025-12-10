import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import type {
	WebSearchResult,
	DiscoveredProductData,
} from '@listforge/core-types'
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter'

/**
 * Search failure statistics for monitoring
 */
export interface SearchStats {
	totalSearches: number
	successfulSearches: number
	failedSearches: number
	lastFailureTime?: Date
	lastFailureReason?: string
}

/**
 * Web Search Service
 *
 * Provides web search capabilities using OpenAI's Responses API with web_search tool.
 * Used for deep product identification during research.
 */
@Injectable()
export class WebSearchService implements OnModuleInit {
	private readonly logger = new Logger(WebSearchService.name)
	private client: OpenAI | null = null
	private readonly isConfigured: boolean
	private stats: SearchStats = {
		totalSearches: 0,
		successfulSearches: 0,
		failedSearches: 0,
	}

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get('OPENAI_API_KEY')
		this.isConfigured = !!apiKey

		if (apiKey) {
			this.client = new OpenAI({ apiKey })
			this.logger.log('Web search service initialized')
		} else {
			this.logger.warn(
				'OPENAI_API_KEY not configured - Web search will be unavailable'
			)
		}
	}

	/**
	 * Validate configuration on module init
	 */
	onModuleInit() {
		const nodeEnv = this.configService.get<string>('NODE_ENV', 'development')

		if (nodeEnv === 'production' && !this.isConfigured) {
			this.logger.error('Web search service not configured in production - this may impact research quality')
			// Don't throw - web search is optional, but log the error prominently
		}
	}

	/**
	 * Check if the service is properly configured
	 */
	isServiceConfigured(): boolean {
		return this.isConfigured
	}

	/**
	 * Get search statistics for monitoring
	 */
	getStats(): SearchStats {
		return { ...this.stats }
	}

	/**
	 * Classify errors for retry logic
	 */
	private classifyError(error: unknown): { isRetryable: boolean; message: string } {
		if (error instanceof Error) {
			const message = error.message.toLowerCase()

			// Rate limiting - retryable
			if (message.includes('rate limit') || message.includes('429')) {
				return { isRetryable: true, message: 'Rate limited by OpenAI' }
			}

			// Network errors - retryable
			if (message.includes('econnrefused') || message.includes('etimedout') || message.includes('network')) {
				return { isRetryable: true, message: 'Network error' }
			}

			// Server errors - retryable
			if (message.includes('500') || message.includes('502') || message.includes('503')) {
				return { isRetryable: true, message: 'OpenAI server error' }
			}

			return { isRetryable: false, message: error.message }
		}

		return { isRetryable: false, message: String(error) }
	}

	/**
	 * Perform a web search query using OpenAI's web_search tool
	 *
	 * NOTE: This implementation uses OpenAI's experimental web search capabilities.
	 * Errors are now tracked and surfaced properly while still allowing research to continue.
	 *
	 * Alternative implementations could use:
	 * - Tavily API (@langchain/community/tools/tavily_search)
	 * - SerpAPI for Google search results
	 * - Perplexity API for AI-powered search
	 */
	async search(query: string, maxRetries: number = 2): Promise<WebSearchResult> {
		this.stats.totalSearches++
		this.logger.debug(`Executing web search: "${query}"`)

		if (!this.client) {
			this.stats.failedSearches++
			this.stats.lastFailureTime = new Date()
			this.stats.lastFailureReason = 'Service not configured'

			return {
				query,
				content: '',
				sources: [],
				timestamp: new Date().toISOString(),
				error: 'Web search service not configured',
			}
		}

		// Get rate limiter for web search
		const rateLimiter = getRateLimiter('webSearch', RATE_LIMITER_CONFIGS.webSearch)

		let lastError: Error | undefined

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Apply rate limiting before making the request
				await rateLimiter.acquire()

				// Use OpenAI's responses API with web_search tool
				const response = await this.client.responses.create({
					model: 'gpt-4o',
					tools: [{ type: 'web_search' }],
					input: query,
				})

				// Extract the response content
				const content = response.output_text || ''

				this.stats.successfulSearches++

				return {
					query,
					content,
					sources: this.extractSources(response),
					timestamp: new Date().toISOString(),
				}
			} catch (error) {
				const classified = this.classifyError(error)
				lastError = error instanceof Error ? error : new Error(String(error))

				if (!classified.isRetryable || attempt >= maxRetries) {
					this.logger.error(
						`Web search failed for query "${query}" after ${attempt + 1} attempts: ${classified.message}`,
						lastError.stack
					)
					break
				}

				// Exponential backoff: 500ms, 1s, 2s
				const delay = Math.pow(2, attempt) * 500
				this.logger.warn(`Web search attempt ${attempt + 1} failed, retrying in ${delay}ms: ${classified.message}`)
				await new Promise(resolve => setTimeout(resolve, delay))
			}
		}

		// Track failure
		this.stats.failedSearches++
		this.stats.lastFailureTime = new Date()
		this.stats.lastFailureReason = lastError?.message || 'Unknown error'

		// Return result with error information - allows downstream to know what failed
		return {
			query,
			content: '',
			sources: [],
			timestamp: new Date().toISOString(),
			error: lastError?.message || 'Web search failed after retries',
		}
	}

	/**
	 * Search for product information with multiple targeted queries
	 * Slice 2: Enhanced with color, size, and mpn parameters
	 *
	 * Returns all results including failed ones so callers can see what worked/failed.
	 * Results with content.length > 0 are successful, those with error field failed.
	 */
	async searchProduct(params: {
		brand?: string
		model?: string
		category?: string
		upc?: string
		extractedText?: string
		attributes?: Record<string, string>
		color?: string
		size?: string
		mpn?: string
	}): Promise<{ results: WebSearchResult[]; successCount: number; failedCount: number }> {
		const queries = this.generateProductQueries(params)
		this.logger.debug(`Generated ${queries.length} product search queries`)

		if (!this.isConfigured) {
			this.logger.warn('Web search not configured - skipping product search')
			return {
				results: [],
				successCount: 0,
				failedCount: 0,
			}
		}

		// Execute searches with controlled concurrency to avoid rate limits
		// Reduced batch size from 3 to 2 for better rate limit control
		const batchSize = 2
		const allResults: WebSearchResult[] = []

		for (let i = 0; i < queries.length; i += batchSize) {
			const batch = queries.slice(i, i + batchSize)
			const batchResults = await Promise.all(
				batch.map((query) => this.search(query))
			)
			allResults.push(...batchResults)

			// Increased delay between batches to prevent rate limit bursts
			// 500ms base + up to 200ms jitter to prevent synchronized patterns
			if (i + batchSize < queries.length) {
				const baseDelay = 500
				const jitter = Math.random() * 200
				await new Promise(resolve => setTimeout(resolve, baseDelay + jitter))
			}
		}

		const successfulResults = allResults.filter((r) => r.content.length > 0 && !r.error)
		const failedResults = allResults.filter((r) => r.error)

		if (failedResults.length > 0) {
			this.logger.warn(
				`Product search: ${successfulResults.length} succeeded, ${failedResults.length} failed. ` +
				`Failures: ${failedResults.map(r => r.error).join('; ')}`
			)
		}

		return {
			results: successfulResults,
			successCount: successfulResults.length,
			failedCount: failedResults.length,
		}
	}

	/**
	 * Synthesize product data from web search results using LLM
	 * Includes retry logic for transient failures
	 */
	async synthesizeProductData(
		searchResults: WebSearchResult[],
		existingData: {
			brand?: string
			model?: string
			category?: string
			attributes?: Record<string, string>
		}
	): Promise<DiscoveredProductData> {
		// Return default if no search results or service not configured
		if (searchResults.length === 0 || !this.client) {
			this.logger.debug('No search results or service not configured for synthesis')
			return {
				confidence: 0,
				brand: existingData.brand || null,
				model: existingData.model || null,
				mpn: null,
				upc: null,
				title: null,
				description: null,
				category: existingData.category ? [existingData.category] : [],
				condition: null,
				specifications: {},
				sources: [],
			}
		}

		const prompt = this.buildSynthesisPrompt(searchResults, existingData)
		const maxRetries = 2
		let lastError: Error | undefined

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const response = await this.client.chat.completions.create({
					model: 'gpt-4o',
					messages: [
						{
							role: 'system',
							content: `You are a product identification expert. Analyze the web search results and extract accurate product information.

Be precise and only include information you are confident about based on the search results.
Calculate a confidence score (0-1) based on:
- Brand identified and verified: +0.20
- Model number found and verified: +0.25
- UPC/MPN confirmed: +0.20
- Category determined: +0.15
- Specifications extracted: +0.20

Return JSON with this exact structure:
{
  "confidence": number (0-1),
  "brand": string | null,
  "model": string | null,
  "mpn": string | null,
  "upc": string | null,
  "title": string | null (suggested product title),
  "description": string | null (detailed product description),
  "category": string[] (category hierarchy),
  "condition": string | null (if determinable),
  "specifications": { [key: string]: string | number | boolean }
}`,
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: 2000,
					temperature: 0.2,
				})

				const content = response.choices[0]?.message?.content
				if (!content) {
					throw new Error('No response from synthesis')
				}

				// Parse JSON from response
				const jsonMatch = content.match(/\{[\s\S]*\}/)
				if (!jsonMatch) {
					throw new Error('Invalid JSON response from synthesis')
				}

				const parsed = JSON.parse(jsonMatch[0])

				return {
					confidence: Math.min(1, Math.max(0, parsed.confidence || 0)),
					brand: parsed.brand || existingData.brand || null,
					model: parsed.model || existingData.model || null,
					mpn: parsed.mpn || null,
					upc: parsed.upc || null,
					title: parsed.title || null,
					description: parsed.description || null,
					category: Array.isArray(parsed.category) ? parsed.category : [],
					condition: parsed.condition || null,
					specifications: parsed.specifications || {},
					sources: searchResults.flatMap((r) => r.sources),
				}
			} catch (error) {
				const classified = this.classifyError(error)
				lastError = error instanceof Error ? error : new Error(String(error))

				if (!classified.isRetryable || attempt >= maxRetries) {
					this.logger.error(
						`Failed to synthesize product data after ${attempt + 1} attempts: ${classified.message}`,
						lastError.stack
					)
					break
				}

				// Exponential backoff
				const delay = Math.pow(2, attempt) * 500
				this.logger.warn(`Synthesis attempt ${attempt + 1} failed, retrying in ${delay}ms: ${classified.message}`)
				await new Promise(resolve => setTimeout(resolve, delay))
			}
		}

		// Return fallback with low confidence
		return {
			confidence: 0.1,
			brand: existingData.brand || null,
			model: existingData.model || null,
			mpn: null,
			upc: null,
			title: null,
			description: null,
			category: existingData.category ? [existingData.category] : [],
			condition: null,
			specifications: {},
			sources: [],
		}
	}

	/**
	 * Values that indicate "unknown" or "not detected" - should be filtered out
	 */
	private readonly PLACEHOLDER_VALUES = [
		'not visible',
		'unknown',
		'n/a',
		'na',
		'none',
		'null',
		'undefined',
		'not available',
		'not detected',
		'not found',
		'cannot determine',
		'unidentified',
	]

	/**
	 * Check if a value is a placeholder/unknown value that should be filtered out
	 */
	private isPlaceholderValue(value: string | undefined): boolean {
		if (!value) return true
		const normalized = value.toLowerCase().trim()
		if (normalized.length === 0) return true
		return this.PLACEHOLDER_VALUES.some(
			(placeholder) =>
				normalized === placeholder ||
				normalized.includes(placeholder) ||
				placeholder.includes(normalized)
		)
	}

	/**
	 * Generate targeted search queries for product identification
	 * Slice 2: Enhanced with better quoting, variant queries, and prioritization
	 */
	private generateProductQueries(params: {
		brand?: string
		model?: string
		category?: string
		upc?: string
		extractedText?: string
		attributes?: Record<string, string>
		color?: string
		size?: string
		mpn?: string
	}): string[] {
		const queries: string[] = []

		// Clean params - filter out placeholder values like "Not visible", "Unknown", etc.
		const brand = this.isPlaceholderValue(params.brand) ? undefined : params.brand
		const model = this.isPlaceholderValue(params.model) ? undefined : params.model
		const category = this.isPlaceholderValue(params.category) ? undefined : params.category
		const color = this.isPlaceholderValue(params.color) ? undefined : params.color
		const size = this.isPlaceholderValue(params.size) ? undefined : params.size
		const mpn = this.isPlaceholderValue(params.mpn) ? undefined : params.mpn

		// Priority 1: Exact model number with quotes (highest precision)
		if (model) {
			const modelQuoted = this.quoteIfContainsSpecialChars(model)
			if (brand) {
				queries.push(`"${brand}" ${modelQuoted} specifications`)
			} else {
				queries.push(`${modelQuoted} product specifications features`)
			}
		}

		// Priority 2: UPC/EAN lookup (very reliable if available)
		if (params.upc && !this.isPlaceholderValue(params.upc)) {
			// Quote the UPC to ensure exact match
			queries.push(`"${params.upc}" product specifications`)
		}

		// Priority 3: MPN lookup (manufacturer part number)
		if (mpn && mpn !== model) {
			queries.push(`"${mpn}" manufacturer part number specifications`)
		}

		// Priority 4: Brand + Model + Variant (color/size for exact match)
		if (brand && model) {
			const variantParts: string[] = []
			if (color) variantParts.push(color)
			if (size) variantParts.push(size)

			if (variantParts.length > 0) {
				const modelQuoted = this.quoteIfContainsSpecialChars(model)
				queries.push(
					`"${brand}" ${modelQuoted} ${variantParts.join(' ')} specifications`
				)
			}
		}

		// Priority 5: Extracted text from images (OCR results)
		if (params.extractedText && !this.isPlaceholderValue(params.extractedText)) {
			// Look for potential model numbers in extracted text
			const modelNumbers = this.extractPotentialModelNumbers(params.extractedText)
			for (const modelNum of modelNumbers.slice(0, 2)) {
				queries.push(`"${modelNum}" product specifications`)
			}

			// Also try the raw text if it looks meaningful
			const cleanText = params.extractedText.substring(0, 80).trim()
			if (cleanText.length > 10 && !modelNumbers.includes(cleanText)) {
				queries.push(`"${cleanText}" product`)
			}
		}

		// Priority 6: Brand + category + key attributes
		if (brand && category) {
			const attrParts: string[] = []
			if (color) attrParts.push(color)
			if (size) attrParts.push(size)
			if (params.attributes) {
				// Add other relevant attributes (filter out placeholders)
				const relevantKeys = ['capacity', 'material', 'style', 'type']
				for (const key of relevantKeys) {
					const val = params.attributes[key]
					if (val && !this.isPlaceholderValue(val)) {
						attrParts.push(val)
					}
				}
			}
			const attrString = attrParts.slice(0, 3).join(' ')
			queries.push(
				`"${brand}" ${category} ${attrString} product`.trim()
			)
		}

		// Priority 7: Category + detailed attributes (for unbranded products)
		if (category && params.attributes && Object.keys(params.attributes).length > 0 && !brand) {
			const validAttrs = Object.entries(params.attributes)
				.filter(([k, v]) => !this.isPlaceholderValue(v))
				.slice(0, 4)
			if (validAttrs.length > 0) {
				const attrString = validAttrs.map(([k, v]) => v).join(' ')
				queries.push(`${category} ${attrString} product identify`)
			}
		}

		// Fallback: Generic category search
		if (queries.length === 0 && category) {
			queries.push(`${category} popular products specifications`)
		}

		// Deduplicate and limit
		const uniqueQueries = [...new Set(queries)]
		return uniqueQueries.slice(0, 6) // Allow up to 6 queries for better coverage
	}

	/**
	 * Quote a string if it contains special characters or spaces
	 * This ensures exact matching in search engines
	 */
	private quoteIfContainsSpecialChars(text: string): string {
		// If it contains spaces, hyphens, or special chars, quote it
		if (/[\s\-\/\(\)]/.test(text)) {
			return `"${text}"`
		}
		return text
	}

	/**
	 * Extract potential model numbers from text
	 * Looks for alphanumeric patterns that look like model numbers
	 */
	private extractPotentialModelNumbers(text: string): string[] {
		const patterns = [
			// Common model number patterns like WH-1000XM4, A2141, SM-G991B
			/[A-Z]{1,3}[-\s]?\d{3,5}[A-Z]{0,3}/gi,
			// Patterns like iPhone 14 Pro, Galaxy S23
			/[A-Z][a-z]+\s+\d{1,2}(?:\s+[A-Z][a-z]+)?/g,
			// Part numbers like 123-456-789
			/\d{3}[-\s]\d{3}[-\s]\d{3}/g,
		]

		const matches: string[] = []
		for (const pattern of patterns) {
			const found = text.match(pattern)
			if (found) {
				matches.push(...found.map((m) => m.trim()))
			}
		}

		// Deduplicate and return
		return [...new Set(matches)]
	}

	/**
	 * Build the synthesis prompt from search results
	 */
	private buildSynthesisPrompt(
		searchResults: WebSearchResult[],
		existingData: {
			brand?: string
			model?: string
			category?: string
			attributes?: Record<string, string>
		}
	): string {
		const searchContent = searchResults
			.map(
				(r, i) =>
					`--- Search Result ${i + 1} (Query: "${r.query}") ---\n${r.content}`
			)
			.join('\n\n')

		return `Analyze these web search results to identify the product:

EXISTING INFORMATION (from image analysis):
- Brand: ${existingData.brand || 'Unknown'}
- Model: ${existingData.model || 'Unknown'}
- Category: ${existingData.category || 'Unknown'}
- Attributes: ${JSON.stringify(existingData.attributes || {})}

WEB SEARCH RESULTS:
${searchContent}

Based on the search results, extract and verify:
1. Brand name (verify if matches existing or correct it)
2. Model number (exact model designation)
3. MPN (Manufacturer Part Number)
4. UPC (if found)
5. Suggested product title
6. Detailed description
7. Category hierarchy (e.g., ["Electronics", "Audio", "Headphones"])
8. Product specifications and attributes

Calculate confidence based on how much information was found and verified.`
	}

	/**
	 * Extract source URLs from OpenAI response
	 */
	private extractSources(response: any): string[] {
		try {
			// The response structure may vary - attempt to extract any URLs
			const sources: string[] = []

			// Check for annotations or citations in the response
			if (response.annotations) {
				for (const annotation of response.annotations) {
					if (annotation.url) {
						sources.push(annotation.url)
					}
				}
			}

			// Check for web_search results in tool calls
			if (response.tool_calls) {
				for (const call of response.tool_calls) {
					if (call.type === 'web_search' && call.results) {
						for (const result of call.results) {
							if (result.url) {
								sources.push(result.url)
							}
						}
					}
				}
			}

			return [...new Set(sources)] // Deduplicate
		} catch {
			return []
		}
	}
}
