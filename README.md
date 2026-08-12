# Referral System

A full-stack referral system built with Next.js, Node.js, PostgreSQL, and Prisma ORM. Users can register, receive a unique referral code, and earn points when others sign up using their code.

## Features

- User registration and authentication with JWT
- Unique referral code generation for each user
- Point system (10 points per successful referral)
- Duplicate reward prevention using database constraints
- Dashboard displaying referral code, total points, and referred users
- Responsive UI with modern design
- Secure password hashing with bcrypt
- HTTP-only cookies for session management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcryptjs

## Architecture

This project follows a clean separation between frontend and backend:

- **Express Backend** (`server/`): Handles all API routes, authentication, and business logic
  - Runs on port 5000
  - RESTful API endpoints
  - JWT token generation and verification
  - Database operations with Prisma

- **Next.js Frontend** (`app/`): Handles UI and user interactions
  - Runs on port 3000
  - Server-side rendering for better SEO
  - Makes API calls to Express backend
  - Manages client-side state

## Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

## PostgreSQL Installation

### Windows

1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the postgres user
4. PostgreSQL will run on port 5432 by default

### macOS

```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Project Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd referral-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Create a new PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE referral_system;

# Exit psql
\q
```

### 4. Configure environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/referral_system?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**IMPORTANT SECURITY NOTE:**
- Change `JWT_SECRET` to a strong random string (at least 32 characters)
- Never commit your `.env` file to version control
- Use different secrets for development and production
- You can generate a secure secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create the necessary tables in your database
- Generate the Prisma Client

### 6. (Optional) View your database

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555`

### 7. Run the development servers

**Option 1: Run both servers with one command (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run servers separately (in different terminals)**

Terminal 1 - Express Backend:
```bash
npm run dev:backend
```

Terminal 2 - Next.js Frontend:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## Database Schema

### User Model

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  referralCode  String   @unique
  points        Int      @default(0)
  referredById  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  referredBy    User?    @relation("Referrals", fields: [referredById], references: [id])
  referrals     User[]   @relation("Referrals")
}
```

**Key Features:**
- Unique email constraint prevents duplicate accounts
- Unique referral code constraint ensures no collisions
- Self-referential relationship for tracking referrals
- Indexed fields for faster queries

## API Endpoints

### POST /api/register

Register a new user and optionally use a referral code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "referralCode": "ABC123DE" // optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "referralCode": "XYZ789AB",
    "points": 0
  }
}
```

**Business Logic:**
- Validates email format and password length
- Checks for existing users
- Validates referral code if provided
- Generates unique 8-character referral code
- Uses transaction to create user and award points atomically
- Awards 10 points to referrer if referral code is valid
- Sets JWT token in HTTP-only cookie

### POST /api/login

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "referralCode": "XYZ789AB",
    "points": 10
  }
}
```

**Business Logic:**
- Validates credentials
- Compares hashed password
- Sets JWT token in HTTP-only cookie

### GET /api/dashboard

Get current user's dashboard data (authenticated).

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "referralCode": "XYZ789AB",
    "points": 20,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "referrals": [
    {
      "id": "clx...",
      "email": "referred@example.com",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "stats": {
    "totalReferrals": 2,
    "totalPoints": 20
  }
}
```

**Business Logic:**
- Verifies JWT token from cookie
- Returns user data with all referred users
- Calculates statistics

### POST /api/logout

Logout the current user.

**Response:**
```json
{
  "message": "Logout successful"
}
```

## Pages

### /register
- User registration form
- Optional referral code input
- Supports referral code via URL parameter: `/register?ref=ABC123DE`
- Redirects to dashboard after successful registration

### /login
- User login form
- Redirects to dashboard after successful login

### /dashboard (Protected)
- Displays user's referral code with copy-to-clipboard functionality
- Shows total points and total referrals
- Lists all referred users with their join dates
- Logout button

## Security Features

### Authentication
- JWT tokens stored in HTTP-only cookies (prevents XSS attacks)
- Tokens expire after 7 days
- Secure flag enabled in production (HTTPS only)
- SameSite cookie policy set to 'lax' (CSRF protection)

### Password Security
- Passwords hashed using bcrypt with salt rounds of 10
- Strong password requirements: minimum 8 characters, must contain letters and numbers
- Never stored or transmitted in plain text
- Generic error messages to prevent user enumeration

### Input Validation & Sanitization
- Email validation with regex pattern
- Email sanitization (trim whitespace, lowercase)
- Password strength validation (length + complexity)
- Input validation on all API endpoints

### Database Security
- Unique constraints prevent duplicate accounts
- Transactions ensure atomic operations (prevents race conditions)
- Indexed fields for optimized queries
- Foreign key constraints maintain referential integrity
- Prisma ORM prevents SQL injection attacks

### Duplicate Reward Prevention

The system prevents duplicate referral rewards through:

1. **Database Schema**: The `referredById` field can only be set once during user creation
2. **Unique Constraint**: The `referralCode` is unique across all users
3. **Transaction**: User creation and point awarding happen atomically
4. **One-time Reference**: A user can only be referred by one person, set at registration

## Project Structure

```
referral-system/
├── app/                          # Next.js Frontend
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Register page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── server/                       # Express Backend
│   ├── routes/
│   │   ├── auth.js               # Auth routes (register, login, logout)
│   │   └── dashboard.js          # Dashboard route
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   └── index.js                  # Express server entry point
├── lib/
│   ├── auth.ts                   # JWT utilities (Next.js)
│   ├── auth-server.js            # JWT utilities (Express)
│   ├── db.ts                     # Prisma client
│   ├── utils.ts                  # Helper functions (Next.js)
│   └── utils-server.js           # Helper functions (Express)
├── prisma/
│   ├── migrations/               # Migration files
│   └── schema.prisma             # Database schema
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Documentation
```

## Development

### Reset database

```bash
npx prisma migrate reset
```

### Create a new migration

```bash
npx prisma migrate dev --name migration_name
```

### Format Prisma schema

```bash
npx prisma format
```

## Testing the Application

### 1. Register a new user

- Go to http://localhost:3000/register
- Enter email and password
- Click "Create Account"
- Note your referral code on the dashboard

### 2. Register with a referral code

- Open a new incognito/private window
- Go to http://localhost:3000/register?ref=YOUR_REFERRAL_CODE
- Register a new user
- The original user should now have 10 points

### 3. View dashboard

- Login with your account
- See your referral code, points, and referred users
- Copy your referral link to share

## Production Deployment

### Environment Variables

Make sure to set these in your production environment:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="strong-random-secret-key"
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

### Build the application

```bash
npm run build
npm start
```

### Recommendations

1. Use a strong, random JWT_SECRET
2. Enable SSL/TLS for database connections
3. Use environment-specific database credentials
4. Set up database backups
5. Monitor application logs
6. Implement rate limiting for API endpoints
7. Add email verification for new users
8. Set up error tracking (e.g., Sentry)

## Troubleshooting

### Database connection errors

- Verify PostgreSQL is running: `psql -U postgres`
- Check DATABASE_URL in .env file
- Ensure database exists: `CREATE DATABASE referral_system;`

### Prisma errors

- Regenerate client: `npx prisma generate`
- Reset database: `npx prisma migrate reset`

### Port already in use

- Kill process on port 3000: `npx kill-port 3000`
- Or use a different port: `PORT=3001 npm run dev`

## License

MIT


MERN Stack Developer Assessment Project
