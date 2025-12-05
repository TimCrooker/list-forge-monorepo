# Deployment Guide

## Production Environment Variables

### Frontend (listforge-web)

**Required Environment Variables:**

- `VITE_API_URL` - **REQUIRED** - The base URL of your API server
  - Example: `https://api.list-forge.ai` or `https://api.yourdomain.com`
  - **Must be set at build time** (Vite bakes env vars into the bundle)
  - If not set, the app will default to `http://localhost:3001` which will fail in production

**How to Set in Vercel:**
1. Go to your project settings → Environment Variables
2. Add `VITE_API_URL` with your API URL (e.g., `https://api.list-forge.ai`)
3. Make sure it's set for "Production" environment
4. Redeploy your application

**How to Set in Other Platforms:**
- Set `VITE_API_URL` as an environment variable before running `pnpm build`
- The value will be baked into the JavaScript bundle at build time

### Backend (listforge-api)

See `apps/listforge-api/.env.example` for all required environment variables.

**Critical Variables:**
- `DATABASE_URL` or individual DB config (`DB_HOST`, `DB_PORT`, etc.)
- `REDIS_URL` or individual Redis config (`REDIS_HOST`, `REDIS_PORT`, etc.)
- `JWT_SECRET` - **MUST be changed from default in production**
- `FRONTEND_URL` - Should match your frontend domain (e.g., `https://www.list-forge.ai`)
- `OPENAI_API_KEY` - Required for AI workflows
- `BLOB_READ_WRITE_TOKEN` - Required for photo storage
- `EBAY_APP_ID`, `EBAY_CERT_ID` - Required for eBay marketplace integration

## Common Issues

### 404 Errors on API Calls

**Symptom:** Frontend shows 404 errors when trying to call API endpoints.

**Cause:** `VITE_API_URL` is not set in production, so the frontend defaults to `http://localhost:3001`.

**Solution:**
1. Set `VITE_API_URL` environment variable in your deployment platform
2. Ensure it points to your actual API server URL
3. Rebuild and redeploy the frontend

**Example:**
```bash
# If your API is at https://api.list-forge.ai
VITE_API_URL=https://api.list-forge.ai
```

### CORS Errors

**Symptom:** Browser console shows CORS errors when making API requests.

**Cause:** Backend `FRONTEND_URL` doesn't match the actual frontend domain.

**Solution:**
1. Set `FRONTEND_URL` environment variable in your backend deployment
2. Include all domains that should have access (comma-separated)
3. Restart the backend server

**Example:**
```bash
FRONTEND_URL=https://www.list-forge.ai,https://list-forge.ai
```

### API Calls Going to Wrong Domain

**Symptom:** Network tab shows requests going to `https://www.list-forge.ai/login` instead of API endpoint.

**Cause:** This is likely a route check (HEAD request) from TanStack Router or Vercel, not the actual API call. The real issue is that API calls are failing because `VITE_API_URL` isn't set.

**Solution:** Set `VITE_API_URL` as described above.

## Deployment Architecture

### Option 1: Separate Domains (Recommended)
- Frontend: `https://www.list-forge.ai` (Vercel)
- API: `https://api.list-forge.ai` (Vercel Serverless Functions, Railway, Render, etc.)
- Set `VITE_API_URL=https://api.list-forge.ai`

### Option 2: Same Domain, Different Paths
- Frontend: `https://www.list-forge.ai`
- API: `https://www.list-forge.ai/api`
- Set `VITE_API_URL=https://www.list-forge.ai`
- Configure your API server to handle `/api/*` routes

### Option 3: Monorepo Deployment
- Deploy both frontend and API from the same repository
- Use Vercel's monorepo support or similar
- Set `VITE_API_URL` to point to your API routes

## Verifying Configuration

After deployment, check the browser console:
1. Look for any warnings about `VITE_API_URL` not being set
2. Check Network tab - API calls should go to the correct domain
3. API calls should be to `{VITE_API_URL}/api/{endpoint}`

Example correct API call:
```
POST https://api.list-forge.ai/api/auth/login
```

Example incorrect API call (if VITE_API_URL not set):
```
POST http://localhost:3001/api/auth/login  ❌ (will fail)
```

