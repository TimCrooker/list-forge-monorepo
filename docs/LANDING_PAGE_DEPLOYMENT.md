# Landing Page Deployment Guide

This document outlines the deployment process for the ListForge landing page with the new domain architecture.

## New Domain Architecture

- **`list-forge.ai`** (root domain) → Landing page
- **`app.list-forge.ai`** → Web application
- **`api.list-forge.ai`** → API service

## Prerequisites

- Terraform installed (>= 1.5.0)
- AWS CLI configured with appropriate credentials
- GitHub repository access with admin permissions
- Existing infrastructure already deployed (VPC, database, cache, etc.)

## Deployment Steps

### 1. Apply Terraform Changes

Navigate to the infrastructure repository and apply the changes:

```bash
cd listforge-infra/environments/production

# Review the changes
terraform plan

# Apply the changes
terraform apply
```

This will:
- Create ECR repository for `listforge-landing`
- Create App Runner service for the landing page on root domain
- Update web app domain to `app.list-forge.ai`
- Output the new service ARNs

### 2. Capture Terraform Outputs

After the Terraform apply completes, capture the service ARN outputs:

```bash
# Get all service ARNs
terraform output api_service_arn
terraform output web_service_arn
terraform output landing_service_arn
```

Example output:
```
api_service_arn = "arn:aws:apprunner:us-east-1:123456789012:service/listforge-api/..."
web_service_arn = "arn:aws:apprunner:us-east-1:123456789012:service/listforge-web/..."
landing_service_arn = "arn:aws:apprunner:us-east-1:123456789012:service/listforge-landing/..."
```

### 3. Add GitHub Secrets

Add the service ARNs as GitHub secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add/update the following secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `APP_RUNNER_API_ARN` | `<api_service_arn from terraform>` | terraform output api_service_arn |
| `APP_RUNNER_WEB_ARN` | `<web_service_arn from terraform>` | terraform output web_service_arn |
| `APP_RUNNER_LANDING_ARN` | `<landing_service_arn from terraform>` | terraform output landing_service_arn |

**Note:** If `APP_RUNNER_API_ARN` and `APP_RUNNER_WEB_ARN` already exist, verify they match the Terraform outputs. Only `APP_RUNNER_LANDING_ARN` is new.

### 4. Trigger Deployment

Push your changes to the main branch or manually trigger the workflow:

```bash
# Push changes
git push origin main

# Or manually trigger via GitHub Actions UI
# Go to Actions → Deploy to AWS → Run workflow
```

The CI/CD pipeline will:
1. Build Docker images for API, Web, and Landing in parallel
2. Push images to ECR
3. Deploy each service to App Runner
4. Display deployment summary

### 5. Verify Deployment

After the deployment completes:

1. **Check App Runner services** in AWS Console:
   - Navigate to App Runner → Services
   - Verify all three services are running
   - Check custom domain associations

2. **Test the domains**:
   ```bash
   # Landing page (root domain)
   curl -I https://list-forge.ai

   # Web app (subdomain)
   curl -I https://app.list-forge.ai

   # API (subdomain)
   curl -I https://api.list-forge.ai/api/health
   ```

3. **Verify DNS propagation**:
   ```bash
   dig list-forge.ai
   dig app.list-forge.ai
   dig api.list-forge.ai
   ```

### 6. Update Bookmarks (User Communication)

**Important:** Existing users will need to update their bookmarks from `list-forge.ai` to `app.list-forge.ai` to access the web application.

Consider:
- Adding a redirect notice on the landing page
- Sending email notifications to existing users
- Updating documentation and support materials

## Rollback Procedure

If issues occur during deployment:

### Rollback GitHub Actions Deployment

1. Go to GitHub Actions → Deploy to AWS
2. Find the last successful deployment
3. Re-run that workflow

### Rollback Terraform Changes

```bash
cd listforge-infra/environments/production

# Revert to previous state
terraform apply -var="..." # with previous values

# Or destroy the landing service
terraform destroy -target=module.landing
```

### Emergency: Revert Domain Changes

If the domain change causes issues:

```bash
# Temporarily point root domain back to web app
cd listforge-infra/environments/production
# Edit apps.tf: change web module domain back to var.domain
# Edit apps.tf: comment out landing module
terraform apply
```

## Troubleshooting

### Landing Page Not Accessible

1. Check App Runner service status:
   ```bash
   aws apprunner describe-service \
     --service-arn <landing_service_arn> \
     --region us-east-1
   ```

2. Check custom domain association:
   ```bash
   aws apprunner describe-custom-domains \
     --service-arn <landing_service_arn> \
     --region us-east-1
   ```

3. Verify DNS records in Route 53

### Build Failures

1. Check GitHub Actions logs for specific errors
2. Verify build arguments are correctly set:
   - `VITE_APP_URL=https://app.list-forge.ai`
   - `VITE_API_URL=https://api.list-forge.ai`
3. Test build locally:
   ```bash
   docker build -f Dockerfile.landing \
     --build-arg VITE_APP_URL=https://app.list-forge.ai \
     --build-arg VITE_API_URL=https://api.list-forge.ai \
     -t listforge-landing .
   ```

### Web App Redirect Issues

If users are redirected incorrectly:
1. Check the landing page constants.ts for correct URLs
2. Verify nginx configuration is serving correct routes
3. Clear CDN/browser cache

## Architecture Details

### Build Process

All three services use similar build patterns:
- Multi-stage Docker builds
- Turbo repo pruning for dependencies
- Build-time environment variable injection
- nginx runtime for static sites (web + landing)
- Node.js runtime for API

### Environment Variables

**Landing Page Build Args:**
- `VITE_APP_URL`: URL for signup/login redirects
- `VITE_API_URL`: API endpoint (for potential future integrations)

These are baked into the static bundle at build time via Vite.

### Infrastructure Resources

Each app service includes:
- App Runner service with auto-scaling (1-3 instances)
- ECR repository for Docker images
- IAM roles for ECR access and runtime permissions
- Custom domain associations via Route 53
- Health checks and monitoring

## Monitoring

After deployment, monitor:

1. **App Runner Metrics** (CloudWatch):
   - Request count
   - Response latency
   - 4xx/5xx error rates
   - CPU/Memory utilization

2. **Custom Domain Status**:
   - Certificate validation
   - DNS propagation
   - SSL/TLS handshake success

3. **Cost Tracking**:
   - Additional App Runner service costs
   - ECR storage costs
   - Data transfer costs

## Additional Resources

- [App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review CloudWatch logs for the service
3. Verify Terraform state matches expected configuration
4. Contact DevOps team if infrastructure changes are needed
