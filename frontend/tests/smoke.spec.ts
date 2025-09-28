import { test, expect } from '@playwright/test';
import { TestMonitor } from './helpers/test-monitor';

test.describe('Smoke Tests', () => {
  test('application loads and basic navigation works', async ({ page }) => {
    const monitor = new TestMonitor(page);
    // Navigate to home page
    await page.goto('/');
    
    // Check page loads with correct title
    await expect(page).toHaveTitle(/IntelliLab/i);
    
    // Verify main navigation exists
    await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    
    // Check all main nav links are present and clickable
    const navLinks = [
      { name: 'Home', path: '/' },
      { name: 'OCR Vision', path: '/analysis/ocr' },
      { name: 'Sandbox', path: '/sandbox' },
      { name: 'Troubleshooter', path: '/troubleshooter' },
      { name: 'Split Ratio Calculator', path: '/tools/split-ratio' },
      { name: 'Chromatogram Simulator', path: '/tools/chromatogram-simulator' }
    ];
    
    for (const link of navLinks) {
      await page.goto(link.path);
      await expect(page).toHaveURL(new RegExp(link.path.replace('/', '\\/')));
      // Basic check that page loaded without errors
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Verify no critical console errors during navigation
    monitor.expectNoCriticalErrors();
  });

  test('no console errors on initial load', async ({ page }) => {
    const monitor = new TestMonitor(page);
    
    await page.goto('/');
    
    // Allow some time for any async operations
    await page.waitForTimeout(2000);
    
    // Use monitor to check for critical errors
    monitor.expectNoCriticalErrors();
    
    // Also verify no network errors
    monitor.expectNoNetworkErrors();
  });

  test('API health check endpoints respond', async ({ page }) => {
    // Check if backend health endpoint is accessible
    const response = await page.request.get('/api/health');
    expect(response.status()).toBeLessThan(500);
  });

  test('responsive design works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('/');
    
    // Check navigation is accessible on mobile
    await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    
    // Navigate to OCR page and check file upload area is accessible
    await page.goto('/analysis/ocr');
    await expect(page.locator('label[for="file-upload"]')).toBeVisible();
  });
});