#!/bin/bash
# Setup MinIO bucket for local development
# This script creates the bucket and sets public read permissions

set -e

BUCKET_NAME="${S3_BUCKET:-listforge-uploads}"
MINIO_CONTAINER="${MINIO_CONTAINER:-listforge-minio}"

echo "Setting up MinIO bucket: $BUCKET_NAME"

# Check if MinIO container is running
if ! docker ps | grep -q "$MINIO_CONTAINER"; then
  echo "Error: MinIO container '$MINIO_CONTAINER' is not running"
  echo "Start it with: docker-compose up -d minio"
  exit 1
fi

# Configure MinIO client alias
echo "Configuring MinIO client..."
docker exec "$MINIO_CONTAINER" mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true

# Check if bucket exists
if docker exec "$MINIO_CONTAINER" mc ls local/ | grep -q "$BUCKET_NAME"; then
  echo "Bucket '$BUCKET_NAME' already exists"
else
  echo "Creating bucket '$BUCKET_NAME'..."
  docker exec "$MINIO_CONTAINER" mc mb "local/$BUCKET_NAME"
  echo "Bucket created successfully"
fi

# Set public read permissions
echo "Setting public read permissions..."
docker exec "$MINIO_CONTAINER" mc anonymous set download "local/$BUCKET_NAME"
echo "Public read permissions set"

echo "✅ MinIO setup complete!"
echo "Bucket: $BUCKET_NAME"
echo "Access at: http://localhost:9000/$BUCKET_NAME/"
