# IntelliLab GC Windows Firewall Configuration
# Creates idempotent firewall rules for local access to ports 8000 and 5173

param(
    [switch]$Remove,
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Define firewall rules
$FirewallRules = @(
    @{
        Name = "IntelliLab GC Backend (Port 8000)"
        DisplayName = "IntelliLab GC - Backend API"
        Description = "Allow local access to IntelliLab GC backend FastAPI server on port 8000"
        Port = 8000
        Protocol = "TCP"
        Direction = "Inbound"
        Action = "Allow"
        Profile = "Private,Public"
        LocalAddress = "127.0.0.1,::1"
        RemoteAddress = "LocalSubnet"
    },
    @{
        Name = "IntelliLab GC Frontend (Port 5173)"
        DisplayName = "IntelliLab GC - Frontend Server"
        Description = "Allow local access to IntelliLab GC frontend development/preview server on port 5173"
        Port = 5173
        Protocol = "TCP"
        Direction = "Inbound"
        Action = "Allow"
        Profile = "Private,Public"
        LocalAddress = "127.0.0.1,::1"
        RemoteAddress = "LocalSubnet"
    }
)

Write-Host "=== IntelliLab GC Firewall Configuration ===" -ForegroundColor Cyan
Write-Host "Script Version: 1.0.2" -ForegroundColor Gray
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Check if running as administrator
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $IsAdmin) {
    Write-Error "This script must be run as Administrator to modify Windows Firewall rules."
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running with Administrator privileges" -ForegroundColor Green

function Test-FirewallRuleExists {
    param($RuleName)
    try {
        $Existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
        return $Existing -ne $null
    } catch {
        return $false
    }
}

function Remove-IntelliLabFirewallRules {
    Write-Host "=== Removing IntelliLab GC Firewall Rules ===" -ForegroundColor Yellow
    
    foreach ($Rule in $FirewallRules) {
        try {
            if (Test-FirewallRuleExists $Rule.DisplayName) {
                Remove-NetFirewallRule -DisplayName $Rule.DisplayName -Confirm:$false
                Write-Host "✓ Removed rule: $($Rule.DisplayName)" -ForegroundColor Green
            } else {
                Write-Host "⚠ Rule not found: $($Rule.DisplayName)" -ForegroundColor Yellow
            }
        } catch {
            Write-Warning "Failed to remove rule '$($Rule.DisplayName)': $($_.Exception.Message)"
        }
    }
    
    Write-Host "Firewall rules removal completed." -ForegroundColor Cyan
}

function Install-IntelliLabFirewallRules {
    Write-Host "=== Installing IntelliLab GC Firewall Rules ===" -ForegroundColor Green
    
    foreach ($Rule in $FirewallRules) {
        try {
            $RuleExists = Test-FirewallRuleExists $Rule.DisplayName
            
            if ($RuleExists -and -not $Force) {
                Write-Host "✓ Rule already exists: $($Rule.DisplayName)" -ForegroundColor Cyan
                if ($Verbose) {
                    $ExistingRule = Get-NetFirewallRule -DisplayName $Rule.DisplayName
                    Write-Host "    Status: $($ExistingRule.Enabled)" -ForegroundColor Gray
                    Write-Host "    Direction: $($ExistingRule.Direction)" -ForegroundColor Gray
                    Write-Host "    Action: $($ExistingRule.Action)" -ForegroundColor Gray
                }
                continue
            }
            
            if ($RuleExists -and $Force) {
                Write-Host "🔄 Removing existing rule for update: $($Rule.DisplayName)" -ForegroundColor Yellow
                Remove-NetFirewallRule -DisplayName $Rule.DisplayName -Confirm:$false
            }
            
            # Create the firewall rule
            $NewRuleParams = @{
                DisplayName = $Rule.DisplayName
                Description = $Rule.Description
                Protocol = $Rule.Protocol
                LocalPort = $Rule.Port
                Direction = $Rule.Direction
                Action = $Rule.Action
                Profile = $Rule.Profile
                Enabled = $true
            }
            
            # Add address restrictions for security
            if ($Rule.LocalAddress) {
                $NewRuleParams.LocalAddress = $Rule.LocalAddress
            }
            if ($Rule.RemoteAddress) {
                $NewRuleParams.RemoteAddress = $Rule.RemoteAddress
            }
            
            New-NetFirewallRule @NewRuleParams | Out-Null
            Write-Host "✓ Created rule: $($Rule.DisplayName)" -ForegroundColor Green
            
            if ($Verbose) {
                Write-Host "    Port: $($Rule.Port)/$($Rule.Protocol)" -ForegroundColor Gray
                Write-Host "    Profile: $($Rule.Profile)" -ForegroundColor Gray
                Write-Host "    Local Address: $($Rule.LocalAddress)" -ForegroundColor Gray
                Write-Host "    Remote Address: $($Rule.RemoteAddress)" -ForegroundColor Gray
            }
            
        } catch {
            Write-Error "Failed to create firewall rule '$($Rule.DisplayName)': $($_.Exception.Message)"
            exit 1
        }
    }
    
    Write-Host "Firewall rules installation completed." -ForegroundColor Green
}

function Test-FirewallConfiguration {
    Write-Host "=== Testing Firewall Configuration ===" -ForegroundColor Yellow
    
    $TestResults = @{
        RulesFound = 0
        RulesEnabled = 0
        RulesConfigured = 0
        Issues = @()
    }
    
    foreach ($Rule in $FirewallRules) {
        try {
            $ExistingRule = Get-NetFirewallRule -DisplayName $Rule.DisplayName -ErrorAction SilentlyContinue
            
            if ($ExistingRule) {
                $TestResults.RulesFound++
                Write-Host "✓ Found rule: $($Rule.DisplayName)" -ForegroundColor Green
                
                if ($ExistingRule.Enabled -eq "True") {
                    $TestResults.RulesEnabled++
                    Write-Host "  ✓ Rule is enabled" -ForegroundColor Green
                } else {
                    $TestResults.Issues += "Rule '$($Rule.DisplayName)' is disabled"
                    Write-Host "  ⚠ Rule is disabled" -ForegroundColor Yellow
                }
                
                # Check port configuration
                $PortFilter = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $ExistingRule
                if ($PortFilter.LocalPort -eq $Rule.Port) {
                    $TestResults.RulesConfigured++
                    Write-Host "  ✓ Port $($Rule.Port) correctly configured" -ForegroundColor Green
                } else {
                    $TestResults.Issues += "Rule '$($Rule.DisplayName)' port configuration mismatch"
                    Write-Host "  ⚠ Port configuration mismatch" -ForegroundColor Yellow
                }
                
            } else {
                $TestResults.Issues += "Rule '$($Rule.DisplayName)' not found"
                Write-Host "✗ Rule not found: $($Rule.DisplayName)" -ForegroundColor Red
            }
        } catch {
            $TestResults.Issues += "Error checking rule '$($Rule.DisplayName)': $($_.Exception.Message)"
            Write-Host "✗ Error checking rule: $($Rule.DisplayName)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== Test Summary ===" -ForegroundColor Cyan
    Write-Host "Rules Found: $($TestResults.RulesFound)/$($FirewallRules.Count)" -ForegroundColor White
    Write-Host "Rules Enabled: $($TestResults.RulesEnabled)/$($FirewallRules.Count)" -ForegroundColor White
    Write-Host "Rules Configured: $($TestResults.RulesConfigured)/$($FirewallRules.Count)" -ForegroundColor White
    
    if ($TestResults.Issues.Count -gt 0) {
        Write-Host "Issues Found: $($TestResults.Issues.Count)" -ForegroundColor Red
        foreach ($Issue in $TestResults.Issues) {
            Write-Host "  • $Issue" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ All firewall rules are properly configured" -ForegroundColor Green
    }
    
    return $TestResults.Issues.Count -eq 0
}

try {
    if ($Remove) {
        Remove-IntelliLabFirewallRules
    } else {
        Install-IntelliLabFirewallRules
        
        # Test the configuration
        Write-Host ""
        $TestPassed = Test-FirewallConfiguration
        
        if ($TestPassed) {
            Write-Host ""
            Write-Host "🎉 Firewall configuration completed successfully!" -ForegroundColor Green
            Write-Host "IntelliLab GC ports are now accessible for local connections." -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "⚠ Firewall configuration completed with issues." -ForegroundColor Yellow
            Write-Host "Please review the issues above and run with -Force to recreate rules if needed." -ForegroundColor Yellow
            exit 1
        }
    }
    
} catch {
    Write-Error "Firewall configuration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Ensure you're running as Administrator" -ForegroundColor Gray
    Write-Host "2. Check Windows Firewall service is running" -ForegroundColor Gray
    Write-Host "3. Verify no third-party firewall is blocking the operation" -ForegroundColor Gray
    Write-Host "4. Try running with -Force to overwrite existing rules" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "For troubleshooting, you can:" -ForegroundColor Cyan
Write-Host "• Test rules: Get-NetFirewallRule -DisplayName '*IntelliLab*'" -ForegroundColor Gray
Write-Host "• Remove rules: $($MyInvocation.MyCommand.Name) -Remove" -ForegroundColor Gray
Write-Host "• Force reinstall: $($MyInvocation.MyCommand.Name) -Force" -ForegroundColor Gray

