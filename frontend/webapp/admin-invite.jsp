<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="adminInvite.page.title">Admin Invitation - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/auth/register.css">
</head>
<body>
    <main class="register-page">
        <div class="page-utility">
            <a class="utility-link" href="<%= contextPath %>/" data-i18n="common.utility.backToPortal">Portal home</a>
            <div class="locale-switch" role="group" data-i18n-aria-label="common.locale.switchAria">
                <button class="locale-btn" type="button" data-locale-switch data-locale="zh-CN" data-i18n="common.locale.zh">中文</button>
                <span class="locale-divider">/</span>
                <button class="locale-btn" type="button" data-locale-switch data-locale="en" data-i18n="common.locale.en">English</button>
            </div>
        </div>

        <section class="register-hero" aria-labelledby="invite-title">
            <div class="hero-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 4.5L20 8.5L12 12.5L4 8.5L12 4.5ZM7.2 10.1V14.2C7.2 16.6 9.5 18.4 12 18.4C14.5 18.4 16.8 16.6 16.8 14.2V10.1L12 12.5L7.2 10.1Z" />
                </svg>
            </div>
            <h1 id="invite-title" data-i18n="adminInvite.hero.title">Complete admin invitation</h1>
            <p class="subtitle" data-i18n="adminInvite.hero.subtitle">Use your invitation link or invite code to create an Admin account</p>
        </section>

        <section class="register-card" aria-label="管理员邀请注册表单" data-i18n-aria-label="adminInvite.form.aria">
            <div id="form-message" class="form-message hidden" role="alert" aria-live="polite"></div>
            <p id="invite-status" class="field-hint" data-i18n="adminInvite.status.checkingToken">Checking invitation token...</p>

            <form id="admin-invite-form" class="register-form" method="post" action="<%= contextPath %>/api/admin/invite/accept" novalidate>
                <input id="invite-token" type="hidden" name="token" value="">

                <div class="field">
                    <div class="field-label-row">
                        <label for="email" data-i18n="adminInvite.form.emailLabel">Email address</label>
                    </div>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@university.edu"
                        data-i18n-placeholder="adminInvite.form.emailPlaceholder"
                        autocomplete="email"
                        maxlength="100"
                        required
                    >
                </div>

                <div class="field">
                    <div class="field-label-row">
                        <label for="invite-code" data-i18n="adminInvite.form.inviteCodeLabel">Invite code (optional if opened from email link)</label>
                    </div>
                    <input
                        id="invite-code"
                        name="inviteCode"
                        type="text"
                        placeholder="ABCDEFGH"
                        data-i18n-placeholder="adminInvite.form.inviteCodePlaceholder"
                        autocomplete="one-time-code"
                        maxlength="16"
                    >
                </div>

                <div class="field">
                    <div class="field-label-row">
                        <label for="username" data-i18n="adminInvite.form.usernameLabel">Username</label>
                    </div>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="admin_username"
                        data-i18n-placeholder="adminInvite.form.usernamePlaceholder"
                        autocomplete="username"
                        maxlength="20"
                        required
                    >
                </div>

                <div class="field">
                    <div class="field-label-row">
                        <label for="password" data-i18n="adminInvite.form.passwordLabel">Password</label>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        data-i18n-placeholder="adminInvite.form.passwordPlaceholder"
                        autocomplete="new-password"
                        maxlength="100"
                        required
                    >
                </div>

                <div class="field">
                    <div class="field-label-row">
                        <label for="confirm-password" data-i18n="adminInvite.form.confirmLabel">Confirm password</label>
                    </div>
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        data-i18n-placeholder="adminInvite.form.confirmPlaceholder"
                        autocomplete="new-password"
                        maxlength="100"
                        required
                    >
                </div>

                <button id="invite-submit" class="register-submit-btn" type="submit" data-i18n="adminInvite.form.submit">Create admin account</button>
            </form>
        </section>

        <p class="page-switch-hint">
            <span data-i18n="adminInvite.links.haveAccount">Already have an account?</span>
            <a href="<%= contextPath %>/login.jsp" data-i18n="adminInvite.links.backLogin">Back to login</a>
        </p>
        <p class="login-footer" data-i18n="common.footer.copyright">University Hiring System © 2026</p>
    </main>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/auth/admin-invite.js" defer></script>
</body>
</html>
