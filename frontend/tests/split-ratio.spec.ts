import { test, expect } from '@playwright/test';

test.describe('Split Ratio Calculator Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/split-ratio');
  });

  test('calculator loads with proper form fields', async ({ page }) => {
    // Verify page title/heading (look for the specific page heading, not the app title)
    await expect(page.locator('h1:has-text("Split Ratio Calculator"), h2:has-text("Split Ratio Calculator"), h3:has-text("Split Ratio Calculator")')).toBeVisible();
    
    // Verify input fields are present
    await expect(page.getByTestId('split-ratio-input')).toBeVisible();
    await expect(page.getByTestId('column-flow-input')).toBeVisible();
    
    // Verify calculate button
    await expect(page.getByTestId('calculate-btn')).toBeVisible();
    
    // Initial state - button should be enabled
    await expect(page.getByTestId('calculate-btn')).toBeEnabled();
  });

  test('basic calculation workflow', async ({ page }) => {
    // Mock API response
    await page.route('/api/split-ratio/calculate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_flow_rate: 26.5,
          split_flow_rate: 25.0,
          split_ratio: 25.0,
          column_flow_rate: 1.5,
          efficiency: 0.943,
          recommendations: [
            'Split ratio is within optimal range',
            'Good separation efficiency expected'
          ]
        })
      });
    });
    
    // Fill in the form
    await page.getByTestId('split-ratio-input').fill('25');
    await page.getByTestId('column-flow-input').fill('1.5');
    
    // Click calculate
    await page.getByTestId('calculate-btn').click();
    
    // Wait for loading state
    await expect(page.getByText('Calculating...')).toBeVisible();
    
    // Wait for results
    await expect(page.getByText('Total Flow Rate')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('26.5')).toBeVisible();
    await expect(page.getByText('Split Flow Rate')).toBeVisible();
    await expect(page.getByText('25.0')).toBeVisible();
    
    // Verify recommendations appear
    await expect(page.getByText('optimal range')).toBeVisible();
  });

  test('form validation works correctly', async ({ page }) => {
    // Test empty form submission
    await page.getByTestId('calculate-btn').click();
    
    // Should show validation errors or prevent submission
    // Adjust based on your validation implementation
    
    // Test invalid values
    await page.getByTestId('split-ratio-input').fill('-5');
    await page.getByTestId('column-flow-input').fill('0');
    
    await page.getByTestId('calculate-btn').click();
    
    // Should handle invalid inputs gracefully
    // This might show error messages or prevent submission
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/split-ratio/calculate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Calculation failed',
          message: 'Invalid parameter combination'
        })
      });
    });
    
    // Fill form and submit
    await page.getByTestId('split-ratio-input').fill('50');
    await page.getByTestId('column-flow-input').fill('2.0');
    
    await page.getByTestId('calculate-btn').click();
    
    // Should show error message
    await expect(page.getByText(/Error|failed|Invalid/i)).toBeVisible({ timeout: 10000 });
  });

  test('form inputs accept valid ranges', async ({ page }) => {
    const splitRatioInput = page.getByTestId('split-ratio-input');
    const columnFlowInput = page.getByTestId('column-flow-input');
    
    // Test minimum values
    await splitRatioInput.fill('1');
    await columnFlowInput.fill('0.1');
    expect(await splitRatioInput.inputValue()).toBe('1');
    expect(await columnFlowInput.inputValue()).toBe('0.1');
    
    // Test maximum values  
    await splitRatioInput.fill('500');
    await columnFlowInput.fill('10');
    expect(await splitRatioInput.inputValue()).toBe('500');
    expect(await columnFlowInput.inputValue()).toBe('10');
    
    // Test decimal values
    await splitRatioInput.fill('25.5');
    await columnFlowInput.fill('1.25');
    expect(await splitRatioInput.inputValue()).toBe('25.5');
    expect(await columnFlowInput.inputValue()).toBe('1.25');
  });

  test('loading state during calculation', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/split-ratio/calculate', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_flow_rate: 20.0,
          split_flow_rate: 18.0,
          split_ratio: 20.0,
          column_flow_rate: 2.0,
          efficiency: 0.9
        })
      });
    });
    
    await page.getByTestId('split-ratio-input').fill('20');
    await page.getByTestId('column-flow-input').fill('2.0');
    
    await page.getByTestId('calculate-btn').click();
    
    // Verify loading state
    await expect(page.getByText('Calculating...')).toBeVisible();
    await expect(page.getByTestId('calculate-btn')).toBeDisabled();
    
    // Wait for completion
    await expect(page.getByText('Total Flow Rate')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('calculate-btn')).toBeEnabled();
  });

  test('results display with proper formatting', async ({ page }) => {
    await page.route('/api/split-ratio/calculate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_flow_rate: 12.345,
          split_flow_rate: 10.845,
          split_ratio: 15.0,
          column_flow_rate: 1.5,
          efficiency: 0.876543,
          recommendations: [
            'Consider increasing split ratio for better separation',
            'Column flow rate is optimal for this application'
          ]
        })
      });
    });
    
    await page.getByTestId('split-ratio-input').fill('15');
    await page.getByTestId('column-flow-input').fill('1.5');
    await page.getByTestId('calculate-btn').click();
    
    // Verify numerical formatting (e.g., proper decimal places)
    await expect(page.getByText('12.35')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('87.7%')).toBeVisible(); // Efficiency as percentage
    
    // Verify recommendations
    await expect(page.getByText('increasing split ratio')).toBeVisible();
    await expect(page.getByText('Column flow rate is optimal')).toBeVisible();
  });

  test('multiple calculations maintain state correctly', async ({ page }) => {
    let callCount = 0;
    
    await page.route('/api/split-ratio/calculate', async (route) => {
      callCount++;
      const flowRate = callCount === 1 ? 15.0 : 30.0;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_flow_rate: flowRate,
          split_flow_rate: flowRate - 1.0,
          split_ratio: callCount === 1 ? 10.0 : 20.0,
          column_flow_rate: 1.0,
          efficiency: 0.9
        })
      });
    });
    
    // First calculation
    await page.getByTestId('split-ratio-input').fill('10');
    await page.getByTestId('column-flow-input').fill('1.0');
    await page.getByTestId('calculate-btn').click();
    
    await expect(page.getByText('15.0')).toBeVisible({ timeout: 10000 });
    
    // Second calculation with different values
    await page.getByTestId('split-ratio-input').fill('20');
    await page.getByTestId('calculate-btn').click();
    
    await expect(page.getByText('30.0')).toBeVisible({ timeout: 10000 });
    
    // Verify form values are maintained
    expect(await page.getByTestId('split-ratio-input').inputValue()).toBe('20');
    expect(await page.getByTestId('column-flow-input').inputValue()).toBe('1.0');
  });
});