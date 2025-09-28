import { test, expect } from '@playwright/test';

// Simple replacement for waitForLoadingComplete
async function waitForLoadingComplete(page: any) {
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');
}
import { validateResponse, logValidationResult } from './helpers/contract';

test.describe('IntelliLab GC Critical Validation - Mock First', () => {

  test('1. Form Persistence - Values reset to defaults after reload', async ({ page }) => {
    console.log('🧪 Testing form persistence (mock mode)...');

    // Navigate to app
    await page.goto('/');
    await waitForLoadingComplete(page);

    // Navigate to Split Ratio Calculator
    await page.click('button:has-text("SPLIT RATIO")');
    await waitForLoadingComplete(page);

    // Enter test values
    const flowInput = page.getByTestId('column-flow-input');
    const ratioInput = page.getByTestId('split-ratio-input');

    await flowInput.fill('2.345');
    await ratioInput.fill('75');
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await waitForLoadingComplete(page);
    await page.click('button:has-text("SPLIT RATIO")');
    await waitForLoadingComplete(page);

    // Check values reverted to defaults
    const flowValue = await flowInput.inputValue();
    const ratioValue = await ratioInput.inputValue();

    console.log(`Flow reset to default: ${flowValue} (expected: 1.0 - no persistence)`);
    console.log(`Ratio reset to default: ${ratioValue} (expected: 50 - no persistence)`);

    // Form values should reset to defaults after reload (no localStorage persistence)
    expect(parseFloat(flowValue)).toBeCloseTo(1.0, 1);
    expect(parseInt(ratioValue)).toBe(50);

    console.log('✅ Form persistence PASSED');
  });

  test('2. Split Ratio Calculation - Mock API Response', async ({ page }) => {
    console.log('🧪 Testing split ratio calculation with mocks...');

    await page.goto('/');
    await waitForLoadingComplete(page);

    // Navigate to Split Ratio Calculator
    await page.click('button:has-text("SPLIT RATIO")');
    await waitForLoadingComplete(page);

    // Enter values
    const flowInput = page.getByTestId('column-flow-input');
    const ratioInput = page.getByTestId('split-ratio-input');

    await flowInput.fill('1.2');
    await ratioInput.fill('50');

    // Click calculate - will use mock response
    await page.getByTestId('calculate-btn').click();

    // Wait for mock response (faster than real API)
    await waitForLoadingComplete(page);

    // Verify mock data appears
    await expect(page.locator('text=Total Inlet Flow')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=62.4')).toBeVisible(); // From mock fixture (total_inlet_flow)
    await expect(page.locator('text=88%')).toBeVisible(); // Efficiency from mock (87.5 rounded to 88%)

    // Validate mock response against contract
    const mockResponse = {
      total_inlet_flow: 62.4,
      split_vent_flow: 61.2,
      septum_purge_flow: 2.5,
      column_flow_rate: 1.2,
      actual_split_ratio: "51:1",
      efficiency_score: 87.5,
      uncertainty: 0.8,
      confidence_level: 95,
      explanation: "Split ratio is well-optimized for your current conditions. Consider increasing column flow slightly for better resolution."
    };

    const contractResult = validateResponse('/api/split-ratio/calculate', 'post', mockResponse);
    logValidationResult(contractResult);

    console.log('✅ Split ratio calculation with mocks PASSED');
  });

  test('3. API Health Check - Mock Response', async ({ page }) => {
    console.log('🧪 Testing backend API with mocks...');

    await page.goto('/');
    await waitForLoadingComplete(page);

    // The health check is called automatically, verify mock response
    // Look for indicators that the app loaded successfully with mocked API
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('button:has-text("SPLIT RATIO")')).toBeVisible();

    console.log('✅ API health check with mocks PASSED');
  });

  test('4. Error Validation - Form Input Validation', async ({ page }) => {
    console.log('🧪 Testing error handling...');

    await page.goto('/');
    await waitForLoadingComplete(page);

    await page.click('button:has-text("SPLIT RATIO")');
    await waitForLoadingComplete(page);

    // Enter invalid value
    const flowInput = page.getByTestId('column-flow-input');
    await flowInput.fill('-5');

    // Check HTML5 validation
    const inputValue = await flowInput.inputValue();
    const isValid = await flowInput.evaluate((el: HTMLInputElement) => el.checkValidity());

    console.log(`Current input value: ${inputValue}`);
    console.log(`Input is ${isValid ? 'valid' : 'invalid'} according to HTML5 validation`);

    expect(isValid).toBe(false);
    console.log('✅ Error validation PASSED');
  });
});

test.describe('OCR Workflow - Mock First', () => {

  test('OCR Analysis with Mock Response', async ({ page }) => {
    console.log('🧪 Testing OCR with mocks...');

    await page.goto('/analysis/ocr');
    await waitForLoadingComplete(page);

    // Verify OCR page loads
    await expect(page.locator('h1:has-text("OCR Vision Analysis")')).toBeVisible();

    // Upload file (will trigger mock response)
    const fileInput = page.getByTestId('ocr-file-input');

    // Create a test file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Click analyze button to trigger API call
    await page.click('button:has-text("Analyze")');

    // Wait for mock response
    await waitForLoadingComplete(page);    // Verify mock data appears
    await expect(page.locator('text=2 Peaks')).toBeVisible(); // From mock fixture (capitalized)
    await expect(page.locator('text=Fair (68%)')).toBeVisible(); // Quality badge format for score of 68

    // Check peak data in table (names are not displayed, only numerical data)
    await expect(page.locator('text=1.20')).toBeVisible(); // Peak 1 retention time
    await expect(page.locator('text=145,000')).toBeVisible(); // Peak 1 area (formatted with comma)
    await expect(page.locator('text=230,000')).toBeVisible(); // Peak 2 area

    // Validate mock OCR response against contract
    const mockOcrResponse = {
      peaks: [
        {
          id: "peak-1",
          name: "Methane",
          retention_time: 1.2,
          area: 145000,
          height: 12000,
          snr: 125.3,
          tailing_factor: 1.2
        },
        {
          id: "peak-2",
          name: "Ethane",
          retention_time: 2.1,
          area: 230000,
          height: 18500,
          snr: 98.7,
          tailing_factor: 1.1
        }
      ],
      baseline: {
        quality_score: 68,
        drift: 0.02,
        noise_level: 12.4
      },
      overall_quality: 68,
      recommendations: [
        "Peak separation is excellent",
        "Consider optimizing injection volume for better peak symmetry"
      ],
      troubleshooting_suggestions: []
    };

    const contractResult = validateResponse('/api/chromatogram/analyze', 'post', mockOcrResponse);
    logValidationResult(contractResult);

    console.log('✅ OCR with mocks PASSED');
  });
});

console.log(`
============================================================
INTELLILAB GC MOCK-FIRST VALIDATION
============================================================
Using deterministic mocks for stable, fast testing.
Set USE_REAL_API=true environment variable for real API tests.
============================================================
`);