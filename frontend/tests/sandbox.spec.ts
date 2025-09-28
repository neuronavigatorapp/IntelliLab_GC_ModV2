import { test, expect } from '@playwright/test';

test.describe('Sandbox Environment Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
  });

  test('sandbox loads with initial empty state', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2, h3').first()).toContainText('Sandbox');
    
    // Should show "No Data" badge initially
    await expect(page.getByText('No Data')).toBeVisible();
    
    // Reset button should be present
    await expect(page.getByTestId('reset-btn')).toBeVisible();
    
    // Export buttons should not be visible without data
    await expect(page.getByTestId('export-png-btn')).not.toBeVisible();
    await expect(page.getByTestId('export-csv-btn')).not.toBeVisible();
  });

  test('demo dataset loading workflow', async ({ page }) => {
    // Look for demo dataset buttons
    const demoButtons = page.locator('button:has-text("LPG"), button:has-text("Natural Gas"), button:has-text("Gasoline")');
    const firstDemoButton = demoButtons.first();
    
    if (await firstDemoButton.isVisible()) {
      await firstDemoButton.click();
      
      // Should change to "Data Loaded" state
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Export buttons should now be visible
      await expect(page.getByTestId('export-png-btn')).toBeVisible();
      await expect(page.getByTestId('export-csv-btn')).toBeVisible();
      
      // Chart area should show data
      const chartArea = page.locator('[data-testid*="chart"], .plotly, canvas');
      await expect(chartArea.first()).toBeVisible();
    }
  });

  test('OCR data integration from URL parameters', async ({ page }) => {
    // Navigate with OCR data in URL
    const ocrData = {
      peaks: [
        { name: 'Peak 1', retention_time: 2.5, area: 150000, snr: 12.5 },
        { name: 'Peak 2', retention_time: 4.2, area: 220000, snr: 8.3 }
      ],
      baseline: { quality_score: 85 },
      overall_quality: 78
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(ocrData));
    await page.goto(`/sandbox?ocr=${encodedData}`);
    
    // Should show OCR data banner
    await expect(page.getByText('OCR Analysis Data Loaded')).toBeVisible();
    await expect(page.getByText('Displaying 2 peaks')).toBeVisible();
    await expect(page.getByText('Average S/N: 10.4')).toBeVisible();
    await expect(page.getByText('Baseline quality: 85%')).toBeVisible();
    
    // Should show "Data Loaded" state
    await expect(page.getByText('Data Loaded')).toBeVisible();
    
    // Export options should be available
    await expect(page.getByTestId('export-png-btn')).toBeVisible();
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();
  });

  test('reset functionality clears data', async ({ page }) => {
    // First load some demo data
    const demoButton = page.locator('button').filter({ hasText: /LPG|Demo|Sample/ }).first();
    
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Click reset
      await page.getByTestId('reset-btn').click();
      
      // Should return to "No Data" state
      await expect(page.getByText('No Data')).toBeVisible();
      
      // Export buttons should be hidden
      await expect(page.getByTestId('export-png-btn')).not.toBeVisible();
      await expect(page.getByTestId('export-csv-btn')).not.toBeVisible();
    }
  });

  test('export functionality works with data', async ({ page }) => {
    // Load demo data first
    const demoButton = page.locator('button').filter({ hasText: /LPG|Demo|Sample/ }).first();
    
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Test PNG export
      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('export-png-btn').click();
      const pngDownload = await downloadPromise;
      expect(pngDownload.suggestedFilename()).toMatch(/\.png$/);
      
      // Test CSV export
      const csvDownloadPromise = page.waitForEvent('download');
      await page.getByTestId('export-csv-btn').click();
      const csvDownload = await csvDownloadPromise;
      expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('chart interactions and visualization', async ({ page }) => {
    // Load data first
    const demoButton = page.locator('button').filter({ hasText: /LPG|Demo|Sample/ }).first();
    
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Verify chart is rendered
      const chartElement = page.locator('.plotly, canvas, svg').first();
      await expect(chartElement).toBeVisible();
      
      // If using Plotly, check for interactive elements
      const plotlyElement = page.locator('.plotly');
      if (await plotlyElement.isVisible()) {
        // Plotly charts should have hover capabilities
        await plotlyElement.hover();
        // Note: Detailed chart interaction testing may require more specific selectors
      }
    }
  });

  test('multiple dataset switching works correctly', async ({ page }) => {
    const demoButtons = page.locator('button').filter({ hasText: /LPG|Natural Gas|Gasoline|Demo|Sample/ });
    const buttonCount = await demoButtons.count();
    
    if (buttonCount > 1) {
      // Load first dataset
      await demoButtons.nth(0).click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Switch to second dataset
      await demoButtons.nth(1).click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Data should have changed (chart should still be visible)
      const chartElement = page.locator('.plotly, canvas, svg').first();
      await expect(chartElement).toBeVisible();
    }
  });

  test('OCR data URL parameters are cleaned up', async ({ page }) => {
    // Navigate with OCR data
    const ocrData = { peaks: [{ name: 'Test', retention_time: 1.0 }] };
    const encodedData = encodeURIComponent(JSON.stringify(ocrData));
    await page.goto(`/sandbox?ocr=${encodedData}`);
    
    // Verify OCR banner appears
    await expect(page.getByText('OCR Analysis Data Loaded')).toBeVisible();
    
    // URL should be cleaned up (parameters removed)
    await expect(page).toHaveURL('/sandbox');
  });

  test('sandbox handles invalid OCR data gracefully', async ({ page }) => {
    // Navigate with malformed OCR data
    await page.goto('/sandbox?ocr=invalid-json');
    
    // Should not crash and should show normal empty state
    await expect(page.getByText('No Data')).toBeVisible();
    
    // No OCR banner should appear
    await expect(page.getByText('OCR Analysis Data Loaded')).not.toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.getByTestId('reset-btn')).toBeVisible();
    
    // Demo dataset buttons should be accessible
    const demoButton = page.locator('button').filter({ hasText: /LPG|Demo|Sample/ }).first();
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
      
      // Export buttons should be accessible
      await expect(page.getByTestId('export-png-btn')).toBeVisible();
      await expect(page.getByTestId('export-csv-btn')).toBeVisible();
    }
  });

  test('navigation from sandbox works correctly', async ({ page }) => {
    // Load some data
    const demoButton = page.locator('button').filter({ hasText: /LPG|Demo|Sample/ }).first();
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await expect(page.getByText('Data Loaded')).toBeVisible();
    }
    
    // Navigate to another page
    await page.goto('/analysis/ocr');
    await expect(page).toHaveURL(/\/analysis\/ocr/);
    
    // Navigate back to sandbox
    await page.goto('/sandbox');
    
    // State should be preserved or reset depending on implementation
    // This test verifies the navigation doesn't cause errors
    await expect(page.locator('body')).toBeVisible();
  });
});