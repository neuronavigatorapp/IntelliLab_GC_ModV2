import { Page, expect } from '@playwright/test';

export interface NetworkMonitor {
  requests: string[];
  responses: { url: string; status: number; contentType: string }[];
  errors: string[];
}

export interface ConsoleMonitor {
  errors: string[];
  warnings: string[];
  logs: string[];
}

export class TestMonitor {
  private networkMonitor: NetworkMonitor;
  private consoleMonitor: ConsoleMonitor;
  
  constructor(private page: Page) {
    this.networkMonitor = {
      requests: [],
      responses: [],
      errors: []
    };
    
    this.consoleMonitor = {
      errors: [],
      warnings: [],
      logs: []
    };
    
    this.setupNetworkMonitoring();
    this.setupConsoleMonitoring();
  }
  
  private setupNetworkMonitoring() {
    this.page.on('request', (request) => {
      this.networkMonitor.requests.push(`${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', (response) => {
      this.networkMonitor.responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || ''
      });
    });
    
    this.page.on('requestfailed', (request) => {
      this.networkMonitor.errors.push(`Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  }
  
  private setupConsoleMonitoring() {
    this.page.on('console', (msg) => {
      const text = msg.text();
      switch (msg.type()) {
        case 'error':
          this.consoleMonitor.errors.push(text);
          break;
        case 'warning':
          this.consoleMonitor.warnings.push(text);
          break;
        case 'log':
        case 'info':
          this.consoleMonitor.logs.push(text);
          break;
      }
    });
  }
  
  // Helper to verify no critical console errors
  expectNoCriticalErrors() {
    const criticalErrors = this.consoleMonitor.errors.filter(error => 
      !error.includes('404') &&
      !error.includes('favicon') &&
      !error.includes('sw.js') &&
      !error.includes('manifest.json') &&
      !error.toLowerCase().includes('chunk') // Vite chunk loading errors in dev
    );
    
    if (criticalErrors.length > 0) {
      console.error('Critical console errors detected:', criticalErrors);
    }
    
    expect(criticalErrors).toHaveLength(0);
  }
  
  // Helper to verify API cache behavior
  expectAPICallCount(endpoint: string, expectedCount: number) {
    const apiCalls = this.networkMonitor.requests.filter(req => 
      req.includes(endpoint)
    );
    
    expect(apiCalls).toHaveLength(expectedCount);
  }
  
  // Helper to verify successful API responses
  expectSuccessfulAPIResponse(endpoint: string) {
    const responses = this.networkMonitor.responses.filter(res => 
      res.url.includes(endpoint) && res.status >= 200 && res.status < 300
    );
    
    expect(responses.length).toBeGreaterThan(0);
  }
  
  // Helper to verify no network errors
  expectNoNetworkErrors() {
    expect(this.networkMonitor.errors).toHaveLength(0);
  }
  
  // Get monitoring data for debugging
  getNetworkSummary() {
    return {
      totalRequests: this.networkMonitor.requests.length,
      totalResponses: this.networkMonitor.responses.length,
      networkErrors: this.networkMonitor.errors.length,
      apiCalls: this.networkMonitor.requests.filter(req => req.includes('/api/')),
      errorResponses: this.networkMonitor.responses.filter(res => res.status >= 400)
    };
  }
  
  getConsoleSummary() {
    return {
      errors: this.consoleMonitor.errors.length,
      warnings: this.consoleMonitor.warnings.length,
      logs: this.consoleMonitor.logs.length,
      recentErrors: this.consoleMonitor.errors.slice(-5),
      recentWarnings: this.consoleMonitor.warnings.slice(-5)
    };
  }
  
  // Reset monitors for new test
  reset() {
    this.networkMonitor = {
      requests: [],
      responses: [],
      errors: []
    };
    
    this.consoleMonitor = {
      errors: [],
      warnings: [],
      logs: []
    };
  }
  
  // Print summary for debugging
  printSummary() {
    console.log('=== Test Monitor Summary ===');
    console.log('Network:', this.getNetworkSummary());
    console.log('Console:', this.getConsoleSummary());
  }
}

// OCR Cache Validation Helper
export class OCRCacheValidator {
  private apiCallCount = 0;
  
  constructor(private page: Page) {
    this.setupCacheMonitoring();
  }
  
  private setupCacheMonitoring() {
    this.page.on('request', (request) => {
      if (request.url().includes('/api/chromatogram/analyze')) {
        this.apiCallCount++;
      }
    });
  }
  
  expectCacheHit() {
    // After first upload, subsequent identical uploads should not trigger API calls
    expect(this.apiCallCount).toBe(1);
  }
  
  expectCacheMiss() {
    // First upload or different file should trigger API call
    expect(this.apiCallCount).toBeGreaterThan(0);
  }
  
  reset() {
    this.apiCallCount = 0;
  }
  
  getCallCount() {
    return this.apiCallCount;
  }
}

// Performance monitoring helper
export class PerformanceMonitor {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  start() {
    this.startTime = Date.now();
  }
  
  expectCompletionWithin(maxTimeMs: number) {
    const elapsed = Date.now() - this.startTime;
    expect(elapsed).toBeLessThan(maxTimeMs);
  }
  
  getElapsedTime() {
    return Date.now() - this.startTime;
  }
}