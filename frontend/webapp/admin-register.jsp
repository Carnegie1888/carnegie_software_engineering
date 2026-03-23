<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Register - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/register.css">
</head>
<body>
    <main class="register-page">
        <section class="register-hero" aria-labelledby="register-title">
            <div class="hero-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 4.5L20 8.5L12 12.5L4 8.5L12 4.5ZM7.2 10.1V14.2C7.2 16.6 9.5 18.4 12 18.4C14.5 18.4 16.8 16.6 16.8 14.2V10.1L12 12.5L7.2 10.1Z" />
                </svg>
            </div>
            <h1 id="register-title">Admin registration is invitation-only</h1>
            <p class="subtitle">Ask an existing admin to send you an invitation link by email.</p>
        </section>

        <section class="register-card" aria-label="管理员注册表单">
            <p class="field-hint">
                Direct admin self-registration has been disabled for security reasons.
                If you already received an invitation email, open the invitation link or visit
                <code><%= contextPath %>/admin-invite.jsp</code> with your invite code.
            </p>
        </section>

        <p class="page-switch-hint">
            Need TA or MO account?
            <a href="<%= contextPath %>/register.jsp">Use standard registration</a>
        </p>
        <p class="page-switch-hint">
            Already have an account?
            <a href="<%= contextPath %>/login.jsp">Back to login</a>
        </p>

        <p class="login-footer">University Hiring System © 2026</p>
    </main>

</body>
</html>
