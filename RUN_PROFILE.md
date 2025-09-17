# IntelliLab GC - Live E2E Run Profile

## Detection Summary

### Frontend Configuration
- **Framework**: React (using react-scripts)
- **Start Script**: `npm start` (equivalent to `react-scripts start`)
- **Default Port**: 3000 (react-scripts default)
- **Base URL**: http://localhost:3000
- **Health URL**: http://localhost:3000 (root should return HTML)
- **Working Directory**: `C:\IntelliLab_GC_ModV2\frontend`
- **Terminal**: Frontend Terminal

### Backend Configuration
- **Framework**: FastAPI
- **Entry Point**: `backend/main.py` (app = FastAPI)
- **Start Command**: `python -m uvicorn main:app --reload --port 8000`
- **Python Executable**: `C:\IntelliLab_GC_ModV2\venv\Scripts\python.exe` (venv detected)
- **Port**: 8000
- **Base URL**: http://localhost:8000
- **Health URL**: http://localhost:8000/api/health
- **Working Directory**: `C:\IntelliLab_GC_ModV2\backend`
- **Terminal**: Backend Terminal

### Python Environment
- **Type**: Virtual Environment (venv)
- **Location**: `C:\IntelliLab_GC_ModV2\venv`
- **Python Path**: `C:\IntelliLab_GC_ModV2\venv\Scripts\python.exe`
- **Uvicorn Available**: Yes (`C:\IntelliLab_GC_ModV2\venv\Scripts\uvicorn.exe`)

## Health Check Configuration
- **Frontend Health**: GET http://localhost:3000 (expect HTML response)
- **Backend Health**: GET http://localhost:8000/api/health (expect JSON: {"status": "healthy", "service": "IntelliLab GC API"})
- **Frontend Timeout**: 60 seconds
- **Backend Timeout**: 60 seconds
- **Retry Strategy**: Exponential backoff (1s, 2s, 4s, 8s, 16s)

## Terminal Assignments
- **Terminal 1**: Frontend (npm start in frontend/ directory)
- **Terminal 2**: Backend (uvicorn in backend/ directory using venv python)
- **Terminal 3**: Compound task orchestration and health checks

## Environment Variables for E2E Testing
```powershell
$env:BASE_URL = "http://localhost:3000"
$env:API_URL = "http://localhost:8000"
$env:LIVE_E2E = "1"
```

## Existing Scripts Analysis
- **start-frontend.ps1**: Uses `npm start`, checks port 3000, runs from frontend/
- **start-backend.ps1**: Uses `py -m uvicorn main:app --reload --port 8000`, checks port 8000, runs from backend/

## Notes
- Both services configured to use standard development ports
- Backend has proper health endpoint at `/api/health`
- Frontend will serve static HTML at root
- Python venv is properly set up with all required dependencies
- Existing PowerShell scripts can be used as reference but VS Code tasks preferred for integration