# Google Cloud Vision API Setup Guide

This guide walks you through setting up Google Cloud Vision API for visual product search (reverse image search) in ListForge.

## Overview

ListForge uses Google Cloud Vision API's **Web Detection** feature for Google Lens-style visual product identification. This is the primary provider for reverse image search, offering:

- **Official Google API** - Reliable, well-documented, and supported
- **Cost-effective** - $3.50 per 1,000 images (first 1,000/month free)
- **Comprehensive results** - Web entities, matching pages, similar images
- **High accuracy** - Same underlying technology as Google Image Search

### What Web Detection Provides

- **Best Guess Labels** - AI-identified product names
- **Web Entities** - Named entities (brands, product types) with confidence scores
- **Pages with Matching Images** - Product pages, shopping sites, reviews
- **Full Matching Images** - Exact image matches across the web
- **Visually Similar Images** - Products that look similar
- **Partial Matching Images** - Cropped or modified versions

---

## Part 1: Create a Google Cloud Project

### 1. Sign Up for Google Cloud

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one)
3. If this is your first time:
   - You'll receive **$300 in free credits** valid for 90 days
   - No automatic charges after the trial ends

### 2. Create a New Project

1. Click the project dropdown at the top of the page
2. Click **"New Project"**
3. Enter project details:
   - **Project name**: `listforge` (or your preferred name)
   - **Organization**: Select your organization (or leave as "No organization")
   - **Location**: Select parent folder (or leave default)
4. Click **"Create"**
5. Wait for the project to be created (usually 30 seconds)
6. Select the new project from the project dropdown

### 3. Note Your Project ID

Your project ID will be needed for configuration. Find it:
1. Click the project dropdown
2. Note the **Project ID** column (e.g., `listforge-123456`)

---

## Part 2: Enable the Vision API

### 1. Navigate to Vision API

1. In the Google Cloud Console, click the **Navigation menu** (hamburger icon)
2. Go to **APIs & Services** > **Library**
3. Search for **"Cloud Vision API"**
4. Click on **"Cloud Vision API"**

### 2. Enable the API

1. Click the **"Enable"** button
2. Wait for the API to be enabled (takes a few seconds)
3. You'll be redirected to the API dashboard

### 3. Verify API Status

On the API dashboard, you should see:
- **API Enabled** status
- Metrics for requests (will be empty initially)
- Links to documentation and credentials

---

## Part 3: Create Service Account Credentials

### 1. Navigate to Credentials

1. In the left sidebar, click **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**

### 2. Create Service Account

Fill in the details:
1. **Service account name**: `listforge-vision`
2. **Service account ID**: Auto-generated (e.g., `listforge-vision@listforge-123456.iam.gserviceaccount.com`)
3. **Service account description**: `ListForge Vision API service account`
4. Click **"Create and Continue"**

### 3. Grant Permissions (Optional)

For basic Vision API usage, you can skip additional roles:
1. Click **"Continue"** without selecting additional roles
2. Click **"Done"**

The Vision API permissions are granted automatically when you use the API key.

### 4. Create and Download JSON Key

1. Click on the newly created service account (in the service accounts list)
2. Go to the **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. The JSON key file will be automatically downloaded

**IMPORTANT**:
- Store this file securely - it provides access to your Google Cloud project
- Never commit this file to version control
- Keep a backup in a secure location

---

## Part 4: Configure ListForge

### 1. Place the Credentials File

Move the downloaded JSON key file to a secure location:

```bash
# Create a credentials directory (not in version control)
mkdir -p ~/.config/listforge

# Move the downloaded file (replace with your actual filename)
mv ~/Downloads/listforge-123456-abc123.json ~/.config/listforge/google-credentials.json

# Set restrictive permissions
chmod 600 ~/.config/listforge/google-credentials.json
```

### 2. Add Environment Variables

Add to `apps/listforge-api/.env`:

```bash
# ============================================
# Google Cloud Vision API Configuration
# ============================================

# Path to your service account JSON key file
# This enables automatic authentication for the Vision API
GOOGLE_APPLICATION_CREDENTIALS=/Users/your-username/.config/listforge/google-credentials.json

# Optional: Explicitly set the project ID
# (Usually auto-detected from credentials file)
GOOGLE_CLOUD_PROJECT=listforge-123456
```

### 3. Alternative: Inline Credentials (Production)

For production deployments, you can use inline credentials instead of a file:

```bash
# Base64-encoded service account JSON
# Generate with: cat google-credentials.json | base64
GOOGLE_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
```

Then modify the service initialization to decode and use the inline credentials.

---

## Part 5: Verify Setup

### 1. Restart the API Server

```bash
# From monorepo root
pnpm dev
```

### 2. Check the Logs

You should see:
```
[ReverseImageSearchService] Google Cloud Vision Web Detection provider initialized (primary)
[ReverseImageSearchService] Reverse image search initialized with X provider(s)
```

If you see warnings instead:
```
[ReverseImageSearchService] GOOGLE_APPLICATION_CREDENTIALS not configured - Google Cloud Vision provider unavailable
```

Double-check your environment variables and file path.

### 3. Test in the Application

1. Create a new item with product photos
2. Run research on the item
3. Check if visual product search results appear
4. Look for "Visual Product Search" in the research activity

---

## Part 6: Understanding the Results

### Web Detection Response Structure

```typescript
{
  // Best guess for the product
  bestGuessLabels: [
    { label: "Sony WH-1000XM4 Headphones" }
  ],

  // Named entities with confidence scores
  webEntities: [
    { description: "Sony", score: 0.92 },
    { description: "Headphones", score: 0.88 },
    { description: "WH-1000XM4", score: 0.85 }
  ],

  // Pages containing this product
  pagesWithMatchingImages: [
    {
      url: "https://www.amazon.com/Sony-WH-1000XM4...",
      pageTitle: "Sony WH-1000XM4 Wireless Headphones - Amazon.com",
      fullMatchingImages: [...],
      partialMatchingImages: [...]
    }
  ],

  // Exact image matches
  fullMatchingImages: [
    { url: "https://example.com/product-image.jpg" }
  ],

  // Visually similar images
  visuallySimilarImages: [
    { url: "https://example.com/similar-product.jpg" }
  ]
}
```

### Confidence Scoring

ListForge calculates confidence scores based on:

1. **Entity Score** (0.0 - 1.0) - Google's confidence in entity identification
2. **Domain Trust** (+0.15) - Boost for trusted retailers (Amazon, eBay, Walmart, etc.)
3. **Match Type** (+0.1) - Boost for full image matches vs partial
4. **Match Count** (+0.05) - Boost when multiple matches found on a page

---

## Part 7: Pricing and Quotas

### Pricing Tiers

| Usage Tier | Price per 1,000 images |
|------------|------------------------|
| First 1,000/month | **FREE** |
| 1,001 - 5,000,000/month | $3.50 |
| 5,000,001+ | Contact Google |

### Cost Estimation

| Usage Level | Images/Month | Monthly Cost |
|-------------|--------------|--------------|
| Light (10 items/day) | ~300 | $0 (free tier) |
| Medium (50 items/day) | ~1,500 | ~$1.75 |
| Heavy (200 items/day) | ~6,000 | ~$17.50 |
| Very Heavy (1000 items/day) | ~30,000 | ~$101.50 |

**Note**: Caching reduces actual API calls by 50-80%.

### Quotas

Default quotas (can be increased via Google Cloud Console):

| Quota | Default Limit |
|-------|---------------|
| Requests per minute | 1,800 |
| Requests per day | Unlimited* |

*Within your billing budget

### Setting Budget Alerts

1. Go to **Billing** > **Budgets & alerts**
2. Click **"Create Budget"**
3. Set a monthly budget (e.g., $50)
4. Configure alert thresholds (50%, 90%, 100%)
5. Add notification channels (email, Slack, etc.)

---

## Part 8: Rate Limiting and Caching

### Built-in Rate Limiting

ListForge implements automatic rate limiting:

```typescript
// Rate limiter configuration
{
  maxTokens: 20,        // Burst capacity
  refillRate: 15,       // Tokens per second
  refillInterval: 1000, // Refill every 1 second
}
```

This limits to ~900 requests/minute, well under Google's 1,800 limit.

### Caching

Results are cached for 15 minutes to reduce API calls:

- **Cache hit**: Returns instantly, no API call
- **Cache miss**: Makes API call, caches result
- **Cache size**: Limited to 500 entries (LRU eviction)

For production, consider using Redis for distributed caching.

---

## Part 9: Troubleshooting

### Issue: "GOOGLE_APPLICATION_CREDENTIALS not configured"

**Cause**: Environment variable not set or file not found.

**Solution**:
1. Verify the file exists at the specified path:
   ```bash
   ls -la ~/.config/listforge/google-credentials.json
   ```
2. Check the environment variable is set:
   ```bash
   echo $GOOGLE_APPLICATION_CREDENTIALS
   ```
3. Ensure the path in `.env` is absolute, not relative
4. Restart the API server after changes

### Issue: "Permission denied" or "Forbidden"

**Cause**: Service account doesn't have correct permissions.

**Solution**:
1. Go to **IAM & Admin** > **IAM** in Google Cloud Console
2. Find your service account
3. Ensure it has the **"Cloud Vision API User"** role
4. If not, click **"Edit"** and add the role

### Issue: "API not enabled"

**Cause**: Vision API not enabled for the project.

**Solution**:
1. Go to **APIs & Services** > **Library**
2. Search for "Cloud Vision API"
3. Click **"Enable"** if not already enabled

### Issue: "Quota exceeded"

**Cause**: Exceeded requests per minute limit.

**Solution**:
1. The built-in rate limiter should prevent this
2. If occurring, check for concurrent requests
3. Request quota increase via Google Cloud Console:
   - **APIs & Services** > **Quotas**
   - Find "Cloud Vision API" limits
   - Click **"Edit Quotas"** and request increase

### Issue: "Invalid credentials" or "Could not load credentials"

**Cause**: Malformed or invalid JSON key file.

**Solution**:
1. Re-download the JSON key from Google Cloud Console
2. Verify the file is valid JSON:
   ```bash
   cat ~/.config/listforge/google-credentials.json | python -m json.tool
   ```
3. Check file permissions allow reading:
   ```bash
   chmod 600 ~/.config/listforge/google-credentials.json
   ```

### Issue: Poor quality results

**Cause**: Image quality or content issues.

**Solution**:
1. Ensure images are:
   - At least 640x480 pixels
   - Well-lit and in focus
   - Showing the product clearly
2. Multiple angles improve identification
3. Remove backgrounds when possible

---

## Part 10: Best Practices

### Image Quality

For best results:
- Use high-resolution images (1000x1000+ recommended)
- Ensure good lighting and focus
- Include multiple angles
- Remove cluttered backgrounds when possible
- Include visible branding/labels

### Cost Optimization

1. **Enable caching** - Prevents duplicate API calls
2. **Batch processing** - Research multiple images together
3. **Pre-filter images** - Skip obviously unusable images
4. **Set budget alerts** - Prevent unexpected charges

### Security

1. **Never commit credentials** - Add to `.gitignore`:
   ```
   google-credentials.json
   *credentials*.json
   ```
2. **Rotate keys regularly** - Delete old keys, create new ones
3. **Use least privilege** - Only grant necessary permissions
4. **Monitor usage** - Check for unexpected API calls

### Production Deployment

For production:

1. **Use secret management**:
   - AWS Secrets Manager
   - Google Secret Manager
   - HashiCorp Vault
   - Kubernetes secrets

2. **Environment-specific credentials**:
   - Separate service accounts for dev/staging/prod
   - Different projects for isolation

3. **Monitoring**:
   - Enable Cloud Monitoring
   - Set up alerting for errors
   - Track API latency and success rates

---

## Part 11: Fallback Providers

If Google Cloud Vision is unavailable, ListForge automatically falls back to:

1. **SerpApi Google Lens** (if configured)
   - Requires `SERPAPI_API_KEY`
   - Unofficial scraper of Google Lens
   - Higher cost ($7.50-15/1000)

2. **OpenAI Vision + Web Search** (if configured)
   - Requires `OPENAI_API_KEY`
   - Uses GPT-4 Vision to identify product
   - Then web search to find matches
   - Good fallback, different results

### Configuring Fallbacks

```bash
# Primary (recommended)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Optional fallbacks
SERPAPI_API_KEY=your_serpapi_key      # Secondary
OPENAI_API_KEY=sk-your_openai_key     # Tertiary
```

---

## Quick Reference

### Required Environment Variables

```bash
# Minimum required
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
```

### Optional Environment Variables

```bash
# Explicit project ID (usually auto-detected)
GOOGLE_CLOUD_PROJECT=your-project-id

# Fallback providers
SERPAPI_API_KEY=your_serpapi_key
OPENAI_API_KEY=sk-your_openai_key
```

### Useful Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Vision API Documentation**: https://cloud.google.com/vision/docs
- **Web Detection Guide**: https://cloud.google.com/vision/docs/detecting-web
- **Pricing**: https://cloud.google.com/vision/pricing
- **API Reference**: https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate

### Support

- **Google Cloud Support**: https://cloud.google.com/support
- **Stack Overflow**: Tag `google-cloud-vision`
- **ListForge Issues**: https://github.com/your-org/listforge/issues

---

## Next Steps

1. **Complete the setup** - Follow Parts 1-5 to get credentials
2. **Test with sample images** - Verify results match expectations
3. **Monitor usage** - Set up budget alerts
4. **Configure fallbacks** - Add SerpApi or OpenAI as backup
5. **Optimize for production** - Use secret management and monitoring
