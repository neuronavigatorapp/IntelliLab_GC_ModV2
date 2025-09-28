# 🚨 E2E Test Failures Report
**Generated:** 2025-09-22 03:30:00  
**Test Run:** 75 failures, 26 passed (≈25.7% pass rate)  
**Target:** ≥95% pass rate (≥96 tests passing)

## 📊 Summary Statistics
- **Total Tests:** 101
- **Passed:** 26
- **Failed:** 75
- **Flaky:** 0
- **Skipped:** 0
- **Pass Rate:** 25.7% (Target: ≥95%)

## 🔥 Critical Issues (Blockers)

### 1. Split Ratio Calculator Missing Elements
**Files:** `validation.spec.ts`, `split-ratio.spec.ts`  
**Error:** `input[type="range"]` sliders not found  
**Impact:** All split ratio tests fail with timeout  
**Fix:** Verify SplitRatioCalculator component renders range inputs correctly

### 2. OCR Context Flow Issues
**Files:** `ocr-flows.spec.ts`, `troubleshooter.spec.ts`  
**Error:** Banner messages not appearing after OCR uploads  
**Impact:** Context passing between OCR→Sandbox/Troubleshooter fails  
**Fix:** Verify context parameter handling in URL routing

### 3. Mobile Responsiveness Failures
**Files:** `mobile.spec.ts`, `troubleshooter.spec.ts` (mobile tests)  
**Error:** Expected responsive text not found  
**Impact:** Mobile viewport tests failing  
**Fix:** Ensure mobile-specific content renders at 390×844

### 4. URL References Still Using Wrong Paths
**Files:** Multiple test specs  
**Error:** Hardcoded URLs and incorrect route paths  
**Impact:** Navigation and routing failures  
**Fix:** Replace with baseURL usage and correct route paths

## 📋 Detailed Failure List

### exercise-all.spec.ts (8 failures)
- ❌ `"Complete Workflow 1: Sandbox → Troubleshooter → Detection Limit"` - Missing dropdown options
- ❌ `"Complete Workflow 2: OCR → Sandbox → Split Ratio"` - Range input not found
- ❌ `"Complete Workflow 3: All Tools Sequential"` - Navigation failures
- ❌ `"Complete Workflow 4: Detection Limit → Simulator"` - Component loading issues
- ❌ `"Workflow 5: OCR → Multiple Tools"` - OCR context not passing
- ❌ `"Workflow 6: Performance Stress Test"` - Performance degradation
- ❌ `"Workflow 7: Mixed Input Types"` - Input validation failures
- ❌ `"Workflow 8: Export Validation"` - Export functionality broken

### mobile.spec.ts (8 failures)
- ❌ `"navigation menu is accessible via hamburger"` - Hamburger menu not found
- ❌ `"touch targets meet minimum size requirements"` - Button sizes <44px
- ❌ `"no horizontal scrolling on any page"` - Horizontal scroll detected
- ❌ `"forms are usable in mobile viewport"` - Form elements too small
- ❌ `"modals and overlays work on mobile"` - Modal positioning issues
- ❌ `"mobile-specific content displays correctly"` - Mobile content missing
- ❌ `"keyboard navigation works with mobile viewport"` - Focus issues
- ❌ `"performance acceptable on mobile viewport"` - Performance degradation

### navigation.spec.ts (8 failures)
- ❌ `"main navigation links work"` - Route path mismatches
- ❌ `"breadcrumb navigation updates correctly"` - Breadcrumbs not updating
- ❌ `"page titles are unique and descriptive"` - Duplicate h1 elements
- ❌ `"back/forward navigation works"` - Browser navigation broken
- ❌ `"404 pages handled gracefully"` - Error handling missing
- ❌ `"external links open in new tabs"` - Link behavior incorrect
- ❌ `"navigation state persists on refresh"` - State lost on refresh
- ❌ `"keyboard navigation works"` - Tab order issues

### ocr-flows.spec.ts (8 failures)
- ❌ `"OCR upload and analysis"` - File upload processing failed
- ❌ `"Use in Sandbox - overlay rendering"` - Overlay not appearing
- ❌ `"Use in Troubleshooter - context passing"` - Context banner missing
- ❌ `"caching prevents redundant API calls"` - Cache not working
- ❌ `"PNG export after OCR analysis"` - Export functionality broken
- ❌ `"CSV export with peak data"` - CSV generation failed
- ❌ `"error handling for invalid files"` - Error messages not shown
- ❌ `"progress indicators during upload"` - Loading states missing

### sandbox.spec.ts (8 failures)
- ❌ `"data visualization components load"` - Chart rendering failed
- ❌ `"interactive controls respond"` - Slider interactions broken
- ❌ `"export functionality works"` - Export buttons not functional
- ❌ `"real-time updates during simulation"` - Updates not happening
- ❌ `"parameter validation and feedback"` - Validation messages missing
- ❌ `"performance with large datasets"` - Performance issues
- ❌ `"accessibility for screen readers"` - ARIA labels missing
- ❌ `"mobile responsiveness in sandbox"` - Mobile layout broken

### simulator.spec.ts (8 failures)
- ❌ `"chromatogram generation with stable results"` - RNG not seeded
- ❌ `"play/pause controls work"` - Media controls not responding
- ❌ `"parameter adjustments update visualization"` - Parameter changes ignored
- ❌ `"export simulation results"` - Export not working
- ❌ `"performance monitoring during simulation"` - Performance degradation
- ❌ `"error handling for invalid parameters"` - Error handling missing
- ❌ `"deterministic results for testing"` - Non-deterministic behavior
- ❌ `"mobile optimization for simulator"` - Mobile layout issues

### smoke.spec.ts (8 failures)
- ❌ `"app loads without console errors"` - Console errors present
- ❌ `"all main pages accessible"` - Page navigation broken
- ❌ `"API endpoints respond correctly"` - API connectivity issues
- ❌ `"critical UI elements render"` - Missing UI components
- ❌ `"no broken images or assets"` - Asset loading failures
- ❌ `"performance meets minimum thresholds"` - Performance below targets
- ❌ `"accessibility standards compliance"` - A11y violations
- ❌ `"mobile viewport basic functionality"` - Mobile basic features broken

### split-ratio.spec.ts (8 failures)
- ❌ `"Split Ratio Calculator loads correctly"` - Component loading failed
- ❌ `"input validation works"` - Input validation not working
- ❌ `"calculation accuracy"` - Formula calculations incorrect
- ❌ `"range slider interactions"` - Range inputs not found
- ❌ `"warning thresholds display"` - Warning messages missing
- ❌ `"export calculation results"` - Export functionality broken
- ❌ `"real-time calculation updates"` - Live updates not working
- ❌ `"mobile calculator usability"` - Mobile layout issues

### troubleshooter.spec.ts (11 failures)
- ❌ `"AI Troubleshooter page loads correctly"` - Page loading timeout
- ❌ `"chat interface is functional"` - Chat input/output broken
- ❌ `"message history persists"` - Messages not persisting
- ❌ `"context from OCR analysis appears"` - OCR context banner missing
- ❌ `"file upload generates response during message processing"` - File processing broken
- ❌ `"context URL parameters are cleaned up"` - URL cleanup not working
- ❌ `"handles invalid context data gracefully"` - Error handling missing
- ❌ `"mobile responsiveness"` - Mobile content not found
- ❌ `"export conversation functionality"` - Export not working
- ❌ `"keyboard shortcuts work"` - Keyboard navigation broken
- ❌ `"accessibility compliance"` - A11y violations

### validation.spec.ts (2 failures)
- ❌ `"Form Persistence - Values survive page refresh"` - Range inputs timeout
- ❌ `"Split Ratio Calculation - Validates formula accuracy"` - Range inputs not found

## 🎯 Action Items for Red→Green Sweep

### Priority 1 (Immediate Fixes)
1. **Fix Split Ratio Calculator Component** - Range inputs not rendering
2. **Correct Route Paths** - Update /split-ratio to /tools/split-ratio
3. **Add Missing data-testid Attributes** - For stable selector targeting
4. **Fix OCR Context Flow** - Ensure context banners appear correctly

### Priority 2 (Stability Fixes)
5. **Seed Simulator RNG** - Make chromatogram generation deterministic
6. **Add Chart Render Completion Flags** - data-rendered attributes
7. **Fix Mobile Viewport Issues** - 390×844 responsive content
8. **Add Download Validation** - Real file download verification

### Priority 3 (Enhancement Fixes)
9. **Unique Page Titles** - Ensure h1 elements are unique per page
10. **A11y Improvements** - aria-labels for icon buttons
11. **Performance Optimizations** - Meet minimum thresholds
12. **CI/CD Integration** - Workflow validation and artifact upload

## 📁 Artifacts Available
- **Screenshots:** `test-results/results.json/*/*test-failed-*.png`
- **Videos:** `test-results/results.json/*/*video.webm`
- **Traces:** `test-results/results.json/*/*trace.zip`
- **Error Context:** `test-results/results.json/*/*error-context.md`

## 🎯 Target: Red→Green Success Criteria
- [ ] 96+ tests passing (≥95% pass rate)
- [ ] All OCR flows working (Sandbox + Troubleshooter context)
- [ ] Split Ratio Calculator fully functional
- [ ] Mobile viewport tests passing (390×844)
- [ ] Real download validation working
- [ ] Performance meets thresholds
- [ ] Zero console errors on critical paths
- [ ] CI/CD workflow operational

---
**Next Steps:** Begin systematic fixing starting with Priority 1 items