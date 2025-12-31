---
name: Production Readiness Assessment
overview: Comprehensive review of Meta Agent Mobile codebase to identify and fix bugs, security issues, and production blockers before deployment.
todos:
  - id: fix-lint-errors
    content: Fix unescaped JSX entities in prospero-search.tsx
    status: completed
  - id: fix-unused-vars
    content: Clean up unused variables in 7 component files
    status: completed
  - id: fix-hook-deps
    content: Add missing dependencies to useEffect hooks in streaming-output.tsx
    status: completed
  - id: cleanup-unused
    content: Remove unused rCodeMatch and dead code in project-manager
    status: completed
  - id: verify-fixes
    content: Run lint and tests to confirm all issues resolved
    status: completed
---

# Meta Agent Mobile - Production Readiness Assessment

After reviewing the entire codebase, I found the app to be **mostly production-ready** with solid architecture. However, there are 12 issues to address - 2 errors and 10 warnings from linting, plus some production hardening opportunities.

---

## Current Status: Nearly Ready

**Strengths:**

- Well-structured Expo Router app with proper provider hierarchy
- Solid tRPC integration with type-safe API
- Comprehensive test coverage (122 tests passing)
- TypeScript strict mode with no type errors
- Good security practices (JWT, cookie-based auth, Firejail sandboxing for R)
- Clean separation of concerns (agent SDK, workspace, database)

**Issues Found:**

### Category 1: Lint Errors (Must Fix)

| File | Issue |

|------|-------|

| `components/prospero/prospero-search.tsx:496` | Unescaped quotes in JSX text |

### Category 2: Lint Warnings (Should Fix)

| File | Issue |

|------|-------|

| `components/database/study-manager.tsx` | Unused `error` variables |

| `components/prisma/flowchart-builder.tsx` | Unused `useRef` import |

| `components/prisma/flowchart-renderer.tsx` | Unused imports and variable |

| `components/terminal/csv-picker.tsx` | Unused `error` variable |

| `components/terminal/export-sheet.tsx` | Multiple unused `error` variables |

| `components/terminal/streaming-output.tsx` | Missing useEffect dependencies |

| `components/workspace/project-manager.tsx` | Unused function assignments |

### Category 3: Production Hardening (Recommended)

| Area | Recommendation |

|------|----------------|

| Debug logging | Remove or gate 114 `console.log` statements behind NODE_ENV |

| Unused variable in hook | `rCodeMatch` in `use-agent.ts:279` is extracted but never used |

| Package.json | Consider adding `"type": "module"` to avoid ESM warning |

---

## Implementation Plan

### Step 1: Fix Lint Errors

Fix the unescaped quotes in [components/prospero/prospero-search.tsx](components/prospero/prospero-search.tsx):

```tsx
// Line 496: Replace double quotes with escaped entities
// Before: starts with "CRD" followed by
// After: starts with &quot;CRD&quot; followed by
```

### Step 2: Fix Unused Variables

Clean up unused variables across 7 files by either:

- Prefixing with underscore (`_error`) for intentionally unused catch variables
- Removing unused imports and assignments

### Step 3: Fix React Hook Dependencies

Add missing dependencies to `useEffect` in [components/terminal/streaming-output.tsx](components/terminal/streaming-output.tsx):

- Add `fadeAnim`, `pulseAnim`, `blinkAnim` to their respective dependency arrays

### Step 4: Remove Unused Code

- Remove `rCodeMatch` extraction in `use-agent.ts` or implement its intended functionality
- Remove unused `importProjectFromJson` and `handleExport` in project-manager

### Step 5: Production Logging (Optional)

Wrap debug logs with environment check or remove them:

if (**DEV**) {

console.log("[Auth] Debug message");

}

---

## Files to Modify

1. [components/prospero/prospero-search.tsx](components/prospero/prospero-search.tsx) - Fix JSX entities
2. [components/database/study-manager.tsx](components/database/study-manager.tsx) - Fix unused errors
3. [components/prisma/flowchart-builder.tsx](components/prisma/flowchart-builder.tsx) - Remove unused import
4. [components/prisma/flowchart-renderer.tsx](components/prisma/flowchart-renderer.tsx) - Remove unused code
5. [components/terminal/csv-picker.tsx](components/terminal/csv-picker.tsx) - Fix unused error
6. [components/terminal/export-sheet.tsx](components/terminal/export-sheet.tsx) - Fix unused errors
7. [components/terminal/streaming-output.tsx](components/terminal/streaming-output.tsx) - Fix hook dependencies
8. [components/workspace/project-manager.tsx](components/workspace/project-manager.tsx) - Remove unused code
9. [hooks/use-agent.ts](hooks/use-agent.ts) - Remove or use rCodeMatch variable

---

## What Does NOT Need Fixing

- **No security vulnerabilities found** - Auth properly validates sessions, R execution is sandboxed
- **No memory leaks** - Proper cleanup in hooks
- **No type errors** - `pnpm check` passes
- **Tests all pass** - 122 tests successful
- **Database operations safe** - Parameterized queries, no SQL injection risks
- **CORS configured correctly** - Reflects origin for credentialed requests