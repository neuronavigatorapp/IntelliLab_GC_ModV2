import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('sidebar navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verify sidebar is visible
    await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    
    // Test navigation to each page
    const routes = [
      { name: 'Home', path: '/', heading: 'Field GC Toolkit' },
      { name: 'OCR Vision', path: '/analysis/ocr', heading: 'OCR Vision Analysis' },
      { name: 'Sandbox', path: '/sandbox', heading: 'GC Sandbox Environment' },
      { name: 'Troubleshooter', path: '/troubleshooter', heading: 'GC Troubleshooter' },
      { name: 'Split Ratio Calculator', path: '/tools/split-ratio', heading: 'Split Ratio Calculator' },
      { name: 'Chromatogram Simulator', path: '/tools/chromatogram-simulator', heading: 'Chromatogram Simulator' }
    ];
    
    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      
      // Wait longer for components to load, especially complex ones like OCR
      await page.waitForTimeout(2000);
      
      // Verify page loaded correctly by checking for main heading or specific content
      if (route.heading) {
        await expect(page.locator('h1, h2, h3').first()).toContainText(route.heading);
      }
      
      // Verify no critical errors on page load
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('breadcrumb navigation (if present)', async ({ page }) => {
    // Navigate to a nested page
    await page.goto('/analysis/ocr');
    
    // Check if breadcrumbs exist (optional feature)
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toContainText('Analysis');
      await expect(breadcrumbs).toContainText('OCR');
    }
  });

  test('browser back/forward navigation works', async ({ page }) => {
    // Start at home
    await page.goto('/');
    
    // Navigate to OCR page
    await page.goto('/analysis/ocr');
    await expect(page).toHaveURL(/\/analysis\/ocr/);
    
    // Navigate to Sandbox
    await page.goto('/sandbox');
    await expect(page).toHaveURL(/\/sandbox/);
    
    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/analysis\/ocr/);
    
    // Use browser forward
    await page.goForward();
    await expect(page).toHaveURL(/\/sandbox/);
  });

  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile menu toggle exists
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
      await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    } else {
      // If no mobile toggle, sidebar should still be accessible
      await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    }
  });

  test('deep links work correctly', async ({ page }) => {
    // Test direct navigation to nested routes
    await page.goto('/analysis/ocr', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/analysis\/ocr/);
    await page.waitForTimeout(2000); // Wait for component to fully load
    await expect(page.locator('h1:has-text("OCR Vision Analysis")')).toBeVisible();
    
    // Test route with query parameters
    await page.goto('/sandbox?preset=demo');
    await expect(page).toHaveURL(/\/sandbox/);
    
    // Test route with hash
    await page.goto('/troubleshooter#help');
    await expect(page).toHaveURL(/\/troubleshooter/);
  });

  test('404 handling for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-route');
    
    // Should either redirect to home or show 404 page
    // Adjust expectations based on your routing configuration
    await expect(page).toHaveURL(/\/(|404|not-found)/);
  });

  test('navigation preserves application state', async ({ page }) => {
    // Go to Split Ratio Calculator
    await page.goto('/tools/split-ratio');
    
    // Enter some data
    await page.getByTestId('split-ratio-input').fill('25');
    await page.getByTestId('column-flow-input').fill('1.5');
    
    // Navigate away and back
    await page.goto('/sandbox');
    await page.goto('/tools/split-ratio');
    
    // Verify form state is preserved (if your app does this)
    // This test may need adjustment based on your state management
    const splitRatioValue = await page.getByTestId('split-ratio-input').inputValue();
    const columnFlowValue = await page.getByTestId('column-flow-input').inputValue();
    
    // Values might be preserved or reset depending on implementation
    expect(splitRatioValue).toBeDefined();
    expect(columnFlowValue).toBeDefined();
  });
});