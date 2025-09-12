# IntelliLab GC Asset Packing Script
# This script identifies and copies all project assets to a new folder

param(
    [Parameter(Mandatory=$true)]
    [string]$DestinationPath
)

# Create destination directory if it doesn't exist
if (!(Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Path $DestinationPath -Force
    Write-Host "Created destination directory: $DestinationPath" -ForegroundColor Green
}

# Define asset categories and their files
$AssetCategories = @{
    "ProjectLogos" = @(
        "frontend\public\IntelliLab_GC_logo.png",
        "frontend\public\IntelliLab_GC_logo.jpg", 
        "frontend\build\IntelliLab_GC_logo.png",
        "frontend\build\IntelliLab_GC_logo.jpg"
    )
    "AppIcons" = @(
        "frontend\public\logo192.png",
        "frontend\public\logo512.png",
        "frontend\build\logo192.png", 
        "frontend\build\logo512.png"
    )
    "WebManifests" = @(
        "frontend\public\manifest.json",
        "frontend\public\manifest.webmanifest",
        "frontend\build\manifest.json",
        "frontend\build\manifest.webmanifest"
    )
    "ServiceWorkers" = @(
        "frontend\public\sw.js",
        "frontend\build\sw.js"
    )
    "HTMLTemplates" = @(
        "frontend\public\index.html",
        "frontend\build\index.html"
    )
    "BuildAssets" = @(
        "frontend\build\asset-manifest.json",
        "frontend\build\static\js\main.add285ec.js",
        "frontend\build\static\js\main.add285ec.js.LICENSE.txt",
        "frontend\build\static\js\main.add285ec.js.map"
    )
    "TestResults" = @(
        "frontend\test-results\validation-IntelliLab-GC-C-9621e--Validates-formula-accuracy-chromium\test-failed-1.png",
        "frontend\test-results\validation-IntelliLab-GC-C-1f185-Values-survive-page-refresh-chromium\test-failed-1.png",
        "frontend\test-results\validation-IntelliLab-GC-C-9621e--Validates-formula-accuracy-chromium\video.webm",
        "frontend\test-results\validation-IntelliLab-GC-C-1f185-Values-survive-page-refresh-chromium\video.webm"
    )
}

# Function to copy files with directory structure
function Copy-AssetWithStructure {
    param(
        [string]$SourceFile,
        [string]$DestinationRoot,
        [string]$Category
    )
    
    if (Test-Path $SourceFile) {
        $RelativePath = $SourceFile
        $DestinationFile = Join-Path $DestinationRoot $Category $RelativePath
        $DestinationDir = Split-Path $DestinationFile -Parent
        
        if (!(Test-Path $DestinationDir)) {
            New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
        }
        
        Copy-Item -Path $SourceFile -Destination $DestinationFile -Force
        Write-Host "Copied: $SourceFile -> $DestinationFile" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "File not found: $SourceFile" -ForegroundColor Yellow
        return $false
    }
}

# Copy assets by category
$TotalFiles = 0
$CopiedFiles = 0

Write-Host "`n=== IntelliLab GC Asset Packing ===" -ForegroundColor Magenta
Write-Host "Destination: $DestinationPath`n" -ForegroundColor White

foreach ($Category in $AssetCategories.Keys) {
    Write-Host "Processing category: $Category" -ForegroundColor Green
    
    foreach ($AssetFile in $AssetCategories[$Category]) {
        $TotalFiles++
        if (Copy-AssetWithStructure -SourceFile $AssetFile -DestinationRoot $DestinationPath -Category $Category) {
            $CopiedFiles++
        }
    }
    Write-Host ""
}

# Create asset inventory file
$InventoryPath = Join-Path $DestinationPath "ASSET_INVENTORY.md"
$InventoryContent = @"
# IntelliLab GC Asset Inventory

Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Source Project: $PWD
Destination: $DestinationPath

## Summary
- Total Assets Found: $TotalFiles
- Successfully Copied: $CopiedFiles
- Missing Files: $($TotalFiles - $CopiedFiles)

## Asset Categories

### Project Logos
Main branding assets for the IntelliLab GC application:
$($AssetCategories["ProjectLogos"] | ForEach-Object { "- $_" } | Out-String)

### App Icons  
Application icons for web app manifest:
$($AssetCategories["AppIcons"] | ForEach-Object { "- $_" } | Out-String)

### Web Manifests
Progressive Web App configuration files:
$($AssetCategories["WebManifests"] | ForEach-Object { "- $_" } | Out-String)

### Service Workers
PWA service worker files:
$($AssetCategories["ServiceWorkers"] | ForEach-Object { "- $_" } | Out-String)

### HTML Templates
Main application HTML templates:
$($AssetCategories["HTMLTemplates"] | ForEach-Object { "- $_" } | Out-String)

### Build Assets
Compiled JavaScript and build artifacts:
$($AssetCategories["BuildAssets"] | ForEach-Object { "- $_" } | Out-String)

### Test Results
Playwright test screenshots and videos:
$($AssetCategories["TestResults"] | ForEach-Object { "- $_" } | Out-String)

## Notes

### Excluded Assets
The following asset types were found but excluded from packing as they are typically regenerated:
- Node.js dependencies (frontend\node_modules\**)
- Python virtual environment (venv\**)
- Third-party library assets (matplotlib, scipy, etc.)

### Usage Instructions
1. These assets represent the core visual and configuration elements of IntelliLab GC
2. When moving to a new environment, ensure:
   - Logo files are placed in both public and build directories
   - Manifest files are updated with correct paths
   - Service worker is properly registered
   - Build assets are regenerated for production

### Asset Dependencies
- Logo files: Used in manifest.json, index.html, and React components
- Manifest files: Required for PWA functionality
- Service worker: Enables offline functionality
- Build assets: Production-ready compiled code

"@

$InventoryContent | Out-File -FilePath $InventoryPath -Encoding UTF8

Write-Host "=== Packing Complete ===" -ForegroundColor Magenta
Write-Host "Total files processed: $TotalFiles" -ForegroundColor White
Write-Host "Successfully copied: $CopiedFiles" -ForegroundColor Green
Write-Host "Asset inventory created: $InventoryPath" -ForegroundColor Cyan

if ($CopiedFiles -lt $TotalFiles) {
    Write-Host "Warning: Some files were not found. Check the inventory for details." -ForegroundColor Yellow
}

Write-Host "`nAssets have been organized by category in: $DestinationPath" -ForegroundColor Green

