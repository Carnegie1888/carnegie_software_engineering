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
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="portal.page.moApplicantSelection.title">Applicant review - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/mo/mo-applicant-selection.css">
</head>
<body>
    <div class="portal-shell portal-shell-mo">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.mo.aria">
            <p class="portal-brand" data-i18n="portal.brand.mo">MO Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/mo/applicant-selection.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M7 18c.2-2.6 2.4-4.5 5-4.5s4.8 1.9 5 4.5"></path>
                        <circle cx="12" cy="8.5" r="3"></circle>
                        <path d="M3.5 18c.1-1.6 1.3-2.8 2.9-3.1"></path>
                        <path d="M20.5 18c-.1-1.6-1.3-2.8-2.9-3.1"></path>
                    </svg>
                    <span data-i18n="portal.nav.mo.applicants">Applicants</span>
                </a>
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/mo/dashboard.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    <span data-i18n="portal.nav.mo.postJob">Post Job</span>
                </a>
            </nav>
        </aside>

        <section class="portal-main">
            <header class="portal-topbar">
                <div class="portal-topbar-menu">
                    <span class="portal-topbar-role" data-i18n="portal.brand.mo">MO Portal</span>
                    <span class="portal-topbar-divider" aria-hidden="true"></span>
                    <span class="portal-topbar-page" data-i18n="portal.nav.mo.applicants">Applicants</span>
                </div>
                <div class="portal-topbar-right">
                    <div class="portal-user">
                        <span class="portal-user-avatar"><%= username != null && !username.isEmpty() ? username.substring(0, 1).toUpperCase() : "M" %></span>
                        <span class="portal-user-name"><%= username == null || username.isEmpty() ? "MO User" : username %></span>
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
                <main class="mo-selection-page">
                    <section class="selection-hero" aria-labelledby="selection-title">
                        <h1 id="selection-title" class="portal-page-title" data-i18n="portal.nav.mo.applicants">Applicants</h1>
                        <p class="subtitle">Review and manage all candidate applications.</p>
                    </section>

                    <section class="selection-panel" aria-label="申请人筛选与审核列表">
                        <form id="selection-search-form" class="search-form" novalidate>
                            <label for="selection-search-input" data-i18n="portal.common.search">Search</label>
                            <div class="search-row">
                                <input
                                    id="selection-search-input"
                                    name="keyword"
                                    type="text"
                                    maxlength="160"
                                    data-i18n-placeholder="portal.moApplicantSelection.searchPlaceholder"
                                    placeholder="Search by applicant name, email, job title, or course code"
                                >
                                <button id="selection-search-btn" class="primary-btn search-submit" type="submit" data-i18n="portal.common.search">Search</button>
                            </div>
                        </form>

                        <div id="selection-message" class="form-message hidden" role="status" aria-live="polite"></div>

                        <section id="applicant-detail-panel" class="selection-detail-panel hidden" aria-label="申请人详细信息">
                            <header class="selection-detail-header">
                                <div>
                                    <p class="selection-detail-label">Applicant profile</p>
                                    <h2 id="detail-full-name">Select an applicant</h2>
                                </div>
                                <a id="detail-resume-link" class="ghost-btn hidden" href="#" target="_blank" rel="noopener noreferrer">View resume</a>
                            </header>

                            <div id="detail-message" class="form-message hidden" role="status" aria-live="polite"></div>

                            <div class="selection-detail-grid">
                                <article class="detail-card">
                                    <p class="detail-card-label">Academic</p>
                                    <dl class="detail-list">
                                        <div><dt>Student ID</dt><dd id="detail-student-id">-</dd></div>
                                        <div><dt>Department</dt><dd id="detail-department">-</dd></div>
                                        <div><dt>Program</dt><dd id="detail-program">-</dd></div>
                                        <div><dt>GPA</dt><dd id="detail-gpa">-</dd></div>
                                    </dl>
                                </article>

                                <article class="detail-card">
                                    <p class="detail-card-label">Contact</p>
                                    <dl class="detail-list">
                                        <div><dt>Email</dt><dd id="detail-email">-</dd></div>
                                        <div><dt>Phone</dt><dd id="detail-phone">-</dd></div>
                                        <div><dt>Address</dt><dd id="detail-address">-</dd></div>
                                        <div><dt>Application</dt><dd id="detail-application-status">-</dd></div>
                                    </dl>
                                </article>
                            </div>

                            <article class="detail-card">
                                <p class="detail-card-label">Skills</p>
                                <div id="detail-skills" class="selection-detail-skills"></div>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label">Experience</p>
                                <p id="detail-experience" class="selection-detail-copy">-</p>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label">Motivation</p>
                                <p id="detail-motivation" class="selection-detail-copy">-</p>
                            </article>

                            <article class="detail-card">
                                <p class="detail-card-label">Cover letter</p>
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
    <script src="<%= contextPath %>/js/mo/mo-applicant-selection.js" defer></script>
</body>
</html>
