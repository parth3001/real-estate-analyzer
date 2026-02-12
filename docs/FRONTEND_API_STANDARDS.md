# Frontend API Communication Standards

**Purpose:** Define how frontend communicates with backend APIs
**Status:** MANDATORY - All frontend code MUST follow these patterns
**Last Updated:** February 11, 2026

---

## 🚨 CRITICAL RULES

### **1. Single HTTP Client Pattern**

ALL frontend API calls MUST use the axios instance in `/frontend/src/services/api.ts`

❌ **NEVER:**
- Use native `fetch()` for API calls
- Create parallel HTTP client logic (e.g., `calculatorService.ts` with fetch)
- Manually construct API URLs

✅ **ALWAYS:**
- Extend existing `api.ts` for new endpoints
- Use axios instance with proper interceptors
- Follow established patterns

---

## 🌐 Environment Variable Format

### **Production (Render Dashboard)**
```bash
VITE_API_URL=https://real-estate-analyzer-api.onrender.com
# NO /api suffix - axios baseURL handles this automatically
```

### **Local Development**
```bash
# .env.local (not committed to git)
VITE_API_URL=http://localhost:3001
# Points to local backend server
```

---

## 🔧 URL Construction Pattern

**How URLs Are Built:**
```
VITE_API_URL (environment variable)
↓
https://real-estate-analyzer-api.onrender.com

axios baseURL (api.ts line 15)
↓
baseURL: import.meta.env.VITE_API_URL || '/api'
↓
https://real-estate-analyzer-api.onrender.com

Endpoint (hardcoded in api call)
↓
api.post('/deals/analyze', data)
↓
/deals/analyze

Final URL constructed by axios
↓
https://real-estate-analyzer-api.onrender.com/api/deals/analyze
```

**Key Insight:** The `/api` prefix is added by axios baseURL fallback logic, NOT by environment variable.

---

## ✅ Correct Pattern (Use This)

### **File:** `/frontend/src/services/api.ts`

```typescript
import axios from 'axios';

// Single axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export for use throughout app
export default api;

// Example endpoint function
export const analyzeProperty = async (data: PropertyData) => {
  const response = await api.post('/deals/analyze', data);
  return response.data;
};

export const analyzeAnonymous = async (data: Partial<PropertyData>) => {
  const response = await api.post('/deals/analyze-anonymous', data);
  return response.data;
};
```

### **Usage in Components:**

```typescript
import { analyzeProperty, analyzeAnonymous } from '../../services/api';

// In component
const handleAnalyze = async () => {
  const result = await analyzeAnonymous(propertyData);
  // ✅ Correct URL: https://.../api/deals/analyze-anonymous
};
```

---

## ❌ WRONG Pattern (NEVER Do This)

### **File:** `/frontend/src/components/Calculator/calculatorService.ts`

```typescript
// ❌ WRONG - Creates parallel HTTP logic
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const response = await fetch(`${API_BASE_URL}/api/deals/analyze-anonymous`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

**Why This Is Wrong:**
- ❌ Duplicates HTTP logic (headers, error handling)
- ❌ Doesn't use auth interceptor (inconsistent)
- ❌ Manually constructs URLs (error-prone)
- ❌ Creates `/api/api` bug if VITE_API_URL includes `/api`

---

## 📋 Checklist: Adding New API Endpoint

When adding a new feature that needs backend API:

### **Step 1: Check if endpoint exists**
- [ ] Read `/docs/ARCHITECTURE_V3.md` for documented endpoints
- [ ] Example: `POST /api/deals/analyze` already exists

### **Step 2: Add to api.ts (NOT new file)**
- [ ] Open `/frontend/src/services/api.ts`
- [ ] Add new function using existing `api` instance
- [ ] Follow naming convention: `verbNoun` (e.g., `analyzeProperty`, `createPortfolio`)

### **Step 3: Use TypeScript types**
- [ ] Import types from `/frontend/src/types/`
- [ ] Type function parameters and return values
- [ ] Example: `async (data: PropertyData): Promise<AnalysisResponse>`

### **Step 4: Export and use**
- [ ] Export function from `api.ts`
- [ ] Import in component: `import { newFunction } from '../../services/api'`
- [ ] Call function: `const result = await newFunction(data)`

---

## 🔍 Common Mistakes & Fixes

### **Mistake 1: Creating Separate Service Files**
```typescript
// ❌ WRONG
// File: calculatorService.ts
const response = await fetch(...);

// ✅ CORRECT
// Add to existing api.ts
export const calculatorAnalyze = async (data) => {
  return api.post('/deals/analyze-anonymous', data);
};
```

### **Mistake 2: Hardcoding Full URLs**
```typescript
// ❌ WRONG
await api.post('https://real-estate-analyzer-api.onrender.com/api/deals', data);

// ✅ CORRECT
await api.post('/deals', data);
```

### **Mistake 3: Adding /api Prefix in Endpoint**
```typescript
// ❌ WRONG
await api.post('/api/deals/analyze', data);
// Results in: /api/api/deals/analyze

// ✅ CORRECT
await api.post('/deals/analyze', data);
// Results in: /api/deals/analyze (baseURL adds /api)
```

---

## 🧪 Testing API Calls

### **Manual Testing:**
1. Open browser DevTools → Network tab
2. Trigger API call
3. Check request URL - should be: `https://real-estate-analyzer-api.onrender.com/api/[endpoint]`
4. Verify NO duplicate `/api/api` in URL

### **Automated Testing:**
```typescript
// Example: api.test.ts
import { analyzeProperty } from './api';
import axios from 'axios';

jest.mock('axios');

test('constructs correct URL', async () => {
  const mockPost = jest.spyOn(axios, 'post');
  await analyzeProperty(mockData);

  expect(mockPost).toHaveBeenCalledWith(
    '/deals/analyze',  // NOT '/api/deals/analyze'
    expect.any(Object)
  );
});
```

---

## 📚 Related Documentation

- **Main Architecture:** `/docs/ARCHITECTURE_V3.md`
- **Backend API Endpoints:** `/docs/ARCHITECTURE_V3.md` (Lines 347-496)
- **TypeScript Types:** `/frontend/src/types/property.ts`, `/frontend/src/types/analysis.ts`
- **Authentication Patterns:** `/docs/ARCHITECTURE.md` (Lines 81-150)

---

## 🚨 When You Break This Pattern

**If you accidentally create parallel HTTP logic:**

1. **Immediately refactor** - Don't let it reach production
2. **Delete the new service file** (e.g., `calculatorService.ts`)
3. **Move logic to `api.ts`** using axios instance
4. **Update imports** in components
5. **Test thoroughly** to ensure no URL construction bugs

**Recent Example (February 2026):**
- **Issue:** Calculator used `fetch()` in `calculatorService.ts`
- **Result:** 404 errors due to `/api/api` URL duplication in production
- **Root Cause:** `VITE_API_URL` had `/api` suffix, fetch manually added `/api` again
- **Fix:** Changed environment variable from `.../api` to `...com` (temporary workaround)
- **Proper Fix:** Refactor calculator to use `api.ts` (tech debt for later)

---

## ✅ Summary

**Golden Rule:** One HTTP client (`api.ts`), one URL construction pattern (axios baseURL), zero exceptions.

**Before adding new API call, ask yourself:**
1. Can I add this to existing `api.ts`? → YES (always)
2. Do I need to create a new service file? → NO (never)
3. Should I use fetch()? → NO (never)

**If you're unsure:** Ask in code review or check this document.
