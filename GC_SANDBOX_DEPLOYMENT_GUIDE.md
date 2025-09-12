# IntelliLab GC - Complete Sandbox Deployment Guide

## 🚀 Quick Start

This deployment guide covers the complete end-to-end GC Sandbox + Quick-Run + CRUD workflow implementation.

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (optional)
cp env.example .env
# Edit .env if needed for custom database settings

# Initialize and seed the database
python seed_sandbox_data.py

# Start the backend server
python main.py
```

The backend will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000`

### 3. Access the GC Sandbox

1. Open your browser to `http://localhost:3000`
2. Navigate to the GC Sandbox module
3. Explore the three main tabs:
   - **Setup & Run**: Configure and run simulations
   - **Data Management**: CRUD operations for instruments, methods, and compounds
   - **Results**: View chromatograms and edit peak data

## 🎯 Feature Overview

### Core Functionality Implemented

#### 1. Complete CRUD Operations
- **Instruments**: Add, edit, delete GC instruments with full specifications
- **Methods**: Create and manage GC methods with parameter validation
- **Compounds**: Manage compound library with retention times and properties
- **Method Presets**: ASTM/EPA/GPA standard method templates

#### 2. Quick-Run Simulation
- Select instrument and method from dropdowns
- Choose compounds for simulation
- Generate realistic chromatogram data with peaks
- Display results in interactive chromatogram viewer

#### 3. Interactive Results Analysis
- Chromatogram visualization with Plotly
- Editable peak table with real-time updates
- Peak identification and annotation
- Quality metrics and diagnostics

#### 4. Data Persistence
- Save simulation runs to database
- Load and replay previous runs
- Export/import functionality
- Run history tracking

#### 5. Advanced Features
- Fault simulation for troubleshooting training
- Peak detection algorithms
- Method optimization suggestions
- Mobile-responsive design

### API Endpoints Available

#### Instruments
- `GET /api/v1/instruments/` - List all instruments
- `POST /api/v1/instruments/` - Create new instrument
- `PUT /api/v1/instruments/{id}` - Update instrument
- `DELETE /api/v1/instruments/{id}` - Delete instrument

#### Methods
- `GET /api/v1/methods/` - List all methods
- `POST /api/v1/methods/` - Create new method
- `PUT /api/v1/methods/{id}` - Update method
- `DELETE /api/v1/methods/{id}` - Delete method

#### Compounds
- `GET /api/v1/compounds/` - List all compounds
- `POST /api/v1/compounds/` - Create new compound
- `PUT /api/v1/compounds/{id}` - Update compound
- `DELETE /api/v1/compounds/{id}` - Delete compound
- `POST /api/v1/compounds/load-csv` - Bulk load from CSV

#### Chromatography & Simulation
- `POST /api/v1/chromatography/quick-run` - Run quick simulation
- `POST /api/v1/chromatography/detect` - Detect peaks
- `POST /api/v1/chromatography/simulate` - Full simulation
- `POST /api/v1/sandbox/run` - Sandbox with faults

#### Run Management
- `GET /api/v1/runs/` - List saved runs
- `POST /api/v1/runs/` - Save new run
- `GET /api/v1/runs/{id}` - Get specific run
- `PUT /api/v1/runs/{id}` - Update run
- `DELETE /api/v1/runs/{id}` - Delete run

## 🧪 Testing the Implementation

### Manual Testing Workflow

1. **Data Management Test**:
   ```
   - Go to Data Management tab
   - Add a new compound (e.g., "Test Benzene", RT: 8.4 min)
   - Add a new method (e.g., "Test Method", type: general_gc)
   - Verify items appear in respective tables
   - Edit an existing item and verify changes
   ```

2. **Simulation Test**:
   ```
   - Go to Setup & Run tab
   - Select an instrument from dropdown
   - Select a method from dropdown
   - Choose 2-3 compounds from autocomplete
   - Enter sample name: "Test Simulation"
   - Click "Run Simulation"
   - Verify chromatogram appears in Results tab
   - Verify peak table shows detected peaks
   ```

3. **Save/Load Test**:
   ```
   - After running simulation, click "Save Current Run"
   - Go to Data Management tab
   - Find your run in Saved Runs table
   - Click "Load" button
   - Verify run loads in Results tab
   ```

4. **Peak Editing Test**:
   ```
   - In Results tab, edit peak names in peak table
   - Verify changes reflect in chromatogram
   - Test adding/removing peaks
   ```

### Automated Testing

#### Backend Tests
```bash
cd backend
python -m pytest tests/test_sandbox_integration.py -v
```

#### Frontend E2E Tests
```bash
cd frontend
npx cypress run --spec "cypress/e2e/gc_sandbox_workflow.cy.ts"
```

## 🗂️ Sample Data

The seeding script populates the system with:

- **4 Instruments**: Various GC configurations for different applications
- **28 Compounds**: Comprehensive library including hydrocarbons, aromatics, oxygenates, and environmental compounds
- **6 Methods**: EPA, ASTM, and GPA standard methods plus training methods
- **6 Method Presets**: Industry-standard method templates

### Key Compound Categories:
- Light Hydrocarbons (C1-C8)
- Aromatic Compounds (BTEX)
- Oxygenates (alcohols, ketones, ethers)
- Environmental Compounds (halogenated)
- Internal Standards

### Method Types:
- Environmental (EPA 8260B)
- Petrochemical (ASTM D3588)
- Natural Gas (GPA 2261)
- General Purpose (BTEX, Training)

## 🔧 Configuration Options

### Backend Configuration
Edit `backend/.env` or environment variables:
```
DATABASE_URL=sqlite:///./intellilab_gc.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

### Frontend Configuration
Edit `frontend/src/services/apiService.ts`:
```typescript
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**:
   - Check Python version: `python --version`
   - Install dependencies: `pip install -r requirements.txt`
   - Check port 8000 availability

2. **Frontend not connecting**:
   - Verify backend is running on port 8000
   - Check browser console for CORS errors
   - Ensure API_URL is correctly configured

3. **Database issues**:
   - Delete `intellilab_gc.db` and re-run seeding script
   - Check file permissions
   - Verify SQLite installation

4. **Missing data**:
   - Run seeding script: `python seed_sandbox_data.py`
   - Check database has been populated
   - Verify API endpoints return data

### Performance Optimization

- For large datasets, implement pagination in list endpoints
- Consider Redis caching for frequently accessed data
- Use database indexes for compound/method searches
- Implement WebSocket updates for real-time collaboration

## 📈 Production Deployment

### Docker Deployment
```bash
# Build and run with docker-compose
docker-compose up -d

# Or build individual services
docker build -f Dockerfile.backend -t intellilab-backend .
docker build -f Dockerfile.frontend -t intellilab-frontend .
```

### Environment Variables
```
# Production backend
DATABASE_URL=postgresql://user:pass@host:port/db
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://your-domain.com

# Production frontend
REACT_APP_API_URL=https://api.your-domain.com/api/v1
```

## 📋 Feature Checklist

✅ **Completed Features**:
- Complete CRUD UI for compounds, methods, instruments
- Quick-Run integration with method/compound selection
- Interactive GC Sandbox with dropdowns and peak editing
- Save/Load Run functionality
- Comprehensive backend API with validation
- Unit tests for sandbox/quick-run endpoints
- E2E Cypress tests for complete workflow
- Data seeding with realistic test data
- Mobile-responsive design
- Error handling and validation

🎯 **Ready for Production**: This implementation provides a complete, production-grade GC Sandbox platform with full CRUD capabilities, simulation features, and comprehensive testing coverage.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Check browser console for frontend errors
4. Review backend logs for API errors
5. Refer to test files for usage examples

---

**End-to-End GC Sandbox Implementation Complete** ✅
