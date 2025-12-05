#!/bin/bash
set -e

REGION="us-east-1"
PROJECT="listforge"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== ListForge AWS Infrastructure Setup ==="
echo "Account: $AWS_ACCOUNT_ID"
echo "Region: $REGION"
echo ""

# Generate random password for RDS
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "=== 1. Creating ECR Repositories ==="
aws ecr create-repository --repository-name ${PROJECT}-api --region $REGION 2>/dev/null || echo "ECR repo ${PROJECT}-api already exists"
aws ecr create-repository --repository-name ${PROJECT}-web --region $REGION 2>/dev/null || echo "ECR repo ${PROJECT}-web already exists"

echo ""
echo "=== 2. Creating VPC and Security Groups ==="
# Get default VPC or create one
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $REGION 2>/dev/null || echo "")

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
  echo "Creating VPC..."
  VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region $REGION --query "Vpc.VpcId" --output text)
  aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames --region $REGION
  aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support --region $REGION
fi

echo "Using VPC: $VPC_ID"

# Get default security group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text --region $REGION)

echo "Using Security Group: $SG_ID"

# Allow inbound Postgres (5432) and Redis (6379) from VPC
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16 \
  --region $REGION 2>/dev/null || echo "Postgres rule may already exist"

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 6379 \
  --cidr 10.0.0.0/16 \
  --region $REGION 2>/dev/null || echo "Redis rule may already exist"

# Get subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $REGION | awk '{print $1","$2}')

if [ -z "$SUBNET_IDS" ] || [ "$SUBNET_IDS" == "None" ]; then
  echo "Creating subnets..."
  SUBNET1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${REGION}a --region $REGION --query "Subnet.SubnetId" --output text)
  SUBNET2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${REGION}b --region $REGION --query "Subnet.SubnetId" --output text)
  SUBNET_IDS="$SUBNET1,$SUBNET2"
fi

echo "Using Subnets: $SUBNET_IDS"

echo ""
echo "=== 3. Creating RDS Postgres ==="
# Create DB subnet group first
aws rds create-db-subnet-group \
  --db-subnet-group-name ${PROJECT}-subnet-group \
  --db-subnet-group-description "Subnet group for ${PROJECT}" \
  --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
  --region $REGION 2>/dev/null || echo "DB subnet group may already exist"

DB_IDENTIFIER="${PROJECT}-db"
if aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION 2>/dev/null | grep -q "DBInstanceStatus"; then
  echo "RDS instance already exists"
else
  aws rds create-db-instance \
    --db-instance-identifier $DB_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.7 \
    --master-username listforge \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --vpc-security-group-ids $SG_ID \
    --db-subnet-group-name ${PROJECT}-subnet-group \
    --backup-retention-period 7 \
    --region $REGION 2>&1 | head -20 || echo "RDS creation initiated"
fi

echo "RDS Password: $DB_PASSWORD"
echo "Save this password! It will be stored in Secrets Manager."

echo ""
echo "=== 4. Creating ElastiCache Redis ==="
REDIS_ID="${PROJECT}-redis"
if aws elasticache describe-cache-clusters --cache-cluster-id $REDIS_ID --region $REGION 2>/dev/null | grep -q "CacheClusterStatus"; then
  echo "Redis cluster already exists"
else
  # Create subnet group for ElastiCache
  aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name ${PROJECT}-cache-subnet \
    --cache-subnet-group-description "Subnet group for ${PROJECT} Redis" \
    --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
    --region $REGION 2>/dev/null || echo "Cache subnet group may already exist"

  aws elasticache create-cache-cluster \
    --cache-cluster-id $REDIS_ID \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --cache-subnet-group-name ${PROJECT}-cache-subnet \
    --security-group-ids $SG_ID \
    --region $REGION
fi

echo ""
echo "=== 5. Creating S3 Bucket ==="
BUCKET_NAME="${PROJECT}-uploads-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket may already exist"
echo "Bucket: $BUCKET_NAME"

# Enable public read for uploaded files
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
  }]
}" 2>/dev/null || echo "Policy may already exist"

echo ""
echo "=== 6. Storing Secrets in Secrets Manager ==="
# Store DB password
aws secretsmanager create-secret \
  --name ${PROJECT}/database/password \
  --secret-string "$DB_PASSWORD" \
  --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id ${PROJECT}/database/password \
  --secret-string "$DB_PASSWORD" \
  --region $REGION

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Wait for RDS to be available (5-10 minutes)"
echo "2. Get connection strings:"
echo "   RDS: aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION"
echo "   Redis: aws elasticache describe-cache-clusters --cache-cluster-id $REDIS_ID --region $REGION"
echo "3. Create App Runner services (see infrastructure/app-runner-*.json)"
echo "4. Add secrets to GitHub: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ACCOUNT_ID"

