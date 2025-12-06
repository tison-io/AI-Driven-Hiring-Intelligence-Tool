# Data Flow: Backend ↔ AI_Backend

## 📊 Complete Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS RESUME/LINKEDIN                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Upload Service (upload.service.ts)                             │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Extract text from PDF/DOCX OR scrape LinkedIn                        │
│  • Create candidate record in MongoDB (status: "pending")               │
│  • Store: name, rawText, jobRole, status                                │
│  • Returns: candidateId                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Queue Service (queue.service.ts)                               │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Add job to Redis Bull queue: "ai-processing"                         │
│  • Job data: { candidateId, jobRole }                                   │
│  • Retry: 3 attempts with exponential backoff                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: AI Processor (ai-processor.ts)                                 │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Picks job from queue                                                  │
│  • Updates candidate status: "processing"                               │
│  • Fetches candidate.rawText from MongoDB                               │
│  • Calls AI Service ──────────────────────────────────────────┐         │
└───────────────────────────────────────────────────────────────┼─────────┘
                                                                │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: AI Service (ai.service.ts) - Backend Side                      │
│  ─────────────────────────────────────────────────────────────────────  │
│  A) Extract Data:                                                        │
│     POST http://localhost:8000/parse-text                               │
│     Body: { "text": rawText }                                            │
│     ↓                                                                    │
│     Returns: { data: { candidate_name, skills, education, ... } }       │
│                                                                          │
│  B) Score Candidate:                                                     │
│     POST http://localhost:8000/score                                    │
│     Body: {                                                              │
│       "candidate_data": extractedData,                                   │
│       "role_name": jobRole                                               │
│     }                                                                    │
│     ↓                                                                    │
│     Returns: {                                                           │
│       role_fit_score, key_strengths, potential_weaknesses,              │
│       missing_skills, recommended_interview_questions,                   │
│       confidence_score, bias_check_flag                                  │
│     }                                                                    │
│                                                                          │
│  C) Transform Response:                                                  │
│     Converts AI_Backend format → Backend format                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AI_Backend (main.py) - Python FastAPI                                  │
│  ─────────────────────────────────────────────────────────────────────  │
│  Endpoint: POST /parse-text                                              │
│  • Input: { "text": "resume content..." }                               │
│  • Calls: extraction.py → extract_resume_data()                         │
│  • Output: {                                                             │
│      "processed": true,                                                  │
│      "data": {                                                           │
│        "candidate_name": "John Doe",                                     │
│        "skills": ["Python", "JavaScript"],                               │
│        "total_years_experience": 5,                                      │
│        "education": [...],                                               │
│        "certifications": [...],                                          │
│        "is_valid_resume": true                                           │
│      }                                                                   │
│    }                                                                     │
│                                                                          │
│  Endpoint: POST /score                                                   │
│  • Input: { "candidate_data": {...}, "role_name": "Backend Engineer" }  │
│  • Calls: scoring.py → score_candidate()                                │
│  • Output: {                                                             │
│      "role_fit_score": 85,                                               │
│      "key_strengths": ["Strong Python", "Good architecture"],            │
│      "potential_weaknesses": ["Limited frontend"],                       │
│      "missing_skills": ["Docker", "Kubernetes"],                         │
│      "recommended_interview_questions": [...],                           │
│      "confidence_score": 90,                                             │
│      "bias_check_flag": { "detected": false }                            │
│    }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Update Candidate (ai-processor.ts)                             │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Updates MongoDB with AI results:                                      │
│    - name, roleFitScore, keyStrengths, potentialWeaknesses              │
│    - missingSkills, interviewQuestions, confidenceScore                 │
│    - biasCheck, skills, experienceYears, education, certifications      │
│  • Updates status: "completed"                                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: View Results                                                    │
│  ─────────────────────────────────────────────────────────────────────  │
│  GET /api/candidates/:id                                                 │
│  • Fetches complete candidate record from MongoDB                       │
│  • Returns all evaluation data including AI analysis                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Key Data Transformations

### Backend → AI_Backend
```typescript
// ai.service.ts sends:
{
  text: "John Doe\nSoftware Engineer\n5 years experience..."
}
```

### AI_Backend → Backend (Parse)
```python
# main.py returns:
{
  "data": {
    "candidate_name": "John Doe",
    "skills": ["Python", "Node.js"],
    "total_years_experience": 5,
    "education": [...],
    "is_valid_resume": true
  }
}
```

### AI_Backend → Backend (Score)
```python
# main.py returns:
{
  "role_fit_score": 85,
  "key_strengths": ["Strong backend", "Good communication"],
  "potential_weaknesses": ["Limited DevOps"],
  "missing_skills": ["Docker"],
  "recommended_interview_questions": ["Tell me about..."],
  "confidence_score": 90,
  "bias_check_flag": {"detected": false}
}
```

### Final MongoDB Document
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "John Doe",
  rawText: "John Doe\nSoftware Engineer...",
  jobRole: "Backend Engineer",
  status: "completed",
  
  // From AI extraction
  skills: ["Python", "Node.js"],
  experienceYears: 5,
  education: [...],
  certifications: [...],
  
  // From AI scoring
  roleFitScore: 85,
  keyStrengths: ["Strong backend", "Good communication"],
  potentialWeaknesses: ["Limited DevOps"],
  missingSkills: ["Docker"],
  interviewQuestions: ["Tell me about..."],
  confidenceScore: 90,
  biasCheck: "No significant bias detected",
  
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:15Z"
}
```

## 📡 API Endpoints Used

### Backend APIs (NestJS)
- `POST /api/candidates/upload-resume` → Triggers flow
- `POST /api/candidates/linkedin` → Triggers flow
- `GET /api/candidates/:id` → View results

### AI_Backend APIs (FastAPI)
- `POST /parse-text` → Extract structured data
- `POST /score` → Evaluate candidate
- `POST /analyze` → Combined endpoint (not currently used)

## ⚙️ Configuration

### Backend .env
```env
AI_SERVICE_URL=http://localhost:8000
DATABASE_URL=mongodb://localhost:27017/hiring_intelligence_db
REDIS_HOST=localhost
REDIS_PORT=6379
```

### AI_Backend .env
```env
OPENAI_API_KEY=your-key-here
# Other AI service configs
```

## 🔍 How to Track Processing

### Check candidate status:
```bash
GET /api/candidates/:id
```

Response shows:
- `status: "pending"` → Waiting in queue
- `status: "processing"` → AI_Backend is analyzing
- `status: "completed"` → Results available
- `status: "failed"` → Error occurred

### View all fields populated by AI:
```bash
GET /api/candidates/:id
```

Returns complete evaluation with all AI-generated insights.

---
