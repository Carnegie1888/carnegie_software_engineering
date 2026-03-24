<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="index.page.title">TA Hiring Portal - Home</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/portal-home.css">
</head>
<body>
    <header class="home-header">
        <div class="home-header-inner">
            <a class="home-brand" href="<%= contextPath %>/">
                <span class="home-brand-mark" aria-hidden="true">TA</span>
                <span data-i18n="common.portalBrand">TA Hiring Portal</span>
            </a>

            <nav class="home-nav" data-i18n-aria-label="index.nav.aria">
                <a href="#overview" data-i18n="index.nav.overview">Overview</a>
                <a href="#for-ta" data-i18n="index.nav.forTa">For TA</a>
                <a href="#for-mo" data-i18n="index.nav.forMo">For MO</a>
                <a href="#for-admin" data-i18n="index.nav.forAdmin">For Admin</a>
                <a href="#process" data-i18n="index.nav.process">Process</a>
                <a href="#faq" data-i18n="index.nav.faq">FAQ</a>
            </nav>

            <div class="home-header-actions">
                <div class="locale-switch" role="group" data-i18n-aria-label="common.locale.switchAria">
                    <button class="locale-btn" type="button" data-locale-switch data-locale="zh-CN" data-i18n="common.locale.zh">中文</button>
                    <span class="locale-divider">/</span>
                    <button class="locale-btn" type="button" data-locale-switch data-locale="en" data-i18n="common.locale.en">English</button>
                </div>
                <a class="home-link-btn secondary" href="<%= contextPath %>/login.jsp" data-i18n="common.action.signIn">Sign in</a>
                <a class="home-link-btn primary" href="<%= contextPath %>/register.jsp" data-i18n="common.action.createAccount">Create account</a>
            </div>
        </div>
    </header>

    <main class="portal-home">

        <section id="overview" class="home-hero">
            <p class="hero-badge" data-i18n="index.hero.badge">University TA Hiring Platform</p>
            <h1 data-i18n="index.hero.title">Manage TA hiring in one clear workflow</h1>
            <p class="hero-subtitle" data-i18n="index.hero.subtitle">
                A single portal for teaching assistants, module organizers, and admins to register, apply, review, and track outcomes.
            </p>
            <div class="hero-actions">
                <a class="home-link-btn primary" href="<%= contextPath %>/register.jsp" data-i18n="index.hero.primary">Get started</a>
                <a class="home-link-btn secondary" href="<%= contextPath %>/login.jsp" data-i18n="index.hero.secondary">Sign in</a>
            </div>
            <p class="hero-admin">
                <span data-i18n="index.hero.adminHint">Need admin access?</span>
                <a href="<%= contextPath %>/admin-invite.jsp" data-i18n="index.hero.adminLink">Create admin account</a>
            </p>
        </section>

        <section class="home-preview">
            <div class="section-head">
                <h2 data-i18n="index.preview.title">Built on real workflows, not mock slides</h2>
                <p data-i18n="index.preview.subtitle">The portal reflects implemented modules already available in this project.</p>
            </div>
            <div class="preview-grid">
                <article class="preview-card">
                    <h3 data-i18n="index.preview.cardTaTitle">TA workspace</h3>
                    <p data-i18n="index.preview.cardTaDesc">Create profile, browse openings, apply, and track application status.</p>
                </article>
                <article class="preview-card">
                    <h3 data-i18n="index.preview.cardMoTitle">MO workspace</h3>
                    <p data-i18n="index.preview.cardMoDesc">Publish jobs, review applicants, shortlist candidates, and monitor progress.</p>
                </article>
                <article class="preview-card">
                    <h3 data-i18n="index.preview.cardAdminTitle">Admin workspace</h3>
                    <p data-i18n="index.preview.cardAdminDesc">View workload and status distribution across the hiring pipeline.</p>
                </article>
            </div>
        </section>

        <section id="for-ta" class="role-section">
            <h2 data-i18n="index.forTa.title">For teaching assistants</h2>
            <p class="role-lead" data-i18n="index.forTa.lead">Everything a TA needs from profile setup to final decision tracking.</p>
            <ul>
                <li data-i18n="index.forTa.item1">Build and update your profile with resume and skills.</li>
                <li data-i18n="index.forTa.item2">Search and filter open TA positions by keyword and status.</li>
                <li data-i18n="index.forTa.item3">Submit applications and check pending, accepted, or rejected updates.</li>
            </ul>
            <a class="inline-link" href="<%= contextPath %>/login.jsp" data-i18n="index.forTa.cta">Sign in as TA</a>
        </section>

        <section id="for-mo" class="role-section">
            <h2 data-i18n="index.forMo.title">For module organizers</h2>
            <p class="role-lead" data-i18n="index.forMo.lead">Publish openings, evaluate applicants, and close hiring loops quickly.</p>
            <ul>
                <li data-i18n="index.forMo.item1">Create postings with title, course, skills, slots, and deadline.</li>
                <li data-i18n="index.forMo.item2">Review applicant profiles and attached materials in one list.</li>
                <li data-i18n="index.forMo.item3">Accept or reject applicants while tracking overall review progress.</li>
            </ul>
            <a class="inline-link" href="<%= contextPath %>/login.jsp" data-i18n="index.forMo.cta">Sign in as MO</a>
        </section>

        <section id="for-admin" class="role-section">
            <h2 data-i18n="index.forAdmin.title">For administrators</h2>
            <p class="role-lead" data-i18n="index.forAdmin.lead">Get a system-level view of workload and status distribution.</p>
            <ul>
                <li data-i18n="index.forAdmin.item1">Monitor active jobs, applications, and per-status breakdown.</li>
                <li data-i18n="index.forAdmin.item2">Inspect organizer workloads and key operational trends.</li>
                <li data-i18n="index.forAdmin.item3">Export workload snapshots for reporting and planning.</li>
            </ul>
            <a class="inline-link" href="<%= contextPath %>/login.jsp" data-i18n="index.forAdmin.cta">Sign in as Admin</a>
        </section>

        <section id="process" class="process-section">
            <div class="section-head">
                <h2 data-i18n="index.process.title">From registration to final offer</h2>
                <p data-i18n="index.process.lead">The homepage mirrors the current end-to-end process in the system.</p>
            </div>
            <div class="process-grid">
                <article class="process-card">
                    <h3 data-i18n="index.process.step1Title">1. Register account</h3>
                    <p data-i18n="index.process.step1Desc">TA/MO use standard registration. Admin uses a dedicated admin registration page.</p>
                </article>
                <article class="process-card">
                    <h3 data-i18n="index.process.step2Title">2. Complete profile or post job</h3>
                    <p data-i18n="index.process.step2Desc">TAs prepare profile details. MOs publish openings with requirements and deadlines.</p>
                </article>
                <article class="process-card">
                    <h3 data-i18n="index.process.step3Title">3. Apply and review</h3>
                    <p data-i18n="index.process.step3Desc">TAs submit applications. MOs review applicants and make selection decisions.</p>
                </article>
                <article class="process-card">
                    <h3 data-i18n="index.process.step4Title">4. Track status and workload</h3>
                    <p data-i18n="index.process.step4Desc">TAs monitor application outcomes, while admins monitor global workload statistics.</p>
                </article>
            </div>
        </section>

        <section class="ai-section">
            <div class="section-head">
                <h2 data-i18n="index.ai.title">AI support for organizer decisions</h2>
                <p data-i18n="index.ai.lead">Current AI modules are available in the MO area.</p>
            </div>
            <ul class="ai-list">
                <li data-i18n="index.ai.item1">Skill Match compares applicants against job requirements.</li>
                <li data-i18n="index.ai.item2">Missing Skills highlights capability gaps by applicant group.</li>
                <li data-i18n="index.ai.item3">Use AI insights together with manual review before selecting finalists.</li>
            </ul>
        </section>

        <section id="faq" class="faq-section">
            <h2 data-i18n="index.faq.title">Frequently asked questions</h2>
            <article class="faq-item">
                <h3 data-i18n="index.faq.q1">Do I need to visit this page every time?</h3>
                <p data-i18n="index.faq.a1">No. Returning users can open the login page directly and continue from there.</p>
            </article>
            <article class="faq-item">
                <h3 data-i18n="index.faq.q2">Which role should I choose?</h3>
                <p data-i18n="index.faq.a2">Choose TA for applicants, MO for module organizers, and Admin only for platform managers.</p>
            </article>
            <article class="faq-item">
                <h3 data-i18n="index.faq.q3">Can I switch language later?</h3>
                <p data-i18n="index.faq.a3">Yes. Use the top-right language switch at any time. Your choice is remembered.</p>
            </article>
        </section>

        <footer class="home-footer">
            <p data-i18n="common.footer.copyright">University Hiring System © 2026</p>
        </footer>
    </main>

    <script src="<%= contextPath %>/js/i18n.js" defer></script>
</body>
</html>
