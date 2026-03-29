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
    <title data-i18n="portal.page.adminDashboard.title">Admin Workload Dashboard - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/admin/admin-dashboard.css">
</head>
<body>
    <div class="portal-shell portal-shell-admin">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.admin.aria">
            <p class="portal-brand" data-i18n="portal.brand.admin">Admin Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/admin/dashboard.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M4 12h7V4H4z"></path>
                        <path d="M13 20h7v-8h-7z"></path>
                        <path d="M13 11h7V4h-7z"></path>
                        <path d="M4 20h7v-6H4z"></path>
                    </svg>
                    <span data-i18n="portal.nav.admin.dashboard">Dashboard</span>
                </a>
                <a
                    id="admin-invite-nav-link"
                    class="portal-nav-link"
                    href="<%= contextPath %>/jsp/admin/invite.jsp"
                >
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                        <path d="M4 4h16v16H4z"></path>
                    </svg>
                    <span data-i18n="portal.adminDashboard.inviteTitle">Invite new admin</span>
                </a>
            </nav>
        </aside>

        <section class="portal-main">
            <header class="portal-topbar">
                <div class="portal-topbar-menu">
                    <span class="portal-topbar-role" data-i18n="portal.brand.admin">Admin Portal</span>
                    <span class="portal-topbar-divider" aria-hidden="true"></span>
                    <span class="portal-topbar-page" data-i18n="portal.adminDashboard.title">Admin Workload Dashboard</span>
                </div>
                <div class="portal-topbar-right">
                    <div class="portal-user">
                        <span class="portal-user-avatar"><%= username != null && !username.isEmpty() ? username.substring(0, 1).toUpperCase() : "A" %></span>
                        <span class="portal-user-name"><%= username == null || username.isEmpty() ? "Admin User" : username %></span>
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
                <main class="admin-dashboard-page">
                    <section class="admin-hero" aria-labelledby="admin-title">
                        <h1 id="admin-title" class="portal-page-title" data-i18n="portal.adminDashboard.title">Admin Workload Dashboard</h1>
                        <p class="subtitle">Track application volume and module owner review workload in one place.</p>
                    </section>

                    <section class="admin-panel" aria-label="管理员工作量统计仪表盘">
                        <form id="workload-filter-form" class="filter-form" novalidate>
                            <div class="field-group">
                                <label for="start-time">Start</label>
                                <input id="start-time" name="start" type="datetime-local">
                            </div>
                            <div class="field-group">
                                <label for="end-time">End</label>
                                <input id="end-time" name="end" type="datetime-local">
                            </div>
                            <div class="filter-actions">
                                <button id="apply-filter-btn" class="primary-btn" type="submit">Apply range</button>
                                <button id="clear-filter-btn" class="ghost-btn" type="button">Clear</button>
                                <button id="refresh-btn" class="inline-btn" type="button">Refresh</button>
                                <button id="export-btn" class="inline-btn" type="button">Export CSV</button>
                            </div>
                        </form>

                        <div id="dashboard-message" class="form-message hidden" role="status" aria-live="polite"></div>

                        <section class="summary-grid" aria-label="申请状态统计">
                            <article class="summary-card">
                                <p>Total</p>
                                <strong id="summary-total">0</strong>
                            </article>
                            <article class="summary-card pending">
                                <p>Pending</p>
                                <strong id="summary-pending">0</strong>
                            </article>
                            <article class="summary-card accepted">
                                <p>Accepted</p>
                                <strong id="summary-accepted">0</strong>
                            </article>
                            <article class="summary-card rejected">
                                <p>Rejected</p>
                                <strong id="summary-rejected">0</strong>
                            </article>
                            <article class="summary-card withdrawn">
                                <p>Withdrawn</p>
                                <strong id="summary-withdrawn">0</strong>
                            </article>
                        </section>

                        <section class="chart-grid" aria-label="数据可视化图表">
                            <article class="chart-card">
                                <header class="chart-header">
                                    <h2>Application Status Distribution</h2>
                                    <p>Breakdown by review status in current range.</p>
                                </header>
                                <div id="status-chart" class="status-chart" aria-live="polite"></div>
                            </article>
                            <article class="chart-card">
                                <header class="chart-header">
                                    <h2>MO Workload Overview</h2>
                                    <p>Workload intensity by module owner.</p>
                                </header>
                                <div id="mo-chart" class="mo-chart" aria-live="polite"></div>
                            </article>
                            <article class="chart-card">
                                <header class="chart-header">
                                    <h2>TA Workload Overview</h2>
                                    <p>Application count by talent associate.</p>
                                </header>
                                <div id="ta-chart" class="ta-chart" aria-live="polite"></div>
                            </article>
                        </section>

                        <section class="mo-panel" aria-label="MO工作量列表">
                            <header class="mo-panel-header">
                                <h2>MO Workload</h2>
                                <p id="mo-summary">Loading workload...</p>
                            </header>
                            <div id="mo-list" class="mo-list" aria-live="polite"></div>
                        </section>

                        <section class="ta-panel" aria-label="TA工作量列表">
                            <header class="ta-panel-header">
                                <h2>TA Workload</h2>
                                <p id="ta-summary">Loading workload...</p>
                            </header>
                            <div id="ta-list" class="ta-list" aria-live="polite"></div>
                        </section>
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
    <script src="<%= contextPath %>/js/admin/admin-dashboard.js" defer></script>
</body>
</html>
