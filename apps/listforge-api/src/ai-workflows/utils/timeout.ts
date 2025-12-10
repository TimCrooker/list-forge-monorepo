/**
 * Timeout Utilities
 *
 * Provides timeout protection for async operations to prevent hanging requests.
 */

/**
 * Execute an async function with a timeout
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns Promise resolving to the function's result
 * @throws Error if the operation times out
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

/**
 * Default timeout for tool executions (30 seconds)
 * Tools should complete quickly - if they take longer, something is wrong
 */
export const TOOL_EXECUTION_TIMEOUT_MS = 30_000;

/**
 * Default timeout for LLM calls (60 seconds)
 * LLM calls can be slower than tools, but should still have an upper bound
 */
export const LLM_CALL_TIMEOUT_MS = 60_000;

/**
 * Execute a tool with timeout protection
 *
 * @param toolName - Name of the tool being executed
 * @param fn - The tool execution function
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Promise resolving to the tool's result
 * @throws Error if the tool times out
 */
export async function executeToolWithTimeout<T>(
  toolName: string,
  fn: () => Promise<T>,
  timeoutMs: number = TOOL_EXECUTION_TIMEOUT_MS,
): Promise<T> {
  return withTimeout(
    fn,
    timeoutMs,
    `Tool "${toolName}" timed out after ${timeoutMs}ms. This may indicate a database deadlock, network issue, or infinite loop.`,
  );
}
