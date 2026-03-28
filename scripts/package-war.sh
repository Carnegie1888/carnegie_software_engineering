#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Maven WAR Package Script
# ========================================

# Auto-add execute permission if needed
if [[ ! -x "${BASH_SOURCE[0]}" ]]; then
    chmod +x "${BASH_SOURCE[0]}"
    exec "${BASH_SOURCE[0]}" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v mvn >/dev/null 2>&1; then
    echo "[ERROR] Maven (mvn) not found. Please install Maven 3.9+ first."
    exit 1
fi

echo "========================================"
echo "  Maven WAR Package Script"
echo "========================================"
echo ""

cd "${PROJECT_ROOT}"
mvn -DskipTests clean package

if [[ $? -ne 0 ]]; then
    exit 1
fi

echo ""
echo "========================================"
echo "  WAR package generated successfully"
echo "  Output: ${PROJECT_ROOT}/target/groupproject.war"
echo "========================================"

read -p "Press Enter to exit..."
