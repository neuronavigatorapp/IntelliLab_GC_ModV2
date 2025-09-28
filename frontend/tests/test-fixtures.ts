import { test as base, Page } from '@playwright/test';
import { mockHandler } from './mock-handler';

type TestFixtures = {
  page: Page;
  mockPage: Page;
  realApiPage: Page;
};

/**
 * Extended test fixtures with mock support
 */
export const test = base.extend<TestFixtures>({
  // Default page with mocks enabled (unless USE_REAL_API=true)
  page: async ({ page }, use) => {
    const useRealApi = process.env.USE_REAL_API === 'true';

    if (!useRealApi) {
      await mockHandler.setupMocks(page);
    }

    // Add consistent loading detection
    await page.addInitScript(() => {
      // Global loading state tracker
      (window as any).__testLoadingStates = new Set();

      // Mock XMLHttpRequest to track loading states
      const originalXMLHttpRequest = window.XMLHttpRequest;
      window.XMLHttpRequest = class extends originalXMLHttpRequest {
        open(method: string, url: string, async = true, user?: string, password?: string) {
          if (url && typeof url === 'string' && url.includes('/api/')) {
            (window as any).__testLoadingStates.add(url);
          }
          return super.open(method, url, async, user, password);
        }

        send(body?: Document | XMLHttpRequestBodyInit | null) {
          this.addEventListener('loadend', () => {
            const url = this.responseURL;
            if (url) {
              (window as any).__testLoadingStates.delete(url);
            }
          });
          return super.send(body);
        }
      };

      // Mock fetch as well
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0];
        if (url && typeof url === 'string' && url.includes('/api/')) {
          (window as any).__testLoadingStates.add(url);
        }

        try {
          const result = await originalFetch(...args);
          if (url && typeof url === 'string') {
            (window as any).__testLoadingStates.delete(url);
          }
          return result;
        } catch (error) {
          if (url && typeof url === 'string') {
            (window as any).__testLoadingStates.delete(url);
          }
          throw error;
        }
      };
    });

    await use(page);
  },

  // Page specifically configured for mocks (even if USE_REAL_API=true)
  mockPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await mockHandler.setupMocks(page);
    await use(page);
    await page.close();
  },

  // Page specifically configured for real API (even if USE_REAL_API=false)
  realApiPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    // No mocks - uses real API
    await use(page);
    await page.close();
  }
});

export { expect } from '@playwright/test';

/**
 * Helper function to wait for all API calls to complete
 */
export async function waitForApiCalls(page: Page, timeout = 10000) {
  await page.waitForFunction(() => {
    const loadingStates = (window as any).__testLoadingStates;
    return !loadingStates || loadingStates.size === 0;
  }, { timeout });
}

/**
 * Helper function to wait for specific loading indicators
 */
export async function waitForLoadingComplete(page: Page, timeout = 10000) {
  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '.loading-spinner',
    '[data-testid="loading"]',
    'text=Loading...',
    'text=Calculating...',
    'text=Analyzing...'
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 1000 });
    } catch {
      // Selector not found or already hidden - that's fine
    }
  }

  // Also wait for API calls to complete
  await waitForApiCalls(page, timeout);
}