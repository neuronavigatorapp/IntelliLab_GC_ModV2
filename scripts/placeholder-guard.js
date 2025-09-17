#!/usr/bin/env node

/**
 * Placeholder Data Guard
 * 
 * Scans codebase for banned placeholder tokens and fails if found in production code.
 * Part of the IntelliLab GC hardening process to ensure no placeholder content
 * reaches production.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const BANNED_TOKENS = [
  'lorem ipsum',
  'lorem',
  'placeholder',
  'demo data',
  'demo',
  'mock data',
  'mock',
  'sample data', 
  'sample',
  'todo:',
  'fixme:',
  'hack:',
  'temporary',
  'test data',
  'dummy data',
  'dummy'
];

const CASE_SENSITIVE_TOKENS = [
  'TODO',
  'FIXME', 
  'HACK',
  'XXX',
  'TEMP',
  'TEMPORARY'
];

// Files and directories to exclude from checks
const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/tests/**',
  '**/test/**',
  '**/__tests__/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/*.md',
  '**/*.txt',
  '**/README*',
  '**/CHANGELOG*',
  '**/LICENSE*',
  '**/docs/**',
  '**/scripts/**',
  '**/.git/**',
  '**/.vscode/**',
  '**/.idea/**',
  '**/logs/**',
  '**/temp/**',
  '**/tmp/**'
];

// File extensions to scan
const INCLUDED_EXTENSIONS = [
  '.ts',
  '.tsx', 
  '.js',
  '.jsx',
  '.py',
  '.html',
  '.css',
  '.scss',
  '.json',
  '.yml',
  '.yaml'
];

class PlaceholderGuard {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.verbose = options.verbose || false;
    this.failFast = options.failFast || false;
    this.violations = [];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 IntelliLab GC Placeholder Guard - Scanning for banned tokens...\n');
    
    try {
      const files = await this.findFilesToScan();
      console.log(`📁 Scanning ${files.length} files for placeholder content...\n`);
      
      for (const file of files) {
        await this.scanFile(file);
        
        if (this.failFast && this.violations.length > 0) {
          break;
        }
      }
      
      await this.reportResults();
      
      if (this.violations.length > 0) {
        process.exit(1);
      } else {
        console.log('✅ All checks passed! No placeholder content detected.\n');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Placeholder guard failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find all files to scan based on inclusion/exclusion patterns
   */
  async findFilesToScan() {
    const allFiles = [];
    
    // Find files by extension
    for (const ext of INCLUDED_EXTENSIONS) {
      const pattern = `**/*${ext}`;
      const files = await glob(pattern, {
        cwd: this.rootPath,
        ignore: EXCLUDED_PATTERNS,
        absolute: true
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  /**
   * Scan a single file for banned tokens
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = path.relative(this.rootPath, filePath);
      
      if (this.verbose) {
        console.log(`📄 Scanning: ${relativePath}`);
      }
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const lowerLine = line.toLowerCase();
        
        // Check case-insensitive tokens
        BANNED_TOKENS.forEach(token => {
          if (lowerLine.includes(token.toLowerCase())) {
            this.addViolation({
              file: relativePath,
              line: lineNumber,
              token: token,
              content: line.trim(),
              type: 'placeholder'
            });
          }
        });
        
        // Check case-sensitive tokens  
        CASE_SENSITIVE_TOKENS.forEach(token => {
          if (line.includes(token)) {
            this.addViolation({
              file: relativePath,
              line: lineNumber,
              token: token,
              content: line.trim(),
              type: 'development'
            });
          }
        });
      });
      
    } catch (error) {
      console.warn(`⚠️  Warning: Could not scan ${filePath}: ${error.message}`);
    }
  }

  /**
   * Add a violation to the results
   */
  addViolation(violation) {
    this.violations.push(violation);
    
    if (this.verbose) {
      console.log(`🚫 ${violation.file}:${violation.line} - Found '${violation.token}'`);
    }
  }

  /**
   * Report scan results
   */
  async reportResults() {
    if (this.violations.length === 0) {
      return;
    }
    
    console.log(`\n❌ Found ${this.violations.length} placeholder/development token violations:\n`);
    
    // Group violations by file
    const violationsByFile = {};
    this.violations.forEach(violation => {
      if (!violationsByFile[violation.file]) {
        violationsByFile[violation.file] = [];
      }
      violationsByFile[violation.file].push(violation);
    });
    
    // Report violations by file
    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`📁 ${file}:`);
      violations.forEach(violation => {
        const typeIcon = violation.type === 'placeholder' ? '🎭' : '🔧';
        console.log(`  ${typeIcon} Line ${violation.line}: "${violation.token}" found`);
        console.log(`     Content: ${violation.content}`);
      });
      console.log('');
    });
    
    // Provide remediation guidance
    console.log('🔧 Remediation Steps:');
    console.log('1. Replace placeholder text with actual content');
    console.log('2. Remove TODO/FIXME comments or implement the functionality');
    console.log('3. Replace demo/mock data with real data or proper empty states');
    console.log('4. Update sample content with production-ready text\n');
    
    console.log('ℹ️  Note: Test files, documentation, and development tools are excluded from this check.');
  }

  /**
   * Generate a report file
   */
  async generateReport() {
    if (this.violations.length === 0) {
      return;
    }
    
    const reportPath = path.join(this.rootPath, 'placeholder-guard-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      violations: this.violations,
      summary: {
        totalViolations: this.violations.length,
        fileCount: new Set(this.violations.map(v => v.file)).size,
        tokenCounts: {}
      }
    };
    
    // Count occurrences of each token
    this.violations.forEach(violation => {
      if (!report.summary.tokenCounts[violation.token]) {
        report.summary.tokenCounts[violation.token] = 0;
      }
      report.summary.tokenCounts[violation.token]++;
    });
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed report saved to: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    failFast: args.includes('--fail-fast'),
    rootPath: process.cwd()
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
IntelliLab GC Placeholder Guard

Usage: node placeholder-guard.js [options]

Options:
  --verbose, -v     Show detailed scanning information
  --fail-fast       Stop on first violation found
  --help, -h        Show this help message

Description:
  Scans the codebase for banned placeholder tokens and development markers.
  Fails if any are found in production code to ensure release readiness.
  
Banned tokens include:
  - lorem ipsum, placeholder, demo, mock, sample
  - TODO, FIXME, HACK, XXX markers
  - test data, dummy data references
  
Excluded from scanning:
  - Test files (*.test.*, *.spec.*)
  - Documentation (*.md, README*, docs/)
  - Build artifacts (dist/, build/, node_modules/)
  - Development tools and configuration
`);
    process.exit(0);
  }
  
  const guard = new PlaceholderGuard(options);
  guard.execute();
}

module.exports = PlaceholderGuard;