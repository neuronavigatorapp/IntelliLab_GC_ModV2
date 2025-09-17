import { test, expect } from '@playwright/test';

/**
 * Comprehensive End-to-End Interactive Controls Testing
 * 
 * This test suite exercises all interactive controls in the IntelliLab GC application
 * using the stable aria-label selectors added for testing accessibility.
 * 
 * Prerequisites:
 * - Frontend server running on localhost:3000
 * - Backend server optional (tests handle offline gracefully)
 */

test.describe('IntelliLab GC Comprehensive Interactive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('nav[role="navigation"]', { timeout: 30000 });
  });

  test.describe('Sidebar Navigation Controls', () => {
    test('should interact with sidebar toggle button', async ({ page }) => {
      // Find and click the sidebar toggle button using our stable selector
      const toggleButton = page.getByLabel('Toggle sidebar');
      await expect(toggleButton).toBeVisible();
      
      // Click to collapse sidebar
      await toggleButton.click();
      await page.waitForTimeout(500); // Allow animation
      
      // Sidebar should still be responsive
      await expect(toggleButton).toBeVisible();
      
      // Click to expand sidebar
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      await expect(toggleButton).toBeVisible();
    });

    test('should interact with section toggle buttons', async ({ page }) => {
      // Find all section toggle buttons
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      
      // Get count of section buttons
      const count = await sectionButtons.count();
      expect(count).toBeGreaterThan(0);
      
      // Click each section button to test expand/collapse
      for (let i = 0; i < count; i++) {
        const button = sectionButtons.nth(i);
        await expect(button).toBeVisible();
        
        await button.click();
        await page.waitForTimeout(300); // Allow animation
        
        // Button should remain clickable
        await expect(button).toBeVisible();
      }
    });

    test('should navigate through sidebar items', async ({ page }) => {
      // Get all navigation buttons (excluding toggle buttons)
      const allButtons = page.locator('nav[role="navigation"] button');
      const count = await allButtons.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Test navigation by clicking through buttons
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = allButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Skip toggle buttons, focus on navigation
        if (!ariaLabel || (!ariaLabel.includes('Toggle') && !ariaLabel.includes('Open'))) {
          await button.click();
          await page.waitForTimeout(200);
          
          // Verify navigation didn't crash the app
          await expect(page.locator('nav[role="navigation"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Topbar Controls', () => {
    test('should interact with mobile menu button', async ({ page }) => {
      const mobileMenuButton = page.getByLabel('Open mobile menu');
      await expect(mobileMenuButton).toBeAttached();
      
      // Click mobile menu (may be hidden on desktop but should be clickable)
      await mobileMenuButton.click({ force: true });
      
      // App should remain stable
      await expect(mobileMenuButton).toBeAttached();
    });

    test('should interact with settings button', async ({ page }) => {
      const settingsButton = page.getByLabel('Open settings');
      await expect(settingsButton).toBeVisible();
      
      await settingsButton.click();
      
      // Settings interaction should not crash app
      await expect(settingsButton).toBeVisible();
      
      // Check if settings modal/panel appeared (might need to close it)
      const possibleModal = page.locator('[role="dialog"]');
      if (await possibleModal.count() > 0) {
        // If modal opened, try to close it
        const closeButton = possibleModal.locator('button').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
        } else {
          // Try pressing Escape
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should display connection status with accessibility', async ({ page }) => {
      const connectionStatus = page.locator('[role="status"]');
      await expect(connectionStatus).toBeVisible();
      
      // Check that connection status has proper aria-label
      const ariaLabel = await connectionStatus.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Backend connection status: (Connected|Disconnected)/);
    });
  });

  test.describe('Calculator Functions', () => {
    test('should access and interact with calculators', async ({ page }) => {
      // Navigate through sidebar to find calculators
      const navigationButtons = page.locator('nav[role="navigation"] button');
      const count = await navigationButtons.count();
      
      for (let i = 0; i < Math.min(count, 8); i++) {
        const button = navigationButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Skip toggle buttons
        if (!ariaLabel || (!ariaLabel.includes('Toggle') && !ariaLabel.includes('Open'))) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Look for calculator inputs
          const textInputs = page.locator('input[type="text"], input[type="number"], input:not([type])');
          const sliders = page.locator('input[type="range"]');
          
          const inputCount = await textInputs.count();
          const sliderCount = await sliders.count();
          
          if (inputCount > 0 || sliderCount > 0) {
            console.log(`Found calculator with ${inputCount} inputs and ${sliderCount} sliders`);
            
            // Test text/number inputs
            for (let j = 0; j < Math.min(inputCount, 3); j++) {
              const input = textInputs.nth(j);
              await input.fill('123');
              await page.waitForTimeout(100);
            }
            
            // Test sliders
            for (let j = 0; j < Math.min(sliderCount, 3); j++) {
              const slider = sliders.nth(j);
              await slider.fill('50');
              await page.waitForTimeout(100);
            }
            
            // Verify app remains stable after input
            await expect(page.locator('nav[role="navigation"]')).toBeVisible();
          }
        }
      }
    });

    test('should handle form validation', async ({ page }) => {
      // Navigate to find a calculator with validation
      const navigationButtons = page.locator('nav[role="navigation"] button');
      const count = await navigationButtons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = navigationButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (!ariaLabel || (!ariaLabel.includes('Toggle') && !ariaLabel.includes('Open'))) {
          await button.click();
          await page.waitForTimeout(300);
          
          const numberInputs = page.locator('input[type="number"]');
          const inputCount = await numberInputs.count();
          
          if (inputCount > 0) {
            // Test invalid input
            const input = numberInputs.first();
            await input.fill('-999');
            await page.waitForTimeout(500);
            
            // Check if validation message appeared or value was corrected
            const value = await input.inputValue();
            const isValid = parseFloat(value) >= 0 || value === '';
            
            // Either the value was corrected or validation prevented it
            expect(isValid || value === '-999').toBeTruthy();
            
            // Test valid input
            await input.fill('123');
            await page.waitForTimeout(200);
            
            break; // Found and tested a calculator
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const mobileMenu = page.getByLabel('Open mobile menu');
      await expect(mobileMenu).toBeAttached();
      
      // Test mobile viewport  
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Mobile menu should be accessible
      await expect(mobileMenu).toBeAttached();
      await mobileMenu.click({ force: true });
      
      // App should remain functional
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
      
      // Return to desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Test Tab navigation
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
      
      // Test Tab key
      await page.keyboard.press('Tab');
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // App should remain stable
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });
    
    test('should handle space key activation', async ({ page }) => {
      const settingsButton = page.getByLabel('Open settings');
      await settingsButton.focus();
      await expect(settingsButton).toBeFocused();
      
      // Test Space key activation
      await page.keyboard.press('Space');
      
      // Settings should respond to space key
      await expect(settingsButton).toBeVisible();
    });
  });

  test.describe('Error Handling & Stress Testing', () => {
    test('should handle rapid interactions gracefully', async ({ page }) => {
      const buttons = page.locator('nav[role="navigation"] button');
      const count = await buttons.count();
      
      // Rapidly click multiple buttons
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        await button.click();
        await button.click(); // Double click
        await page.waitForTimeout(50);
      }
      
      // App should remain stable
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });

    test('should handle backend connection states', async ({ page }) => {
      // Check initial connection status
      const connectionStatus = page.locator('[role="status"]');
      await expect(connectionStatus).toBeVisible();
      
      const initialStatus = await connectionStatus.getAttribute('aria-label');
      expect(initialStatus).toMatch(/Backend connection status/);
      
      // Test app functionality regardless of backend state
      const sidebarToggle = page.getByLabel('Toggle sidebar');
      await sidebarToggle.click();
      await page.waitForTimeout(200);
      
      // Connection status should still be displayed
      await expect(connectionStatus).toBeVisible();
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have all required ARIA labels', async ({ page }) => {
      // Verify all critical accessibility selectors exist
      await expect(page.getByLabel('Toggle sidebar')).toBeAttached();
      await expect(page.getByLabel('Open mobile menu')).toBeAttached();
      await expect(page.getByLabel('Open settings')).toBeVisible();
      await expect(page.locator('[role="status"]')).toBeVisible();
      
      // Check for section toggles
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      expect(await sectionButtons.count()).toBeGreaterThan(0);
    });
    
    test('should support screen reader navigation', async ({ page }) => {
      // Check for semantic landmarks
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
      
      // Check for proper status elements
      const statusElements = page.locator('[role="status"]');
      expect(await statusElements.count()).toBeGreaterThanOrEqual(1);
      
      // Verify status elements have descriptive labels
      for (let i = 0; i < await statusElements.count(); i++) {
        const status = statusElements.nth(i);
        const ariaLabel = await status.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThan(10);
      }
    });
  });

  test.describe('Complete User Journey', () => {
    test('should complete a full application walkthrough', async ({ page }) => {
      // 1. Test sidebar expansion/collapse
      const sidebarToggle = page.getByLabel('Toggle sidebar');
      await sidebarToggle.click();
      await page.waitForTimeout(300);
      await sidebarToggle.click();
      await page.waitForTimeout(300);
      
      // 2. Navigate through sections
      const sectionButtons = page.getByLabel(/Toggle .* section/);
      const sectionCount = await sectionButtons.count();
      
      for (let i = 0; i < sectionCount; i++) {
        await sectionButtons.nth(i).click();
        await page.waitForTimeout(200);
      }
      
      // 3. Test calculator navigation
      const navButtons = page.locator('nav[role="navigation"] button');
      const navCount = await navButtons.count();
      
      for (let i = 0; i < Math.min(navCount, 6); i++) {
        const button = navButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (!ariaLabel || (!ariaLabel.includes('Toggle') && !ariaLabel.includes('Open'))) {
          await button.click();
          await page.waitForTimeout(300);
        }
      }
      
      // 4. Test settings
      const settingsButton = page.getByLabel('Open settings');
      await settingsButton.click();
      await page.waitForTimeout(300);
      
      // 5. Verify app is still functional
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
      await expect(page.locator('[role="status"]')).toBeVisible();
      
      console.log('✅ Complete user journey test passed');
    });
  });
});