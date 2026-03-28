#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Start Tomcat Script
# ========================================

# Auto-add execute permission if needed
if [[ ! -x "${BASH_SOURCE[0]}" ]]; then
    chmod +x "${BASH_SOURCE[0]}"
    exec "${BASH_SOURCE[0]}" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "========================================"
echo "  Start Tomcat"
echo "========================================"
echo ""

if [[ -z "${CATALINA_HOME}" || ! -d "${CATALINA_HOME}" ]]; then
    echo "[ERROR] Tomcat not found: ${CATALINA_HOME:-<empty>}"
    echo "Please check scripts/config.sh"
    exit 1
fi

echo "Starting Tomcat..."
echo ""

"${CATALINA_HOME}/bin/startup.sh"

echo ""
echo "========================================"
echo "  Tomcat Started!"
echo "========================================"
echo ""
echo "Access URLs:"
echo "  - Home: http://localhost:8080/${APP_NAME}/"
echo "  - Login: http://localhost:8080/${APP_NAME}/login.jsp"
echo ""
echo "Tomcat Manager: http://localhost:8080/manager/html"
echo ""

read -p "Press Enter to exit..."
