# Frontend Cleanup Guide - Critical Issues & Fixes

## 🚨 **Critical Issues Found**

### **1. Type Safety Issues**
```typescript
// ❌ CRITICAL: Using 'any' types everywhere
interface CandidateDetailProps {
  candidate: any & { isShortlisted?: boolean } // TODO: Replace with proper type
}

// ✅ FIX: Use proper types from types/index.ts
interface CandidateDetailProps {
  candidate: Candidate & { isShortlisted?: boolean }
}
```

### **2. Incomplete Component Implementations**
```typescript
// ❌ CRITICAL: Empty component files
// src/components/ui/Button.tsx - Only comments, no implementation
// src/utils/constants.ts - Only comments, no actual constants
```

### **3. Inconsistent API Patterns**
```typescript
// ❌ MIXED: Some API calls use axios, others use fetch
// AuthContext uses fetch(), but candidatesApi uses axios
```

### **4. Missing Error Boundaries**
```typescript
// ❌ CRITICAL: No error boundaries for component crashes
// App can crash completely if any component fails
```

---

## 🔧 **Immediate Cleanup Tasks**

### **Priority 1: Fix Type Safety (1-2 hours)**

#### **Replace all 'any' types:**
```typescript
// Files to fix:
- src/components/candidates/CandidateDetail.tsx
- src/components/candidates/CandidateCard.tsx  
- src/components/dashboard/*.tsx
- src/hooks/*.ts

// Replace with proper Candidate interface from types/index.ts
```

#### **Add missing type exports:**
```typescript
// src/types/index.ts - Add missing types:
export interface CandidateWithShortlist extends Candidate {
  isShortlisted: boolean;
}

export interface UploadResponse {
  candidate: Candidate;
  message: string;
}
```

### **Priority 2: Complete UI Components (2-3 hours)**

#### **Implement Button component:**
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### **Add missing constants:**
```typescript
// src/utils/constants.ts
export const API_ENDPOINTS = {
  CANDIDATES: '/candidates',
  UPLOAD: '/upload',
  DASHBOARD: '/dashboard'
};

export const CANDIDATE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;
```

### **Priority 3: Standardize API Layer (1 hour)**

#### **Consolidate to single HTTP client:**
```typescript
// Either use axios everywhere OR fetch everywhere
// Recommendation: Stick with axios for consistency

// Update AuthContext to use axios instead of fetch
import api from '@/lib/api';

const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};
```

### **Priority 4: Add Error Boundaries (30 minutes)**

#### **Create error boundary component:**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Catch component crashes and show fallback UI
}

// Wrap main app sections
<ErrorBoundary>
  <CandidateDetail />
</ErrorBoundary>
```

---

## 🧹 **Code Quality Cleanup**

### **1. Remove Dead Code**
```bash
# Files to check for unused code:
- src/components/admin/* (if admin features not implemented)
- src/hooks/useAdminDashboard.ts (if not used)
- Unused imports across all files
```

### **2. Fix Inconsistent Naming**
```typescript
// ❌ Inconsistent naming patterns
const isDownloadingReport = useState(false) // camelCase
const candidate_id = props.candidateId     // snake_case

// ✅ Use consistent camelCase everywhere
```

### **3. Extract Magic Numbers/Strings**
```typescript
// ❌ Magic values scattered in code
timeout: 10000
maxFileSize: 10 * 1024 * 1024

// ✅ Move to constants
export const CONFIG = {
  API_TIMEOUT: 10000,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ITEMS_PER_PAGE: 20
};
```

### **4. Standardize Loading States**
```typescript
// ❌ Different loading patterns everywhere
const [isLoading, setIsLoading] = useState(false)
const [loading, setLoading] = useState(false)
const [isDownloadingReport, setIsDownloadingReport] = useState(false)

// ✅ Use consistent pattern with custom hook
const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... standard async handling
};
```

---

## 📁 **File Structure Cleanup**

### **1. Remove Empty/Placeholder Files**
```bash
# Check these files - remove if empty:
- src/components/ui/Button.tsx (only comments)
- src/utils/constants.ts (only comments)
- Any .tsx files with just placeholder content
```

### **2. Consolidate Similar Components**
```bash
# Merge similar components:
- Header.tsx + MobileHeader.tsx → ResponsiveHeader.tsx
- Multiple modal components → Generic Modal with variants
```

### **3. Move Misplaced Files**
```bash
# Reorganize:
- Move all API functions to src/lib/api/
- Move all types to src/types/
- Group related hooks in src/hooks/
```

---

## 🔒 **Security & Performance Cleanup**

### **1. Fix Token Storage Issues**
```typescript
// ❌ Direct localStorage access everywhere
localStorage.getItem('token')

// ✅ Use centralized token management
import { tokenStorage } from '@/lib/auth';
const token = tokenStorage.get();
```

### **2. Add Input Validation**
```typescript
// ❌ No client-side validation
<input type="email" />

// ✅ Add validation with react-hook-form
const { register, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema)
});
```

### **3. Optimize Bundle Size**
```typescript
// ❌ Import entire libraries
import * as Icons from '@heroicons/react/24/outline';

// ✅ Import only what you need
import { UserIcon, DocumentIcon } from '@heroicons/react/24/outline';
```

---

## 🚀 **Quick Wins (30 minutes each)**

### **1. Fix TypeScript Errors**
```bash
npm run type-check
# Fix all TypeScript errors before proceeding
```

### **2. Add Loading Skeletons**
```typescript
// Replace all "Loading..." text with proper skeleton components
<CandidatesTableSkeleton />
```

### **3. Standardize Error Messages**
```typescript
// Create centralized error handling
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please try again.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FILE_TOO_LARGE: 'File size must be less than 10MB.'
};
```

### **4. Add Proper Loading States**
```typescript
// Every async operation should have loading state
const [isUploading, setIsUploading] = useState(false);
// Show spinner/progress during upload
```

---

## 📋 **Cleanup Checklist**

### **Phase 1: Critical Fixes (Day 1)**
- [ ] Replace all `any` types with proper interfaces
- [ ] Implement missing UI components (Button, Input, etc.)
- [ ] Add error boundaries to prevent crashes
- [ ] Fix TypeScript compilation errors
- [ ] Standardize API client (axios vs fetch)

### **Phase 2: Code Quality (Day 2)**
- [ ] Remove unused imports and dead code
- [ ] Extract constants and magic numbers
- [ ] Standardize naming conventions
- [ ] Add input validation schemas
- [ ] Implement proper loading states

### **Phase 3: Performance & Security (Day 3)**
- [ ] Optimize bundle imports
- [ ] Add proper error handling
- [ ] Secure token storage
- [ ] Add loading skeletons
- [ ] Test all critical user flows

---

## 🎯 **Success Criteria**

### **Before Cleanup:**
- TypeScript errors: ~15-20
- Bundle size: Unknown
- Loading states: Inconsistent
- Error handling: Basic toast messages

### **After Cleanup:**
- TypeScript errors: 0
- Bundle size: Optimized
- Loading states: Consistent across app
- Error handling: Comprehensive with fallbacks

**Focus on type safety first - it will catch many other issues automatically.**