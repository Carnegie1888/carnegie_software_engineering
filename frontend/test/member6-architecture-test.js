#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "../..");
let passed = 0;

function main() {
  testRequiredProjectFiles();
  testForbiddenArchitectureResidues();
  testApiRoutesAreSimpleAndShared();
  testPackageInfoAndDocs();

  console.log(`[member6] PASS total=${passed}`);
}

function testRequiredProjectFiles() {
  [
    "backend/src/com/example/tarecruitment/package-info.java",
    "backend/src/com/example/tarecruitment/common/api/ApiRoutes.java",
    "frontend/webapp/WEB-INF/web.xml",
    "frontend/webapp/WEB-INF/jsp/fragments/portal-sidebar.jspf",
    "frontend/webapp/WEB-INF/jsp/fragments/portal-topbar.jspf",
    "frontend/webapp/css/common/components.css",
    "frontend/webapp/css/common/forms.css",
    "frontend/webapp/css/common/tokens.css",
    "frontend/webapp/css/portal/portal-shell.css",
    "frontend/webapp/js/common/i18n.js",
    "frontend/webapp/js/common/portal-i18n.js",
    "frontend/webapp/js/common/ta-recruitment.js",
    "scripts/dev.sh",
    "scripts/dev.bat",
    "scripts/config.example.sh",
    "scripts/config.example.bat",
    "docs/division-and-test/Overview.md"
  ].forEach((file) => assertExists(file));
  pass("Project leader files for architecture, shell, scripts, and docs exist");
}

function testForbiddenArchitectureResidues() {
  const targets = [
    "backend/src",
    "frontend/webapp",
    "scripts",
    "README.md",
    "docs/division-and-test"
  ];
  const forbiddenPatterns = [
    /com\.example\.authlogin|authlogin/,
    /ApplyServlet|ApplicantServlet|ApplicantAccessServlet/,
    /TongyiXiaomiAnalysisClient|TaJobMatchAiConfig|ta-job-match\.properties/,
    /JsonResponses/,
    /\/api\/v1/,
    /["']\/(?:jobs|apply|applicant|check-available|logout)["']/
  ];

  const obsoleteFiles = [
    "backend/src/com/example/tarecruitment/ai/service/SkillMatchService.java",
    "backend/src/com/example/tarecruitment/ai/web/SkillMatchServlet.java",
    "frontend/webapp/jsp/mo/ai-skill-match.jsp"
  ];
  obsoleteFiles.forEach((file) => {
    assert(!fs.existsSync(path.join(projectRoot, file)), `${file} should stay removed`);
  });

  scanTextFiles(targets).forEach((file) => {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    forbiddenPatterns.forEach((pattern) => {
      assert(!pattern.test(source), `${relative(file)} contains forbidden architecture residue: ${pattern}`);
    });
  });
  pass("Old package names, old servlet entries, /api/v1, and removed AI page residues are absent");
}

function testApiRoutesAreSimpleAndShared() {
  const apiRoutesFile = path.join(projectRoot, "backend/src/com/example/tarecruitment/common/api/ApiRoutes.java");
  const frontendRoutesFile = path.join(projectRoot, "frontend/webapp/js/common/ta-recruitment.js");
  const apiRoutesSource = fs.readFileSync(apiRoutesFile, "utf8");
  const frontendRoutesSource = fs.readFileSync(frontendRoutesFile, "utf8");

  const routeValues = [...apiRoutesSource.matchAll(/public static final String\s+\w+\s*=\s*"([^"]+)";/g)]
    .map((match) => match[1]);
  assert(routeValues.length >= 15, "ApiRoutes exposes expected API constants");

  routeValues.forEach((route) => {
    assert(route.startsWith("/api/"), `ApiRoutes value should start with /api/: ${route}`);
    assert(!route.startsWith("/api/v1/"), `ApiRoutes value should not use /api/v1: ${route}`);
    assert(frontendRoutesSource.includes(`"${route}"`), `frontend routes should include ${route}`);
  });
  pass("Backend ApiRoutes values are simple /api paths and mirrored by frontend route helper");
}

function testPackageInfoAndDocs() {
  const packageInfo = fs.readFileSync(
    path.join(projectRoot, "backend/src/com/example/tarecruitment/package-info.java"),
    "utf8"
  );
  assert(packageInfo.includes("TA Hiring System"), "package-info names TA Hiring System");
  assert(packageInfo.includes("Servlet") && packageInfo.includes("JSP") && packageInfo.includes("CSV"),
    "package-info documents lightweight stack");

  const overview = fs.readFileSync(path.join(projectRoot, "docs/division-and-test/Overview.md"), "utf8");
  ["member1", "member2", "member3", "member4", "member5", "member6"].forEach((member) => {
    assert(overview.includes(`[${member}.md](${member}.md)`), `Overview links ${member}`);
  });
  pass("Package documentation and division overview reflect the current project structure");
}

function scanTextFiles(targets) {
  const result = [];
  targets.forEach((target) => {
    const fullPath = path.join(projectRoot, target);
    if (!fs.existsSync(fullPath)) {
      return;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath).forEach((file) => {
        if (isTextFile(file)) {
          result.push(file);
        }
      });
    } else if (isTextFile(fullPath)) {
      result.push(fullPath);
    }
  });
  return result;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function isTextFile(file) {
  return /\.(java|jsp|jspf|js|css|md|sh|bat|xml|properties|template)$/.test(file);
}

function assertExists(file) {
  assert(fs.existsSync(path.join(projectRoot, file)), `${file} should exist`);
}

function relative(file) {
  return path.relative(projectRoot, file);
}

function pass(message) {
  passed += 1;
  console.log(`[member6] PASS - ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
