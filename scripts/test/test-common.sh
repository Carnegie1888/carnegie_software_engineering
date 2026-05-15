#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_BUILD_ROOT="$PROJECT_ROOT/build/member-tests"

if [ -f "$PROJECT_ROOT/scripts/config.sh" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/scripts/config.sh"
fi

print_section() {
    local member="$1"
    local message="$2"
    printf '\n[%s] %s\n' "$member" "$message"
}

pass_step() {
    local member="$1"
    local message="$2"
    printf '[%s] PASS - %s\n' "$member" "$message"
}

fail_step() {
    local member="$1"
    local message="$2"
    printf '[%s] FAIL - %s\n' "$member" "$message" >&2
    exit 1
}

require_command() {
    local member="$1"
    local command_name="$2"
    if ! command -v "$command_name" >/dev/null 2>&1; then
        fail_step "$member" "缺少命令：$command_name"
    fi
}

servlet_api_jar() {
    local candidates=()
    if [ "${TOMCAT_HOME:-}" != "" ]; then
        candidates+=("$TOMCAT_HOME/lib/servlet-api.jar")
    fi
    if [ "${CATALINA_HOME:-}" != "" ]; then
        candidates+=("$CATALINA_HOME/lib/servlet-api.jar")
    fi
    candidates+=(
        "/opt/homebrew/opt/tomcat@10/libexec/lib/servlet-api.jar"
        "/opt/homebrew/opt/tomcat/libexec/lib/servlet-api.jar"
        "/usr/local/opt/tomcat@10/libexec/lib/servlet-api.jar"
        "/usr/local/opt/tomcat/libexec/lib/servlet-api.jar"
    )

    local candidate
    for candidate in "${candidates[@]}"; do
        if [ -f "$candidate" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done
    return 1
}

prepare_backend_member_test() {
    local member="$1"
    local build_dir="$TEST_BUILD_ROOT/$member"
    local classes_dir="$build_dir/classes"
    local test_classes_dir="$build_dir/test-classes"
    local source_list="$build_dir/java-sources.txt"

    require_command "$member" javac
    require_command "$member" java

    local servlet_jar
    if ! servlet_jar="$(servlet_api_jar)"; then
        fail_step "$member" "找不到 servlet-api.jar，请检查 scripts/config.sh 里的 TOMCAT_HOME/CATALINA_HOME"
    fi

    rm -rf "$build_dir"
    mkdir -p "$classes_dir" "$test_classes_dir"
    find "$PROJECT_ROOT/backend/src" -name "*.java" | sort > "$source_list"

    if [ ! -s "$source_list" ]; then
        fail_step "$member" "backend/src 下没有 Java 源码"
    fi

    print_section "$member" "编译后端源码"
    javac -encoding UTF-8 -d "$classes_dir" -cp "$servlet_jar:$classes_dir" @"$source_list"
    pass_step "$member" "后端源码编译通过"
}

compile_backend_member_test() {
    local member="$1"
    local test_source="$2"
    local build_dir="$TEST_BUILD_ROOT/$member"
    local classes_dir="$build_dir/classes"
    local test_classes_dir="$build_dir/test-classes"
    local servlet_jar
    servlet_jar="$(servlet_api_jar)"

    print_section "$member" "编译成员测试代码"
    javac -encoding UTF-8 -d "$test_classes_dir" -cp "$servlet_jar:$classes_dir" "$PROJECT_ROOT/$test_source"
    pass_step "$member" "成员测试代码编译通过"
}

run_backend_member_test() {
    local member="$1"
    local main_class="$2"
    local build_dir="$TEST_BUILD_ROOT/$member"
    local classes_dir="$build_dir/classes"
    local test_classes_dir="$build_dir/test-classes"
    local data_dir="$build_dir/data"
    local servlet_jar
    servlet_jar="$(servlet_api_jar)"

    rm -rf "$data_dir"
    mkdir -p "$data_dir"

    print_section "$member" "运行成员后端测试"
    TA_HIRING_DATA_DIR="$data_dir" java -cp "$servlet_jar:$classes_dir:$test_classes_dir" "$main_class"
    pass_step "$member" "成员后端测试通过"
}

run_node_member_test() {
    local member="$1"
    local test_source="$2"

    require_command "$member" node
    print_section "$member" "运行成员前端/架构测试"
    node "$PROJECT_ROOT/$test_source"
    pass_step "$member" "成员测试通过"
}
