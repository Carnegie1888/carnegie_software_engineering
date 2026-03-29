#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Build Script - Compile Java Servlet
# ========================================

# Auto-add execute permission if needed
if [[ ! -x "${BASH_SOURCE[0]}" ]]; then
    chmod +x "${BASH_SOURCE[0]}"
    exec "${BASH_SOURCE[0]}" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${SCRIPT_DIR}/config.sh" ]]; then
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/config.sh"
else
    echo "[ERROR] Missing scripts/config.sh"
    echo "Please run:"
    echo "  cd scripts && cp config.example.sh config.sh"
    exit 1
fi

: "${TOMCAT_HOME:=${CATALINA_HOME:-}}"
: "${APP_NAME:=groupproject}"

SRC_DIR="${PROJECT_ROOT}/backend/src"
WEBAPP_DIR="${PROJECT_ROOT}/frontend/webapp"
BUILD_DIR="${PROJECT_ROOT}/build"
CLASSES_DIR="${BUILD_DIR}/WEB-INF/classes"

echo "========================================"
echo "  Servlet/JSP Build Script"
echo "========================================"
echo ""

# Clean old build directory
if [[ -d "${BUILD_DIR}" ]]; then
    echo "[1/5] Cleaning old build files..."
    rm -rf "${BUILD_DIR}"
fi

# Create output directory
mkdir -p "${CLASSES_DIR}"

# Check Tomcat path
if [[ -z "${TOMCAT_HOME}" || ! -d "${TOMCAT_HOME}" ]]; then
    echo "[ERROR] Tomcat not found: ${TOMCAT_HOME:-<empty>}"
    echo "Please check scripts/config.sh"
    exit 1
fi

SERVLET_API_JAR="${TOMCAT_HOME}/lib/servlet-api.jar"
if [[ ! -f "${SERVLET_API_JAR}" ]]; then
    echo "[ERROR] servlet-api.jar not found: ${SERVLET_API_JAR}"
    echo "Please verify TOMCAT_HOME in scripts/config.sh"
    exit 1
fi

CLASSPATH="${SERVLET_API_JAR}:${CLASSES_DIR}"

echo "[2/5] Compiling model classes..."
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/model/User.java" \
    "${SRC_DIR}/com/example/authlogin/model/AdminInvite.java" \
    "${SRC_DIR}/com/example/authlogin/model/Applicant.java" \
    "${SRC_DIR}/com/example/authlogin/model/Job.java" \
    "${SRC_DIR}/com/example/authlogin/model/Application.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Model compilation failed!"
    exit 1
fi

echo "[3/5] Compiling util and dao classes..."
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/util/StoragePaths.java" \
    "${SRC_DIR}/com/example/authlogin/util/JsonResponseUtil.java" \
    "${SRC_DIR}/com/example/authlogin/util/SecurityTokenUtil.java" \
    "${SRC_DIR}/com/example/authlogin/util/FuzzySearchUtil.java" \
    "${SRC_DIR}/com/example/authlogin/util/SessionUtil.java" \
    "${SRC_DIR}/com/example/authlogin/util/PermissionUtil.java" \
    "${SRC_DIR}/com/example/authlogin/util/Logger.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Util compilation failed!"
    exit 1
fi

javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/dao/UserDao.java" \
    "${SRC_DIR}/com/example/authlogin/dao/AdminInviteDao.java" \
    "${SRC_DIR}/com/example/authlogin/dao/ApplicantDao.java" \
    "${SRC_DIR}/com/example/authlogin/dao/JobDao.java" \
    "${SRC_DIR}/com/example/authlogin/dao/ApplicationDao.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] DAO compilation failed!"
    exit 1
fi

echo "[4/5] Compiling service, filter, bootstrap and servlet classes..."

# Compile service/ai classes first (no dependencies on other service classes)
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/service/ai/AiSkillMatchClient.java" \
    "${SRC_DIR}/com/example/authlogin/service/ai/TaJobMatchAiConfig.java" \
    "${SRC_DIR}/com/example/authlogin/service/ai/HttpAiSkillMatchClient.java" \
    "${SRC_DIR}/com/example/authlogin/service/ai/TongyiXiaomiAnalysisClient.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] AI service compilation failed!"
    exit 1
fi

# Compile service classes
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/service/SkillMatchService.java" \
    "${SRC_DIR}/com/example/authlogin/service/TaJobMatchAnalysisService.java" \
    "${SRC_DIR}/com/example/authlogin/service/WorkloadStatsService.java" \
    "${SRC_DIR}/com/example/authlogin/service/AdminInviteEmailService.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Service compilation failed!"
    exit 1
fi

# Compile filter
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/filter/AuthFilter.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Filter compilation failed!"
    exit 1
fi

# Compile bootstrap
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/bootstrap/DemoAccountBootstrapListener.java" \
    "${SRC_DIR}/com/example/authlogin/bootstrap/DemoDataSeeder.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Bootstrap compilation failed!"
    exit 1
fi

# Compile servlets
javac -encoding UTF-8 -d "${CLASSES_DIR}" -cp "${CLASSPATH}" \
    "${SRC_DIR}/com/example/authlogin/servlet/LoginServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/RegisterServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/LogoutServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/ApplicantServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/ApplicantAccessServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/JobServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/ApplyServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/SkillMatchServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/TaJobMatchAnalysisServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/MoApplicationMatchAnalysisServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/WorkloadStatsServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/AdminInviteServlet.java" \
    "${SRC_DIR}/com/example/authlogin/servlet/AdminInviteAcceptServlet.java"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Servlet compilation failed!"
    exit 1
fi

echo "[5/5] Copying resource files..."
if [[ -d "${WEBAPP_DIR}" ]]; then
    cp -R "${WEBAPP_DIR}/." "${BUILD_DIR}/"
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "  Output: ${BUILD_DIR}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run deploy.sh to deploy to Tomcat"
echo "  2. Run startup.sh to start Tomcat"
echo ""

read -p "Press Enter to exit..."
