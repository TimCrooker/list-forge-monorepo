import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Action Types (aligned with core-types/chat.ts)
// ============================================================================

export type ChatActionType =
  | 'update_field'      // Update item field
  | 'navigate'          // Go to route
  | 'open_item'         // Open item detail
  | 'copy'              // Copy to clipboard
  | 'trigger_research'  // Start research
  | 'run_tool'          // Execute tool
  | 'external_link';    // Open external URL

export interface ChatAction {
  id: string;
  type: ChatActionType;
  label: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  autoExecute?: boolean;
  payload: Record<string, unknown>;
  applied?: boolean;
}

// ============================================================================
// Schemas
// ============================================================================

export const SuggestActionSchema = z.object({
  type: z.enum([
    'update_field',
    'navigate',
    'open_item',
    'copy',
    'trigger_research',
    'run_tool',
    'external_link',
  ]).describe(`Action type:
- update_field: Update an item field (shows confirm button)
- navigate: Go to a page in the app
- open_item: Open a specific item's detail page
- copy: Copy text to clipboard
- trigger_research: Start research for an item
- run_tool: Execute another tool
- external_link: Open external URL`),

  label: z.string().min(1).max(50).describe('Short button label (2-5 words, e.g., "Go to Review Queue", "Copy Price")'),

  description: z.string().optional().describe('Tooltip text explaining what the action does'),

  priority: z.enum(['low', 'normal', 'high']).default('normal').describe('Visual priority (high = primary button style)'),

  autoExecute: z.boolean().default(false).describe(`Whether to execute immediately:
- true: Use ONLY when user explicitly requests navigation (e.g., "take me to...", "go to...")
- false: Show as button for user to click (default, use for suggestions)
NOTE: This will be forced to false for update_field actions (data modification requires user confirmation)`),

  // Type-specific fields
  routeName: z.string().optional().describe('Route name for navigate action (e.g., "items", "review", "capture")'),
  params: z.record(z.string()).optional().describe('Route params for navigate action'),
  itemId: z.string().optional().describe('Item ID for open_item action'),
  field: z.string().optional().describe('Field name for update_field action'),
  value: z.any().optional().describe('New value for update_field action'),
  text: z.string().optional().describe('Text to copy for copy action'),
  url: z.string().optional().describe('URL for external_link action'),
  toolName: z.string().optional().describe('Tool name for run_tool action'),
  toolArgs: z.record(z.any()).optional().describe('Tool arguments for run_tool action'),
});

// ============================================================================
// Route Definitions
// ============================================================================

const ROUTES: Record<string, { path: string; name: string; description: string }> = {
  'items': {
    path: '/items',
    name: 'Items List',
    description: 'View and manage all inventory items',
  },
  'item_detail': {
    path: '/items/:id',
    name: 'Item Detail',
    description: 'View item details, pricing, and research',
  },
  'review': {
    path: '/review',
    name: 'Review Queue',
    description: 'Review AI-processed items before publishing',
  },
  'capture': {
    path: '/capture',
    name: 'Capture',
    description: 'Add new items via photo upload',
  },
  'settings': {
    path: '/settings',
    name: 'Settings',
    description: 'Configure account and preferences',
  },
  'settings_marketplaces': {
    path: '/settings/marketplaces',
    name: 'Marketplace Settings',
    description: 'Connect and manage marketplace accounts',
  },
  'settings_organization': {
    path: '/settings/organization',
    name: 'Organization Settings',
    description: 'Manage organization settings',
  },
  'needs_work': {
    path: '/needs-work',
    name: 'Needs Work',
    description: 'Items that need attention',
  },
  'dashboard': {
    path: '/',
    name: 'Dashboard',
    description: 'Overview of inventory and activity',
  },
};

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * Suggest Action Tool
 *
 * Suggests interactive action buttons that the frontend can render and execute.
 * Use this to:
 * - Offer navigation shortcuts ("Go to Review Queue")
 * - Provide quick field updates ("Set price to $150")
 * - Copy useful data ("Copy item ID")
 * - Trigger operations ("Run Research")
 */
export function suggestActionTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof SuggestActionSchema>) => {
      const ctx = getToolContext();

      try {
        // Build the action payload based on type
        const action: ChatAction = {
          id: uuidv4(),
          type: input.type,
          label: input.label,
          description: input.description,
          priority: input.priority,
          autoExecute: input.autoExecute,
          payload: {},
          applied: false,
        };

        // Populate type-specific payload
        switch (input.type) {
          case 'navigate':
            if (!input.routeName) {
              return JSON.stringify({
                error: true,
                message: 'routeName is required for navigate action',
              });
            }
            const route = ROUTES[input.routeName];
            if (!route) {
              return JSON.stringify({
                error: true,
                message: `Unknown route: ${input.routeName}. Available routes: ${Object.keys(ROUTES).join(', ')}`,
              });
            }
            action.payload = {
              type: 'navigate',
              routeName: input.routeName,
              path: route.path,
              params: input.params || {},
            };
            break;

          case 'open_item':
            if (!input.itemId) {
              return JSON.stringify({
                error: true,
                message: 'itemId is required for open_item action',
              });
            }
            action.payload = {
              type: 'open_item',
              itemId: input.itemId,
              path: `/items/${input.itemId}`,
            };
            break;

          case 'update_field':
            if (!input.field || input.value === undefined) {
              return JSON.stringify({
                error: true,
                message: 'field and value are required for update_field action',
              });
            }
            // Never auto-execute field updates - data modification requires user confirmation
            action.autoExecute = false;
            action.payload = {
              type: 'update_field',
              itemId: input.itemId || ctx.itemId,
              field: input.field,
              value: input.value,
            };
            break;

          case 'copy':
            if (!input.text) {
              return JSON.stringify({
                error: true,
                message: 'text is required for copy action',
              });
            }
            action.payload = {
              type: 'copy',
              text: input.text,
            };
            break;

          case 'trigger_research':
            action.payload = {
              type: 'trigger_research',
              itemId: input.itemId || ctx.itemId,
            };
            break;

          case 'run_tool':
            if (!input.toolName) {
              return JSON.stringify({
                error: true,
                message: 'toolName is required for run_tool action',
              });
            }
            action.payload = {
              type: 'run_tool',
              toolName: input.toolName,
              args: input.toolArgs || {},
            };
            break;

          case 'external_link':
            if (!input.url) {
              return JSON.stringify({
                error: true,
                message: 'url is required for external_link action',
              });
            }
            // Validate URL
            try {
              new URL(input.url);
            } catch {
              return JSON.stringify({
                error: true,
                message: 'Invalid URL format',
              });
            }
            action.payload = {
              type: 'external_link',
              url: input.url,
            };
            break;
        }

        // Emit action if emitter is available
        if (deps.emitAction && ctx.sessionId) {
          deps.emitAction(ctx.sessionId, action);
        }

        return JSON.stringify({
          success: true,
          action: {
            id: action.id,
            type: action.type,
            label: action.label,
            description: action.description,
            priority: action.priority,
            autoExecute: action.autoExecute,
          },
          message: input.autoExecute
            ? `Action "${action.label}" will be executed automatically.`
            : `Action "${action.label}" added. User can click to execute.`,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to suggest action: ${message}`,
        });
      }
    },
    {
      name: 'suggest_action',
      description: `Suggest an interactive action button for the user.

Action types:
- navigate: Go to a page (items, review, capture, settings, etc.)
- open_item: Open a specific item's detail page
- update_field: Update an item field (shows confirm button)
- copy: Copy text to clipboard
- trigger_research: Start research for an item
- run_tool: Execute another tool
- external_link: Open external URL

Use autoExecute: true ONLY when user explicitly requests navigation:
- "take me to the review queue" → autoExecute: true
- "where can I review items?" → autoExecute: false (show button)

Priority affects button styling:
- high: Primary/prominent button
- normal: Standard button
- low: Subtle/secondary button

Available routes: ${Object.keys(ROUTES).join(', ')}`,
      schema: SuggestActionSchema,
    },
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get available routes for navigation
 */
export function getAvailableRoutes(): typeof ROUTES {
  return ROUTES;
}

/**
 * Create a navigation action
 */
export function createNavigateAction(
  label: string,
  routeName: string,
  params?: Record<string, string>,
  options?: { description?: string; priority?: 'low' | 'normal' | 'high'; autoExecute?: boolean },
): ChatAction {
  const route = ROUTES[routeName];
  return {
    id: uuidv4(),
    type: 'navigate',
    label,
    description: options?.description || route?.description,
    priority: options?.priority || 'normal',
    autoExecute: options?.autoExecute || false,
    payload: {
      type: 'navigate',
      routeName,
      path: route?.path || `/${routeName}`,
      params: params || {},
    },
  };
}

/**
 * Create an update field action
 */
export function createUpdateFieldAction(
  label: string,
  itemId: string,
  field: string,
  value: unknown,
  options?: { description?: string; priority?: 'low' | 'normal' | 'high' },
): ChatAction {
  return {
    id: uuidv4(),
    type: 'update_field',
    label,
    description: options?.description || `Update ${field} to ${value}`,
    priority: options?.priority || 'normal',
    autoExecute: false, // Never auto-execute field updates
    payload: {
      type: 'update_field',
      itemId,
      field,
      value,
    },
  };
}

/**
 * Create a copy action
 */
export function createCopyAction(
  label: string,
  text: string,
  options?: { description?: string },
): ChatAction {
  return {
    id: uuidv4(),
    type: 'copy',
    label,
    description: options?.description || 'Copy to clipboard',
    priority: 'low',
    autoExecute: false,
    payload: {
      type: 'copy',
      text,
    },
  };
}
