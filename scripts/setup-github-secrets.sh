#!/bin/bash
set -e

echo "=== GitHub Secrets Setup ==="
echo ""
echo "This script will help you set up GitHub secrets for CI/CD."
echo "You'll need your Digital Ocean API token."
echo ""
echo "Get your token from: https://cloud.digitalocean.com/account/api/tokens"
echo ""

read -p "Enter your Digital Ocean API token: " DO_TOKEN

if [ -z "$DO_TOKEN" ]; then
  echo "Error: Token cannot be empty"
  exit 1
fi

echo ""
echo "Setting GitHub secret: DIGITALOCEAN_ACCESS_TOKEN"
gh secret set DIGITALOCEAN_ACCESS_TOKEN --body "$DO_TOKEN"

echo ""
echo "✓ GitHub secret set successfully!"
echo ""
echo "You can verify with: gh secret list"
