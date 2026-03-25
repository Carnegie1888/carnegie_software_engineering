<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
    String currentRole = "";
    Object roleObj = session.getAttribute("role");
    if (roleObj != null) {
        currentRole = roleObj.toString();
    }
    String username = "";
    Object usernameObj = session.getAttribute("username");
    if (usernameObj != null) {
        username = usernameObj.toString();
    }
    String userInitial = username != null && !username.isEmpty() ? username.substring(0, 1).toUpperCase() : "T";
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="portal.page.taJobDetail.title">Job detail - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/ta-job-detail.css">
</head>
<body>
    <div class="portal-shell portal-shell-ta">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.ta.aria">
            <p class="portal-brand" data-i18n="portal.brand.ta">TA Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/ta/job-list.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 7.5h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="M9 7.5V6A1.5 1.5 0 0 1 10.5 4.5h3A1.5 1.5 0 0 1 15 6v1.5" />
                        <path d="M3 12h18" />
                    </svg>
                    <span data-i18n="portal.nav.ta.jobs">Job List</span>
                </a>
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/ta/application-status.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="8"></circle>
                        <path d="m8.5 12.5 2.2 2.2L15.5 10"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.status">My Applications</span>
                </a>
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/ta/dashboard.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="8" r="3"></circle>
                        <path d="M6 18c1.2-2 3.2-3 6-3s4.8 1 6 3"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.profile">Profile</span>
                </a>
            </nav>
        </aside>

        <section class="portal-main">
            <header class="portal-topbar">
                <div class="portal-topbar-menu">
                    <span class="portal-topbar-role" data-i18n="portal.brand.ta">TA Portal</span>
                    <span class="portal-topbar-divider" aria-hidden="true"></span>
                    <span class="portal-topbar-page" data-i18n="portal.taJobDetail.title">Job Detail</span>
                </div>
                <div class="portal-topbar-right">
                    <div class="portal-user">
                        <span class="portal-user-avatar"><%= userInitial %></span>
                        <span class="portal-user-name"><%= username == null || username.isEmpty() ? "TA User" : username %></span>
                    </div>
                    <div class="portal-topbar-actions">
                        <div class="locale-switch" role="group" data-i18n-aria-label="common.locale.switchAria">
                            <button class="locale-btn" type="button" data-locale-switch data-locale="zh-CN" data-i18n="common.locale.zh">中文</button>
                            <span class="locale-divider">/</span>
                            <button class="locale-btn" type="button" data-locale-switch data-locale="en" data-i18n="common.locale.en">English</button>
                        </div>
                        <a class="portal-topbar-link" href="<%= contextPath %>/logout" data-i18n="portal.action.signOut">Sign Out</a>
                    </div>
                </div>
            </header>

            <div class="portal-content">
                <main class="job-detail-page">
                    <section class="detail-hero" aria-labelledby="job-detail-title">
                        <div class="detail-hero-copy">
                            <h1 id="job-detail-title" class="portal-page-title" data-i18n="portal.taJobDetail.title">Job Detail</h1>
                            <p class="subtitle" data-i18n="portal.taJobDetail.subtitle">Review role requirements and submit your application.</p>
                        </div>
                        <div class="detail-back-row">
                            <a class="detail-back-link" href="<%= contextPath %>/jsp/ta/job-list.jsp" data-i18n="portal.taJobDetail.backToJobs">← Job list</a>
                        </div>
                    </section>

                    <section class="detail-layout">
                        <article class="detail-card" aria-label="职位详细信息">
                            <header class="detail-header">
                                <div class="detail-heading">
                                    <h2 id="job-title" data-i18n="portal.taJobDetail.loadingDetails">Loading job details...</h2>
                                    <p id="job-course">-</p>
                                </div>
                                <span id="job-status" class="status-pill status-open">OPEN</span>
                            </header>

                            <div id="detail-message" class="form-message hidden" role="status" aria-live="polite"></div>

                            <dl class="detail-grid">
                                <div class="detail-item">
                                    <dt data-i18n="common.positions">Positions</dt>
                                    <dd id="job-positions">-</dd>
                                </div>
                                <div class="detail-item">
                                    <dt data-i18n="common.workload">Workload</dt>
                                    <dd id="job-workload">-</dd>
                                </div>
                                <div class="detail-item">
                                    <dt data-i18n="common.salary">Salary</dt>
                                    <dd id="job-salary">-</dd>
                                </div>
                                <div class="detail-item">
                                    <dt data-i18n="common.deadline">Deadline</dt>
                                    <dd id="job-deadline">-</dd>
                                </div>
                            </dl>

                            <section class="detail-block" aria-labelledby="description-title">
                                <h3 id="description-title" data-i18n="common.description">Description</h3>
                                <p id="job-description">-</p>
                            </section>

                            <section class="detail-block" aria-labelledby="skills-title">
                                <h3 id="skills-title" data-i18n="common.requiredSkills">Required skills</h3>
                                <div id="job-skills" class="skills-wrap"></div>
                            </section>

                            <section class="detail-apply-card" aria-labelledby="apply-action-title">
                                <div class="detail-apply-copy">
                                    <p class="eyebrow" data-i18n="common.application">Application</p>
                                    <h3 id="apply-action-title" data-i18n="portal.taJobDetail.submitApplicationTitle">Submit your application</h3>
                                    <p class="detail-apply-hint" data-i18n="portal.taJobDetail.applyProfileHint">
                                        When you submit, your profile and cover letter will be sent to the MO together.
                                    </p>
                                </div>
                                <div class="detail-apply-actions">
                                    <button
                                        type="button"
                                        id="apply-open-btn"
                                        class="primary-btn detail-apply-trigger"
                                        aria-haspopup="dialog"
                                        aria-expanded="false"
                                        aria-controls="apply-modal-dialog"
                                        data-i18n="portal.dynamic.applyNow"
                                    >
                                        Apply now
                                    </button>
                                    <div id="apply-inline-status" class="status-banner hidden" role="status" aria-live="polite"></div>
                                </div>
                            </section>
                            <button
                                type="button"
                                id="detail-ai-match-btn"
                                class="detail-ai-chat-button"
                                aria-expanded="false"
                                aria-controls="ai-match-modal-dialog"
                                data-i18n-aria-label="portal.taJobDetail.aiChat"
                                aria-label="Ask AI"
                            >
                                <span aria-hidden="true">AI</span>
                            </button>
                        </article>

                        <div id="ai-match-modal" class="detail-card ai-match-inline-card hidden" aria-hidden="true">
                            <div
                                class="ai-match-inline-panel"
                                id="ai-match-modal-dialog"
                                aria-labelledby="ai-match-modal-title"
                                aria-describedby="ai-match-modal-copy"
                                tabindex="-1"
                            >
                                <div class="apply-modal-header ai-match-modal-header">
                                    <div class="apply-modal-heading">
                                        <p class="eyebrow" data-i18n="portal.nav.ta.aiMatch">AI Match</p>
                                        <h2 id="ai-match-modal-title" data-i18n="portal.taJobDetail.aiMatchTitle">AI matching analysis</h2>
                                        <p id="ai-match-modal-copy" class="apply-modal-copy" data-i18n="portal.taJobDetail.aiMatchSubtitle">
                                            Analyze fit between this job and your profile using non-sensitive information.
                                        </p>
                                    </div>
                                    <button type="button" class="apply-modal-close" id="ai-match-modal-close" data-i18n-aria-label="portal.taApplicationDetail.closeModal" aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </button>
                                </div>

                                <div id="ai-match-status-banner" class="status-banner hidden" role="status" aria-live="polite"></div>

                                <section id="ai-match-loading" class="ai-match-loading hidden" aria-live="polite">
                                    <span class="ai-loading-spinner" aria-hidden="true"></span>
                                    <p data-i18n="portal.dynamic.loadingAiAnalysis">Analyzing your profile and this job...</p>
                                </section>

                                <section id="ai-match-result" class="ai-match-result hidden" aria-live="polite">
                                    <div class="ai-match-overview">
                                        <article class="ai-match-overview-item">
                                            <p data-i18n="portal.taJobDetail.aiMatchScoreLabel">Overall score</p>
                                            <strong id="ai-match-score">-</strong>
                                        </article>
                                        <article class="ai-match-overview-item">
                                            <p data-i18n="portal.taJobDetail.aiMatchLevelLabel">Level</p>
                                            <strong id="ai-match-level">-</strong>
                                        </article>
                                    </div>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchSummaryLabel">Summary</h3>
                                        <p id="ai-match-summary">-</p>
                                    </article>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchStrengthsLabel">Strengths</h3>
                                        <ul id="ai-match-strengths" class="ai-match-list"></ul>
                                    </article>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchRisksLabel">Risks</h3>
                                        <ul id="ai-match-risks" class="ai-match-list"></ul>
                                    </article>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchSuggestionsLabel">Suggestions</h3>
                                        <ul id="ai-match-suggestions" class="ai-match-list"></ul>
                                    </article>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchJobEvidenceLabel">Job evidence</h3>
                                        <ul id="ai-match-job-evidence" class="ai-match-list"></ul>
                                    </article>

                                    <article class="ai-match-block">
                                        <h3 data-i18n="portal.taJobDetail.aiMatchProfileEvidenceLabel">Profile evidence</h3>
                                        <ul id="ai-match-profile-evidence" class="ai-match-list"></ul>
                                    </article>
                                </section>

                                <div class="ai-match-actions">
                                    <button id="ai-match-refresh-btn" class="ghost-btn" type="button" data-i18n="portal.taJobDetail.aiMatchRefresh">Re-analyze</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </section>
    </div>

    <div id="apply-modal" class="apply-modal hidden" aria-hidden="true">
        <div class="apply-modal-backdrop" data-close-modal tabindex="-1" aria-hidden="true"></div>
        <div
            class="apply-modal-panel"
            id="apply-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
            aria-describedby="apply-modal-copy"
            tabindex="-1"
        >
            <div class="apply-modal-header">
                <div class="apply-modal-heading">
                    <p class="eyebrow" data-i18n="common.application">Application</p>
                    <h2 id="apply-modal-title" data-i18n="portal.taJobDetail.submitApplicationTitle">Submit your application</h2>
                    <p id="apply-modal-copy" class="apply-modal-copy" data-i18n="portal.taJobDetail.applyProfileHint">
                        When you submit, your profile and cover letter will be sent to the MO together.
                    </p>
                </div>
                <button type="button" class="apply-modal-close" id="apply-modal-close" data-i18n-aria-label="portal.taApplicationDetail.closeModal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>

            <div id="apply-status-banner" class="status-banner hidden" role="status" aria-live="polite"></div>

            <form id="apply-form" class="apply-form" novalidate>
                <div class="field-group">
                    <label for="cover-letter" data-i18n="portal.taJobDetail.coverLetter">Cover letter</label>
                    <textarea
                        id="cover-letter"
                        name="coverLetter"
                        rows="7"
                        maxlength="2000"
                        placeholder="Briefly explain your relevant experience, strengths, and availability."
                    ></textarea>
                </div>
                <button id="apply-submit-btn" class="primary-btn" type="submit" data-i18n="portal.taJobDetail.applyNow">Apply for this job</button>
            </form>
        </div>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
        window.APP_CURRENT_ROLE = "<%= currentRole %>";
    </script>
    <script src="<%= contextPath %>/js/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/ta-job-detail.js" defer></script>
</body>
</html>
