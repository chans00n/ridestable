#!/bin/bash

echo "🚀 Stable Ride Production Setup Script"
echo "====================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Creating .env.production from template..."
    cp .env.production.example .env.production
    echo "✅ Created .env.production - Please update with your actual values!"
else
    echo "✅ .env.production already exists"
fi

# Backend setup
echo ""
echo "Setting up backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if we can connect to database
echo ""
echo "Testing database connection..."
npx prisma db push --skip-generate --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    
    # Ask if user wants to push schema
    read -p "Do you want to push the schema to the database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma db push
        echo "✅ Schema pushed to database"
    fi
else
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env.production"
fi

# Build backend
echo ""
echo "Building backend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful!"
else
    echo "❌ Backend build failed"
fi

# Frontend setup
echo ""
echo "Setting up frontend..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed"
fi

cd ..

echo ""
echo "====================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your actual values"
echo "2. Create projects on Vercel"
echo "3. Follow the deployment guide in DEPLOYMENT.md"
echo ""
echo "To test locally with production config:"
echo "  cd backend && npm run dev:prod"
echo "  cd frontend && npm run dev:prod"