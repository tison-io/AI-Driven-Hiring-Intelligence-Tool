# AI-Driven Hiring Intelligence Tool

A comprehensive hiring platform that evaluates candidates from resumes and LinkedIn profiles using AI-powered analysis.

## 🚀 Project Status: MVP Complete (85%)

### ✅ **Fully Implemented Features**
- **Authentication & Authorization** (Enhanced with strong password validation)
- **Resume Processing** (PDF/DOCX text extraction)
- **LinkedIn Profile Processing** (URL validation & placeholder scraping)
- **Background Job Processing** (Bull + Redis queue system)
- **Candidate Management** (CRUD operations with advanced filtering)
- **Dashboard Analytics** (Metrics, score distribution, recent candidates)
- **Data Export** (CSV, XLSX, HTML reports)
- **Complete API Documentation** (Swagger/OpenAPI)
- **Database Integration** (MongoDB with Mongoose)
- **File Storage Ready** (Cloudinary configuration)

### ⚠️ **Mock Implementation (Ready for AI Integration)**
- **AI Evaluation Engine** (Currently generates mock data)
- **LinkedIn Scraping** (Currently placeholder implementation)

### ❌ **Not Implemented**
- **Frontend Application** (Next.js structure created, no UI)
- **Real AI/ML Models**
- **Production Deployment**

---

## 🛠️ Quick Setup Guide

### **Prerequisites**
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (for background jobs)
- Git

### **1. Clone & Install**
```bash
git clone <repository-url>
cd TestProject/backend
npm install
```

### **2. Environment Setup**
```bash
cp .env.example .env
```

**Configure `.env` file:**
```env
# Database (Required)
DATABASE_URL=mongodb://localhost:27017/hiring_intelligence_db
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT (Required)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Redis (Required for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary (Optional - for file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Service (For future integration)
AI_SERVICE_URL=http://localhost:8000/api/ai
AI_SERVICE_API_KEY=your-ai-service-key

# App
PORT=3000
NODE_ENV=development
```

### **3. Start Services**
```bash
# Start MongoDB (if local)
mongod

# Start Redis (if local)
redis-server

# Start the application
npm run start:dev
```

### **4. Access the Application**
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api/docs

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
- File: Upload a PDF/DOCX resume
- jobRole: "Backend Engineer"
```

#### **Process LinkedIn Profile**
```bash
POST /api/candidates/linkedin
{
  "linkedinUrl": "https://www.linkedin.com/in/johndoe",
  "jobRole": "Frontend Developer"
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

## 🔧 AI Integration Guide

### **Current Mock Implementation**
The system currently uses mock AI responses for development and testing.

**Location**: `src/modules/ai/ai.service.ts`

```typescript
async evaluateCandidate(rawText: string, jobRole: string) {
  // MOCK IMPLEMENTATION - Replace with real AI
  const mockAiResponse = {
    name: 'John Doe', // ← Extract from rawText
    roleFitScore: Math.floor(Math.random() * 40) + 60, // ← Calculate based on job matching
    keyStrengths: [...], // ← Analyze from resume content
    // ... other mock data
  };
  return mockAiResponse;
}
```

### **To Integrate Real AI:**

#### **Option 1: External AI Service**
Replace the mock implementation with HTTP calls:

```typescript
async evaluateCandidate(rawText: string, jobRole: string) {
  const response = await axios.post(this.configService.get('AI_SERVICE_URL'), {
    text: rawText,
    jobRole: jobRole
  }, {
    headers: {
      'Authorization': `Bearer ${this.configService.get('AI_SERVICE_API_KEY')}`
    }
  });
  
  return response.data;
}
```

#### **Option 2: Local AI Model**
```typescript
import { YourAIModel } from './your-ai-model';

async evaluateCandidate(rawText: string, jobRole: string) {
  const aiModel = new YourAIModel();
  
  const evaluation = await aiModel.analyze({
    resumeText: rawText,
    targetRole: jobRole
  });
  
  return {
    name: evaluation.extractedName,
    roleFitScore: evaluation.matchScore,
    keyStrengths: evaluation.strengths,
    potentialWeaknesses: evaluation.weaknesses,
    missingSkills: evaluation.gaps,
    interviewQuestions: evaluation.questions,
    confidenceScore: evaluation.confidence,
    biasCheck: evaluation.biasAnalysis,
    skills: evaluation.extractedSkills,
    experienceYears: evaluation.yearsOfExperience
  };
}
```

#### **Option 3: OpenAI Integration**
```typescript
import OpenAI from 'openai';

async evaluateCandidate(rawText: string, jobRole: string) {
  const openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY')
  });
  
  const prompt = `Analyze this resume for ${jobRole} position:\n\n${rawText}\n\nProvide JSON response with: name, roleFitScore (0-100), keyStrengths, potentialWeaknesses, missingSkills, interviewQuestions, confidenceScore, biasCheck, skills, experienceYears`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### **LinkedIn Integration**
**Location**: `src/modules/upload/upload.service.ts`

**Current placeholder**:
```typescript
async processLinkedinProfile(linkedinUrl: string, jobRole: string) {
  // PLACEHOLDER - Replace with real scraping
  const rawText = `LinkedIn Profile: ${linkedinUrl}`;
  // ...
}
```

**To implement real scraping**:
```typescript
import puppeteer from 'puppeteer';

async processLinkedinProfile(linkedinUrl: string, jobRole: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(linkedinUrl);
    
    const profileData = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent || '';
      const headline = document.querySelector('.text-body-medium')?.textContent || '';
      const about = document.querySelector('.pv-about__summary-text')?.textContent || '';
      
      return `Name: ${name}\nHeadline: ${headline}\nAbout: ${about}`;
    });
    
    await browser.close();
    
    // Process with AI...
    const candidate = await this.candidatesService.create({
      name: 'LinkedIn Profile',
      linkedinUrl,
      rawText: profileData,
      jobRole,
      status: 'pending' as any,
    });
    
    // Continue with existing flow...
  } catch (error) {
    await browser.close();
    throw new Error('Failed to scrape LinkedIn profile');
  }
}
```

---

## 📁 Project Structure

```
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
│   │   └── ai/                # 🤖 AI integration (MOCK - REPLACE HERE)
│   ├── config/                # Database, JWT, Redis configuration
│   ├── common/                # Shared utilities, guards, decorators
│   └── utils/                 # Helper functions
├── .env.example               # Environment variables template
├── package.json               # Dependencies
└── README.md                  # This file

frontend/                      # ❌ Next.js structure only (no implementation)
├── src/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript definitions
└── package.json               # Frontend dependencies
```

---

## 🔍 API Endpoints Overview

### **Authentication**
- `POST /auth/register` - Register user with strong password validation
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile
- `PUT /auth/change-password` - Change password securely

### **Candidate Management**
- `GET /api/candidates` - List candidates with advanced filtering
- `GET /api/candidates/:id` - Get detailed candidate evaluation
- `POST /api/candidates/upload-resume` - Upload & process resume
- `POST /api/candidates/linkedin` - Process LinkedIn profile

### **Analytics & Export**
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/dashboard/score-distribution` - Score analytics (Admin only)
- `GET /api/export/candidates` - Export CSV/XLSX
- `GET /api/export/report/:id` - Generate candidate report

---

## 🚧 Development Roadmap

### **Phase 1: AI Integration** (1-2 weeks)
- [ ] Replace mock AI service with real implementation
- [ ] Implement actual skill extraction
- [ ] Add genuine bias detection
- [ ] Enhance LinkedIn scraping

### **Phase 2: Frontend Development** (2-3 weeks)
- [ ] Implement Next.js UI components
- [ ] Create dashboard visualizations
- [ ] Build candidate management interface
- [ ] Add file upload UI

### **Phase 3: Production Ready** (1 week)
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Production database configuration
- [ ] Monitoring and logging

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
- Ensure `JWT_SECRET` is set in `.env`
- Check token format in Swagger (don't include "Bearer")
- Verify token hasn't expired

#### **File Upload Issues**
- Check file size (max 10MB)
- Ensure file format is PDF or DOCX
- Verify Cloudinary configuration (optional)

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

- [ ] Authentication (register, login, profile, password change)
- [ ] Resume upload and processing
- [ ] LinkedIn profile processing
- [ ] Candidate filtering and search
- [ ] Dashboard metrics
- [ ] Data export (CSV, XLSX, reports)
- [ ] Error handling (invalid files, unauthorized access)
- [ ] Role-based access (admin vs recruiter)

**The backend is production-ready for testing and development. AI integration is the main remaining task for full functionality.**