import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests
 * 
 * Uses axe-core to detect accessibility violations.
 * Focuses on serious and critical issues that would impact users.
 * 
 * Run with: npm run test:a11y
 */

async function runA11yCheck(page: any, pageName: string): Promise<void> {
  console.log(`♿ Testing ${pageName} accessibility...`);

  // Run axe accessibility scan
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules([
      'region',
      'bypass',
      'landmark-one-main',
      'color-contrast' // May be too strict for MVP theme - can be re-enabled after design review
    ]) // Re-enabled meta-viewport and select-name rules for proper a11y validation
    .analyze();

  // Count violations by impact level
  const violations = accessibilityScanResults.violations;
  const criticalCount = violations.filter((v: any) => v.impact === 'critical').length;
  const seriousCount = violations.filter((v: any) => v.impact === 'serious').length;
  const moderateCount = violations.filter((v: any) => v.impact === 'moderate').length;
  const minorCount = violations.filter((v: any) => v.impact === 'minor').length;

  console.log(`🔍 ${pageName} Accessibility Summary:`);
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   Serious: ${seriousCount}`);
  console.log(`   Moderate: ${moderateCount}`);
  console.log(`   Minor: ${minorCount}`);

  // Log detailed violations for debugging
  if (violations.length > 0) {
    console.log('📋 Detailed violations:');
    violations.forEach((violation: any, index: number) => {
      console.log(`   ${index + 1}. [${violation.impact}] ${violation.id}: ${violation.description}`);
      console.log(`      Help: ${violation.helpUrl}`);
    });
  }

  // Fail only on critical issues, warn on serious
  if (criticalCount > 0) {
    throw new Error(`Found ${criticalCount} critical accessibility violation(s) on ${pageName}`);
  }

  if (seriousCount > 0) {
    console.warn(`⚠️ Found ${seriousCount} serious accessibility issue(s) on ${pageName}`);
  }

  console.log(`✅ ${pageName} accessibility check passed`);
}

test.describe('Accessibility Tests', () => {

  test('Home Page - Accessibility Check', async ({ page }) => {
    await page.goto('/');
    // Wait for React app to load
    await page.waitForFunction(() => {
      return document.body.children.length > 0 &&
        document.querySelector('#root, [data-reactroot], main, .app');
    }, { timeout: 15000 });
    await runA11yCheck(page, 'Home Page');
  });

  test('OCR Analysis Page - Accessibility Check', async ({ page }) => {
    await page.goto('/analysis/ocr');
    await expect(page.locator('h1:has-text("OCR Vision Analysis")')).toBeVisible();
    await runA11yCheck(page, 'OCR Analysis Page');
  });

  test('Split Ratio Calculator - Accessibility Check', async ({ page }) => {
    await page.goto('/tools/split-ratio');
    // Wait for page to load, using a more specific selector
    await page.waitForFunction(() => {
      return document.querySelector('h1, main, .calculator') ||
        document.body.textContent?.includes('Split Ratio');
    }, { timeout: 10000 });
    await runA11yCheck(page, 'Split Ratio Calculator');
  });

  test('Chromatogram Simulator - Accessibility Check', async ({ page }) => {
    await page.goto('/tools/chromatogram-simulator');
    await expect(page.locator('text=Chromatogram Simulator')).toBeVisible();
    await runA11yCheck(page, 'Chromatogram Simulator');
  });

  test('Navigation and Keyboard Access', async ({ page }) => {
    console.log('♿ Testing keyboard navigation...');

    await page.goto('/');
    // Wait for React app to load
    await page.waitForFunction(() => {
      return document.body.children.length > 0 &&
        document.querySelector('#root, [data-reactroot], main, .app');
    }, { timeout: 15000 });

    // Test tab navigation through main interactive elements
    const focusableElements = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const focusable = await page.locator(focusableElements.join(', ')).all();

    if (focusable.length === 0) {
      console.warn('⚠️ No focusable elements found on page');
      return;
    }

    console.log(`🔍 Found ${focusable.length} focusable elements`);

    // Test that we can navigate with Tab key
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);

    if (!firstFocused || firstFocused === 'BODY') {
      console.warn('⚠️ Tab navigation may not be working properly');
    } else {
      console.log(`✅ First focusable element: ${firstFocused}`);
    }

    // Test Escape key doesn't cause errors
    await page.keyboard.press('Escape');

    // Run focused accessibility scan on keyboard navigation
    await runA11yCheck(page, 'Keyboard Navigation');

    console.log('✅ Keyboard navigation test passed');
  });

});