@echo off
REM ========================================
REM Member 5 Frontend Test - Windows
REM ========================================

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..
set "FRONTEND_TEST_DIR=%PROJECT_ROOT%\frontend\test"

echo.
echo [member5] Starting member frontend test

where node >nul 2>&1
if errorlevel 1 (
    echo [member5] FAIL - Missing command: node
    exit /b 1
)

node "%FRONTEND_TEST_DIR%\member5-frontend-test.js"
if errorlevel 1 (
    echo [member5] FAIL - Member test failed
    exit /b 1
)
echo [member5] PASS - Member test passed
