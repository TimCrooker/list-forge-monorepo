# Local Storage Setup (MinIO)

Use MinIO for S3-compatible local storage during development.

## Quick Start

1. **Start services:**
   ```bash
   docker-compose up -d
   ```

   Starts PostgreSQL, Redis, and MinIO with auto-configured bucket.

2. **Configure `.env`:**
   ```env
   STORAGE_PROVIDER=s3
   S3_BUCKET=listforge-uploads
   S3_REGION=us-east-1
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   ```

3. **Start API and upload files**

Files accessible at: `http://localhost:9000/listforge-uploads/{filename}`

## Manual Bucket Setup (if needed)

**Using MinIO Console:**
- Open http://localhost:9001
- Login: `minioadmin` / `minioadmin`
- Create bucket: `listforge-uploads`
- Set to public

**Using CLI:**
```bash
# Install MinIO client: brew install minio/stable/mc
docker exec listforge-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec listforge-minio mc mb local/listforge-uploads
docker exec listforge-minio mc anonymous set download local/listforge-uploads
```

## Switch to Production S3

Remove MinIO-specific variables from `.env`:

```env
STORAGE_PROVIDER=s3
S3_BUCKET=your-production-bucket
S3_REGION=us-east-1
# Remove these:
# S3_ENDPOINT=...
# S3_ACCESS_KEY_ID=...
# S3_SECRET_ACCESS_KEY=...
```

AWS SDK will use IAM role or AWS credentials automatically.

## Troubleshooting

- **Connection refused:** Check MinIO is running (`docker-compose ps`)
- **NoSuchBucket:** Run `docker-compose up -d minio-init`
- **Access Denied:** Bucket needs public read permissions
