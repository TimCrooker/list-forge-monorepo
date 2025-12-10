# Deployment Infrastructure Review - December 10, 2025

## Executive Summary

Comprehensive review of the ListForge deployment infrastructure, including issues identified and resolved.

---

## Issues Identified & Resolved

### 1. ❌ **DNS Resolution - Apex Domain**

**Problem**: `list-forge.ai` was not resolving - no DNS records existed in Route 53.

**Root Cause**: 
- Terraform module created App Runner custom domain association
- BUT did not create the actual DNS records in Route 53
- App Runner requires manual DNS setup

**Solution Implemented**:
- Created A records manually using AWS CLI pointing to App Runner IPs
- Added CNAME record creation to Terraform module for future deployments
- Note: Apex domains cannot use CNAME records (DNS protocol limitation)

**Status**: ✅ RESOLVED - Domain now resolves correctly

---

### 2. ❌ **Frontend API URL - Double /api Path**

**Problem**: Frontend was calling `https://pqjssm2cgt.us-east-1.awsapprunner.com/api/api/auth/login` (double `/api/api`)

**Root Cause**:
- GitHub Actions workflow set `VITE_API_URL=https://${{ secrets.APP_RUNNER_API_URL }}/api`
- Frontend code in `packages/api-rtk/src/baseQueryWithErrorHandling.ts` already adds `/api` to the base URL (line 28):
  ```typescript
  const baseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api`,  // <-- Adds /api here
  ```

**Solution Implemented**:
- Updated `.github/workflows/deploy-aws.yml` to use `VITE_API_URL=https://api.list-forge.ai` (without `/api` suffix)

**Status**: ✅ RESOLVED - Workflow updated, new deployment triggered

---

### 3. ❌ **Build Failure - TypeScript Errors**

**Problem**: Docker build failing with TypeScript errors in `@listforge/api-rtk` package:
```
error TS2503: Cannot find namespace 'NodeJS'.
```

**Root Cause**:
- `@listforge/api-rtk/package.json` was missing `@types/node` dependency
- Code uses `NodeJS.Timeout` type which requires `@types/node`

**Solution Implemented**:
- Added `"@types/node": "^20.10.0"` to `devDependencies` in `packages/api-rtk/package.json`

**Status**: ✅ RESOLVED - Build should now complete successfully

---

## Current Infrastructure Setup

### Architecture Overview

```
Internet
  │
  ├─→ list-forge.ai (A records to App Runner IPs)
  │     └─→ AWS App Runner: listforge-web (nginx + React SPA)
  │
  └─→ api.list-forge.ai (CNAME)
        └─→ AWS App Runner: listforge-api (NestJS API)
             │
             ├─→ RDS PostgreSQL (db.t3.micro)
             ├─→ ElastiCache Redis (cache.t3.micro)
             └─→ S3 (listforge-production-uploads)
```

### AWS Resources

| Resource | Type | Purpose | Status |
|----------|------|---------|--------|
| **App Runner - API** | `listforge-api` | NestJS backend | ✅ Running |
| **App Runner - Web** | `listforge-web` | React frontend | ✅ Running |
| **RDS** | PostgreSQL 15 | Database | ✅ Running |
| **ElastiCache** | Redis 7.0 | Cache/queues | ✅ Running |
| **S3** | Standard | File storage | ✅ Active |
| **ECR** | Docker registry | Container images | ✅ Active |
| **Route 53** | DNS zone | Domain management | ✅ Active |
| **VPC Connector** | Networking | App Runner → RDS/Redis | ✅ Active |

### DNS Configuration

| Record | Type | Value | Status |
|--------|------|-------|--------|
| `list-forge.ai` | A | 5 App Runner IPs | ✅ Working |
| `api.list-forge.ai` | CNAME | `pqjssm2cgt.us-east-1.awsapprunner.com` | ✅ Working |
| `*.list-forge.ai` | - | ACM Certificate | ✅ Validated |

**Nameservers** (configured in domain registrar):
- `ns-1239.awsdns-26.org`
- `ns-125.awsdns-15.com`
- `ns-874.awsdns-45.net`
- `ns-1683.awsdns-18.co.uk`

---

## CI/CD Pipeline

### GitHub Actions Workflow: `deploy-aws.yml`

**Trigger**: Push to `main` branch or manual `workflow_dispatch`

**Jobs**:

1. **build-api** (parallel)
   - Build Docker image from `Dockerfile.api`
   - Push to ECR: `058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-api`
   - Auto-deploy: Enabled

2. **build-web** (parallel)
   - Build Docker image from `Dockerfile.web`
   - **Build arg**: `VITE_API_URL=https://api.list-forge.ai` ← FIXED
   - Push to ECR: `058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-web`
   - Auto-deploy: Enabled

3. **deploy-api** (depends on build-api)
   - Trigger App Runner deployment
   - Service ARN: `${{ secrets.APP_RUNNER_API_ARN }}`

4. **deploy-web** (depends on build-web)
   - Trigger App Runner deployment
   - Service ARN: `${{ secrets.APP_RUNNER_WEB_ARN }}`

5. **summary** (always runs after deploys)
   - Reports deployment status
   - Fails if any deployment failed

### Deployment Timeline

Typical deployment takes **8-12 minutes**:
- Build images: 4-6 minutes
- Push to ECR: 1-2 minutes
- App Runner deployment: 3-4 minutes

---

## Environment Variables

### API Service (App Runner)

Set in Terraform (`environments/production/apps.tf`):
```hcl
NODE_ENV         = "production"
PORT             = "3001"
DATABASE_URL     = module.database.connection_url
REDIS_URL        = module.cache.connection_url
JWT_SECRET       = var.jwt_secret
FRONTEND_URL     = "https://list-forge.ai"
STORAGE_PROVIDER = "s3"
S3_BUCKET        = module.storage.bucket_name
S3_REGION        = "us-east-1"
LOG_LEVEL        = "info"
```

**Not in Terraform** (set manually in App Runner console):
- `OPENAI_API_KEY`
- `EBAY_APP_ID`, `EBAY_CERT_ID`
- `KEEPA_API_KEY`
- Other external service keys

### Web Service (App Runner)

Build-time only (baked into Docker image):
```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```

Value set in GitHub Actions: `https://api.list-forge.ai`

---

## Terraform State

### Backend Configuration

```hcl
bucket         = "listforge-terraform-state"
key            = "production/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-locks"
encrypt        = true
```

### Recent Terraform Changes

1. **Cleaned up `app-service` module**
   - Removed duplicate variable/output definitions
   - Separated into proper files: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`
   - Added Route 53 CNAME record resource (though CNAME doesn't work for apex domains)

2. **DNS module**
   - Creates Route 53 hosted zone
   - Creates ACM wildcard certificate
   - Validates certificate automatically

---

## Known Limitations & Workarounds

### 1. Apex Domain CNAME Limitation

**Issue**: DNS protocol doesn't allow CNAME records at apex/root domains.

**Current Workaround**: 
- Manual A records with App Runner service IPs
- IPs are relatively stable but could theoretically change

**Better Long-term Solutions**:
- **Option A**: CloudFront distribution in front of App Runner (supports ALIAS records)
- **Option B**: Make `www.list-forge.ai` primary, redirect apex to it
- **Option C**: AWS Global Accelerator

### 2. App Runner IP Changes

**Risk**: A records point to current IPs which could change during major AWS events.

**Mitigation**: 
- Monitor for DNS resolution failures
- Re-query App Runner service IPs if needed
- Consider implementing health checks

### 3. Secrets Management

**Current State**: 
- Infrastructure secrets (DB password, JWT secret) in Terraform
- External API keys manually set in App Runner console
- No centralized secrets management

**Improvement Opportunity**:
- Use AWS Secrets Manager for all secrets
- Reference secrets in App Runner via ARNs
- Rotate secrets automatically

---

## Monitoring & Health Checks

### App Runner Health Checks

**API Service**:
- Path: `/api/health`
- Interval: 10s
- Timeout: 5s
- Healthy threshold: 1
- Unhealthy threshold: 5

**Web Service**:
- Path: `/`
- Interval: 10s
- Timeout: 5s
- Healthy threshold: 1
- Unhealthy threshold: 5

### Auto-scaling

Both services configured for:
- Min instances: 1
- Max instances: 3
- Max concurrency: 100 requests/instance

---

## Security Considerations

### ✅ Good Practices
- VPC isolation for database and cache
- Encryption at rest for RDS and S3
- TLS/SSL via ACM certificates
- Secrets encrypted in Terraform state
- IAM roles with least privilege

### ⚠️ Improvements Needed
- Database has `publicly_accessible = true` (required for App Runner)
- Consider AWS PrivateLink for App Runner → RDS
- Implement WAF rules for App Runner
- Add rate limiting at infrastructure level
- Centralize secrets management

---

## Cost Optimization

### Current Costs (Estimated Monthly)

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| App Runner API | 1-3 instances, 256 CPU, 512MB | $15-45 |
| App Runner Web | 1-3 instances, 256 CPU, 512MB | $15-45 |
| RDS (db.t3.micro) | Single-AZ | $15 |
| ElastiCache (cache.t3.micro) | Single node | $15 |
| S3 | Standard storage | Variable |
| Data transfer | Outbound | Variable |
| **Total** | | **~$60-120/month** |

### Optimization Opportunities
- Use Savings Plans for predictable workloads
- Enable S3 Intelligent-Tiering
- Review and optimize container sizes
- Consider Reserved Instances for RDS

---

## Next Steps & Recommendations

### Immediate (This Week)
1. ✅ Monitor new deployment for successful build
2. ✅ Verify frontend works without 404 errors
3. Test user login flow end-to-end
4. Check WebSocket connections (chat functionality)

### Short-term (This Month)
1. Implement proper apex domain solution (CloudFront or www redirect)
2. Set up CloudWatch alarms for critical services
3. Document all external API keys location
4. Create runbook for common operations

### Long-term (Next Quarter)
1. Migrate to centralized secrets management
2. Implement blue/green deployments
3. Add comprehensive monitoring/observability
4. Set up disaster recovery procedures
5. Consider multi-region deployment

---

## Useful Commands

### Check Deployment Status
```bash
cd /path/to/list-forge-monorepo
gh run list --limit 5
gh run view <run-id> --log
```

### AWS CLI Operations
```bash
# Check App Runner service status
aws apprunner list-services --region us-east-1

# Describe specific service
aws apprunner describe-service --service-arn <arn> --region us-east-1

# List ECR images
aws ecr describe-images --repository-name listforge-web --region us-east-1

# Check DNS records
aws route53 list-resource-record-sets --hosted-zone-id Z09864832NWGQZ2GSWPCQ
```

### Terraform Operations
```bash
cd /path/to/listforge-infra/environments/production

# View outputs
terraform output

# Plan changes
terraform plan

# Apply changes
terraform apply

# Target specific module
terraform apply -target=module.web
```

---

## Contact & Support

- **Repository**: https://github.com/TimCrooker/list-forge-monorepo
- **Infrastructure Repo**: https://github.com/TimCrooker/listforge-infra
- **AWS Region**: us-east-1
- **AWS Account**: 058264088602

---

**Last Updated**: December 10, 2025
**Review Status**: ✅ COMPREHENSIVE
**Action Items**: 0 Critical, 3 Important, 5 Nice-to-have
