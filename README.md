# AI-Driven Hiring Intelligence Tool

A comprehensive hiring platform that evaluates candidates from resumes and LinkedIn profiles using AI-powered analysis.

## 🚀 Implemented Features

### **Backend API**

-   **Authentication & Authorization** - Enhanced with strong password validation
-   **User Ownership Tracking** - Recruiters see only their candidates, Admins see all
-   **Resume Processing** - PDF/DOCX text extraction
-   **LinkedIn Profile Processing** - URL validation & placeholder scraping
-   **Background Job Processing** - Bull + Redis queue system
-   **Candidate Management** - CRUD operations with advanced filtering
-   **Dashboard Analytics** - Metrics, score distribution, recent candidates
-   **Data Export** - CSV, XLSX, HTML reports
-   **Complete API Documentation** - Swagger/OpenAPI
-   **Database Integration** - MongoDB with Mongoose
-   **File Storage Ready** - Cloudinary configuration
-   **LinkedIn Scraping** - Implemented using RapidAPI
-   **AI Evaluation Engine** - Integrated with Python FastAPI backend for real AI processing

### **Frontend Application**

-   **Authentication System** - Login, register, password reset, profile management
-   **Component Architecture** - Modular, reusable components with TypeScript
-   **Toast Notification System** - Standardized notifications across all components
-   **Layout & Navigation** - Responsive sidebar, mobile-friendly header
-   **Form Components** - Evaluation forms, login/register with validation
-   **Modal System** - Delete confirmations, password changes, AI evaluations
-   **Settings Management** - Profile updates, security settings, account deletion
-   **Dashboard Components** - Layout, metrics cards, activity components
-   **Candidate Management UI** - List views, detail pages, filtering interface
-   **Admin Interface** - Dashboard layout, user management components

---

## 🛠️ Quick Setup Guide

### **Prerequisites**

-   Node.js 18+
-   Python 3.10+ (for AI Backend)
-   MongoDB (local or Atlas)
-   Redis (for background jobs)
-   Groq API Key (for AI evaluation)
-   Brevo API Key (for emails)
-   Git

### **Step 1: Clone Repository**

```bash
git clone <repository-url>
cd TestProject
```

### **Step 2: Install Dependencies**

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# AI Backend dependencies
cd ../AI_Backend
pip install -r requirements.txt

cd ..
```

### **Step 3: Environment Configuration**

#### **Backend Environment** (`backend/.env`)
```bash
cd backend
cp .env.example .env
```

```env
# Database
DATABASE_URL=mongodb://localhost:27017/hiring_intelligence_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key-here
BREVO_FROM_EMAIL=noreply@yourcompany.com
BREVO_FROM_NAME=Hiring Intelligence Tool

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

#### **AI Backend Environment** (`AI_Backend/.env`)
```bash
cd AI_Backend
cp .env.example .env
```

```env
GROQ_API_KEY=your-groq-api-key-here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=
```

### **Step 4: Start Services**

**Terminal 1 - Database Services:**
```bash
# Start MongoDB (if local)
mongod

# Start Redis (if local)
redis-server
```

**Terminal 2 - AI Backend:**
```bash
cd AI_Backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 - Backend API:**
```bash
cd backend
npm run start:dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

### **Step 5: Access the Application**

-   **Frontend**: http://localhost:3001
-   **Backend API**: http://localhost:3000
-   **AI Backend**: http://localhost:8000
-   **API Documentation**: http://localhost:3000/api/docs
-   **AI Documentation**: http://localhost:8000/docs

---

## 🧪 Testing Guide

### **Step 1: Authentication Testing**

#### **Register Admin User**

```bash
POST /auth/register
{
  "email": "admin@test.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

#### **Login & Get Token**

```bash
POST /auth/login
{
  "email": "admin@test.com",
  "password": "AdminPass123!"
}
```

**Copy the `access_token` from response**

### **Step 2: Authorize Swagger**

1. Go to http://localhost:3000/api/docs
2. Click 🔒 **"Authorize"**
3. Enter: `your-access-token-here` (without "Bearer")
4. Click **"Authorize"**

### **Step 3: Test Core Features**

#### **Upload Resume**

```bash
POST /api/candidates/upload-resume
Content-Type: multipart/form-data

Form Data:
- file: [PDF/DOCX resume file]
- jobRole: "Backend Engineer"
- jobDescription: "Looking for a backend engineer with 3+ years experience in Node.js, MongoDB, and REST APIs"
```

#### **Process LinkedIn Profile**

```bash
POST /api/candidates/linkedin
Content-Type: application/json

{
  "linkedinUrl": "https://www.linkedin.com/in/johndoe",
  "jobRole": "Frontend Developer",
  "jobDescription": "Seeking a frontend developer skilled in React, TypeScript, and modern CSS frameworks"
}
```

#### **View Candidates**

```bash
GET /api/candidates
# Test with filters:
# ?skill=JavaScript&score_min=70&experience_min=2
```

#### **View Dashboard**

```bash
GET /api/dashboard
```

#### **Export Data**

```bash
GET /api/export/candidates?format=csv
GET /api/export/candidates?format=xlsx
```

### **Step 4: Test Enhanced Authentication**

#### **Get Profile**

```bash
GET /auth/profile
```

#### **Change Password**

```bash
PUT /auth/change-password
{
  "currentPassword": "AdminPass123!",
  "newPassword": "NewSecurePass456@"
}
```

---

## 🔧 AI Backend Service

### **Python FastAPI Backend**

The AI processing is handled by a separate Python FastAPI service that provides real AI-powered candidate evaluation using **Groq** (Llama 3.3 70B) through a **LangGraph** multi-agent pipeline.

**Location**: `AI_Backend/`

### **AI Service Setup**

#### **1. Install Dependencies**
```bash
cd AI_Backend
pip install -r requirements.txt
```

#### **2. Configure Environment**
```bash
cp .env.example .env
```

**Configure `AI_Backend/.env`:**
```env
GROQ_API_KEY=your-groq-api-key-here
```

#### **3. Start AI Service**
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
# or
python main.py
```

### **AI Service Architecture**

The AI evaluation runs as a single LangGraph pipeline via one endpoint:

**`POST /analyze/graph`** — End-to-end evaluation pipeline:
- Accepts resume (PDF/DOCX file or raw text), job description, and role name
- Runs an 8-node LangGraph workflow with retry policies and checkpointing
- Returns structured scores, agent reports, parsed profile, and candidate feedback

The pipeline contains 8 sequential/parallel nodes:
1. **JD Parser** — Extracts structured requirements from the job description
2. **Alignment Check** — Detects JD-Role profession mismatches and vague JDs
3. **Resume Extractor** — Parses resume into structured candidate profile
4. **Competency Agent** — Evaluates technical skills with semantic matching *(parallel)*
5. **Experience Agent** — Evaluates career history and seniority *(parallel)*
6. **Behavioral Agent** — Evaluates soft skills from evidence *(parallel)*
7. **Aggregator** — Computes weighted final score, strengths, weaknesses, interview questions
8. **Feedback Generator** — Produces personalized candidate feedback email

### **AI Service Dependencies**

**Core Technologies:**
- **FastAPI**: Web framework
- **Groq (Llama 3.3 70B)**: LLM for AI evaluation
- **LangGraph**: Multi-agent workflow orchestration with retry policies
- **LangChain**: LLM integration and prompt management
- **LangSmith**: Observability and tracing
- **PyPDF**: PDF text extraction
- **Mammoth**: DOCX text extraction
- **SlowAPI**: Rate limiting (5 req/min per IP)

### **Integration with Backend**

The Node.js backend (`src/modules/ai/ai.service.ts`) communicates with the Python AI service via a single endpoint:

```typescript
async evaluateWithGraph(formData: FormData) {
  // Sends resume (file or raw text), job description, and role name
  // to POST /analyze/graph
  const response = await axios.post(
    `${this.aiServiceUrl}/analyze/graph`,
    formData
  );
  // Response contains: final_score, recommendation, summary,
  // agent_reports, parsed_profile, candidate_feedback
  return this.transformGraphResponse(response.data);
}
```

### **Fallback Behavior**

If the AI service is unavailable, the system falls back to mock responses to ensure the application continues functioning.

## 📧 Email Service Configuration

### **Brevo Email Integration**

The application uses Brevo (formerly Sendinblue) for transactional emails.

**Email Features:**
- Password reset emails
- Account verification emails
- System notifications

### **Brevo Setup**

#### **1. Create Brevo Account**
1. Sign up at [brevo.com](https://brevo.com)
2. Verify your account
3. Generate API key from Settings > API Keys

#### **2. Configure Environment Variables**

**In `backend/.env`:**
```env
BREVO_API_KEY=your-brevo-api-key-here
BREVO_FROM_EMAIL=noreply@yourcompany.com
BREVO_FROM_NAME=Hiring Intelligence Tool
```

#### **3. Email Templates**

The system sends these automated emails:

- **Password Reset**: Sent when user requests password reset
- **Welcome Email**: Sent after successful registration
- **Profile Completion**: Reminder to complete profile setup

### **Email Service Implementation**

**Location**: `src/modules/email/email.service.ts`

The email service handles:
- Template rendering
- SMTP delivery via Brevo API
- Error handling and retry logic
- Email logging and tracking

### **Testing Email Service**

```bash
# Test password reset email
POST /auth/forgot-password
{
  "email": "test@example.com"
}
```

## 🔗 LinkedIn Integration

The system processes LinkedIn profiles using URL validation and data extraction.

**Location**: `src/modules/upload/upload.service.ts`

LinkedIn profiles are processed through the AI service which extracts relevant candidate information from the profile data.

---

## 📁 Project Structure

```
AI_Backend/                    # Python FastAPI AI Service
├── main.py                    # FastAPI app, API endpoint, file handling
├── graph.py                   # LangGraph workflow definition, retry policies
├── nodes.py                   # Agent node implementations (8 nodes)
├── prompts.py                 # LLM prompt templates for each agent
├── states.py                  # TypedDict state definitions with merge reducers
├── parsing.py                 # PDF/DOCX text extraction and cleaning
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
└── test.py                    # AI service tests

backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── users/             # User management
│   │   ├── candidates/        # Candidate CRUD operations
│   │   ├── upload/            # File processing & LinkedIn
│   │   ├── export/            # Data export (CSV, XLSX, reports)
│   │   ├── dashboard/         # Analytics & metrics
│   │   ├── queue/             # Background job processing
│   │   ├── ai/                # 🤖 AI integration (Connects to Python FastAPI)
│   │   └── email/             # Email service (Brevo integration)
│   ├── config/                # Database, JWT, Redis configuration
│   ├── common/                # Shared utilities, guards, decorators
│   └── utils/                 # Helper functions
├── .env.example               # Environment variables template
├── package.json               # Dependencies
└── README.md                  # This file

frontend/                      # Next.js application
├── src/
│   ├── app/                   # Next.js app router pages
│   │   ├── auth/             # Authentication pages (login, register, reset)
│   │   ├── admin/            # Admin dashboard and management
│   │   ├── candidates/       # Candidate listing and detail pages
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── evaluations/      # Evaluation creation pages
│   │   ├── export/           # Data export page
│   │   ├── settings/         # User settings and profile
│   │   └── complete-profile/ # Profile completion flow
│   ├── components/            # React components (modular architecture)
│   │   ├── admin/            # Admin-specific components
│   │   ├── auth/             # Authentication components
│   │   ├── candidates/       # Candidate management components
│   │   ├── dashboard/        # Dashboard widgets and cards
│   │   ├── forms/            # Form components (login, evaluation)
│   │   ├── icons/            # Custom icon components
│   │   ├── layout/           # Layout components (sidebar, header)
│   │   ├── modals/           # Modal dialogs (delete, password change)
│   │   ├── settings/         # Settings page components
│   │   └── ui/               # Base UI components (spinners, popups)
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # API client, auth, toast system
│   ├── types/                # Complete TypeScript definitions
│   └── utils/                # Helper functions
├── public/                   # Static assets
└── package.json               # Frontend dependencies
```

---

## 🔍 API Endpoints Overview

### **Authentication**

-   `POST /auth/register` - Register user with strong password validation
-   `POST /auth/login` - Login user
-   `GET /auth/profile` - Get current user profile
-   `PUT /auth/change-password` - Change password securely

### **Candidate Management**

-   `GET /api/candidates` - List candidates with advanced filtering
-   `GET /api/candidates/:id` - Get detailed candidate evaluation
-   `POST /api/candidates/upload-resume` - Upload & process resume
-   `POST /api/candidates/linkedin` - Process LinkedIn profile

### **Analytics & Export**

-   `GET /api/dashboard` - Dashboard metrics
-   `GET /api/dashboard/score-distribution` - Score analytics (Admin only)
-   `GET /api/export/candidates` - Export CSV/XLSX
-   `GET /api/export/report/:id` - Generate candidate report

---

## 🗺️ Page Routes

### **Public Routes**
- `/` - Home (redirects based on auth status)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password/[token]` - Password reset with token

### **Protected Routes**
- `/dashboard` - Main dashboard (role-based content)
- `/complete-profile` - Profile completion for new users
- `/candidates` - Candidate listing with filters
- `/candidates/[id]` - Individual candidate details
- `/evaluations/new` - Create new evaluation
- `/settings` - User settings and profile management
- `/export` - Data export functionality

### **Admin-Only Routes**
- `/admin/dashboard` - Admin dashboard with system metrics
- `/admin/audit-logs` - System audit logs
- `/admin/error-logs` - Error monitoring and logs

## 🛠️ Frontend Development

### **Tech Stack**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: Standardized Toast System (Custom)
- **Slider Components**: RC Slider

### **Frontend Commands**
```bash
# Development server
cd frontend
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test
npm run test:ui
npm run test:headed
```

### **Component Architecture**

#### **UI Components** (`/components/ui/`)
- `LoadingSpinner` - Consistent loading indicators
- `SuccessPopup` - Success message modals
- `CircularProgress` - Progress indicators
- `ErrorBoundary` - Error handling wrapper
- `ToastDemo` - Toast notification showcase

#### **Feature Components** (`/components/[feature]/`)
- **Auth**: `ProtectedRoute`, `PublicRoute` for access control
- **Forms**: `LoginForm`, `RegisterForm`, `EvaluationForm` with validation
- **Modals**: `DeleteConfirmationModal`, `ChangePasswordModal`, `AIEvaluationModal`
- **Layout**: `Layout`, `Sidebar`, `MobileHeader` for navigation
- **Candidates**: `CandidateDetail`, `CandidateActions`, `ScoreCards`
- **Dashboard**: `StatsCard`, `RecentActivity`, `ShortlistedCandidates`
- **Settings**: `ProfileSection`, `SecuritySection`, `DeleteAccountSection`

### **Toast Notification System**

**Centralized in `/lib/toast.ts`:**
```typescript
// Standardized notifications
toast.success('Operation completed!');
toast.error('Something went wrong');
toast.shortlist(true, 'John Doe'); // Special shortlist notification
toast.promise(apiCall, { loading: '...', success: '✓', error: '✗' });
```

**Features:**
- Consistent 4-second duration
- Semantic color coding
- Special shortlist notifications with candidate names
- Promise-based toasts for async operations
- Professional styling matching design system

---

## 🐛 Troubleshooting

### **Common Issues**

#### **MongoDB Connection Error**

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
mongod
```

#### **Redis Connection Error**

```bash
# Check if Redis is running
redis-cli ping

# Start Redis service
redis-server
```

#### **JWT Authentication Issues**

-   Ensure `JWT_SECRET` is set in `.env`
-   Check token format in Swagger (don't include "Bearer")
-   Verify token hasn't expired

#### **File Upload Issues**

-   Check file size (max 10MB)
-   Ensure file format is PDF or DOCX
-   Verify Cloudinary configuration (optional)

### **Reset Database**

```bash
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config();
(async () => {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();
  await db.collection('users').deleteMany({});
  await db.collection('candidates').deleteMany({});
  console.log('Database cleared');
  await client.close();
})();
"
```

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the Swagger documentation at `/api/docs`
3. Examine the console logs for detailed error messages
4. Verify all environment variables are correctly set

---

## 🎯 Testing Checklist

### **Automated Tests**
-   [ ] Backend unit tests (`npm run test`)
-   [ ] Backend E2E tests (`npm run test:e2e`)
-   [ ] Frontend E2E tests (`npm run test`)
-   [ ] Test coverage reports (`npm run test:cov`)

### **Manual Testing**
-   [ ] Authentication (register, login, profile, password change)
-   [ ] Resume upload and processing
-   [ ] LinkedIn profile processing
-   [ ] Candidate filtering and search
-   [ ] Dashboard metrics
-   [ ] Data export (CSV, XLSX, reports)
-   [ ] Error handling (invalid files, unauthorized access)
-   [ ] Role-based access (admin vs recruiter)
-   [ ] Toast notification system
-   [ ] Responsive design (mobile, tablet, desktop)

## 📊 **Project Overview**

### **Backend API**
- Complete REST API with authentication, CRUD operations, file processing
- Background job processing with Redis queue system
- Data export functionality (CSV, XLSX, HTML)
- Comprehensive Swagger documentation
- AI evaluation via Groq/LangGraph multi-agent pipeline
- MongoDB database with user ownership tracking

### **Frontend Application**
- Complete component architecture with TypeScript
- Authentication system with role-based access control
- Standardized toast notification system
- Responsive layout and navigation
- Form components with validation
- Modal system for user interactions
- Settings and profile management

## 🧪 Testing & Development

### **Running Tests**

#### **Backend Tests (Jest)**
```bash
cd backend

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

#### **Frontend Tests (Playwright)**
```bash
cd frontend

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed
```

### **Test Coverage**

#### **Backend Test Files**
- **Unit Tests**: `src/**/*.spec.ts` - Service and controller tests
- **E2E Tests**: `test/**/*.e2e-spec.ts` - Integration tests
- **Coverage Reports**: Available in `backend/coverage/` after running `npm run test:cov`

#### **Frontend Test Files**
- **E2E Tests**: `tests/**/*.spec.ts` - Playwright browser tests
- **Test Categories**:
  - Authentication flows (`tests/auth/`)
  - Admin functionality (`tests/admin/`)
  - Candidate management (`tests/candidates/`)
  - Dashboard features (`tests/dashboard/`)
  - Export functionality (`tests/export/`)
  - Upload processes (`tests/upload/`)

### **Component Testing**
Use the built-in `ToastDemo` component to test all notification types:
```typescript
import ToastDemo from '@/components/ui/ToastDemo';
// Renders interactive buttons for all toast types
```

### **Manual Testing Workflows**

#### **Authentication Testing**
1. Register a new user at `/auth/register`
2. Complete profile at `/complete-profile`
3. Test role-based access (admin vs recruiter)
4. Test password reset flow

#### **API Integration Testing**
Ensure backend is running and test:
- Login/logout functionality
- Protected route access
- Form submissions
- Error handling

---

**The application provides a solid foundation for AI-powered hiring intelligence with a complete backend API and comprehensive frontend component system.**
