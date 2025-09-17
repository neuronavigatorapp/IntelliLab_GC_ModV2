# PowerShell AI Engine Test Script
# ================================

Write-Host "🧪 AI Engine Test - PowerShell Version" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8001"

# Test 1: Health Check
Write-Host "`n1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Status: $($response.status)" -ForegroundColor Green
    Write-Host "   Engines Available: $($response.engines_available)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Method Optimization Engine
Write-Host "`n2️⃣ Testing Method Optimization Engine..." -ForegroundColor Yellow
try {
    $body = @{
        compound_name = "Caffeine"
        method_type = "GC-MS"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/method-optimization" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Method Optimization: $($response.performance_improvement)% improvement predicted" -ForegroundColor Green
    Write-Host "   Confidence Score: $($response.confidence_score)" -ForegroundColor Gray
    Write-Host "   Time Savings: $($response.estimated_time_savings)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Method Optimization Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Predictive Maintenance Engine
Write-Host "`n3️⃣ Testing Predictive Maintenance Engine..." -ForegroundColor Yellow
try {
    $body = @{
        instruments = @(1, 2, 3)
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/maintenance-predictions" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Predictive Maintenance: $($response.Count) instrument predictions generated" -ForegroundColor Green
    
    foreach ($prediction in $response) {
        Write-Host "   Instrument $($prediction.instrument_id): $($prediction.current_condition) condition" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Predictive Maintenance Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Cost Optimization Engine
Write-Host "`n4️⃣ Testing Cost Optimization Engine..." -ForegroundColor Yellow
try {
    $body = @{
        analysis_period = "monthly"
        departments = @("lab1", "lab2")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/cost-optimization" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Cost Optimization: `$$($response.potential_savings) potential savings identified" -ForegroundColor Green
    Write-Host "   Savings Percentage: $($response.savings_percentage)%" -ForegroundColor Gray
    Write-Host "   ROI Estimate: $($response.roi_estimate)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Cost Optimization Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 AI Engine Testing Complete!" -ForegroundColor Cyan