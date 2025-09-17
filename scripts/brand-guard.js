#!/usr/bin/env node

/**
 * Brand Guard - CI Script to prevent third-party brand names
 * Exits with error code 1 if any forbidden brand terms are found
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Forbidden brand terms that should not appear in code
const FORBIDDEN_TERMS = [
  // Instrument manufacturers
  'Agilent',
  'Shimadzu', 
  'Thermo Fisher', 'ThermoFisher',
  'Waters',
  'PerkinElmer',
  
  // Column brand patterns (regex patterns)
  'DB-[0-9]',
  'HP-[0-9]',
  'RXi-',
  'ZB-',
  
  // Specific product names
  'Innowax',
  'Stabilwax',
  'Supelcowax',
  'PLOT Q',
  'PLOT U',
  
  // Model numbers
  '355 SCD',
  '8355 SCD', 
  '7890A',
  '7890B',
  '8890',
  'GC-2030',
  'GC-2014',
  'TRACE 1310'
];

// File patterns to scan
const SCAN_PATTERNS = [
  'frontend/src/**/*.{ts,tsx,js,jsx}',
  'backend/**/*.py',
  'tools/**/*.py',
  '*.py',
  '*.md',
  '*.json',
  '*.yml',
  '*.yaml'
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '__pycache__',
  '.pytest_cache',
  'coverage',
  'BRAND_SCRUB_REPORT.md',  // This file documents the brands
  'scripts/brand-guard.js'   // This file lists the brands
];

class BrandGuard {
  constructor() {
    this.violations = [];
    this.verbose = process.argv.includes('--verbose');
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        FORBIDDEN_TERMS.forEach(term => {
          const regex = new RegExp(term, 'gi');
          const matches = line.match(regex);
          
          if (matches) {
            matches.forEach(match => {
              this.violations.push({
                file: filePath,
                line: lineNumber + 1,
                term: match,
                context: line.trim()
              });
            });
          }
        });
      });
    } catch (error) {
      if (this.verbose) {
        console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      }
    }
  }

  shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => 
      filePath.includes(pattern) || 
      path.basename(filePath).startsWith('.')
    );
  }

  getAllFiles() {
    const files = new Set();
    
    // Use git to find tracked files if available
    try {
      const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim());
      
      gitFiles.forEach(file => {
        if (!this.shouldExcludeFile(file)) {
          files.add(file);
        }
      });
      
      this.log(`Found ${files.size} files via git ls-files`);
    } catch (error) {
      this.log('Git not available, falling back to filesystem scan');
      
      // Fallback: recursive filesystem scan
      const scanDir = (dir) => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          
          entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            
            if (this.shouldExcludeFile(fullPath)) {
              return;
            }
            
            if (entry.isDirectory()) {
              scanDir(fullPath);
            } else if (entry.isFile()) {
              files.add(fullPath);
            }
          });
        } catch (error) {
          // Skip directories we can't read
        }
      };
      
      scanDir('.');
    }
    
    return Array.from(files);
  }

  run() {
    console.log('🔍 Brand Guard: Scanning for third-party brand references...');
    
    const files = this.getAllFiles();
    this.log(`Scanning ${files.length} files...`);
    
    files.forEach(file => {
      this.log(`Scanning: ${file}`);
      this.scanFile(file);
    });
    
    if (this.violations.length === 0) {
      console.log('✅ Brand Guard: No forbidden brand terms found');
      return 0;
    }
    
    console.error(`❌ Brand Guard: Found ${this.violations.length} brand violations:`);
    console.error('');
    
    // Group violations by file
    const violationsByFile = {};
    this.violations.forEach(violation => {
      if (!violationsByFile[violation.file]) {
        violationsByFile[violation.file] = [];
      }
      violationsByFile[violation.file].push(violation);
    });
    
    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.error(`📁 ${file}:`);
      violations.forEach(violation => {
        console.error(`   Line ${violation.line}: "${violation.term}" in "${violation.context}"`);
      });
      console.error('');
    });
    
    console.error('Please replace these brand terms with neutral alternatives.');
    console.error('See BRAND_SCRUB_REPORT.md for replacement mappings.');
    
    return 1;
  }
}

// Run the brand guard
const guard = new BrandGuard();
const exitCode = guard.run();
process.exit(exitCode);