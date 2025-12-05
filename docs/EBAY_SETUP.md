# eBay Connector Local Setup Guide

This guide walks you through setting up the eBay connector for local development and testing.

## Prerequisites

- eBay Developer Account
- Local development environment running (PostgreSQL, Redis)
- Application running locally

## Part 1: eBay Developer Portal Setup

### 1. Create an eBay Developer Account

1. Go to [eBay Developers Program](https://developer.ebay.com/)
2. Sign in with your eBay account or create a new one
3. Complete the developer registration process

### 2. Create an Application

1. Navigate to [My Account > Keys](https://developer.ebay.com/my/keys)
2. Click **"Create an App Key"** or **"Request Production Keys"**
3. Fill in the application details:
   - **Application Title**: ListForge (or your preferred name)
   - **Application Type**: Select **"Web"**
   - **OAuth Redirect URI(s)**:
     - For local development: `http://localhost:3000/settings/marketplaces`
     - For production: `https://your-domain.com/settings/marketplaces`

   **Important:** The redirect URI should be `/settings/marketplaces` (NOT `/settings/marketplaces/ebay/callback`). The frontend route handles the callback by reading `code` and `state` query parameters.
   - **Environment**: Select **"Sandbox"** for testing (recommended for local dev)

### 3. Get Your Credentials

After creating the app, you'll receive:

- **App ID (Client ID)** - This is your `EBAY_APP_ID`
- **Cert ID (Client Secret)** - This is your `EBAY_CERT_ID`
- **Dev ID** (optional) - This is your `EBAY_DEV_ID` (only needed for certain API features)

**Important Notes:**

- Sandbox credentials are different from Production credentials
- Sandbox allows testing without affecting real eBay accounts
- You'll need separate credentials for production deployment

### 4. Configure OAuth Redirect URI

The redirect URI must match exactly what you configure in your application:

**For Local Development:**

```
http://localhost:3000/settings/marketplaces
```

**For Production:**

```
https://your-domain.com/settings/marketplaces
```

**Note:** The application expects the callback to include `code` and `state` query parameters. The frontend route `/settings/marketplaces` handles these automatically.

## Part 2: Application Configuration

### 1. Environment Variables

Create or update your `.env` file in `apps/listforge-api/` with the following eBay-related variables:

```bash
# eBay Marketplace Configuration
# Required for eBay OAuth and API access

# eBay Application ID (App ID) - Get from https://developer.ebay.com/my/keys
EBAY_APP_ID=YourAppIdHere

# eBay Certificate ID (Client Secret) - Get from https://developer.ebay.com/my/keys
EBAY_CERT_ID=YourCertIdHere

# eBay Developer ID (optional, for some API features)
# EBAY_DEV_ID=YourDevIdHere

# Use eBay Sandbox environment (true/false)
# Set to 'true' for local development/testing
# Set to 'false' for production
EBAY_SANDBOX=true

# eBay OAuth redirect URI (optional)
# Defaults to: FRONTEND_URL + /settings/marketplaces/ebay/callback
# However, the frontend route is /settings/marketplaces, so you may need to set this explicitly:
EBAY_REDIRECT_URI=http://localhost:3000/settings/marketplaces

# Frontend URL (required for OAuth redirect)
# This should match your local frontend URL
FRONTEND_URL=http://localhost:3000

# OAuth State Secret (optional)
# Used for signing OAuth state parameter (CSRF protection)
# Defaults to JWT_SECRET if not set
# OAUTH_STATE_SECRET=your-secret-here
```

### 2. Required Environment Variables Summary

**Minimum Required:**

- `EBAY_APP_ID` - Your eBay App ID
- `EBAY_CERT_ID` - Your eBay Cert ID
- `EBAY_SANDBOX` - Set to `true` for sandbox/testing
- `FRONTEND_URL` - Your frontend URL (defaults to `http://localhost:3000`)
- `EBAY_REDIRECT_URI` - **Recommended:** Set explicitly to `http://localhost:3000/settings/marketplaces` (backend defaults to `/ebay/callback` which doesn't match the frontend route)

**Optional:**

- `EBAY_DEV_ID` - Only needed for certain eBay API features
- `OAUTH_STATE_SECRET` - Custom secret for OAuth state signing (defaults to `JWT_SECRET`)

### 3. Other Required Environment Variables

Make sure you also have these configured (for the app to run):

```bash
# Database
DATABASE_URL=postgresql://listforge:listforge@localhost:5432/listforge_dev
# OR use individual DB vars:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=listforge
# DB_PASSWORD=listforge
# DB_NAME=listforge_dev

# Redis (now required)
REDIS_URL=redis://localhost:6379
# OR use individual Redis vars:
# REDIS_HOST=localhost
# REDIS_PORT=6379

# JWT Secret (for authentication)
JWT_SECRET=your-jwt-secret-here

# OpenAI API Key (for AI workflows)
OPENAI_API_KEY=your-openai-key-here
```

## Part 3: Local Development Setup

### 1. Start Required Services

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

This starts:

- PostgreSQL on port 5432
- Redis on port 6379

### 2. Start the Application

```bash
# From the monorepo root
pnpm dev
```

This starts:

- API server on `http://localhost:3001`
- Web frontend on `http://localhost:3000`

### 3. Verify Configuration

1. Check that the API server starts without errors
2. Check browser console for any configuration warnings
3. Navigate to `http://localhost:3000/settings/marketplaces`

## Part 4: Testing the eBay Connection

### 1. Connect eBay Account

1. Navigate to **Settings > Marketplace Connections** in the web app
2. Click **"Connect"** next to eBay
3. You should be redirected to eBay's OAuth page
4. Sign in with your eBay Sandbox test account (or real account if using production)
5. Authorize the application
6. You should be redirected back to the app with a success message

### 2. Verify Connection

After connecting, you should see:

- eBay account listed under "Connected Accounts"
- Status showing as "active"
- Your eBay username/account ID displayed

### 3. Test API Calls

Once connected, you can test:

- Creating listings
- Publishing to eBay
- Searching for comps on eBay

## Troubleshooting

### Issue: "eBay credentials not configured" error

**Solution:** Make sure `EBAY_APP_ID` and `EBAY_CERT_ID` are set in your `.env` file and the API server has been restarted.

### Issue: Redirect URI mismatch

**Error:** "redirect_uri_mismatch" from eBay

**Solution:**

1. **Important:** The backend defaults to `/settings/marketplaces/ebay/callback`, but the frontend route is `/settings/marketplaces`. You must set `EBAY_REDIRECT_URI` explicitly:

   ```bash
   EBAY_REDIRECT_URI=http://localhost:3000/settings/marketplaces
   ```

2. Verify the redirect URI in eBay Developer Portal matches exactly: `http://localhost:3000/settings/marketplaces`
3. Check that `FRONTEND_URL` in your `.env` matches your actual frontend URL
4. The redirect URI must match in both places (eBay Developer Portal and your `.env` file)

### Issue: OAuth state verification failed

**Solution:**

1. Make sure `OAUTH_STATE_SECRET` is set (or `JWT_SECRET` is set as fallback)
2. Don't manually modify the `state` parameter in the URL
3. Complete the OAuth flow within 15 minutes (state expires after 15 minutes)

### Issue: "Cannot GET /api/marketplaces/accounts"

**Solution:** This means Redis is not configured. Make sure:

1. Redis is running (`docker-compose up -d` or local Redis instance)
2. `REDIS_URL` or `REDIS_HOST` is set in your `.env` file
3. API server has been restarted

### Issue: Sandbox vs Production

**For Local Development:**

- Use Sandbox credentials (`EBAY_SANDBOX=true`)
- Create a Sandbox test account at [eBay Sandbox](https://developer.ebay.com/DevZone/sandbox/)
- Use Sandbox redirect URI in eBay Developer Portal

**For Production:**

- Use Production credentials (`EBAY_SANDBOX=false`)
- Use your production domain in redirect URI
- Real eBay accounts will be used

## eBay API Scopes

The application requests the following eBay API scopes:

- `https://api.ebay.com/oauth/api_scope` - Basic API access
- `https://api.ebay.com/oauth/api_scope/sell.marketing.readonly` - Read marketing data
- `https://api.ebay.com/oauth/api_scope/sell.marketing` - Manage marketing
- `https://api.ebay.com/oauth/api_scope/sell.inventory.readonly` - Read inventory
- `https://api.ebay.com/oauth/api_scope/sell.inventory` - Manage inventory
- `https://api.ebay.com/oauth/api_scope/sell.account.readonly` - Read account data
- `https://api.ebay.com/oauth/api_scope/sell.account` - Manage account
- `https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly` - Read fulfillment data
- `https://api.ebay.com/oauth/api_scope/sell.fulfillment` - Manage fulfillment

These scopes allow the application to:

- Create and manage listings
- Read account information
- Handle orders and fulfillment
- Manage inventory

## Additional Resources

- [eBay Developers Program](https://developer.ebay.com/)
- [eBay OAuth Documentation](https://developer.ebay.com/api-docs/static/oauth-authorization-code-grant.html)
- [eBay Sandbox Guide](https://developer.ebay.com/DevZone/sandbox/)
- [eBay API Reference](https://developer.ebay.com/docs)

## Security Notes

1. **Never commit credentials** - Keep `.env` files in `.gitignore`
2. **Use Sandbox for testing** - Always test with Sandbox before using Production
3. **Rotate credentials** - If credentials are compromised, regenerate them in eBay Developer Portal
4. **Use environment-specific configs** - Different credentials for dev/staging/production
5. **OAuth State Protection** - The app uses HMAC-signed state parameters to prevent CSRF attacks
