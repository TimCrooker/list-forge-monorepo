# Local Storage Setup with MinIO

This guide explains how to set up MinIO (S3-compatible local storage) for local development.

## Quick Start

1. **Start all local services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - **PostgreSQL** (database)
   - **Redis** (cache/queues)
   - **MinIO** (S3-compatible storage)
   - **MinIO Init** (automatically creates and configures the bucket)

   The `minio-init` service runs once and:
   - Creates the `listforge-uploads` bucket
   - Sets public read permissions
   - Exits after completion

   No manual bucket creation needed! 🎉

2. **Configure your `.env` file:**
   ```env
   STORAGE_PROVIDER=s3
   S3_BUCKET=listforge-uploads
   S3_REGION=us-east-1
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   ```

3. **Start your API server** and you're ready to go!

## Manual Bucket Creation (Optional)

The bucket is automatically created when the API starts, but if you need to create it manually:

**Option 1: Use the setup script:**
```bash
./scripts/setup-minio.sh
```

**Option 2: Use MinIO Console:**
- Open http://localhost:9001
- Login: `minioadmin` / `minioadmin`
- Click "Create Bucket"
- Name it: `listforge-uploads`
- Set it to **Public**

**Option 3: Use MinIO client (mc):**
```bash
# Install MinIO client (mc)
# macOS: brew install minio/stable/mc

# Configure MinIO client
docker exec listforge-minio mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
docker exec listforge-minio mc mb local/listforge-uploads

# Make bucket public
docker exec listforge-minio mc anonymous set download local/listforge-uploads
```

## How It Works

- **MinIO** is an S3-compatible object storage server that runs locally
- It uses the same AWS SDK (`@aws-sdk/client-s3`) as production
- No code changes needed - just environment variables
- Files are stored in Docker volume `minio_data`

## Accessing Files

Once uploaded, files will be accessible at:
```
http://localhost:9000/listforge-uploads/{filename}
```

## Switching Back to Production

To switch back to AWS S3, simply remove or comment out the `S3_ENDPOINT` variable:

```env
STORAGE_PROVIDER=s3
S3_BUCKET=your-production-bucket
S3_REGION=us-east-1
# S3_ENDPOINT=http://localhost:9000  # Comment out for AWS
# S3_ACCESS_KEY_ID=minioadmin        # Comment out for AWS
# S3_SECRET_ACCESS_KEY=minioadmin     # Comment out for AWS
```

AWS SDK will automatically use AWS credentials from your environment (IAM role, credentials file, or env vars).

## Troubleshooting

- **Connection refused**: Make sure MinIO is running (`docker-compose ps`)
- **Bucket not created automatically**: Check if `minio-init` service ran successfully: `docker-compose logs minio-init`. You can manually create it using `./scripts/setup-minio.sh`
- **Access Denied**: The bucket should be created with public read permissions automatically. If not, run `./scripts/setup-minio.sh`
- **Wrong URL format**: Ensure `S3_ENDPOINT` is set correctly (with `http://` or `https://`)
- **NoSuchBucket error**: Run `docker-compose up -d minio-init` to recreate the bucket, or use `./scripts/setup-minio.sh`
