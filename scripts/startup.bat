@echo off
REM ========================================
REM Start Tomcat Script
REM ========================================

REM ==== Load config ====
call "%~dp0config.bat"

setlocal

echo ========================================
echo   Start Tomcat
echo ========================================
echo.

if not exist "%CATALINA_HOME%" (
    echo [ERROR] Tomcat not found: %CATALINA_HOME%
    echo Please check config.bat
    exit /b 1
)

if not defined JAVA_HOME (
    echo [ERROR] JAVA_HOME is not set. Add it to config.bat or Windows environment variables.
    exit /b 1
)
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERROR] Invalid JAVA_HOME: %JAVA_HOME%
    echo java.exe not found. Fix the path in config.bat.
    exit /b 1
)

echo Using JAVA_HOME=%JAVA_HOME%
echo Starting Tomcat...
echo.

REM Start Tomcat
call "%CATALINA_HOME%\bin\startup.bat"
if errorlevel 1 (
    echo.
    echo [ERROR] Tomcat did not start. See messages above or logs under Tomcat\logs\
    endlocal
    exit /b 1
)

echo.
echo ========================================
echo   Tomcat Started!
echo ========================================
echo.
echo Access URLs:
echo   - Home: http://localhost:8080/%APP_NAME%/
echo   - JSP:  http://localhost:8080/%APP_NAME%/jsp/welcome.jsp
echo   - Servlet: http://localhost:8080/%APP_NAME%/hello
echo.
echo Tomcat Manager: http://localhost:8080/manager/html
echo.

endlocal
pause
