# Environment Variables Audit Report - API Service

**Date**: December 12, 2025
**Service**: listforge-api (App Runner)
**Status**: ⚠️ MISSING CRITICAL INTEGRATIONS

---

## Current Configuration Status

### ✅ Core Infrastructure (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `NODE_ENV` | production | ✅ | Correct |
| `PORT` | 3001 | ✅ | Correct |
| `LOG_LEVEL` | info | ✅ | Appropriate for production |

### ✅ Database (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `DATABASE_URL` | postgresql://listforge:***@listforge-production-db.ckfwka2y0xix.us-east-1.rds.amazonaws.com:5432/listforge?sslmode=require | ✅ | Properly configured with SSL |
| `NODE_TLS_REJECT_UNAUTHORIZED` | 0 | ⚠️ | Required for RDS SSL but not ideal |

**Security Note**: `NODE_TLS_REJECT_UNAUTHORIZED=0` is necessary for RDS connections but should be replaced with proper certificate validation if possible.

### ✅ Redis/Cache (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `REDIS_URL` | redis://listforge-production-redis.etpr1n.0001.use1.cache.amazonaws.com:6379 | ✅ | ElastiCache endpoint |

### ✅ S3/Storage (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `STORAGE_PROVIDER` | s3 | ✅ | Correct |
| `S3_BUCKET` | listforge-production-uploads | ✅ | Correct bucket name |
| `S3_REGION` | us-east-1 | ✅ | Matches AWS region |

**Note**: S3 authentication uses IAM roles via `InstanceRoleArn`, no credentials needed.

### ✅ Authentication & Security (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `JWT_SECRET` | (64 char base64) | ✅ | Properly configured |
| `ENCRYPTION_KEY` | (64 char hex) | ✅ | Used for marketplace tokens |

### ✅ CORS (CONFIGURED)

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `FRONTEND_URL` | https://app.list-forge.ai,https://list-forge.ai | ✅ | **JUST FIXED** - Now includes both domains |

---

## ❌ Missing Integrations

### 1. eBay API - MISSING ⚠️

**Required for**: eBay marketplace integration, listing, authentication

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `EBAY_CLIENT_ID` | ✅ Yes | ❌ Missing | OAuth app ID |
| `EBAY_CLIENT_SECRET` | ✅ Yes | ❌ Missing | OAuth app secret |
| `EBAY_RU_NAME` | ✅ Yes | ❌ Missing | Redirect URI name |
| `EBAY_ENVIRONMENT` | Optional | ❌ Missing | 'PRODUCTION' or 'SANDBOX' (defaults to PRODUCTION) |

**Impact**: eBay OAuth connections will fail. Users cannot connect eBay accounts.

**Code Reference**:
```typescript
// marketplace-account.service.ts:346-360
ebayClientId: this.configService.get<string>('EBAY_CLIENT_ID'),
ebayClientSecret: this.configService.get<string>('EBAY_CLIENT_SECRET'),
ebayRuName: this.configService.get<string>('EBAY_RU_NAME'),
```

**Documentation**: See [`docs/EBAY_SETUP.md`](/Users/timothycrooker/list-forge-monorepo/docs/EBAY_SETUP.md)

---

### 2. Amazon SP-API - MISSING ⚠️

**Required for**: Amazon marketplace integration, listing, inventory

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `AMAZON_CLIENT_ID` | ✅ Yes | ❌ Missing | LWA client ID |
| `AMAZON_CLIENT_SECRET` | ✅ Yes | ❌ Missing | LWA client secret |
| `AMAZON_REGION` | Optional | ❌ Missing | 'NA', 'EU', or 'FE' (defaults to 'NA') |
| `AMAZON_MARKETPLACE_ID` | Optional | ❌ Missing | Defaults to 'ATVPDKIKX0DER' (US) |

**Impact**: Amazon OAuth connections will fail. Users cannot connect Amazon Seller accounts.

**Code Reference**:
```typescript
// marketplace-account.service.ts:364-368
amazonClientId: this.configService.get<string>('AMAZON_CLIENT_ID'),
amazonClientSecret: this.configService.get<string>('AMAZON_CLIENT_SECRET'),
amazonRegion: (this.configService.get<string>('AMAZON_REGION') || 'NA') as 'NA' | 'EU' | 'FE',
amazonMarketplaceId: this.configService.get<string>('AMAZON_MARKETPLACE_ID') || 'ATVPDKIKX0DER',
```

**Documentation**: See [`docs/AMAZON_SETUP.md`](/Users/timothycrooker/list-forge-monorepo/docs/AMAZON_SETUP.md)

---

### 3. Facebook Marketplace API - MISSING ⚠️

**Required for**: Facebook Marketplace integration, catalog management

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `FACEBOOK_APP_ID` | ✅ Yes | ❌ Missing | Facebook App ID |
| `FACEBOOK_APP_SECRET` | ✅ Yes | ❌ Missing | Facebook App Secret |

**Impact**: Facebook OAuth connections will fail. Users cannot connect Facebook Business accounts.

**Code Reference**:
```typescript
// marketplace-account.service.ts:372-377
facebookAppId: this.configService.get<string>('FACEBOOK_APP_ID'),
facebookAppSecret: this.configService.get<string>('FACEBOOK_APP_SECRET'),
```

**Documentation**: See [`docs/FACEBOOK_SETUP.md`](/Users/timothycrooker/list-forge-monorepo/docs/FACEBOOK_SETUP.md)

---

### 4. Google Cloud Vision API - MISSING ⚠️

**Required for**: Reverse image search (primary provider), product identification

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ Yes (recommended) | ❌ Missing | Path to service account JSON |
| `GOOGLE_CLOUD_PROJECT` | Optional | ❌ Missing | GCP project ID |

**Impact**: Primary reverse image search provider unavailable. Falls back to SerpApi or OpenAI Vision (if configured).

**Code Reference**:
```typescript
// reverse-image-search.service.ts:258-269
const gcpCredentials = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
const gcpProjectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT');
if (gcpCredentials || gcpProjectId) {
  this.providers.push(new GoogleCloudVisionProvider(this.logger));
} else {
  this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not configured - Google Cloud Vision provider unavailable');
}
```

**Features Lost**:
- Web Detection API (find visually similar images)
- Product identification from images
- Named entity detection
- Shopping results from images

**Pricing**: $3.50/1000 images (first 1000/month free)

**Documentation**: See [`docs/GOOGLE_CLOUD_VISION_SETUP.md`](/Users/timothycrooker/list-forge-monorepo/docs/GOOGLE_CLOUD_VISION_SETUP.md)

---

### 5. SerpApi (Google Lens) - MISSING ⚠️

**Required for**: Reverse image search (backup provider)

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `SERPAPI_API_KEY` | Optional (backup) | ❌ Missing | SerpApi API key |

**Impact**: Secondary reverse image search provider unavailable. Falls back to OpenAI Vision only.

**Code Reference**:
```typescript
// reverse-image-search.service.ts:271-278
const serpApiKey = this.configService.get<string>('SERPAPI_API_KEY');
if (serpApiKey) {
  this.providers.push(new SerpApiGoogleLensProvider(serpApiKey, this.logger));
  this.logger.log('SerpApi Google Lens provider initialized (backup)');
}
```

**Pricing**: Pay-per-search, varies by plan

---

## ✅ Already Configured

### OpenAI API - CONFIGURED ✅

| Variable | Value | Status | Notes |
|----------|-------|--------|-------|
| `OPENAI_API_KEY` | sk-proj-*** | ✅ | Active key present |

**Used for**:
- Chat/AI workflows
- Listing generation
- Category detection
- Vision analysis (fallback for reverse image search)
- OCR extraction

---

## Summary

### By Priority

#### 🔴 CRITICAL (Application Features Broken)

1. **eBay API** - Users cannot connect eBay accounts
2. **Amazon API** - Users cannot connect Amazon accounts
3. **Facebook API** - Users cannot connect Facebook Marketplace

#### 🟡 HIGH (Degraded Functionality)

4. **Google Cloud Vision** - Reverse image search using fallback providers only
5. **SerpApi** - No backup for image search

#### 🟢 LOW (Optional Enhancements)

None currently identified

---

## Recommended Actions

### Step 1: Add Marketplace API Credentials (CRITICAL)

Update Terraform configuration to include marketplace credentials:

```hcl
# In listforge-infra/environments/production/apps.tf

api_env = merge(local.common_env, {
  PORT                         = "3001"
  DATABASE_URL                 = module.database.connection_url
  REDIS_URL                    = module.cache.connection_url
  JWT_SECRET                   = var.jwt_secret
  FRONTEND_URL                 = "https://app.${var.domain},https://${var.domain}"
  LOG_LEVEL                    = "info"
  OPENAI_API_KEY               = var.openai_api_key
  ENCRYPTION_KEY               = var.encryption_key
  NODE_TLS_REJECT_UNAUTHORIZED = "0"

  # eBay API
  EBAY_CLIENT_ID               = var.ebay_client_id
  EBAY_CLIENT_SECRET           = var.ebay_client_secret
  EBAY_RU_NAME                 = var.ebay_ru_name
  EBAY_ENVIRONMENT             = "PRODUCTION"

  # Amazon SP-API
  AMAZON_CLIENT_ID             = var.amazon_client_id
  AMAZON_CLIENT_SECRET         = var.amazon_client_secret
  AMAZON_REGION                = "NA"
  AMAZON_MARKETPLACE_ID        = "ATVPDKIKX0DER"

  # Facebook Marketplace
  FACEBOOK_APP_ID              = var.facebook_app_id
  FACEBOOK_APP_SECRET          = var.facebook_app_secret

  # Google Cloud Vision
  GOOGLE_APPLICATION_CREDENTIALS = var.google_credentials_path
  GOOGLE_CLOUD_PROJECT         = var.google_project_id

  # SerpApi (optional)
  SERPAPI_API_KEY              = var.serpapi_key
})
```

### Step 2: Add Variables to terraform.tfvars

```hcl
# In listforge-infra/environments/production/terraform.tfvars

# eBay
ebay_client_id     = "<your-ebay-client-id>"
ebay_client_secret = "<your-ebay-client-secret>"
ebay_ru_name       = "<your-ebay-ru-name>"

# Amazon
amazon_client_id     = "<your-amazon-client-id>"
amazon_client_secret = "<your-amazon-client-secret>"

# Facebook
facebook_app_id     = "<your-facebook-app-id>"
facebook_app_secret = "<your-facebook-app-secret>"

# Google Cloud
google_credentials_path = "/path/to/service-account.json"
google_project_id      = "<your-gcp-project-id>"

# SerpApi (optional)
serpapi_key = "<your-serpapi-key>"
```

### Step 3: Define Variables

```hcl
# In listforge-infra/environments/production/variables.tf

# eBay Variables
variable "ebay_client_id" {
  description = "eBay OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "ebay_client_secret" {
  description = "eBay OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "ebay_ru_name" {
  description = "eBay Redirect URI Name"
  type        = string
  sensitive   = true
}

# Amazon Variables
variable "amazon_client_id" {
  description = "Amazon LWA Client ID"
  type        = string
  sensitive   = true
}

variable "amazon_client_secret" {
  description = "Amazon LWA Client Secret"
  type        = string
  sensitive   = true
}

# Facebook Variables
variable "facebook_app_id" {
  description = "Facebook App ID"
  type        = string
  sensitive   = true
}

variable "facebook_app_secret" {
  description = "Facebook App Secret"
  type        = string
  sensitive   = true
}

# Google Cloud Variables
variable "google_credentials_path" {
  description = "Path to Google Cloud service account JSON"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_project_id" {
  description = "Google Cloud Project ID"
  type        = string
  sensitive   = false
  default     = ""
}

# SerpApi Variable
variable "serpapi_key" {
  description = "SerpApi API Key for Google Lens searches"
  type        = string
  sensitive   = true
  default     = ""
}
```

### Step 4: Apply Terraform Changes

```bash
cd /Users/timothycrooker/listforge-infra/environments/production

# Review changes
terraform plan -target=module.api.aws_apprunner_service.main

# Apply changes
terraform apply -target=module.api.aws_apprunner_service.main
```

---

## Google Cloud Vision Setup Notes

For Google Cloud Vision, you have two options:

### Option 1: Service Account JSON (Recommended for App Runner)

1. Create service account in GCP
2. Grant "Cloud Vision AI User" role
3. Create JSON key
4. Upload to secure location accessible by App Runner
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to path

### Option 2: Application Default Credentials

1. Set `GOOGLE_CLOUD_PROJECT` env var
2. Attach IAM role to App Runner service

**Note**: App Runner doesn't natively support GCP service accounts, so Option 1 with environment variable pointing to mounted credentials is recommended.

---

## Testing After Configuration

### Test Marketplace Connections

```bash
# eBay
curl https://api.list-forge.ai/api/marketplaces/ebay/auth-url

# Amazon
curl https://api.list-forge.ai/api/marketplaces/amazon/auth-url

# Facebook
curl https://api.list-forge.ai/api/marketplaces/facebook/auth-url
```

### Test Reverse Image Search

```bash
curl -X POST https://api.list-forge.ai/api/research/reverse-image-search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/product.jpg"}'
```

### Check Service Logs

```bash
aws logs tail /aws/apprunner/listforge-api/<service-id>/service \
  --region us-east-1 \
  --since 10m \
  --follow
```

Look for initialization messages:
- `Google Cloud Vision Web Detection provider initialized (primary)`
- `SerpApi Google Lens provider initialized (backup)`
- `OpenAI Vision + Web Search provider initialized (fallback)`

---

## Security Considerations

### Secrets Management

**Current**: All secrets stored as plaintext in Terraform state and environment variables.

**Recommended**:
1. Migrate sensitive values to AWS Secrets Manager
2. Reference secrets from Secrets Manager in App Runner
3. Use IAM role permissions for access

### Example Migration:

```hcl
# Create secrets in Secrets Manager
resource "aws_secretsmanager_secret" "ebay_credentials" {
  name = "listforge/production/ebay-credentials"
}

resource "aws_secretsmanager_secret_version" "ebay_credentials" {
  secret_id = aws_secretsmanager_secret.ebay_credentials.id
  secret_string = jsonencode({
    client_id     = var.ebay_client_id
    client_secret = var.ebay_client_secret
    ru_name       = var.ebay_ru_name
  })
}

# Reference in App Runner
# (App Runner supports secrets as environment variables)
```

---

## Impact Assessment

### Current State

| Feature | Status | Impact |
|---------|--------|--------|
| User Authentication | ✅ Working | No impact |
| Database | ✅ Working | No impact |
| S3 Storage | ✅ Working | No impact |
| Redis/Queue | ✅ Working | No impact |
| AI Features (Chat, Listings) | ✅ Working | OpenAI configured |
| **eBay Integration** | ❌ **Broken** | **Users cannot connect accounts** |
| **Amazon Integration** | ❌ **Broken** | **Users cannot connect accounts** |
| **Facebook Integration** | ❌ **Broken** | **Users cannot connect accounts** |
| Image Search (Primary) | ❌ Degraded | Using fallback providers only |
| Image Search (Backup) | ❌ Unavailable | No SerpApi |

### After Configuration

All features will be fully functional.

---

## Files to Modify

1. [`listforge-infra/environments/production/variables.tf`](/Users/timothycrooker/listforge-infra/environments/production/variables.tf)
2. [`listforge-infra/environments/production/apps.tf`](/Users/timothycrooker/listforge-infra/environments/production/apps.tf)
3. [`listforge-infra/environments/production/terraform.tfvars`](/Users/timothycrooker/listforge-infra/environments/production/terraform.tfvars)

---

## Related Documentation

- [eBay Setup Guide](EBAY_SETUP.md)
- [Amazon SP-API Setup Guide](AMAZON_SETUP.md)
- [Facebook Marketplace Setup Guide](FACEBOOK_SETUP.md)
- [Google Cloud Vision Setup Guide](GOOGLE_CLOUD_VISION_SETUP.md)

---

## Questions?

If you need help obtaining API credentials:
1. Check the respective setup guides in the `docs/` folder
2. Each marketplace has specific requirements and approval processes
3. Some require business verification or developer agreements

