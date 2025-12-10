# Production Deployment Guide

Quick reference for deploying ListForge to production.

## Required Environment Variables

### Backend (listforge-api)

See `apps/listforge-api/.env.example` for complete list. Critical variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (required for BullMQ)
REDIS_URL=redis://host:6379

# Security (MUST change from defaults)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# CORS
FRONTEND_URL=https://app.yourdomain.com

# AI Features
OPENAI_API_KEY=sk-...

# Storage
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
# AWS credentials via IAM role or env vars

# Marketplaces (optional)
EBAY_APP_ID=...
EBAY_CERT_ID=...
EBAY_SANDBOX=false
KEEPA_API_KEY=...
```

### Frontend (listforge-web)

**Critical:** The frontend requires `VITE_API_URL` at **build time**.

```bash
# MUST be set before running pnpm build
VITE_API_URL=https://api.yourdomain.com
```

Vite bakes environment variables into the JavaScript bundle during build. If not set, the app defaults to `http://localhost:3001` and will fail in production.

**Vercel/Netlify:**
- Set `VITE_API_URL` in project settings under Environment Variables
- Select "Production" environment
- Redeploy after adding

**Docker/Other Platforms:**
```bash
VITE_API_URL=https://api.yourdomain.com pnpm build
```

## Architecture Options

### Option 1: Separate Domains (Recommended)
```
Frontend: https://app.yourdomain.com
API:      https://api.yourdomain.com

Backend env:  FRONTEND_URL=https://app.yourdomain.com
Frontend env: VITE_API_URL=https://api.yourdomain.com
```

### Option 2: Subdirectory
```
Frontend: https://yourdomain.com
API:      https://yourdomain.com/api

Backend env:  FRONTEND_URL=https://yourdomain.com
Frontend env: VITE_API_URL=https://yourdomain.com
```

Configure your API server to handle `/api/*` routes.

## Security Checklist

- [ ] Change `JWT_SECRET` from default
- [ ] Generate new `ENCRYPTION_KEY` (`openssl rand -hex 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS with specific domains (no wildcards)
- [ ] Use environment-specific credentials (dev/staging/prod)
- [ ] Store secrets in vault (AWS Secrets Manager, etc.)
- [ ] Enable database SSL (`DB_SSL=true`)
- [ ] Review and limit `FRONTEND_URL` list

## Common Issues

### API calls return 404
**Cause:** `VITE_API_URL` not set at build time
**Fix:** Set environment variable and rebuild frontend

### CORS errors
**Cause:** `FRONTEND_URL` doesn't match actual domain
**Fix:** Update `FRONTEND_URL` in backend, restart server

### Database connection failed
**Cause:** Wrong `DATABASE_URL` or SSL required
**Fix:** Check connection string, add `?sslmode=require` if needed

### Redis connection failed
**Cause:** Redis not accessible from backend
**Fix:** Check `REDIS_URL`, ensure network access, verify Redis is running

## Verification

After deployment, verify:

1. **Frontend loads:** Visit your frontend URL
2. **API accessible:** Visit `{API_URL}/api/health` or similar
3. **API calls work:** Open browser console, check Network tab
   - Calls should go to `{VITE_API_URL}/api/*`
   - Should return 200 or appropriate status codes
4. **Database connected:** Backend logs should show TypeORM connection
5. **Redis connected:** Backend logs should show BullMQ ready

## Cost Optimization

- Use smallest instance sizes that handle your traffic
- Enable auto-scaling only if needed
- Use managed services (RDS, ElastiCache) for production reliability
- Consider reserved instances for predictable workloads
- Monitor S3 storage lifecycle rules
- Review CloudWatch/monitoring costs

## Monitoring Recommendations

Monitor these metrics:

- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database connection pool usage
- Redis memory usage
- BullMQ job queue lengths
- S3 request counts and errors
- OpenAI API usage and costs

Set up alerts for:
- High error rates (>5% of requests)
- Slow response times (p95 > 1s)
- Failed background jobs
- Database connection exhaustion
- Redis memory near capacity
