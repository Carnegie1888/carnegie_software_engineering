#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Deploy Script - Deploy to Tomcat
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

: "${CATALINA_HOME:=${TOMCAT_HOME:-}}"
: "${APP_NAME:=groupproject}"

BUILD_DIR="${PROJECT_ROOT}/build"
TARGET_DIR="${CATALINA_HOME}/webapps/${APP_NAME}"
FRONTEND_DIR="${PROJECT_ROOT}/frontend/webapp"

echo "========================================"
echo "  Deploy Script"
echo "========================================"
echo ""

# Check build directory
if [[ ! -d "${BUILD_DIR}" ]]; then
    echo "[ERROR] Build directory not found. Run build.sh first."
    exit 1
fi

# Check Tomcat directory
if [[ -z "${CATALINA_HOME}" || ! -d "${CATALINA_HOME}" ]]; then
    echo "[ERROR] Tomcat not found: ${CATALINA_HOME:-<empty>}"
    echo "Please check scripts/config.sh"
    exit 1
fi

echo "Stopping Tomcat (if running)..."
"${CATALINA_HOME}/bin/shutdown.sh" >/dev/null 2>&1 || true
sleep 2

echo "Deploying to Tomcat..."

# Delete old version
if [[ -d "${TARGET_DIR}" ]]; then
    echo "  Removing old version..."
    rm -rf "${TARGET_DIR}"
fi

# Use mkdir -p + cp -r to avoid issues
mkdir -p "${TARGET_DIR}"
cp -r "${BUILD_DIR}/." "${TARGET_DIR}/"

if [[ $? -ne 0 ]]; then
    echo "[ERROR] Failed to copy build artifacts to Tomcat webapps."
    exit 1
fi

# Safety sync for frontend static assets
if [[ -d "${FRONTEND_DIR}/css" ]]; then
    mkdir -p "${TARGET_DIR}/css"
    cp -r "${FRONTEND_DIR}/css}/." "${TARGET_DIR}/css/" 2>/dev/null || cp -r "${FRONTEND_DIR}/css/"* "${TARGET_DIR}/css/" 2>/dev/null || true
fi

if [[ -d "${FRONTEND_DIR}/js" ]]; then
    mkdir -p "${TARGET_DIR}/js"
    cp -r "${FRONTEND_DIR}/js/." "${TARGET_DIR}/js/" 2>/dev/null || cp -r "${FRONTEND_DIR}/js/"* "${TARGET_DIR}/js/" 2>/dev/null || true
fi

# Trigger Tomcat context reload
if [[ -f "${TARGET_DIR}/WEB-INF/web.xml" ]]; then
    touch "${TARGET_DIR}/WEB-INF/web.xml"
fi

echo ""
echo "========================================"
echo "  Deploy Complete!"
echo "  App path: ${TARGET_DIR}"
echo "========================================"
echo ""

read -p "Press Enter to exit..."
