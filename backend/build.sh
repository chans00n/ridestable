#!/bin/bash
# Build script for Vercel deployment

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Building TypeScript..."
npx tsc

echo "Build complete!"