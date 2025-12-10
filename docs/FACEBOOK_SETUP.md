# Facebook Marketplace Integration Setup

This guide walks you through setting up Facebook Marketplace integration for ListForge.

## Overview

Facebook Marketplace integration allows you to:
- List products directly to Facebook Marketplace from ListForge
- Manage listings (update, delete) via the Facebook Commerce API
- Receive webhook notifications for catalog updates

## Prerequisites

Before starting, you'll need:
- A Facebook account
- A Facebook Business Manager account
- A Facebook Page (for your business)
- Business Verification completed in Meta Business Suite

## Step 1: Create a Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **Get Started** and log in with your Facebook account
3. Accept the Meta Developer Terms

## Step 2: Create a Facebook App

1. Go to [My Apps](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Choose **Business** as the app type
4. Fill in:
   - App name: "ListForge" (or your preferred name)
   - App contact email: Your email
   - Business Account: Select your business (or create one)
5. Click **Create App**

## Step 3: Configure App Settings

### Basic Settings

1. Go to **App Settings > Basic**
2. Note down your:
   - **App ID** - Use as `FACEBOOK_APP_ID`
   - **App Secret** - Use as `FACEBOOK_APP_SECRET` (click Show to reveal)
3. Add your app domains (e.g., `localhost`, `yourdomain.com`)
4. Add Privacy Policy URL and Terms of Service URL (required for production)

### Add Products

1. In the left sidebar, click **Add Product**
2. Add the following products:
   - **Facebook Login** - For OAuth authentication
   - **Webhooks** - For receiving catalog updates (optional but recommended)

### Configure Facebook Login

1. Go to **Facebook Login > Settings**
2. Set **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:3000/settings/marketplaces`
   - Production: `https://yourdomain.com/settings/marketplaces`
3. Save changes

## Step 4: Request Required Permissions

### Required Permissions

For Facebook Marketplace integration, you need these permissions:

| Permission | Purpose | Review Required |
|------------|---------|-----------------|
| `catalog_management` | Create and manage product catalogs | Yes |
| `pages_read_engagement` | Read page information | Yes |
| `business_management` | Manage business assets | Yes |
| `marketplace_manage_listings` | Post to Marketplace | Yes (Restricted) |

### Requesting App Review

1. Go to **App Review > Permissions and Features**
2. Click **Request** next to each required permission
3. For each permission, provide:
   - Detailed use case description
   - Step-by-step instructions for the reviewer
   - Screencast video demonstrating the feature
   - Privacy policy explaining data usage

**Note:** The `marketplace_manage_listings` permission is restricted and requires:
- Business Verification
- App Review approval
- Compliance with Commerce Policies

### Business Verification

1. Go to [Meta Business Suite](https://business.facebook.com/settings/info)
2. Complete Business Verification:
   - Add business documents
   - Verify your domain
   - Complete security check
3. Verification typically takes 1-4 weeks

## Step 5: Set Up Product Catalog

1. Go to [Commerce Manager](https://business.facebook.com/commerce/)
2. Click **Create Catalog** or use an existing one
3. Choose **E-commerce** as the catalog type
4. Note down your **Catalog ID** - Users will enter this when connecting their account

## Step 6: Configure Webhooks (Optional)

Webhooks notify ListForge when catalog items change.

### Set Up Webhook Endpoint

1. Go to **Webhooks** in your app dashboard
2. Click **Add Callback URL**
3. Enter:
   - **Callback URL**: `https://yourdomain.com/api/marketplaces/webhooks/facebook`
   - **Verify Token**: A custom string (use as `FACEBOOK_VERIFY_TOKEN`)
4. Click **Verify and Save**

### Subscribe to Events

1. Under **product_catalog**, subscribe to:
   - `product_update` - When products are added/updated/deleted
   - `feed_status_change` - When catalog feed status changes

## Step 7: Configure Environment Variables

Add these to your `.env` file:

```bash
# Facebook Marketplace Configuration
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

## Step 8: Test the Integration

### Development Mode

While your app is in Development Mode:
- Only app administrators and testers can authenticate
- Add test users in **App Roles > Roles**
- Full functionality is available for testing

### Testing OAuth Flow

1. Start ListForge locally
2. Go to Settings > Marketplace Connections
3. Click **Connect** next to Facebook Marketplace
4. Complete the OAuth flow
5. Verify the account appears in Connected Accounts

### Testing Listing Creation

1. Create an item in ListForge
2. Complete research and approval
3. Publish to Facebook Marketplace
4. Verify the listing appears in your catalog

## Troubleshooting

### Common Issues

#### "App Not Set Up" Error
- Ensure Facebook Login product is added
- Verify redirect URI matches exactly

#### "Permission Denied" Error
- Check if you have the required permissions
- Verify Business Verification is complete
- Ensure you're logged in as an app admin/tester

#### "Invalid Token" Error
- Facebook tokens expire after ~60 days
- Users may need to reconnect their account
- Check if the token has been revoked

#### Webhook Not Receiving Events
- Verify the callback URL is publicly accessible
- Check the verify token matches
- Ensure you've subscribed to the correct events

### Logs and Debugging

Check the API logs for Facebook-related errors:
```bash
# View Facebook adapter logs
grep -i "facebook" logs/api.log
```

## Production Checklist

Before going live:

- [ ] Complete Business Verification
- [ ] Pass App Review for all required permissions
- [ ] Configure production redirect URIs
- [ ] Set up production webhook endpoint with HTTPS
- [ ] Test full flow with a production catalog
- [ ] Configure rate limiting (Facebook allows ~200 listings/hour)
- [ ] Set up monitoring for token expiration

## Rate Limits

Facebook Graph API has the following rate limits:
- ~200 API calls per hour per user
- Catalog updates: ~200 products per hour
- Consider batching updates for large catalogs

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Verify webhook signatures** - Always check `x-hub-signature-256`
3. **Use HTTPS** - Required for production webhooks
4. **Rotate app secret** if compromised
5. **Monitor token expiration** - Tokens expire after ~60 days

## Support Resources

- [Facebook Commerce Platform Documentation](https://developers.facebook.com/docs/commerce-platform/)
- [Graph API Product Reference](https://developers.facebook.com/docs/graph-api/reference/product-catalog/)
- [Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Meta Business Help Center](https://www.facebook.com/business/help)

## Appendix: OAuth Scopes Reference

| Scope | Description |
|-------|-------------|
| `catalog_management` | Manage product catalogs |
| `pages_read_engagement` | Read page data and engagement |
| `business_management` | Manage business assets and settings |
| `pages_show_list` | Show list of pages user manages |
| `marketplace_manage_listings` | Create and manage Marketplace listings |
