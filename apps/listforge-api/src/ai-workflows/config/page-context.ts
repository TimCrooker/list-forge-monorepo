/**
 * Page Context Registry
 *
 * Maps route names to human-readable descriptions and metadata.
 * This is used by the system prompt builder to give the agent
 * context about what page the user is currently viewing.
 */

export interface PageDefinition {
  name: string;
  description: string;
  features?: string[];
  states?: Record<string, StateDefinition>;
}

export interface StateDefinition {
  meaning: string;
  implications: string[];
  nextActions?: string[];
}

/**
 * Page definitions for all app routes
 */
export const PAGES: Record<string, PageDefinition> = {
  // Dashboard
  'dashboard': {
    name: 'Dashboard',
    description: 'Overview of inventory, recent activity, and quick access to tasks',
    features: [
      'Inventory statistics',
      'Recent items',
      'Items needing attention',
      'Quick links to common actions',
    ],
  },

  // Items
  'items': {
    name: 'Items List',
    description: 'View and manage all inventory items with filtering and sorting',
    features: [
      'Search and filter items',
      'Bulk actions',
      'Quick view item details',
      'Sort by date, price, status',
    ],
  },

  'item_detail': {
    name: 'Item Detail',
    description: 'View and edit item details, pricing, research, and listing preview',
    features: [
      'Edit item fields',
      'View AI research and pricing',
      'Preview marketplace listing',
      'Manage photos',
      'View comparable sales',
    ],
    states: {
      'draft': {
        meaning: 'Item is being prepared, not yet ready for listing',
        implications: ['May be missing required fields', 'Research may not be complete'],
        nextActions: ['Complete required fields', 'Run research', 'Upload photos'],
      },
      'ready': {
        meaning: 'Item is ready to be listed on marketplace',
        implications: ['All required fields filled', 'Pricing set', 'Photos uploaded'],
        nextActions: ['Review and approve', 'Publish to marketplace'],
      },
      'listed': {
        meaning: 'Item is currently listed on one or more marketplaces',
        implications: ['Active listing', 'Changes may sync to marketplace'],
        nextActions: ['Monitor listing', 'Adjust price if needed', 'End listing'],
      },
      'sold': {
        meaning: 'Item has been sold',
        implications: ['Transaction complete', 'Listing ended'],
        nextActions: ['Ship item', 'Mark as shipped', 'Archive'],
      },
    },
  },

  // Review
  'review': {
    name: 'Review Queue',
    description: 'Review AI-processed items before publishing to marketplaces',
    features: [
      'Approve or reject AI suggestions',
      'Edit fields before approval',
      'View AI confidence scores',
      'Bulk approve/reject',
    ],
    states: {
      'pending': {
        meaning: 'Item awaiting human review',
        implications: ['AI has processed item', 'May need verification'],
        nextActions: ['Review details', 'Approve or reject', 'Edit if needed'],
      },
      'approved': {
        meaning: 'Item approved and ready for listing',
        implications: ['Human verified', 'Ready to publish'],
        nextActions: ['Publish to marketplace'],
      },
      'rejected': {
        meaning: 'Item rejected and needs rework',
        implications: ['AI suggestions not accurate', 'Needs manual editing'],
        nextActions: ['Edit item details', 'Re-run research', 'Resubmit for review'],
      },
      'needs_work': {
        meaning: 'Item needs additional information or corrections',
        implications: ['Missing required data', 'Low confidence in some fields'],
        nextActions: ['Add missing information', 'Upload better photos', 'Re-run research'],
      },
    },
  },

  // Capture
  'capture': {
    name: 'Capture',
    description: 'Add new items to inventory via photo upload',
    features: [
      'Upload item photos',
      'Add optional description/hint',
      'AI auto-processes uploaded items',
      'Batch upload support',
    ],
  },

  // Settings
  'settings': {
    name: 'Settings',
    description: 'Configure account, preferences, and integrations',
    features: [
      'Account settings',
      'Notification preferences',
      'Marketplace connections',
      'Organization settings',
    ],
  },

  'settings_marketplaces': {
    name: 'Marketplace Settings',
    description: 'Connect and manage marketplace accounts (eBay, Amazon, etc.)',
    features: [
      'Connect new marketplace',
      'Manage OAuth tokens',
      'Configure default settings',
      'View sync status',
    ],
  },

  'settings_organization': {
    name: 'Organization Settings',
    description: 'Manage organization members, billing, and preferences',
    features: [
      'Manage team members',
      'Set roles and permissions',
      'Billing and subscription',
      'Organization preferences',
    ],
  },

  // Needs Work
  'needs_work': {
    name: 'Needs Work',
    description: 'Items flagged as needing attention or additional information',
    features: [
      'View items with issues',
      'See why each item was flagged',
      'Quick actions to fix issues',
    ],
  },
};

/**
 * Get page definition by route name
 */
export function getPageDefinition(routeName: string): PageDefinition | undefined {
  return PAGES[routeName];
}

/**
 * Get state definition for a page/state combination
 */
export function getStateDefinition(
  routeName: string,
  stateName: string,
): StateDefinition | undefined {
  const page = PAGES[routeName];
  return page?.states?.[stateName];
}

/**
 * Get all available route names
 */
export function getAvailableRoutes(): string[] {
  return Object.keys(PAGES);
}

/**
 * Map URL path to route name
 */
export function pathToRouteName(path: string): string {
  if (!path || path === '/') return 'dashboard';

  // Remove leading slash and split
  const segments = path.replace(/^\//, '').split('/');

  // Handle dynamic routes
  if (segments[0] === 'items' && segments.length > 1) {
    return 'item_detail';
  }
  if (segments[0] === 'settings' && segments.length > 1) {
    return `settings_${segments[1]}`;
  }
  if (segments[0] === 'needs-work') {
    return 'needs_work';
  }

  return segments[0];
}
