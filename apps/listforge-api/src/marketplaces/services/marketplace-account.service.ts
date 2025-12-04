import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MarketplaceAccount, MarketplaceAccountStatus } from '../entities/marketplace-account.entity';
import { EncryptionService } from './encryption.service';
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
  constructor(
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
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

    if (existingAccount) {
      existingAccount.accessToken = this.encryptionService.encrypt(tokenData.access_token);
      existingAccount.refreshToken = tokenData.refresh_token
        ? this.encryptionService.encrypt(tokenData.refresh_token)
        : existingAccount.refreshToken;
      existingAccount.tokenExpiresAt = expiresAt;
      existingAccount.status = 'active';
      existingAccount.userId = userId;
      return await this.accountRepo.save(existingAccount);
    }

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

    return await this.accountRepo.save(account);
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
    const credentials: MarketplaceCredentials = {
      marketplace: account.marketplace,
      accessToken: this.encryptionService.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.encryptionService.decrypt(account.refreshToken)
        : undefined,
      tokenExpiresAt: account.tokenExpiresAt
        ? Math.floor(account.tokenExpiresAt.getTime() / 1000)
        : undefined,
      appId: this.configService.get<string>('EBAY_APP_ID'),
      certId: this.configService.get<string>('EBAY_CERT_ID'),
      devId: this.configService.get<string>('EBAY_DEV_ID'),
      sandbox: this.configService.get<string>('EBAY_SANDBOX') === 'true',
      remoteAccountId: account.remoteAccountId || undefined,
    };

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
   * Manually refresh tokens
   */
  async refreshTokens(accountId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    if (!account.refreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    const appId = this.configService.get<string>('EBAY_APP_ID');
    const certId = this.configService.get<string>('EBAY_CERT_ID');
    const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';

    const tokenUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
    const refreshToken = this.encryptionService.decrypt(account.refreshToken);

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
      account.status = 'expired';
      await this.accountRepo.save(account);
      throw new BadRequestException('Failed to refresh token');
    }

    const tokenData = await response.json() as EbayTokenResponse;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await this.updateTokens(accountId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
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
   */
  async revokeAccount(accountId: string, orgId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, orgId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    account.status = 'revoked';
    await this.accountRepo.save(account);
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

