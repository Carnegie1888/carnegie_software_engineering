<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TA Hiring Portal</title>
    <style>
        :root {
            color-scheme: light;
            --hero-start: #0f62fe;
            --hero-end: #7c3aed;
            --surface: rgba(255, 255, 255, 0.92);
            --surface-soft: rgba(255, 255, 255, 0.72);
            --text-main: #1d1d1f;
            --text-subtle: #5b5b62;
            --line: rgba(15, 23, 42, 0.08);
            --primary: #0f62fe;
            --primary-hover: #0b52d0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            background:
                radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 32%),
                linear-gradient(135deg, var(--hero-start) 0%, var(--hero-end) 100%);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 18px;
        }

        .shell {
            width: min(1080px, 100%);
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(320px, 440px);
            gap: 24px;
        }

        .hero,
        .panel {
            border-radius: 28px;
            backdrop-filter: blur(16px);
            box-shadow: 0 24px 64px rgba(8, 15, 52, 0.18);
        }

        .hero {
            padding: 40px 38px;
            background: var(--surface-soft);
            border: 1px solid rgba(255,255,255,0.28);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 540px;
        }

        .eyebrow {
            margin: 0 0 14px;
            font-size: 13px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.82);
            font-weight: 700;
        }

        .hero h1 {
            margin: 0;
            font-size: clamp(34px, 5vw, 58px);
            line-height: 1.04;
            color: #fff;
            letter-spacing: -0.04em;
        }

        .hero p {
            margin: 18px 0 0;
            font-size: 17px;
            line-height: 1.7;
            color: rgba(255,255,255,0.9);
            max-width: 640px;
        }

        .feature-grid {
            margin-top: 28px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .feature-card {
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.16);
        }

        .feature-card strong {
            display: block;
            color: #fff;
            font-size: 15px;
            font-weight: 700;
        }

        .feature-card span {
            display: block;
            margin-top: 6px;
            color: rgba(255,255,255,0.84);
            font-size: 13px;
            line-height: 1.55;
        }

        .hero-footer {
            margin-top: 28px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            color: rgba(255,255,255,0.92);
            font-size: 13px;
            font-weight: 600;
        }

        .panel {
            background: var(--surface);
            border: 1px solid rgba(255,255,255,0.34);
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .panel h2 {
            margin: 0;
            font-size: 28px;
            line-height: 1.15;
            letter-spacing: -0.03em;
        }

        .panel-copy {
            margin: 0;
            color: var(--text-subtle);
            font-size: 15px;
            line-height: 1.65;
        }

        .action-list {
            display: grid;
            gap: 12px;
        }

        .action-link {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px 18px;
            border-radius: 18px;
            background: #fff;
            border: 1px solid var(--line);
            text-decoration: none;
            color: var(--text-main);
            transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .action-link:hover {
            transform: translateY(-1px);
            border-color: rgba(15, 98, 254, 0.28);
            box-shadow: 0 16px 30px rgba(15, 98, 254, 0.12);
        }

        .action-link strong {
            display: block;
            font-size: 16px;
            line-height: 1.4;
        }

        .action-link span {
            display: block;
            margin-top: 4px;
            color: var(--text-subtle);
            font-size: 13px;
            line-height: 1.5;
        }

        .arrow {
            color: var(--primary);
            font-size: 20px;
            font-weight: 700;
        }

        .secondary-links {
            display: grid;
            gap: 10px;
            padding-top: 8px;
            border-top: 1px solid var(--line);
        }

        .secondary-link {
            color: var(--primary);
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
        }

        .secondary-link:hover {
            color: var(--primary-hover);
        }

        .note {
            margin-top: auto;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(15, 98, 254, 0.08);
            color: #26446f;
            font-size: 13px;
            line-height: 1.6;
        }

        @media (max-width: 900px) {
            .shell {
                grid-template-columns: 1fr;
            }

            .hero {
                min-height: unset;
            }
        }

        @media (max-width: 640px) {
            body {
                padding: 20px 12px;
            }

            .hero,
            .panel {
                padding: 22px 18px;
                border-radius: 22px;
            }

            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="shell">
        <section class="hero" aria-labelledby="portal-title">
            <div>
                <p class="eyebrow">EBU6304 Group Project</p>
                <h1 id="portal-title">TA Hiring Portal</h1>
                <p>
                    A lightweight Java Servlet / JSP recruitment system for teaching assistant hiring,
                    covering applicant profiles, resume upload, job posting, applicant review, AI matching,
                    and admin workload visibility.
                </p>

                <div class="feature-grid" aria-label="system feature highlights">
                    <div class="feature-card">
                        <strong>TA workflow</strong>
                        <span>Create and maintain profile, upload resume, browse jobs, apply, and track status.</span>
                    </div>
                    <div class="feature-card">
                        <strong>MO workflow</strong>
                        <span>Publish jobs, review applicants, compare fit, and make hiring decisions.</span>
                    </div>
                    <div class="feature-card">
                        <strong>AI insights</strong>
                        <span>Skill match and missing skill analysis based on structured profile and job requirements.</span>
                    </div>
                    <div class="feature-card">
                        <strong>Admin visibility</strong>
                        <span>Review workload snapshots and export structured data for reporting.</span>
                    </div>
                </div>
            </div>

            <div class="hero-footer">
                <span class="hero-badge">Java Servlet / JSP</span>
                <span class="hero-badge">CSV file storage</span>
                <span class="hero-badge">No database</span>
            </div>
        </section>

        <aside class="panel" aria-labelledby="portal-entry-title">
            <div>
                <h2 id="portal-entry-title">Get started</h2>
                <p class="panel-copy">
                    Choose your next action below. For most users, the normal starting point is login or account registration.
                </p>
            </div>

            <div class="action-list">
                <a class="action-link" href="<%= contextPath %>/login.jsp">
                    <div>
                        <strong>Sign in</strong>
                        <span>Access TA, MO, or Admin workspace using your existing account.</span>
                    </div>
                    <span class="arrow" aria-hidden="true">→</span>
                </a>

                <a class="action-link" href="<%= contextPath %>/register.jsp">
                    <div>
                        <strong>Create TA / MO account</strong>
                        <span>Register as an applicant or module organizer and start using the system.</span>
                    </div>
                    <span class="arrow" aria-hidden="true">→</span>
                </a>

                <a class="action-link" href="<%= contextPath %>/admin-register.jsp">
                    <div>
                        <strong>Create Admin account</strong>
                        <span>Use this only when setting up privileged administrative access.</span>
                    </div>
                    <span class="arrow" aria-hidden="true">→</span>
                </a>
            </div>

            <div class="secondary-links">
                <a class="secondary-link" href="<%= contextPath %>/hello">Open technical health page</a>
            </div>

            <div class="note">
                Recommended demo flow: register → login → complete TA profile → upload resume → apply for a job →
                review applicants as MO → inspect workload as Admin.
            </div>
        </aside>
    </div>
</body>
</html>
