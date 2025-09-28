import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (390x844 as specified)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('hamburger menu opens drawer navigation', async ({ page }) => {
    await page.goto('/');
    
    // Should show hamburger menu button on mobile
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();
    
    // Click hamburger to open drawer
    await menuButton.click();
    
    // Drawer/sidebar should be visible
    await expect(page.locator('[data-testid="mobile-nav-drawer"], nav[role="navigation"]')).toBeVisible();
    
    // Should contain navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /troubleshooter/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /simulator/i })).toBeVisible();
  });

  test('pages stack vertically without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    // Check body doesn't have horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    
    // Test different pages
    const pagesToTest = ['/tools/split-ratio', '/sandbox', '/troubleshooter', '/simulator/chromatogram'];
    
    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px tolerance
    }
  });

  test('forms and inputs are touch-friendly', async ({ page }) => {
    await page.goto('/tools/split-ratio');
    
    // Input fields should be properly sized for touch
    const splitRatioInput = page.getByTestId('split-ratio-input');
    await expect(splitRatioInput).toBeVisible();
    
    const inputBox = await splitRatioInput.boundingBox();
    expect(inputBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    
    // Buttons should be touch-friendly
    const calculateBtn = page.getByTestId('calculate-btn');
    await expect(calculateBtn).toBeVisible();
    
    const buttonBox = await calculateBtn.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('content adapts to mobile layout', async ({ page }) => {
    await page.goto('/');
    
    // Check that content is properly responsive
    await expect(page.locator('main, .main-content')).toBeVisible();
    
    // Navigation should not be side-by-side on mobile
    const navbar = page.locator('nav, .sidebar');
    if (await navbar.isVisible()) {
      const navBox = await navbar.boundingBox();
      expect(navBox?.width).toBeLessThan(390); // Should not take full width when visible
    }
  });

  test('mobile troubleshooter interface works', async ({ page }) => {
    await page.goto('/troubleshooter');
    
    // Message input should be properly sized
    const messageInput = page.getByTestId('message-input');
    await expect(messageInput).toBeVisible();
    
    // Send button should be touch-friendly
    const sendBtn = page.getByTestId('send-message-btn');
    await expect(sendBtn).toBeVisible();
    
    const sendBtnBox = await sendBtn.boundingBox();
    expect(sendBtnBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test interaction
    await messageInput.fill('Mobile test message');
    await sendBtn.click();
    
    await expect(page.getByText('Mobile test message')).toBeVisible();
  });
});