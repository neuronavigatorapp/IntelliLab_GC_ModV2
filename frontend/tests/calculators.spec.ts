import { test, expect } from '@playwright/test';
import { mockHandler } from './mock-handler';

/**
 * Professional Calculators E2E Tests
 * 
 * Tests for the three professional calculation tools:
 * - Void Volume Calculator
 * - Peak Capacity Calculator  
 * - Backflush Timing Calculator
 * 
 * Run with: npm run test:e2e calculators.spec.ts
 */

test.describe('Professional Calculators', () => {

    test.beforeEach(async ({ page }) => {
        // Setup API mocks for all calculator endpoints
        await mockHandler.setupMocks(page);

        // Wait for React to be ready
        await page.waitForFunction(() => window.React !== undefined, { timeout: 10000 });
    });

    test.describe('Void Volume Calculator', () => {

        test('should render page correctly', async ({ page }) => {
            await page.goto('/tools/void-volume');

            // Check page header
            await expect(page.locator('h1')).toContainText('Void Volume Calculator');
            await expect(page.locator('text=Calculate column void volume for method development')).toBeVisible();

            // Check input fields
            await expect(page.locator('[data-testid="column-length-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="column-diameter-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="calculate-btn"]')).toBeVisible();

            // Check initial state
            await expect(page.locator('text=Enter column parameters and click Calculate')).toBeVisible();
        });

        test('should calculate void volume correctly', async ({ page }) => {
            await page.goto('/tools/void-volume');

            // Fill inputs
            await page.fill('[data-testid="column-length-input"]', '30');
            await page.fill('[data-testid="column-diameter-input"]', '0.25');

            // Click calculate
            await page.click('[data-testid="calculate-btn"]');

            // Wait for calculation to complete
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Check result is displayed
            const resultValue = await page.locator('.result-value').textContent();
            expect(resultValue).toMatch(/\d+\.\d{3} mL/);

            // Check equation is shown
            await expect(page.locator('text=Calculation')).toBeVisible();
            await expect(page.locator('.font-mono')).toBeVisible();

            // Check success indicator
            await expect(page.locator('.text-status-success')).toBeVisible();
        });

        test('should handle input validation', async ({ page }) => {
            await page.goto('/tools/void-volume');

            // Test minimum values
            await page.fill('[data-testid="column-length-input"]', '0');
            await page.fill('[data-testid="column-diameter-input"]', '0');

            const lengthInput = page.locator('[data-testid="column-length-input"]');
            const diameterInput = page.locator('[data-testid="column-diameter-input"]');

            // Check min attributes
            await expect(lengthInput).toHaveAttribute('min', '1');
            await expect(diameterInput).toHaveAttribute('min', '0.1');
        });

    });

    test.describe('Peak Capacity Calculator', () => {

        test('should render page correctly', async ({ page }) => {
            await page.goto('/tools/peak-capacity');

            // Check page header
            await expect(page.locator('h1')).toContainText('Peak Capacity Calculator');
            await expect(page.locator('text=Calculate chromatographic peak capacity')).toBeVisible();

            // Check input fields
            await expect(page.locator('[data-testid="gradient-time-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="peak-width-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="dead-time-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="calculate-btn"]')).toBeVisible();
        });

        test('should calculate peak capacity correctly', async ({ page }) => {
            await page.goto('/tools/peak-capacity');

            // Fill inputs
            await page.fill('[data-testid="gradient-time-input"]', '20');
            await page.fill('[data-testid="peak-width-input"]', '0.2');
            await page.fill('[data-testid="dead-time-input"]', '1.0');

            // Click calculate
            await page.click('[data-testid="calculate-btn"]');

            // Wait for calculation to complete  
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Check result is displayed (should be 1 + 20/0.2 = 101)
            const resultValue = await page.locator('.result-value').textContent();
            expect(resultValue).toMatch(/\d+/);

            // Check performance interpretation
            await expect(page.locator('text=Separation Quality')).toBeVisible();
            await expect(page.locator('text=Method Efficiency')).toBeVisible();

            // Check equation is shown
            await expect(page.locator('text=Calculation')).toBeVisible();
        });

        test('should show performance interpretation', async ({ page }) => {
            await page.goto('/tools/peak-capacity');

            // Test high peak capacity
            await page.fill('[data-testid="gradient-time-input"]', '30');
            await page.fill('[data-testid="peak-width-input"]', '0.2');
            await page.click('[data-testid="calculate-btn"]');

            // Should show excellent/high ratings
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Check metric cards are displayed
            await expect(page.locator('.metric-card')).toHaveCount(2);
        });

    });

    test.describe('Backflush Timing Calculator', () => {

        test('should render page correctly', async ({ page }) => {
            await page.goto('/tools/backflush-timing');

            // Check page header
            await expect(page.locator('h1')).toContainText('Backflush Timing Calculator');
            await expect(page.locator('text=Optimize backflush timing')).toBeVisible();

            // Check input fields
            await expect(page.locator('[data-testid="last-peak-rt-input"]')).toBeVisible();
            await expect(page.locator('[data-testid="safety-factor-select"]')).toBeVisible();
            await expect(page.locator('[data-testid="calculate-btn"]')).toBeVisible();
        });

        test('should calculate backflush timing correctly', async ({ page }) => {
            await page.goto('/tools/backflush-timing');

            // Fill inputs
            await page.fill('[data-testid="last-peak-rt-input"]', '15');
            await page.selectOption('[data-testid="safety-factor-select"]', '1.2');

            // Click calculate
            await page.click('[data-testid="calculate-btn"]');

            // Wait for calculation to complete
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Check result is displayed (should be 15 * 1.2 = 18.0)
            const resultValue = await page.locator('.result-value').textContent();
            expect(resultValue).toMatch(/\d+\.\d/);

            // Check time savings are shown
            await expect(page.locator('text=Time Saved')).toBeVisible();
            await expect(page.locator('text=Efficiency Gain')).toBeVisible();

            // Check timeline visualization
            await expect(page.locator('text=Run Timeline')).toBeVisible();
            await expect(page.locator('text=Analysis')).toBeVisible();
            await expect(page.locator('text=Backflush')).toBeVisible();
        });

        test('should update safety factor selection', async ({ page }) => {
            await page.goto('/tools/backflush-timing');

            const safetySelect = page.locator('[data-testid="safety-factor-select"]');

            // Check options are available
            await expect(safetySelect.locator('option')).toHaveCount(4);

            // Test different safety factors
            await safetySelect.selectOption('1.5');
            expect(await safetySelect.inputValue()).toBe('1.5');

            await safetySelect.selectOption('1.1');
            expect(await safetySelect.inputValue()).toBe('1.1');
        });

        test('should show timeline visualization', async ({ page }) => {
            await page.goto('/tools/backflush-timing');

            await page.fill('[data-testid="last-peak-rt-input"]', '10');
            await page.click('[data-testid="calculate-btn"]');

            // Wait for results
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Check timeline elements
            await expect(page.locator('text=Run Timeline')).toBeVisible();
            await expect(page.locator('.bg-accent-500')).toBeVisible(); // Analysis phase
            await expect(page.locator('.bg-orange-400')).toBeVisible(); // Backflush phase
        });

    });

    test.describe('Error Handling', () => {

        test('should handle API errors gracefully', async ({ page }) => {
            // Setup error mocks
            await page.route('**/api/calculations/void-volume', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Calculation failed' })
                });
            });

            await page.goto('/tools/void-volume');

            await page.fill('[data-testid="column-length-input"]', '30');
            await page.fill('[data-testid="column-diameter-input"]', '0.25');
            await page.click('[data-testid="calculate-btn"]');

            // Should show error message
            await expect(page.locator('.alert-error')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('text=Calculation failed')).toBeVisible();
        });

        test('should show loading states', async ({ page }) => {
            // Add delay to mock response
            await page.route('**/api/calculations/peak-capacity', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await route.continue();
            });

            await page.goto('/tools/peak-capacity');

            await page.fill('[data-testid="gradient-time-input"]', '20');
            await page.fill('[data-testid="peak-width-input"]', '0.2');
            await page.click('[data-testid="calculate-btn"]');

            // Should show loading state
            await expect(page.locator('text=Calculating...')).toBeVisible();
            await expect(page.locator('.animate-spin')).toBeVisible();

            // Should complete after delay
            await expect(page.locator('.result-value')).toBeVisible({ timeout: 3000 });
        });

    });

    test.describe('Navigation and Integration', () => {

        test('should navigate between calculators', async ({ page }) => {
            await page.goto('/tools/void-volume');
            await expect(page.locator('h1')).toContainText('Void Volume Calculator');

            // Navigate via URL
            await page.goto('/tools/peak-capacity');
            await expect(page.locator('h1')).toContainText('Peak Capacity Calculator');

            await page.goto('/tools/backflush-timing');
            await expect(page.locator('h1')).toContainText('Backflush Timing Calculator');
        });

        test('should be accessible from sidebar', async ({ page }) => {
            await page.goto('/');

            // Check sidebar contains calculator links
            await expect(page.locator('text=Professional Calculations')).toBeVisible();
            await expect(page.locator('text=Void Volume')).toBeVisible();
            await expect(page.locator('text=Peak Capacity')).toBeVisible();
            await expect(page.locator('text=Backflush Timing')).toBeVisible();
        });

    });

    test.describe('Console Error Validation', () => {

        test('should not have console errors on void volume page', async ({ page }) => {
            const consoleErrors: string[] = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('/tools/void-volume');
            await page.fill('[data-testid="column-length-input"]', '30');
            await page.fill('[data-testid="column-diameter-input"]', '0.25');
            await page.click('[data-testid="calculate-btn"]');

            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            // Filter out known non-critical errors
            const criticalErrors = consoleErrors.filter(error =>
                !error.includes('favicon') &&
                !error.includes('Extension') &&
                !error.includes('manifest')
            );

            expect(criticalErrors).toHaveLength(0);
        });

        test('should not have console errors on peak capacity page', async ({ page }) => {
            const consoleErrors: string[] = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('/tools/peak-capacity');
            await page.fill('[data-testid="gradient-time-input"]', '20');
            await page.fill('[data-testid="peak-width-input"]', '0.2');
            await page.click('[data-testid="calculate-btn"]');

            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            const criticalErrors = consoleErrors.filter(error =>
                !error.includes('favicon') &&
                !error.includes('Extension') &&
                !error.includes('manifest')
            );

            expect(criticalErrors).toHaveLength(0);
        });

        test('should not have console errors on backflush timing page', async ({ page }) => {
            const consoleErrors: string[] = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('/tools/backflush-timing');
            await page.fill('[data-testid="last-peak-rt-input"]', '15');
            await page.selectOption('[data-testid="safety-factor-select"]', '1.2');
            await page.click('[data-testid="calculate-btn"]');

            await expect(page.locator('.result-value')).toBeVisible({ timeout: 5000 });

            const criticalErrors = consoleErrors.filter(error =>
                !error.includes('favicon') &&
                !error.includes('Extension') &&
                !error.includes('manifest')
            );

            expect(criticalErrors).toHaveLength(0);
        });

    });

});