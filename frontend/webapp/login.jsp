<%@ page contentType="text/html;charset=UTF-8" language="java" import="com.example.authlogin.dao.UserDao" %>
<%
    UserDao.getInstance();
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="login.page.title">Login - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/login.css">
</head>
<body>
    <main class="login-page">
        <div class="page-utility">
            <a class="utility-link" href="<%= contextPath %>/" data-i18n="common.utility.backToPortal">Portal home</a>
            <div class="locale-switch" role="group" data-i18n-aria-label="common.locale.switchAria">
                <button class="locale-btn" type="button" data-locale-switch data-locale="zh-CN" data-i18n="common.locale.zh">中文</button>
                <span class="locale-divider">/</span>
                <button class="locale-btn" type="button" data-locale-switch data-locale="en" data-i18n="common.locale.en">English</button>
            </div>
        </div>

        <section class="login-hero" aria-labelledby="login-title">
            <div class="hero-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 4.5L20 8.5L12 12.5L4 8.5L12 4.5ZM7.2 10.1V14.2C7.2 16.6 9.5 18.4 12 18.4C14.5 18.4 16.8 16.6 16.8 14.2V10.1L12 12.5L7.2 10.1Z" />
                </svg>
            </div>
            <h1 id="login-title" data-i18n="login.hero.title">TA Hiring Portal</h1>
            <p class="subtitle" data-i18n="login.hero.subtitle">Sign in to your account</p>
        </section>

        <section class="login-card" data-i18n-aria-label="login.form.aria">

            <div id="form-message" class="form-message hidden" role="alert" aria-live="polite"></div>

            <form id="login-form" class="login-form" method="post" action="<%= contextPath %>/login" novalidate>
                <div class="field">
                    <div class="field-label-row">
                        <label for="username" data-i18n="login.form.usernameLabel">Username or email</label>
                    </div>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username or name@university.edu"
                        data-i18n-placeholder="login.form.usernamePlaceholder"
                        autocomplete="username"
                        maxlength="100"
                        required
                    >
                </div>

                <div class="field">
                    <div class="field-label-row">
                        <label for="password" data-i18n="login.form.passwordLabel">Password</label>
                        <button class="forgot-link" type="button" disabled data-i18n="login.form.forgot">Forgot?</button>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        data-i18n-placeholder="login.form.passwordPlaceholder"
                        autocomplete="current-password"
                        maxlength="100"
                        required
                    >
                </div>

                <label class="keep-signed-in">
                    <input type="checkbox" name="rememberMe" value="1">
                    <span data-i18n="login.form.keepSignedIn">Keep me signed in</span>
                </label>

                <input id="login-role" type="hidden" name="role" value="MO">

                <div class="login-actions" role="group" data-i18n-aria-label="login.form.roleAria">
                    <button
                        id="ta-login-submit"
                        class="login-action-btn"
                        type="submit"
                        data-role="TA"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 12C14.07 12 15.75 10.32 15.75 8.25C15.75 6.18 14.07 4.5 12 4.5C9.93 4.5 8.25 6.18 8.25 8.25C8.25 10.32 9.93 12 12 12Z" />
                            <path d="M5.25 18.75C5.25 16.2647 8.26472 14.25 12 14.25C15.7353 14.25 18.75 16.2647 18.75 18.75" />
                        </svg>
                        <span data-i18n="login.form.ta">TA Login</span>
                    </button>
                    <button
                        id="mo-login-submit"
                        class="login-action-btn"
                        type="submit"
                        data-role="MO"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 3.75L18.75 6.75V11.25C18.75 15.2141 15.901 18.5261 12 19.5C8.09904 18.5261 5.25 15.2141 5.25 11.25V6.75L12 3.75Z" />
                        </svg>
                        <span data-i18n="login.form.mo">MO Login</span>
                    </button>
                    <button
                        id="admin-login-submit"
                        class="login-action-btn"
                        type="submit"
                        data-role="ADMIN"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 3.75L18.75 6.75V11.25C18.75 15.2141 15.901 18.5261 12 19.5C8.09904 18.5261 5.25 15.2141 5.25 11.25V6.75L12 3.75Z" />
                            <path d="M9.75 11.625L11.25 13.125L14.25 10.125" />
                        </svg>
                        <span data-i18n="login.form.admin">Admin</span>
                    </button>
                </div>
            </form>
        </section>

        <p class="register-hint">
            <span data-i18n="login.links.noAccount">Don't have an account?</span>
            <a href="<%= contextPath %>/register.jsp" data-i18n="login.links.createAccount">Create one now</a>
        </p>
        <p class="register-hint">
            <span data-i18n="login.links.needAdmin">Need admin access?</span>
            <a href="<%= contextPath %>/admin-register.jsp" data-i18n="login.links.createAdmin">Create admin account</a>
        </p>

        <p class="login-footer" data-i18n="common.footer.copyright">University Hiring System © 2026</p>
    </main>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/login.js" defer></script>
</body>
</html>
