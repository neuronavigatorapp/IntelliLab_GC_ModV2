/**
 * Performance Guard Tests
 * 
 * Monitors application performance metrics to prevent regressions.
 * Includes bundle size checks, page load timing, and runtime performance.
 * 
 * Run with: npm run test:performance
 */

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  bundleSize: {
    maxMainBundle: 500 * 1024,      // 500KB max for main bundle
    maxTotalAssets: 2 * 1024 * 1024, // 2MB max for all assets
    maxChunkSize: 250 * 1024        // 250KB max for any single chunk
  },
  pageLoad: {
    maxDOMContentLoaded: 3000,      // 3s max for DOM ready
    maxLoadComplete: 5000,          // 5s max for full page load
    maxLargestContentfulPaint: 2500, // 2.5s max for LCP
    maxFirstContentfulPaint: 1500   // 1.5s max for FCP
  },
  runtime: {
    maxMemoryUsage: 60 * 1024 * 1024, // 60MB max heap usage
    maxJSHeapSize: 70 * 1024 * 1024,  // 70MB max JS heap (React + Plotly)
    maxRenderTime: 100                // 100ms max render time
  }
};

test.describe('Performance Guards', () => {

  test('Bundle Size Analysis', async () => {
    console.log('📦 Analyzing bundle sizes...');

    const distPath = path.join(process.cwd(), 'dist');

    try {
      // Check if dist directory exists
      await fs.access(distPath);
    } catch (error) {
      console.log('⚠️ No dist directory found, skipping bundle analysis');
      console.log('💡 Run "npm run build" first to analyze bundle sizes');
      return;
    }

    // Analyze JavaScript bundles
    const jsFiles = await findFiles(distPath, '.js');
    let totalSize = 0;
    let mainBundleSize = 0;
    const bundleSizes = [];

    for (const file of jsFiles) {
      const stats = await fs.stat(file);
      const size = stats.size;
      const relativePath = path.relative(distPath, file);

      totalSize += size;
      bundleSizes.push({ file: relativePath, size });

      // Identify main bundle
      if (relativePath.includes('index') || relativePath.includes('main')) {
        mainBundleSize = Math.max(mainBundleSize, size);
      }

      // Check individual chunk size
      if (size > PERFORMANCE_THRESHOLDS.bundleSize.maxChunkSize) {
        console.warn(`⚠️ Large chunk detected: ${relativePath} (${formatBytes(size)})`);
      }
    }

    // Include CSS and other assets
    const cssFiles = await findFiles(distPath, '.css');
    for (const file of cssFiles) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
    }

    console.log('📊 Bundle Analysis Results:');
    console.log(`   Main Bundle: ${formatBytes(mainBundleSize)}`);
    console.log(`   Total Assets: ${formatBytes(totalSize)}`);
    console.log(`   JS Files: ${jsFiles.length}`);
    console.log(`   CSS Files: ${cssFiles.length}`);

    // Check thresholds
    expect(mainBundleSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize.maxMainBundle);
    expect(totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize.maxTotalAssets);

    console.log('✅ Bundle size check passed');
  });

  test('Page Load Performance - Home Page', async ({ page }) => {
    console.log('⚡ Testing home page load performance...');

    // Measure page load
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for app to be ready - use robust React app detection
    await page.waitForSelector('[data-react-app-mounted]', { timeout: 15000 }).catch(async () => {
      // Fallback to React content being present
      await page.waitForSelector('div[id="root"] > div', { timeout: 5000 });
    });

    const loadTime = Date.now() - startTime;

    // Get detailed performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');

      const paintTimes: Record<string, number> = {};
      paintEntries.forEach(entry => {
        paintTimes[entry.name.replace('-', '_')] = entry.startTime;
      });

      return {
        // Navigation timing
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,

        // Paint timing
        firstContentfulPaint: paintTimes.first_contentful_paint || 0,

        // Largest Contentful Paint
        lcp: lcpEntries.length > 0 ? Math.max(...lcpEntries.map((e: any) => e.startTime)) : 0,

        // Memory usage (Chrome only)
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });

    console.log('📊 Performance Metrics:');
    console.log(`   Total Load Time: ${loadTime}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${metrics.loadComplete}ms`);
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint || 'N/A'}ms`);
    console.log(`   Largest Contentful Paint: ${metrics.lcp || 'N/A'}ms`);

    if (metrics.memory) {
      console.log(`   JS Heap Used: ${formatBytes(metrics.memory.usedJSHeapSize)}`);
      console.log(`   JS Heap Total: ${formatBytes(metrics.memory.totalJSHeapSize)}`);
    }

    // Check performance thresholds
    if (metrics.domContentLoaded > 0) {
      expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.maxDOMContentLoaded);
    }

    if (metrics.loadComplete > 0) {
      expect(metrics.loadComplete).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.maxLoadComplete);
    }

    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.maxFirstContentfulPaint);
    }

    if (metrics.lcp > 0) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.maxLargestContentfulPaint);
    }

    if (metrics.memory) {
      expect(metrics.memory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.maxMemoryUsage);
      expect(metrics.memory.totalJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.maxJSHeapSize);
    }

    console.log('✅ Page load performance check passed');
  });

  test('Runtime Performance - Interactive Elements', async ({ page }) => {
    console.log('⚡ Testing runtime performance...');

    await page.goto('/');
    // Wait for app to be ready - use robust React app detection
    await page.waitForSelector('[data-react-app-mounted]', { timeout: 15000 }).catch(async () => {
      // Fallback to React content being present
      await page.waitForSelector('div[id="root"] > div', { timeout: 5000 });
    });

    // Test tab switching performance
    console.log('🔄 Testing tab switching performance...');

    const tabSwitchTimes = [];
    const tabs = ['OCR Results', 'Raw Chromatogram', 'Sandbox'];

    for (const tabName of tabs) {
      const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);

      if (await tab.count() === 0) {
        console.log(`⚠️ Tab "${tabName}" not found, skipping...`);
        continue;
      }

      const startTime = Date.now();
      await tab.click();

      // Wait for tab content to be visible
      await page.waitForFunction(() => {
        const activeTab = document.querySelector('[role="tabpanel"]:not([hidden])');
        return activeTab && activeTab.children.length > 0;
      }, { timeout: 5000 });

      const switchTime = Date.now() - startTime;
      tabSwitchTimes.push(switchTime);

      console.log(`   ${tabName} tab switch: ${switchTime}ms`);
    }

    // Test form input responsiveness
    console.log('📝 Testing form input responsiveness...');

    const inputSelector = 'input[type="text"], input[type="number"], textarea';
    const inputs = await page.locator(inputSelector).all();

    if (inputs.length > 0) {
      const input = inputs[0];
      await input.click();

      const startTime = Date.now();
      await input.type('test input', { delay: 0 });
      const typingTime = Date.now() - startTime;

      console.log(`   Input responsiveness: ${typingTime}ms for 10 characters`);

      // Should be very fast for local typing
      expect(typingTime).toBeLessThan(500);
    }

    // Check average tab switch performance
    if (tabSwitchTimes.length > 0) {
      const avgSwitchTime = tabSwitchTimes.reduce((a, b) => a + b, 0) / tabSwitchTimes.length;
      console.log(`   Average tab switch time: ${avgSwitchTime.toFixed(1)}ms`);

      expect(avgSwitchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.maxRenderTime);
    }

    console.log('✅ Runtime performance check passed');
  });

  test('Network Resource Performance', async ({ page }) => {
    console.log('🌐 Testing network resource loading...');

    const resourceTimings: Array<{
      url: string;
      status: number;
      type: string;
      contentLength?: number;
    }> = [];

    // Monitor network requests
    page.on('response', response => {
      resourceTimings.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType(),
        contentLength: parseInt(response.headers()['content-length'] || '0', 10)
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for app to be ready - use robust React app detection
    await page.waitForSelector('[data-react-app-mounted]', { timeout: 15000 }).catch(async () => {
      // Fallback to React content being present
      await page.waitForSelector('div[id="root"] > div', { timeout: 5000 });
    });

    // Analyze resource loading
    const jsResources = resourceTimings.filter(r => r.type === 'script');
    const cssResources = resourceTimings.filter(r => r.type === 'stylesheet');
    const imageResources = resourceTimings.filter(r => r.type === 'image');

    console.log('📊 Network Resource Summary:');
    console.log(`   JavaScript files: ${jsResources.length}`);
    console.log(`   CSS files: ${cssResources.length}`);
    console.log(`   Images: ${imageResources.length}`);
    console.log(`   Total requests: ${resourceTimings.length}`);

    // Check for large resources
    const largeResources = resourceTimings.filter(r => (r.contentLength || 0) > 100 * 1024); // > 100KB

    if (largeResources.length > 0) {
      console.warn(`⚠️ Large resources detected (>100KB):`);
      largeResources.forEach(r => {
        console.warn(`   ${r.url}: ${formatBytes(r.contentLength || 0)}`);
      });
    }

    // Check for failed resources
    const failedResources = resourceTimings.filter(r => r.status >= 400);

    if (failedResources.length > 0) {
      console.error(`❌ Failed resources:`);
      failedResources.forEach(r => {
        console.error(`   ${r.url}: ${r.status}`);
      });
    }

    expect(failedResources.length).toBe(0);

    console.log('✅ Network resource performance check passed');
  });

});

// Helper functions
async function findFiles(dir: string, extension: string): Promise<string[]> {
  let files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(await findFiles(fullPath, extension));
      } else if (entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return files;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}