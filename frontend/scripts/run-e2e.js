#!/usr/bin/env node

/**
 * E2E Test Runner for IntelliLab GC
 * 
 * Provides easy commands to run E2E tests with proper service management
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

class E2ETestRunner {
  constructor() {
    this.processes = [];
    this.isWindows = process.platform === 'win32';
  }

  async checkServices() {
    console.log('🔍 Checking service health...');
    
    try {
      // Check backend
      const backendResponse = await fetch('http://localhost:8000/api/health');
      if (!backendResponse.ok) throw new Error(`Backend returned ${backendResponse.status}`);
      console.log('✅ Backend is healthy');
      
      // Check frontend
      const frontendResponse = await fetch('http://localhost:5173');
      if (!frontendResponse.ok) throw new Error(`Frontend returned ${frontendResponse.status}`);
      console.log('✅ Frontend is healthy');
      
      return true;
    } catch (error) {
      console.log('❌ Services not ready:', error.message);
      return false;
    }
  }

  async startServices() {
    console.log('🚀 Starting services...');
    
    // Start backend
    const backendProcess = spawn(
      this.isWindows ? 'python.exe' : 'python',
      ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000', '--host', '0.0.0.0'],
      {
        cwd: path.join(__dirname, '..', '..', 'backend'),
        stdio: 'pipe',
        shell: this.isWindows
      }
    );
    
    this.processes.push(backendProcess);
    console.log('📡 Backend starting...');
    
    // Start frontend
    const frontendProcess = spawn(
      'npm',
      ['run', 'dev'],
      {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        shell: true
      }
    );
    
    this.processes.push(frontendProcess);
    console.log('🌐 Frontend starting...');
    
    // Wait for services to be ready
    for (let i = 0; i < 30; i++) {
      await this.sleep(2000);
      if (await this.checkServices()) {
        console.log('✅ All services are ready!');
        return true;
      }
      process.stdout.write('.');
    }
    
    throw new Error('Services failed to start within timeout');
  }

  async runTests(options = {}) {
    const {
      suite = 'all',
      headed = false,
      debug = false,
      ui = false,
      reporter = 'html'
    } = options;

    let command = 'npx playwright test';
    
    // Add test suite filter
    if (suite !== 'all') {
      const suiteFiles = {
        'smoke': 'smoke.spec.ts',
        'navigation': 'navigation.spec.ts',
        'ocr': 'ocr-flows.spec.ts',
        'sandbox': 'sandbox.spec.ts',
        'troubleshooter': 'troubleshooter.spec.ts',
        'calculator': 'split-ratio.spec.ts',
        'simulator': 'simulator.spec.ts',
        'workflows': 'exercise-all.spec.ts'
      };
      
      if (suiteFiles[suite]) {
        command += ` ${suiteFiles[suite]}`;
      }
    }
    
    // Add options
    if (headed) command += ' --headed';
    if (debug) command += ' --debug';
    if (ui) command += ' --ui';
    if (reporter !== 'html') command += ` --reporter=${reporter}`;
    
    console.log(`🧪 Running E2E tests: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: path.join(__dirname, '..')
      });
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.log('✅ Tests completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      return false;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    for (const process of this.processes) {
      if (process && !process.killed) {
        process.kill();
      }
    }
    
    this.processes = [];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new E2ETestRunner();
  
  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal');
    await runner.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await runner.cleanup();
    process.exit(0);
  });

  try {
    // Parse command line arguments
    const options = {
      suite: 'all',
      headed: args.includes('--headed'),
      debug: args.includes('--debug'),
      ui: args.includes('--ui'),
      startServices: args.includes('--start-services'),
      reporter: args.find(arg => arg.startsWith('--reporter='))?.split('=')[1] || 'html'
    };
    
    // Extract suite name
    const suiteArg = args.find(arg => !arg.startsWith('--'));
    if (suiteArg) options.suite = suiteArg;
    
    // Check if services are running
    const servicesReady = await runner.checkServices();
    
    if (!servicesReady) {
      if (options.startServices) {
        await runner.startServices();
      } else {
        console.log('❌ Services are not running. Start them manually or use --start-services flag');
        console.log('');
        console.log('Manual startup:');
        console.log('  Backend: cd backend && python -m uvicorn main:app --reload --port 8000');
        console.log('  Frontend: cd frontend && npm run dev');
        console.log('');
        console.log('Or use: npm run test:e2e:auto (starts services automatically)');
        process.exit(1);
      }
    }
    
    // Run tests
    const success = await runner.runTests(options);
    
    if (options.startServices) {
      await runner.cleanup();
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    await runner.cleanup();
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
IntelliLab GC E2E Test Runner

Usage:
  node run-e2e.js [suite] [options]

Test Suites:
  all           Run all test suites (default)
  smoke         Basic health checks
  navigation    Navigation and routing
  ocr           OCR workflow tests
  sandbox       Sandbox environment tests
  troubleshooter AI troubleshooting tests
  calculator    Split ratio calculator tests
  simulator     Chromatogram simulator tests
  workflows     Complete end-to-end workflows

Options:
  --headed           Run tests in headed mode (show browser)
  --debug            Run tests with debugger
  --ui               Run tests in interactive UI mode
  --start-services   Automatically start backend/frontend services
  --reporter=FORMAT  Test reporter (html, json, junit)
  --help, -h         Show this help

Examples:
  node run-e2e.js                           # Run all tests (services must be running)
  node run-e2e.js smoke --headed            # Run smoke tests in headed mode
  node run-e2e.js ocr --debug               # Debug OCR workflow tests
  node run-e2e.js --start-services          # Run all tests, starting services automatically
  node run-e2e.js workflows --ui            # Run workflow tests in interactive mode

Note: Backend and Frontend services must be running unless --start-services is used.
`);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = E2ETestRunner;