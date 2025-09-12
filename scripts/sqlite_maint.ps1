# IntelliLab GC SQLite Database Maintenance
# Performs VACUUM, REINDEX, and integrity checks on the SQLite database

param(
    [switch]$VacuumOnly,
    [switch]$ReindexOnly,
    [switch]$IntegrityCheck,
    [switch]$Force,
    [switch]$Verbose,
    [string]$DatabasePath = "",
    [string]$LogFile = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

# Default database path
if (-not $DatabasePath) {
    $DatabasePath = Join-Path $AppRoot "backend\intellilab_gc.db"
    # Also check in data directory
    $DataDirDb = "C:\IntelliLab_GC\Data\intellilab_gc.db"
    if (-not (Test-Path $DatabasePath) -and (Test-Path $DataDirDb)) {
        $DatabasePath = $DataDirDb
    }
}

# Default log file
if (-not $LogFile) {
    $LogsDir = Join-Path $AppRoot "logs"
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    $LogFile = Join-Path $LogsDir "sqlite_maintenance.log"
}

function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Write to console with color
    $Color = switch ($Level) {
        "INFO" { "White" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
        default { "Gray" }
    }
    Write-Host $LogEntry -ForegroundColor $Color
    
    # Write to log file
    try {
        Add-Content -Path $LogFile -Value $LogEntry -Encoding UTF8
    } catch {
        Write-Warning "Could not write to log file: $LogFile"
    }
}

function Get-DatabaseSize {
    param($Path)
    if (Test-Path $Path) {
        $Size = (Get-Item $Path).Length
        return @{
            Bytes = $Size
            MB = [math]::Round($Size / 1MB, 2)
            GB = [math]::Round($Size / 1GB, 3)
        }
    }
    return $null
}

function Invoke-SqliteCommand {
    param($DatabasePath, $Command, $Description)
    
    Write-Log "Executing: $Description" "INFO"
    if ($Verbose) {
        Write-Log "SQL Command: $Command" "INFO"
    }
    
    try {
        # Try using sqlite3.exe if available
        $SqliteExe = Get-Command sqlite3 -ErrorAction SilentlyContinue
        if ($SqliteExe) {
            $Result = & sqlite3 $DatabasePath $Command 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ $Description completed successfully" "SUCCESS"
                return $Result
            } else {
                throw "sqlite3 command failed with exit code $LASTEXITCODE"
            }
        } else {
            # Fallback to Python if sqlite3.exe not available
            $PythonScript = @"
import sqlite3
import sys

try:
    conn = sqlite3.connect('$($DatabasePath.Replace('\', '\\'))')
    cursor = conn.cursor()
    cursor.execute('$Command')
    if '$Command'.upper().startswith('SELECT') or '$Command'.upper().startswith('PRAGMA'):
        results = cursor.fetchall()
        for row in results:
            print(row)
    conn.commit()
    conn.close()
    print('Command executed successfully')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"@
            
            $TempScript = [System.IO.Path]::GetTempFileName() + ".py"
            $PythonScript | Out-File $TempScript -Encoding UTF8
            
            try {
                $Result = & python $TempScript 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✓ $Description completed successfully" "SUCCESS"
                    return $Result
                } else {
                    throw "Python SQLite command failed: $Result"
                }
            } finally {
                Remove-Item $TempScript -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-Log "✗ $Description failed: $($_.Exception.Message)" "ERROR"
        throw
    }
}

Write-Log "=== IntelliLab GC SQLite Maintenance ===" "INFO"
Write-Log "Script Version: 1.0.2" "INFO"
Write-Log "Database: $DatabasePath" "INFO"
Write-Log "Log File: $LogFile" "INFO"

# Check if database exists
if (-not (Test-Path $DatabasePath)) {
    Write-Log "Database file not found: $DatabasePath" "ERROR"
    exit 1
}

# Get initial database size
$InitialSize = Get-DatabaseSize $DatabasePath
Write-Log "Initial database size: $($InitialSize.MB) MB ($($InitialSize.Bytes) bytes)" "INFO"

# Check if database is accessible
try {
    $TestResult = Invoke-SqliteCommand $DatabasePath "SELECT 1;" "Database connectivity test"
    Write-Log "Database connectivity verified" "SUCCESS"
} catch {
    Write-Log "Database is not accessible or corrupted" "ERROR"
    exit 1
}

$MaintenanceResults = @{
    InitialSize = $InitialSize
    TasksPerformed = @()
    Errors = @()
    StartTime = Get-Date
}

try {
    # Integrity Check (always perform if not explicitly disabled)
    if (-not $VacuumOnly -and -not $ReindexOnly) {
        Write-Log "=== Performing Integrity Check ===" "INFO"
        try {
            $IntegrityResult = Invoke-SqliteCommand $DatabasePath "PRAGMA integrity_check;" "Database integrity check"
            
            if ($IntegrityResult -contains "ok") {
                Write-Log "✓ Database integrity check passed" "SUCCESS"
                $MaintenanceResults.TasksPerformed += "Integrity Check: PASSED"
            } else {
                Write-Log "⚠ Database integrity issues found:" "WARN"
                foreach ($Issue in $IntegrityResult) {
                    Write-Log "  • $Issue" "WARN"
                }
                $MaintenanceResults.Errors += "Integrity issues detected"
                
                if (-not $Force) {
                    Write-Log "Stopping maintenance due to integrity issues. Use -Force to continue." "ERROR"
                    exit 1
                }
            }
        } catch {
            Write-Log "Integrity check failed: $($_.Exception.Message)" "ERROR"
            $MaintenanceResults.Errors += "Integrity check failed"
            if (-not $Force) {
                exit 1
            }
        }
    }
    
    # VACUUM operation
    if (-not $ReindexOnly) {
        Write-Log "=== Performing VACUUM ===" "INFO"
        try {
            # Get page count before VACUUM
            $PageCountBefore = Invoke-SqliteCommand $DatabasePath "PRAGMA page_count;" "Get page count before VACUUM"
            
            # Perform VACUUM
            Invoke-SqliteCommand $DatabasePath "VACUUM;" "Database VACUUM operation"
            
            # Get page count after VACUUM
            $PageCountAfter = Invoke-SqliteCommand $DatabasePath "PRAGMA page_count;" "Get page count after VACUUM"
            
            $PagesReclaimed = $PageCountBefore - $PageCountAfter
            Write-Log "VACUUM completed. Pages reclaimed: $PagesReclaimed" "SUCCESS"
            $MaintenanceResults.TasksPerformed += "VACUUM: Reclaimed $PagesReclaimed pages"
            
        } catch {
            Write-Log "VACUUM operation failed: $($_.Exception.Message)" "ERROR"
            $MaintenanceResults.Errors += "VACUUM failed"
            if (-not $Force) {
                exit 1
            }
        }
    }
    
    # REINDEX operation
    if (-not $VacuumOnly) {
        Write-Log "=== Performing REINDEX ===" "INFO"
        try {
            # Get list of indexes
            $Indexes = Invoke-SqliteCommand $DatabasePath "SELECT name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL;" "Get index list"
            
            if ($Indexes) {
                Write-Log "Found $($Indexes.Count) indexes to rebuild" "INFO"
                
                # Rebuild all indexes
                Invoke-SqliteCommand $DatabasePath "REINDEX;" "Rebuild all database indexes"
                
                Write-Log "REINDEX completed successfully" "SUCCESS"
                $MaintenanceResults.TasksPerformed += "REINDEX: Rebuilt $($Indexes.Count) indexes"
            } else {
                Write-Log "No indexes found to rebuild" "INFO"
                $MaintenanceResults.TasksPerformed += "REINDEX: No indexes to rebuild"
            }
            
        } catch {
            Write-Log "REINDEX operation failed: $($_.Exception.Message)" "ERROR"
            $MaintenanceResults.Errors += "REINDEX failed"
            if (-not $Force) {
                exit 1
            }
        }
    }
    
    # Get final database size
    $FinalSize = Get-DatabaseSize $DatabasePath
    $SizeDifference = $InitialSize.Bytes - $FinalSize.Bytes
    $SizeDifferenceMB = [math]::Round($SizeDifference / 1MB, 2)
    
    $MaintenanceResults.FinalSize = $FinalSize
    $MaintenanceResults.SpaceReclaimed = $SizeDifference
    $MaintenanceResults.EndTime = Get-Date
    $MaintenanceResults.Duration = $MaintenanceResults.EndTime - $MaintenanceResults.StartTime
    
    Write-Log "=== Maintenance Summary ===" "INFO"
    Write-Log "Final database size: $($FinalSize.MB) MB" "INFO"
    Write-Log "Space reclaimed: $SizeDifferenceMB MB" "SUCCESS"
    Write-Log "Duration: $($MaintenanceResults.Duration.ToString('hh\:mm\:ss'))" "INFO"
    Write-Log "Tasks performed: $($MaintenanceResults.TasksPerformed.Count)" "INFO"
    
    foreach ($Task in $MaintenanceResults.TasksPerformed) {
        Write-Log "  ✓ $Task" "SUCCESS"
    }
    
    if ($MaintenanceResults.Errors.Count -gt 0) {
        Write-Log "Errors encountered: $($MaintenanceResults.Errors.Count)" "WARN"
        foreach ($Error in $MaintenanceResults.Errors) {
            Write-Log "  ✗ $Error" "ERROR"
        }
    }
    
    # Update database statistics
    try {
        Invoke-SqliteCommand $DatabasePath "ANALYZE;" "Update database statistics"
        Write-Log "Database statistics updated" "SUCCESS"
    } catch {
        Write-Log "Failed to update database statistics: $($_.Exception.Message)" "WARN"
    }
    
    Write-Log "🎉 SQLite maintenance completed successfully!" "SUCCESS"
    
} catch {
    Write-Log "Maintenance failed with critical error: $($_.Exception.Message)" "ERROR"
    exit 1
}

# Export maintenance results to JSON for monitoring
try {
    $ResultsFile = Join-Path $LogsDir "sqlite_maintenance_results.json"
    $MaintenanceResults | ConvertTo-Json -Depth 3 | Out-File $ResultsFile -Encoding UTF8
    Write-Log "Maintenance results saved to: $ResultsFile" "INFO"
} catch {
    Write-Log "Could not save maintenance results: $($_.Exception.Message)" "WARN"
}

Write-Log "Maintenance log saved to: $LogFile" "INFO"
exit 0

