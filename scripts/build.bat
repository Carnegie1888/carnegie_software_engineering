@echo off
REM ========================================
REM Build Script - Compile Java Servlet
REM Updated to match current project structure
REM ========================================

REM ==== Load config ====
call "%~dp0config.bat"

setlocal

REM ==== CONFIG ====
set PROJECT_ROOT=%~dp0..\
set SRC_DIR=%PROJECT_ROOT%backend\src
set WEBAPP_DIR=%PROJECT_ROOT%frontend\webapp
set BUILD_DIR=%PROJECT_ROOT%build

echo ========================================
echo   Servlet/JSP Build Script
echo ========================================
echo.

REM Clean old build directory
if exist "%BUILD_DIR%" (
    echo [1/4] Cleaning old build files...
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

echo [2/4] Compiling model classes...
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

echo [3/4] Compiling util and dao classes...
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

echo [4/4] Compiling service, filter, bootstrap and servlet classes...

REM Compile service/ai classes first (no dependencies on other service classes)
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

REM Compile servlets (in servlet/ subdirectory)
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

echo.
echo [5/5] Copying resource files...

REM Copy all frontend webapp resources (JSP/HTML/CSS/JS/images/module folders)
if exist "%WEBAPP_DIR%" (
    xcopy /Y /E "%WEBAPP_DIR%\*" "%BUILD_DIR%\" >nul
)

echo.
echo ========================================
echo   Build Complete!
echo   Output: %BUILD_DIR%
echo ========================================
echo.
echo Next steps:
echo   1. Run deploy.bat to deploy to Tomcat
echo   2. Run startup.bat to start Tomcat
echo.

endlocal
pause
