<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
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
    <title data-i18n="portal.page.adminInviteManagement.title">Admin Invitation Management - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/admin/admin-invite-management.css">
</head>
<body>
    <div class="portal-shell portal-shell-admin">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.admin.aria">
            <p class="portal-brand" data-i18n="portal.brand.admin">Admin Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/admin/dashboard.jsp">
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
                    class="portal-nav-link is-active"
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
                    <span class="portal-topbar-page" data-i18n="portal.adminDashboard.inviteTitle">Invite new admin</span>
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
                <main class="admin-invite-page">
                    <section class="admin-invite-hero" aria-labelledby="admin-invite-title">
                        <h1 id="admin-invite-title" class="portal-page-title" data-i18n="portal.adminDashboard.inviteTitle">Invite new admin</h1>
                        <p class="subtitle" data-i18n="portal.adminDashboard.inviteLead">Create one-time invitation link/code and send via email.</p>
                    </section>

                    <section
                        id="admin-invite-panel"
                        class="invite-panel invite-page-panel"
                        aria-label="管理员邀请创建"
                        data-i18n-aria-label="portal.adminDashboard.invitePanelAria"
                    >
                        <header class="invite-panel-header">
                            <h2 data-i18n="portal.adminDashboard.inviteTitle">Invite new admin</h2>
                            <p data-i18n="portal.adminDashboard.inviteLead">Create one-time invitation link/code and send via email.</p>
                        </header>
                        <form id="admin-invite-form" class="invite-form" novalidate>
                            <div class="field-group">
                                <label for="invite-email" data-i18n="portal.adminDashboard.inviteeEmail">Invitee email</label>
                                <input id="invite-email" name="email" type="email" maxlength="100" placeholder="new_admin@university.edu" data-i18n-placeholder="portal.adminDashboard.inviteeEmailPlaceholder" required>
                            </div>
                            <div class="field-group">
                                <label for="invite-expire-hours" data-i18n="portal.adminDashboard.expiresInHours">Expires in (hours)</label>
                                <input id="invite-expire-hours" name="expireHours" type="number" min="1" max="168" value="48">
                            </div>
                            <div class="invite-actions">
                                <button id="send-invite-btn" class="primary-btn" type="submit" data-i18n="portal.adminDashboard.sendInvitation">Send invitation</button>
                            </div>
                        </form>
                        <div id="invite-message" class="form-message hidden" role="status" aria-live="polite"></div>
                        <div id="invite-result" class="invite-result hidden" aria-live="polite"></div>
                    </section>
                </main>
            </div>
        </section>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/common/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/admin/admin-invite-management.js" defer></script>
</body>
</html>
