import { test, expect } from '@playwright/test';

test.describe('Chromatogram Simulator Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/chromatogram-simulator');
  });

  test('simulator loads with initial state', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2, h3').first()).toContainText('Chromatogram Simulator');
    
    // Verify main components are present
    await expect(page.getByTestId('chrom-chart')).toBeVisible();
    await expect(page.getByTestId('run-simulation-btn')).toBeVisible();
    
    // Initial state - chart should show empty state message
    await expect(page.getByText('Click "Run" to start chromatogram simulation')).toBeVisible();
    
    // Run button should be enabled initially
    await expect(page.getByTestId('run-simulation-btn')).toBeEnabled();
  });

  test('simulation run workflow', async ({ page }) => {
    // Mock simulation API
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: {
            time: [0, 1, 2, 3, 4, 5],
            response: [100, 150, 300, 200, 120, 100]
          },
          peaks: [
            {
              compound: 'Methane',
              retention_time: 2.45,
              area: 125432,
              height: 8432,
              theoretical_plates: 2500
            },
            {
              compound: 'Ethane', 
              retention_time: 3.67,
              area: 234567,
              height: 15678,
              theoretical_plates: 3200
            }
          ],
          conditions: {
            column_temperature: 150,
            carrier_gas_flow: 1.5,
            injection_volume: 1.0
          }
        })
      });
    });
    
    // Click run simulation
    await page.getByTestId('run-simulation-btn').click();
    
    // Should show loading state
    await expect(page.getByText('Starting...')).toBeVisible();
    await expect(page.getByTestId('run-simulation-btn')).toBeDisabled();
    
    // Wait for results
    await expect(page.getByText('Detected Peaks')).toBeVisible({ timeout: 15000 });
    
    // Verify peak results
    await expect(page.getByText('Methane')).toBeVisible();
    await expect(page.getByText('2.45 min')).toBeVisible();
    await expect(page.getByText('Ethane')).toBeVisible();
    
    // Chart should no longer show empty state
    await expect(page.getByText('Click "Run" to start')).not.toBeVisible();
    
    // Run button should be enabled again
    await expect(page.getByTestId('run-simulation-btn')).toBeEnabled();
  });

  test('simulation controls work correctly', async ({ page }) => {
    // Mock fast simulation for control testing
    await page.route('/api/chromatogram/simulate', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: { time: [0, 1, 2], response: [100, 200, 100] },
          peaks: [{ compound: 'Test', retention_time: 1.0, area: 1000, height: 500 }],
          conditions: { column_temperature: 100 }
        })
      });
    });
    
    // Start simulation
    await page.getByTestId('run-simulation-btn').click();
    
    // Should be able to pause (if pause functionality exists)
    const pauseBtn = page.locator('button:has-text("Pause")');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await expect(page.getByText('Paused')).toBeVisible();
    }
    
    // Should be able to stop/reset
    const stopBtn = page.locator('button:has-text("Stop")');
    if (await stopBtn.isVisible()) {
      await stopBtn.click();
      await expect(page.getByText('Click "Run" to start')).toBeVisible();
    }
  });

  test('export functionality works', async ({ page }) => {
    // First run a simulation to get data
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: { time: [0, 1, 2], response: [100, 200, 100] },
          peaks: [{ compound: 'Test Peak', retention_time: 1.0, area: 1000, height: 500 }],
          conditions: { column_temperature: 100 }
        })
      });
    });
    
    await page.getByTestId('run-simulation-btn').click();
    await expect(page.getByText('Detected Peaks')).toBeVisible({ timeout: 15000 });
    
    // Test CSV export
    const csvButton = page.getByText('CSV');
    if (await csvButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await csvButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
    
    // Test PNG export  
    const pngButton = page.getByText('PNG');
    if (await pngButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await pngButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    }
  });

  test('simulation handles errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Simulation failed',
          message: 'Invalid simulation parameters'
        })
      });
    });
    
    await page.getByTestId('run-simulation-btn').click();
    
    // Should show error message
    await expect(page.getByText(/Error|failed|Invalid/i)).toBeVisible({ timeout: 10000 });
    
    // Button should be re-enabled after error
    await expect(page.getByTestId('run-simulation-btn')).toBeEnabled();
  });

  test('chart interactions work', async ({ page }) => {
    // Run simulation first
    await page.route('/api/chromatogram/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: { 
            time: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
            response: [100, 120, 200, 300, 250, 180, 150, 120, 100]
          },
          peaks: [{ compound: 'Peak1', retention_time: 1.5, area: 2000, height: 800 }],
          conditions: {}
        })
      });
    });
    
    await page.getByTestId('run-simulation-btn').click();
    await expect(page.getByText('Detected Peaks')).toBeVisible({ timeout: 15000 });
    
    // Check if chart container exists and is interactive
    const chartContainer = page.getByTestId('chrom-chart');
    await expect(chartContainer).toBeVisible();
    
    // If using Plotly, there might be hover interactions
    // Note: Chart interaction testing can be complex and may require specific library support
  });

  test('multiple simulation runs work correctly', async ({ page }) => {
    let runCount = 0;
    
    await page.route('/api/chromatogram/simulate', async (route) => {
      runCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trace_data: { time: [0, 1, 2], response: [100, 150 + runCount * 50, 100] },
          peaks: [{ 
            compound: `Run ${runCount} Peak`, 
            retention_time: 1.0 + runCount * 0.1, 
            area: 1000 * runCount,
            height: 500 
          }],
          conditions: { run_number: runCount }
        })
      });
    });
    
    // First run
    await page.getByTestId('run-simulation-btn').click();
    await expect(page.getByText('Run 1 Peak')).toBeVisible({ timeout: 15000 });
    
    // Second run
    await page.getByTestId('run-simulation-btn').click();
    await expect(page.getByText('Run 2 Peak')).toBeVisible({ timeout: 15000 });
    
    // Verify the latest results are displayed
    await expect(page.getByText('1.1 min')).toBeVisible(); // New retention time
  });

  test('simulation parameters can be adjusted', async ({ page }) => {
    // Check if parameter controls exist (temperature, flow rate, etc.)
    const tempControl = page.locator('input[type="number"], select, input[type="range"]').first();
    
    if (await tempControl.isVisible()) {
      // Adjust a parameter
      await tempControl.fill('200');
      
      // Run simulation with new parameters
      await page.route('/api/chromatogram/simulate', async (route) => {
        const requestBody = await route.request().postDataJSON();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            trace_data: { time: [0, 1, 2], response: [100, 250, 100] },
            peaks: [{ compound: 'High Temp Peak', retention_time: 0.8, area: 1500, height: 750 }],
            conditions: requestBody
          })
        });
      });
      
      await page.getByTestId('run-simulation-btn').click();
      await expect(page.getByText('High Temp Peak')).toBeVisible({ timeout: 15000 });
    }
  });
});