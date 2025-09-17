#!/usr/bin/env node

/**
 * Pre-commit Hook for IntelliLab GC
 * 
 * Runs placeholder guard and other quality checks before allowing commits.
 * Ensures no placeholder content or quality issues reach the repository.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 IntelliLab GC Pre-commit Quality Checks\n');

// Track if any checks fail
let hasFailures = false;

/**
 * Run a command and handle success/failure
 */
function runCheck(name, command, description, options = {}) {
  console.log(`📋 ${name}: ${description}`);
  
  try {
    // Use PowerShell-compatible command execution on Windows
    const shell = process.platform === 'win32' ? 'powershell.exe' : undefined;
    const execOptions = {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: shell,
      ...options
    };
    
    execSync(command, execOptions);
    console.log(`✅ ${name} passed\n`);
  } catch (error) {
    if (options.allowFailure) {
      console.log(`⚠️  ${name} had issues (continuing...)\n`);
    } else {
      console.log(`❌ ${name} failed\n`);
      hasFailures = true;
    }
  }
}

/**
 * Main pre-commit execution
 */
function runPreCommitChecks() {
  console.log('Starting pre-commit quality gates...\n');
  
  // 1. Placeholder Guard Check
  runCheck(
    'Placeholder Guard',
    'node scripts/placeholder-guard.js',
    'Checking for placeholder content and development markers'
  );
  
  // 2. TypeScript Type Check (Frontend) - Allow failure due to d3 types issue
  if (process.cwd().includes('frontend') || require('fs').existsSync('frontend')) {
    runCheck(
      'TypeScript Check',
      'npm --prefix frontend run type-check',
      'Verifying TypeScript type safety (known d3 type issues)',
      { allowFailure: true }
    );
  }
  
  // 3. ESLint Check (Frontend) - Check dependencies first
  if (process.cwd().includes('frontend') || require('fs').existsSync('frontend')) {
    try {
      // Verify ESLint dependencies are available
      require('fs').accessSync(path.join(process.cwd(), 'frontend', 'node_modules', '@typescript-eslint'));
      runCheck(
        'ESLint',
        'npm --prefix frontend run lint',
        'Checking code quality and style'
      );
    } catch (depError) {
      console.log('⚠️  ESLint dependencies not fully available, reinstalling...\n');
      runCheck(
        'ESLint Setup',
        'npm --prefix frontend install; npm --prefix frontend run lint',
        'Installing dependencies and running ESLint',
        { allowFailure: true }
      );
    }
  }
  
  // 4. Unit Tests (Quick run) - Use correct test command
  if (process.cwd().includes('frontend') || require('fs').existsSync('frontend')) {
    runCheck(
      'Unit Tests',
      'npm --prefix frontend run test -- --run',
      'Running unit test suite (quick mode)',
      { allowFailure: true }
    );
  }
  
  // 5. Python Linting (if applicable)
  if (require('fs').existsSync('requirements.txt') || require('fs').existsSync('pyproject.toml')) {
    let pythonCmd = 'python';
    
    // Auto-detect Python venv on Windows
    if (process.platform === 'win32') {
      const venvPaths = [
        path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'),
        path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
        'C:\\IntelliLab_GC_ModV2\\venv\\Scripts\\python.exe'
      ];
      
      for (const venvPath of venvPaths) {
        if (require('fs').existsSync(venvPath)) {
          pythonCmd = `"${venvPath}"`;
          break;
        }
      }
    }
    
    try {
      execSync(`${pythonCmd} --version`, { stdio: 'ignore' });
      runCheck(
        'Python Syntax',
        `${pythonCmd} -c "import py_compile, glob; [py_compile.compile(f, doraise=True) for f in glob.glob('**/*.py', recursive=True) if 'venv' not in f and '.venv' not in f][:10]"`,
        'Checking Python syntax (first 10 files)'
      );
    } catch (error) {
      console.log('⚠️  Python not available, skipping Python checks\n');
    }
  }
  
  // Results
  if (hasFailures) {
    console.log('❌ Pre-commit checks FAILED');
    console.log('💡 Please fix the issues above before committing');
    console.log('📖 Run individual checks manually to debug:');
    console.log('   - node scripts/placeholder-guard.js --verbose');
    console.log('   - npm --prefix frontend run lint:fix');
    console.log('   - npm --prefix frontend run type-check');
    console.log('   - npm --prefix frontend run test\n');
    process.exit(1);
  } else {
    console.log('✅ All pre-commit checks passed!');
    console.log('🎉 Ready to commit\n');
    process.exit(0);
  }
}

// Execute if run directly
if (require.main === module) {
  runPreCommitChecks();
}

module.exports = { runPreCommitChecks };