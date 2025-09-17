# IntelliLab GC - Test & Quality Assurance Documentation

## Overview
This document provides comprehensive guidance on testing, quality assurance, and development practices for the IntelliLab GC system.

## 🧪 Testing Framework

### Unit Testing
- **Framework**: Vitest 3.2.4 with React Testing Library
- **Location**: `frontend/src/**/*.test.{ts,tsx}`
- **Current Status**: 95/95 tests passing ✅
- **Coverage**: High coverage maintained across all components
- **Run Commands**:
  ```bash
  cd frontend
  npm test                 # Interactive mode
  npm run test:run         # Single run
  npm run test:coverage    # With coverage report
  ```

### End-to-End Testing
- **Framework**: Playwright 1.55.0
- **Location**: `frontend/tests/e2e/`
- **Configuration**: `frontend/playwright.config.ts`
- **Key Features**:
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Multi-viewport testing (Desktop: 1920x1080, Mobile: 375x667, Tablet: 768x1024)
  - Error monitoring and console log capture
  - Stress testing with rapid user interactions
  - Screenshot capture on failure

#### Running E2E Tests
```bash
cd frontend
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:debug             # Run with debug mode
npm run test:e2e:ui                # Run with Playwright UI
npx playwright show-report         # View test results
```

#### Smoke Tests
Located at `frontend/tests/e2e/smoke-tests.spec.ts`:
- ✅ Application loads without errors
- ✅ Navigation menu functionality
- ✅ Responsive design across viewports
- ✅ Form interactions and data entry
- ✅ Error boundary behavior
- ✅ Performance stress testing

## 🛡️ Quality Assurance

### Pre-Commit Quality Gates
Located at `scripts/pre-commit-hook.js` - comprehensive validation before code commits:

1. **Placeholder Content Guard** (`scripts/placeholder-guard.js`)
   - Detects TODO/FIXME comments in production code
   - Identifies lorem ipsum and sample text
   - Prevents demo data from reaching production
   - Excludes test files and documentation

2. **TypeScript Type Safety**
   - Runs `tsc --noEmit` to verify type correctness
   - Ensures no type errors in production builds

3. **ESLint Code Quality**
   - Enforces coding standards and best practices
   - Catches common bugs and anti-patterns
   - Maintains consistent code style

4. **Unit Test Validation**
   - Ensures all unit tests pass before commit
   - Maintains test coverage standards

#### Running Quality Checks
```bash
# Run all pre-commit checks
node scripts/pre-commit-hook.js

# Run individual checks
node scripts/placeholder-guard.js --verbose
cd frontend && npm run lint
cd frontend && npm run type-check
cd frontend && npm test
```

### Placeholder Content Detection
The placeholder guard (`scripts/placeholder-guard.js`) prevents placeholder content from reaching production:

#### Detected Patterns
- `TODO:`, `FIXME:`, `HACK:`, `XXX:` comments
- Lorem ipsum text variants
- Sample/demo/mock data placeholders
- Development-only content markers

#### Excluded Files
- `**/*test*/**`, `**/*.test.*` - Test files
- `**/*spec*/**`, `**/*.spec.*` - Spec files
- `**/docs/**`, `**/documentation/**` - Documentation
- `**/node_modules/**` - Dependencies
- `**/dist/**`, `**/build/**` - Build outputs

#### Configuration
```javascript
const BANNED_TOKENS = [
  'TODO:', 'FIXME:', 'HACK:', 'XXX:',
  'lorem ipsum', 'placeholder text',
  'sample data', 'mock data', 'demo content'
];
```

## 🏗️ Architecture & Patterns

### Component Testing Strategy
```typescript
// Example unit test pattern
import { render, screen } from '@testing-library/react';
import { EnhancedSidebar } from './EnhancedSidebar';

describe('EnhancedSidebar', () => {
  it('renders navigation items correctly', () => {
    render(<EnhancedSidebar isOpen={true} onToggle={jest.fn()} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

### E2E Testing Patterns
```typescript
// Example E2E test pattern
import { test, expect } from '@playwright/test';

test('application loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/IntelliLab GC/);
  await expect(page.locator('nav')).toBeVisible();
});
```

### Right Panel Investigation Results
**Decision**: No right panel implementation needed in current architecture.

**Technical Evidence**:
- Single sidebar design pattern identified in `EnhancedSidebar.tsx`
- Main content area uses full available width
- Responsive design optimized for single-panel layout
- No right panel components found in codebase

**Future Considerations**:
- Right panel can be added later using CSS Grid modification
- Would require updates to `MainLayout.tsx` responsive patterns
- Consider notification panels or tool panels as candidates

## 🔧 Development Workflow

### Git Integration
The quality gates integrate with Git through:
```bash
# Add as pre-commit hook (optional)
echo "node scripts/pre-commit-hook.js" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Manual validation before commits
git add .
node scripts/pre-commit-hook.js  # Run validation
git commit -m "Your commit message"
```

### Continuous Integration
GitHub Actions workflow (`.github/workflows/quality-gates.yml`):
```yaml
- name: Run Quality Gates
  run: |
    node scripts/pre-commit-hook.js
    cd frontend && npm test
    cd frontend && npm run test:e2e
```

### Package.json Integration
Build scripts include quality checks:
```json
{
  "scripts": {
    "build": "npm run type-check && npm run lint && npm test && npm run build:only",
    "pre-commit": "node ../scripts/pre-commit-hook.js",
    "quality-check": "npm run lint && npm run type-check && npm test"
  }
}
```

## 📊 Test Metrics & Monitoring

### Current Status
- **Unit Tests**: 95/95 passing (100% pass rate)
- **E2E Tests**: Comprehensive smoke test coverage
- **Type Safety**: Full TypeScript strict mode compliance
- **Code Quality**: ESLint with zero warnings policy
- **Placeholder Detection**: Active prevention system

### Quality Thresholds
- Unit test pass rate: 100% required
- TypeScript errors: Zero tolerance
- ESLint warnings: Zero tolerance  
- Placeholder content: Zero tolerance in production code

## 🚀 Performance & Reliability

### E2E Test Reliability Features
- **Error Monitoring**: Console log capture and analysis
- **Retry Logic**: Automatic retry for flaky tests
- **Multiple Viewports**: Cross-device compatibility validation
- **Stress Testing**: Rapid interaction simulation
- **Screenshot Capture**: Visual debugging on failures

### Build Performance
- **Type Checking**: Parallel execution with build process
- **Linting**: Incremental analysis for speed
- **Testing**: Watch mode for development efficiency

## 📝 Best Practices

### Code Quality
1. **Write tests first** - TDD approach for new features
2. **Maintain high coverage** - Aim for >90% test coverage
3. **Use TypeScript strictly** - Enable all strict mode features
4. **Follow ESLint rules** - Consistent code style across team
5. **No placeholder content** - Production-ready code only

### Testing Guidelines
1. **Test user behavior** - Focus on user interactions, not implementation
2. **Use semantic queries** - Query by role, label, text content
3. **Mock external dependencies** - Isolate components under test
4. **Test error states** - Verify error handling and edge cases
5. **Keep tests fast** - Unit tests should run in milliseconds

### Commit Workflow
1. Run quality checks locally before committing
2. Ensure all tests pass and no linting errors
3. Verify TypeScript compilation succeeds
4. Check for placeholder content violations
5. Write descriptive commit messages

## 🔍 Debugging & Troubleshooting

### Test Failures
```bash
# Debug failing unit tests
cd frontend && npm test -- --reporter=verbose

# Debug E2E test failures
cd frontend && npm run test:e2e:debug

# Check test coverage
cd frontend && npm run test:coverage
```

### Quality Gate Failures
```bash
# Check placeholder content violations
node scripts/placeholder-guard.js --verbose

# Fix TypeScript errors
cd frontend && npm run type-check

# Fix linting issues
cd frontend && npm run lint:fix
```

### Performance Issues
```bash
# Profile test execution
cd frontend && npm test -- --reporter=verbose --run

# Analyze bundle size
cd frontend && npm run build -- --analyze

# Check E2E test performance
cd frontend && npx playwright test --trace=on
```

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)

---

*This documentation is maintained as part of the IntelliLab GC development workflow and should be updated with any changes to testing or quality assurance procedures.*