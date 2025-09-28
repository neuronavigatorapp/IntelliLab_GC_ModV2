#!/usr/bin/env node

/**
 * Mock Refresh Tool
 * 
 * Fetches fresh data from real API endpoints and updates mock fixtures.
 * Sanitizes sensitive data and maintains consistent test data structure.
 * 
 * Usage:
 *   npm run mocks:refresh              # Refresh all mock data
 *   npm run mocks:refresh -- --dry-run # Preview changes without writing
 *   npm run mocks:refresh -- --endpoint health # Refresh specific endpoint
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:8000',
  mockDir: path.join(__dirname, '../tests/fixtures/api'),
  timeout: 10000,
  retries: 3,
  delay: 1000
};

// Mock endpoints configuration
const ENDPOINTS = {
  health: {
    url: '/api/health',
    method: 'GET',
    fixture: 'health-response.json',
    sanitize: (data) => ({
      ...data,
      timestamp: '2024-01-15T10:00:00.000Z', // Fixed timestamp for consistency
      version: data.version || '1.0.0'
    })
  },

  splitRatio: {
    url: '/api/split-ratio',
    method: 'POST',
    fixture: 'split-ratio-response.json',
    body: {
      inlet_temp: 250,
      column_length: 30,
      column_diameter: 0.25,
      film_thickness: 0.25,
      carrier_gas: 'helium',
      flow_rate: 1.0
    },
    sanitize: (data) => ({
      ...data,
      timestamp: '2024-01-15T10:00:00.000Z',
      calculation_id: 'mock-calc-123', // Fixed ID for consistency
      request_id: undefined // Remove dynamic request IDs
    })
  },

  ocrAnalyze: {
    url: '/api/ocr/analyze',
    method: 'POST',
    fixture: 'ocr-analyze-response.json',
    multipart: true,
    body: {
      image: 'sample-chromatogram.png', // Will use test image
      analysis_type: 'full',
      confidence_threshold: 0.8
    },
    sanitize: (data) => ({
      ...data,
      timestamp: '2024-01-15T10:00:00.000Z',
      processing_time_ms: 1234, // Fixed processing time
      request_id: undefined,
      image_hash: 'mock-hash-abc123' // Fixed hash for consistency
    })
  },

  chromatogramGenerate: {
    url: '/api/chromatogram/generate',
    method: 'POST',
    fixture: 'chromatogram-generate-response.json',
    body: {
      compounds: [
        { name: 'methane', retention_time: 2.1, peak_area: 1000 },
        { name: 'ethane', retention_time: 3.5, peak_area: 800 },
        { name: 'propane', retention_time: 5.2, peak_area: 600 }
      ],
      conditions: {
        temperature: 80,
        pressure: 15,
        flow_rate: 1.0
      }
    },
    sanitize: (data) => ({
      ...data,
      timestamp: '2024-01-15T10:00:00.000Z',
      generation_id: 'mock-gen-456',
      processing_time_ms: 567
    })
  }
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

// Fetch with retry logic
async function fetchWithRetry(url, options = {}) {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
    try {
      log(`🔄 Attempt ${attempt}/${CONFIG.retries}: ${options.method || 'GET'} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

      const response = await fetch(`${CONFIG.baseUrl}${url}`, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      lastError = error;
      log(`❌ Attempt ${attempt} failed: ${error.message}`, 'warning');

      if (attempt < CONFIG.retries) {
        const delay = CONFIG.delay * Math.pow(2, attempt - 1);
        log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// Create multipart form data for file uploads
async function createMultipartBody(body) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();

  for (const [key, value] of Object.entries(body)) {
    if (key === 'image' && typeof value === 'string') {
      // Create a minimal test image buffer
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      form.append(key, testImageBuffer, { filename: value, contentType: 'image/png' });
    } else {
      form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  return form;
}

// Refresh a single endpoint
async function refreshEndpoint(name, config, options = {}) {
  try {
    log(`📡 Refreshing ${name} endpoint...`);

    let fetchOptions = {
      method: config.method,
      headers: {
        'Accept': 'application/json'
      }
    };

    // Prepare request body
    if (config.body) {
      if (config.multipart) {
        const form = await createMultipartBody(config.body);
        fetchOptions.body = form;
        fetchOptions.headers = {
          ...fetchOptions.headers,
          ...form.getHeaders()
        };
      } else {
        fetchOptions.body = JSON.stringify(config.body);
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    // Fetch data from real API
    const data = await fetchWithRetry(config.url, fetchOptions);

    // Sanitize the response
    const sanitizedData = config.sanitize ? config.sanitize(data) : data;

    // Prepare file path
    const fixturePath = path.join(CONFIG.mockDir, config.fixture);

    if (options.dryRun) {
      log(`📄 [DRY RUN] Would write to: ${fixturePath}`);
      log(`📄 [DRY RUN] Data preview:`, 'info');
      console.log(JSON.stringify(sanitizedData, null, 2).substring(0, 500) + '...');
      return { success: true, path: fixturePath, data: sanitizedData };
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(fixturePath), { recursive: true });

    // Write sanitized data to fixture file
    await fs.writeFile(fixturePath, JSON.stringify(sanitizedData, null, 2));

    log(`✅ Updated: ${config.fixture}`, 'success');
    return { success: true, path: fixturePath, data: sanitizedData };

  } catch (error) {
    log(`❌ Failed to refresh ${name}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  let targetEndpoint = null;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--endpoint' && i + 1 < args.length) {
      targetEndpoint = args[i + 1];
      i++; // Skip next argument
    }
  }

  log('🚀 Mock Refresh Tool Starting...', 'info');
  log(`📍 API Base URL: ${CONFIG.baseUrl}`);
  log(`📁 Mock Directory: ${CONFIG.mockDir}`);

  if (options.dryRun) {
    log('🔍 DRY RUN MODE - No files will be modified', 'warning');
  }

  // Determine which endpoints to refresh
  const endpointsToRefresh = targetEndpoint
    ? { [targetEndpoint]: ENDPOINTS[targetEndpoint] }
    : ENDPOINTS;

  if (targetEndpoint && !ENDPOINTS[targetEndpoint]) {
    log(`❌ Unknown endpoint: ${targetEndpoint}`, 'error');
    log(`Available endpoints: ${Object.keys(ENDPOINTS).join(', ')}`);
    process.exit(1);
  }

  // Check if API is available
  try {
    log('🔍 Checking API availability...');
    await fetchWithRetry('/api/health');
    log('✅ API is accessible', 'success');
  } catch (error) {
    log(`❌ API not accessible: ${error.message}`, 'error');
    log('💡 Make sure the backend is running on ' + CONFIG.baseUrl);
    process.exit(1);
  }

  // Refresh endpoints
  const results = [];
  for (const [name, config] of Object.entries(endpointsToRefresh)) {
    const result = await refreshEndpoint(name, config, options);
    results.push({ name, ...result });

    // Brief pause between requests
    await sleep(500);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log('\n📊 Refresh Summary:', 'info');
  log(`✅ Successful: ${successful}`);
  log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    log('\n❌ Failed endpoints:', 'error');
    results.filter(r => !r.success).forEach(r => {
      log(`   ${r.name}: ${r.error}`);
    });
  }

  if (successful > 0 && !options.dryRun) {
    log('\n💡 Next steps:', 'info');
    log('   1. Review updated fixtures for accuracy');
    log('   2. Run tests: npm run test:e2e');
    log('   3. Commit updated mock data if tests pass');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Mock refresh interrupted', 'warning');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`💥 Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { refreshEndpoint, ENDPOINTS, CONFIG };