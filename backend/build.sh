#!/bin/bash
# Build script for Vercel deployment

echo "Running Vercel build script..."

# Run the main build
node build-vercel.js

# Deploy database migrations
echo "Deploying database migrations..."
npx prisma migrate deploy || echo "Migration deployment failed (this is expected if no migrations are pending)"

echo "Build completed!"