# Hiring Intelligence Frontend

AI-Driven Hiring Intelligence Tool Frontend built with Next.js 14.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + React Hook Form
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── candidates/        # Candidate pages
│   ├── upload/           # Upload page
│   └── export/           # Export page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   ├── candidates/       # Candidate-specific components
│   ├── upload/           # Upload components
│   ├── dashboard/        # Dashboard components
│   ├── charts/           # Chart components
│   └── export/           # Export components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

### 3. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3001 to view the application.

## Features Covered

### ✅ **Authentication**
- Login/Register forms with validation
- JWT token management
- Role-based access (Admin/Recruiter)
- Protected routes

### ✅ **Dashboard**
- Metrics overview cards
- Score distribution charts
- Recent candidates list
- Admin-only analytics

### ✅ **Candidate Management**
- Candidate list with filtering
- Advanced search by skills, experience, scores
- Detailed candidate profiles
- AI evaluation display

### ✅ **Upload System**
- Resume upload (PDF/DOCX) with drag & drop
- LinkedIn profile URL input
- Job role selection
- Processing status tracking

### ✅ **Export Features**
- CSV/XLSX export with filters
- Individual candidate reports
- Bulk export options

### ✅ **UI/UX**
- Responsive design (mobile-first)
- Loading states and error handling
- Toast notifications
- Modal dialogs
- Consistent design system

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Page Routes

- `/` - Home (redirects to dashboard or login)
- `/auth/login` - Login page
- `/auth/register` - Register page
- `/dashboard` - Dashboard (protected)
- `/candidates` - Candidate list (protected)
- `/candidates/[id]` - Candidate detail (protected)
- `/upload` - Upload resume/LinkedIn (protected)
- `/export` - Export data (protected)

## Component Architecture

### **UI Components** (`/components/ui/`)
- Reusable base components (Button, Input, Modal, etc.)
- Consistent styling with Tailwind variants
- TypeScript props with proper typing

### **Feature Components** (`/components/[feature]/`)
- Feature-specific components
- Business logic integration
- API data handling

### **Layout Components** (`/components/layout/`)
- Header with navigation and user menu
- Sidebar with role-based menu items
- Main layout wrapper

## State Management

- **React Query**: Server state management, caching, background updates
- **React Hook Form**: Form state and validation
- **React Context**: Authentication state
- **Local Storage**: JWT token persistence

## API Integration

All API calls are centralized in `/lib/api.ts` with:
- Axios interceptors for auth headers
- Error handling and retry logic
- TypeScript response typing
- Loading state management