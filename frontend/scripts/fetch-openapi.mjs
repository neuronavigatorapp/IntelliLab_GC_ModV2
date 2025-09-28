#!/usr/bin/env node

/**
 * OpenAPI Schema Fetcher
 * 
 * Fetches the OpenAPI JSON schema from the running backend and saves it
 * to tests/contracts/openapi.json for contract validation.
 * 
 * Usage: node scripts/fetch-openapi.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const OUTPUT_PATH = join(__dirname, '..', 'tests', 'contracts', 'openapi.json');

async function fetchOpenAPISchema() {
  try {
    console.log(`🔍 Fetching OpenAPI schema from ${BACKEND_URL}/openapi.json...`);

    const response = await fetch(`${BACKEND_URL}/openapi.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const schema = await response.json();

    console.log(`📥 Received schema with ${Object.keys(schema).length} top-level keys`);

    // Ensure output directory exists
    console.log(`📁 Creating directory: ${dirname(OUTPUT_PATH)}`);
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

    // Write schema to file with pretty formatting
    console.log(`💾 Writing schema to: ${OUTPUT_PATH}`);
    writeFileSync(OUTPUT_PATH, JSON.stringify(schema, null, 2));

    console.log(`✅ OpenAPI schema saved to ${OUTPUT_PATH}`);
    console.log(`📊 Found ${Object.keys(schema.paths || {}).length} API paths`);

    // Log some key endpoints for verification
    const paths = Object.keys(schema.paths || {});
    const keyEndpoints = paths.filter(path =>
      path.includes('/health') ||
      path.includes('/split-ratio') ||
      path.includes('/chromatogram')
    );

    if (keyEndpoints.length > 0) {
      console.log('🔑 Key endpoints found:', keyEndpoints);
    }

    return schema;

  } catch (error) {
    console.error('❌ Failed to fetch OpenAPI schema:', error.message);
    console.error('🔍 Error details:', error);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure the backend is running on', BACKEND_URL);
      console.error('   Start with: cd backend && python -m uvicorn main:app --reload --port 8000');
    }

    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOpenAPISchema().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { fetchOpenAPISchema };