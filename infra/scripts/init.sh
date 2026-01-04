#!/bin/bash

# Initialize infrastructure project
# This script sets up the infrastructure folder for first-time use

set -e

echo "🚀 Initializing Kefir App Infrastructure..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher is required"
  exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ Error: AWS CLI is not installed"
  echo "Install from: https://aws.amazon.com/cli/"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo "❌ Error: AWS credentials are not configured"
  echo "Run: aws configure"
  exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to infra directory
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local..."
  cat > .env.local << EOF
# Kefir App Infrastructure Environment Variables
STAGE=dev
EOF
  echo "✅ Created .env.local"
fi

echo ""
echo "✨ Infrastructure initialization complete!"
echo ""
echo "Next steps:"
echo "1. Review the PLAN.md file"
echo "2. Deploy to dev: npm run deploy:dev"
echo "3. Open SST Console: npm run console"
echo ""

