# Hiring Intelligence Backend

AI-Driven Hiring Intelligence Tool Backend built with NestJS.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration for queues
- `CLOUDINARY_*`: Cloudinary credentials for file uploads
- `AI_SERVICE_URL`: External AI service endpoint
- `RAPIDAPI_KEY`: API key for Linkedin Scraper

### 3. Database Setup

Make sure MongoDB is running:

```bash
# Start MongoDB service
mongod
```

The database will be created automatically when the application starts.

### 4. Redis Setup

Make sure Redis is running for the queue system:

```bash
# On Windows with Redis installed
redis-server
```

### 5. Start Development Server

```bash
npm run start:dev
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **API Base URL**: http://localhost:3000

## Project Structure

```
src/
├── config/          # Configuration files
├── modules/         # Feature modules
│   ├── auth/        # Authentication
│   ├── users/       # User management
│   ├── candidates/  # Candidate operations
│   ├── upload/      # File upload & processing
│   ├── export/      # Data export
|   ├── linkedin-scraper # Linkedin Scraper
│   ├── dashboard/   # Analytics
│   ├── queue/       # Background jobs
│   └── ai/          # AI service integration
├── common/          # Shared utilities
└── utils/           # Helper functions
```

## MVP Features Covered

✅ **Authentication**: JWT-based auth with role management  
✅ **Resume Upload**: PDF/DOCX parsing with validation  
✅ **LinkedIn Integration**: Public profile data extraction  
✅ **AI Processing**: Async job queue for AI evaluation  
✅ **Filtering**: Advanced candidate search and filtering  
✅ **Export**: CSV/XLSX and HTML report generation  
✅ **Dashboard**: Analytics and metrics  
✅ **Error Handling**: Standardized error responses  
✅ **Documentation**: Complete Swagger API docs

## Development Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Testing
npm run test
npm run test:watch
npm run test:cov

# Linting
npm run lint
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Candidates

- `GET /api/candidates` - List candidates with filters
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates/upload-resume` - Upload resume
- `POST /api/candidates/linkedin` - Process LinkedIn profile

### Export

- `GET /api/export/candidates` - Export candidates (CSV/XLSX)
- `GET /api/export/report/:id` - Generate candidate report

### Dashboard

- `GET /api/dashboard` - Get analytics metrics

All endpoints require authentication except `/auth/*` routes.
