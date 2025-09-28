# IntelliLab GC - Comprehensive Field GC Analytics Platform

[![Comprehensive Tests](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/comprehensive-testing.yml/badge.svg)](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/comprehensive-testing.yml)
[![Quality Gates](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/quality-gates.yml)
[![CI/CD](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/IntelliLab/IntelliLab_GC_ModV2/actions/workflows/ci-cd.yml)

🔬 **Professional Gas Chromatography Analysis Platform** with AI-powered vision analysis, real-time troubleshooting, and comprehensive testing infrastructure.

## 🎯 Overview

IntelliLab GC modernizes field gas chromatography with:
- **AI Vision Analysis** - Upload chromatogram images for instant peak detection and quality analysis
- **Real-time Troubleshooting** - Expert-level diagnostics and method optimization recommendations  
- **Split Ratio Calculator** - Precise flow calculations for optimal separation
- **Chromatogram Simulator** - Generate realistic test chromatograms for method development
- **Comprehensive Testing Infrastructure** - Multi-layer validation with visual, accessibility, performance, and real API testing

## 🏗️ Architecture

```
IntelliLab GC/
├── 🎭 frontend/          # React + TypeScript + Vite
│   ├── src/              # Application source code
│   ├── tests/            # Comprehensive test suites
│   │   ├── visual.spec.ts       # Visual regression tests
│   │   ├── a11y.spec.ts         # Accessibility tests (WCAG 2.1 AA)
│   │   ├── performance.spec.ts  # Performance monitoring
│   │   ├── real/               # Real API integration tests
│   │   └── contracts/          # OpenAPI schema validation
│   └── playwright.config.ts    # Test configuration
├── 🐍 backend/           # FastAPI + Python
│   ├── main.py           # Application entry point
│   ├── api/              # API route handlers
│   └── models/           # Data models and schemas
├── 🐳 Docker configs     # Multi-environment containerization
├── 🔧 .vscode/          # VS Code integration
│   ├── settings.json     # Playwright integration
│   ├── tasks.json        # Testing task automation
│   └── launch.json       # Debug configurations
└── 🚀 .github/          # CI/CD workflows
    └── workflows/        # Automated testing pipelines
```

## 🧪 Testing Infrastructure

Our **production-grade testing infrastructure** ensures reliability across multiple dimensions:

### 🎭 Visual Regression Testing
- **Screenshot-based UI validation** using Playwright
- **Baseline comparison** for detecting unintended UI changes  
- **4 visual regression test scenarios** covering core workflows
- **Automatic failure reporting** with visual diff artifacts

### ♿ Accessibility Testing (WCAG 2.1 AA)
- **Automated accessibility scanning** with @axe-core/playwright
- **5 comprehensive test scenarios** covering all major pages
- **WCAG 2.1 AA compliance validation** 
- **MVP-appropriate rule configuration** for practical development

### ⚡ Performance Testing
- **Bundle size monitoring** with configurable thresholds
- **Page load performance** validation (< 3s targets)
- **Memory usage tracking** (React + Plotly optimization)
- **Network resource analysis** with size warnings

### 🌐 Real API Integration Testing
- **End-to-end validation** with live backend services
- **5 comprehensive API test scenarios**:
  - Health check validation
  - Split ratio calculations (infrastructure testing)
  - OCR analysis (full AI pipeline validation)
  - Chromatogram simulation (data generation)
  - Frontend-backend integration
- **Contract validation** with OpenAPI schema verification

### 🔥 Quality Gates
- **Combined test execution** (Visual + A11y + Performance)
- **Pass/fail gating** for deployment readiness
- **Comprehensive reporting** with artifact collection

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (Frontend)
- **Python 3.11+** (Backend)  
- **VS Code** (Recommended for best testing experience)

### 1. Clone and Setup
```bash
git clone https://github.com/IntelliLab/IntelliLab_GC_ModV2.git
cd IntelliLab_GC_ModV2

# Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

### 2. Start Services
```bash
# Option A: VS Code Tasks (Recommended)
# Open in VS Code, then Ctrl+Shift+P -> "Tasks: Run Task" -> "🚀 Start Full Application"

# Option B: Manual startup
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 3. Access Applications
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🧪 Testing Guide

### VS Code Integration (Recommended)
Our VS Code configuration provides seamless testing integration:

1. **Install recommended extensions** (auto-prompted)
2. **Use Testing Panel** - Playwright tests appear with run/debug buttons
3. **Run tasks** - `Ctrl+Shift+P` → "Tasks: Run Task"
   - 🧪 Run All Tests
   - 🎭 Visual Tests  
   - ♿ Accessibility Tests
   - ⚡ Performance Tests
   - 🌐 Real API Tests
   - 🔥 Quality Gates

### Command Line Testing
```bash
cd frontend

# Individual test suites
npm run test:visual        # Visual regression tests
npm run test:a11y          # Accessibility tests  
npm run test:performance   # Performance tests
npm run test:e2e:real     # Real API tests

# Combined testing
npm run test:guards       # Quality gates (all combined)
npm run test:ci          # Full CI simulation

# Contract validation
npm run contracts:fetch   # Fetch OpenAPI schema from backend
```

### Test Configuration
- **Playwright Config**: `frontend/playwright.config.ts`
- **Visual Baselines**: `frontend/tests/visual.spec.ts-snapshots/`
- **Test Reports**: `frontend/playwright-report/`
- **Test Results**: `frontend/test-results/`

## 🏥 Health Monitoring

### Service Health Checks
```bash
# Backend health
curl http://localhost:8000/api/health

# Frontend health  
curl http://localhost:5173

# Automated health checks (VS Code task)
# "Health Check All" task
```

### Test Monitoring
- **GitHub Actions** - Automated on push/PR
- **Visual Test Reports** - Generated after each run
- **Performance Metrics** - Bundle size and load time tracking
- **Accessibility Reports** - WCAG violation details

## 🔧 Development Workflow

### 1. Feature Development
- Create feature branch
- Develop with live reload (`npm start`)
- Test continuously with VS Code Testing panel

### 2. Pre-commit Validation
```bash
npm run test:guards    # Run all quality gates
```

### 3. Commit and Push
- Tests run automatically in CI
- Quality gates must pass for merge

### 4. Deployment
- Successful CI triggers deployment pipeline
- Production health checks validate deployment

## 📊 Testing Reports

### Accessing Test Reports
```bash
# Open latest Playwright report
npx playwright show-report

# View specific test artifacts
ls frontend/test-results/
ls frontend/tests/visual.spec.ts-snapshots/
```

### CI/CD Artifacts
- **Visual Regression Screenshots** - Baseline and failure comparisons
- **Accessibility Reports** - WCAG violation details  
- **Performance Metrics** - Bundle sizes and load times
- **API Test Results** - Real endpoint validation results
- **OpenAPI Contracts** - Schema validation artifacts

## 🛠️ Configuration

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development

# Backend 
DATABASE_URL=sqlite:///./intellilab_gc.db
DEBUG=true

# Testing
USE_REAL_API=1  # Enable real API tests
```

### VS Code Workspace
Open `intellilab-gc.code-workspace` for optimal development experience with:
- Multi-folder workspace structure
- Integrated test task configurations  
- Debug launch configurations
- Extension recommendations

## 📈 Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Bundle Size | < 2MB | ~1.2MB |
| Page Load | < 3s | ~2.1s |
| Memory Usage | < 60MB | ~50MB |
| Accessibility | WCAG 2.1 AA | ✅ Compliant |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run quality gates (`npm run test:guards`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push branch (`git push origin feature/amazing-feature`)  
6. Open Pull Request

### Development Standards
- **TypeScript** for type safety
- **Playwright** for all testing needs
- **WCAG 2.1 AA** accessibility compliance
- **Visual regression** protection
- **Real API validation** for E2E confidence

## 📝 API Documentation

- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Key Endpoints
- `GET /api/health` - Service health check
- `POST /api/chromatogram/analyze` - AI vision analysis
- `POST /api/split-ratio/calculate` - Flow calculations
- `POST /api/chromatogram/simulate` - Generate test data

## 🏆 Quality Assurance

Our testing infrastructure ensures:
- **🎭 Visual Consistency** - No unintended UI changes
- **♿ Accessibility** - WCAG 2.1 AA compliance
- **⚡ Performance** - Fast, efficient user experience  
- **🌐 API Reliability** - Real backend integration validation
- **🔥 Quality Gates** - Combined validation before deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/IntelliLab/IntelliLab_GC_ModV2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/IntelliLab/IntelliLab_GC_ModV2/discussions)
- **Testing Questions**: Check our comprehensive test suites in `frontend/tests/`

---

🎯 **Built for reliability** with comprehensive testing infrastructure ensuring production-ready quality at every commit.