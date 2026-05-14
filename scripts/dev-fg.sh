#!/usr/bin/env bash
# Build + deploy via dev.sh, then restart Tomcat in foreground so the
# process stays alive (required for Claude preview server tracking).
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Step 1: build + deploy + background-start (reuse existing dev.sh)
printf '\n' | bash "$SCRIPT_DIR/dev.sh" || true

# Step 2: shut down the background Tomcat just started
"$CATALINA_HOME/bin/shutdown.sh" 2>/dev/null || true
sleep 2

# Step 3: run Tomcat in foreground so this process stays alive
exec "$CATALINA_HOME/bin/catalina.sh" run
