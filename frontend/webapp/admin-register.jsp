<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="adminRegister.page.title">Admin Register - TA Hiring System</title>
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

        <section class="register-hero" aria-labelledby="register-title">
            <div class="hero-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 4.5L20 8.5L12 12.5L4 8.5L12 4.5ZM7.2 10.1V14.2C7.2 16.6 9.5 18.4 12 18.4C14.5 18.4 16.8 16.6 16.8 14.2V10.1L12 12.5L7.2 10.1Z" />
                </svg>
            </div>
            <h1 id="register-title" data-i18n="adminRegister.hero.title">Create admin account</h1>
            <p class="subtitle" data-i18n="adminRegister.hero.subtitle">Admin account creation now requires an invitation</p>
        </section>

        <section class="register-card" data-i18n-aria-label="adminRegister.form.aria">
            <p class="field-hint">
                <span data-i18n="adminRegister.notice.primary">Direct admin self-registration has been disabled for security reasons.</span>
            </p>
            <p class="field-hint">
                <span data-i18n="adminRegister.notice.lead">If you already received an invitation email, open</span>
                <a href="<%= contextPath %>/admin-invite.jsp" data-i18n="adminRegister.notice.link">Admin invitation page</a>
                <span data-i18n="adminRegister.notice.tail">and complete account activation with your invite code.</span>
            </p>
        </section>

        <p class="page-switch-hint">
            <span data-i18n="adminRegister.links.needStandard">Need TA or MO account?</span>
            <a href="<%= contextPath %>/register.jsp" data-i18n="adminRegister.links.standardLink">Use standard registration</a>
        </p>
        <p class="page-switch-hint">
            <span data-i18n="adminRegister.links.haveAccount">Already have an account?</span>
            <a href="<%= contextPath %>/login.jsp" data-i18n="adminRegister.links.backLogin">Back to login</a>
        </p>

        <p class="login-footer" data-i18n="common.footer.copyright">University Hiring System © 2026</p>
    </main>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
</body>
</html>
