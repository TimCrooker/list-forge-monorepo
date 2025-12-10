import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MarketplaceAccount, MarketplaceAccountStatus } from '../entities/marketplace-account.entity';
import { EncryptionService } from './encryption.service';
import { RevokeTokenService } from './revoke-token.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { createAdapter, MarketplaceCredentials } from '@listforge/marketplace-adapters';
import { MarketplaceAdapter } from '@listforge/marketplace-adapters';

interface EbayTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface EbayUserInfoResponse {
  username?: string;
  userId?: string;
}

/**
 * OAuth state payload structure
 */
interface OAuthStatePayload {
  orgId: string;
  userId: string;
  timestamp: number;
}

/** State validity duration in milliseconds (15 minutes) */
const STATE_VALIDITY_MS = 15 * 60 * 1000;

@Injectable()
export class MarketplaceAccountService {
  private readonly logger = new Logger(MarketplaceAccountService.name);

  constructor(
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
    private revokeTokenService: RevokeTokenService,
    private auditService: MarketplaceAuditService,
  ) {}

  /**
   * Get HMAC secret for state signing
   */
  private getStateSecret(): string {
    const secret = this.configService.get<string>('OAUTH_STATE_SECRET');
    if (!secret) {
      // Fall back to JWT secret if OAuth state secret not configured
      return this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-production';
    }
    return secret;
  }

  /**
   * Create HMAC-signed OAuth state
   */
  createSignedState(orgId: string, userId: string): string {
    const payload: OAuthStatePayload = {
      orgId,
      userId,
      timestamp: Date.now(),
    };

    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadJson).toString('base64url');

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', this.getStateSecret());
    hmac.update(payloadBase64);
    const signature = hmac.digest('base64url');

    // Combine payload and signature
    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verify and parse HMAC-signed OAuth state
   */
  verifySignedState(state: string): OAuthStatePayload {
    const parts = state.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid state format');
    }

    const [payloadBase64, signature] = parts;

    // Verify signature
    const hmac = crypto.createHmac('sha256', this.getStateSecret());
    hmac.update(payloadBase64);
    const expectedSignature = hmac.digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new BadRequestException('Invalid state signature');
    }

    // Parse payload
    let payload: OAuthStatePayload;
    try {
      const payloadJson = Buffer.from(payloadBase64, 'base64url').toString();
      payload = JSON.parse(payloadJson) as OAuthStatePayload;
    } catch {
      throw new BadRequestException('Invalid state payload');
    }

    // Check timestamp
    const age = Date.now() - payload.timestamp;
    if (age > STATE_VALIDITY_MS) {
      throw new BadRequestException('State expired');
    }

    if (age < 0) {
      throw new BadRequestException('Invalid state timestamp');
    }

    return payload;
  }

  /**
   * Generate eBay OAuth authorization URL
   */
  getEbayAuthUrl(orgId: string, userId: string): string {
    const appId = this.configService.get<string>('EBAY_APP_ID');
    const certId = this.configService.get<string>('EBAY_CERT_ID');
    const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';
    // Frontend callback URL - eBay redirects here, then frontend calls our API
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUri = this.configService.get<string>('EBAY_REDIRECT_URI') ||
      `${frontendUrl}/settings/marketplaces/ebay/callback`;

    if (!appId || !certId) {
      throw new BadRequestException('eBay credentials not configured');
    }

    const baseUrl = sandbox
      ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
      : 'https://auth.ebay.com/oauth2/authorize';

    // Create HMAC-signed state for CSRF protection
    const state = this.createSignedState(orgId, userId);

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      state,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange OAuth code with state verification
   */
  async exchangeEbayCode(
    code: string,
    state: string,
    currentOrgId: string,
    currentUserId: string,
  ): Promise<MarketplaceAccount> {
    // Verify the signed state
    const statePayload = this.verifySignedState(state);

    // Verify the state matches the current user context
    if (statePayload.orgId !== currentOrgId) {
      throw new BadRequestException('Organization mismatch in OAuth state');
    }

    if (statePayload.userId !== currentUserId) {
      throw new BadRequestException('User mismatch in OAuth state');
    }

    // Exchange the code for tokens
    return this.connectEbay(statePayload.orgId, statePayload.userId, code);
  }

  /**
   * Exchange OAuth authorization code for tokens and store account
   */
  async connectEbay(
    orgId: string,
    userId: string,
    authCode: string,
  ): Promise<MarketplaceAccount> {
    const appId = this.configService.get<string>('EBAY_APP_ID');
    const certId = this.configService.get<string>('EBAY_CERT_ID');
    const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';
    // Must match the redirect_uri used in getEbayAuthUrl
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUri = this.configService.get<string>('EBAY_REDIRECT_URI') ||
      `${frontendUrl}/settings/marketplaces/ebay/callback`;

    if (!appId || !certId) {
      throw new BadRequestException('eBay credentials not configured');
    }

    // Exchange code for tokens
    const tokenUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Failed to exchange OAuth code: ${error}`);
    }

    const tokenData = await response.json() as EbayTokenResponse;

    // Get user info to retrieve eBay account ID
    const userInfoResponse = await fetch(
      `${sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com'}/commerce/identity/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    let remoteAccountId: string | null = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json() as EbayUserInfoResponse;
      remoteAccountId = userInfo.username || userInfo.userId || null;
    }

    // Create or update account
    const existingAccount = await this.accountRepo.findOne({
      where: {
        orgId,
        marketplace: 'EBAY',
        remoteAccountId: remoteAccountId || undefined,
      },
    });

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    let savedAccount: MarketplaceAccount;

    if (existingAccount) {
      existingAccount.accessToken = this.encryptionService.encrypt(tokenData.access_token);
      existingAccount.refreshToken = tokenData.refresh_token
        ? this.encryptionService.encrypt(tokenData.refresh_token)
        : existingAccount.refreshToken;
      existingAccount.tokenExpiresAt = expiresAt;
      existingAccount.status = 'active';
      existingAccount.userId = userId;
      savedAccount = await this.accountRepo.save(existingAccount);
    } else {
      const account = this.accountRepo.create({
        orgId,
        userId,
        marketplace: 'EBAY',
        accessToken: this.encryptionService.encrypt(tokenData.access_token),
        refreshToken: tokenData.refresh_token
          ? this.encryptionService.encrypt(tokenData.refresh_token)
          : null,
        tokenExpiresAt: expiresAt,
        remoteAccountId,
        status: 'active',
      });

      savedAccount = await this.accountRepo.save(account);
    }

    // Audit log: Account connected
    await this.auditService.logAccountConnected({
      orgId,
      userId,
      accountId: savedAccount.id,
      marketplace: 'EBAY',
      remoteAccountId: remoteAccountId || undefined,
    }).catch(err => {
      this.logger.error('Failed to log account connection audit', err);
    });

    return savedAccount;
  }

  /**
   * Get adapter instance for an account with decrypted credentials
   * Note: This is used internally by the publish processor which already validates orgId.
   * For controller use, prefer getAdapterForOrg which includes explicit orgId validation.
   */
  async getAdapter(accountId: string): Promise<MarketplaceAdapter> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    return this.createAdapterFromAccount(account);
  }

  /**
   * Get adapter instance with explicit orgId validation (defense in depth)
   */
  async getAdapterForOrg(accountId: string, orgId: string): Promise<MarketplaceAdapter> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    return this.createAdapterFromAccount(account);
  }

  /**
   * Create adapter from account entity
   */
  private createAdapterFromAccount(account: MarketplaceAccount): MarketplaceAdapter {
    const baseCredentials: MarketplaceCredentials = {
      marketplace: account.marketplace,
      accessToken: this.encryptionService.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.encryptionService.decrypt(account.refreshToken)
        : undefined,
      tokenExpiresAt: account.tokenExpiresAt
        ? Math.floor(account.tokenExpiresAt.getTime() / 1000)
        : undefined,
      remoteAccountId: account.remoteAccountId || undefined,
    };

    // Add marketplace-specific credentials
    let credentials: MarketplaceCredentials;
    if (account.marketplace === 'EBAY') {
      credentials = {
        ...baseCredentials,
        appId: this.configService.get<string>('EBAY_APP_ID'),
        certId: this.configService.get<string>('EBAY_CERT_ID'),
        devId: this.configService.get<string>('EBAY_DEV_ID'),
        sandbox: this.configService.get<string>('EBAY_SANDBOX') === 'true',
      };
    } else if (account.marketplace === 'AMAZON') {
      credentials = {
        ...baseCredentials,
        amazonClientId: this.configService.get<string>('AMAZON_CLIENT_ID'),
        amazonClientSecret: this.configService.get<string>('AMAZON_CLIENT_SECRET'),
        amazonRegion: (this.configService.get<string>('AMAZON_REGION') || 'NA') as 'NA' | 'EU' | 'FE',
        amazonMarketplaceId: this.configService.get<string>('AMAZON_MARKETPLACE_ID') || 'ATVPDKIKX0DER',
      };
    } else if (account.marketplace === 'FACEBOOK') {
      credentials = {
        ...baseCredentials,
        facebookAppId: this.configService.get<string>('FACEBOOK_APP_ID'),
        facebookAppSecret: this.configService.get<string>('FACEBOOK_APP_SECRET'),
        facebookCatalogId: account.settings?.facebookCatalogId as string | undefined,
        facebookPageId: account.settings?.facebookPageId as string | undefined,
        facebookBusinessId: account.settings?.facebookBusinessId as string | undefined,
      };
    } else {
      credentials = baseCredentials;
    }

    // Create adapter with token refresh callback
    return createAdapter(account.marketplace, credentials, async (updatedCreds) => {
      await this.updateTokens(account.id, {
        accessToken: updatedCreds.accessToken,
        refreshToken: updatedCreds.refreshToken,
        tokenExpiresAt: updatedCreds.tokenExpiresAt
          ? new Date(updatedCreds.tokenExpiresAt * 1000)
          : null,
      });
    });
  }

  /**
   * Update tokens (called by adapter refresh callback)
   */
  async updateTokens(
    accountId: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt: Date | null;
    },
  ): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    account.accessToken = this.encryptionService.encrypt(tokens.accessToken);
    if (tokens.refreshToken) {
      account.refreshToken = this.encryptionService.encrypt(tokens.refreshToken);
    }
    account.tokenExpiresAt = tokens.tokenExpiresAt;
    account.status = 'active';

    await this.accountRepo.save(account);
  }

  /**
   * Generate Amazon SP-API OAuth authorization URL
   */
  getAmazonAuthUrl(orgId: string, userId: string): string {
    const clientId = this.configService.get<string>('AMAZON_CLIENT_ID');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUri = this.configService.get<string>('AMAZON_REDIRECT_URI') ||
      `${frontendUrl}/settings/marketplaces/amazon/callback`;

    if (!clientId) {
      throw new BadRequestException('Amazon credentials not configured');
    }

    // Create HMAC-signed state for CSRF protection
    const state = this.createSignedState(orgId, userId);

    // Amazon LWA OAuth URL
    const params = new URLSearchParams({
      application_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    return `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`;
  }

  /**
   * Exchange Amazon OAuth code with state verification
   */
  async exchangeAmazonCode(
    code: string,
    state: string,
    sellingPartnerId: string,
    currentOrgId: string,
    currentUserId: string,
  ): Promise<MarketplaceAccount> {
    // Verify the signed state
    const statePayload = this.verifySignedState(state);

    // Verify the state matches the current user context
    if (statePayload.orgId !== currentOrgId) {
      throw new BadRequestException('Organization mismatch in OAuth state');
    }

    if (statePayload.userId !== currentUserId) {
      throw new BadRequestException('User mismatch in OAuth state');
    }

    // Exchange the code for tokens
    return this.connectAmazon(statePayload.orgId, statePayload.userId, code, sellingPartnerId);
  }

  /**
   * Exchange Amazon OAuth authorization code for tokens and store account
   */
  async connectAmazon(
    orgId: string,
    userId: string,
    authCode: string,
    sellingPartnerId: string,
  ): Promise<MarketplaceAccount> {
    const clientId = this.configService.get<string>('AMAZON_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Amazon credentials not configured');
    }

    // Exchange code for tokens via Amazon LWA
    const tokenUrl = 'https://api.amazon.com/auth/o2/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Failed to exchange Amazon OAuth code: ${error}`);
    }

    interface AmazonTokenResponse {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    }

    const tokenData = await response.json() as AmazonTokenResponse;

    // Create or update account
    const existingAccount = await this.accountRepo.findOne({
      where: {
        orgId,
        marketplace: 'AMAZON',
        remoteAccountId: sellingPartnerId,
      },
    });

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    let savedAccount: MarketplaceAccount;

    if (existingAccount) {
      existingAccount.accessToken = this.encryptionService.encrypt(tokenData.access_token);
      existingAccount.refreshToken = tokenData.refresh_token
        ? this.encryptionService.encrypt(tokenData.refresh_token)
        : existingAccount.refreshToken;
      existingAccount.tokenExpiresAt = expiresAt;
      existingAccount.status = 'active';
      existingAccount.userId = userId;
      savedAccount = await this.accountRepo.save(existingAccount);
    } else {
      const account = this.accountRepo.create({
        orgId,
        userId,
        marketplace: 'AMAZON',
        accessToken: this.encryptionService.encrypt(tokenData.access_token),
        refreshToken: tokenData.refresh_token
          ? this.encryptionService.encrypt(tokenData.refresh_token)
          : null,
        tokenExpiresAt: expiresAt,
        remoteAccountId: sellingPartnerId,
        status: 'active',
      });

      savedAccount = await this.accountRepo.save(account);
    }

    // Audit log: Account connected
    await this.auditService.logAccountConnected({
      orgId,
      userId,
      accountId: savedAccount.id,
      marketplace: 'AMAZON',
      remoteAccountId: sellingPartnerId,
    }).catch(err => {
      this.logger.error('Failed to log account connection audit', err);
    });

    return savedAccount;
  }

  // ============ Facebook OAuth ============

  /**
   * Generate Facebook OAuth authorization URL
   */
  getFacebookAuthUrl(orgId: string, userId: string): string {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI') ||
      `${frontendUrl}/settings/marketplaces/facebook/callback`;

    if (!appId) {
      throw new BadRequestException('Facebook credentials not configured');
    }

    // Create HMAC-signed state for CSRF protection
    const state = this.createSignedState(orgId, userId);

    // Facebook OAuth scopes for Commerce Platform
    // Note: marketplace_manage_listings requires Meta Partner approval
    const scopes = [
      'catalog_management',
      'pages_read_engagement',
      'business_management',
      'pages_show_list',
    ].join(',');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      response_type: 'code',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange Facebook OAuth code with state verification
   */
  async exchangeFacebookCode(
    code: string,
    state: string,
    currentOrgId: string,
    currentUserId: string,
  ): Promise<MarketplaceAccount> {
    // Verify the signed state
    const statePayload = this.verifySignedState(state);

    // Verify the state matches the current user context
    if (statePayload.orgId !== currentOrgId) {
      throw new BadRequestException('Organization mismatch in OAuth state');
    }

    if (statePayload.userId !== currentUserId) {
      throw new BadRequestException('User mismatch in OAuth state');
    }

    // Exchange the code for tokens
    return this.connectFacebook(statePayload.orgId, statePayload.userId, code);
  }

  /**
   * Exchange Facebook OAuth authorization code for tokens and store account
   */
  async connectFacebook(
    orgId: string,
    userId: string,
    authCode: string,
  ): Promise<MarketplaceAccount> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI') ||
      `${frontendUrl}/settings/marketplaces/facebook/callback`;

    if (!appId || !appSecret) {
      throw new BadRequestException('Facebook credentials not configured');
    }

    // Step 1: Exchange code for short-lived access token
    const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: authCode,
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`);

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      this.logger.error(`Facebook token exchange failed: ${error}`);
      throw new BadRequestException(`Failed to exchange Facebook OAuth code: ${error}`);
    }

    interface FacebookTokenResponse {
      access_token: string;
      token_type: string;
      expires_in?: number;
    }

    const shortLivedToken = await tokenResponse.json() as FacebookTokenResponse;

    // Step 2: Exchange short-lived token for long-lived token (~60 days)
    const longLivedTokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken.access_token,
    });

    const longLivedResponse = await fetch(`${longLivedTokenUrl}?${longLivedParams.toString()}`);

    let accessToken = shortLivedToken.access_token;
    let expiresIn = shortLivedToken.expires_in || 3600;

    if (longLivedResponse.ok) {
      const longLivedToken = await longLivedResponse.json() as FacebookTokenResponse;
      accessToken = longLivedToken.access_token;
      expiresIn = longLivedToken.expires_in || 5184000; // ~60 days default
      this.logger.log('Successfully exchanged for long-lived Facebook token');
    } else {
      this.logger.warn('Failed to exchange for long-lived token, using short-lived token');
    }

    // Step 3: Get user info
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
    );

    interface FacebookUserInfo {
      id: string;
      name: string;
    }

    let remoteAccountId: string | null = null;
    let accountName = 'Facebook Account';

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json() as FacebookUserInfo;
      remoteAccountId = userInfo.id;
      accountName = userInfo.name;
    }

    // Step 4: Try to get the user's pages (for business accounts)
    let pageId: string | null = null;
    let catalogId: string | null = null;

    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
      );

      if (pagesResponse.ok) {
        interface FacebookPage {
          id: string;
          name: string;
          access_token: string;
        }

        interface FacebookPagesResponse {
          data: FacebookPage[];
        }

        const pagesData = await pagesResponse.json() as FacebookPagesResponse;

        if (pagesData.data && pagesData.data.length > 0) {
          // Use the first page for now (user can change in settings)
          pageId = pagesData.data[0].id;
          this.logger.log(`Found Facebook page: ${pagesData.data[0].name} (${pageId})`);
        }
      }
    } catch (error) {
      this.logger.warn('Could not fetch Facebook pages:', error);
    }

    // Create or update account
    const existingAccount = await this.accountRepo.findOne({
      where: {
        orgId,
        marketplace: 'FACEBOOK',
        remoteAccountId: remoteAccountId || undefined,
      },
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    let savedAccount: MarketplaceAccount;

    const settings = {
      facebookPageId: pageId,
      facebookCatalogId: catalogId,
    };

    if (existingAccount) {
      existingAccount.accessToken = this.encryptionService.encrypt(accessToken);
      existingAccount.tokenExpiresAt = expiresAt;
      existingAccount.status = 'active';
      existingAccount.userId = userId;
      existingAccount.settings = { ...existingAccount.settings, ...settings };
      savedAccount = await this.accountRepo.save(existingAccount);
    } else {
      const account = this.accountRepo.create({
        orgId,
        userId,
        marketplace: 'FACEBOOK',
        accessToken: this.encryptionService.encrypt(accessToken),
        refreshToken: null, // Facebook doesn't use traditional refresh tokens
        tokenExpiresAt: expiresAt,
        remoteAccountId,
        status: 'active',
        settings,
      });

      savedAccount = await this.accountRepo.save(account);
    }

    // Audit log: Account connected
    await this.auditService.logAccountConnected({
      orgId,
      userId,
      accountId: savedAccount.id,
      marketplace: 'FACEBOOK',
      remoteAccountId: remoteAccountId || undefined,
    }).catch(err => {
      this.logger.error('Failed to log account connection audit', err);
    });

    return savedAccount;
  }

  /**
   * Manually refresh tokens for an account (with org validation)
   * Supports eBay, Amazon, and Facebook marketplaces
   */
  async refreshTokens(accountId: string, orgId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    if (!account.refreshToken) {
      throw new BadRequestException(
        'No refresh token available. Please reconnect your account.'
      );
    }

    // Delegate to marketplace-specific refresh method
    if (account.marketplace === 'EBAY') {
      await this.refreshEbayTokens(account);
    } else if (account.marketplace === 'AMAZON') {
      await this.refreshAmazonTokens(account);
    } else if (account.marketplace === 'FACEBOOK') {
      await this.refreshFacebookTokens(account);
    } else {
      throw new BadRequestException(
        `Token refresh not supported for marketplace: ${account.marketplace}`
      );
    }

    this.logger.log(`Successfully refreshed tokens for account ${accountId} (${account.marketplace})`);

    // Audit log: Token refreshed (manual)
    await this.auditService.logTokenRefreshed({
      orgId,
      userId: orgId, // Manual refresh is user-initiated (userId should be passed in, but using orgId for now)
      accountId,
      marketplace: account.marketplace,
      automatic: false,
    }).catch(err => {
      this.logger.error('Failed to log token refresh audit', err);
    });
  }

  /**
   * Refresh eBay OAuth tokens
   * @private
   */
  private async refreshEbayTokens(account: MarketplaceAccount): Promise<void> {
    const appId = this.configService.get<string>('EBAY_APP_ID');
    const certId = this.configService.get<string>('EBAY_CERT_ID');
    const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';

    if (!appId || !certId) {
      throw new BadRequestException('eBay credentials not configured');
    }

    const tokenUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
    const refreshToken = this.encryptionService.decrypt(account.refreshToken!);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`eBay token refresh failed for account ${account.id}: ${error}`);

      // Mark as expired on refresh failure
      account.status = 'expired';
      await this.accountRepo.save(account);

      throw new BadRequestException(
        'Failed to refresh eBay token. The refresh token may have expired. Please reconnect your account.'
      );
    }

    const tokenData = await response.json() as EbayTokenResponse;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await this.updateTokens(account.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      tokenExpiresAt: expiresAt,
    });
  }

  /**
   * Refresh Amazon SP-API OAuth tokens
   * @private
   */
  private async refreshAmazonTokens(account: MarketplaceAccount): Promise<void> {
    const clientId = this.configService.get<string>('AMAZON_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Amazon credentials not configured');
    }

    const tokenUrl = 'https://api.amazon.com/auth/o2/token';
    const refreshToken = this.encryptionService.decrypt(account.refreshToken!);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Amazon token refresh failed for account ${account.id}: ${error}`);

      // Mark as expired on refresh failure
      account.status = 'expired';
      await this.accountRepo.save(account);

      throw new BadRequestException(
        'Failed to refresh Amazon token. The refresh token may have expired. Please reconnect your account.'
      );
    }

    interface AmazonTokenResponse {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    }

    const tokenData = await response.json() as AmazonTokenResponse;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await this.updateTokens(account.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      tokenExpiresAt: expiresAt,
    });
  }

  /**
   * Refresh Facebook access token
   * Facebook uses long-lived tokens that can be refreshed before expiry
   * @private
   */
  private async refreshFacebookTokens(account: MarketplaceAccount): Promise<void> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret) {
      throw new BadRequestException('Facebook credentials not configured');
    }

    // Facebook long-lived tokens can be refreshed by exchanging them again
    // This only works if the token hasn't expired yet
    const currentToken = this.encryptionService.decrypt(account.accessToken);

    const refreshUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: currentToken,
    });

    const response = await fetch(`${refreshUrl}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Facebook token refresh failed for account ${account.id}: ${error}`);

      // Mark as expired on refresh failure
      account.status = 'expired';
      await this.accountRepo.save(account);

      throw new BadRequestException(
        'Failed to refresh Facebook token. The token may have expired. Please reconnect your account.'
      );
    }

    interface FacebookTokenResponse {
      access_token: string;
      token_type: string;
      expires_in?: number;
    }

    const tokenData = await response.json() as FacebookTokenResponse;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 5184000 * 1000); // ~60 days default

    await this.updateTokens(account.id, {
      accessToken: tokenData.access_token,
      tokenExpiresAt: expiresAt,
    });
  }

  /**
   * List all marketplace accounts for an organization
   */
  async listAccounts(orgId: string): Promise<MarketplaceAccount[]> {
    return await this.accountRepo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revoke/disconnect a marketplace account
   *
   * This method attempts to revoke the token remotely at the marketplace API,
   * then marks the account as revoked locally. Uses graceful degradation:
   * if remote revocation fails, the account is still marked as revoked locally
   * to prevent reuse within our system.
   */
  async revokeAccount(accountId: string, orgId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    // Attempt remote token revocation (if token exists)
    if (account.accessToken) {
      try {
        // Decrypt the access token for revocation
        const decryptedAccessToken = this.encryptionService.decrypt(account.accessToken);

        // Attempt to revoke token at marketplace API
        const result = await this.revokeTokenService.revokeToken(
          account.marketplace,
          decryptedAccessToken,
        );

        if (result.success) {
          this.logger.log(`Successfully revoked ${account.marketplace} token remotely for account ${accountId}`);
        } else {
          this.logger.warn(
            `Failed to revoke ${account.marketplace} token remotely for account ${accountId}: ${result.error}. Proceeding with local revocation.`,
          );
        }
      } catch (error) {
        // Log error but don't throw - graceful degradation
        this.logger.error(
          `Error during remote token revocation for account ${accountId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // Mark account as revoked locally (always do this, regardless of remote success)
    account.status = 'revoked';
    await this.accountRepo.save(account);

    this.logger.log(`Account ${accountId} marked as revoked locally`);

    // Audit log: Account disconnected
    const remoteRevoked = account.accessToken ? true : false; // If we had a token to revoke
    await this.auditService.logAccountDisconnected({
      orgId,
      userId: orgId, // User ID should be passed in from controller, but using orgId for now
      accountId,
      marketplace: account.marketplace,
      remoteRevoked,
    }).catch(err => {
      this.logger.error('Failed to log account disconnection audit', err);
    });
  }

  /**
   * Get account by ID (with org validation)
   */
  async getAccount(accountId: string, orgId: string): Promise<MarketplaceAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    return account;
  }
}

