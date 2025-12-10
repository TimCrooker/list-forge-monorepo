import { ChatGraphState, UserContext, ChatContext, ItemSnapshot } from '../chat-graph.state';
import { ItemResearchData } from '@listforge/core-types';

// ============================================================================
// Base System Prompt
// ============================================================================

const BASE_SYSTEM_PROMPT = `You are Forge, ListForge's AI assistant. ListForge is an AI-powered multi-marketplace listing tool that helps resellers create, manage, and sell inventory across eBay, Amazon, and other marketplaces.

## Your Capabilities

You help users with:
- Understanding their items (pricing, condition, attributes, market insights)
- Managing inventory (updating fields, triggering research, navigating the app)
- Answering questions about marketplace selling best practices
- Providing data-driven recommendations based on research

## Available Tools

You have access to these tools:

### Item Tools
1. **get_item_snapshot** - Get quick summary of an item with available data facets
2. **get_item_facet** - Get detailed data for specific facet (pricing, attributes, media, research, history)
3. **update_item_field** - Update a field on an item (price, title, description, etc.)

### Research Tools
4. **get_research_data** - Get latest research data for an item (pricing, comps, market signals)
5. **search_comps** - Search for comparable listings on marketplaces
6. **trigger_research** - Start a new research job for an item

### Navigation & Action Tools
7. **suggest_action** - Suggest interactive actions (navigate, copy, update field, etc.)

### Search Tools
8. **search_items** - Search user's inventory items
9. **search_research** - Search across research data and evidence

## Guidelines

1. **Be direct and helpful.** Give clear, actionable answers.
2. **Reference specific data.** When discussing pricing or recommendations, cite the source (e.g., "Based on 5 recent comparable sales...")
3. **Use tools efficiently.** Don't call tools unnecessarily - use context that's already provided.
4. **Understand conversational context.** "What about X?" refers to previous topic.
5. **Be proactive with suggestions.** Offer navigation buttons when helpful.
6. **Never make up information.** If you don't know, say so.
7. **Format prices as USD.** Use $X.XX format.
8. **Use autoExecute: true** only when user explicitly requests navigation ("take me to...", "go to...", "open...")
`;

// ============================================================================
// Context Sections
// ============================================================================

/**
 * Format current date/time for context
 */
function formatDateTime(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Format user context section
 */
function formatUserContext(userContext: UserContext): string {
  const lines = [
    '## Current User',
    `**Name:** ${userContext.name}`,
    `**Email:** ${userContext.email}`,
    `**Role:** ${userContext.role}`,
    `**Organization:** ${userContext.organizationName}`,
  ];
  return lines.join('\n');
}

/**
 * Format chat context section (page/app state)
 */
function formatChatContext(chatContext: ChatContext): string {
  const lines = ['## Current Page Context'];

  const pageNames: Record<string, string> = {
    'items': 'Items List - View and manage all inventory items',
    'item_detail': 'Item Detail - View item details, pricing, and research',
    'review': 'Review Queue - Review AI-processed items before publishing',
    'capture': 'Capture - Add new items via photo upload',
    'settings': 'Settings - Configure account and preferences',
    'dashboard': 'Dashboard - Overview of inventory and activity',
    'other': 'Other page',
  };

  lines.push(`**Page:** ${pageNames[chatContext.pageType] || chatContext.pageType}`);
  lines.push(`**Route:** ${chatContext.currentRoute}`);

  if (chatContext.itemId) {
    lines.push(`**Current Item ID:** ${chatContext.itemId}`);
  }
  if (chatContext.activeTab) {
    lines.push(`**Active Tab:** ${chatContext.activeTab}`);
  }
  if (chatContext.activeModal) {
    lines.push(`**Open Modal:** ${chatContext.activeModal}`);
  }
  if (chatContext.researchStatus) {
    const statusLabels: Record<string, string> = {
      'none': 'No research yet',
      'running': 'Research currently running',
      'complete': 'Research complete',
      'stale': 'Research is outdated (>7 days old)',
    };
    lines.push(`**Research Status:** ${statusLabels[chatContext.researchStatus] || chatContext.researchStatus}`);
  }
  if (chatContext.visibleErrors && chatContext.visibleErrors.length > 0) {
    lines.push(`**Visible Errors:** ${chatContext.visibleErrors.join(', ')}`);
  }
  if (chatContext.formDirtyFields && chatContext.formDirtyFields.length > 0) {
    lines.push(`**Modified Fields:** ${chatContext.formDirtyFields.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format item context section
 */
function formatItemContext(item: ItemSnapshot): string {
  const lines = ['## Current Item'];

  lines.push(`**ID:** ${item.id}`);
  if (item.title) {
    lines.push(`**Title:** ${item.title}`);
  } else {
    lines.push(`**Title:** (Not set)`);
  }
  if (item.description) {
    // Truncate long descriptions
    const desc = item.description.length > 200
      ? item.description.substring(0, 200) + '...'
      : item.description;
    lines.push(`**Description:** ${desc}`);
  }
  if (item.condition) {
    lines.push(`**Condition:** ${item.condition}`);
  }
  if (item.defaultPrice !== null) {
    lines.push(`**Current Price:** $${item.defaultPrice.toFixed(2)} ${item.currency}`);
  }
  lines.push(`**Quantity:** ${item.quantity}`);
  lines.push(`**Status:** ${item.lifecycleStatus}`);
  lines.push(`**AI Review:** ${item.aiReviewState}`);

  if (item.categoryPath && item.categoryPath.length > 0) {
    lines.push(`**Category:** ${item.categoryPath.join(' > ')}`);
  }

  if (item.attributes && item.attributes.length > 0) {
    const attrList = item.attributes
      .slice(0, 10) // Limit to 10 attributes
      .map(a => `${a.key}: ${a.value}`)
      .join(', ');
    lines.push(`**Attributes:** ${attrList}`);
    if (item.attributes.length > 10) {
      lines.push(`  (${item.attributes.length - 10} more attributes...)`);
    }
  }

  if (item.media && item.media.length > 0) {
    lines.push(`**Photos:** ${item.media.length} images`);
  }

  return lines.join('\n');
}

/**
 * Format research context section
 */
function formatResearchContext(research: ItemResearchData): string {
  const lines = ['## Research Data'];

  lines.push(`**Generated:** ${new Date(research.generatedAt).toLocaleDateString()}`);

  // Price bands
  if (research.priceBands && research.priceBands.length > 0) {
    lines.push('\n### Price Recommendations');
    for (const band of research.priceBands) {
      const label = band.label.charAt(0).toUpperCase() + band.label.slice(1);
      const confidence = Math.round(band.confidence * 100);
      lines.push(`- **${label}:** $${band.amount.toFixed(2)} (${confidence}% confidence)`);
      if (band.reasoning) {
        lines.push(`  _${band.reasoning}_`);
      }
    }
  }

  // Pricing strategies
  if (research.pricingStrategies && research.pricingStrategies.length > 0) {
    lines.push('\n### Pricing Strategies');
    for (const strategy of research.pricingStrategies) {
      lines.push(`- **${strategy.label}:** $${strategy.price.toFixed(2)}`);
      lines.push(`  Est. time to sell: ${strategy.estimatedDaysToSell.min}-${strategy.estimatedDaysToSell.max} days`);
    }
  }

  // Demand signals
  if (research.demandSignals && research.demandSignals.length > 0) {
    lines.push('\n### Market Signals');
    for (const signal of research.demandSignals.slice(0, 5)) {
      let value = `${signal.value} ${signal.unit}`;
      if (signal.direction) {
        const arrows: Record<string, string> = { up: '↑', down: '↓', stable: '→' };
        value += ` ${arrows[signal.direction] || ''}`;
      }
      lines.push(`- **${signal.metric}:** ${value}`);
    }
  }

  // Missing info
  if (research.missingInfo && research.missingInfo.length > 0) {
    lines.push('\n### Missing Information');
    for (const info of research.missingInfo.slice(0, 5)) {
      lines.push(`- **${info.field}** (${info.importance}): ${info.reason}`);
    }
  }

  // Marketplace category
  if (research.marketplaceCategory) {
    lines.push('\n### Marketplace Category');
    lines.push(`- **${research.marketplaceCategory.marketplace.toUpperCase()}:** ${research.marketplaceCategory.categoryPath.join(' > ')}`);
    lines.push(`  Confidence: ${Math.round(research.marketplaceCategory.confidence * 100)}%`);
  }

  // Field completion
  if (research.fieldCompletion) {
    lines.push('\n### Listing Readiness');
    const fc = research.fieldCompletion;
    lines.push(`- Required fields: ${fc.required.filled}/${fc.required.total}`);
    if (fc.required.missing.length > 0) {
      lines.push(`  Missing: ${fc.required.missing.slice(0, 5).join(', ')}`);
    }
    lines.push(`- Recommended fields: ${fc.recommended.filled}/${fc.recommended.total}`);
    lines.push(`- Readiness score: ${Math.round(fc.readinessScore * 100)}%`);
  }

  return lines.join('\n');
}

// ============================================================================
// Main Builder Function
// ============================================================================

/**
 * Build dynamic system prompt with context injection
 *
 * This is the core of the MAX pattern's context injection system.
 * It provides the agent with everything it needs to understand the
 * user's situation without them having to explain it.
 *
 * @param state - Current chat graph state
 * @param availableToolNames - Optional list of tool names available in current context
 */
export function buildSystemPrompt(
  state: ChatGraphState,
  availableToolNames?: string[]
): string {
  const sections: string[] = [BASE_SYSTEM_PROMPT];

  // Dynamic tool availability (if context-aware tools are provided)
  if (availableToolNames && availableToolNames.length > 0) {
    sections.push('\n## Tools Available in Current Context');
    sections.push(
      'Based on your current page, you have access to these tools:\n' +
      availableToolNames.map(name => `- ${name}`).join('\n')
    );

    // Add helpful context notes based on what's available
    if (!state.itemId && !availableToolNames.some(name => name.includes('item'))) {
      sections.push(
        '\n> **Note**: No item is currently in focus. ' +
        'Use search/aggregate tools to find items or get statistics. ' +
        'If the user wants to discuss a specific item, suggest they navigate to it first.'
      );
    }
  }

  // Current date/time (critical for relative date queries)
  sections.push(`\n## Current Date/Time\n**${formatDateTime()}**`);

  // User context
  if (state.userContext) {
    sections.push('\n' + formatUserContext(state.userContext));
  }

  // Chat/page context
  if (state.chatContext) {
    sections.push('\n' + formatChatContext(state.chatContext));
  }

  // Item context (if viewing an item)
  if (state.item) {
    sections.push('\n' + formatItemContext(state.item));
  }

  // Research context (if available)
  if (state.research) {
    sections.push('\n' + formatResearchContext(state.research));
  }

  // Research status notes
  if (state.researchStale) {
    sections.push('\n> **Note:** Research data is over 7 days old. Consider suggesting fresh research.');
  }
  if (state.activeResearchJobId) {
    sections.push(`\n> **Note:** Research job ${state.activeResearchJobId} is currently running.`);
  }

  return sections.join('\n');
}

/**
 * Get a minimal system prompt for simple queries (faster)
 */
export function buildMinimalSystemPrompt(): string {
  return `You are Forge, ListForge's AI assistant. Help users with their inventory management questions. Be concise and helpful.

Current Date/Time: ${formatDateTime()}`;
}
