@echo off
REM ========================================
REM Dev Script - Build + Deploy + Start in one
REM ========================================

REM ==== Load config ====
call "%~dp0config.bat"

setlocal

REM ==== CONFIG ====
set PROJECT_ROOT=%~dp0..\
set SRC_DIR=%PROJECT_ROOT%backend\src
set WEBAPP_DIR=%PROJECT_ROOT%frontend\webapp
set BUILD_DIR=%PROJECT_ROOT%build
set TARGET_DIR=%CATALINA_HOME%\webapps\%APP_NAME%
set FRONTEND_DIR=%PROJECT_ROOT%frontend\webapp

echo ========================================
echo   Dev Script - All in One
echo ========================================
echo.

REM ========================================
REM STEP 1: BUILD
REM ========================================

echo [1/3] Building...
echo.

REM Clean old build directory
if exist "%BUILD_DIR%" (
    echo   Cleaning old build files...
    rmdir /S /Q "%BUILD_DIR%"
)

REM Create output directory
if not exist "%BUILD_DIR%\WEB-INF\classes" mkdir "%BUILD_DIR%\WEB-INF\classes"

REM Check Tomcat path
if not exist "%TOMCAT_HOME%" (
    echo [ERROR] Tomcat not found: %TOMCAT_HOME%
    echo Please check config.bat
    exit /b 1
)

set CLASSPATH=%TOMCAT_HOME%\lib\servlet-api.jar;%BUILD_DIR%\WEB-INF\classes

echo   Compiling model classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\model\User.java" ^
    "%SRC_DIR%\com\example\authlogin\model\AdminInvite.java" ^
    "%SRC_DIR%\com\example\authlogin\model\Applicant.java" ^
    "%SRC_DIR%\com\example\authlogin\model\Job.java" ^
    "%SRC_DIR%\com\example\authlogin\model\Application.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Model compilation failed!
    exit /b 1
)

echo   Compiling util and dao classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\util\StoragePaths.java" ^
    "%SRC_DIR%\com\example\authlogin\util\JsonResponseUtil.java" ^
    "%SRC_DIR%\com\example\authlogin\util\SecurityTokenUtil.java" ^
    "%SRC_DIR%\com\example\authlogin\util\FuzzySearchUtil.java" ^
    "%SRC_DIR%\com\example\authlogin\util\SessionUtil.java" ^
    "%SRC_DIR%\com\example\authlogin\util\PermissionUtil.java" ^
    "%SRC_DIR%\com\example\authlogin\util\Logger.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Util compilation failed!
    exit /b 1
)

javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\dao\UserDao.java" ^
    "%SRC_DIR%\com\example\authlogin\dao\AdminInviteDao.java" ^
    "%SRC_DIR%\com\example\authlogin\dao\ApplicantDao.java" ^
    "%SRC_DIR%\com\example\authlogin\dao\JobDao.java" ^
    "%SRC_DIR%\com\example\authlogin\dao\ApplicationDao.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] DAO compilation failed!
    exit /b 1
)

echo   Compiling service, filter, bootstrap and servlet classes...

REM Compile service/ai classes first
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\service\ai\AiSkillMatchClient.java" ^
    "%SRC_DIR%\com\example\authlogin\service\ai\TaJobMatchAiConfig.java" ^
    "%SRC_DIR%\com\example\authlogin\service\ai\HttpAiSkillMatchClient.java" ^
    "%SRC_DIR%\com\example\authlogin\service\ai\TongyiXiaomiAnalysisClient.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AI service compilation failed!
    exit /b 1
)

REM Compile service classes
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\service\SkillMatchService.java" ^
    "%SRC_DIR%\com\example\authlogin\service\TaJobMatchAnalysisService.java" ^
    "%SRC_DIR%\com\example\authlogin\service\WorkloadStatsService.java" ^
    "%SRC_DIR%\com\example\authlogin\service\AdminInviteEmailService.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Service compilation failed!
    exit /b 1
)

REM Compile filter
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\filter\AuthFilter.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Filter compilation failed!
    exit /b 1
)

REM Compile bootstrap
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\bootstrap\DemoAccountBootstrapListener.java" ^
    "%SRC_DIR%\com\example\authlogin\bootstrap\DemoDataSeeder.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Bootstrap compilation failed!
    exit /b 1
)

REM Compile servlets
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CLASSPATH%" ^
    "%SRC_DIR%\com\example\authlogin\servlet\LoginServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\RegisterServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\LogoutServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\ApplicantServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\ApplicantAccessServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\JobServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\ApplyServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\SkillMatchServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\TaJobMatchAnalysisServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\MoApplicationMatchAnalysisServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\WorkloadStatsServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\AdminInviteServlet.java" ^
    "%SRC_DIR%\com\example\authlogin\servlet\AdminInviteAcceptServlet.java"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Servlet compilation failed!
    exit /b 1
)

echo   Copying resource files...
if exist "%WEBAPP_DIR%" (
    xcopy /Y /E "%WEBAPP_DIR%\*" "%BUILD_DIR%\" >nul
)

echo   Build Complete!
echo.

REM ========================================
REM STEP 2: DEPLOY
REM ========================================

echo [2/3] Deploying...
echo.

REM Check build directory
if not exist "%BUILD_DIR%" (
    echo [ERROR] Build directory not found. Run build.bat first.
    exit /b 1
)

REM Check Tomcat directory
if not exist "%CATALINA_HOME%" (
    echo [ERROR] Tomcat not found: %CATALINA_HOME%
    echo Please check config.bat
    exit /b 1
)

echo   Stopping Tomcat (if running)...
call "%CATALINA_HOME%\bin\shutdown.bat"

timeout /t 2 /nobreak >nul

echo   Deploying to Tomcat...

REM Delete old version
if exist "%TARGET_DIR%" (
    echo   Removing old version...
    rmdir /S /Q "%TARGET_DIR%"
)

REM Use robocopy to avoid xcopy wildcard ambiguity
robocopy "%BUILD_DIR%" "%TARGET_DIR%" /E /NFL /NDL /NJH /NJS /NP >nul
if %ERRORLEVEL% GEQ 8 (
    echo [ERROR] Failed to copy build artifacts to Tomcat webapps.
    exit /b 1
)

REM Safety sync for frontend static assets
if exist "%FRONTEND_DIR%\css" (
    robocopy "%FRONTEND_DIR%\css" "%TARGET_DIR%\css" /E /NFL /NDL /NJH /NJS /NP >nul
    if %ERRORLEVEL% GEQ 8 (
        echo [ERROR] Failed to sync frontend css assets.
        exit /b 1
    )
)

if exist "%FRONTEND_DIR%\js" (
    robocopy "%FRONTEND_DIR%\js" "%TARGET_DIR%\js" /E /NFL /NDL /NJH /NJS /NP >nul
    if %ERRORLEVEL% GEQ 8 (
        echo [ERROR] Failed to sync frontend js assets.
        exit /b 1
    )
)

REM Trigger Tomcat context reload
if exist "%TARGET_DIR%\WEB-INF\web.xml" (
    powershell -NoProfile -Command "(Get-Item '%TARGET_DIR%\WEB-INF\web.xml').LastWriteTime = Get-Date" >nul
)

echo   Deploy Complete!
echo.

REM ========================================
REM STEP 3: START
REM ========================================

echo [3/3] Starting Tomcat...
echo.

if not exist "%CATALINA_HOME%" (
    echo [ERROR] Tomcat not found: %CATALINA_HOME%
    echo Please check config.bat
    exit /b 1
)

call "%CATALINA_HOME%\bin\startup.bat"

echo.
echo ========================================
echo   All Done!
echo ========================================
echo.
echo Access URLs:
echo   - Home: http://localhost:8080/%APP_NAME%/
echo   - Login: http://localhost:8080/%APP_NAME%/login.jsp
echo.
echo Tomcat Manager: http://localhost:8080/manager/html
echo.

endlocal
pause
