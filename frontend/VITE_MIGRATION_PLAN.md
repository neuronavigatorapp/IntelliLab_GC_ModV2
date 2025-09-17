# Frontend Stack Analysis - Vite Migration Plan

**Generated:** September 16, 2025  
**Branch:** feat/vite-migration  
**Purpose:** CRA → Vite migration inventory and planning

## Current CRA Stack

### Scripts Analysis
```json
{
  "start": "react-scripts start",      // CRA dev server (failing)
  "build": "npm run placeholder:check && react-scripts build",
  "dev": "react-scripts start",        // Duplicate of start
  "test": "vitest",                    // Already using Vitest!
  "test:e2e": "playwright test",       // Playwright configured
}
```

### Dependencies Status
- **Framework**: React 18.2.0 ✅ (Vite compatible)
- **CRA**: react-scripts 5.0.1 ❌ (to be replaced)
- **Vite Plugin**: @vitejs/plugin-react 5.0.1 ✅ (already present!)
- **TypeScript**: 5.4.5 ✅ (Vite compatible)
- **Test Runner**: Vitest 3.2.4 ✅ (already migrated from Jest)

### Entry Point Analysis
- **Main Entry**: `src/index.tsx` ✅
- **Root Element**: `document.getElementById('root')` ✅
- **Mount**: `ReactDOM.createRoot()` ✅ (React 18 pattern)

### Assets & Public
- **Public Directory**: `frontend/public/` with index.html ✅
- **Index HTML**: Standard CRA template with `%PUBLIC_URL%` placeholders
- **Service Worker**: Custom PWA implementation in index.html
- **Assets**: Standard CRA structure (logo192.png, manifest.json, etc.)

### Environment Variables
**Current CRA Format** (found in codebase):
- `process.env.REACT_APP_SENTRY_DSN` (1 usage)
- `process.env.NODE_ENV` (6 usages)

**Environment Files**:
- `.env`: `SKIP_PREFLIGHT_CHECK=true` (CRA-specific, can remove)
- `.env.local`: `DANGEROUSLY_DISABLE_HOST_CHECK=true` (CRA-specific)

### Test Configuration
- **Unit Tests**: Vitest (already migrated) ✅
- **E2E Tests**: Playwright with baseURL: `http://localhost:3000`
- **Config**: `playwright.config.ts` needs port update

### Build Tools
- **CSS**: Tailwind CSS 3.4.17 ✅
- **PostCSS**: autoprefixer 10.4.21 ✅
- **TypeScript**: tsconfig.json configured ✅
- **ESLint**: 8.57.1 with React plugins ✅

## Migration Requirements

### Phase 1: Add Vite Dependencies
**Already Present**: ✅ @vitejs/plugin-react 5.0.1
**Need to Add**: ✅ vite (missing from devDependencies)

### Phase 2: Configuration Files Needed
1. `vite.config.ts` - Main Vite configuration
2. Update `index.html` - Replace `%PUBLIC_URL%` with `/`
3. Update scripts in package.json

### Phase 3: Environment Variable Migration
**Minimal Changes Required**:
- `REACT_APP_SENTRY_DSN` → `VITE_SENTRY_DSN` (1 file)
- Keep `process.env.NODE_ENV` → `import.meta.env.MODE` (6 files)

### Phase 4: Port Configuration
- **Target Port**: 5173 (Vite default)
- **Fallback**: Auto-detect if 5173 busy
- **Update**: Playwright baseURL, VS Code tasks

### Phase 5: Service Worker & PWA
- **Current**: Custom SW registration in index.html
- **Strategy**: Keep existing implementation (works with Vite)
- **Manifest**: public/manifest.json (no changes needed)

## Risk Assessment

### Low Risk ✅
- Vitest already working (no Jest migration needed)
- @vitejs/plugin-react already installed
- Standard React 18 + TypeScript setup
- Minimal environment variable usage

### Medium Risk ⚠️
- Service Worker registration (custom implementation)
- Public URL references in index.html
- Playwright baseURL configuration

### No Risk 🟢
- CSS/Tailwind (Vite supports natively)  
- Asset imports (standard patterns)
- TypeScript configuration (already compatible)

## Migration Strategy

1. **Preserve**: Keep all existing functionality
2. **Minimal**: Only change what's necessary for Vite
3. **Incremental**: Test each phase independently
4. **Rollback**: Keep CRA artifacts until full verification

## Expected Benefits
- ✅ **Fast HMR**: Sub-second hot reloads
- ✅ **Node v24 Compatibility**: Eliminate CRA runtime issues
- ✅ **Faster Builds**: Vite's esbuild-based bundling
- ✅ **Modern Dev Experience**: Native ES modules
- ✅ **Reliable Dev Server**: Stable on modern Node versions

---
*Next: Phase 1 - Add Vite dependencies*