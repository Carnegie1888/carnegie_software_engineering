#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/test-common.sh"

MEMBER="member2"
prepare_backend_member_test "$MEMBER"
compile_backend_member_test "$MEMBER" "backend/test/Member2BackendTest.java"
run_backend_member_test "$MEMBER" "Member2BackendTest"
