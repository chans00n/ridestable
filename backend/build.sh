#!/bin/bash
# Build script for Vercel deployment

echo "Running Vercel build script..."

# Bundle shared types into backend
node scripts/bundle-shared.js

# Run the main build
node build-vercel.js