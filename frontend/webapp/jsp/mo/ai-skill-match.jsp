<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
    String userId = "";
    Object userIdObj = session.getAttribute("userId");
    if (userIdObj != null) {
        userId = userIdObj.toString();
    }
    String username = "";
    Object usernameObj = session.getAttribute("username");
    if (usernameObj != null) {
        username = usernameObj.toString();
    }
    String userInitial = username != null && !username.isEmpty() ? username.substring(0, 1).toUpperCase() : "M";
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="<%= contextPath %>/js/common/locale-bootstrap.js"></script>
    <title data-i18n="portal.page.moAiSkillMatch.title">AI Skill Match - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/mo/mo-ai-skill-match.css">
</head>
<body>
    <div class="portal-shell portal-shell-mo">
        <% String portalRole = "mo"; String activeNav = "ai-match"; String pageTitleKey = "portal.moAiSkillMatch.title"; String pageTitleFallback = "AI Skill Match"; %>
        <%@ include file="/WEB-INF/jsp/fragments/portal-sidebar.jspf" %>

        <section class="portal-main">
            <%@ include file="/WEB-INF/jsp/fragments/portal-topbar.jspf" %>

            <div class="portal-content">
                <main class="ai-match-page ai-module-page">
                    <section class="match-hero ai-module-hero" aria-labelledby="match-title">
                        <h1 id="match-title" class="portal-page-title" data-i18n="portal.moAiSkillMatch.title">AI Skill Match</h1>
                        <p class="subtitle" data-i18n="portal.moAiSkillMatch.subtitle">Review applicant matching scores aligned with your posted job requirements.</p>
                    </section>

                    <section class="match-panel ai-module-panel" data-i18n-aria-label="portal.moAiSkillMatch.title" aria-label="技能匹配结果">
                        <form id="match-filter-form" class="filter-form ai-module-filter-form" novalidate>
                            <div class="field-group ai-module-field-group">
                                <label for="job-filter" data-i18n="portal.common.job">Job</label>
                                <select id="job-filter" name="jobId">
                                    <option value="" data-i18n="portal.common.selectJob">Select a job</option>
                                </select>
                            </div>
                            <div class="filter-actions ai-module-filter-actions">
                                <button id="load-match-btn" class="primary-btn" type="submit" data-i18n="portal.moAiSkillMatch.loadResults">Load results</button>
                                <button id="refresh-match-btn" class="ghost-btn" type="button" data-i18n="portal.common.refresh">Refresh</button>
                            </div>
                        </form>

                        <div id="match-message" class="form-message ai-module-form-message hidden" role="status" aria-live="polite"></div>

                        <section class="summary-grid ai-module-summary-grid" aria-label="匹配统计概览" data-i18n-aria-label="portal.moAiSkillMatch.summaryGridAria">
                            <article class="summary-card ai-module-summary-card">
                                <p data-i18n="portal.moAiSkillMatch.totalApplicants">Total applicants</p>
                                <strong id="summary-total">0</strong>
                            </article>
                            <article class="summary-card ai-module-summary-card">
                                <p data-i18n="portal.moAiSkillMatch.highMatch">High match (>=85)</p>
                                <strong id="summary-high">0</strong>
                            </article>
                            <article class="summary-card ai-module-summary-card">
                                <p data-i18n="portal.moAiSkillMatch.mediumMatch">Medium match (60-84)</p>
                                <strong id="summary-medium">0</strong>
                            </article>
                            <article class="summary-card ai-module-summary-card">
                                <p data-i18n="portal.moAiSkillMatch.lowMatch">Low match (&lt;60)</p>
                                <strong id="summary-low">0</strong>
                            </article>
                        </section>

                        <section class="visual-grid" aria-label="匹配度可视化组件" data-i18n-aria-label="portal.moAiSkillMatch.visualGridAria">
                            <article class="visual-card average-card">
                                <p class="visual-title" data-i18n="portal.moAiSkillMatch.averageMatchScore">Average Match Score</p>
                                <div id="average-ring" class="average-ring" aria-label="平均匹配度" data-i18n-aria-label="portal.moAiSkillMatch.averageRingAria">
                                    <span id="average-score-text">0%</span>
                                </div>
                            </article>
                            <article class="visual-card distribution-card">
                                <p class="visual-title" data-i18n="portal.moAiSkillMatch.scoreDistribution">Score Distribution</p>
                                <div class="distribution-list">
                                    <div class="distribution-item">
                                        <span data-i18n="portal.common.high">High</span>
                                        <div class="distribution-track"><i id="dist-high"></i></div>
                                        <strong id="dist-high-label">0%</strong>
                                    </div>
                                    <div class="distribution-item">
                                        <span data-i18n="portal.common.medium">Medium</span>
                                        <div class="distribution-track"><i id="dist-medium"></i></div>
                                        <strong id="dist-medium-label">0%</strong>
                                    </div>
                                    <div class="distribution-item">
                                        <span data-i18n="portal.common.low">Low</span>
                                        <div class="distribution-track"><i id="dist-low"></i></div>
                                        <strong id="dist-low-label">0%</strong>
                                    </div>
                                </div>
                            </article>
                        </section>

                        <p id="match-list-summary" class="list-summary ai-module-list-summary" data-i18n="portal.moAiSkillMatch.chooseJobHint">Choose a job to load skill match results.</p>
                        <div id="match-list" class="match-list" aria-live="polite"></div>
                    </section>
                </main>
            </div>
        </section>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
        window.APP_CURRENT_USER_ID = "<%= userId %>";
        window.APP_CURRENT_USERNAME = "<%= username %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/common/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/mo/mo-ai-skill-match.js" defer></script>
</body>
</html>
