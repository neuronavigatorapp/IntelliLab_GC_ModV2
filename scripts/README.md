# Placeholder Data Guards

This directory contains scripts and configurations to prevent placeholder content from reaching production in the IntelliLab GC application.

## Overview

The placeholder guard system automatically scans the codebase for banned tokens that indicate incomplete development work, ensuring production readiness.

## Components

### 1. Placeholder Guard Script (`placeholder-guard.js`)

**Purpose:** Scans codebase for banned placeholder tokens and development markers.

**Banned Tokens:**
- **Placeholder Content:** lorem ipsum, placeholder, demo, mock, sample, dummy
- **Development Markers:** TODO, FIXME, HACK, XXX, TEMP
- **Test References:** test data, demo data, sample data

**Usage:**
```bash
# Basic scan
node scripts/placeholder-guard.js

# Verbose output
node scripts/placeholder-guard.js --verbose

# Fail on first violation
node scripts/placeholder-guard.js --fail-fast
```

**Exclusions:**
- Test files (`*.test.*`, `*.spec.*`, `tests/`)
- Documentation (`*.md`, `docs/`, `README*`)
- Build artifacts (`dist/`, `build/`, `node_modules/`)
- Development configuration files

### 2. Pre-commit Hook (`pre-commit-hook.js`)

**Purpose:** Runs quality checks before commits to prevent issues from entering the repository.

**Checks Performed:**
- Placeholder content scan
- TypeScript type checking
- ESLint code quality
- Unit test execution
- Python syntax validation (if applicable)

**Usage:**
```bash
# Manual execution
node scripts/pre-commit-hook.js

# Via npm script
npm run pre-commit
```

### 3. CI/CD Integration (`.github/workflows/quality-gates.yml`)

**Purpose:** Automated quality gates in GitHub Actions CI/CD pipeline.

**Quality Gates:**
- ✅ **Placeholder Guard** - No banned tokens in production code
- ✅ **Frontend Quality** - TypeScript, ESLint, unit tests (90% coverage)
- ✅ **E2E Tests** - Comprehensive smoke and interaction tests
- ✅ **Build Validation** - Production build success with size limits
- ✅ **Security Scan** - Dependency vulnerability checks

## Integration Points

### Build Process
The placeholder guard is integrated into the build process:

```json
{
  "scripts": {
    "build": "npm run placeholder:check && react-scripts build",
    "placeholder:check": "node ../scripts/placeholder-guard.js"
  }
}
```

### Development Workflow
```bash
# Before committing
npm run pre-commit

# Before building
npm run build

# Full quality check
npm run quality:check
```

## Configuration

### Customizing Banned Tokens

Edit `BANNED_TOKENS` array in `placeholder-guard.js`:

```javascript
const BANNED_TOKENS = [
  'lorem ipsum',
  'placeholder', 
  'custom-token',
  // Add your tokens here
];
```

### Excluding Files

Add patterns to `EXCLUDED_PATTERNS`:

```javascript
const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/your-custom-exclusion/**'
];
```

### File Extensions

Modify `INCLUDED_EXTENSIONS` to scan additional file types:

```javascript
const INCLUDED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.html', '.css', '.json'
];
```

## Troubleshooting

### Common Issues

1. **False Positives in Documentation**
   - **Solution:** Add file patterns to `EXCLUDED_PATTERNS`
   - **Example:** Exclude specific docs with `**/api-docs/**`

2. **Legitimate Use of Banned Tokens**
   - **Solution:** Use alternative wording or add specific exclusions
   - **Example:** "sample_data" instead of "sample data"

3. **Pre-commit Hook Too Slow**
   - **Solution:** Use `--fail-fast` option or skip non-critical checks
   - **Command:** `node scripts/placeholder-guard.js --fail-fast`

### Debugging Commands

```bash
# Verbose scan with detailed output
node scripts/placeholder-guard.js --verbose

# Check specific directory
cd frontend && node ../scripts/placeholder-guard.js

# Generate detailed report
node scripts/placeholder-guard.js --verbose > scan-results.txt
```

## Best Practices

### For Developers

1. **Replace Placeholders Early**
   - Use real content instead of lorem ipsum
   - Complete TODO items before committing
   - Remove debug/demo code

2. **Use Semantic Alternatives**
   - "example_value" instead of "sample"
   - "test_case" instead of "demo"
   - "default_data" instead of "placeholder"

3. **Regular Quality Checks**
   ```bash
   # Before major commits
   npm run quality:check
   
   # Before pull requests  
   npm run test:all && npm run placeholder:check
   ```

### For Teams

1. **CI/CD Requirements**
   - All quality gates must pass for deployment
   - Failed checks block merges to main branch
   - Regular security and dependency updates

2. **Code Review Guidelines**
   - Review placeholder guard results
   - Ensure production-ready content
   - Validate test coverage thresholds

## Reporting

### Violation Reports

When violations are found, detailed reports include:
- File path and line numbers
- Detected token types
- Actual content containing violations
- Remediation suggestions

### Example Report
```
❌ Found 3 placeholder token violations:

📁 src/components/Calculator.tsx:
  🎭 Line 45: "placeholder" found
     Content: <input placeholder="Enter sample value" />
  
📁 src/utils/helper.ts:
  🔧 Line 12: "TODO" found  
     Content: // TODO: Implement proper validation
```

## Maintenance

### Regular Updates

1. **Review Banned Tokens** - Monthly review of token effectiveness
2. **Update Exclusions** - Add new file patterns as needed  
3. **Monitor CI Performance** - Optimize checks for speed
4. **Security Updates** - Keep dependencies current

### Version History

- **v1.0** - Initial implementation with core token detection
- **v1.1** - Added pre-commit hooks and CI integration
- **v1.2** - Enhanced reporting and exclusion patterns

---

*This guard system is part of the IntelliLab GC hardening process to ensure production-ready code quality.*