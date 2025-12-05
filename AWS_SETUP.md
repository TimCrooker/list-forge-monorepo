# AWS Infrastructure Setup Summary

## Resources Created

### Container Registry (ECR)
- **API Repository**: `listforge-api`
- **Web Repository**: `listforge-web`
- **Region**: us-east-1
- **Registry**: `058264088602.dkr.ecr.us-east-1.amazonaws.com`

### Compute (App Runner)
- **API Service**: `listforge-api`
  - ARN: `arn:aws:apprunner:us-east-1:058264088602:service/listforge-api/4af5e0cffb134d2795ea1f45ec55a0a7`
  - URL: `https://brjuvwptyp.us-east-1.awsapprunner.com`
- **Web Service**: `listforge-web`
  - ARN: `arn:aws:apprunner:us-east-1:058264088602:service/listforge-web/fccce1796fbc463fa52822248df66742`
  - URL: `https://8v7iyhqbvj.us-east-1.awsapprunner.com`

### Database (RDS)
- **Instance**: `listforge-db`
- **Engine**: PostgreSQL 15.7
- **Class**: db.t3.micro
- **Status**: Creating (check with `aws rds describe-db-instances --db-instance-identifier listforge-db --region us-east-1`)

### Cache (ElastiCache)
- **Cluster**: `listforge-redis`
- **Engine**: Redis 7.0
- **Node Type**: cache.t3.micro
- **Status**: Creating (check with `aws elasticache describe-cache-clusters --cache-cluster-id listforge-redis --region us-east-1`)

### Storage (S3)
- **Bucket**: `listforge-uploads-1764905891`
- **Region**: us-east-1
- **Public Read**: Enabled for uploaded files

### IAM
- **Role**: `AppRunnerECRAccessRole` (for App Runner to access ECR)
- **User**: `github-actions-listforge` (for CI/CD)

## GitHub Secrets Configured

✅ `AWS_ACCESS_KEY_ID`
✅ `AWS_SECRET_ACCESS_KEY`
✅ `AWS_ACCOUNT_ID`
✅ `APP_RUNNER_API_ARN`
✅ `APP_RUNNER_WEB_ARN`
✅ `APP_RUNNER_API_URL`

## Next Steps

1. **Wait for RDS and Redis to be available** (5-10 minutes)
   ```bash
   aws rds describe-db-instances --db-instance-identifier listforge-db --region us-east-1
   aws elasticache describe-cache-clusters --cache-cluster-id listforge-redis --region us-east-1
   ```

2. **Get connection strings**:
   ```bash
   # RDS
   aws rds describe-db-instances --db-instance-identifier listforge-db --region us-east-1 --query "DBInstances[0].Endpoint.Address" --output text

   # Redis
   aws elasticache describe-cache-clusters --cache-cluster-id listforge-redis --region us-east-1 --show-cache-node-info --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text
   ```

3. **Configure App Runner environment variables**:
   - Go to AWS Console → App Runner → listforge-api → Configuration
   - Add environment variables:
     - `DATABASE_URL`: `postgresql://listforge:<password>@<rds-endpoint>:5432/postgres`
     - `REDIS_URL`: `redis://<redis-endpoint>:6379`
     - `JWT_SECRET`: (generate with `openssl rand -base64 32`)
     - `OPENAI_API_KEY`: (your OpenAI key)
     - `STORAGE_PROVIDER`: `s3`
     - `S3_BUCKET`: `listforge-uploads-1764905891`
     - `S3_REGION`: `us-east-1`
     - `FRONTEND_URL`: `https://8v7iyhqbvj.us-east-1.awsapprunner.com`

4. **Push Docker images** (first deployment):
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 058264088602.dkr.ecr.us-east-1.amazonaws.com

   # Build and push API
   docker build -f Dockerfile.api -t 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-api:latest .
   docker push 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-api:latest

   # Build and push Web
   docker build -f Dockerfile.web --build-arg VITE_API_URL=https://brjuvwptyp.us-east-1.awsapprunner.com/api -t 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-web:latest .
   docker push 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-web:latest
   ```

5. **Trigger deployment**:
   - Push to `main` branch, or
   - Manually trigger: `aws apprunner start-deployment --service-arn <arn> --region us-east-1`

## CI/CD

The GitHub Actions workflow (`.github/workflows/deploy-aws.yml`) will:
1. Build Docker images on push to `main`
2. Push to ECR
3. Trigger App Runner deployments automatically

## Estimated Monthly Cost

- App Runner (API + Web): ~$10-30
- RDS Postgres (db.t3.micro): ~$15 (free tier: $0 first 12 months)
- ElastiCache Redis (cache.t3.micro): ~$12
- ECR Storage: ~$1
- S3: ~$1-5
- **Total**: ~$40-60/mo (first year: ~$25-45/mo with free tier)

