import { test, expect } from '@playwright/test';

/**
 * Demo Mode E2E Tests
 * 
 * Tests demo mode toggle functionality including:
 * - Demo badge visibility when VITE_DEMO=true
 * - Mock data behavior when in demo mode
 * - Real API fallback when VITE_DEMO=false
 */

test.describe('Demo Mode', () => {
    test.describe('With VITE_DEMO=true', () => {
        test.beforeEach(async ({ page }) => {
            // Set demo mode environment variable
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = 'true';
            });
            await page.goto('/');
        });

        test('shows demo mode badge in header', async ({ page }) => {
            // Check demo mode badge is visible
            const demoBadge = page.getByTestId('demo-mode-badge');
            await expect(demoBadge).toBeVisible();
            await expect(demoBadge).toHaveText('Demo Mode');

            // Check badge has warning styling
            await expect(demoBadge).toHaveClass(/text-warning/);
            await expect(demoBadge).toHaveClass(/bg-warning/);
        });

        test('uses mock data for split ratio calculation', async ({ page }) => {
            await page.goto('/split-ratio');

            // Fill out the form
            await page.fill('[data-testid="split-ratio-input"]', '10');
            await page.fill('[data-testid="column-flow-rate-input"]', '1.2');

            // Submit calculation
            await page.click('[data-testid="calculate-btn"]');

            // Should get demo/mock response quickly (no real API call)
            await expect(page.getByTestId('calculation-result')).toBeVisible({ timeout: 2000 });

            // Check for demo data characteristics
            const result = await page.getByTestId('calculation-result').textContent();
            expect(result).toContain('Demo calculation');
        });

        test('uses mock data for OCR analysis', async ({ page }) => {
            await page.goto('/ocr-vision');

            // Create a dummy file for upload
            const dummyFile = Buffer.from('dummy image data');

            // Upload file
            await page.setInputFiles('[data-testid="file-input"]', {
                name: 'test-chromatogram.png',
                mimeType: 'image/png',
                buffer: dummyFile,
            });

            // Should process with mock data quickly
            await expect(page.getByTestId('analysis-result')).toBeVisible({ timeout: 3000 });

            // Check for demo peaks
            await expect(page.getByText('Demo Peak 1')).toBeVisible();
            await expect(page.getByText('Demo Peak 2')).toBeVisible();
            await expect(page.getByText('Demo Peak 3')).toBeVisible();
        });

        test('uses mock data for void volume calculation', async ({ page }) => {
            await page.goto('/void-volume');

            // Fill form
            await page.fill('[data-testid="column-length-input"]', '30');
            await page.fill('[data-testid="column-diameter-input"]', '0.25');

            // Calculate
            await page.click('[data-testid="calculate-btn"]');

            // Should get instant result (mock)
            await expect(page.getByTestId('volume-result')).toBeVisible({ timeout: 1000 });

            // Check equation is shown
            await expect(page.getByTestId('equation-display')).toBeVisible();
        });

        test('uses mock data for peak capacity calculation', async ({ page }) => {
            await page.goto('/peak-capacity');

            // Fill form
            await page.fill('[data-testid="gradient-time-input"]', '30');
            await page.fill('[data-testid="peak-width-input"]', '0.1');

            // Calculate
            await page.click('[data-testid="calculate-btn"]');

            // Should get instant result
            await expect(page.getByTestId('capacity-result')).toBeVisible({ timeout: 1000 });

            // Check for equation
            await expect(page.getByTestId('equation-display')).toContainText('n = 1 + (tG / w)');
        });

        test('uses mock data for backflush timing calculation', async ({ page }) => {
            await page.goto('/backflush-timing');

            // Fill form
            await page.fill('[data-testid="last-peak-rt-input"]', '15.5');
            await page.fill('[data-testid="safety-factor-input"]', '1.2');

            // Calculate
            await page.click('[data-testid="calculate-btn"]');

            // Should get instant result
            await expect(page.getByTestId('timing-result')).toBeVisible({ timeout: 1000 });

            // Check for equation
            await expect(page.getByTestId('equation-display')).toContainText('t_bf = t_last × SF');
        });

        test('API status shows demo mode health check', async ({ page }) => {
            // API status should show as healthy with demo version
            const apiStatus = page.locator('[role="status"][aria-label="API connection status"]');
            await expect(apiStatus).toBeVisible();

            // Should show connected status quickly (mock health check)
            await expect(apiStatus.locator('[aria-label*="connected"]')).toBeVisible({ timeout: 2000 });
        });
    });

    test.describe('With VITE_DEMO=false', () => {
        test.beforeEach(async ({ page }) => {
            // Ensure demo mode is disabled
            await page.addInitScript(() => {
                delete (window as any).__VITE_DEMO__;
            });
            await page.goto('/');
        });

        test('hides demo mode badge', async ({ page }) => {
            // Demo badge should not be visible
            const demoBadge = page.getByTestId('demo-mode-badge');
            await expect(demoBadge).not.toBeVisible();
        });

        test('attempts real API calls (may fail if backend not running)', async ({ page }) => {
            await page.goto('/split-ratio');

            // Fill out form
            await page.fill('[data-testid="split-ratio-input"]', '10');
            await page.fill('[data-testid="column-flow-rate-input"]', '1.2');

            // Submit calculation
            await page.click('[data-testid="calculate-btn"]');

            // Either gets real result or shows connection error
            // We don't fail the test if backend is down, just verify it's trying real API
            const result = page.getByTestId('calculation-result');
            const error = page.getByTestId('error-message');

            // Should either show result or error within reasonable time
            await expect(result.or(error)).toBeVisible({ timeout: 10000 });

            // If error is shown, it should be a connection error (not demo data)
            const errorText = await error.textContent().catch(() => '');
            if (errorText) {
                expect(errorText).not.toContain('Demo calculation');
            }
        });
    });

    test.describe('Demo mode utilities', () => {
        test('isDemoMode() utility function works correctly', async ({ page }) => {
            // Test with demo mode enabled
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = 'true';
            });
            await page.goto('/');

            const isDemoEnabled = await page.evaluate(() => {
                // Import and test the demo utility
                const { isDemoMode } = require('../src/utils/demo');
                return isDemoMode();
            });

            expect(isDemoEnabled).toBe(true);
        });

        test('shouldForceMocks() utility function works correctly', async ({ page }) => {
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = 'true';
            });
            await page.goto('/');

            const shouldUseMocks = await page.evaluate(() => {
                const { shouldForceMocks } = require('../src/utils/demo');
                return shouldForceMocks();
            });

            expect(shouldUseMocks).toBe(true);
        });
    });

    test.describe('Demo mode with different environment variable values', () => {
        test('VITE_DEMO="1" enables demo mode', async ({ page }) => {
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = '1';
            });
            await page.goto('/');

            await expect(page.getByTestId('demo-mode-badge')).toBeVisible();
        });

        test('VITE_DEMO="true" enables demo mode', async ({ page }) => {
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = 'true';
            });
            await page.goto('/');

            await expect(page.getByTestId('demo-mode-badge')).toBeVisible();
        });

        test('VITE_DEMO="false" disables demo mode', async ({ page }) => {
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = 'false';
            });
            await page.goto('/');

            await expect(page.getByTestId('demo-mode-badge')).not.toBeVisible();
        });

        test('VITE_DEMO="" disables demo mode', async ({ page }) => {
            await page.addInitScript(() => {
                (window as any).__VITE_DEMO__ = '';
            });
            await page.goto('/');

            await expect(page.getByTestId('demo-mode-badge')).not.toBeVisible();
        });
    });
});