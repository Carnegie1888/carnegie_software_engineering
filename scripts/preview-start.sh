#!/usr/bin/env bash
# Build, deploy, then run Tomcat in the foreground (for Claude Code preview).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$SCRIPT_DIR/config.sh"

SRC_DIR="$PROJECT_ROOT/backend/src"
WEBAPP_DIR="$PROJECT_ROOT/frontend/webapp"
BUILD_DIR="$PROJECT_ROOT/build"
TARGET_DIR="$CATALINA_HOME/webapps/$APP_NAME"
FRONTEND_DIR="$PROJECT_ROOT/frontend/webapp"

echo "=== Build ==="

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/WEB-INF/classes"

CLASSPATH="$TOMCAT_HOME/lib/servlet-api.jar:$BUILD_DIR/WEB-INF/classes"

SOURCE_LIST="$BUILD_DIR/java-sources.txt"
find "$SRC_DIR" -name "*.java" | sort > "$SOURCE_LIST"

if [ ! -s "$SOURCE_LIST" ]; then
    echo "[ERROR] No Java source files found under $SRC_DIR"
    exit 1
fi

SOURCE_COUNT="$(wc -l < "$SOURCE_LIST" | tr -d ' ')"
echo "Compiling $SOURCE_COUNT Java source files..."
javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" @"$SOURCE_LIST" || exit 1

cp -r "$WEBAPP_DIR/"* "$BUILD_DIR/"
echo "Build complete."

echo "=== Deploy ==="
"$CATALINA_HOME/bin/shutdown.sh" >/dev/null 2>&1 || true
sleep 1
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -r "$BUILD_DIR/"* "$TARGET_DIR/"
[ -d "$FRONTEND_DIR/css" ] && cp -r "$FRONTEND_DIR/css/"* "$TARGET_DIR/css/"
[ -d "$FRONTEND_DIR/js" ]  && cp -r "$FRONTEND_DIR/js/"*  "$TARGET_DIR/js/"
touch "$TARGET_DIR/WEB-INF/web.xml"
echo "Deploy complete."

echo "=== Starting Tomcat (foreground) ==="
exec "$CATALINA_HOME/bin/catalina.sh" run
