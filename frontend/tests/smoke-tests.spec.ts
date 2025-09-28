import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Smoke Tests for IntelliLab GC
 * 
 * These tests click every interactive control once and fail on any console/page errors.
 * Covers both desktop and mobile viewports with comprehensive error detection.
 * 
 * Prerequisites:
 * - Frontend server running on localhost:5173
 * - Backend server optional (tests handle offline gracefully)
 */

// Console error tracking
const consoleErrors: string[] = [];
const pageErrors: string[] = [];

test.describe('IntelliLab GC Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear error arrays
    consoleErrors.length = 0;
    pageErrors.length = 0;

    // Set up console error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Set up page error monitoring  
    page.on('pageerror', (error) => {
      pageErrors.push(`Page Error: ${error.message}`);
    });

    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('nav[role="navigation"]', { timeout: 30000 });
  });

  test.afterEach(async () => {
    // Check for any errors after each test
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors detected: ${consoleErrors.join('; ')}`);
    }
    if (pageErrors.length > 0) {
      console.error('Page errors detected:', pageErrors);  
      throw new Error(`Page errors detected: ${pageErrors.join('; ')}`);
    }
  });

  test.describe('Desktop Smoke Tests (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
    });

    test('should click all Topbar controls without errors', async ({ page }) => {
      // Click mobile menu button (should exist but may be hidden on desktop)
      const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(300);
      }

      // Click settings button
      const settingsButton = page.getByLabel('Open settings');
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();
      await page.waitForTimeout(300);

      // Close any modal that might have opened
      await closeAnyModal(page);

      // Check connection status (not clickable, but verify it's accessible)
      const connectionStatus = page.locator('[role="status"]');
      await expect(connectionStatus).toBeVisible();
    });

    test('should click sidebar toggle and all section toggles without errors', async ({ page }) => {
      // Click main sidebar toggle
      const sidebarToggle = page.getByLabel('Toggle sidebar');
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();
      await page.waitForTimeout(500);
      
      // Click again to restore expanded state
      await sidebarToggle.click();
      await page.waitForTimeout(500);

      // Click all section toggle buttons
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      const sectionCount = await sectionButtons.count();
      
      console.log(`Found ${sectionCount} section toggle buttons`);
      
      for (let i = 0; i < sectionCount; i++) {
        const button = sectionButtons.nth(i);
        await expect(button).toBeVisible();
        
        // Get section name for logging
        const ariaLabel = await button.getAttribute('aria-label');
        console.log(`Clicking section toggle: ${ariaLabel}`);
        
        await button.click();
        await page.waitForTimeout(300);
        
        // Click again to toggle back
        await button.click();
        await page.waitForTimeout(300);
      }
    });

    test('should click all navigation items without errors', async ({ page }) => {
      // Expand all sections first to access all navigation items
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      const sectionCount = await sectionButtons.count();
      
      for (let i = 0; i < sectionCount; i++) {
        await sectionButtons.nth(i).click();
        await page.waitForTimeout(200);
      }

      // Find all navigation buttons (excluding toggles and actions)
      const allButtons = page.locator('nav[role="navigation"] button');
      const buttonCount = await allButtons.count();
      
      console.log(`Found ${buttonCount} total buttons in navigation`);
      
      for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Skip toggle buttons and focus on navigation items
        if (ariaLabel && !ariaLabel.includes('Toggle') && !ariaLabel.includes('Open')) {
          console.log(`Clicking navigation item: ${ariaLabel}`);
          await button.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click all Dashboard quick action buttons without errors', async ({ page }) => {
      // Navigate to dashboard first (if not already there)
      const dashboardButton = page.locator('nav[role="navigation"] button').filter({ hasText: 'Dashboard' });
      if (await dashboardButton.count() > 0) {
        await dashboardButton.click();
        await page.waitForTimeout(500);
      }

      // Find all buttons in main content area (Dashboard quick actions)
      const quickActionButtons = page.locator('main button, [role="main"] button');
      const actionCount = await quickActionButtons.count();
      
      console.log(`Found ${actionCount} quick action buttons`);
      
      for (let i = 0; i < actionCount; i++) {
        const button = quickActionButtons.nth(i);
        if (await button.isVisible()) {
          const buttonText = await button.textContent();
          console.log(`Clicking quick action: ${buttonText}`);
          
          await button.click();
          await page.waitForTimeout(300);
          
          // Close any modal that might have opened
          await closeAnyModal(page);
        }
      }
    });

    test('should test all form inputs and sliders without errors', async ({ page }) => {
      // Navigate through all calculator sections to find inputs
      const allNavButtons = page.locator('nav[role="navigation"] button');
      const navCount = await allNavButtons.count();
      
      for (let i = 0; i < navCount; i++) {
        const button = allNavButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Focus on navigation items (not toggles)
        if (ariaLabel && !ariaLabel.includes('Toggle') && !ariaLabel.includes('Open')) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Test text/number inputs
          const textInputs = page.locator('input[type="text"], input[type="number"], input:not([type])');
          const inputCount = await textInputs.count();
          
          for (let j = 0; j < Math.min(inputCount, 5); j++) {
            const input = textInputs.nth(j);
            if (await input.isVisible()) {
              await input.fill('123');
              await page.waitForTimeout(100);
              
              // Clear the input
              await input.fill('');
              await page.waitForTimeout(100);
            }
          }
          
          // Test range sliders
          const sliders = page.locator('input[type="range"]');
          const sliderCount = await sliders.count();
          
          for (let j = 0; j < Math.min(sliderCount, 3); j++) {
            const slider = sliders.nth(j);
            if (await slider.isVisible()) {
              await slider.fill('25');
              await page.waitForTimeout(100);
              
              await slider.fill('75');
              await page.waitForTimeout(100);
            }
          }
          
          // Test checkboxes
          const checkboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await checkboxes.count();
          
          for (let j = 0; j < Math.min(checkboxCount, 3); j++) {
            const checkbox = checkboxes.nth(j);
            if (await checkbox.isVisible()) {
              await checkbox.check();
              await page.waitForTimeout(100);
              
              await checkbox.uncheck();
              await page.waitForTimeout(100);
            }
          }
          
          // Test select dropdowns
          const selects = page.locator('select');
          const selectCount = await selects.count();
          
          for (let j = 0; j < Math.min(selectCount, 3); j++) {
            const select = selects.nth(j);
            if (await select.isVisible()) {
              const options = await select.locator('option').count();
              if (options > 1) {
                await select.selectOption({ index: 1 });
                await page.waitForTimeout(100);
                
                await select.selectOption({ index: 0 });
                await page.waitForTimeout(100);
              }
            }
          }
          
          // Test any submit/calculate buttons on the page
          const calculateButtons = page.locator('button').filter({ hasText: /calculate|compute|submit|apply/i });
          const calcCount = await calculateButtons.count();
          
          for (let j = 0; j < Math.min(calcCount, 2); j++) {
            const calcButton = calculateButtons.nth(j);
            if (await calcButton.isVisible()) {
              await calcButton.click();
              await page.waitForTimeout(300);
            }
          }
        }
      }
    });
  });

  test.describe('Mobile Smoke Tests (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
    });

    test('should click all mobile controls without errors', async ({ page }) => {
      // Click mobile menu button (should be visible on mobile)
      const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Click settings button
      const settingsButton = page.getByLabel('Open settings');
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();
      await page.waitForTimeout(300);

      // Close any modal
      await closeAnyModal(page);
    });

    test('should navigate through sidebar on mobile without errors', async ({ page }) => {
      // Open mobile menu first
      const mobileMenuButton = page.getByTestId('mobile-menu-toggle');
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Expand all sections
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      const sectionCount = await sectionButtons.count();
      
      for (let i = 0; i < sectionCount; i++) {
        await sectionButtons.nth(i).click();
        await page.waitForTimeout(200);
      }

      // Click through navigation items
      const navButtons = page.locator('nav[role="navigation"] button');
      const navCount = await navButtons.count();
      
      for (let i = 0; i < Math.min(navCount, 8); i++) {
        const button = navButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (ariaLabel && !ariaLabel.includes('Toggle') && !ariaLabel.includes('Open')) {
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(300);
          }
        }
      }
    });

    test('should test responsive form interactions without errors', async ({ page }) => {
      // Navigate to a calculator page
      const navButtons = page.locator('nav[role="navigation"] button');
      const navCount = await navButtons.count();
      
      for (let i = 0; i < Math.min(navCount, 5); i++) {
        const button = navButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (ariaLabel && !ariaLabel.includes('Toggle') && !ariaLabel.includes('Open')) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Test inputs on mobile
          const inputs = page.locator('input:visible');
          const inputCount = await inputs.count();
          
          for (let j = 0; j < Math.min(inputCount, 3); j++) {
            const input = inputs.nth(j);
            await input.fill('456');
            await page.waitForTimeout(100);
          }
          
          // Test buttons
          const buttons = page.locator('main button:visible, [role="main"] button:visible');
          const buttonCount = await buttons.count();
          
          for (let j = 0; j < Math.min(buttonCount, 2); j++) {
            const btn = buttons.nth(j);
            await btn.click();
            await page.waitForTimeout(200);
          }
          
          break; // Test one calculator thoroughly
        }
      }
    });
  });

  test.describe('Tablet Smoke Tests (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
    });

    test('should handle tablet viewport interactions without errors', async ({ page }) => {
      // Test sidebar behavior on tablet
      const sidebarToggle = page.getByLabel('Toggle sidebar');
      await sidebarToggle.click();
      await page.waitForTimeout(300);
      await sidebarToggle.click();
      await page.waitForTimeout(300);

      // Test mobile menu (may be visible on tablet)
      const mobileMenuButton = page.getByLabel('Open mobile menu');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(300);
      }

      // Test some navigation
      const navButtons = page.locator('nav[role="navigation"] button');
      const navCount = await navButtons.count();
      
      for (let i = 0; i < Math.min(navCount, 4); i++) {
        const button = navButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (ariaLabel && !ariaLabel.includes('Toggle') && !ariaLabel.includes('Open')) {
          await button.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Stress Testing - Rapid Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('should handle rapid clicking without errors', async ({ page }) => {
      const sidebarToggle = page.getByLabel('Toggle sidebar');
      
      // Rapid toggle clicks
      for (let i = 0; i < 5; i++) {
        await sidebarToggle.click();
        await page.waitForTimeout(50);
      }
      
      // Rapid section toggles
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      const sectionCount = await sectionButtons.count();
      
      for (let i = 0; i < sectionCount; i++) {
        const button = sectionButtons.nth(i);
        await button.click();
        await button.click();
        await page.waitForTimeout(50);
      }
      
      // Verify app is still responsive
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });

    test('should handle keyboard interactions without errors', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Test Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Test Space key
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      
      // Test Escape key (for closing modals)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      // Verify app stability
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });
  });

  test('OCR Vision page - upload and analyze test image', async ({ page }) => {
    await page.goto('/analysis/ocr');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('OCR Vision Analysis');

    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload test image
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles({
      name: 'test-chromatogram.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Wait for preview to appear
    await expect(page.locator('img[alt="Chromatogram preview"]')).toBeVisible();

    // Click analyze button
    const analyzeButton = page.locator('button', { hasText: 'Analyze' });
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // Wait for analysis to complete (or error)
    await page.waitForTimeout(3000);

    // Check that peaks table appears (even if empty due to mock data)
    const resultsSection = page.locator('text=Analysis Results').locator('..');
    await expect(resultsSection).toBeVisible();

    // Verify no console errors occurred
    if (consoleErrors.length > 0) {
      console.log('Console Errors during OCR test:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during OCR test:', pageErrors);
    }

    expect(consoleErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);
  });
});

/**
 * Helper function to close any modal that might be open
 */
async function closeAnyModal(page: Page) {
  // Look for modal dialogs
  const modals = page.locator('[role="dialog"]');
  const modalCount = await modals.count();
  
  for (let i = 0; i < modalCount; i++) {
    const modal = modals.nth(i);
    if (await modal.isVisible()) {
      // Try to find close button
      const closeButton = modal.locator('button').filter({ hasText: /close|×|cancel/i }).first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        // Try Escape key
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(200);
    }
  }
}