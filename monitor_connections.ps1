# Real-time Connection Monitor for IntelliLab GC
# This script monitors both frontend and backend connections in real-time

param(
    [int]$IntervalSeconds = 2,
    [string]$LogFile = "connection_monitor.log"
)

$LogPath = Join-Path $PWD $LogFile

function Write-Log {
    param($Message, $Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry
}

function Test-ServerConnection {
    param($Port, $Name)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ConnectAsync("127.0.0.1", $Port).Wait(1000)
        if ($tcpClient.Connected) {
            $tcpClient.Close()
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

function Get-ProcessInfo {
    param($ProcessName)
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            return $processes | Select-Object Id, StartTime, CPU, WorkingSet
        }
    }
    catch {
        return $null
    }
    return $null
}

function Test-HTTPEndpoint {
    param($Url, $TimeoutSec = 3)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            ContentLength = $response.Content.Length
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

Write-Log "Starting IntelliLab GC Connection Monitor"
Write-Log "Monitoring every $IntervalSeconds seconds"
Write-Log "Log file: $LogPath"

$startTime = Get-Date
$iteration = 0

while ($true) {
    $iteration++
    $elapsed = (Get-Date) - $startTime
    
    Write-Log "=== Monitor Check #$iteration (Elapsed: $($elapsed.ToString('hh\:mm\:ss'))) ==="
    
    # Check processes
    $nodeProcess = Get-ProcessInfo "node"
    $pythonProcess = Get-ProcessInfo "python"
    
    if ($nodeProcess) {
        Write-Log "✓ Node.js processes found: $($nodeProcess.Count)"
        foreach ($proc in $nodeProcess) {
            Write-Log "  - PID: $($proc.Id), CPU: $($proc.CPU), Memory: $([math]::Round($proc.WorkingSet/1MB, 2))MB"
        }
    } else {
        Write-Log "✗ No Node.js processes found" "WARNING"
    }
    
    if ($pythonProcess) {
        Write-Log "✓ Python processes found: $($pythonProcess.Count)"
        foreach ($proc in $pythonProcess) {
            Write-Log "  - PID: $($proc.Id), CPU: $($proc.CPU), Memory: $([math]::Round($proc.WorkingSet/1MB, 2))MB"
        }
    } else {
        Write-Log "✗ No Python processes found" "WARNING"
    }
    
    # Check port connectivity
    $frontendPort = Test-ServerConnection -Port 3000 -Name "Frontend"
    $backendPort = Test-ServerConnection -Port 8000 -Name "Backend"
    
    if ($frontendPort) {
        Write-Log "✓ Port 3000 (Frontend) is accepting connections"
    } else {
        Write-Log "✗ Port 3000 (Frontend) is not accessible" "ERROR"
    }
    
    if ($backendPort) {
        Write-Log "✓ Port 8000 (Backend) is accepting connections"
    } else {
        Write-Log "✗ Port 8000 (Backend) is not accessible" "ERROR"
    }
    
    # Test HTTP endpoints
    if ($frontendPort) {
        $frontendTest = Test-HTTPEndpoint "http://localhost:3000"
        if ($frontendTest.Success) {
            Write-Log "✓ Frontend HTTP responding: Status $($frontendTest.StatusCode), Size: $($frontendTest.ContentLength) bytes"
        } else {
            Write-Log "✗ Frontend HTTP error: $($frontendTest.Error)" "ERROR"
        }
    }
    
    if ($backendPort) {
        $backendTest = Test-HTTPEndpoint "http://localhost:8000/api/health"
        if ($backendTest.Success) {
            Write-Log "✓ Backend API responding: Status $($backendTest.StatusCode), Size: $($backendTest.ContentLength) bytes"
        } else {
            Write-Log "✗ Backend API error: $($backendTest.Error)" "ERROR"
        }
    }
    
    # Check network connections
    $connections = Get-NetTCPConnection -LocalPort @(3000, 8000) -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Log "Active network connections:"
        foreach ($conn in $connections) {
            Write-Log "  - Port $($conn.LocalPort): State=$($conn.State), Remote=$($conn.RemoteAddress):$($conn.RemotePort)"
        }
    } else {
        Write-Log "No active connections on ports 3000/8000" "WARNING"
    }
    
    Write-Log "--- End Check #$iteration ---"
    
    Start-Sleep -Seconds $IntervalSeconds
}