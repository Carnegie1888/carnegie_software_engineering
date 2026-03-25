<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
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
    <title data-i18n="portal.page.taApplicationStatus.title">Application status - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/ta-application-status.css">
</head>
<body>
    <div class="portal-shell portal-shell-ta">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.ta.aria">
            <p class="portal-brand" data-i18n="portal.brand.ta">TA Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/ta/job-list.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 7.5h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="M9 7.5V6A1.5 1.5 0 0 1 10.5 4.5h3A1.5 1.5 0 0 1 15 6v1.5" />
                        <path d="M3 12h18" />
                    </svg>
                    <span data-i18n="portal.nav.ta.jobs">Jobs</span>
                </a>
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/ta/application-status.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="8"></circle>
                        <path d="m8.5 12.5 2.2 2.2L15.5 10"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.status">Status</span>
                </a>
                <span class="portal-nav-link is-disabled" aria-disabled="true">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 3v3"></path>
                        <path d="M12 18v3"></path>
                        <path d="M3 12h3"></path>
                        <path d="M18 12h3"></path>
                        <path d="m6 6 2 2"></path>
                        <path d="m16 16 2 2"></path>
                        <path d="m6 18 2-2"></path>
                        <path d="m16 8 2-2"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.aiMatch">AI Match</span>
                </span>
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
                    <span class="portal-topbar-page" data-i18n="portal.taApplicationStatus.title">My Applications</span>
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
                <main class="status-page">
                    <section class="status-hero" aria-labelledby="status-title">
                        <h1 id="status-title" class="portal-page-title" data-i18n="portal.taApplicationStatus.title">My Applications</h1>
                        <p class="subtitle">Track the status of your submitted applications.</p>
                    </section>

                    <section class="status-panel" aria-label="申请状态列表">
                        <form id="status-search-form" class="search-form" novalidate>
                            <label for="status-search-input" data-i18n="portal.common.search">Search</label>
                            <div class="search-row">
                                <input
                                    id="status-search-input"
                                    name="keyword"
                                    type="text"
                                    maxlength="120"
                                    data-i18n-placeholder="portal.taApplicationStatus.searchPlaceholder"
                                    placeholder="Search by job title, course code, or MO"
                                >
                                <button class="primary-btn search-submit" id="status-search-btn" type="submit" data-i18n="portal.common.search">Search</button>
                            </div>
                        </form>

                        <div id="status-message" class="form-message hidden" role="status" aria-live="polite"></div>

                        <p id="list-summary" class="list-summary" data-i18n="portal.taApplicationStatus.loadingApplications">Loading applications...</p>
                        <div id="applications-list" class="applications-list" aria-live="polite"></div>
                    </section>
                </main>
            </div>
        </section>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/ta-application-status.js" defer></script>
</body>
</html>
