#!/usr/bin/env node
/**
 * ESLint Warning Baseline Enforcer
 * 
 * This script ensures that the number of ESLint warnings does not increase
 * beyond the established baseline of 113 warnings.
 * 
 * Usage: node .eslint-baseline.js
 * Exit codes:
 * - 0: Success (warnings <= baseline)
 * - 1: Failure (warnings > baseline or errors found)
 */

const { execSync } = require('child_process');
const path = require('path');

const BASELINE_WARNINGS = 113;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

function runESLint() {
  try {
    console.log('🔍 Running ESLint with warning baseline enforcement...');
    
    // Change to frontend directory and run ESLint
    const command = 'npx eslint src --ext .ts,.tsx --format=compact';
    const output = execSync(command, { 
      cwd: FRONTEND_DIR, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return { output, exitCode: 0 };
  } catch (error) {
    // ESLint returns non-zero exit code when there are errors or warnings
    return { 
      output: error.stdout || error.message, 
      exitCode: error.status || 1,
      stderr: error.stderr 
    };
  }
}

function analyzeOutput(output) {
  if (!output) return { errors: 0, warnings: 0 };
  
  const lines = output.split('\n').filter(line => line.trim());
  let errors = 0;
  let warnings = 0;
  
  for (const line of lines) {
    if (line.includes(', Error -')) {
      errors++;
    } else if (line.includes(', Warning -')) {
      warnings++;
    }
  }
  
  return { errors, warnings };
}

function main() {
  console.log(`📊 ESLint Baseline Enforcer - Target: ${BASELINE_WARNINGS} warnings maximum`);
  console.log('=' .repeat(60));
  
  const { output, exitCode } = runESLint();
  const { errors, warnings } = analyzeOutput(output);
  
  console.log(`\n📋 Results:`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings} (baseline: ${BASELINE_WARNINGS})`);
  
  // Check for errors first - these are always failures
  if (errors > 0) {
    console.log(`\n❌ FAILED: Found ${errors} ESLint errors`);
    console.log('🔧 Fix all errors before proceeding');
    if (output) {
      console.log('\n📝 Error details:');
      console.log(output);
    }
    process.exit(1);
  }
  
  // Check warnings against baseline
  if (warnings > BASELINE_WARNINGS) {
    const increase = warnings - BASELINE_WARNINGS;
    console.log(`\n❌ FAILED: Warnings increased by ${increase}`);
    console.log(`   Current: ${warnings} | Baseline: ${BASELINE_WARNINGS}`);
    console.log('🎯 Goal: Keep warnings from increasing. Fix new warnings or update baseline.');
    
    if (output) {
      console.log('\n📝 Recent warnings (showing last 10):');
      const warningLines = output.split('\n').filter(line => line.includes('Warning')).slice(-10);
      warningLines.forEach(line => console.log(`   ${line}`));
    }
    
    process.exit(1);
  }
  
  // Success cases
  if (warnings < BASELINE_WARNINGS) {
    const improvement = BASELINE_WARNINGS - warnings;
    console.log(`\n🎉 SUCCESS: Warnings reduced by ${improvement}!`);
    console.log(`   Current: ${warnings} | Previous baseline: ${BASELINE_WARNINGS}`);
    console.log('💡 Consider updating baseline to lock in this improvement');
  } else {
    console.log(`\n✅ SUCCESS: Warnings at baseline (${warnings})`);
  }
  
  console.log('\n🚀 ESLint baseline check passed - ready to proceed');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { runESLint, analyzeOutput, BASELINE_WARNINGS };