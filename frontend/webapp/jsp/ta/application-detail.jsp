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
    <title data-i18n="portal.page.taApplicationDetail.title">Application detail - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/ta/ta-application-detail.css">
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
                    <span data-i18n="portal.nav.ta.jobs">Job List</span>
                </a>
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/ta/application-status.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="8"></circle>
                        <path d="m8.5 12.5 2.2 2.2L15.5 10"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.status">My Applications</span>
                </a>
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
                    <span class="portal-topbar-page" data-i18n="portal.taApplicationDetail.title">Application detail</span>
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
                <main class="application-detail-page" id="application-detail-root">
                    <div class="detail-back-row">
                        <a class="detail-back-link" href="<%= contextPath %>/jsp/ta/application-status.jsp" data-i18n="portal.taApplicationDetail.backToList">← My applications</a>
                    </div>

                    <div id="detail-message" class="form-message hidden" role="status" aria-live="polite"></div>

                    <section class="app-detail-header-card" id="app-header-card" aria-labelledby="app-detail-title">
                        <div class="app-detail-header-icon" id="app-course-badge" aria-hidden="true">—</div>
                        <div class="app-detail-header-main">
                            <h1 id="app-detail-title" class="app-detail-title">—</h1>
                            <p class="app-detail-submitted" id="app-detail-submitted">—</p>
                        </div>
                        <span class="application-status-chip status-pending" id="app-status-chip"><span class="application-status-text">—</span></span>
                    </section>

                    <div class="app-detail-layout">
                        <button type="button" class="job-teaser-card" id="job-teaser-trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="job-modal-dialog">
                            <div class="job-teaser-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                            </div>
                            <div class="job-teaser-body">
                                <p class="job-teaser-label" data-i18n="portal.taApplicationDetail.jobTeaserTitle">Applied position details</p>
                                <div class="job-teaser-meta" id="job-teaser-meta"></div>
                            </div>
                            <span class="job-teaser-cta" data-i18n="portal.taApplicationDetail.viewDetailsCta">View details →</span>
                            <span class="job-teaser-arrow" aria-hidden="true">›</span>
                        </button>

                        <article class="app-info-card app-info-card--cover" aria-labelledby="cover-title">
                            <div class="cover-card-head">
                                <span class="cover-card-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </span>
                                <h2 id="cover-title" class="app-info-card-title" data-i18n="portal.taJobDetail.coverLetter">Cover letter</h2>
                            </div>
                            <p class="cover-body" id="cover-letter-body">—</p>
                        </article>

                        <a class="profile-jump-card" id="profile-jump-card" href="<%= contextPath %>/jsp/ta/dashboard.jsp">
                            <span class="profile-jump-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <circle cx="12" cy="8" r="3.2"></circle>
                                    <path d="M5.2 19a6.8 6.8 0 0 1 13.6 0"></path>
                                </svg>
                            </span>
                            <span class="profile-jump-body">
                                <span class="profile-jump-title" data-i18n="portal.taApplicationDetail.profileCardTitle">My profile</span>
                                <span class="profile-jump-copy" id="profile-jump-copy" data-i18n="portal.taApplicationDetail.profileCardHint">View or edit your resume and skills.</span>
                            </span>
                            <span class="profile-jump-arrow" aria-hidden="true">›</span>
                        </a>

                        <p class="profile-sync-note" id="profile-sync-note">
                            <span class="profile-sync-note-icon" aria-hidden="true">
                                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <circle cx="10" cy="10" r="8"></circle>
                                    <path d="M10 6.2v.2"></path>
                                    <path d="M10 9v4.7"></path>
                                </svg>
                            </span>
                            <span id="profile-sync-note-text" data-i18n="portal.taApplicationDetail.profileSyncNote">
                                Your profile and resume were sent with this application to the MO. You can update your profile after submission, and changes will sync to the MO view.
                            </span>
                        </p>
                    </div>
                </main>
            </div>
        </section>
    </div>

    <div id="job-modal" class="job-modal hidden" aria-hidden="true">
        <div class="job-modal-backdrop" data-close-modal tabindex="-1" aria-hidden="true"></div>
        <div
            class="job-modal-panel"
            id="job-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            tabindex="-1"
        >
            <div class="job-modal-header">
                <div class="job-modal-icon" id="job-modal-badge" aria-hidden="true">—</div>
                <div class="job-modal-heading">
                    <h2 id="job-modal-title" class="job-modal-title">—</h2>
                    <p class="job-modal-subtitle" id="job-modal-subtitle">—</p>
                </div>
                <button type="button" class="job-modal-close" id="job-modal-close" data-i18n-aria-label="portal.taApplicationDetail.closeModal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="job-modal-body">
                <div class="job-modal-metrics" id="job-modal-metrics"></div>
                <section class="job-modal-section" aria-labelledby="modal-desc-title">
                    <h3 id="modal-desc-title" class="job-modal-section-title" data-i18n="portal.taApplicationDetail.responsibilities">Responsibilities</h3>
                    <div class="job-modal-box">
                        <p id="job-modal-description">—</p>
                    </div>
                </section>
                <section class="job-modal-section" aria-labelledby="modal-skills-title">
                    <h3 id="modal-skills-title" class="job-modal-section-title" data-i18n="portal.taJobDetail.requiredSkills">Required skills</h3>
                    <div class="job-modal-box">
                        <div id="job-modal-skills" class="skills-chips"></div>
                    </div>
                </section>
            </div>
        </div>
    </div>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
    </script>
    <script src="<%= contextPath %>/js/common/i18n.js" defer></script>
    <script src="<%= contextPath %>/js/common/portal-i18n.js" defer></script>
    <script src="<%= contextPath %>/js/ta/ta-application-detail.js" defer></script>
</body>
</html>
