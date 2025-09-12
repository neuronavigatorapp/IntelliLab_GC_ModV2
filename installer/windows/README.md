# IntelliLab GC Windows Installer

This directory contains the Windows installer setup files for IntelliLab GC using [Inno Setup](https://jrsoftware.org/isinfo.php).

## Quick Start

### 1. Verify Installation Files

Before building the installer, run the verification script to check all required files:

```powershell
cd installer\windows
powershell -ExecutionPolicy Bypass -File .\test_installer_files.ps1 -Verbose
```

### 2. Build the Installer

1. **Install Inno Setup** (free): Download from https://jrsoftware.org/isinfo.php
2. **Open the script**: `installer\windows\IntelliLabGC.iss` in Inno Setup Compiler
3. **Build**: Click Build → Compile (or press F9)
4. **Output**: Find `IntelliLabGC_Setup_1.0.0.exe` in the `installer\windows` directory

## Prerequisites

### For Building the Installer

- **Inno Setup 6.0+** (free from official website)
- **Complete IntelliLab GC repository** with all source files
- **Windows 10/11** (64-bit recommended)

### For End Users (Runtime Requirements)

The installer checks for these and warns if missing:

- **Python 3.8+** with pip
- **Node.js 14+** with npm  
- **Administrator privileges** (for installation to Program Files)

## Verification Script

The `test_installer_files.ps1` script performs comprehensive checks:

### Basic Usage

```powershell
cd installer\windows
powershell -ExecutionPolicy Bypass -File .\test_installer_files.ps1
```

### Available Options

```powershell
# Verbose output (shows all checks)
powershell -ExecutionPolicy Bypass -File .\test_installer_files.ps1 -Verbose

# Strict mode (fails on any missing optional files)
powershell -ExecutionPolicy Bypass -File .\test_installer_files.ps1 -Strict

# Both options
powershell -ExecutionPolicy Bypass -File .\test_installer_files.ps1 -Verbose -Strict
```

### What It Checks

**Required Files:**
- `installer/windows/IntelliLabGC.iss` (the installer script)
- `scripts/start_local.ps1` (PowerShell startup script)
- `scripts/start_local.cmd` (CMD wrapper)
- `backend/` directory with main.py
- `frontend/` directory with package.json

**Optional Assets (warnings only):**
- Application icons in `frontend/public/`
- Documentation files (README.md, STARTUP_GUIDE.md)
- Tools directory
- Node.js dependencies (node_modules)

**Source Path Validation:**
- Parses the .iss file and validates all `Source:` paths
- Ensures files referenced in the installer actually exist
- Reports missing files with clear error messages

## Repository Structure

The installer expects this directory structure:

```
IntelliLab_GC_ModV2/
├── installer/
│   └── windows/
│       ├── IntelliLabGC.iss              ← Installer script
│       ├── README.md                     ← This file
│       └── test_installer_files.ps1      ← Verification script
├── frontend/                             ← React application
│   ├── package.json
│   ├── public/
│   │   ├── IntelliLab_GC_logo.png       ← App icon
│   │   └── [other assets]
│   └── src/
├── backend/                              ← FastAPI application
│   ├── main.py or app/main.py           ← Entry point
│   ├── requirements.txt
│   └── [other backend files]
├── scripts/
│   ├── start_local.ps1                  ← PowerShell startup
│   ├── start_local.cmd                  ← CMD wrapper
│   └── setup_environment.py             ← Database setup
├── common/                               ← Shared utilities
├── core/                                 ← Core application logic
├── tools/                                ← Development tools
├── config/                               ← Configuration files
├── requirements.txt                      ← Python dependencies
├── README.md                             ← Main documentation
└── STARTUP_GUIDE.md                     ← Startup instructions
```

## Customization

### Changing Installation Directory

Edit `IntelliLabGC.iss`:

```ini
#define InstallRoot "{pf}\IntelliLabGC"          ; Default: C:\Program Files\IntelliLabGC
#define DataDir "C:\IntelliLab_GC\Data"          ; User data directory
```

### Updating Version

```ini
#define MyAppVersion "1.0.0"                     ; Update version number
```

### Adding Files

Add entries to the `[Files]` section:

```ini
Source: "..\..\your_file.txt"; DestDir: "{app}"; Flags: ignoreversion
```

**Important**: All `Source:` paths are relative to the `.iss` file location. The `..\..\` prefix navigates up to the repository root.

## What the Installer Does

### Installation Process

1. **System Checks**: Verifies Python and Node.js availability
2. **File Copy**: Installs application files to `%ProgramFiles%\IntelliLabGC\`
3. **Data Directory**: Creates `C:\IntelliLab_GC\Data` (preserved on uninstall)
4. **Shortcuts**: Creates Start Menu and optional Desktop shortcuts
5. **Registration**: Registers with Windows Add/Remove Programs

### First Launch Process

When users run IntelliLab GC for the first time:

1. **Virtual Environment**: Creates Python venv in application directory
2. **Dependencies**: Installs Python packages from requirements.txt
3. **Database**: Runs migrations and loads sample data
4. **Node Modules**: Installs frontend dependencies (if needed)
5. **Services**: Starts backend (FastAPI) and frontend (React)
6. **Browser**: Opens application in default web browser

### Directory Structure After Installation

```
C:\Program Files\IntelliLabGC\            ← Application files
├── frontend/                             ← React app
├── backend/                              ← FastAPI server
├── scripts/
│   ├── start_local.ps1                  ← Main startup script
│   └── start_local.cmd                  ← Windows wrapper
└── [other application directories]

C:\IntelliLab_GC\Data\                   ← User data (preserved)
├── backups/                             ← Database backups
├── uploads/                             ← User uploads
└── reports/                             ← Generated reports
```

## Troubleshooting

### Verification Script Issues

**"Missing required path" errors:**
- Ensure you're running from the correct directory
- Check that all referenced files exist in the repository
- Verify the repository structure matches expectations

**"Source path not found" warnings:**
- Update file paths in `IntelliLabGC.iss` if you've moved files
- Use `-Strict` flag to treat warnings as errors
- Check that relative paths `..\..\` resolve correctly

### Build Issues

**"Source file not found" in Inno Setup:**
- Run verification script first: `.\test_installer_files.ps1 -Verbose`
- Fix any reported missing files
- Ensure Inno Setup Compiler has read access to all directories

**"Access denied" during build:**
- Run Inno Setup Compiler as Administrator
- Ensure no antivirus is blocking the build process
- Close any applications that might be using the files

### Installation Issues

**"Python not found" during installation:**
- Install Python 3.8+ from python.org
- Ensure Python is added to system PATH
- Restart after Python installation

**"Node.js not found" during installation:**
- Install Node.js 14+ from nodejs.org
- Ensure npm is available in system PATH
- Restart after Node.js installation

**"Permission denied" during installation:**
- Run installer as Administrator
- Ensure installation directory is writable
- Close any running instances of the application

### Runtime Issues

**Application fails to start:**
- Check Windows Firewall settings for ports 8000 and 3000
- Run startup script manually: `scripts\start_local.ps1 -DevMode`
- Check application logs in the installation directory
- Verify all dependencies are properly installed

## Command Line Options

### Silent Installation

```cmd
IntelliLabGC_Setup_1.0.0.exe /SILENT
IntelliLabGC_Setup_1.0.0.exe /VERYSILENT /NORESTART
```

### Startup Script Options

```powershell
# Development mode with hot reload
scripts\start_local.ps1 -DevMode

# Skip automatic browser opening
scripts\start_local.ps1 -SkipBrowser

# Build production frontend
scripts\start_local.ps1 -Preview

# Custom data directory
scripts\start_local.ps1 -DataDir "D:\MyData\IntelliLabGC"
```

## Security Notes

- Installer requires administrator privileges for Program Files installation
- User data is stored outside Program Files for security
- No sensitive information is embedded in the installer
- All network traffic is local (localhost) by default
- Database files are created with appropriate permissions

## Support

For installer-related issues:

1. **Run verification script** with `-Verbose` flag
2. **Check installation log** (created automatically by Inno Setup)
3. **Verify system requirements** (Python, Node.js, admin privileges)
4. **Try manual startup** using scripts in the installation directory

For application issues, see the main project documentation and startup guide.