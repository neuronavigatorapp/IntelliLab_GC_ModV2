import { test, expect } from '@playwright/test';

test('MDL Calculator handles real lab data correctly', async ({ page }) => {
  // Navigate to MDL calculator
  await page.goto('http://localhost:3000');
  await page.click('text=Detection');
  
  // Enter real replicate data
  const replicates = [1250, 1190, 1300, 1275, 1260, 1240, 1295];
  for (let i = 0; i < replicates.length; i++) {
    await page.fill(`input[label="Replicate ${i+1}"]`, replicates[i].toString());
  }
  
  // Set parameters
  await page.fill('input[label="Analyte Concentration"]', '1.0');
  await page.fill('input[label="Baseline Noise"]', '0.5');
  await page.selectOption('select', 'FID');
  
  // Calculate
  await page.click('text=Calculate Detection Limits');
  
  // Verify results appear
  await expect(page.locator('text=/MDL.*EPA/')).toBeVisible();
  await expect(page.locator('text=/LOD.*3σ/')).toBeVisible();
  await expect(page.locator('text=/LOQ.*10σ/')).toBeVisible();
  
  // Verify calculations are reasonable
  const mdlText = await page.locator('text=/MDL.*ppm/').textContent();
  const mdlValue = parseFloat(mdlText.match(/(\d+\.\d+)/)[1]);
  expect(mdlValue).toBeGreaterThan(0);
  expect(mdlValue).toBeLessThan(1); // Should be less than concentration
});

