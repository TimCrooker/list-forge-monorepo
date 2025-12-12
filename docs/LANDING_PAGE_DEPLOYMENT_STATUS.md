# Landing Page Deployment Status

**Status**: Infrastructure Complete ✅
**Date**: December 11, 2025
**Next Step**: Update image once landing build completes

## Infrastructure Status

### ✅ App Runner Services Created

All three services are running:

| Service | Domain | Status | ARN |
|---------|--------|--------|-----|
| **Landing** | `list-forge.ai` | ✅ RUNNING / active | `arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808` |
| **Web** | `app.list-forge.ai` | ✅ RUNNING / pending_certificate_dns_validation | `arn:aws:apprunner:us-east-1:058264088602:service/listforge-web/fede0856787845bd8abc7833974b4ac7` |
| **API** | `api.list-forge.ai` | ✅ RUNNING / active | `arn:aws:apprunner:us-east-1:058264088602:service/listforge-api/c8ab4b429650439eb7ea4aeb9fa72f7f` |

**Note**: The web domain `app.list-forge.ai` is pending DNS validation - this is normal and will complete automatically within a few minutes.

### ✅ ECR Repositories

```bash
- listforge-api ✅
- listforge-web ✅
- listforge-landing ✅
```

### ✅ GitHub Secrets

```bash
APP_RUNNER_API_ARN ✅
APP_RUNNER_WEB_ARN ✅
APP_RUNNER_LANDING_ARN ✅ (just added)
```

### ✅ Terraform Outputs

All outputs configured in `listforge-infra/environments/production/outputs.tf`:
- `api_service_arn`
- `web_service_arn`
- `landing_service_arn`
- Plus custom domains and URLs for each

## Current Configuration

### Landing Service (Temporary)

Currently using **web app image as placeholder**:
- Image: `listforge-web:latest`
- Purpose: Bootstrap infrastructure while landing image is being built
- Domain: `list-forge.ai` (root domain)

This is **INTENTIONAL** and **TEMPORARY**.

## Next Steps

### 1. Wait for Landing Build to Complete

Monitor the monorepo CI/CD:
```bash
cd /Users/timothycrooker/list-forge-monorepo
gh run list --limit 1
```

Current build in progress: Building and pushing `listforge-landing` Docker image to ECR

### 2. Update Terraform to Use Actual Landing Image

Once the landing image is built and pushed to ECR, update the infrastructure:

```bash
cd /Users/timothycrooker/listforge-infra/environments/production
```

Edit `apps.tf` - change landing module image from:
```hcl
image = "${local.ecr_registry}/listforge-web:latest"
```

To:
```hcl
image = "${local.ecr_registry}/listforge-landing:latest"
```

Then apply:
```bash
git add apps.tf
git commit -m "Update landing service to use actual landing image"
git push origin main
# Monitor Terraform apply
gh run list --limit 1
```

### 3. Verify Domains

After everything deploys, test all domains:

```bash
# Landing page (root domain)
curl -I https://list-forge.ai

# Web app (subdomain)
curl -I https://app.list-forge.ai

# API (subdomain)
curl -I https://api.list-forge.ai/api/health
```

### 4. Monitor DNS Propagation

Check DNS records:
```bash
dig list-forge.ai
dig app.list-forge.ai
dig api.list-forge.ai
```

## Verification Commands

### Check Service Status
```bash
aws apprunner list-services --region us-east-1 \
  --query 'ServiceSummaryList[?starts_with(ServiceName, `listforge-`)].[ServiceName, Status]' \
  --output table
```

### Check Domain Associations
```bash
# Landing
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808 \
  --region us-east-1

# Web
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-web/fede0856787845bd8abc7833974b4ac7 \
  --region us-east-1

# API
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-api/c8ab4b429650439eb7ea4aeb9fa72f7f \
  --region us-east-1
```

### Check ECR Images
```bash
aws ecr describe-images --repository-name listforge-landing --region us-east-1
```

## Architecture Summary

**Before:**
- `list-forge.ai` → Web App
- `api.list-forge.ai` → API

**After (New):**
- `list-forge.ai` → **Landing Page** 🆕
- `app.list-forge.ai` → Web App (moved)
- `api.list-forge.ai` → API (unchanged)

## Files Created/Modified

### Monorepo (`list-forge-monorepo`)
- ✅ `Dockerfile.landing` - Multi-stage Docker build
- ✅ `apps/listforge-landing/nginx.conf` - nginx SPA routing config
- ✅ `apps/listforge-landing/**` - Complete landing page application
- ✅ `.github/workflows/deploy-aws.yml` - Added landing build/deploy jobs
- ✅ `docs/LANDING_PAGE_DEPLOYMENT.md` - Comprehensive deployment guide

### Infrastructure (`listforge-infra`)
- ✅ `environments/production/apps.tf` - Added landing module, updated web domain
- ✅ `environments/production/outputs.tf` - Added landing service outputs

## Troubleshooting

### If Landing Service Fails to Start

Check the service logs:
```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808 \
  --region us-east-1
```

### If Domain Validation Takes Too Long

Web app domain validation (`app.list-forge.ai`) is pending. If it takes more than 30 minutes:
1. Check Route 53 records
2. Verify ACM certificate is valid
3. Check App Runner custom domain status

### If Need to Rollback

1. Revert infrastructure changes:
```bash
cd /Users/timothycrooker/listforge-infra
git revert HEAD
git push origin main
```

2. Or destroy landing service only:
```bash
terraform destroy -target=module.landing
```

## Success Criteria

- [ ] Landing Docker image built and pushed to ECR
- [ ] Landing service updated to use actual landing image
- [ ] All three domains responding:
  - [ ] `https://list-forge.ai` shows landing page
  - [ ] `https://app.list-forge.ai` shows web app
  - [ ] `https://api.list-forge.ai/api/health` returns 200
- [ ] DNS fully propagated
- [ ] SSL certificates valid on all domains

## Timeline

- **13:12 UTC** - Initial Terraform apply failed (no image in ECR)
- **13:31 UTC** - Updated to use web image as placeholder
- **13:32 UTC** - Terraform apply succeeded, all infrastructure created
- **13:38 UTC** - GitHub secret `APP_RUNNER_LANDING_ARN` added
- **13:28 UTC** - Landing page app committed and build started
- **Next** - Wait for build, update to actual image, verify domains

## Contact / Support

For issues:
1. Check GitHub Actions logs for build failures
2. Check CloudWatch logs for App Runner services
3. Verify Terraform state matches expected configuration
4. Review `docs/LANDING_PAGE_DEPLOYMENT.md` for detailed procedures
