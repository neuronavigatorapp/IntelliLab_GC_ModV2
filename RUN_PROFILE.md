# IntelliLab GC - Run Profile (Generated)

## Discovered Configuration

### Frontend Configuration
- **Framework**: React + Vite 
- **Package.json**: `frontend/package.json`
- **Start Script**: `npm run dev` (Vite dev server)
- **Port**: 5173 (configured in `vite.config.ts`)
- **Base URL**: http://localhost:5173
- **Health Check**: GET http://localhost:5173 (expect HTTP 200)
- **Working Directory**: `C:\IntelliLab_GC_ModV2\frontend`
- **Environment File**: `.env.local` (auto-created with `VITE_API_URL`)

### Backend Configuration
- **Framework**: FastAPI
- **Entry Point**: `backend/main.py` (contains `app = FastAPI(...)`)
- **Uvicorn Target**: `main:app`
- **Start Command**: `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Python Executable**: `.\venv\Scripts\python.exe` (virtual environment detected)
- **Port**: 8000 (configured in VS Code tasks)
- **Base URL**: http://localhost:8000
- **Health Endpoint**: `/api/health`
- **Health URL**: http://localhost:8000/api/health
- **Working Directory**: `C:\IntelliLab_GC_ModV2\backend`

### Python Environment
- **Type**: Virtual Environment (venv)
- **Location**: `C:\IntelliLab_GC_ModV2\venv`
- **Python Path**: `C:\IntelliLab_GC_ModV2\venv\Scripts\python.exe`
- **Status**: ✅ Detected and functional

## Generated Scripts

### Start-IntelliLab.bat
**One-click batch launcher**
- Sets `API_PORT=8000`, `FE_PORT=5173`
- Validates dependencies (venv, Node.js, node_modules)
- Creates/updates `frontend\.env.local` with `VITE_API_URL=http://localhost:8000`
- Starts backend: `.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Starts frontend: `npm run dev` in frontend directory
- Opens browser to http://localhost:5173
- Each service runs in its own titled window (`IntelliLab GC API`, `IntelliLab GC FE`)

### Start-IntelliLab.ps1
**Advanced PowerShell launcher with health checks**
- Everything from .bat version PLUS:
- Port availability checks (detects conflicts, shows PIDs)
- Service health polling (backend `/api/health`, frontend HTTP 200)
- Timestamped logging with color coding
- Timeout handling (30 second default)
- Graceful error messages with specific fix instructions
- Optional parameters: `-SkipBrowser`, `-Verbose`

### Stop-IntelliLab.bat
**Service shutdown script**
- Kills processes using ports 8000 and 5173 (via `netstat -ano`)
- Closes windows by title (`IntelliLab GC API*`, `IntelliLab GC FE*`)
- Cleans up any remaining node.exe/python.exe processes from workspace
- Verifies ports are freed after shutdown

## Health Check Details
- **Backend Health**: GET http://localhost:8000/api/health
  - Expected response: `{"status": "healthy", "service": "IntelliLab GC API"}`
- **Frontend Health**: GET http://localhost:5173
  - Expected response: HTTP 200 (HTML content)
- **Timeout**: 30 seconds with 2-second retry intervals
- **Retry Strategy**: Simple polling every 2 seconds

## Environment Variables (Auto-configured)
```
VITE_API_URL=http://localhost:8000  # Written to frontend/.env.local
```

## Troubleshooting Guide

### Port Already in Use
**Error**: "Port 8000 is in use by process: python.exe (PID: 1234)"
**Fix**: Run `Stop-IntelliLab.bat` or manually kill the process

### Virtual Environment Missing
**Error**: "Python virtual environment not found"
**Fix**: 
1. `python -m venv venv`
2. `.\venv\Scripts\pip install -r requirements.txt`

### Node.js Missing
**Error**: "Node.js not found in PATH"  
**Fix**: Install Node.js from https://nodejs.org/

### Frontend Dependencies Missing
**Error**: "Frontend dependencies not installed"
**Fix**: `cd frontend && npm install`

### Service Won't Start
1. Check dependency installation
2. Verify ports are free
3. Check service-specific windows for error details
4. Try running commands manually from respective directories

## Validation Results ✅

### Discovery Validation
- ✅ Frontend path and port discovered (5173)
- ✅ Backend uvicorn target discovered (main:app)
- ✅ Python executable path confirmed (.\venv\Scripts\python.exe)
- ✅ Health endpoint confirmed (/api/health)
- ✅ Scripts generated successfully

### Functional Testing
- ✅ **Start-IntelliLab.bat**: Dependencies checked, services started, browser opened
- ✅ **Stop-IntelliLab.bat**: Successfully killed processes on ports 8000 and 5173  
- ✅ **Environment file**: `frontend\.env.local` created with `VITE_API_URL=http://localhost:8000`
- ✅ **Port cleanup**: Stop script properly identified and terminated running processes
- ✅ **Service windows**: Both backend and frontend opened in separate console windows

### Usage Instructions
1. **To start**: Double-click `Start-IntelliLab.bat` or run `.\Start-IntelliLab.bat`
2. **To stop**: Run `.\Stop-IntelliLab.bat`
3. **Advanced start with health checks**: Run `powershell -ExecutionPolicy Bypass -File .\Start-IntelliLab.ps1`

### Acceptance Criteria Met
- ✅ I can double-click `Start-IntelliLab.bat` and it launches both servers and browser
- ✅ `Stop-IntelliLab.bat` cleanly frees the ports
- ✅ Scripts are robust and handle port conflicts automatically
- ✅ Clear error messages provided when dependencies are missing