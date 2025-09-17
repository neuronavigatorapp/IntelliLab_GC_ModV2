// src/setupTests.ts
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for JSDOM environment (needed for chart components)
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  private callback: ResizeObserverCallback;
  
  observe(target: Element, _options?: ResizeObserverOptions) {
    // Mock implementation - call callback with minimal data
    setTimeout(() => {
      this.callback([{
        target,
        contentRect: {
          x: 0, y: 0, width: 800, height: 600,
          top: 0, left: 0, bottom: 600, right: 800, toJSON: () => ({})
        },
        borderBoxSize: [{
          inlineSize: 800,
          blockSize: 600
        }] as any,
        contentBoxSize: [{
          inlineSize: 800, 
          blockSize: 600
        }] as any,
        devicePixelContentBoxSize: [{
          inlineSize: 800,
          blockSize: 600  
        }] as any
      }], this);
    }, 0);
  }
  
  unobserve(_target: Element) {}
  disconnect() {}
};

// Mock IntersectionObserver (may also be needed for some chart libraries)
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }
  
  private callback: IntersectionObserverCallback;
  
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
};
