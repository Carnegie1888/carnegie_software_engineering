@echo off
REM ========================================
REM Member 6 Architecture Test - Windows
REM ========================================

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..
set "FRONTEND_TEST_DIR=%PROJECT_ROOT%\frontend\test"

echo.
echo [member6] Starting member architecture test

where node >nul 2>&1
if errorlevel 1 (
    echo [member6] FAIL - Missing command: node
    exit /b 1
)

node "%FRONTEND_TEST_DIR%\member6-architecture-test.js"
if errorlevel 1 (
    echo [member6] FAIL - Member test failed
    exit /b 1
)
echo [member6] PASS - Member test passed
