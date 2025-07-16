#!/bin/bash
# Build script for Vercel deployment

echo "Running Vercel build script..."

# Run the main build
node build-vercel.js

# Deploy database migrations only if DIRECT_URL is set
if [ -n "$DIRECT_URL" ]; then
  echo "Deploying database migrations..."
  npx prisma migrate deploy || echo "Migration deployment failed (this is expected if no migrations are pending)"
else
  echo "Skipping database migrations (DIRECT_URL not set)"
  echo "Note: Migrations should be run separately or DIRECT_URL should be configured in Vercel"
fi

echo "Build completed!"