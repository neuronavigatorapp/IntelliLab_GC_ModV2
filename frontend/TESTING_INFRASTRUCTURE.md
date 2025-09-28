# Testing Infrastructure Guide

This document outlines the comprehensive testing infrastructure for IntelliLab GC, including mock-first testing, real API validation, contract verification, visual regression, accessibility checks, and performance monitoring.

## Overview

Our testing strategy follows a **mock-first approach** while providing **real API validation lanes** for comprehensive coverage:

```
Mock Tests (Default) ──┐
                      ├─→ Contract Validation ──→ Quality Gates
Real API Tests ───────┘
```

## Test Categories

### 1. Mock-First Testing (Default)
- **Location**: `tests/*.spec.ts`
- **Purpose**: Fast, reliable unit and integration tests using mock data
- **Run**: `npm run test:e2e`
- **Coverage**: 100% pass rate achieved for core workflows

### 2. Real API Testing
- **Location**: `tests/real/smoke-real.spec.ts`
- **Purpose**: Validate actual backend integration
- **Run**: `npm run test:e2e:real`
- **Prerequisites**: Backend running on `localhost:8000`

### 3. Contract Validation
- **Location**: `tests/helpers/contract.ts`
- **Purpose**: Ensure API responses match OpenAPI schema
- **Integration**: Automatically validates mock and real API responses
- **Schema Source**: Fetched from `/api/openapi.json`

### 4. Visual Regression Testing
- **Location**: `tests/visual.spec.ts`
- **Purpose**: Prevent UI regressions through screenshot comparison
- **Run**: `npm run test:visual`
- **Update Baselines**: `npm run test:visual:update`

### 5. Accessibility Testing
- **Location**: `tests/a11y.spec.ts`
- **Purpose**: WCAG 2.1 AA compliance checking
- **Run**: `npm run test:a11y`
- **Coverage**: Critical/serious violations cause failures

### 6. Performance Guards
- **Location**: `tests/performance.spec.ts`
- **Purpose**: Monitor bundle sizes, load times, runtime performance
- **Run**: `npm run test:performance`
- **Thresholds**: Configurable performance budgets

## Quick Start

### Running Tests

```bash
# Mock-first tests (default)
npm run test:e2e

# Real API validation (requires backend)
npm run test:e2e:real

# Quality gates (visual + a11y + performance)
npm run test:guards

# All tests combined
npm run test:all
```

### Mock Data Management

```bash
# Refresh all mock fixtures from real API
npm run mocks:refresh

# Preview changes without writing files
npm run mocks:refresh:dry

# Refresh specific endpoint
npm run mocks:refresh:health

# Fetch latest OpenAPI schema
npm run contracts:fetch
```

## Test Structure

### Real API Smoke Tests

The real API tests validate core functionality against a live backend:

```typescript
// tests/real/smoke-real.spec.ts
test.describe('Real API Integration', () => {
  test('Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
```

**Endpoints Tested:**
- Health check (`/api/health`)
- Split ratio calculation (`/api/split-ratio`)
- OCR analysis (`/api/ocr/analyze`)
- Chromatogram generation (`/api/chromatogram/generate`)
- Integration workflows

### Contract Validation

Automatic schema validation using Ajv:

```typescript
// Integrated into all API tests
const contractValidator = new ContractValidator();
await contractValidator.validateResponse(response, '/api/health', 'get', 200);
```

### Visual Regression

Screenshot-based UI stability testing:

```typescript
// tests/visual.spec.ts
test('Home Page Visual Regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home-page.png');
});
```

**Coverage:**
- Home page layout
- OCR results display
- Sandbox chart rendering
- Split ratio calculator

### Accessibility Testing

WCAG compliance using axe-core:

```typescript
// tests/a11y.spec.ts
test('Home Page Accessibility', async ({ page }) => {
  await page.goto('/');
  const violations = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(violations.violations).toHaveLength(0);
});
```

**Coverage:**
- Home page
- OCR analysis page
- Split ratio calculator
- Chromatogram simulator
- Keyboard navigation

### Performance Monitoring

Comprehensive performance guards:

```typescript
// tests/performance.spec.ts
test('Bundle Size Check', async () => {
  // Validates bundle sizes against thresholds
  expect(mainBundleSize).toBeLessThan(500 * 1024); // 500KB
});

test('Page Load Performance', async ({ page }) => {
  // Monitors Core Web Vitals
  expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
});
```

**Metrics:**
- Bundle size analysis
- Page load timing (LCP, FCP)
- Memory usage
- Runtime performance
- Network resource loading

## Mock Refresh Tool

The `scripts/refresh-mocks.mjs` tool synchronizes mock fixtures with real API data:

### Features
- **Data Sanitization**: Removes sensitive/dynamic data
- **Consistency**: Fixed timestamps and IDs for reproducible tests
- **Validation**: Checks API availability before refresh
- **Selective Updates**: Target specific endpoints
- **Dry Run Mode**: Preview changes without modification

### Configuration

```javascript
// scripts/refresh-mocks.mjs
const ENDPOINTS = {
  health: {
    url: '/api/health',
    fixture: 'health-response.json',
    sanitize: (data) => ({
      ...data,
      timestamp: '2024-01-15T10:00:00.000Z'
    })
  }
};
```

### Usage Examples

```bash
# Refresh all endpoints
npm run mocks:refresh

# Check what would change
npm run mocks:refresh:dry

# Update only health endpoint
npm run mocks:refresh -- --endpoint health

# Custom API URL
API_URL=http://staging:8000 npm run mocks:refresh
```

## Environment Configuration

### Environment Variables

```bash
# Real API testing
USE_REAL_API=1          # Enable real API mode
API_URL=http://localhost:8000  # Backend URL

# Visual testing
PLAYWRIGHT_HEADLESS=false     # Run with browser UI
PLAYWRIGHT_SLOW_MO=500       # Slow down for debugging

# Performance testing
PERF_BUNDLE_THRESHOLD=500000  # Bundle size limit (bytes)
PERF_LOAD_THRESHOLD=3000     # Page load limit (ms)
```

### Test Data

Mock fixtures are stored in `tests/fixtures/api/`:
- `health-response.json` - Health check data
- `split-ratio-response.json` - Split ratio calculation
- `ocr-analyze-response.json` - OCR analysis results
- `chromatogram-generate-response.json` - Generated chromatogram

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Testing Infrastructure
on: [push, pull_request]

jobs:
  test-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      # Mock-first tests (always run)
      - run: npm ci
      - run: npm run test:e2e
      
      # Contract validation
      - run: npm run contracts:fetch
      - run: npm run test:contracts
      
      # Quality gates
      - run: npm run test:guards
      
      # Real API tests (when backend available)
      - run: npm run test:e2e:real
        if: env.BACKEND_AVAILABLE == 'true'
```

### Quality Gates

Tests are organized into quality gates that can block deployments:

1. **Unit Tests**: `npm run test:run`
2. **Mock Integration**: `npm run test:e2e`
3. **Contract Validation**: `npm run test:contracts`
4. **Visual Regression**: `npm run test:visual`
5. **Accessibility**: `npm run test:a11y`
6. **Performance**: `npm run test:performance`
7. **Real API** (optional): `npm run test:e2e:real`

## Performance Thresholds

Current performance budgets:

```javascript
const THRESHOLDS = {
  bundleSize: {
    maxMainBundle: 500 * 1024,    // 500KB
    maxTotalAssets: 2 * 1024 * 1024, // 2MB
  },
  pageLoad: {
    maxLargestContentfulPaint: 2500, // 2.5s
    maxFirstContentfulPaint: 1500,   // 1.5s
  },
  runtime: {
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  }
};
```

## Troubleshooting

### Common Issues

**Real API tests failing**:
```bash
# Check backend status
curl http://localhost:8000/api/health

# Start backend if needed
npm run backend:start
```

**Visual tests failing**:
```bash
# Update baselines after UI changes
npm run test:visual:update

# Run in headed mode to debug
npm run test:visual -- --headed
```

**Contract validation errors**:
```bash
# Refresh OpenAPI schema
npm run contracts:fetch

# Check schema differences
git diff tests/contracts/openapi.json
```

**Mock data outdated**:
```bash
# Sync with latest API
npm run mocks:refresh

# Review changes
git diff tests/fixtures/
```

### Debug Mode

```bash
# Debug specific test
npx playwright test tests/real/smoke-real.spec.ts --debug

# Run with browser UI
npx playwright test --headed --slow-mo=1000

# Generate trace for analysis
npx playwright test --trace=on
```

## Best Practices

### Test Organization
- Keep mock tests fast and reliable
- Use real API tests for critical integration points
- Implement contract validation for all API interactions
- Maintain visual baselines after intentional UI changes
- Monitor performance regressions continuously

### Data Management
- Sanitize sensitive data in mock fixtures
- Use consistent timestamps and IDs
- Refresh mocks regularly from real API
- Version control all test fixtures

### Maintenance
- Update performance thresholds as application grows
- Review accessibility violations regularly
- Keep OpenAPI schema synchronized
- Monitor test execution times

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mock Tests    │    │  Contract        │    │  Quality Gates  │
│   (Fast/Stable) │───▶│  Validation      │───▶│  (V/A/P)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       ▲                       ▲
         │              ┌──────────────────┐              │
         └─────────────▶│  Mock Refresh    │──────────────┘
                        │  Tool            │
                        └──────────────────┘
                                 ▲
         ┌─────────────────┐     │
         │  Real API Tests │─────┘
         │  (Integration)  │
         └─────────────────┘
```

This infrastructure provides comprehensive test coverage while maintaining development velocity through smart defaults and automated quality gates.