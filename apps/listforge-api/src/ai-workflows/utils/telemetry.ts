import { Logger } from '@nestjs/common';
import { trace, Span, SpanStatusCode, context, SpanKind, Attributes } from '@opentelemetry/api';

const logger = new Logger('Telemetry');

/**
 * Tracer name for research agent spans
 */
const TRACER_NAME = 'listforge-research-agent';

/**
 * Get the tracer for research agent operations
 */
export function getTracer() {
  return trace.getTracer(TRACER_NAME, '1.0.0');
}

/**
 * Metric counters and histograms (in-memory for now, can be exported to OTel)
 */
interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

const metrics = {
  counters: new Map<string, MetricValue[]>(),
  histograms: new Map<string, MetricValue[]>(),
  gauges: new Map<string, MetricValue>(),
};

/**
 * Research operation types for categorization
 */
export type ResearchOperationType =
  | 'research_run'
  | 'load_context'
  | 'analyze_media'
  | 'extract_identifiers'
  | 'deep_identify'
  | 'update_item'
  | 'detect_marketplace_schema'
  | 'search_comps'
  | 'analyze_comps'
  | 'calculate_price'
  | 'assemble_listing'
  | 'assess_missing'
  | 'persist_results'
  | 'web_search'
  | 'llm_call'
  | 'ebay_api';

/**
 * Standard attributes for research spans
 */
export interface ResearchSpanAttributes {
  'research.run_id'?: string;
  'research.item_id'?: string;
  'research.organization_id'?: string;
  'research.operation'?: ResearchOperationType;
  'research.iteration'?: number;
  'research.confidence'?: number;
  'research.comps_count'?: number;
  'ai.model'?: string;
  'ai.prompt_tokens'?: number;
  'ai.completion_tokens'?: number;
  'ai.total_tokens'?: number;
  'marketplace.name'?: string;
  'marketplace.category_id'?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Create a span for a research operation
 */
export function createResearchSpan(
  name: string,
  operation: ResearchOperationType,
  attributes?: ResearchSpanAttributes,
): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'research.operation': operation,
      ...attributes,
    } as Attributes,
  });

  return span;
}

/**
 * Execute a function within a span context
 */
export async function withSpan<T>(
  name: string,
  operation: ResearchOperationType,
  fn: (span: Span) => Promise<T>,
  attributes?: ResearchSpanAttributes,
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    name,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'research.operation': operation,
        ...attributes,
      } as Attributes,
    },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Record a counter metric
 */
export function recordCounter(
  name: string,
  value: number = 1,
  labels: Record<string, string> = {},
): void {
  const key = name;
  if (!metrics.counters.has(key)) {
    metrics.counters.set(key, []);
  }
  metrics.counters.get(key)!.push({
    value,
    labels,
    timestamp: Date.now(),
  });

  // Keep only last 1000 values
  const values = metrics.counters.get(key)!;
  if (values.length > 1000) {
    values.shift();
  }
}

/**
 * Record a histogram metric (for durations, counts, etc.)
 */
export function recordHistogram(
  name: string,
  value: number,
  labels: Record<string, string> = {},
): void {
  const key = name;
  if (!metrics.histograms.has(key)) {
    metrics.histograms.set(key, []);
  }
  metrics.histograms.get(key)!.push({
    value,
    labels,
    timestamp: Date.now(),
  });

  // Keep only last 1000 values
  const values = metrics.histograms.get(key)!;
  if (values.length > 1000) {
    values.shift();
  }
}

/**
 * Set a gauge metric (current value)
 */
export function setGauge(
  name: string,
  value: number,
  labels: Record<string, string> = {},
): void {
  metrics.gauges.set(name, {
    value,
    labels,
    timestamp: Date.now(),
  });
}

/**
 * Standard research metrics
 */
export const ResearchMetrics = {
  /** Counter: Number of research runs started */
  researchRunsStarted: (labels: { organization_id?: string } = {}) =>
    recordCounter('research.runs.started', 1, labels),

  /** Counter: Number of research runs completed */
  researchRunsCompleted: (labels: { organization_id?: string; status: 'success' | 'error' | 'partial' } = { status: 'success' }) =>
    recordCounter('research.runs.completed', 1, labels),

  /** Histogram: Duration of research runs in milliseconds */
  researchRunDuration: (durationMs: number, labels: { organization_id?: string; status?: string } = {}) =>
    recordHistogram('research.runs.duration_ms', durationMs, labels),

  /** Counter: Number of node executions */
  nodeExecuted: (labels: { node: string; status: 'success' | 'error' }) =>
    recordCounter('research.node.executed', 1, labels),

  /** Histogram: Node execution duration */
  nodeDuration: (durationMs: number, labels: { node: string }) =>
    recordHistogram('research.node.duration_ms', durationMs, labels),

  /** Counter: LLM API calls */
  llmApiCalls: (labels: { model: string; operation: string; status: 'success' | 'error' }) =>
    recordCounter('research.llm.api_calls', 1, labels),

  /** Histogram: LLM token usage */
  llmTokens: (tokens: number, labels: { model: string; type: 'prompt' | 'completion' }) =>
    recordHistogram('research.llm.tokens', tokens, labels),

  /** Histogram: LLM call duration */
  llmDuration: (durationMs: number, labels: { model: string; operation: string }) =>
    recordHistogram('research.llm.duration_ms', durationMs, labels),

  /** Counter: Web search queries */
  webSearchQueries: (labels: { status: 'success' | 'error' }) =>
    recordCounter('research.web_search.queries', 1, labels),

  /** Counter: Comp searches */
  compSearches: (labels: { source: string; type: 'sold' | 'active' | 'image' }) =>
    recordCounter('research.comps.searches', 1, labels),

  /** Histogram: Number of comps found */
  compsFound: (count: number, labels: { source: string; type: 'sold' | 'active' }) =>
    recordHistogram('research.comps.found', count, labels),

  /** Histogram: Confidence scores */
  confidenceScore: (score: number, labels: { stage: string }) =>
    recordHistogram('research.confidence.score', score, labels),

  /** Counter: eBay API calls */
  ebayApiCalls: (labels: { api: string; status: 'success' | 'error' }) =>
    recordCounter('research.ebay.api_calls', 1, labels),

  /** Gauge: Current queue depth */
  queueDepth: (depth: number) =>
    setGauge('research.queue.depth', depth),
};

/**
 * Get current metrics snapshot for monitoring
 */
export function getMetricsSnapshot(): {
  counters: Record<string, { total: number; lastHour: number }>;
  histograms: Record<string, { count: number; min: number; max: number; avg: number; p50: number; p95: number }>;
  gauges: Record<string, number>;
} {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Aggregate counters
  const counters: Record<string, { total: number; lastHour: number }> = {};
  for (const [name, values] of metrics.counters.entries()) {
    const total = values.reduce((sum, v) => sum + v.value, 0);
    const lastHour = values
      .filter(v => v.timestamp >= oneHourAgo)
      .reduce((sum, v) => sum + v.value, 0);
    counters[name] = { total, lastHour };
  }

  // Aggregate histograms
  const histograms: Record<string, { count: number; min: number; max: number; avg: number; p50: number; p95: number }> = {};
  for (const [name, values] of metrics.histograms.entries()) {
    if (values.length === 0) continue;

    const sorted = [...values].sort((a, b) => a.value - b.value);
    const vals = sorted.map(v => v.value);

    histograms[name] = {
      count: vals.length,
      min: vals[0],
      max: vals[vals.length - 1],
      avg: vals.reduce((sum, v) => sum + v, 0) / vals.length,
      p50: vals[Math.floor(vals.length * 0.5)],
      p95: vals[Math.floor(vals.length * 0.95)],
    };
  }

  // Get gauges
  const gauges: Record<string, number> = {};
  for (const [name, value] of metrics.gauges.entries()) {
    gauges[name] = value.value;
  }

  return { counters, histograms, gauges };
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  metrics.counters.clear();
  metrics.histograms.clear();
  metrics.gauges.clear();
}

/**
 * Create a timing helper that records duration on completion
 */
export function startTiming(): { stop: () => number } {
  const startTime = Date.now();
  return {
    stop: () => Date.now() - startTime,
  };
}

/**
 * Decorator-style function to add telemetry to a node execution
 */
export function instrumentNode<TState, TResult>(
  nodeName: string,
  operation: ResearchOperationType,
  fn: (state: TState, config?: any) => Promise<TResult>,
): (state: TState, config?: any) => Promise<TResult> {
  return async (state: TState, config?: any): Promise<TResult> => {
    const timing = startTiming();

    try {
      const result = await withSpan(
        `research.node.${nodeName}`,
        operation,
        async (span) => {
          // Add common attributes from state if available
          const stateObj = state as any;
          if (stateObj?.researchRunId) {
            span.setAttribute('research.run_id', stateObj.researchRunId);
          }
          if (stateObj?.itemId) {
            span.setAttribute('research.item_id', stateObj.itemId);
          }
          if (stateObj?.organizationId) {
            span.setAttribute('research.organization_id', stateObj.organizationId);
          }

          return fn(state, config);
        },
        { 'research.operation': operation },
      );

      const duration = timing.stop();
      ResearchMetrics.nodeExecuted({ node: nodeName, status: 'success' });
      ResearchMetrics.nodeDuration(duration, { node: nodeName });

      return result;
    } catch (error) {
      const duration = timing.stop();
      ResearchMetrics.nodeExecuted({ node: nodeName, status: 'error' });
      ResearchMetrics.nodeDuration(duration, { node: nodeName });

      throw error;
    }
  };
}
