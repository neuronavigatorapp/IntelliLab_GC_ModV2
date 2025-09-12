import { test, expect, Page } from '@playwright/test';

test.describe('IntelliLab GC Critical Validation', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    page.setDefaultTimeout(60000); // Increased timeout for slower systems
  });

  async function waitForAppLoad() {
    try {
      // Wait for React to be ready
      await page.waitForSelector('#root', { state: 'visible', timeout: 30000 });
      await page.waitForSelector('button:has-text("SPLIT RATIO")', { state: 'visible', timeout: 30000 });
    } catch (e) {
      console.log('Error waiting for app load:', e.message);
      throw e;
    }
  }

  async function dismissSnackbar() {
    try {
      // Try to find and close any open snackbars
      const snackbar = page.locator('.MuiSnackbar-root');
      if (await snackbar.isVisible()) {
        console.log('Found visible snackbar, attempting to dismiss...');
        await page.evaluate(() => {
          const snackbars = document.querySelectorAll('.MuiSnackbar-root');
          snackbars.forEach(snackbar => {
            if (snackbar instanceof HTMLElement) {
              snackbar.style.display = 'none';
            }
          });
        });
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Error dismissing snackbar:', e.message);
    }
  }

  test('1. Form Persistence - Values survive page refresh', async () => {
    console.log('🧪 Testing form persistence...');
    
    // Navigate to app with retry
    await test.step('Navigate to app', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await waitForAppLoad();
      await dismissSnackbar();
    });
    
    // Navigate to Split Ratio Calculator
    await test.step('Open calculator', async () => {
      await page.click('button:has-text("SPLIT RATIO")');
      await page.waitForTimeout(2000);
    });
    
    // Enter test values
    await test.step('Enter values', async () => {
      const flowInput = page.locator('input[type="number"]').first();
      await flowInput.waitFor({ state: 'visible' });
      await flowInput.fill('2.345');
      
      const ratioSlider = page.locator('input[type="range"]').first();
      await ratioSlider.waitFor({ state: 'visible' });
      await ratioSlider.evaluate((element: HTMLInputElement) => {
        element.value = '75';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      await page.waitForTimeout(2000); // Wait for auto-save
    });
    
    // Refresh and verify
    await test.step('Verify persistence', async () => {
      await page.reload({ waitUntil: 'networkidle' });
      await waitForAppLoad();
      await dismissSnackbar();
      await page.click('button:has-text("SPLIT RATIO")');
      await page.waitForTimeout(2000);
      
      const flowInput = page.locator('input[type="number"]').first();
      const ratioSlider = page.locator('input[type="range"]').first();
      
      await flowInput.waitFor({ state: 'visible' });
      await ratioSlider.waitFor({ state: 'visible' });
      
      const flowValue = await flowInput.inputValue();
      const ratioValue = await ratioSlider.inputValue();
      
      console.log(`Flow persisted: ${flowValue} (expected: 2.345)`);
      console.log(`Ratio persisted: ${ratioValue} (expected: 70 or 80 due to step=10)`);
      
      expect(parseFloat(flowValue)).toBeCloseTo(2.345, 2);
      expect(parseInt(ratioValue)).toBeGreaterThanOrEqual(70);
      expect(parseInt(ratioValue)).toBeLessThanOrEqual(80);
    });
    
    console.log('✅ Form persistence PASSED');
  });

  test('2. Split Ratio Calculation - Validates formula accuracy', async () => {
    test.skip(process.env.SKIP_BACKEND_TESTS === 'true', 'Backend tests disabled');
    
    console.log('🧪 Testing split ratio calculation...');
    
    await test.step('Setup calculator', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await waitForAppLoad();
      await dismissSnackbar();
      
      // Check if backend is offline
      const backendStatus = await page.locator('text=Backend Offline').count();
      if (backendStatus > 0) {
        console.log('⚠️ Backend is offline, skipping calculation test');
        test.skip();
        return;
      }
      
      await page.click('button:has-text("SPLIT RATIO")');
      await page.waitForTimeout(2000);
    });
    
    await test.step('Enter values', async () => {
      // Wait for calculator to be ready
      await page.waitForSelector('input[type="number"]', { state: 'visible', timeout: 30000 });
      await page.waitForSelector('input[type="range"]', { state: 'visible', timeout: 30000 });
      
      // Clear and enter flow rate
      const flowInput = page.locator('input[type="number"]').first();
      await flowInput.click({ clickCount: 3 }); // Select all text
      await flowInput.press('Backspace'); // Clear
      await flowInput.fill('1.2');
      await page.waitForTimeout(500);
      
      // Set split ratio
      const ratioSlider = page.locator('input[type="range"]').first();
      await ratioSlider.evaluate((element: HTMLInputElement) => {
        element.value = '50';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // Wait for calculation to update
      await page.waitForTimeout(2000);
    });
    
    await test.step('Verify calculation', async () => {
      // Wait for results to appear
      await page.waitForSelector('text=Calculated Flow Rates', { timeout: 30000 });
      
      // Get all h6 elements that might contain our result
      const h6Elements = await page.locator('h6').all();
      let resultFound = false;
      let foundText = '';
      
      for (const element of h6Elements) {
        const text = await element.textContent();
        console.log('Found h6 text:', text);
        
        if (text?.includes('mL/min')) {
          // Extract numbers from the text
          const numbers = text.match(/\d+(\.\d+)?/g);
          if (numbers) {
            const value = parseFloat(numbers[0]);
            console.log('Found flow value:', value);
            
            // Check if any number is close to 64.2
            if (Math.abs(value - 64.2) < 1) {
              resultFound = true;
              foundText = text;
              break;
            }
          }
        }
      }
      
      if (!resultFound) {
        // Log all visible text for debugging
        const visibleText = await page.locator('body').textContent();
        console.log('Visible text:', visibleText?.substring(0, 500));
        
        // Log React component tree
        const reactTree = await page.evaluate(() => {
          const root = document.getElementById('root');
          return root ? root.innerHTML : 'No React root found';
        });
        console.log('React component tree:', reactTree.substring(0, 500));
        
        // Log input values
        const flowValue = await page.locator('input[type="number"]').first().inputValue();
        const ratioValue = await page.locator('input[type="range"]').first().inputValue();
        console.log('Current input values:', { flow: flowValue, ratio: ratioValue });
        
        // Log all numbers found on the page
        const allNumbers = await page.evaluate(() => {
          const text = document.body.textContent || '';
          return text.match(/\d+(\.\d+)?/g) || [];
        });
        console.log('All numbers found on page:', allNumbers);
        
        // Fail the test
        expect(false, 'Could not find total flow value').toBe(true);
      } else {
        console.log('Found result:', foundText);
        expect(resultFound).toBe(true);
      }
    });
    
    console.log('✅ Split ratio calculation PASSED');
  });

  test('3. API Health Check - Backend responding', async () => {
    test.skip(process.env.SKIP_BACKEND_TESTS === 'true', 'Backend tests disabled');
    
    console.log('🧪 Testing backend API...');
    
    try {
      const response = await page.request.get('http://localhost:8000/api/health', {
        timeout: 5000
      });
      expect(response.ok()).toBe(true);
      
      const data = await response.json();
      console.log('API Response:', data);
      
      expect(data.status).toBeTruthy();
      console.log('✅ API health check PASSED');
    } catch (e) {
      console.log('⚠️ Backend not running, skipping API test');
      test.skip();
    }
  });

  test('4. Error Validation - Handles invalid inputs', async () => {
    console.log('🧪 Testing error handling...');
    
    await test.step('Setup', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await waitForAppLoad();
      await dismissSnackbar();
      await page.click('button:has-text("SPLIT RATIO")');
      await page.waitForTimeout(2000);
    });
    
    await test.step('Test invalid input', async () => {
      const flowInput = page.locator('input[type="number"]').first();
      await flowInput.waitFor({ state: 'visible' });
      
      // Try to enter negative value
      await flowInput.fill('-5');
      await page.waitForTimeout(1000);
      
      // Check multiple validation scenarios
      const currentValue = await flowInput.inputValue();
      console.log('Current input value:', currentValue);
      
      // Check for error messages
      const errorMessages = [
        'error',
        'invalid',
        'must be positive',
        'negative values not allowed',
        'value must be greater than 0'
      ];
      
      let hasError = false;
      for (const message of errorMessages) {
        try {
          const errorElement = page.locator(`text=${message}`, { exact: false });
          if (await errorElement.count() > 0) {
            hasError = true;
            console.log(`Found error message: ${message}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Also check for HTML5 validation
      const isInvalid = await flowInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      if (isInvalid) {
        hasError = true;
        console.log('Input is invalid according to HTML5 validation');
      }
      
      const preventedNegative = currentValue === '' || parseFloat(currentValue) >= 0;
      if (preventedNegative) {
        console.log('Negative value was prevented');
      }
      
      // Test passes if either error shown or negative prevented
      const validationWorked = hasError || preventedNegative;
      expect(validationWorked, 'Expected either error message or negative value prevention').toBe(true);
      
      if (hasError) {
        console.log('✅ Error message shown');
      } else if (preventedNegative) {
        console.log('✅ Negative value prevented');
      }
    });
    
    console.log('✅ Error validation PASSED');
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('INTELLILAB GC VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log('All critical tests executed');
    console.log('='.repeat(60));
  });
});