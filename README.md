# Stable Ride 🚗

A premium ride booking service platform built with modern web technologies.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form for form handling
- Framer Motion for animations

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- Stripe for payments
- SendGrid for emails
- Twilio for SMS

### Infrastructure
- Supabase for database hosting
- Vercel for application hosting
- GitHub for version control

## Features

- 🚖 Real-time ride booking
- 💳 Secure payment processing with Stripe
- 📱 SMS and email notifications
- 🗺️ Google Maps integration
- 👥 User and driver management
- 📊 Admin dashboard
- 🔒 Secure authentication with JWT
- 🌐 OAuth login (Google)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- SendGrid account
- Twilio account
- Google Cloud account (for Maps and OAuth)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chans00n/ridestable.git
cd ridestable
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Set up the database:
```bash
cd backend
npx prisma generate
npx prisma db push
```

5. Run the development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

## Deployment

This project is configured for deployment on Vercel with Supabase.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
stable-ride/
├── backend/          # Express API server
├── frontend/         # React application
├── shared/          # Shared types and utilities
└── docs/            # Documentation
```

## License

This project is private and proprietary.

## Support

For support, email support@ridestable.com