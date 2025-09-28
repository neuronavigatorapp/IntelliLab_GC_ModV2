import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for OCR Workflows
 * 
 * Tests the complete OCR → Sandbox and OCR → Troubleshooter workflows
 * including caching behavior and deep link integrations.
 */

// Test asset: 1x1 pixel PNG (base64 encoded)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

test.describe('OCR Workflow Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Monitor network requests
    await page.route('/api/chromatogram/analyze', async (route) => {
      // Mock successful OCR response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peaks: [
            {
              id: 'peak-1',
              name: 'Test Peak 1',
              retention_time: 2.45,
              area: 125432,
              height: 8432,
              snr: 12.5,
              tailing_factor: 1.2
            },
            {
              id: 'peak-2',
              name: 'Test Peak 2',
              retention_time: 5.67,
              area: 234567,
              height: 15678,
              snr: 8.3,
              tailing_factor: 1.8
            }
          ],
          baseline: {
            quality_score: 85,
            drift: 0.2,
            noise_level: 50
          },
          overall_quality: 78,
          recommendations: [
            'Consider reducing injection temperature',
            'Check column conditioning'
          ],
          troubleshooting_suggestions: [
            'Peak tailing may indicate column degradation'
          ]
        })
      });
    });
  });

  test('OCR → Sandbox workflow with overlay and banner', async () => {
    // Visit OCR page
    await page.goto('/analysis/ocr');
    await page.waitForLoadState('networkidle');

    // Verify page loaded (be specific about which h1 to avoid strict mode violation)
    await expect(page.locator('h1:has-text("OCR Vision Analysis")')).toBeVisible();

    // Upload test image
    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Wait for preview
    await expect(page.locator('img[alt="Chromatogram preview"]')).toBeVisible();

    // Click analyze
    const analyzeButton = page.locator('button', { hasText: 'Analyze' });
    await analyzeButton.click();

    // Wait for results
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Verify TIC chart is displayed
    await expect(page.locator('[data-testid="tic-chart-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="tic-chart-svg"]')).toBeVisible();
    await expect(page.locator('text=Total Ion Chromatogram')).toBeVisible();

    // Verify peaks table
    await expect(page.locator('[data-testid="ocr-peaks-table"]')).toBeVisible();
    await expect(page.locator('td:has-text("2.45")')).toBeVisible(); // RT
    await expect(page.locator('td:has-text("125,432")')).toBeVisible(); // Area

    // Click "Use in Sandbox"
    const sandboxButton = page.locator('button', { hasText: 'Use in Sandbox' });
    await sandboxButton.click();

    // Should navigate to sandbox with parameters
    await expect(page).toHaveURL(/\/sandbox\?/);

    // Wait for sandbox to load
    await page.waitForLoadState('networkidle');

    // Verify OCR banner is present 
    await expect(page.locator('text=Loaded from OCR Analysis')).toBeVisible();
    await expect(page.locator('text=Displaying 2 peaks')).toBeVisible();
    await expect(page.locator('text=Average S/N: 10.4')).toBeVisible();
    await expect(page.locator('text=Baseline quality: 85%')).toBeVisible();

    // Verify data is loaded (Data Loaded badge)
    await expect(page.locator('text=Data Loaded')).toBeVisible();
  });

  test('OCR → Troubleshooter workflow with context', async () => {
    // Visit OCR page
    await page.goto('/analysis/ocr');
    await page.waitForLoadState('networkidle');

    // Upload and analyze (same as above)
    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await expect(page.locator('img[alt="Chromatogram preview"]')).toBeVisible();

    const analyzeButton = page.locator('button', { hasText: 'Analyze' });
    await analyzeButton.click();

    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Click "Ask Troubleshooter"
    const troubleshooterButton = page.locator('button', { hasText: 'Ask Troubleshooter' });
    await troubleshooterButton.click();

    // Should navigate to troubleshooter with context
    await expect(page).toHaveURL(/\/troubleshooter\?/);
    await page.waitForLoadState('networkidle');

    // Verify context banner
    await expect(page.locator('text=OCR Analysis Context Loaded')).toBeVisible();
    await expect(page.locator('text=2 peaks')).toBeVisible();
    await expect(page.locator('text=78% overall quality')).toBeVisible();

    // Verify pre-seeded message with OCR analysis
    await expect(page.locator('text=Analysis Summary')).toBeVisible();
    await expect(page.locator('text=Overall Quality: 78%')).toBeVisible();
    await expect(page.locator('text=Peak Count: 2')).toBeVisible();
    await expect(page.locator('text=Average S/N Ratio: 10.4')).toBeVisible();
  });

  test('Image caching prevents duplicate API calls', async () => {
    let apiCallCount = 0;

    // Override route to count API calls
    await page.route('/api/chromatogram/analyze', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peaks: [{
            id: 'peak-1',
            retention_time: 3.21,
            area: 100000,
            height: 5000,
            snr: 10.0
          }],
          baseline: { quality_score: 90, drift: 0.1, noise_level: 20 },
          overall_quality: 85,
          recommendations: [],
          troubleshooting_suggestions: []
        })
      });
    });

    // Visit OCR page
    await page.goto('/analysis/ocr');
    await page.waitForLoadState('networkidle');

    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');

    // First upload and analysis
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    const analyzeButton = page.locator('button', { hasText: 'Analyze' });
    await analyzeButton.click();
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Verify first API call was made
    expect(apiCallCount).toBe(1);

    // Clear and upload same image again
    const clearButton = page.locator('button', { hasText: 'Clear' });
    await clearButton.click();

    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await analyzeButton.click();

    // Wait for cache message
    await expect(page.locator('text=Loaded from cache')).toBeVisible();

    // Verify no additional API call was made
    expect(apiCallCount).toBe(1);
  });

  test('Complete OCR workflow end-to-end', async () => {
    // Start at OCR page
    await page.goto('/analysis/ocr');

    // Upload and analyze
    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'complete-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.locator('button', { hasText: 'Analyze' }).click();
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Test CSV export
    const csvButton = page.locator('button', { hasText: 'Export CSV' });
    await expect(csvButton).toBeVisible();
    // Note: Actual download testing would require more complex setup

    // Test PNG export button (should be present even if disabled)
    const pngButton = page.locator('button', { hasText: 'Export PNG' });
    await expect(pngButton).toBeVisible();

    // Test Use in Sandbox
    await page.locator('button', { hasText: 'Use in Sandbox' }).click();
    await expect(page).toHaveURL(/\/sandbox/);
    await expect(page.locator('text=Loaded from OCR Analysis')).toBeVisible();

    // Navigate back and test Troubleshooter
    await page.goBack();
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    await page.locator('button', { hasText: 'Ask Troubleshooter' }).click();
    await expect(page).toHaveURL(/\/troubleshooter/);
    await expect(page.locator('text=OCR Analysis Context Loaded')).toBeVisible();
  });

  test('TIC chart display and PNG export functionality', async () => {
    // Visit OCR page and complete analysis
    await page.goto('/analysis/ocr');
    await page.waitForLoadState('networkidle');

    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'tic-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.locator('button', { hasText: 'Analyze' }).click();
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Verify TIC chart components are present
    await expect(page.locator('text=Total Ion Chromatogram')).toBeVisible();
    await expect(page.locator('[data-testid="tic-chart-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="tic-chart-svg"]')).toBeVisible();

    // Check that the SVG contains expected elements
    const ticSvg = page.locator('[data-testid="tic-chart-svg"]');
    await expect(ticSvg).toBeVisible();

    // Verify chart has axes labels
    await expect(page.locator('text=Retention Time (min)')).toBeVisible();
    await expect(page.locator('text=Signal Intensity')).toBeVisible();

    // Verify peak markers are present (peaks should be drawn as circles)
    const peakMarkers = ticSvg.locator('circle[fill="#ef4444"]');
    await expect(peakMarkers).toHaveCount(2); // Two test peaks

    // Test PNG export button functionality
    const pngButton = page.locator('[data-testid="export-png-btn"]');
    await expect(pngButton).toBeVisible();
    await expect(pngButton).toBeEnabled();

    // Click export button (won't actually download in test, but verifies it doesn't error)
    await pngButton.click();

    // Wait briefly to ensure no errors occurred
    await page.waitForTimeout(500);

    // Verify page is still functional after export attempt
    await expect(page.locator('text=Total Ion Chromatogram')).toBeVisible();
  });

  test('TIC chart visual elements and interactivity', async () => {
    // Complete OCR analysis setup
    await page.goto('/analysis/ocr');

    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'visual-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.locator('button', { hasText: 'Analyze' }).click();
    await expect(page.locator('text=Analysis completed successfully')).toBeVisible();

    // Verify TIC chart visual elements
    const ticContainer = page.locator('[data-testid="tic-chart-container"]');
    await expect(ticContainer).toBeVisible();

    const ticSvg = page.locator('[data-testid="tic-chart-svg"]');
    await expect(ticSvg).toBeVisible();

    // Check that the SVG has the correct viewBox
    await expect(ticSvg).toHaveAttribute('viewBox', '0 0 400 200');

    // Verify gradient definition is present
    const gradient = ticSvg.locator('#ticGradient');
    await expect(gradient).toBeVisible();

    // Verify grid pattern is present  
    const gridPattern = ticSvg.locator('#grid');
    await expect(gridPattern).toBeVisible();

    // Check axes are drawn
    const axes = ticSvg.locator('line[stroke="#374151"]');
    await expect(axes).toHaveCount(2); // X and Y axes

    // Verify retention time labels are present on peaks
    await expect(ticSvg.locator('text:has-text("2.5")')).toBeVisible(); // Peak 1 RT label (rounded)
    await expect(ticSvg.locator('text:has-text("5.7")')).toBeVisible(); // Peak 2 RT label (rounded)

    // Check that the TIC trace path is present
    const tracePath = ticSvg.locator('path[stroke="#3b82f6"]');
    await expect(tracePath).toBeVisible();

    // Verify fill area under curve
    const fillPath = ticSvg.locator('path[fill="url(#ticGradient)"]');
    await expect(fillPath).toBeVisible();
  });
});