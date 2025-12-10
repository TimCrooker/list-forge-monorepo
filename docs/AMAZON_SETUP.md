# Amazon & Product Research Setup Guide

This guide walks you through setting up Amazon product research capabilities for local development and testing.

## Overview

ListForge uses multiple services for comprehensive product research:

1. **Keepa API** - Historical Amazon pricing and sales data (Recommended)
2. **Amazon SP-API** - Current product catalog and real-time data (Optional)
3. **UPC Database** - Barcode-based product lookup (Optional)

**Quick Start Recommendation:** Start with just Keepa - it provides 90% of the functionality with minimal setup complexity.

---

## Part 1: Keepa API Setup (Recommended)

Keepa provides historical Amazon pricing, sales rank data, and product information. This is the easiest and most valuable integration to set up.

### Benefits of Keepa

- ✅ Simple setup (just one API key)
- ✅ Historical price data (90+ days)
- ✅ Sales rank (BSR) trends
- ✅ UPC/EAN to ASIN lookups
- ✅ Price statistics (avg, min, max)
- ✅ Review counts and ratings
- ✅ Price drop predictions
- ✅ Buy box price tracking

### 1. Get a Keepa API Key

1. Visit [Keepa.com](https://keepa.com/)
2. Create an account or sign in
3. Navigate to **API** section (https://keepa.com/#!api)
4. Review pricing tiers:
   - **Pay-as-you-go**: Purchase tokens in bulk
   - **Monthly subscription**: Includes monthly token allocation
   - Typical usage: 1 token per product lookup
5. Purchase tokens or subscribe
6. Copy your API key from the API dashboard

### 2. Add to Environment Variables

Add to `apps/listforge-api/.env`:

```bash
# ============================================
# Keepa Configuration
# ============================================

# Keepa API key for historical Amazon pricing data
KEEPA_API_KEY=your_keepa_api_key_here
```

### 3. What Keepa Provides

The service automatically provides:

- **Product Lookup by ASIN**: Full historical data for any Amazon product
- **UPC to ASIN Resolution**: Convert barcodes to Amazon product IDs
- **Price History**: Up to 180 days of pricing data
  - Amazon direct price
  - New third-party lowest price
  - Used lowest price
  - List price (MSRP)
- **Sales Rank History**: Track BSR changes over time
- **Statistics Calculations**:
  - Current price
  - 30-day average, min, max
  - 90-day average, min, max
  - Price drop probability
- **Product Metadata**:
  - Title, brand, manufacturer
  - Category hierarchy
  - Product group
  - Review count and ratings
  - Offer counts (new, used, refurbished)
  - Buy box price and seller

### 4. Verify Keepa Setup

1. **Restart your API server**:
   ```bash
   # From monorepo root
   pnpm dev
   ```

2. **Check the logs** - you should see:
   ```
   [KeepaService] Redis connected for Keepa caching
   ```

3. **Test in the application**:
   - Create an item with a UPC code
   - Run research on the item
   - Check if Amazon comparable products are found
   - View price history data in the research results

### 5. Rate Limits and Caching

The application implements smart caching to minimize token usage:

- **Product data**: Cached for 24 hours
- **UPC mappings**: Cached for 7 days
- **Not found results**: Cached for 6 hours (prevents repeated failed lookups)

Rate limiting is automatically applied based on Keepa's API response headers.

### 6. Token Management

Monitor your token usage:

- Check Keepa dashboard for remaining tokens
- Application logs show token consumption per request
- Typical research workflow uses 1-5 tokens per item
- Caching significantly reduces token usage for repeated lookups

---

## Part 2: Amazon SP-API Setup (Advanced/Optional)

Amazon SP-API provides current product catalog data and real-time pricing. This is more complex to set up and mainly useful if you need:

- Real-time current prices (Keepa has slight delay)
- Full product catalog search capabilities
- Direct Amazon API access for selling

**Note:** Most users can skip this section and use Keepa only.

### Prerequisites

- Amazon Seller Central account (Professional or Individual)
- Access to Amazon Seller Central Developer section
- Understanding of OAuth 2.0 flows

### 1. Register as Amazon SP-API Developer

1. Go to [Amazon Seller Central](https://sellercentral.amazon.com/)
2. If you don't have a seller account:
   - Click **"Register now"**
   - Choose account type (Individual or Professional)
   - Complete registration (may require business verification)
3. Navigate to **Apps & Services > Develop Apps**
4. Click **"Add new app client"**

### 2. Configure Your Application

1. **App Name**: `ListForge` (or your preferred name)

2. **OAuth Redirect URIs**:
   - For local development: `http://localhost:3001/api/marketplaces/amazon/callback`
   - For production: `https://your-domain.com/api/marketplaces/amazon/callback`

3. **IAM ARN** (if required):
   - Follow Amazon's guide to create an IAM role
   - Grant necessary SP-API permissions

4. **API Sections** - Select the following:
   - ✅ Catalog Items API v2022-04-01
   - ✅ Product Pricing API v0
   - ✅ Product Fees API v0 (optional)
   - ✅ Listings Items API v2021-08-01 (if publishing to Amazon)

### 3. Get Your Credentials

After registering your app, you'll receive:

- **LWA Client ID** - Your `AMAZON_CLIENT_ID`
- **LWA Client Secret** - Your `AMAZON_CLIENT_SECRET`

**Important:** Save these credentials securely. The client secret is only shown once.

### 4. Generate OAuth Tokens

This is the most complex part. You need to obtain access and refresh tokens through Amazon's OAuth flow.

#### Option A: Use Amazon's Authorization Workflow

1. **Build the authorization URL**:
   ```
   https://sellercentral.amazon.com/apps/authorize/consent?
     application_id=YOUR_CLIENT_ID
     &state=YOUR_STATE_VALUE
     &version=beta
   ```

2. **Visit the URL** in your browser while logged into Seller Central

3. **Authorize the application** - Amazon will redirect to your callback URL with a code:
   ```
   http://localhost:3001/api/marketplaces/amazon/callback?code=AUTH_CODE&state=YOUR_STATE
   ```

4. **Exchange the code for tokens** using this curl command:
   ```bash
   curl -X POST https://api.amazon.com/auth/o2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=AUTH_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3001/api/marketplaces/amazon/callback"
   ```

5. **Extract tokens from response**:
   ```json
   {
     "access_token": "Atza|...",
     "refresh_token": "Atzr|...",
     "token_type": "bearer",
     "expires_in": 3600
   }
   ```

#### Option B: Use Postman or Similar Tool

Amazon provides Postman collections for SP-API authentication. Download from:
https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api

### 5. Add to Environment Variables

Add to `apps/listforge-api/.env`:

```bash
# ============================================
# Amazon SP-API Configuration
# ============================================

# Amazon OAuth Client Credentials
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxxxxxxxxxxxx
AMAZON_CLIENT_SECRET=your_client_secret_here

# Amazon OAuth Tokens (obtained through OAuth flow)
AMAZON_ACCESS_TOKEN=Atza|xxxxxxxxxxxxx
AMAZON_REFRESH_TOKEN=Atzr|xxxxxxxxxxxxx

# Amazon Region (NA, EU, or FE)
# NA = North America (US, Canada, Mexico, Brazil)
# EU = Europe (UK, Germany, France, Italy, Spain, etc.)
# FE = Far East (Japan, Australia, Singapore, etc.)
AMAZON_REGION=NA

# Amazon Marketplace ID
# US: ATVPDKIKX0DER
# CA: A2EUQ1WTGCTBG2
# MX: A1AM78C64UM0Y8
# UK: A1F83G8C2ARO7P
# DE: A1PA6795UKMFR9
# FR: A13V1IB3VIYZZH
# IT: APJ6JRA9NG5V4
# ES: A1RKKUPIHCS9HS
# See full list: https://developer-docs.amazon.com/sp-api/docs/marketplace-ids
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
```

### 6. Token Refresh

The application automatically refreshes access tokens using the refresh token. The `AmazonAdapter` handles this transparently:

- Access tokens expire after 1 hour
- Refresh token is used to obtain new access token
- Tokens are refreshed automatically before API calls
- No manual intervention required

### 7. Verify Amazon SP-API Setup

1. **Restart your API server**
2. **Check the logs**:
   ```
   [AmazonCatalogService] Amazon SP-API adapter initialized
   ```
3. **Test product lookup**:
   - Search for a product by ASIN
   - Verify current pricing data is returned
   - Check that catalog data is more comprehensive

---

## Part 3: UPC Database API Setup (Optional)

The UPC Database provides product information lookup via barcode. This is optional - the application works without it using a trial API with rate limits.

### 1. Get an API Key

1. Visit [UPCitemdb.com](https://www.upcitemdb.com/)
2. Click **"Sign Up"** or **"Get API Access"**
3. Choose a plan:
   - **Free Trial**: Limited requests per day (good for testing)
   - **Paid Plans**: Higher rate limits and more features
4. Copy your API key from the dashboard

### 2. Add to Environment Variables

Add to `apps/listforge-api/.env`:

```bash
# ============================================
# UPC/EAN Barcode Lookup
# ============================================

# UPC Database API key
UPC_DATABASE_API_KEY=your_upc_database_key_here
```

### 3. What UPC Database Provides

- Product lookup by UPC/EAN barcode
- Product name and description
- Brand information
- Category classification
- Product images
- Fallback when Keepa/Amazon don't have UPC data

### 4. Caching

The application caches UPC lookups aggressively:

- **Found results**: Cached for 30 days
- **Not found results**: Cached for 24 hours
- Significantly reduces API usage for repeated lookups

---

## Part 4: Service Integration Hierarchy

The application uses a smart hierarchy to maximize data quality:

```
AmazonCatalogService (High-level orchestration)
├── KeepaService (Historical data)
│   ├── Product lookup by ASIN
│   ├── UPC to ASIN resolution
│   └── Price history & statistics
│
└── AmazonAdapter (Current data via SP-API)
    ├── Product catalog search
    ├── Current pricing
    └── Real-time availability
```

### Product Lookup Flow

When you search for a product, the system tries these strategies in order:

1. **Direct ASIN lookup** (if ASIN is known)
   - Try Amazon SP-API first (if configured)
   - Fallback to Keepa

2. **UPC/EAN/ISBN lookup**
   - Try Amazon SP-API identifier lookup
   - Fallback to Keepa UPC search
   - Fallback to UPC Database API

3. **Keyword search**
   - Try Amazon SP-API product search
   - Fallback to Keepa keyword search

4. **Return best match** with confidence score

### Graceful Degradation

The system is designed to work with any combination:

| Configuration | Product Lookup | Price History | Current Pricing | UPC Lookup |
|--------------|----------------|---------------|-----------------|------------|
| None | ❌ | ❌ | ❌ | Limited (trial) |
| Keepa only | ✅ | ✅ | ✅ (slight delay) | ✅ |
| SP-API only | ✅ | ❌ | ✅ | ✅ |
| Keepa + SP-API | ✅✅ | ✅ | ✅✅ | ✅✅ |
| + UPC Database | ✅✅ | ✅ | ✅✅ | ✅✅✅ |

**Recommended:** Keepa + UPC Database = Great coverage, minimal complexity

---

## Part 5: Testing and Verification

### Test with a Known Product

1. **Get a test ASIN**: `B08N5WRWNW` (example: Sony WH-1000XM4 Headphones)

2. **Test via API** (if you have curl/Postman):
   ```bash
   # Replace with your auth token
   curl http://localhost:3001/api/research/amazon/B08N5WRWNW \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Test via UI**:
   - Create a new item
   - Add UPC: `027242920255` (Sony WH-1000XM4)
   - Run research
   - Check results for:
     - Product identification
     - Price history chart
     - Comparable products
     - Pricing recommendations

### Verify Each Service

Check the logs during startup and research:

**Keepa Service:**
```
[KeepaService] Redis connected for Keepa caching
[KeepaService] Keepa tokens: 1 consumed, 999 remaining, refill in 60000ms
```

**Amazon Catalog Service:**
```
[AmazonCatalogService] Amazon SP-API adapter initialized
[AmazonCatalogService] Found product via SP-API identifier: B08N5WRWNW
```

**UPC Lookup Service:**
```
[UPCLookupService] Redis connected for UPC caching
[UPCLookupService] Cache hit for UPC: 027242920255
```

---

## Part 6: Troubleshooting

### Issue: "Keepa API key not configured"

**Log message:**
```
[KeepaService] KEEPA_API_KEY not configured - Keepa lookups will be unavailable
```

**Solution:**
1. Verify `KEEPA_API_KEY` is set in your `.env` file
2. Make sure there are no extra spaces or quotes around the key
3. Restart the API server: `pnpm dev`

### Issue: "Keepa API error: Invalid API key"

**Solution:**
1. Double-check the API key is correct (copy-paste from Keepa dashboard)
2. Verify your Keepa account is active
3. Check if you have remaining tokens

### Issue: "Amazon SP-API credentials not configured"

**Log message:**
```
[AmazonCatalogService] Amazon SP-API credentials not configured - Amazon lookups will use Keepa only
```

**Solution:**
This is just a warning - the app works fine with Keepa only. If you want SP-API:
1. Follow Part 2 to set up Amazon SP-API credentials
2. Add all required environment variables
3. Restart the API server

### Issue: "Failed to refresh Amazon access token"

**Solution:**
1. Check that `AMAZON_REFRESH_TOKEN` is valid
2. Verify `AMAZON_CLIENT_ID` and `AMAZON_CLIENT_SECRET` are correct
3. The refresh token may have expired - re-run the OAuth flow
4. Check Amazon Seller Central for any app authorization issues

### Issue: No price history data

**Solution:**
1. Verify Keepa is configured (`KEEPA_API_KEY`)
2. Check if the product exists on Amazon (not all products have history)
3. New products may not have sufficient history yet
4. Check Keepa logs for API errors

### Issue: UPC lookups failing

**Solution:**
1. Verify UPC format (8, 12, or 13 digits)
2. Check if `UPC_DATABASE_API_KEY` is set (optional)
3. Trial API has rate limits - upgrade for higher limits
4. Some UPCs may not be in the database

### Issue: High API token usage

**Solution:**
1. Check Redis is connected (caching reduces API calls)
2. Verify cache TTLs are working (check Redis keys)
3. Avoid repeated research on same items
4. Consider upgrading Keepa plan for more tokens

---

## Part 7: Rate Limits and Best Practices

### Keepa Rate Limits

- Tokens are consumed per API request
- Typical: 1 token per product lookup
- Batch requests: Up to 100 ASINs per request (still 1 token per ASIN)
- Monitor token usage in Keepa dashboard

**Best practices:**
- Enable Redis caching (already configured)
- Use batch lookups for multiple ASINs
- Cache product data for 24+ hours
- Monitor token consumption in logs

### Amazon SP-API Rate Limits

SP-API has dynamic rate limits based on endpoint and account type:

- **Catalog Items**: 5 requests/second (burst: 20)
- **Product Pricing**: 10 requests/second (burst: 20)
- **Listings**: 5 requests/second (burst: 10)

The `AmazonAdapter` includes built-in rate limiting and retry logic.

### UPC Database Rate Limits

- **Free Trial**: 100 requests/day
- **Paid Plans**: 1,000 - 100,000+ requests/month
- Rate limit headers included in responses
- Caching significantly reduces usage

---

## Part 8: Cost Estimation

### Keepa Costs

**Pricing tiers** (as of 2024):
- Pay-as-you-go: ~$0.05 per 1,000 tokens
- Monthly plans: Starting at ~$19/month (includes tokens)

**Usage estimates:**
- Light use (10 items/day): ~300 tokens/month → ~$1-2/month
- Medium use (50 items/day): ~1,500 tokens/month → ~$10/month
- Heavy use (200 items/day): ~6,000 tokens/month → ~$30/month

Caching reduces actual usage by 50-80%.

### Amazon SP-API Costs

- **Free** to use (no per-request fees)
- Requires Amazon Seller account:
  - Individual: $0.99 per item sold
  - Professional: $39.99/month

Only needed if actively selling on Amazon or need real-time data.

### UPC Database Costs

- **Free Trial**: $0 (limited requests)
- **Basic**: ~$10/month (1,000 requests)
- **Pro**: ~$50/month (10,000 requests)

Most users can use the free trial with caching.

---

## Part 9: Production Deployment

### Environment Variables Checklist

For production deployment, ensure all sensitive values are:

✅ Stored in secure secrets management (AWS Secrets Manager, Vault, etc.)
✅ Never committed to version control
✅ Rotated regularly (especially OAuth tokens)
✅ Properly scoped (different credentials for dev/staging/prod)

### Monitoring

Monitor these metrics in production:

- **Keepa token usage**: Track consumption rate
- **Amazon SP-API errors**: Watch for rate limits and auth failures
- **Cache hit rates**: Ensure Redis is working properly
- **API response times**: Monitor for performance degradation

### Security Notes

1. **API Keys**: Treat as sensitive credentials
2. **OAuth Tokens**: Refresh tokens are long-lived - protect them
3. **Rate Limits**: Implement alerts for approaching limits
4. **Data Retention**: Cache product data appropriately
5. **Error Handling**: Don't expose API keys in error messages

---

## Quick Reference

### Recommended Setup for Local Development

**Minimal (Free/Trial):**
```bash
# Just use OpenAI for basic functionality
OPENAI_API_KEY=sk-...
```

**Recommended (Best value):**
```bash
# OpenAI for AI features
OPENAI_API_KEY=sk-...

# Keepa for Amazon research
KEEPA_API_KEY=your_keepa_key

# Optional: UPC Database (use free trial)
UPC_DATABASE_API_KEY=your_upc_key
```

**Full Setup (Maximum capability):**
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Keepa
KEEPA_API_KEY=your_keepa_key

# Amazon SP-API
AMAZON_CLIENT_ID=amzn1.application-oa2-client...
AMAZON_CLIENT_SECRET=...
AMAZON_ACCESS_TOKEN=Atza|...
AMAZON_REFRESH_TOKEN=Atzr|...
AMAZON_REGION=NA
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER

# UPC Database
UPC_DATABASE_API_KEY=your_upc_key
```

### Support Resources

- **Keepa Documentation**: https://keepa.com/#!discuss/t/product-data-api-documentation/1
- **Amazon SP-API Docs**: https://developer-docs.amazon.com/sp-api/
- **UPC Database Docs**: https://www.upcitemdb.com/api/documentation
- **ListForge Issues**: https://github.com/your-org/listforge/issues

---

## Next Steps

1. **Start with Keepa** - Get immediate Amazon research capabilities
2. **Test thoroughly** - Verify with known products and UPCs
3. **Monitor usage** - Watch token consumption and cache performance
4. **Optimize as needed** - Add SP-API or UPC Database when required
5. **Plan for production** - Consider costs and rate limits at scale

For questions or issues, check the logs first - they contain detailed information about what's working and what's not.
