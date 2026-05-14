#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$ROOT_DIR/scripts/config.sh"
BUILD_DIR="$ROOT_DIR/build"
MAIN_CLASSES="$BUILD_DIR/test-main-classes"
TEST_CLASSES="$BUILD_DIR/test-classes"
MAIN_SOURCES="$BUILD_DIR/test-main-sources.txt"
TEST_SOURCES="$BUILD_DIR/test-sources.txt"
TEST_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ta-hiring-test-data.XXXXXX")"

cleanup() {
    rm -rf "$TEST_DATA_DIR"
}
trap cleanup EXIT

if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$CONFIG_FILE" >/dev/null 2>&1 || true
fi

if [[ -z "${TOMCAT_HOME:-}" || ! -f "$TOMCAT_HOME/lib/servlet-api.jar" ]]; then
    echo "TOMCAT_HOME must point to a Tomcat install with lib/servlet-api.jar." >&2
    exit 1
fi

export TA_HIRING_DATA_DIR="$TEST_DATA_DIR"

rm -rf "$MAIN_CLASSES" "$TEST_CLASSES"
mkdir -p "$MAIN_CLASSES" "$TEST_CLASSES"

find "$ROOT_DIR/backend/src" -name "*.java" | sort > "$MAIN_SOURCES"
find "$ROOT_DIR/backend/test" -name "*.java" | sort > "$TEST_SOURCES"

javac -encoding UTF-8 \
    -d "$MAIN_CLASSES" \
    -cp "$TOMCAT_HOME/lib/servlet-api.jar:$MAIN_CLASSES" \
    @"$MAIN_SOURCES"

javac -encoding UTF-8 \
    -d "$TEST_CLASSES" \
    -cp "$TOMCAT_HOME/lib/servlet-api.jar:$MAIN_CLASSES:$TEST_CLASSES" \
    @"$TEST_SOURCES"

java -cp "$TOMCAT_HOME/lib/servlet-api.jar:$MAIN_CLASSES:$TEST_CLASSES" \
    com.example.tarecruitment.ArchitectureSmokeTest
