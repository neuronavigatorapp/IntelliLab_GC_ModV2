# IntelliLab GC - Local Setup & Verification Guide (Pass 1)

## 📋 Overview

This guide covers the **Pass 1** implementation of IntelliLab GC with persistent local storage, backup functionality, and offline-ready operation.

### Key Features
- ✅ Persistent SQLite storage (Windows/macOS/Linux)
- ✅ Automatic database migration on startup
- ✅ Backup & restore functionality
- ✅ Quick-Run sandbox simulations with history
- ✅ Auto-save for all data changes
- ✅ Offline-ready operation
- ✅ PowerShell-compatible setup scripts

---

## 🚀 Quick Start (Single Command)

For immediate setup and launch:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
python scripts\setup_environment.py --migrate --load-compounds backend\ai\compound_library.csv --load-faults backend\ai\fault_library.json
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0
```

```bash
# macOS/Linux
source venv/bin/activate
python scripts/setup_environment.py --migrate --load-compounds backend/ai/compound_library.csv --load-faults backend/ai/fault_library.json
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0
```

---

## 📁 Data Storage Locations

IntelliLab GC stores all data in platform-specific directories:

### Windows
```
C:\IntelliLab_GC\Data\
├── intellilab.db          # Main database
└── backups\               # Timestamped backups
    ├── intellilab_backup_YYYYMMDD_HHMMSS.db
    └── intellilab_backup_YYYYMMDD_HHMMSS.db.meta
```

### macOS/Linux
```
~/IntelliLab_GC/Data/
├── intellilab.db          # Main database
└── backups/               # Timestamped backups
    ├── intellilab_backup_YYYYMMDD_HHMMSS.db
    └── intellilab_backup_YYYYMMDD_HHMMSS.db.meta
```

---

## 🔧 Detailed Setup Process

### 1. Environment Preparation

```powershell
# Check Python version (3.8+ required)
python --version

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # macOS/Linux

# Verify environment
python scripts\setup_environment.py --check
```

### 2. Database Setup & Migration

```powershell
# Full database setup
python scripts\setup_environment.py --migrate --load-compounds backend\ai\compound_library.csv --load-faults backend\ai\fault_library.json

# Or step by step:
python scripts\setup_environment.py --migrate
python scripts\setup_environment.py --load-compounds backend\ai\compound_library.csv
python scripts\setup_environment.py --load-faults backend\ai\fault_library.json
```

### 3. Create Sample Data (Optional)

```powershell
python scripts\setup_environment.py --sample-data
```

### 4. Start the Application

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access the Application

- **Main Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Interface**: http://localhost:8000/redoc

---

## ✅ Verification Checklist

### Backend Verification

1. **Database Creation**
   ```powershell
   # Check if database was created
   python scripts\setup_environment.py --check
   ```
   Expected output: Database exists with size > 0 MB

2. **API Health Check**
   ```powershell
   curl http://localhost:8000/health
   ```
   Expected: `{"status": "healthy"}`

3. **System Information**
   ```powershell
   curl http://localhost:8000/api/v1/system/health
   ```
   Expected: JSON with database status and paths

### Data Persistence Verification

1. **Create Test Method**
   ```powershell
   curl -X POST http://localhost:8000/api/v1/methods \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Method", "description": "Persistence test", "method_type": "test", "parameters": {}}'
   ```

2. **Restart Application**
   - Stop the server (Ctrl+C)
   - Start again: `python -m uvicorn app.main:app --reload`

3. **Verify Persistence**
   ```powershell
   curl http://localhost:8000/api/v1/methods
   ```
   Expected: Test method still exists

### Backup Functionality

1. **Create Manual Backup**
   ```powershell
   curl -X POST http://localhost:8000/api/v1/system/backup
   ```

2. **List Backups**
   ```powershell
   curl http://localhost:8000/api/v1/system/backup/list
   ```

3. **Verify Backup Files**
   Check backup directory for timestamped files.

### Quick-Run Verification

1. **Run Sandbox Simulation**
   ```powershell
   curl -X POST "http://localhost:8000/api/v1/chromatography/quick-run?instrument_id=1&method_id=1"
   ```

2. **Check Run History**
   ```powershell
   curl http://localhost:8000/api/v1/sandbox/runs
   ```
   Expected: Previous run appears in history

---

## 🖥️ Frontend Verification

### 1. Access Main Interface
- Navigate to http://localhost:8000
- Verify all pages load without errors

### 2. Test Settings Page
- Go to Settings → System Settings
- Verify data location information displays
- Test "Create Backup" button
- Check backup list updates

### 3. Test Auto-Save
- Create or edit a method
- Make changes and wait 2 seconds
- Verify "Changes saved" toast appears
- Restart application and confirm changes persist

### 4. Test Method Operations
- Navigate to Methods page
- Create new method
- Edit existing method
- Run Quick-Run simulation
- Verify all operations save automatically

---

## 🔧 Troubleshooting

### Database Issues

**Issue**: Database not created
```powershell
# Reset and recreate
python scripts\setup_environment.py --reset
```

**Issue**: Migration errors
```powershell
# Check database location and permissions
python scripts\setup_environment.py --check
```

### Permission Issues (Windows)

```powershell
# Run as Administrator if needed
# Or change data directory permissions
```

### API Connection Issues

```powershell
# Check if backend is running
curl http://localhost:8000/health

# Check firewall settings for port 8000
# Verify no other service using port 8000
netstat -an | findstr :8000
```

### Backup Issues

```powershell
# Test backup script directly
python scripts\backup_database.py backup

# Check backup directory permissions
python scripts\backup_database.py list
```

---

## 📊 Performance Verification

### Database Performance
```powershell
# Check database size and record counts
python scripts\setup_environment.py --check
```

### Memory Usage
- Monitor application memory usage
- Typical usage: < 100MB for backend

### Response Times
- API calls should respond < 1 second
- Database operations < 500ms
- Backup creation < 30 seconds

---

## 🎯 Field Testing Scenarios

### Scenario 1: Daily Operation
1. Start application
2. Create/edit methods
3. Run simulations
4. Verify auto-save working
5. Create daily backup
6. Restart and verify persistence

### Scenario 2: Data Recovery
1. Create test data
2. Create backup
3. Simulate data loss (delete database)
4. Restore from backup
5. Verify all data recovered

### Scenario 3: Offline Operation
1. Disconnect from internet
2. Use all application features
3. Verify no functionality lost
4. Reconnect and confirm operation

---

## 📝 Configuration Options

### Environment Variables
```bash
# Optional: Override default database location
export INTELLILAB_DATA_DIR="/custom/path"

# Optional: Override backup retention
export BACKUP_RETENTION_DAYS=30
```

### PowerShell Profile Setup
Add to your PowerShell profile for easy access:
```powershell
function Start-IntelliLab {
    Set-Location C:\IntelliLab_GC_ModV2
    .\venv\Scripts\Activate.ps1
    cd backend
    python -m uvicorn app.main:app --reload --host 0.0.0.0
}
```

---

## 🚀 Next Steps (Pass 2 & 3)

### Planned Enhancements
- [ ] Enhanced AI integration
- [ ] Advanced reporting features
- [ ] Multi-user collaboration
- [ ] Cloud sync capabilities
- [ ] Mobile application
- [ ] Advanced analytics dashboard

### Migration Path
Pass 1 data will be fully compatible with future versions. The persistent storage foundation ensures smooth upgrades.

---

## 📞 Support & Documentation

### API Documentation
- Interactive docs: http://localhost:8000/docs
- Alternative format: http://localhost:8000/redoc

### Logs Location
- Application logs: `backend/logs/`
- System logs available via Settings page

### Backup & Recovery
- Manual backups: Settings → Create Backup
- Automated backups: Use system cron/task scheduler
- Recovery: Use `scripts/backup_database.py restore`

---

**Status**: ✅ **Pass 1 Implementation Complete**
**Next Phase**: 🎯 **Pass 2: Advanced AI & Analytics Features**

---

*This documentation covers the persistent storage implementation (Pass 1). All features are designed for offline operation with local data storage for maximum reliability and performance.*
