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
    <title data-i18n="portal.page.moApplicantSelection.title">Applicant review - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/mo/mo-applicant-selection.css">
</head>
<body>
    <div class="portal-shell portal-shell-mo">
        <% String portalRole = "mo"; String activeNav = "applicants"; String pageTitleKey = "portal.nav.mo.applicants"; String pageTitleFallback = "Applicants"; %>
        <%@ include file="/WEB-INF/jsp/fragments/portal-sidebar.jspf" %>

        <section class="portal-main">
            <%@ include file="/WEB-INF/jsp/fragments/portal-topbar.jspf" %>

            <div class="portal-content">
                <main class="mo-selection-page">
                    <section class="selection-hero" aria-labelledby="selection-title">
                        <h1 id="selection-title" class="portal-page-title" data-i18n="portal.nav.mo.applicants">Applicants</h1>
                        <p class="subtitle" data-i18n="portal.moApplicantSelection.subtitle">Review and manage all candidate applications.</p>
                    </section>

                    <section class="selection-panel" aria-label="申请人筛选与审核列表" data-i18n-aria-label="portal.moApplicantSelection.panelAria">
                        <form id="selection-search-form" class="search-form" novalidate>
                            <label for="selection-search-input" data-i18n="portal.common.search">Search</label>
                            <div class="search-row">
                                <input
                                    id="selection-search-input"
                                    name="keyword"
                                    type="text"
                                    maxlength="160"
                                    data-i18n-placeholder="portal.moApplicantSelection.searchPlaceholder"
                                    placeholder="Search by applicant name, email, or job title"
                                >
                                <button id="selection-search-btn" class="primary-btn search-submit" type="submit" data-i18n="portal.common.search">Search</button>
                            </div>
                        </form>

                        <div id="selection-message" class="form-message hidden" role="status" aria-live="polite"></div>

                        <section id="applicant-detail-panel" class="selection-detail-panel hidden" aria-label="申请人详细信息" data-i18n-aria-label="portal.moApplicantSelection.detailPanelAria">
                            <header class="selection-detail-header">
                                <div>
                                    <p class="selection-detail-label" data-i18n="portal.moApplicantSelection.applicantProfile">Applicant profile</p>
                                    <h2 id="detail-full-name" data-i18n="portal.moApplicantSelection.selectApplicant">Select an applicant</h2>
                                </div>
                                <a id="detail-resume-link" class="ghost-btn hidden" href="#" target="_blank" rel="noopener noreferrer" data-i18n="portal.moApplicantSelection.viewResume">View resume</a>
                            </header>

                            <div id="detail-message" class="form-message hidden" role="status" aria-live="polite"></div>

                            <div class="selection-detail-grid">
                                <article class="detail-card">
                                    <p class="detail-card-label" data-i18n="portal.moApplicantSelection.academic">Academic</p>
                                    <dl class="detail-list">
                                        <div><dt data-i18n="portal.taDashboard.studentId">Student ID</dt><dd id="detail-student-id">-</dd></div>
                                        <div><dt data-i18n="portal.taDashboard.department">Department</dt><dd id="detail-department">-</dd></div>
                                        <div><dt data-i18n="portal.taDashboard.program">Program</dt><dd id="detail-program">-</dd></div>
                                        <div><dt data-i18n="portal.taDashboard.gpa">GPA</dt><dd id="detail-gpa">-</dd></div>
                                    </dl>
                                </article>

                                <article class="detail-card">
                                    <p class="detail-card-label" data-i18n="portal.moApplicantSelection.contact">Contact</p>
                                    <dl class="detail-list">
                                        <div><dt data-i18n="portal.moApplicantSelection.email">Email</dt><dd id="detail-email">-</dd></div>
                                        <div><dt data-i18n="portal.moApplicantSelection.phone">Phone</dt><dd id="detail-phone">-</dd></div>
                                        <div><dt>Address</dt><dd id="detail-address">-</dd></div>
                                        <div><dt data-i18n="portal.common.application">Application</dt><dd id="detail-application-status">-</dd></div>
                                    </dl>
                                </article>
                            </div>

                            <article class="detail-card">
                                <p class="detail-card-label" data-i18n="portal.taDashboard.skills">Skills</p>
                                <div id="detail-skills" class="selection-detail-skills"></div>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label" data-i18n="portal.moApplicantSelection.experience">Experience</p>
                                <p id="detail-experience" class="selection-detail-copy">-</p>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label" data-i18n="portal.moApplicantSelection.motivationLabel">Motivation</p>
                                <p id="detail-motivation" class="selection-detail-copy">-</p>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label" data-i18n="portal.taJobDetail.coverLetter">Cover letter</p>
                                <p id="detail-cover-letter" class="selection-detail-copy">-</p>
                            </article>
                        </section>

                        <p id="selection-list-summary" class="list-summary" data-i18n="portal.moApplicantSelection.loadingApplications" hidden>Loading applications...</p>
                        <div id="applications-list" class="applications-list" aria-live="polite"></div>
                    </section>
                </main>
            </div>
        </section>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
        window.APP_CURRENT_USER_ID = "<%= userId %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/common/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/common/ta-recruitment.js?v=20260514-architecture" defer></script>
    <script src="<%= contextPath %>/js/mo/mo-applicant-selection.js" defer></script>
</body>
</html>
