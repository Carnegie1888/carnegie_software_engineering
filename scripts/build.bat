@echo off
REM ========================================
REM Build Script - Compile Java Servlet
REM ========================================

REM ==== Load config ====
call "%~dp0config.bat"

setlocal

REM Prefer JDK from config when JAVA_HOME is set (matches javac with project JDK)
if defined JAVA_HOME if exist "%JAVA_HOME%\bin" set "PATH=%JAVA_HOME%\bin;%PATH%"

REM ==== CONFIG ====
set PROJECT_ROOT=%~dp0..\
set SRC_DIR=%PROJECT_ROOT%backend\src
set WEBAPP_DIR=%PROJECT_ROOT%frontend\webapp
set BUILD_DIR=%PROJECT_ROOT%build
set CP_SERVLET=%TOMCAT_HOME%\lib\servlet-api.jar
set CP_WITH_CLASSES=%CP_SERVLET%;%BUILD_DIR%\WEB-INF\classes

echo ========================================
echo   Servlet/JSP Build Script
echo ========================================
echo.

REM Clean old build directory
if exist "%BUILD_DIR%" (
    echo [1/3] Cleaning old build files...
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

echo [2/3] Compiling Java source files...

REM Compile all .java files in subdirectories
REM First pass: model, StoragePaths (DAO dependency), then dao classes
echo First pass: compiling model and dao classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_SERVLET%" "%SRC_DIR%\com\example\authlogin\model\User.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_SERVLET%" "%SRC_DIR%\com\example\authlogin\model\Applicant.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\util\StoragePaths.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\dao\UserDao.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\dao\ApplicantDao.java" || exit /b 1

REM Second pass: compile util and filter classes
echo Second pass: compiling util classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\util\SessionUtil.java" || exit /b 1

REM Compile Job model and DAO
echo Compiling Job model and DAO...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_SERVLET%" "%SRC_DIR%\com\example\authlogin\model\Job.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\dao\JobDao.java" || exit /b 1

REM Compile Application model and DAO (Member 4)
echo Compiling Application model and DAO...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_SERVLET%" "%SRC_DIR%\com\example\authlogin\model\Application.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\dao\ApplicationDao.java" || exit /b 1

echo Third pass: compiling filter classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\filter\AuthFilter.java" || exit /b 1

echo Fourth pass: compiling servlet classes...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\LoginServlet.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\RegisterServlet.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\LogoutServlet.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\HelloServlet.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\ApplicantServlet.java" || exit /b 1
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\JobServlet.java" || exit /b 1

REM Compile ApplyServlet (Member 4 - Application Status)
echo Compiling ApplyServlet...
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\ApplyServlet.java" || exit /b 1

REM Compile permission util that depends on session util
javac -encoding UTF-8 -d "%BUILD_DIR%\WEB-INF\classes" -cp "%CP_WITH_CLASSES%" "%SRC_DIR%\com\example\authlogin\util\PermissionUtil.java" || exit /b 1

echo [3/3] Copying resource files...

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
