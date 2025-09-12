@echo off
echo 🛑 COMPREHENSIVE TESTING PROTOCOL - IntelliLab GC
echo =================================================
echo.

echo Starting PowerShell testing suite...
echo.

powershell -ExecutionPolicy Bypass -File "comprehensive_testing_suite.ps1"

echo.
echo Testing completed. Check TESTING_REPORT.md for results.
echo.
pause
