#!/usr/bin/env bash
# ========================================
# Dev Script - Build + Deploy + Start in one
# ========================================

# Auto-add execute permission if needed
if [ ! -x "$0" ]; then
    chmod +x "$0"
    exec "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ==== Load config ====
source "$SCRIPT_DIR/config.sh"

# ==== CONFIG ====
SRC_DIR="$PROJECT_ROOT/backend/src"
WEBAPP_DIR="$PROJECT_ROOT/frontend/webapp"
BUILD_DIR="$PROJECT_ROOT/build"
TARGET_DIR="$CATALINA_HOME/webapps/$APP_NAME"
FRONTEND_DIR="$PROJECT_ROOT/frontend/webapp"

echo "========================================"
echo "  Dev Script - All in One"
echo "========================================"
echo ""

# ========================================
# STEP 1: BUILD
# ========================================

echo "[1/3] Building..."
echo ""

# Clean old build directory
if [ -d "$BUILD_DIR" ]; then
    echo "  Cleaning old build files..."
    rm -rf "$BUILD_DIR"
fi

# Create output directory
mkdir -p "$BUILD_DIR/WEB-INF/classes"

# Check Tomcat path
if [ ! -d "$TOMCAT_HOME" ]; then
    echo "[ERROR] Tomcat not found: $TOMCAT_HOME"
    echo "Please check config.sh"
    exit 1
fi

CLASSPATH="$TOMCAT_HOME/lib/servlet-api.jar:$BUILD_DIR/WEB-INF/classes"

echo "  Compiling model classes..."
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/model/User.java" \
    "$SRC_DIR/com/example/authlogin/model/AdminInvite.java" \
    "$SRC_DIR/com/example/authlogin/model/Applicant.java" \
    "$SRC_DIR/com/example/authlogin/model/Job.java" \
    "$SRC_DIR/com/example/authlogin/model/Application.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Model compilation failed!"
    exit 1
fi

echo "  Compiling util and dao classes..."
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/util/StoragePaths.java" \
    "$SRC_DIR/com/example/authlogin/util/JsonResponseUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/SecurityTokenUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/FuzzySearchUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/SessionUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/PermissionUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/Logger.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Util compilation failed!"
    exit 1
fi

javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/dao/UserDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/AdminInviteDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/ApplicantDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/JobDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/ApplicationDao.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] DAO compilation failed!"
    exit 1
fi

echo "  Compiling service, filter, bootstrap and servlet classes..."

# Compile service/ai classes first
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/service/ai/AiSkillMatchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/TaJobMatchAiConfig.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/HttpAiSkillMatchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/TongyiXiaomiAnalysisClient.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] AI service compilation failed!"
    exit 1
fi

# Compile service classes
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/service/SkillMatchService.java" \
    "$SRC_DIR/com/example/authlogin/service/TaJobMatchAnalysisService.java" \
    "$SRC_DIR/com/example/authlogin/service/WorkloadStatsService.java" \
    "$SRC_DIR/com/example/authlogin/service/AdminInviteEmailService.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Service compilation failed!"
    exit 1
fi

# Compile filter
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/filter/AuthFilter.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Filter compilation failed!"
    exit 1
fi

# Compile bootstrap
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/bootstrap/DemoAccountBootstrapListener.java" \
    "$SRC_DIR/com/example/authlogin/bootstrap/DemoDataSeeder.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Bootstrap compilation failed!"
    exit 1
fi

# Compile servlets
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/servlet/LoginServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/RegisterServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/LogoutServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplicantServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplicantAccessServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/JobServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplyServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/SkillMatchServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/TaJobMatchAnalysisServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/MoApplicationMatchAnalysisServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/WorkloadStatsServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/AdminInviteServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/AdminInviteAcceptServlet.java"

if [ $? -ne 0 ]; then
    echo "[ERROR] Servlet compilation failed!"
    exit 1
fi

echo "  Copying resource files..."
if [ -d "$WEBAPP_DIR" ]; then
    cp -r "$WEBAPP_DIR/"* "$BUILD_DIR/"
fi

echo "  Build Complete!"
echo ""

# ========================================
# STEP 2: DEPLOY
# ========================================

echo "[2/3] Deploying..."
echo ""

# Check build directory
if [ ! -d "$BUILD_DIR" ]; then
    echo "[ERROR] Build directory not found. Run build first."
    exit 1
fi

# Check Tomcat directory
if [ ! -d "$CATALINA_HOME" ]; then
    echo "[ERROR] Tomcat not found: $CATALINA_HOME"
    echo "Please check config.sh"
    exit 1
fi

echo "  Stopping Tomcat (if running)..."
"$CATALINA_HOME/bin/shutdown.sh"

sleep 2

echo "  Deploying to Tomcat..."

# Delete old version
if [ -d "$TARGET_DIR" ]; then
    echo "  Removing old version..."
    rm -rf "$TARGET_DIR"
fi

# Copy build to Tomcat
cp -r "$BUILD_DIR/"* "$TARGET_DIR/"

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to copy build artifacts to Tomcat webapps."
    exit 1
fi

# Safety sync for frontend static assets
if [ -d "$FRONTEND_DIR/css" ]; then
    cp -r "$FRONTEND_DIR/css/"* "$TARGET_DIR/css/"
fi

if [ -d "$FRONTEND_DIR/js" ]; then
    cp -r "$FRONTEND_DIR/js/"* "$TARGET_DIR/js/"
fi

# Touch web.xml to trigger reload
if [ -f "$TARGET_DIR/WEB-INF/web.xml" ]; then
    touch "$TARGET_DIR/WEB-INF/web.xml"
fi

echo "  Deploy Complete!"
echo ""

# ========================================
# STEP 3: START
# ========================================

echo "[3/3] Starting Tomcat..."
echo ""

if [ ! -d "$CATALINA_HOME" ]; then
    echo "[ERROR] Tomcat not found: $CATALINA_HOME"
    echo "Please check config.sh"
    exit 1
fi

"$CATALINA_HOME/bin/startup.sh"

echo ""
echo "========================================"
echo "  All Done!"
echo "========================================"
echo ""
echo "Access URLs:"
echo "  - Home: http://localhost:8080/$APP_NAME/"
echo "  - Login: http://localhost:8080/$APP_NAME/login.jsp"
echo ""
echo "Tomcat Manager: http://localhost:8080/manager/html"
echo ""

read -p "Press Enter to exit..."
