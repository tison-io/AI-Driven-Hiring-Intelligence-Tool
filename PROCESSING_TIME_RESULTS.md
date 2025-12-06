# Resume Processing Time Test Results

## Test Overview
Measures actual time from resume upload to completed AI evaluation.

## Test Results

```
✓ Upload: 695ms
✓ Total: 21,345ms (21.3 seconds)
✓ AI Processing: 20,650ms (20.7 seconds)
✓ Final Score: 30/100
```

## Breakdown

| Phase | Time | Percentage |
|-------|------|------------|
| Upload & Queue | 695ms | 3.3% |
| AI Processing | 20,650ms | 96.7% |
| **Total** | **21,345ms** | **100%** |

## What Happens During Processing

1. **Upload (695ms)**
   - Extract text from PDF
   - Create candidate record in MongoDB
   - Add job to Redis queue

2. **AI Processing (20,650ms)**
   - Queue picks up job
   - Sends text to AI_Backend `/parse-text` endpoint
   - AI extracts: name, skills, experience, education
   - Sends data to AI_Backend `/score` endpoint
   - AI calculates: fit score, strengths, weaknesses, questions
   - Updates MongoDB with results

## Run the Test

```bash
cd backend
npm run test:e2e
```

## Test File Location
`backend/test/resume-processing-time.e2e-spec.ts`
