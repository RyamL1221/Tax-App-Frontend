# Tax App Frontend

A Next.js-based tax preparation application with user authentication and tax form management.

## Features

- User authentication (login/register)
- Tax form dashboard
- Form selection and navigation
- Session management with HTTP-only cookies
- Responsive design
- Comprehensive test coverage (unit + property-based tests)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory with the following variables:

```bash
# Backend API Configuration
# This is the base URL for the backend API that handles authentication and data
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, update the URL to your production backend:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing the Application

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Testing with Dummy Data

To test the dashboard and authenticated features without setting up a full backend, you can use dummy session data:

#### Option 1: Using Browser DevTools (Recommended)

1. Start the development server: `npm run dev`
2. Open your browser and navigate to `http://localhost:3000`
3. Open DevTools (F12 or right-click → Inspect)
4. Go to **Application/Storage** tab → **Cookies** → `http://localhost:3000`
5. Add a new cookie with these values:
   - **Name**: `session_token`
   - **Value**: `eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiY3JlYXRlZEF0IjoxNzM3OTI0MDAwMDAwLCJleHBpcmVzQXQiOjE3Mzg1Mjg4MDAwMDB9`
   - **Path**: `/`
   - **HttpOnly**: ✓ (checked)
   - **Secure**: Leave unchecked for localhost
6. Navigate to `http://localhost:3000/dashboard`

The dummy session contains:
- User ID: `test-user-123`
- Email: `test@example.com`
- Expires: 7 days from creation

#### Option 2: Using Test Endpoint

A test endpoint is available for quickly creating a dummy session:

1. Start the development server
2. Visit `http://localhost:3000/api/test-session` in your browser
3. You'll see a JSON response confirming the session was created
4. Navigate to `http://localhost:3000/dashboard`

**⚠️ Important**: Remove the test endpoint (`src/app/api/test-session/route.ts`) before deploying to production!

### Available Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Tax form dashboard (requires authentication)
- `/forms/1099-div` - 1099-DIV form page (requires authentication)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── forms/             # Tax form pages
│   ├── login/             # Login pages
│   └── register/          # Registration pages
├── components/            # React components
│   ├── ui/               # UI components
│   └── ...               # Feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── session.ts        # Session management
│   ├── security.ts       # Security utilities
│   └── validation.ts     # Input validation
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
