import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TokenRevocationResult {
  success: boolean;
  marketplace: 'EBAY' | 'AMAZON';
  error?: string;
}

/**
 * RevokeTokenService
 *
 * Handles remote revocation of OAuth tokens at marketplace APIs.
 * Provides graceful degradation - if remote revocation fails, tokens
 * are still marked as revoked locally to prevent reuse.
 */
@Injectable()
export class RevokeTokenService {
  private readonly logger = new Logger(RevokeTokenService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Revoke eBay OAuth access token
   *
   * Calls eBay's token revocation endpoint to invalidate the token.
   * Uses HTTP Basic Auth with App ID and Cert ID.
   *
   * @param accessToken - The access token to revoke (decrypted)
   * @returns Promise with revocation result
   */
  async revokeEbayToken(accessToken: string): Promise<TokenRevocationResult> {
    const appId = this.configService.get<string>('EBAY_APP_ID');
    const certId = this.configService.get<string>('EBAY_CERT_ID');
    const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';

    if (!appId || !certId) {
      this.logger.warn('eBay credentials not configured. Cannot revoke token remotely.');
      return {
        success: false,
        marketplace: 'EBAY',
        error: 'eBay credentials not configured',
      };
    }

    const revokeUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/revoke'
      : 'https://api.ebay.com/identity/v1/oauth2/revoke';

    try {
      // Create Basic Auth header
      const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

      // Call revocation endpoint
      const response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          token: accessToken,
          token_type_hint: 'ACCESS_TOKEN',
        }).toString(),
      });

      if (response.ok) {
        this.logger.log('Successfully revoked eBay token');
        return { success: true, marketplace: 'EBAY' };
      }

      // eBay returns 200 even if token already revoked or invalid
      // Non-200 responses indicate a system error
      const errorText = await response.text();
      this.logger.warn(`eBay token revocation returned non-200 status: ${response.status}`, {
        status: response.status,
        error: errorText,
      });

      return {
        success: false,
        marketplace: 'EBAY',
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      this.logger.error('Failed to revoke eBay token', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        marketplace: 'EBAY',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Revoke Amazon OAuth access token
   *
   * Note: Amazon SP-API uses Login with Amazon (LWA) for OAuth.
   * Token revocation may not be explicitly supported by all Amazon APIs.
   * This method provides a placeholder for future implementation.
   *
   * @param accessToken - The access token to revoke (decrypted)
   * @returns Promise with revocation result
   */
  async revokeAmazonToken(accessToken: string): Promise<TokenRevocationResult> {
    // Amazon LWA token revocation endpoint (if available)
    // https://developer.amazon.com/docs/login-with-amazon/revoke-token.html

    const clientId = this.configService.get<string>('AMAZON_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('Amazon credentials not configured. Cannot revoke token remotely.');
      return {
        success: false,
        marketplace: 'AMAZON',
        error: 'Amazon credentials not configured',
      };
    }

    try {
      // Amazon LWA revocation endpoint
      const response = await fetch('https://api.amazon.com/auth/o2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      if (response.ok) {
        this.logger.log('Successfully revoked Amazon token');
        return { success: true, marketplace: 'AMAZON' };
      }

      const errorText = await response.text();
      this.logger.warn(`Amazon token revocation returned non-200 status: ${response.status}`, {
        status: response.status,
        error: errorText,
      });

      return {
        success: false,
        marketplace: 'AMAZON',
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      this.logger.error('Failed to revoke Amazon token', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        marketplace: 'AMAZON',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Revoke token for any marketplace
   *
   * Routes to the appropriate marketplace-specific revocation method.
   *
   * @param marketplace - The marketplace type
   * @param accessToken - The access token to revoke (decrypted)
   * @returns Promise with revocation result
   */
  async revokeToken(
    marketplace: 'EBAY' | 'AMAZON',
    accessToken: string,
  ): Promise<TokenRevocationResult> {
    if (marketplace === 'EBAY') {
      return this.revokeEbayToken(accessToken);
    } else if (marketplace === 'AMAZON') {
      return this.revokeAmazonToken(accessToken);
    }

    this.logger.warn(`Token revocation not supported for marketplace: ${marketplace}`);
    return {
      success: false,
      marketplace,
      error: 'Marketplace not supported',
    };
  }
}
