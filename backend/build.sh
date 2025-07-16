#!/bin/bash
# Build script for Vercel deployment

echo "Running Vercel build script..."

# Copy shared package for Vercel
node scripts/copy-shared.js

# Run the main build
node build-vercel.js