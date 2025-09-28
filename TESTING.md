# IntelliLab GC Testing Infrastructure Documentation

## 🧪 Complete Testing Architecture

This document details our comprehensive, production-grade testing infrastructure that validates the IntelliLab GC platform across multiple dimensions.

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Layers](#testing-layers)
3. [Test Suites Overview](#test-suites-overview)
4. [VS Code Integration](#vs-code-integration)
5. [CI/CD Integration](#cicd-integration)
6. [Writing New Tests](#writing-new-tests)
7. [Troubleshooting](#troubleshooting)

## 🎯 Testing Philosophy

Our testing strategy follows a **multi-layered validation approach**:

1. **Visual Regression** - Protect against unintended UI changes
2. **Accessibility** - Ensure WCAG 2.1 AA compliance for all users  
3. **Performance** - Maintain fast, efficient user experience
4. **Real API Integration** - Validate end-to-end functionality with live backend
5. **Contract Validation** - Ensure API consistency with OpenAPI schemas

## 🏗️ Testing Layers

### Layer 1: Visual Regression Testing
**Purpose**: Detect unintended visual changes in UI components
**Technology**: Playwright with screenshot comparison
**Location**: `frontend/tests/visual.spec.ts`

```typescript
// Example visual test
test('Home Page - Visual Baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-react-app-mounted]');
  await expect(page).toHaveScreenshot('home-page.png');
});
```

**Baselines**: Stored in `frontend/tests/visual.spec.ts-snapshots/`
- `home-page.png` - Landing page layout
- `ocr-results.png` - Analysis results display
- `sandbox-chart.png` - Data visualization
- `split-ratio-results.png` - Calculator outputs

### Layer 2: Accessibility Testing
**Purpose**: Ensure WCAG 2.1 AA compliance for inclusive user experience
**Technology**: @axe-core/playwright
**Location**: `frontend/tests/a11y.spec.ts`

```typescript
// Example accessibility test
test('Home Page - Accessibility Check', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Test Coverage**:
- Home page navigation
- OCR analysis workflow
- Split ratio calculator
- Chromatogram simulator
- Keyboard navigation patterns

**Disabled Rules** (MVP-appropriate):
- `meta-viewport` - Common in dev environments
- `color-contrast` - May conflict with design requirements
- `select-name` - Can be addressed in UI refinement

### Layer 3: Performance Testing
**Purpose**: Monitor bundle size, load times, and resource usage
**Technology**: Playwright with performance APIs
**Location**: `frontend/tests/performance.spec.ts`

```typescript
// Example performance test
test('Page Load Performance - Home Page', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForSelector('[data-react-app-mounted]');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.maxLoadComplete);
});
```

**Performance Thresholds**:
- Bundle Size: < 500KB main bundle, < 2MB total
- Page Load: < 3s DOM ready, < 5s full load
- Memory Usage: < 60MB heap, < 70MB JS heap (React + Plotly)
- Render Time: < 100ms for interactions

### Layer 4: Real API Integration Testing
**Purpose**: Validate end-to-end functionality with live backend services
**Technology**: Playwright with real HTTP requests
**Location**: `frontend/tests/real/smoke-real.spec.ts`

```typescript
// Example real API test
test('OCR Analysis - POST /api/chromatogram/analyze', async ({ request }) => {
  const response = await request.post('/api/chromatogram/analyze', {
    multipart: { image: { buffer: imageBuffer, mimeType: 'image/png' } }
  });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.analysis).toHaveProperty('peaks');
});
```

**API Test Coverage**:
- Health endpoints (`GET /api/health`)
- Split ratio calculations (`POST /api/split-ratio/calculate`)
- OCR analysis pipeline (`POST /api/chromatogram/analyze`)
- Chromatogram simulation (`POST /api/chromatogram/simulate`)
- Frontend-backend integration flows

### Layer 5: Contract Validation
**Purpose**: Ensure API consistency and schema compliance
**Technology**: OpenAPI schema validation
**Location**: `frontend/tests/contracts/openapi.json`

```bash
# Fetch current API schema
npm run contracts:fetch
# Validates schema size and structure
```

## 🧪 Test Suites Overview

### Quick Reference
| Command | Suite | Purpose | Duration |
|---------|-------|---------|----------|
| `npm run test:visual` | 🎭 Visual | UI regression | ~30s |
| `npm run test:a11y` | ♿ Accessibility | WCAG compliance | ~15s |
| `npm run test:performance` | ⚡ Performance | Load/memory | ~60s |
| `npm run test:e2e:real` | 🌐 Real API | E2E validation | ~20s |
| `npm run test:guards` | 🔥 Quality Gates | All combined | ~2min |
| `npm run test:ci` | 🚀 CI Simulation | Full pipeline | ~3min |

### Test Configuration Files

#### Playwright Configuration
**File**: `frontend/playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // ... health checks, projects, etc.
});
```

#### Test Environment Setup
**File**: `frontend/tests/test-fixtures.ts`
```typescript
// Shared test utilities
export const mockPage = {
  setupApiMocks: async (page) => { /* ... */ },
  waitForReactApp: async (page) => { /* ... */ },
};
```

## 🔧 VS Code Integration

### Testing Panel Integration
Our VS Code configuration enables seamless testing through the Testing panel:

1. **Install Playwright Extension** (auto-recommended)
2. **Open Testing Panel** (`Ctrl+Shift+E` → Testing tab)
3. **Run/Debug Individual Tests** with gutter buttons
4. **View Results Inline** with error details

### Task Integration
**File**: `.vscode/tasks.json`

Access via `Ctrl+Shift+P` → "Tasks: Run Task":
- 🧪 Run All Tests
- 🎭 Visual Tests
- ♿ Accessibility Tests  
- ⚡ Performance Tests
- 🌐 Real API Tests
- 🔥 Quality Gates

### Debug Configuration
**File**: `.vscode/launch.json`

Available debug configurations:
- **Debug Playwright Tests** - Step through test execution
- **Debug Current Test File** - Focus on specific test file
- **Run Real API Tests** - E2E debugging with headed browser
- **Debug Backend API** - Backend service debugging

### Workspace Configuration
**File**: `intellilab-gc.code-workspace`

Multi-folder workspace with organized structure:
- 🚀 Root - Project overview
- 🎭 Frontend - React application
- 🐍 Backend - FastAPI service
- 🧪 Tests - Test suites focus

## 🚀 CI/CD Integration

### GitHub Actions Workflows

#### Comprehensive Testing Pipeline
**File**: `.github/workflows/comprehensive-testing.yml`

**Triggered by**: Push to main/develop, Pull Requests, Manual dispatch

**Job Flow**:
1. **Services Health** - Validate backend/frontend connectivity
2. **Contract Validation** - Fetch and validate OpenAPI schema  
3. **Visual Regression** - Screenshot comparison testing
4. **Accessibility Testing** - WCAG 2.1 AA compliance
5. **Performance Testing** - Bundle size and load time validation
6. **Real API Testing** - End-to-end functionality validation
7. **Quality Gates** - Combined test execution
8. **Test Summary** - Results aggregation and reporting

#### Workflow Dispatch Options
Manual trigger with test suite selection:
- `all` - Full testing pipeline (default)
- `visual` - Visual regression only
- `a11y` - Accessibility testing only
- `performance` - Performance testing only
- `real-api` - Real API tests only
- `guards` - Quality gates only

### Artifact Collection
Each workflow produces downloadable artifacts:
- **OpenAPI Contracts** - Schema validation results
- **Visual Test Results** - Screenshots and comparisons
- **Accessibility Reports** - WCAG violation details
- **Performance Metrics** - Bundle sizes and timing data
- **API Test Results** - Endpoint validation results
- **Final Test Report** - Comprehensive Markdown summary

## ✍️ Writing New Tests

### Adding Visual Regression Tests
1. **Create test scenario** in `frontend/tests/visual.spec.ts`
2. **Run test to generate baseline**: `npm run test:visual`
3. **Review generated screenshot** in snapshots folder
4. **Commit baseline image** to version control

```typescript
test('New Feature - Visual Baseline', async ({ page }) => {
  await mockPage.setupApiMocks(page);
  await page.goto('/new-feature');
  await page.waitForSelector('[data-feature-ready]');
  await expect(page).toHaveScreenshot('new-feature.png');
});
```

### Adding Accessibility Tests
1. **Add test case** to `frontend/tests/a11y.spec.ts`
2. **Configure specific rules** if needed
3. **Test across different interaction patterns**

```typescript
test('New Feature - Accessibility Check', async ({ page }) => {
  await page.goto('/new-feature');
  await page.waitForSelector('[data-feature-ready]');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules(['color-contrast']) // If needed
    .analyze();
    
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Adding Performance Tests
1. **Add test case** to `frontend/tests/performance.spec.ts`
2. **Define performance thresholds**
3. **Monitor specific metrics**

```typescript
test('New Feature - Performance Check', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/new-feature');
  await page.waitForSelector('[data-feature-ready]');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3s threshold
  
  // Memory usage check
  const metrics = await page.evaluate(() => performance.memory);
  expect(metrics.usedJSHeapSize).toBeLessThan(60 * 1024 * 1024); // 60MB
});
```

### Adding Real API Tests
1. **Create test scenario** in `frontend/tests/real/smoke-real.spec.ts`
2. **Use real HTTP requests** via Playwright request context
3. **Validate response schemas**

```typescript
test('New API Endpoint - POST /api/new-feature', async ({ request }) => {
  const response = await request.post('/api/new-feature', {
    data: { /* test payload */ }
  });
  
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result).toHaveProperty('expectedField');
});
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Visual Test Failures
**Issue**: Screenshots don't match baseline
**Solutions**:
1. **Review visual diff** in test results
2. **Update baseline** if change is intentional: `npm run test:visual -- --update-snapshots`
3. **Check for timing issues** - ensure page fully loads
4. **Verify test environment consistency**

#### Accessibility Test Failures
**Issue**: WCAG violations detected
**Solutions**:
1. **Review violation details** in test output
2. **Fix accessibility issues** in component code
3. **Disable specific rules** if not applicable to MVP
4. **Add explicit accessibility attributes** (aria-labels, roles)

#### Performance Test Failures  
**Issue**: Performance thresholds exceeded
**Solutions**:
1. **Analyze bundle composition** - check for large dependencies
2. **Optimize images and assets** - compress and lazy load
3. **Review memory usage** - check for memory leaks
4. **Adjust thresholds** if realistic for application complexity

#### Real API Test Failures
**Issue**: API endpoints returning errors
**Solutions**:
1. **Check backend service status** - ensure it's running
2. **Verify API schema changes** - update test expectations
3. **Check request payload** - ensure correct data format
4. **Review backend logs** - identify server-side issues

#### CI/CD Pipeline Failures
**Issue**: Tests pass locally but fail in CI
**Solutions**:
1. **Check service startup timing** - add appropriate waits
2. **Verify environment variables** - ensure correct configuration
3. **Review artifact logs** - download and examine test outputs
4. **Test in similar environment** - use Docker for consistency

### Test Debugging Tips

#### Local Debugging
```bash
# Run tests in headed mode (see browser)
npm run test:visual -- --headed

# Run specific test file
npm run test:visual tests/visual.spec.ts

# Debug mode with browser devtools
npm run test:visual -- --debug

# Generate trace for analysis
npm run test:visual -- --trace on
```

#### VS Code Debugging
1. **Set breakpoints** in test files
2. **Use "Debug Playwright Tests" launch configuration**
3. **Step through test execution**
4. **Inspect page state** and network requests

#### CI Debugging
1. **Download test artifacts** from GitHub Actions
2. **Review playwright-report** folder
3. **Check trace files** for detailed execution steps  
4. **Compare screenshots** in visual regression failures

### Performance Monitoring

#### Bundle Analysis
```bash
# Analyze bundle composition
cd frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

#### Memory Profiling
```typescript
// Add to performance tests
const metrics = await page.evaluate(() => ({
  memory: performance.memory,
  navigation: performance.getEntriesByType('navigation')[0],
  resources: performance.getEntriesByType('resource').length
}));
console.log('Performance Metrics:', metrics);
```

## 📊 Metrics and Reporting

### Test Metrics Dashboard
Our CI/CD pipeline tracks:
- **Test Success Rate** - Percentage of passing tests over time
- **Visual Regression Frequency** - How often UI changes are detected  
- **Accessibility Compliance** - WCAG violation trends
- **Performance Trends** - Bundle size and load time evolution
- **API Reliability** - Real endpoint success rates

### Reporting Artifacts
Each test run generates:
- **HTML Reports** - Interactive Playwright reports
- **Visual Diffs** - Before/after screenshot comparisons
- **Performance Graphs** - Load time and memory usage charts
- **Accessibility Reports** - Detailed WCAG violation breakdowns
- **API Test Results** - Request/response validation details

## 🏆 Best Practices

### Test Organization
- **Group related tests** in describe blocks
- **Use descriptive test names** that explain the scenario
- **Keep tests focused** - one assertion per test when possible
- **Share common setup** through fixtures and utilities

### Maintenance
- **Review test failures promptly** - don't let them accumulate
- **Update baselines intentionally** - verify changes are expected
- **Monitor test execution time** - optimize slow tests
- **Keep dependencies updated** - especially Playwright and testing tools

### Team Collaboration
- **Document test changes** in pull request descriptions
- **Share debugging techniques** through team knowledge sharing
- **Establish test ownership** - assign responsibility for test maintenance
- **Regular test reviews** - ensure tests remain valuable and accurate

---

🎯 **This comprehensive testing infrastructure ensures production-ready quality** at every commit, providing confidence in deployments and protecting against regressions across multiple validation dimensions.