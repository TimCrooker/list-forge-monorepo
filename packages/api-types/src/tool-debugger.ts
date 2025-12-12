/**
 * Tool category type
 */
export type ToolCategory = 'item' | 'research' | 'search' | 'aggregate' | 'action' | 'domain' | 'research-advanced';

/**
 * Tool information for the debugger UI
 */
export interface ToolInfoDto {
  name: string;
  category: ToolCategory;
  description: string;
  requiredContext: {
    itemId?: boolean;
    organizationId?: boolean;
  };
  jsonSchema: Record<string, unknown>;
}

/**
 * Response for listing all tools
 */
export interface ListToolsResponseDto {
  tools: ToolInfoDto[];
}

/**
 * Request to execute a tool
 */
export interface ExecuteToolRequestDto {
  toolName: string;
  itemId?: string;
  inputs: Record<string, unknown>;
}

/**
 * Response from executing a tool
 */
export interface ExecuteToolResponseDto {
  success: boolean;
  toolName: string;
  executionTimeMs: number;
  result: string;
  parsedResult?: unknown;
  error?: string;
  validationErrors?: Array<{
    path: string[];
    message: string;
  }>;
}

/**
 * Simplified item info for the item selector
 */
export interface DebuggerItemDto {
  id: string;
  title: string | null;
  lifecycleStatus: string;
  aiReviewState: string;
  defaultPrice: number | null;
  primaryImageUrl: string | null;
  createdAt: Date;
}

/**
 * Response for searching items in the debugger
 */
export interface SearchDebuggerItemsResponseDto {
  items: DebuggerItemDto[];
  total: number;
}
