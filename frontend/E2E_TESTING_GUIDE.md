# E2E Testing Guide

## Overview

This project includes comprehensive End-to-End (E2E) testing using Playwright to verify the complete OCR Vision workflow, including:

- Image upload and analysis
- OCR caching behavior
- Deep linking between OCR → Sandbox → Troubleshooter
- Export functionality (PNG/CSV)
- Error handling and recovery
- Mobile responsiveness

## Test Structure

### Core Test Suites

1. **smoke.spec.ts** - Basic application health checks
   - Page loading verification
   - Navigation functionality
   - Console error monitoring
   - API health checks

2. **navigation.spec.ts** - Navigation and routing tests
   - Sidebar navigation
   - Deep links
   - Browser back/forward
   - Mobile navigation

3. **ocr-flows.spec.ts** - Complete OCR workflow testing
   - Image upload and analysis
   - Caching validation (prevents duplicate API calls)
   - Deep linking to Sandbox with OCR data
   - Deep linking to Troubleshooter with context
   - Export functionality (PNG/CSV)

4. **sandbox.spec.ts** - Sandbox environment testing
   - Demo dataset loading
   - OCR data integration from URL parameters
   - Export functionality
   - Reset functionality

5. **troubleshooter.spec.ts** - AI troubleshooting assistant
   - Message sending workflow
   - OCR context integration
   - Conversation history
   - Error handling

6. **split-ratio.spec.ts** - Calculator functionality
   - Form validation
   - Calculation workflow
   - API error handling
   - Results formatting

7. **simulator.spec.ts** - Chromatogram simulation
   - Simulation execution
   - Control interactions
   - Export functionality
   - Parameter adjustments

8. **exercise-all.spec.ts** - Complete workflow integration
   - End-to-end OCR → Sandbox → Troubleshooter flow
   - Calculator → Simulator integration
   - Error recovery testing
   - Performance under load

## Test Assets

The tests use synthetic test assets located in `tests/assets/`:

- **ocr-sample.png** - Test chromatogram image for OCR analysis
- **mdl-sample.csv** - Sample CSV data for import testing

## Test Monitoring

### Console Error Monitoring
- Automatically captures and filters console errors
- Excludes common non-critical errors (404s, favicon, etc.)
- Fails tests on critical JavaScript errors

### Network Request Monitoring
- Tracks all API calls during test execution
- Validates caching behavior (OCR results cached by file hash)
- Monitors request/response patterns
- Detects network failures

### Performance Monitoring
- Measures page load times
- Tracks API response times
- Validates timeout behavior

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   npm run test:e2e:install  # Install Playwright browsers
   ```

2. **Start backend server:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

3. **Start frontend dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with debugger
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:smoke      # Smoke tests only
npm run test:e2e:ocr        # OCR workflow tests only
npm run test:e2e:navigation # Navigation tests only
npm run test:e2e:workflows  # Complete workflow tests

# View test report
npm run test:e2e:report
```

### Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Sequential execution** (workers: 1) to avoid conflicts
- **Auto-retry** on CI (2 retries)
- **Screenshots** on failure
- **Video recording** on failure
- **Trace collection** for debugging
- **Multiple output formats** (HTML, JSON, JUnit)

### Live Server Mode

The tests are designed to work with live backend and frontend servers:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Health checks verify services are running before tests start

## Key Test Scenarios

### OCR Caching Validation

```typescript
// Verifies same file doesn't trigger duplicate API calls
const monitor = new OCRCacheValidator(page);
await uploadFile('test.png');  // First upload
await uploadSameFile('test.png');  // Should load from cache
monitor.expectCacheHit();  // Validates no additional API call
```

### Deep Link Integration

```typescript
// Tests OCR → Sandbox workflow
await page.getByTestId('use-in-sandbox-btn').click();
await expect(page).toHaveURL(/\/sandbox\?ocr=/);
await expect(page.getByText('OCR Analysis Data Loaded')).toBeVisible();
```

### Error Recovery

```typescript
// Tests graceful handling of API failures
await mockAPIError('/api/chromatogram/analyze', 500);
await uploadFile('test.png');
await expect(page.getByText(/Error|failed/i)).toBeVisible();
// Application should remain stable and functional
```

## CI/CD Integration

The tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

CI configuration includes:
- Backend and frontend service startup
- Browser installation
- Parallel test execution
- Artifact collection (screenshots, videos, reports)
- Test result publishing

## Debugging Failed Tests

1. **View HTML report:**
   ```bash
   npm run test:e2e:report
   ```

2. **Run single test with debug:**
   ```bash
   npx playwright test ocr-flows.spec.ts --debug
   ```

3. **Check screenshots/videos:**
   Located in `test-results/` directory after test runs

4. **Use trace viewer:**
   ```bash
   npx playwright show-trace test-results/.../trace.zip
   ```

5. **Monitor network and console:**
   The `TestMonitor` helper class provides detailed monitoring:
   ```typescript
   const monitor = new TestMonitor(page);
   // ... run test ...
   monitor.printSummary();  // Debug output
   ```

## Best Practices

1. **Use data-testid attributes** for stable element selection
2. **Mock API responses** for predictable test behavior
3. **Wait for elements** with appropriate timeouts
4. **Clean up state** between tests
5. **Use page object patterns** for complex interactions
6. **Verify both positive and negative scenarios**
7. **Test error boundaries and recovery**
8. **Include mobile viewport testing**

## Known Limitations

1. **File upload testing** uses synthetic data due to browser security restrictions
2. **Chart interactions** are limited due to complex plotting library integration
3. **Performance tests** may vary based on system resources
4. **Network timing** can affect cache validation in fast environments

## Troubleshooting

### Common Issues

1. **"Services not ready"** - Ensure backend/frontend are running and health checks pass
2. **"Timeout waiting for element"** - Check for JavaScript errors or slow API responses
3. **"Cache validation failed"** - Clear browser cache and restart servers
4. **"Port already in use"** - Stop existing services or change port configuration

### Debug Commands

```bash
# Check service health manually
curl http://localhost:8000/api/health
curl http://localhost:5173

# Run single test with maximum debugging
npx playwright test smoke.spec.ts --headed --debug --timeout=0

# Generate fresh test assets
npm run test:assets:generate  # If this script exists
```

This comprehensive E2E testing setup ensures the IntelliLab GC application works reliably across the complete user workflow, from OCR analysis through Sandbox exploration to AI-powered troubleshooting.