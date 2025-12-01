# MVP Testing Plan - AI-Driven Hiring Intelligence Tool

## 🎯 MVP Requirements Checklist

### ✅ **IMPLEMENTED FEATURES**

#### **Inputs**
- ✅ Upload resume (PDF, DOCX) - `/api/candidates/upload-resume`
- ✅ Input LinkedIn URL - `/api/candidates/linkedin`  
- ✅ Target job role input - Both endpoints accept `jobRole` parameter

#### **Core Processing**
- ✅ Extract data (name, experience, skills, education, certifications)
- ⚠️ AI evaluation (MOCK - needs real AI integration)
- ⚠️ Bias check (MOCK - needs real implementation)

#### **Filtering & Search**
- ✅ Filter by skill keyword - `?skill=JavaScript`
- ✅ Filter by experience range - `?experience_min=2&experience_max=5`
- ✅ Filter by score threshold - `?score_min=70&score_max=90`

#### **Outputs**
- ✅ Candidate Summary Page - `/api/candidates/:id`
- ✅ Export CSV/XLSX - `/api/export/candidates?format=csv`
- ✅ Hiring Intelligence Report - `/api/export/report/:id`

#### **Dashboard**
- ✅ Total candidates processed - `/api/dashboard`
- ✅ Average role-fit score - `/api/dashboard`
- ✅ Shortlist count - `/api/dashboard`

---

## 🧪 **ENDPOINT TESTING CHECKLIST**

### **Step 1: Authentication Setup**

#### 1.1 Register Admin User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```
**Expected**: 201 Created, user registered

#### 1.2 Login & Get Token
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "AdminPass123!"
}
```
**Expected**: 200 OK, returns `access_token`

#### 1.3 Get Profile
```bash
GET /auth/profile
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, user profile data

#### 1.4 Change Password
```bash
PUT /auth/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "currentPassword": "AdminPass123!",
  "newPassword": "NewSecurePass456@"
}
```
**Expected**: 200 OK, password changed

---

### **Step 2: Core MVP Features Testing**

#### 2.1 Resume Upload Processing
```bash
POST /api/candidates/upload-resume
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [PDF/DOCX resume file]
jobRole: "Backend Engineer"
```
**Expected**: 
- 201 Created
- Returns `candidateId` and processing status
- Background job starts AI evaluation

#### 2.2 LinkedIn Profile Processing
```bash
POST /api/candidates/linkedin
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "linkedinUrl": "https://www.linkedin.com/in/johndoe",
  "jobRole": "Frontend Developer"
}
```
**Expected**:
- 201 Created
- Returns `candidateId` and processing status
- LinkedIn scraping works (if profile is public)

#### 2.3 List Candidates (No Filters)
```bash
GET /api/candidates
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, array of candidates

#### 2.4 Filter by Skill
```bash
GET /api/candidates?skill=JavaScript
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, filtered candidates containing "JavaScript"

#### 2.5 Filter by Experience Range
```bash
GET /api/candidates?experience_min=2&experience_max=5
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, candidates with 2-5 years experience

#### 2.6 Filter by Score Threshold
```bash
GET /api/candidates?score_min=70&score_max=90
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, candidates with role fit score 70-90

#### 2.7 Combined Filters
```bash
GET /api/candidates?skill=Python&experience_min=3&score_min=75
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, candidates matching all criteria

#### 2.8 Get Candidate Details
```bash
GET /api/candidates/{candidateId}
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, detailed candidate evaluation including:
- Name, experience, skills, education
- Role fit score (0-100)
- Key strengths, weaknesses
- Missing skills
- Interview questions
- Confidence score
- Bias check results

---

### **Step 3: Dashboard & Analytics**

#### 3.1 Dashboard Metrics
```bash
GET /api/dashboard
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, dashboard data:
```json
{
  "totalCandidates": 150,
  "averageRoleFitScore": 75.5,
  "shortlistCount": 25,
  "processingCount": 5,
  "recentCandidates": [...]
}
```

#### 3.2 Score Distribution (Admin Only)
```bash
GET /api/dashboard/score-distribution
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, score distribution data

---

### **Step 4: Export Features**

#### 4.1 Export CSV
```bash
GET /api/export/candidates?format=csv
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, CSV file download with columns:
- name, linkedinUrl, yearsOfExperience, skills, roleFitScore, confidenceScore

#### 4.2 Export XLSX
```bash
GET /api/export/candidates?format=xlsx
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, Excel file download

#### 4.3 Export with Filters
```bash
GET /api/export/candidates?format=csv&skill=Python&score_min=80
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, filtered CSV export

#### 4.4 Generate Hiring Intelligence Report
```bash
GET /api/export/report/{candidateId}
Authorization: Bearer {access_token}
```
**Expected**: 200 OK, HTML report download

---

### **Step 5: Error Handling Tests**

#### 5.1 Invalid File Upload
```bash
POST /api/candidates/upload-resume
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [.txt file or >10MB file]
jobRole: "Backend Engineer"
```
**Expected**: 400 Bad Request, validation error

#### 5.2 Invalid LinkedIn URL
```bash
POST /api/candidates/linkedin
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "linkedinUrl": "https://invalid-url.com",
  "jobRole": "Developer"
}
```
**Expected**: 400 Bad Request, URL validation error

#### 5.3 Unauthorized Access
```bash
GET /api/candidates
# No Authorization header
```
**Expected**: 401 Unauthorized

#### 5.4 Non-existent Candidate
```bash
GET /api/candidates/507f1f77bcf86cd799439011
Authorization: Bearer {access_token}
```
**Expected**: 404 Not Found

---

## ❌ **MISSING FROM MVP REQUIREMENTS**

### **Critical Missing Features**

1. **Real AI Integration**
   - Current: Mock AI responses
   - Required: Actual AI evaluation engine
   - Impact: Core functionality not working

2. **Privacy & Retention Policy Endpoints**
   - Required: Data retention policy API
   - Required: Data deletion/export for users
   - Required: Privacy policy display

3. **Bias Disclaimer & Confidence Display**
   - Current: Mock confidence scores
   - Required: Real bias detection
   - Required: Bias disclaimer in UI

4. **Frontend Application**
   - Current: API-only backend
   - Required: Complete UI for MVP demonstration

### **Legal/Ethical Compliance Missing**

1. **Data Privacy Endpoints**
   ```bash
   # Missing endpoints:
   GET /api/privacy/policy
   POST /api/privacy/delete-data
   GET /api/privacy/export-data
   ```

2. **Bias Disclaimer Integration**
   - All AI responses should include bias warnings
   - Confidence scores should be prominently displayed

3. **Data Retention Management**
   - Automatic data cleanup after retention period
   - User consent tracking

### **Performance Requirements Missing**

1. **10-Second Processing Requirement**
   - Current: Background job processing (async)
   - Required: Synchronous processing within 10 seconds
   - Solution: Optimize AI pipeline or implement real-time processing

2. **Deterministic Scoring**
   - Current: Random mock scores
   - Required: Same inputs = same outputs (±small variance)

### **Testing Coverage Missing**

1. **Unit Tests** (Required: ≥40% coverage)
   - Current: No test files found
   - Required: Tests for parsing, scoring, API endpoints

2. **Integration Tests**
   - End-to-end workflow testing
   - File processing validation
   - AI pipeline testing

---

## 🚀 **IMMEDIATE ACTION ITEMS**

### **Priority 1: Core Functionality**
1. Replace mock AI service with real implementation
2. Add privacy/retention policy endpoints
3. Implement real bias detection
4. Add unit tests (≥40% coverage)

### **Priority 2: Compliance**
1. Add bias disclaimers to all AI responses
2. Implement data deletion/export features
3. Add privacy policy display

### **Priority 3: Performance**
1. Optimize processing to meet 10-second requirement
2. Make scoring deterministic
3. Add performance monitoring

### **Priority 4: Frontend**
1. Build React/Next.js UI
2. Implement file upload interface
3. Create dashboard visualizations
4. Add candidate management interface

---

## 📊 **MVP COMPLETION STATUS**

- **Backend API**: 85% Complete
- **AI Integration**: 15% Complete (mock only)
- **Legal/Ethical**: 30% Complete
- **Frontend**: 5% Complete (structure only)
- **Testing**: 10% Complete
- **Overall MVP**: 45% Complete

**The backend infrastructure is solid, but AI integration and frontend are critical blockers for MVP completion.**