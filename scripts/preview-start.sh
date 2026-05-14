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

javac -encoding UTF-8 -d "$BUILD_DIR/WEB-INF/classes" -cp "$CLASSPATH" \
    "$SRC_DIR/com/example/authlogin/model/User.java" \
    "$SRC_DIR/com/example/authlogin/model/AdminInvite.java" \
    "$SRC_DIR/com/example/authlogin/model/Applicant.java" \
    "$SRC_DIR/com/example/authlogin/model/Job.java" \
    "$SRC_DIR/com/example/authlogin/model/Application.java" \
    "$SRC_DIR/com/example/authlogin/model/Notification.java" \
    "$SRC_DIR/com/example/authlogin/util/StoragePaths.java" \
    "$SRC_DIR/com/example/authlogin/util/JsonResponseUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/SecurityTokenUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/FuzzySearchUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/SessionUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/PermissionUtil.java" \
    "$SRC_DIR/com/example/authlogin/util/Logger.java" \
    "$SRC_DIR/com/example/authlogin/dao/UserDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/ApplicantDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/JobDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/ApplicationDao.java" \
    "$SRC_DIR/com/example/authlogin/dao/NotificationDao.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/AiSkillMatchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/DeepSeekAiConfig.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/DeepSeekApplicantSearchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/DeepSeekTaJobSearchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/TaJobMatchAiConfig.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/HttpAiSkillMatchClient.java" \
    "$SRC_DIR/com/example/authlogin/service/ai/TongyiXiaomiAnalysisClient.java" \
    "$SRC_DIR/com/example/authlogin/service/SkillMatchService.java" \
    "$SRC_DIR/com/example/authlogin/service/MoApplicantAiSearchService.java" \
    "$SRC_DIR/com/example/authlogin/service/TaJobAiSearchService.java" \
    "$SRC_DIR/com/example/authlogin/service/TaJobMatchAnalysisService.java" \
    "$SRC_DIR/com/example/authlogin/service/WorkloadStatsService.java" \
    "$SRC_DIR/com/example/authlogin/service/InviteCodeService.java" \
    "$SRC_DIR/com/example/authlogin/filter/AuthFilter.java" \
    "$SRC_DIR/com/example/authlogin/bootstrap/DemoAccountBootstrapListener.java" \
    "$SRC_DIR/com/example/authlogin/bootstrap/DemoDataSeeder.java" \
    "$SRC_DIR/com/example/authlogin/servlet/LoginServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/RegisterServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/LogoutServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/AccountProfileServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplicantServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplicantAccessServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/JobServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/ApplyServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/MoApplicantAiSearchServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/TaJobAiSearchServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/SkillMatchServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/TaJobMatchAnalysisServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/WorkloadStatsServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/AdminInviteAcceptServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/AdminCurrentInviteCodeServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/CheckAvailableServlet.java" \
    "$SRC_DIR/com/example/authlogin/servlet/NotificationServlet.java" || exit 1

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
