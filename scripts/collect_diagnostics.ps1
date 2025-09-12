# IntelliLab GC Diagnostics Collector
# Collects logs, system information, and configuration data for troubleshooting

param(
    [string]$OutputDir = $env:TEMP,
    [switch]$IncludeSystemInfo,
    [switch]$IncludeDependencies,
    [int]$LogLinesToCapture = 200
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

# Generate output filename
$Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$DiagFileName = "IntelliLabGC_Diag_$Timestamp.zip"
$DiagPath = Join-Path $OutputDir $DiagFileName
$TempDir = Join-Path $env:TEMP "IntelliLabGC_Diag_$Timestamp"

Write-Host "=== IntelliLab GC Diagnostics Collector ===" -ForegroundColor Cyan
Write-Host "Collection started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Temporary directory: $TempDir" -ForegroundColor Gray
Write-Host "Output file: $DiagPath" -ForegroundColor Gray
Write-Host ""

try {
    # Create temporary directory
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

    # 1. Collect application logs
    Write-Host "Collecting application logs..." -ForegroundColor Yellow
    $LogsSourceDir = Join-Path $AppRoot "logs"
    if (Test-Path $LogsSourceDir) {
        $LogsDestDir = Join-Path $TempDir "app_logs"
        Copy-Item $LogsSourceDir -Destination $LogsDestDir -Recurse -ErrorAction SilentlyContinue
        Write-Host "✓ Application logs collected" -ForegroundColor Green
    } else {
        Write-Host "⚠ No application logs directory found" -ForegroundColor Yellow
    }

    # 2. Collect startup log (last N lines)
    Write-Host "Collecting startup log (last $LogLinesToCapture lines)..." -ForegroundColor Yellow
    $StartupLogPath = Join-Path $AppRoot "logs\start.log"
    if (Test-Path $StartupLogPath) {
        $StartupLogDest = Join-Path $TempDir "start_log_recent.txt"
        try {
            $LastLines = Get-Content $StartupLogPath -Tail $LogLinesToCapture
            $LastLines | Out-File $StartupLogDest -Encoding UTF8
            Write-Host "✓ Recent startup log collected ($($LastLines.Count) lines)" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not read startup log: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ No startup log found" -ForegroundColor Yellow
    }

    # 3. Collect Python environment info
    if ($IncludeDependencies) {
        Write-Host "Collecting Python environment..." -ForegroundColor Yellow
        $VenvPath = Join-Path $AppRoot "venv"
        $ActivateScript = Join-Path $VenvPath "Scripts\Activate.ps1"
        
        if (Test-Path $ActivateScript) {
            try {
                & $ActivateScript
                $PipFreeze = & pip freeze 2>&1
                $PipFreeze | Out-File (Join-Path $TempDir "pip_freeze.txt") -Encoding UTF8
                Write-Host "✓ Python dependencies collected" -ForegroundColor Green
            } catch {
                Write-Host "⚠ Could not collect Python dependencies: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠ Python virtual environment not found" -ForegroundColor Yellow
        }
    }

    # 4. Collect Node.js environment info
    if ($IncludeDependencies) {
        Write-Host "Collecting Node.js environment..." -ForegroundColor Yellow
        try {
            $NodeVersion = & node --version 2>&1
            $NpmVersion = & npm --version 2>&1
            $NpmList = & npm list --depth=0 2>&1
            
            $NodeInfo = @"
Node.js Version: $NodeVersion
npm Version: $NpmVersion

Installed Packages:
$NpmList
"@
            $NodeInfo | Out-File (Join-Path $TempDir "nodejs_info.txt") -Encoding UTF8
            Write-Host "✓ Node.js environment collected" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not collect Node.js environment: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    # 5. Collect system information
    if ($IncludeSystemInfo) {
        Write-Host "Collecting system information..." -ForegroundColor Yellow
        try {
            $SystemInfo = Get-ComputerInfo | Select-Object @(
                'WindowsProductName',
                'WindowsVersion', 
                'TotalPhysicalMemory',
                'AvailablePhysicalMemory',
                'ProcessorName',
                'ProcessorManufacturer',
                'ProcessorMaxClockSpeed',
                'LogicalProcessors',
                'TimeZone',
                'LastBootUpTime'
            )
            
            $SystemInfo | ConvertTo-Json -Depth 2 | Out-File (Join-Path $TempDir "system_info.json") -Encoding UTF8
            Write-Host "✓ System information collected" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not collect system information: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    # 6. Collect disk space information
    Write-Host "Collecting disk space information..." -ForegroundColor Yellow
    try {
        $DiskInfo = Get-WmiObject -Class Win32_LogicalDisk | Select-Object @(
            'DeviceID',
            @{Name='SizeGB'; Expression={[math]::Round($_.Size / 1GB, 2)}},
            @{Name='FreeSpaceGB'; Expression={[math]::Round($_.FreeSpace / 1GB, 2)}},
            @{Name='PercentFree'; Expression={[math]::Round(($_.FreeSpace / $_.Size) * 100, 1)}},
            'FileSystem',
            'VolumeName'
        )
        
        $DiskInfo | ConvertTo-Json -Depth 2 | Out-File (Join-Path $TempDir "disk_info.json") -Encoding UTF8
        Write-Host "✓ Disk space information collected" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not collect disk information: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # 7. Collect network/port information
    Write-Host "Collecting network port information..." -ForegroundColor Yellow
    try {
        $PortInfo = Get-NetTCPConnection | Where-Object { 
            $_.LocalPort -in @(8000, 5173, 3000) -or $_.State -eq 'Listen' 
        } | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess
        
        $PortInfo | ConvertTo-Json -Depth 2 | Out-File (Join-Path $TempDir "port_info.json") -Encoding UTF8
        Write-Host "✓ Network port information collected" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not collect network information: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # 8. Collect configuration files
    Write-Host "Collecting configuration files..." -ForegroundColor Yellow
    $ConfigFiles = @(
        "backend\requirements.txt",
        "backend\main.py",
        "frontend\package.json",
        "config\default_settings.json"
    )
    
    $ConfigDir = Join-Path $TempDir "config"
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    
    foreach ($ConfigFile in $ConfigFiles) {
        $SourcePath = Join-Path $AppRoot $ConfigFile
        if (Test-Path $SourcePath) {
            $DestPath = Join-Path $ConfigDir (Split-Path $ConfigFile -Leaf)
            Copy-Item $SourcePath $DestPath -ErrorAction SilentlyContinue
        }
    }
    Write-Host "✓ Configuration files collected" -ForegroundColor Green

    # 9. Create collection summary
    Write-Host "Creating collection summary..." -ForegroundColor Yellow
    $Summary = @"
IntelliLab GC Diagnostics Collection Summary
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Collector Version: 1.0.2
Computer: $env:COMPUTERNAME
User: $env:USERNAME

Collection Parameters:
- Include System Info: $IncludeSystemInfo
- Include Dependencies: $IncludeDependencies
- Log Lines Captured: $LogLinesToCapture

Collected Files:
$(Get-ChildItem $TempDir -Recurse | Select-Object -ExpandProperty FullName | ForEach-Object { "  • " + ($_ -replace [regex]::Escape($TempDir), "") })

Collection completed successfully.
"@
    
    $Summary | Out-File (Join-Path $TempDir "collection_summary.txt") -Encoding UTF8
    Write-Host "✓ Collection summary created" -ForegroundColor Green

    # 10. Create ZIP archive
    Write-Host "Creating ZIP archive..." -ForegroundColor Yellow
    Add-Type -AssemblyName "System.IO.Compression.FileSystem"
    [System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $DiagPath)
    Write-Host "✓ ZIP archive created: $DiagPath" -ForegroundColor Green

    # Calculate archive size
    $ArchiveSize = (Get-Item $DiagPath).Length
    $ArchiveSizeMB = [math]::Round($ArchiveSize / 1MB, 2)

    Write-Host ""
    Write-Host "=== Collection Complete ===" -ForegroundColor Green
    Write-Host "Archive: $DiagPath" -ForegroundColor White
    Write-Host "Size: $ArchiveSizeMB MB" -ForegroundColor White
    Write-Host "Files: $(Get-ChildItem $TempDir -Recurse | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "📧 Please attach this file when contacting support." -ForegroundColor Cyan
    
} catch {
    Write-Error "Collection failed: $($_.Exception.Message)"
    exit 1
} finally {
    # Cleanup temporary directory
    if (Test-Path $TempDir) {
        try {
            Remove-Item $TempDir -Recurse -Force
            Write-Host "✓ Temporary files cleaned up" -ForegroundColor Gray
        } catch {
            Write-Warning "Could not clean up temporary directory: $TempDir"
        }
    }
}

