import { MarketplaceType, MarketplaceCredentials, MarketplaceAdapter, TokenRefreshCallback } from './types';
import { EbayAdapter } from './adapters/ebay.adapter';

/**
 * Creates a marketplace adapter instance with credentials
 *
 * @param type - Marketplace type
 * @param credentials - OAuth credentials and app config
 * @param onTokenRefresh - Optional callback when tokens are refreshed
 * @returns Adapter instance
 */
export function createAdapter(
  type: MarketplaceType,
  credentials: MarketplaceCredentials,
  onTokenRefresh?: TokenRefreshCallback
): MarketplaceAdapter {
  switch (type) {
    case 'EBAY':
      return new EbayAdapter(credentials, onTokenRefresh);
    case 'AMAZON':
      throw new Error('Amazon adapter not yet implemented');
    default:
      throw new Error(`Unsupported marketplace type: ${type}`);
  }
}

