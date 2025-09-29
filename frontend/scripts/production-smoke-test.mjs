#!/usr/bin/env node
/**
 * Production Smoke Test Suite
 * Tests IntelliLab GC production deployment health
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production URLs - UPDATE THESE WITH ACTUAL PRODUCTION DEPLOYMENT URLS
const PRODUCTION_CONFIG = {
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://your-production-domain.com',
    BACKEND_URL: process.env.BACKEND_URL || 'https://api.your-production-domain.com',
    TIMEOUT: 30000
};

console.log('🚀 IntelliLab GC Production Smoke Test Suite');
console.log('='.repeat(50));
console.log(`Frontend: ${PRODUCTION_CONFIG.FRONTEND_URL}`);
console.log(`Backend: ${PRODUCTION_CONFIG.BACKEND_URL}`);
console.log('='.repeat(50));

/**
 * Test production backend health endpoint
 */
async function testBackendHealth() {
    console.log('🔍 Testing backend health endpoint...');

    try {
        const response = await fetch(`${PRODUCTION_CONFIG.BACKEND_URL}/api/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(PRODUCTION_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'healthy') {
            console.log('✅ Backend health check PASSED');
            console.log(`   Service: ${data.service}`);
            return true;
        } else {
            console.log('❌ Backend health check FAILED');
            console.log(`   Response: ${JSON.stringify(data)}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend health check FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test production frontend availability
 */
async function testFrontendAvailability() {
    console.log('🌐 Testing frontend availability...');

    try {
        const response = await fetch(PRODUCTION_CONFIG.FRONTEND_URL, {
            method: 'GET',
            headers: { 'Accept': 'text/html' },
            signal: AbortSignal.timeout(PRODUCTION_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Check for key indicators of successful frontend deployment
        const indicators = [
            'IntelliLab GC',
            'react',
            'viewport'
        ];

        const foundIndicators = indicators.filter(indicator =>
            html.toLowerCase().includes(indicator.toLowerCase())
        );

        if (foundIndicators.length >= 2) {
            console.log('✅ Frontend availability check PASSED');
            console.log(`   Found indicators: ${foundIndicators.join(', ')}`);
            return true;
        } else {
            console.log('❌ Frontend availability check FAILED');
            console.log('   Missing key frontend indicators');
            return false;
        }
    } catch (error) {
        console.log('❌ Frontend availability check FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test critical API endpoints
 */
async function testCriticalAPIs() {
    console.log('🔧 Testing critical API endpoints...');

    const results = {};

    // Test OpenAPI docs endpoint
    try {
        const response = await fetch(`${PRODUCTION_CONFIG.BACKEND_URL}/openapi.json`, {
            signal: AbortSignal.timeout(PRODUCTION_CONFIG.TIMEOUT)
        });
        results.openapi = response.ok;
        console.log(`   OpenAPI docs: ${response.ok ? '✅' : '❌'}`);
    } catch {
        results.openapi = false;
        console.log('   OpenAPI docs: ❌');
    }

    // Test docs UI endpoint  
    try {
        const response = await fetch(`${PRODUCTION_CONFIG.BACKEND_URL}/docs`, {
            signal: AbortSignal.timeout(PRODUCTION_CONFIG.TIMEOUT)
        });
        results.docs = response.ok;
        console.log(`   Docs UI: ${response.ok ? '✅' : '❌'}`);
    } catch {
        results.docs = false;
        console.log('   Docs UI: ❌');
    }

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    console.log(`📊 API endpoints: ${passed}/${total} passed`);
    return passed === total;
}

/**
 * Run comprehensive production smoke tests
 */
async function runProductionSmokeTests() {
    const startTime = Date.now();
    console.log(`⏰ Starting production smoke tests at ${new Date().toISOString()}`);
    console.log('');

    const results = {
        backendHealth: await testBackendHealth(),
        frontendAvailability: await testFrontendAvailability(),
        criticalAPIs: await testCriticalAPIs()
    };

    console.log('');
    console.log('📋 PRODUCTION SMOKE TEST RESULTS');
    console.log('='.repeat(50));

    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(Boolean);
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('');
    console.log(`🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`🏷️  Version: v1.1.0`);
    console.log(`📅 Tested: ${new Date().toISOString()}`);

    // Update production deployment report
    const reportPath = join(__dirname, '..', 'PRODUCTION_DEPLOYMENT_REPORT.md');
    const reportUpdate = `

## 🔥 Production Smoke Test Results

**Execution Time**: ${new Date().toISOString()}  
**Duration**: ${duration}s  
**Frontend URL**: ${PRODUCTION_CONFIG.FRONTEND_URL}  
**Backend URL**: ${PRODUCTION_CONFIG.BACKEND_URL}  

### Test Results
| Test | Status | Details |
|------|--------|---------|
| Backend Health | ${results.backendHealth ? '✅ PASSED' : '❌ FAILED'} | Health endpoint responding |
| Frontend Availability | ${results.frontendAvailability ? '✅ PASSED' : '❌ FAILED'} | Frontend loading successfully |
| Critical APIs | ${results.criticalAPIs ? '✅ PASSED' : '❌ FAILED'} | OpenAPI docs and UI accessible |

### 🎯 Production Validation
**Status**: ${allPassed ? '✅ **PRODUCTION DEPLOYMENT SUCCESSFUL**' : '❌ **PRODUCTION DEPLOYMENT ISSUES DETECTED**'}

${allPassed ?
            'All production smoke tests passed. The IntelliLab GC application is successfully deployed and operational.' :
            'Some production smoke tests failed. Review the issues above and redeploy as necessary.'}

---
*Production validation completed by automated smoke test suite*
`;

    try {
        const fs = await import('fs');
        fs.appendFileSync(reportPath, reportUpdate);
        console.log(`📄 Results appended to: ${reportPath}`);
    } catch (error) {
        console.log(`⚠️  Could not update report: ${error.message}`);
    }

    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
}

/**
 * Show usage instructions if URLs not configured
 */
function showUsageInstructions() {
    console.log('');
    console.log('🔧 SETUP INSTRUCTIONS');
    console.log('='.repeat(50));
    console.log('To run production smoke tests, set environment variables:');
    console.log('');
    console.log('  export FRONTEND_URL="https://your-production-domain.com"');
    console.log('  export BACKEND_URL="https://api.your-production-domain.com"');
    console.log('  node scripts/production-smoke-test.mjs');
    console.log('');
    console.log('Or run with inline variables:');
    console.log('  FRONTEND_URL="https://..." BACKEND_URL="https://..." node scripts/production-smoke-test.mjs');
    console.log('');
    console.log('📋 This script will test:');
    console.log('  ✅ Backend health endpoint');
    console.log('  ✅ Frontend availability');
    console.log('  ✅ Critical API endpoints');
    console.log('  ✅ Update production deployment report');
    console.log('');
}

// Main execution
if (PRODUCTION_CONFIG.FRONTEND_URL.includes('your-production-domain') ||
    PRODUCTION_CONFIG.BACKEND_URL.includes('your-production-domain')) {
    console.log('⚠️  Production URLs not configured');
    showUsageInstructions();
    process.exit(1);
} else {
    runProductionSmokeTests().catch(error => {
        console.error('💥 Production smoke tests failed:', error);
        process.exit(1);
    });
}