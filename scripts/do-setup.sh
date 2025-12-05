#!/bin/bash
set -e

REGION="nyc1"
REGISTRY_NAME="listforge"
DB_NAME="listforge-db"
REDIS_NAME="listforge-redis"
PROJECT_ID="ec096054-c330-4754-8ef5-cb987e5afc10"  # List Forge project

echo "=== ListForge DO Infrastructure Setup ==="

# Check doctl is installed
if ! command -v doctl &> /dev/null; then
  echo "Installing doctl..."
  brew install doctl
fi

# Authenticate if needed
doctl auth list &>/dev/null || doctl auth init

echo ""
echo "=== 1. Creating/Checking Container Registry ==="
if doctl registry get &>/dev/null; then
  echo "Registry already exists"
else
  doctl registry create $REGISTRY_NAME --subscription-tier basic
fi
doctl registry login
echo "Registry: registry.digitalocean.com/$REGISTRY_NAME"

echo ""
echo "=== 2. Creating/Checking Managed Postgres ==="
DB_ID=$(doctl databases list --format ID,Name --no-header | grep "$DB_NAME" | awk '{print $1}')
if [ -n "$DB_ID" ]; then
  echo "Postgres database already exists: $DB_ID"
else
  echo "Creating Postgres database..."
  doctl databases create $DB_NAME \
    --engine pg \
    --version 15 \
    --size db-s-1vcpu-1gb \
    --region $REGION \
    --num-nodes 1 \
    --wait
  DB_ID=$(doctl databases list --format ID,Name --no-header | grep "$DB_NAME" | awk '{print $1}')
fi

# Assign database to project
echo "Assigning database to List Forge project..."
doctl projects resources assign $PROJECT_ID --resource=do:dbaas:$DB_ID 2>/dev/null || echo "Already assigned"

echo ""
echo "=== 3. Creating/Checking Managed Redis ==="
REDIS_ID=$(doctl databases list --format ID,Name --no-header 2>/dev/null | grep "$REDIS_NAME" | awk '{print $1}')
if [ -n "$REDIS_ID" ]; then
  echo "Redis database already exists: $REDIS_ID"
else
  echo "Attempting to create Redis database..."
  if doctl databases create $REDIS_NAME \
    --engine redis \
    --version 7 \
    --size db-s-1vcpu-1gb \
    --region $REGION \
    --num-nodes 1 \
    --wait 2>&1; then
    REDIS_ID=$(doctl databases list --format ID,Name --no-header | grep "$REDIS_NAME" | awk '{print $1}')
    # Assign Redis to project
    doctl projects resources assign $PROJECT_ID --resource=do:dbaas:$REDIS_ID 2>/dev/null || echo "Already assigned"
  else
    echo ""
    echo "WARNING: Redis creation failed. Your account may need Redis enabled."
    echo "Create manually at: https://cloud.digitalocean.com/databases"
    echo ""
  fi
fi

echo ""
echo "=== 4. Getting Connection Strings ==="
if [ -n "$DB_ID" ]; then
  DATABASE_URL=$(doctl databases connection $DB_ID --format URI --no-header)
  echo "DATABASE_URL=$DATABASE_URL"
fi

if [ -n "$REDIS_ID" ]; then
  REDIS_URL=$(doctl databases connection $REDIS_ID --format URI --no-header)
  echo "REDIS_URL=$REDIS_URL"
fi

echo ""
echo "=== 5. Creating/Checking App Platform App ==="

# Check if app already exists
APP_ID=$(doctl apps list --output json 2>/dev/null | jq -r '.[] | select(.spec.name=="listforge") | .id' | head -1)

if [ -n "$APP_ID" ] && [ "$APP_ID" != "null" ]; then
  echo "App already exists with ID: $APP_ID"
  echo "Updating app spec..."
  doctl apps update $APP_ID --spec .do/app.yaml --wait || echo "Update may have failed"
else
  echo "Creating new app..."
  APP_ID=$(doctl apps create --spec .do/app.yaml --project-id $PROJECT_ID --format ID --no-header --wait)
  echo "App created with ID: $APP_ID"
fi

# Ensure app is assigned to project
echo "Ensuring app is in List Forge project..."
doctl projects resources assign $PROJECT_ID --resource=do:app:$APP_ID 2>/dev/null || echo "Already assigned"

echo ""
echo "=== 6. Verifying Project Resources ==="
doctl projects resources list $PROJECT_ID

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Database URL: $DATABASE_URL"
[ -n "$REDIS_URL" ] && echo "Redis URL: $REDIS_URL"
echo ""
echo "Next steps:"
echo "1. Set app secrets in DO dashboard (DATABASE_URL, REDIS_URL, JWT_SECRET, OPENAI_API_KEY)"
echo "2. Create Redis manually if it failed above"
echo "3. Run: gh secret set DIGITALOCEAN_ACCESS_TOKEN"
