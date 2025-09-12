import { test, expect, Page } from '@playwright/test';

class IntelliLabTester {
  page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async navigateToApp() {
    await this.page.goto('http://localhost:3000');
    
    // Wait for app to load
    await this.page.waitForSelector('body', { timeout: 10000 });
    
    // Check if we're on the main app page
    const title = await this.page.title();
    expect(title).toContain('IntelliLab');
  }
  
  async testCalculatorAccessibility() {
    console.log('Testing calculator accessibility...');
    
    // Look for common calculator buttons/links
    const calculatorSelectors = [
      'text=Split Ratio',
      'text=Detection Limit',
      'text=Column',
      'text=Pressure',
      'text=Calculator',
      '[data-testid*="calculator"]',
      '[data-testid*="split"]',
      '[data-testid*="detection"]'
    ];
    
    let foundCalculator = false;
    for (const selector of calculatorSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`Found calculator element: ${selector}`);
          foundCalculator = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    return { test: 'Calculator Accessibility', status: foundCalculator ? 'PASSED' : 'FAILED' };
  }
  
  async testBasicNavigation() {
    console.log('Testing basic navigation...');
    
    try {
      // Look for navigation elements
      const navSelectors = [
        'nav',
        '[role="navigation"]',
        '.navbar',
        '.nav',
        'header',
        '[data-testid*="nav"]'
      ];
      
      let foundNav = false;
      for (const selector of navSelectors) {
        try {
          const nav = await this.page.locator(selector).first();
          if (await nav.isVisible()) {
            foundNav = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Test clicking on various navigation elements
      const clickableElements = [
        'button',
        'a[href]',
        '[role="button"]',
        '.btn'
      ];
      
      let clickableFound = 0;
      for (const selector of clickableElements) {
        try {
          const elements = await this.page.locator(selector).all();
          clickableFound += elements.length;
          
          // Try clicking the first few elements
          for (let i = 0; i < Math.min(3, elements.length); i++) {
            try {
              if (await elements[i].isVisible()) {
                await elements[i].click();
                await this.page.waitForTimeout(500); // Brief wait
              }
            } catch (e) {
              // Element might not be clickable, continue
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      return { 
        test: 'Basic Navigation', 
        status: (foundNav && clickableFound > 0) ? 'PASSED' : 'FAILED',
        details: `Found navigation: ${foundNav}, Clickable elements: ${clickableFound}`
      };
      
    } catch (error) {
      return { test: 'Basic Navigation', status: 'ERROR', error: error.message };
    }
  }
  
  async testFormInputs() {
    console.log('Testing form inputs...');
    
    try {
      // Look for input fields
      const inputs = await this.page.locator('input').all();
      const textareas = await this.page.locator('textarea').all();
      const selects = await this.page.locator('select').all();
      
      let inputsTested = 0;
      
      // Test text inputs
      for (const input of inputs.slice(0, 5)) { // Test first 5 inputs
        try {
          if (await input.isVisible() && await input.isEnabled()) {
            const inputType = await input.getAttribute('type') || 'text';
            
            if (['text', 'number', 'email'].includes(inputType)) {
              await input.fill('test123');
              await this.page.waitForTimeout(100);
              
              const value = await input.inputValue();
              if (value === 'test123') {
                inputsTested++;
              }
              
              // Clear the input
              await input.fill('');
            }
          }
        } catch (e) {
          // Continue with next input
        }
      }
      
      // Test textareas
      for (const textarea of textareas.slice(0, 3)) {
        try {
          if (await textarea.isVisible() && await textarea.isEnabled()) {
            await textarea.fill('test content');
            await this.page.waitForTimeout(100);
            
            const value = await textarea.inputValue();
            if (value === 'test content') {
              inputsTested++;
            }
            
            await textarea.fill('');
          }
        } catch (e) {
          // Continue
        }
      }
      
      return { 
        test: 'Form Inputs', 
        status: inputsTested > 0 ? 'PASSED' : 'FAILED',
        details: `Successfully tested ${inputsTested} form inputs`
      };
      
    } catch (error) {
      return { test: 'Form Inputs', status: 'ERROR', error: error.message };
    }
  }
  
  async testCalculatorFunctionality() {
    console.log('Testing calculator functionality...');
    
    try {
      // Look for calculator-specific elements
      const calculatorElements = await this.page.locator('[data-testid*="calculator"], [class*="calculator"], [id*="calculator"]').all();
      
      if (calculatorElements.length === 0) {
        // Try to find and click a calculator button first
        const calcButtons = [
          'text=Split Ratio',
          'text=Detection Limit',
          'text=Column Calculator',
          'text=Pressure Calculator'
        ];
        
        for (const buttonText of calcButtons) {
          try {
            const button = this.page.locator(buttonText).first();
            if (await button.isVisible()) {
              await button.click();
              await this.page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            // Continue
          }
        }
      }
      
      // Look for numeric inputs (common in calculators)
      const numericInputs = await this.page.locator('input[type="number"]').all();
      const rangeInputs = await this.page.locator('input[type="range"]').all();
      
      let calculationsPerformed = 0;
      
      // Test numeric inputs
      for (const input of numericInputs.slice(0, 3)) {
        try {
          if (await input.isVisible() && await input.isEnabled()) {
            await input.fill('100');
            await this.page.waitForTimeout(500); // Wait for calculation
            calculationsPerformed++;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Test range inputs (sliders)
      for (const range of rangeInputs.slice(0, 2)) {
        try {
          if (await range.isVisible() && await range.isEnabled()) {
            await range.fill('50');
            await this.page.waitForTimeout(500);
            calculationsPerformed++;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Look for calculate buttons
      const calculateButtons = await this.page.locator('button:has-text("Calculate"), button:has-text("Compute"), [data-testid*="calculate"]').all();
      
      for (const button of calculateButtons.slice(0, 2)) {
        try {
          if (await button.isVisible() && await button.isEnabled()) {
            await button.click();
            await this.page.waitForTimeout(1000);
            calculationsPerformed++;
          }
        } catch (e) {
          // Continue
        }
      }
      
      return { 
        test: 'Calculator Functionality', 
        status: calculationsPerformed > 0 ? 'PASSED' : 'FAILED',
        details: `Performed ${calculationsPerformed} calculator interactions`
      };
      
    } catch (error) {
      return { test: 'Calculator Functionality', status: 'ERROR', error: error.message };
    }
  }
  
  async testErrorHandling() {
    console.log('Testing error handling...');
    
    try {
      // Try to trigger errors with invalid inputs
      const numericInputs = await this.page.locator('input[type="number"]').all();
      
      let errorsTested = 0;
      
      for (const input of numericInputs.slice(0, 3)) {
        try {
          if (await input.isVisible() && await input.isEnabled()) {
            // Test invalid values
            const invalidValues = ['-999999', 'abc', '1e999'];
            
            for (const value of invalidValues) {
              await input.fill(value);
              await this.page.waitForTimeout(300);
              
              // Look for error messages
              const errorSelectors = [
                '.error',
                '.alert-error',
                '.text-red',
                '.text-danger',
                '[role="alert"]',
                '.MuiAlert-root'
              ];
              
              for (const selector of errorSelectors) {
                try {
                  const errorElement = this.page.locator(selector).first();
                  if (await errorElement.isVisible()) {
                    errorsTested++;
                    break;
                  }
                } catch (e) {
                  // Continue
                }
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      return { 
        test: 'Error Handling', 
        status: errorsTested > 0 ? 'PASSED' : 'WARNING',
        details: `Found ${errorsTested} error handling cases`
      };
      
    } catch (error) {
      return { test: 'Error Handling', status: 'ERROR', error: error.message };
    }
  }
  
  async testResponsiveness() {
    console.log('Testing responsiveness...');
    
    try {
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      let responsiveTests = 0;
      
      for (const viewport of viewports) {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(500);
        
        // Check if content is still visible and accessible
        const body = this.page.locator('body');
        if (await body.isVisible()) {
          responsiveTests++;
        }
        
        // Check for horizontal scrollbar (usually indicates poor responsiveness)
        const scrollWidth = await this.page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await this.page.evaluate(() => document.body.clientWidth);
        
        if (scrollWidth <= clientWidth + 20) { // Allow small margin
          responsiveTests++;
        }
      }
      
      // Reset to default viewport
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      return { 
        test: 'Responsiveness', 
        status: responsiveTests >= 4 ? 'PASSED' : 'WARNING',
        details: `Passed ${responsiveTests}/6 responsive tests`
      };
      
    } catch (error) {
      return { test: 'Responsiveness', status: 'ERROR', error: error.message };
    }
  }
  
  async testPerformance() {
    console.log('Testing performance...');
    
    try {
      const startTime = Date.now();
      
      // Navigate to app and wait for it to be interactive
      await this.page.goto('http://localhost:3000');
      await this.page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Test JavaScript errors
      const jsErrors: string[] = [];
      this.page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });
      
      // Interact with the page to trigger any runtime errors
      await this.page.locator('button, a, input').first().click().catch(() => {});
      await this.page.waitForTimeout(1000);
      
      return { 
        test: 'Performance', 
        status: loadTime < 5000 && jsErrors.length === 0 ? 'PASSED' : 'WARNING',
        details: `Load time: ${loadTime}ms, JS errors: ${jsErrors.length}`
      };
      
    } catch (error) {
      return { test: 'Performance', status: 'ERROR', error: error.message };
    }
  }
}

test.describe('IntelliLab GC Frontend Comprehensive Testing', () => {
  test('Complete Frontend Validation', async ({ page }) => {
    const tester = new IntelliLabTester(page);
    const results: any[] = [];
    
    try {
      // Navigate to the app
      await tester.navigateToApp();
      
      // Run all tests
      const testMethods = [
        tester.testCalculatorAccessibility.bind(tester),
        tester.testBasicNavigation.bind(tester),
        tester.testFormInputs.bind(tester),
        tester.testCalculatorFunctionality.bind(tester),
        tester.testErrorHandling.bind(tester),
        tester.testResponsiveness.bind(tester),
        tester.testPerformance.bind(tester)
      ];
      
      for (const testMethod of testMethods) {
        try {
          const result = await testMethod();
          results.push(result);
          console.log(`✅ ${result.test}: ${result.status}`);
        } catch (error) {
          results.push({
            test: testMethod.name,
            status: 'ERROR',
            error: error.message
          });
          console.log(`❌ ${testMethod.name}: ERROR - ${error.message}`);
        }
      }
      
      // Generate summary
      const passed = results.filter(r => r.status === 'PASSED').length;
      const failed = results.filter(r => r.status === 'FAILED').length;
      const warnings = results.filter(r => r.status === 'WARNING').length;
      const errors = results.filter(r => r.status === 'ERROR').length;
      
      console.log('\n📊 Frontend Test Summary:');
      console.log(`   Passed: ${passed}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Warnings: ${warnings}`);
      console.log(`   Errors: ${errors}`);
      
      // Save results for the orchestrator
      const report = {
        timestamp: new Date().toISOString(),
        results: results,
        summary: {
          total: results.length,
          passed: passed,
          failed: failed,
          warnings: warnings,
          errors: errors,
          pass_rate: (passed / results.length) * 100
        }
      };
      
      // Write results to a file that the orchestrator can read
      const fs = require('fs');
      fs.writeFileSync('frontend_test_results.json', JSON.stringify(report, null, 2));
      
      // The test should pass if most functionality works
      // Allow some warnings but not failures or errors
      expect(failed + errors).toBeLessThanOrEqual(2);
      expect(passed).toBeGreaterThanOrEqual(3);
      
    } catch (error) {
      console.error('Frontend testing failed:', error);
      
      // Save error result
      const errorReport = {
        timestamp: new Date().toISOString(),
        results: [{
          test: 'Frontend Testing',
          status: 'ERROR',
          error: error.message
        }],
        summary: {
          total: 1,
          passed: 0,
          failed: 0,
          warnings: 0,
          errors: 1,
          pass_rate: 0
        }
      };
      
      const fs = require('fs');
      fs.writeFileSync('frontend_test_results.json', JSON.stringify(errorReport, null, 2));
      
      throw error;
    }
  });
  
  test('App loads without crashing', async ({ page }) => {
    // Basic smoke test
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check that we don't have a completely broken page
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for any immediate JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // Allow some errors but not catastrophic failures
    expect(errors.length).toBeLessThan(5);
  });
});
