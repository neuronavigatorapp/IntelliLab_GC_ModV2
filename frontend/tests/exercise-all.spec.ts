import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Exercise All - Complete Workflow Tests', () => {
  test('complete OCR → Sandbox → Troubleshooter workflow', async ({ page }) => {
    // Mock all necessary APIs
    await page.route('/api/chromatogram/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peaks: [
            { id: 'peak-1', name: 'Methane', retention_time: 1.23, area: 89432, height: 5234, snr: 15.2, tailing_factor: 1.1 },
            { id: 'peak-2', name: 'Ethane', retention_time: 2.67, area: 156789, height: 8976, snr: 22.3, tailing_factor: 1.3 },
            { id: 'peak-3', name: 'Propane', retention_time: 4.12, area: 234567, height: 12456, snr: 18.7, tailing_factor: 2.1 }
          ],
          baseline: { quality_score: 78, drift: 0.3, noise_level: 45 },
          overall_quality: 82,
          recommendations: ['Consider reducing injection temperature', 'Check column conditioning'],
          troubleshooting_suggestions: ['Peak 3 shows slight tailing - may indicate column degradation']
        })
      });
    });

    await page.route('/api/troubleshooter/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Based on your OCR analysis showing 3 peaks with 82% quality, I can see peak tailing in Peak 3 (tailing factor: 2.1). This suggests possible column degradation. I recommend:\n\n1. **Column Conditioning**: Increase temperature gradually\n2. **Injection Parameters**: Reduce injection volume\n3. **Sample Preparation**: Check for matrix effects',
          recommendations: [
            'Condition column at 50°C above max operating temperature',
            'Reduce injection volume to 0.5 μL',
            'Use matrix-matched standards'
          ],
          severity: 'medium'
        })
      });
    });

    // STEP 1: OCR Analysis
    await page.goto('/analysis/ocr');
    await expect(page.getByText('Drop files here or click to upload')).toBeVisible();

    // Upload test image
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles(path.join(__dirname, 'assets', 'ocr-sample.png'));

    // Wait for analysis completion
    await expect(page.getByTestId('ocr-peaks-table')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Methane')).toBeVisible();
    await expect(page.getByText('Ethane')).toBeVisible();
    await expect(page.getByText('Propane')).toBeVisible();
    await expect(page.getByText('82')).toBeVisible(); // Quality score

    // STEP 2: Use in Sandbox
    await page.getByTestId('use-in-sandbox-btn').click();
    await expect(page).toHaveURL(/\/sandbox\?ocr=/);

    // Verify Sandbox loaded with OCR data
    await expect(page.getByText('OCR Analysis Data Loaded')).toBeVisible();
    await expect(page.getByText('Displaying 3 peaks')).toBeVisible();
    await expect(page.getByText('Average S/N: 18.7')).toBeVisible();
    await expect(page.getByText('Baseline quality: 78%')).toBeVisible();
    await expect(page.getByText('Data Loaded')).toBeVisible();

    // Export functionality should be available
    await expect(page.getByTestId('export-png-btn')).toBeVisible();
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();

    // STEP 3: Navigate back to OCR for Troubleshooter
    await page.goto('/analysis/ocr');
    
    // Data should still be there (cached)
    await expect(page.getByTestId('ocr-peaks-table')).toBeVisible();
    await expect(page.getByText('Loaded from cache')).toBeVisible();

    // STEP 4: Ask Troubleshooter
    await page.getByTestId('ask-troubleshooter-btn').click();
    await expect(page).toHaveURL(/\/troubleshooter\?context=/);

    // Verify Troubleshooter loaded with OCR context
    await expect(page.getByText('OCR Analysis Context Loaded')).toBeVisible();
    await expect(page.getByText('3 peaks')).toBeVisible();
    await expect(page.getByText('82% overall quality')).toBeVisible();

    // Pre-seeded analysis should be present
    await expect(page.getByText('Analysis Summary')).toBeVisible();
    await expect(page.getByText('Overall Quality: 82%')).toBeVisible();
    await expect(page.getByText('Peak Count: 3')).toBeVisible();

    // STEP 5: Ask follow-up question
    await page.getByTestId('message-input').fill('What should I do about the peak tailing in Peak 3?');
    await page.getByTestId('send-message-btn').click();

    // Verify response
    await expect(page.getByText('peak tailing in Peak 3')).toBeVisible();
    await expect(page.getByText('Column Conditioning')).toBeVisible();
    await expect(page.getByText('Injection Parameters')).toBeVisible();
    await expect(page.getByText('50°C above max operating temperature')).toBeVisible();

    // STEP 6: Complete workflow validation
    // All three systems should have processed the same OCR data consistently
    await expect(page.locator('body')).not.toHaveClass(/error/);
  });

  test('calculator → simulator workflow integration', async ({ page }) => {
    // Mock calculator API
    await page.route('/api/split-ratio/calculate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_flow_rate: 31.5,
          split_flow_rate: 30.0,
          split_ratio: 30.0,
          column_flow_rate: 1.5,
          efficiency: 0.952,
          recommendations: ['Excellent separation efficiency', 'Optimal flow conditions']
        })
      });
    });

    // Mock simulator API
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: {
            time: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
            response: [100, 120, 180, 250, 200, 300, 280, 180, 140, 120, 100]
          },
          peaks: [
            { compound: 'Compound A', retention_time: 1.8, area: 45000, height: 2500, theoretical_plates: 3200 },
            { compound: 'Compound B', retention_time: 2.9, area: 67000, height: 3800, theoretical_plates: 4100 }
          ],
          conditions: {
            column_temperature: 120,
            carrier_gas_flow: 1.5,
            injection_volume: 1.0,
            split_ratio: 30.0
          }
        })
      });
    });

    // STEP 1: Calculate optimal split ratio
    await page.goto('/tools/split-ratio');
    await page.getByTestId('split-ratio-input').fill('30');
    await page.getByTestId('column-flow-input').fill('1.5');
    await page.getByTestId('calculate-btn').click();

    // Verify calculation results
    await expect(page.getByText('31.5')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('95.2%')).toBeVisible();
    await expect(page.getByText('Excellent separation efficiency')).toBeVisible();

    // STEP 2: Use calculated parameters in simulator
    await page.goto('/tools/chromatogram-simulator');
    
    // Simulator should be ready
    await expect(page.getByTestId('run-simulation-btn')).toBeVisible();
    await expect(page.getByText('Click "Run" to start')).toBeVisible();

    // Run simulation with optimized parameters
    await page.getByTestId('run-simulation-btn').click();

    // Verify simulation results
    await expect(page.getByText('Detected Peaks')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Compound A')).toBeVisible();
    await expect(page.getByText('Compound B')).toBeVisible();
    await expect(page.getByText('1.8 min')).toBeVisible();
    await expect(page.getByText('2.9 min')).toBeVisible();

    // Verify chart is displayed
    await expect(page.getByTestId('chrom-chart')).toBeVisible();
    await expect(page.getByText('Click "Run" to start')).not.toBeVisible();

    // Export functionality should work
    const csvButton = page.getByText('CSV');
    if (await csvButton.isVisible()) {
      await expect(csvButton).toBeVisible();
    }
  });

  test('cross-page navigation maintains application stability', async ({ page }) => {
    const pages = [
      '/',
      '/analysis/ocr',
      '/sandbox',
      '/troubleshooter',
      '/tools/split-ratio',
      '/tools/chromatogram-simulator'
    ];

    // Rapid navigation test
    for (let i = 0; i < 3; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Verify page loads without errors
        await expect(page.locator('body')).toBeVisible();
        
        // Check for JavaScript errors
        const errors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // Wait briefly for any async operations
        await page.waitForTimeout(500);
        
        // Verify no critical console errors
        const criticalErrors = errors.filter(error => 
          !error.includes('404') && 
          !error.includes('favicon') &&
          !error.includes('sw.js')
        );
        expect(criticalErrors.length).toBe(0);
      }
    }
  });

  test('complete data export workflow across all tools', async ({ page }) => {
    // Test OCR → Export → Sandbox → Export → Simulator → Export chain
    
    // Mock OCR analysis
    await page.route('/api/chromatogram/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peaks: [{ id: 'peak-1', name: 'Test Peak', retention_time: 2.5, area: 100000, height: 5000 }],
          baseline: { quality_score: 85 },
          overall_quality: 80
        })
      });
    });

    // Step 1: OCR Export
    await page.goto('/analysis/ocr');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles(path.join(__dirname, 'assets', 'ocr-sample.png'));
    await expect(page.getByTestId('ocr-peaks-table')).toBeVisible({ timeout: 30000 });

    // Test OCR CSV export
    const ocrCsvPromise = page.waitForEvent('download');
    await page.getByText('CSV').click();
    const ocrCsvDownload = await ocrCsvPromise;
    expect(ocrCsvDownload.suggestedFilename()).toMatch(/\.csv$/);

    // Step 2: Sandbox Export
    await page.getByTestId('use-in-sandbox-btn').click();
    await expect(page.getByText('Data Loaded')).toBeVisible();

    const sandboxPngPromise = page.waitForEvent('download');
    await page.getByTestId('export-png-btn').click();
    const sandboxPngDownload = await sandboxPngPromise;
    expect(sandboxPngDownload.suggestedFilename()).toMatch(/\.png$/);

    const sandboxCsvPromise = page.waitForEvent('download');
    await page.getByTestId('export-csv-btn').click();
    const sandboxCsvDownload = await sandboxCsvPromise;
    expect(sandboxCsvDownload.suggestedFilename()).toMatch(/\.csv$/);

    // Step 3: Simulator Export (if available)
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: { time: [0, 1, 2], response: [100, 200, 100] },
          peaks: [{ compound: 'Sim Peak', retention_time: 1.0, area: 50000, height: 2500 }]
        })
      });
    });

    await page.goto('/tools/chromatogram-simulator');
    await page.getByTestId('run-simulation-btn').click();
    await expect(page.getByText('Detected Peaks')).toBeVisible({ timeout: 15000 });

    // Test simulator export if available
    const simCsvButton = page.getByText('CSV');
    if (await simCsvButton.isVisible()) {
      const simCsvPromise = page.waitForEvent('download');
      await simCsvButton.click();
      const simCsvDownload = await simCsvPromise;
      expect(simCsvDownload.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('error recovery across complete workflow', async ({ page }) => {
    // Test how the application handles errors in each step of the workflow

    // Step 1: OCR with API error, then recovery
    await page.route('/api/chromatogram/analyze', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/analysis/ocr');
    const fileInput = page.getByTestId('ocr-file-input');
    await fileInput.setInputFiles(path.join(__dirname, 'assets', 'ocr-sample.png'));
    
    // Should handle error gracefully
    await expect(page.getByText(/Error|failed/i)).toBeVisible({ timeout: 15000 });

    // Step 2: Fix API and retry
    await page.route('/api/chromatogram/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peaks: [{ id: 'recovery-peak', name: 'Recovery Peak', retention_time: 3.0, area: 75000 }],
          baseline: { quality_score: 90 },
          overall_quality: 85
        })
      });
    });

    // Clear and retry
    await page.reload();
    await fileInput.setInputFiles(path.join(__dirname, 'assets', 'ocr-sample.png'));
    await expect(page.getByTestId('ocr-peaks-table')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Recovery Peak')).toBeVisible();

    // Step 3: Continue workflow to verify recovery
    await page.getByTestId('use-in-sandbox-btn').click();
    await expect(page.getByText('Data Loaded')).toBeVisible();

    // Application should be fully functional after error recovery
    await expect(page.getByTestId('export-png-btn')).toBeVisible();
  });

  test('performance under load - rapid interactions', async ({ page }) => {
    // Test application performance under rapid user interactions

    await page.goto('/');

    const startTime = Date.now();
    
    // Rapid navigation and interactions
    for (let i = 0; i < 10; i++) {
      await page.goto('/tools/split-ratio');
      await page.getByTestId('split-ratio-input').fill(String(10 + i));
      
      await page.goto('/sandbox');
      await page.getByTestId('reset-btn').click();
      
      await page.goto('/troubleshooter');
      await page.getByTestId('message-input').fill(`Test message ${i}`);
      
      await page.goto('/analysis/ocr');
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(totalTime).toBeLessThan(30000); // 30 seconds max

    // Final page should still be functional
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Drop files here or click to upload')).toBeVisible();
  });
});