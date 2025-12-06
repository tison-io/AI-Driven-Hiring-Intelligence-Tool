# Processing Time Optimization Guide

## Current Performance: 21.3 seconds

### Bottleneck Analysis
- Upload: 695ms (3.3%) ✓ Already fast
- AI Processing: 20,650ms (96.7%) ⚠️ Main bottleneck

## Optimization Strategies

### 1. Combine API Calls (Fastest - 50% reduction)
**Current:** 2 sequential calls to AI_Backend
- `/parse-text` → extract data
- `/score` → calculate score

**Optimized:** 1 call using existing `/analyze` endpoint

**Implementation:**
```typescript
// backend/src/modules/ai/ai.service.ts
async evaluateCandidate(rawText: string, jobRole: string) {
  const formData = new FormData();
  formData.append('file', Buffer.from(rawText), 'resume.txt');
  formData.append('role_name', jobRole);

  const response = await axios.post(`${this.aiServiceUrl}/analyze`, formData);
  
  return this.transformAiResponse(
    response.data.candidate_profile,
    response.data.evaluation
  );
}
```

**Expected Time:** ~10-12 seconds (50% faster)

---

### 2. Use Faster OpenAI Model
**Current:** `gpt-4o-mini` (slower but cheaper)

**Options:**
- `gpt-3.5-turbo` - 2-3x faster, slightly less accurate
- `gpt-4o` - Similar speed, better quality

**Implementation:**
```python
# AI_Backend/extraction.py & scoring.py
response = client.chat.completions.create(
    model="gpt-3.5-turbo",  # Change from gpt-4o-mini
    # ... rest of config
)
```

**Expected Time:** ~14-16 seconds (25-30% faster)

---

### 3. Parallel Processing (Advanced)
Process extraction and scoring simultaneously if they don't depend on each other.

**Implementation:**
```typescript
// backend/src/modules/ai/ai.service.ts
async evaluateCandidate(rawText: string, jobRole: string) {
  const [extractedData, preliminaryScore] = await Promise.all([
    this.extractCandidateData(rawText),
    this.quickScore(rawText, jobRole)  // New lightweight scoring
  ]);
  
  // Combine results
  return this.mergeResults(extractedData, preliminaryScore);
}
```

**Expected Time:** ~12-15 seconds (30-40% faster)

---

### 4. Caching Strategy
Cache results for identical resumes.

**Implementation:**
```typescript
// backend/src/modules/ai/ai.service.ts
async evaluateCandidate(rawText: string, jobRole: string) {
  const cacheKey = crypto.createHash('md5').update(rawText + jobRole).digest('hex');
  
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const result = await this.processWithAI(rawText, jobRole);
  await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
  
  return result;
}
```

**Expected Time:** ~50ms for cached results

---

### 5. Streaming Response (UX Improvement)
Don't reduce time, but improve perceived performance.

**Implementation:**
```typescript
// Return partial results immediately
async evaluateCandidate(rawText: string, jobRole: string) {
  // Quick extraction (2-3 seconds)
  const basicInfo = await this.quickExtract(rawText);
  await this.candidatesService.update(candidateId, {
    name: basicInfo.name,
    skills: basicInfo.skills,
    status: 'processing'
  });
  
  // Full analysis (remaining time)
  const fullAnalysis = await this.deepAnalysis(rawText, jobRole);
  await this.candidatesService.update(candidateId, fullAnalysis);
}
```

**User sees results in:** ~3 seconds (partial), ~20 seconds (complete)

---

## Recommended Implementation Order

### Phase 1: Quick Wins (1 hour)
1. ✅ Combine API calls → **50% faster**
2. ✅ Switch to gpt-3.5-turbo → **Additional 20% faster**

**Result:** ~8-10 seconds total

### Phase 2: Advanced (2-3 hours)
3. Add caching for repeat resumes
4. Implement streaming responses

**Result:** ~8-10 seconds (first time), ~50ms (cached)

### Phase 3: Infrastructure (1 day)
5. Add Redis caching layer
6. Implement parallel processing
7. Add CDN for file uploads

**Result:** ~5-7 seconds

---

## Code Changes Required

### Option 1: Combine Calls (Recommended)
```typescript
// backend/src/modules/ai/ai.service.ts
async evaluateCandidate(rawText: string, jobRole: string) {
  const response = await axios.post(`${this.aiServiceUrl}/analyze`, {
    text: rawText,
    role_name: jobRole
  });

  return {
    name: response.data.candidate_profile.candidate_name,
    roleFitScore: response.data.evaluation.role_fit_score,
    keyStrengths: response.data.evaluation.key_strengths,
    // ... map remaining fields
  };
}
```

### Option 2: Faster Model
```python
# AI_Backend/extraction.py
response = client.chat.completions.create(
    model="gpt-3.5-turbo",  # ← Change this line
    messages=[...],
    response_format={"type": "json_object"},
    temperature=0.0
)
```

```python
# AI_Backend/scoring.py
response = client.chat.completions.create(
    model="gpt-3.5-turbo",  # ← Change this line
    messages=[...],
    response_format={"type": "json_object"},
    temperature=0.2
)
```

---

## Testing Performance

```bash
# Run timing test
cd backend
npm run test:e2e

# Compare before/after results
```

---

## Cost vs Speed Tradeoff

| Model | Speed | Cost per 1K tokens | Quality |
|-------|-------|-------------------|---------|
| gpt-3.5-turbo | Fast | $0.0005 | Good |
| gpt-4o-mini | Medium | $0.00015 | Better |
| gpt-4o | Fast | $0.005 | Best |

**Recommendation:** Use `gpt-3.5-turbo` for 2-3x speed improvement with minimal quality loss.
