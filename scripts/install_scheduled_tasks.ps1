# IntelliLab GC Scheduled Tasks Configuration
# Creates scheduled tasks for automated backup and database maintenance

param(
    [switch]$Remove,
    [switch]$Force,
    [switch]$Verbose,
    [string]$DataDir = "C:\IntelliLab_GC\Data"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

# Define scheduled tasks
$ScheduledTasks = @(
    @{
        TaskName = "IntelliLab GC Daily Backup"
        Description = "Automated daily backup of IntelliLab GC database at 2:00 AM"
        Action = "powershell.exe"
        Arguments = "-ExecutionPolicy Bypass -File `"$ScriptDir\backup_database.py`" backup"
        Trigger = @{
            Type = "Daily"
            At = "2:00 AM"
        }
        User = "SYSTEM"
        RunLevel = "Highest"
        Settings = @{
            AllowStartIfOnBatteries = $true
            DontStopIfGoingOnBatteries = $true
            StartWhenAvailable = $true
            RestartOnFailure = $true
            ExecutionTimeLimit = "PT30M"  # 30 minutes
        }
    },
    @{
        TaskName = "IntelliLab GC Weekly Maintenance"
        Description = "Weekly database maintenance (VACUUM and REINDEX) on Sundays at 3:00 AM"
        Action = "powershell.exe"
        Arguments = "-ExecutionPolicy Bypass -File `"$ScriptDir\sqlite_maint.ps1`""
        Trigger = @{
            Type = "Weekly"
            DaysOfWeek = "Sunday"
            At = "3:00 AM"
        }
        User = "SYSTEM"
        RunLevel = "Highest"
        Settings = @{
            AllowStartIfOnBatteries = $true
            DontStopIfGoingOnBatteries = $true
            StartWhenAvailable = $true
            RestartOnFailure = $true
            ExecutionTimeLimit = "PT60M"  # 60 minutes
        }
    }
)

Write-Host "=== IntelliLab GC Scheduled Tasks Configuration ===" -ForegroundColor Cyan
Write-Host "Script Version: 1.0.2" -ForegroundColor Gray
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "App Root: $AppRoot" -ForegroundColor Gray
Write-Host "Scripts Directory: $ScriptDir" -ForegroundColor Gray

# Check if running as administrator
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $IsAdmin) {
    Write-Error "This script must be run as Administrator to create scheduled tasks."
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running with Administrator privileges" -ForegroundColor Green

function Test-ScheduledTaskExists {
    param($TaskName)
    try {
        $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        return $Task -ne $null
    } catch {
        return $false
    }
}

function Remove-IntelliLabScheduledTasks {
    Write-Host "=== Removing IntelliLab GC Scheduled Tasks ===" -ForegroundColor Yellow
    
    foreach ($TaskDef in $ScheduledTasks) {
        try {
            if (Test-ScheduledTaskExists $TaskDef.TaskName) {
                Unregister-ScheduledTask -TaskName $TaskDef.TaskName -Confirm:$false
                Write-Host "✓ Removed task: $($TaskDef.TaskName)" -ForegroundColor Green
            } else {
                Write-Host "⚠ Task not found: $($TaskDef.TaskName)" -ForegroundColor Yellow
            }
        } catch {
            Write-Warning "Failed to remove task '$($TaskDef.TaskName)': $($_.Exception.Message)"
        }
    }
    
    Write-Host "Scheduled tasks removal completed." -ForegroundColor Cyan
}

function Install-IntelliLabScheduledTasks {
    Write-Host "=== Installing IntelliLab GC Scheduled Tasks ===" -ForegroundColor Green
    
    foreach ($TaskDef in $ScheduledTasks) {
        try {
            $TaskExists = Test-ScheduledTaskExists $TaskDef.TaskName
            
            if ($TaskExists -and -not $Force) {
                Write-Host "✓ Task already exists: $($TaskDef.TaskName)" -ForegroundColor Cyan
                if ($Verbose) {
                    $ExistingTask = Get-ScheduledTask -TaskName $TaskDef.TaskName
                    Write-Host "    State: $($ExistingTask.State)" -ForegroundColor Gray
                    Write-Host "    Last Run: $($ExistingTask.LastRunTime)" -ForegroundColor Gray
                    Write-Host "    Next Run: $($ExistingTask.NextRunTime)" -ForegroundColor Gray
                }
                continue
            }
            
            if ($TaskExists -and $Force) {
                Write-Host "🔄 Removing existing task for update: $($TaskDef.TaskName)" -ForegroundColor Yellow
                Unregister-ScheduledTask -TaskName $TaskDef.TaskName -Confirm:$false
            }
            
            # Create the scheduled task action
            $Action = New-ScheduledTaskAction -Execute $TaskDef.Action -Argument $TaskDef.Arguments -WorkingDirectory $ScriptDir
            
            # Create the trigger based on type
            if ($TaskDef.Trigger.Type -eq "Daily") {
                $Trigger = New-ScheduledTaskTrigger -Daily -At $TaskDef.Trigger.At
            } elseif ($TaskDef.Trigger.Type -eq "Weekly") {
                $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $TaskDef.Trigger.DaysOfWeek -At $TaskDef.Trigger.At
            } else {
                throw "Unsupported trigger type: $($TaskDef.Trigger.Type)"
            }
            
            # Create task settings
            $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries:$TaskDef.Settings.AllowStartIfOnBatteries `
                                                      -DontStopIfGoingOnBatteries:$TaskDef.Settings.DontStopIfGoingOnBatteries `
                                                      -StartWhenAvailable:$TaskDef.Settings.StartWhenAvailable `
                                                      -RestartOnFailure:$TaskDef.Settings.RestartOnFailure `
                                                      -ExecutionTimeLimit $TaskDef.Settings.ExecutionTimeLimit
            
            # Create principal (user context)
            $Principal = New-ScheduledTaskPrincipal -UserId $TaskDef.User -RunLevel $TaskDef.RunLevel
            
            # Register the scheduled task
            Register-ScheduledTask -TaskName $TaskDef.TaskName `
                                   -Description $TaskDef.Description `
                                   -Action $Action `
                                   -Trigger $Trigger `
                                   -Settings $Settings `
                                   -Principal $Principal | Out-Null
            
            Write-Host "✓ Created task: $($TaskDef.TaskName)" -ForegroundColor Green
            
            if ($Verbose) {
                Write-Host "    Description: $($TaskDef.Description)" -ForegroundColor Gray
                Write-Host "    Action: $($TaskDef.Action) $($TaskDef.Arguments)" -ForegroundColor Gray
                Write-Host "    Trigger: $($TaskDef.Trigger.Type) at $($TaskDef.Trigger.At)" -ForegroundColor Gray
                Write-Host "    User: $($TaskDef.User)" -ForegroundColor Gray
            }
            
        } catch {
            Write-Error "Failed to create scheduled task '$($TaskDef.TaskName)': $($_.Exception.Message)"
            exit 1
        }
    }
    
    Write-Host "Scheduled tasks installation completed." -ForegroundColor Green
}

function Test-ScheduledTasksConfiguration {
    Write-Host "=== Testing Scheduled Tasks Configuration ===" -ForegroundColor Yellow
    
    $TestResults = @{
        TasksFound = 0
        TasksEnabled = 0
        TasksReady = 0
        Issues = @()
    }
    
    foreach ($TaskDef in $ScheduledTasks) {
        try {
            $ExistingTask = Get-ScheduledTask -TaskName $TaskDef.TaskName -ErrorAction SilentlyContinue
            
            if ($ExistingTask) {
                $TestResults.TasksFound++
                Write-Host "✓ Found task: $($TaskDef.TaskName)" -ForegroundColor Green
                
                if ($ExistingTask.State -eq "Ready") {
                    $TestResults.TasksReady++
                    Write-Host "  ✓ Task is ready" -ForegroundColor Green
                } else {
                    $TestResults.Issues += "Task '$($TaskDef.TaskName)' state is $($ExistingTask.State)"
                    Write-Host "  ⚠ Task state: $($ExistingTask.State)" -ForegroundColor Yellow
                }
                
                # Check if task files exist
                $ActionArgs = $TaskDef.Arguments -replace '"', ''
                $ScriptFile = $ActionArgs -split ' ' | Where-Object { $_ -like "*.ps1" -or $_ -like "*.py" } | Select-Object -First 1
                
                if ($ScriptFile -and (Test-Path $ScriptFile)) {
                    Write-Host "  ✓ Script file exists: $(Split-Path $ScriptFile -Leaf)" -ForegroundColor Green
                } else {
                    $TestResults.Issues += "Script file not found for task '$($TaskDef.TaskName)': $ScriptFile"
                    Write-Host "  ⚠ Script file missing: $ScriptFile" -ForegroundColor Yellow
                }
                
                # Show next run time
                $TaskInfo = Get-ScheduledTaskInfo -TaskName $TaskDef.TaskName -ErrorAction SilentlyContinue
                if ($TaskInfo -and $TaskInfo.NextRunTime) {
                    Write-Host "  ➤ Next run: $($TaskInfo.NextRunTime)" -ForegroundColor Cyan
                }
                
            } else {
                $TestResults.Issues += "Task '$($TaskDef.TaskName)' not found"
                Write-Host "✗ Task not found: $($TaskDef.TaskName)" -ForegroundColor Red
            }
        } catch {
            $TestResults.Issues += "Error checking task '$($TaskDef.TaskName)': $($_.Exception.Message)"
            Write-Host "✗ Error checking task: $($TaskDef.TaskName)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== Test Summary ===" -ForegroundColor Cyan
    Write-Host "Tasks Found: $($TestResults.TasksFound)/$($ScheduledTasks.Count)" -ForegroundColor White
    Write-Host "Tasks Ready: $($TestResults.TasksReady)/$($ScheduledTasks.Count)" -ForegroundColor White
    
    if ($TestResults.Issues.Count -gt 0) {
        Write-Host "Issues Found: $($TestResults.Issues.Count)" -ForegroundColor Red
        foreach ($Issue in $TestResults.Issues) {
            Write-Host "  • $Issue" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ All scheduled tasks are properly configured" -ForegroundColor Green
    }
    
    return $TestResults.Issues.Count -eq 0
}

function Show-TaskSchedule {
    Write-Host "=== Scheduled Task Schedule ===" -ForegroundColor Cyan
    
    foreach ($TaskDef in $ScheduledTasks) {
        Write-Host "📅 $($TaskDef.TaskName)" -ForegroundColor White
        Write-Host "   Description: $($TaskDef.Description)" -ForegroundColor Gray
        
        if ($TaskDef.Trigger.Type -eq "Daily") {
            Write-Host "   Schedule: Daily at $($TaskDef.Trigger.At)" -ForegroundColor Gray
        } elseif ($TaskDef.Trigger.Type -eq "Weekly") {
            Write-Host "   Schedule: Weekly on $($TaskDef.Trigger.DaysOfWeek) at $($TaskDef.Trigger.At)" -ForegroundColor Gray
        }
        
        # Check if task exists and show next run
        if (Test-ScheduledTaskExists $TaskDef.TaskName) {
            try {
                $TaskInfo = Get-ScheduledTaskInfo -TaskName $TaskDef.TaskName
                if ($TaskInfo.NextRunTime) {
                    Write-Host "   Next Run: $($TaskInfo.NextRunTime)" -ForegroundColor Green
                }
                if ($TaskInfo.LastRunTime) {
                    Write-Host "   Last Run: $($TaskInfo.LastRunTime) (Result: $($TaskInfo.LastTaskResult))" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   Status: Unable to retrieve schedule info" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   Status: Task not installed" -ForegroundColor Red
        }
        Write-Host ""
    }
}

try {
    if ($Remove) {
        Remove-IntelliLabScheduledTasks
    } else {
        Install-IntelliLabScheduledTasks
        
        # Test the configuration
        Write-Host ""
        $TestPassed = Test-ScheduledTasksConfiguration
        
        # Show schedule
        Write-Host ""
        Show-TaskSchedule
        
        if ($TestPassed) {
            Write-Host "🎉 Scheduled tasks configuration completed successfully!" -ForegroundColor Green
            Write-Host "IntelliLab GC will now perform automated backups and maintenance." -ForegroundColor White
        } else {
            Write-Host "⚠ Scheduled tasks configuration completed with issues." -ForegroundColor Yellow
            Write-Host "Please review the issues above and run with -Force to recreate tasks if needed." -ForegroundColor Yellow
            exit 1
        }
    }
    
} catch {
    Write-Error "Scheduled tasks configuration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Ensure you're running as Administrator" -ForegroundColor Gray
    Write-Host "2. Check Task Scheduler service is running" -ForegroundColor Gray
    Write-Host "3. Verify script files exist in the scripts directory" -ForegroundColor Gray
    Write-Host "4. Try running with -Force to overwrite existing tasks" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "For management, you can:" -ForegroundColor Cyan
Write-Host "• View tasks: Get-ScheduledTask -TaskName '*IntelliLab*'" -ForegroundColor Gray
Write-Host "• Remove tasks: $($MyInvocation.MyCommand.Name) -Remove" -ForegroundColor Gray
Write-Host "• Force reinstall: $($MyInvocation.MyCommand.Name) -Force" -ForegroundColor Gray
Write-Host "• View schedule: $($MyInvocation.MyCommand.Name) -Verbose" -ForegroundColor Gray

