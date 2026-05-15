#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "../..");
const jsRoot = path.join(projectRoot, "frontend/webapp/js");

let passed = 0;

function main() {
  const jsFiles = walk(jsRoot).filter((file) => file.endsWith(".js"));
  assert(jsFiles.length > 0, "frontend JS files exist");

  testJavaScriptSyntax(jsFiles);
  testPageScriptsUseSharedRoutes(jsFiles);
  testRolePageAssetsExist();
  testRemovedMoSkillMatchPageStaysRemoved();

  console.log(`[member5] PASS total=${passed}`);
}

function testJavaScriptSyntax(jsFiles) {
  jsFiles.forEach((file) => {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`node --check failed for ${relative(file)}\n${result.stderr || result.stdout}`);
    }
  });
  pass("All frontend JavaScript files pass node --check");
}

function testPageScriptsUseSharedRoutes(jsFiles) {
  const sharedRouteFile = path.join(jsRoot, "common/ta-recruitment.js");
  const pageScripts = jsFiles.filter((file) => file !== sharedRouteFile);
  const directApiLiteral = /(["'`])\/api\/[^"'`]*\1/;
  const legacyRootLiteral = /(["'`])\/(?:jobs|apply|applicant|check-available|logout)\1/;

  pageScripts.forEach((file) => {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    assert(!directApiLiteral.test(source), `${relative(file)} should not hard-code /api/... strings`);
    assert(!legacyRootLiteral.test(source), `${relative(file)} should not use old root API strings`);
  });

  const sharedSource = fs.readFileSync(sharedRouteFile, "utf8");
  [
    "auth",
    "jobs",
    "applications",
    "me",
    "admin",
    "mo",
    "ta",
    "notifications"
  ].forEach((routeGroup) => {
    assert(sharedSource.includes(`${routeGroup}:`) || sharedSource.includes(`${routeGroup}: function`),
      `shared routes expose ${routeGroup}`);
  });
  pass("Page scripts use TARecruitment.routes instead of hard-coded API paths");
}

function testRolePageAssetsExist() {
  [
    "frontend/webapp/login.jsp",
    "frontend/webapp/register.jsp",
    "frontend/webapp/jsp/ta/job-list.jsp",
    "frontend/webapp/jsp/ta/job-detail.jsp",
    "frontend/webapp/jsp/ta/application-status.jsp",
    "frontend/webapp/jsp/mo/dashboard.jsp",
    "frontend/webapp/jsp/mo/applicant-selection.jsp",
    "frontend/webapp/jsp/admin/dashboard.jsp",
    "frontend/webapp/jsp/admin/invite.jsp",
    "frontend/webapp/js/common/ta-recruitment.js"
  ].forEach((file) => assertExists(file));
  pass("Role pages and shared frontend route helper exist");
}

function testRemovedMoSkillMatchPageStaysRemoved() {
  [
    "frontend/webapp/jsp/mo/ai-skill-match.jsp",
    "frontend/webapp/js/mo/mo-ai-skill-match.js",
    "frontend/webapp/css/mo/mo-ai-skill-match.css"
  ].forEach((file) => {
    assert(!fs.existsSync(path.join(projectRoot, file)), `${file} should stay removed`);
  });
  pass("Removed MO skill-match page assets are not present");
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

function assertExists(file) {
  assert(fs.existsSync(path.join(projectRoot, file)), `${file} should exist`);
}

function relative(file) {
  return path.relative(projectRoot, file);
}

function pass(message) {
  passed += 1;
  console.log(`[member5] PASS - ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
