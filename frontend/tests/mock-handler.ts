import { Page, Route } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Mock Handler for API routes
 * Provides deterministic responses for E2E testing
 */
export class MockHandler {
  private fixtures: Map<string, any> = new Map();
  private fixturesPath: string;

  constructor() {
    // ES module equivalent of __dirname
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.fixturesPath = join(__dirname, 'fixtures');
    this.loadFixtures();
  }

  private loadFixtures() {
    const fixtures = [
      'split-ratio.success.json',
      'ocr.success.json',
      'troubleshooter.success.json',
      'chromatogram-simulation.success.json',
      'health.success.json'
    ];

    fixtures.forEach(filename => {
      try {
        const content = readFileSync(join(this.fixturesPath, filename), 'utf-8');
        const key = filename.replace('.success.json', '');
        this.fixtures.set(key, JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to load fixture ${filename}:`, error);
      }
    });
  }

  /**
   * Setup API mocking for a page
   */
  async setupMocks(page: Page) {
    console.log('🔧 Setting up API mocks...');
    // Health check endpoints
    await page.route('**/api/health', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.fixtures.get('health'))
      });
    });

    await page.route('**/health', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.fixtures.get('health'))
      });
    });

    // Split ratio calculation
    await page.route('**/api/split-ratio/calculate', async (route: Route) => {
      console.log('🎯 Intercepted split-ratio API call:', route.request().url());

      // Simulate network delay for realistic testing
      await new Promise(resolve => setTimeout(resolve, 100));

      const mockData = this.fixtures.get('split-ratio');
      console.log('📤 Returning mock split-ratio data:', mockData);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    // OCR analysis (corrected endpoint)
    await page.route('**/api/chromatogram/analyze', async (route: Route) => {
      console.log('🎯 Intercepted OCR API call:', route.request().url());

      await new Promise(resolve => setTimeout(resolve, 200));

      const mockData = this.fixtures.get('ocr');
      console.log('📤 Returning mock OCR data:', mockData);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    // Troubleshooter AI
    await page.route('**/api/troubleshooter/chat', async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 300));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.fixtures.get('troubleshooter'))
      });
    });

    // Chromatogram simulation (corrected endpoint)
    await page.route('**/api/chromatogram/simulate', async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 150));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.fixtures.get('chromatogram-simulation'))
      });
    });

    // Professional Calculations - Void Volume
    await page.route('**/api/calculations/void-volume', async (route: Route) => {
      console.log('🎯 Intercepted void-volume API call:', route.request().url());

      await new Promise(resolve => setTimeout(resolve, 50));

      const requestData = await route.request().postDataJSON();
      const { column_length, column_diameter } = requestData;

      // Calculate using π * (ID/2)^2 * L (units: mL)
      const radius_mm = column_diameter / 2;
      const volume_ml = Math.PI * Math.pow(radius_mm, 2) * column_length * 1000 / 1000000; // Convert mm³ to mL

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          volume_ml: Math.round(volume_ml * 1000) / 1000, // Round to 3 decimal places
          equation: `V = π × (${column_diameter}/2)² × ${column_length} = ${Math.round(volume_ml * 1000) / 1000} mL`
        })
      });
    });

    // Professional Calculations - Peak Capacity
    await page.route('**/api/calculations/peak-capacity', async (route: Route) => {
      console.log('🎯 Intercepted peak-capacity API call:', route.request().url());

      await new Promise(resolve => setTimeout(resolve, 50));

      const requestData = await route.request().postDataJSON();
      const { gradient_time, peak_width } = requestData;

      // Calculate using n_c = 1 + (gradient_time / peak_width)
      const peak_capacity = 1 + (gradient_time / peak_width);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          peak_capacity: Math.round(peak_capacity * 10) / 10,
          equation: `n_c = 1 + (${gradient_time} / ${peak_width}) = ${Math.round(peak_capacity * 10) / 10}`
        })
      });
    });

    // Professional Calculations - Backflush Timing
    await page.route('**/api/calculations/backflush-timing', async (route: Route) => {
      console.log('🎯 Intercepted backflush-timing API call:', route.request().url());

      await new Promise(resolve => setTimeout(resolve, 50));

      const requestData = await route.request().postDataJSON();
      const { last_peak_rt, safety_factor } = requestData;

      // Calculate using t_bf = RT_last × safety_factor
      const t_bf_min = last_peak_rt * safety_factor;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          t_bf_min: Math.round(t_bf_min * 100) / 100,
          equation: `t_bf = ${last_peak_rt} × ${safety_factor} = ${Math.round(t_bf_min * 100) / 100} minutes`
        })
      });
    });
  }

  /**
   * Create error responses for testing error handling
   */
  async setupErrorMocks(page: Page) {
    await page.route('**/api/split-ratio/calculate', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Calculation failed - please check input parameters' })
      });
    });

    await page.route('**/api/troubleshooter/chat', async (route: Route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'AI service temporarily unavailable' })
      });
    });
  }
}

export const mockHandler = new MockHandler();