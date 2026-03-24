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
    <title data-i18n="portal.page.taDashboard.title">TA Profile Setup - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/ta-dashboard.css">
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
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/ta/application-status.jsp">
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
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/ta/dashboard.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="8" r="3"></circle>
                        <path d="M6 18c1.2-2 3.2-3 6-3s4.8 1 6 3"></path>
                    </svg>
                    <span data-i18n="portal.nav.ta.profile">Profile</span>
                </a>
            </nav>
            <div class="portal-sidebar-bottom">
                <a class="portal-nav-link" href="<%= contextPath %>/login.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M4 7h12"></path>
                        <path d="m12 4 4 3-4 3"></path>
                        <path d="M20 17H8"></path>
                        <path d="m12 20-4-3 4-3"></path>
                    </svg>
                    <span data-i18n="portal.action.switchRoles">Switch Roles</span>
                </a>
            </div>
        </aside>

        <section class="portal-main">
            <header class="portal-topbar">
                <div class="portal-topbar-menu">
                    <span class="portal-topbar-role" data-i18n="portal.brand.ta">TA Portal</span>
                    <span class="portal-topbar-divider" aria-hidden="true"></span>
                    <span class="portal-topbar-page" data-i18n="portal.nav.ta.profile">Profile</span>
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
                <main class="profile-page">
                    <section class="profile-hero" aria-labelledby="profile-page-title">
                        <h1 id="profile-page-title" class="portal-page-title" data-i18n="portal.nav.ta.profile">Profile</h1>
                        <p class="subtitle">Manage your personal information and academic background.</p>
                    </section>

                    <section class="profile-layout" aria-label="TA applicant profile setup">
                        <section class="profile-card">
                            <div class="section-heading">
                                <h2 data-i18n="portal.taDashboard.createProfileTitle">Create your TA profile</h2>
                            </div>

                            <div id="form-message" class="form-message hidden" role="alert" aria-live="polite"></div>
                            <div id="existing-profile-banner" class="profile-banner hidden" role="status" aria-live="polite"></div>

                            <form id="ta-profile-form" class="profile-form" method="post" action="<%= contextPath %>/applicant" novalidate>
                                <section class="form-section" aria-labelledby="section-basic-info">
                                    <div class="form-section-header">
                                        <h3 id="section-basic-info" data-i18n="portal.taDashboard.basicDetails">Basic details</h3>
                                    </div>

                                    <div class="field-grid">
                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="full-name" data-i18n="portal.taDashboard.fullName">Full name</label>
                                                <span class="field-tag" data-i18n="portal.taDashboard.required">Required</span>
                                            </div>
                                            <input
                                                id="full-name"
                                                name="fullName"
                                                type="text"
                                                placeholder="Your full name"
                                                autocomplete="name"
                                                maxlength="100"
                                                required
                                            >
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="student-id" data-i18n="portal.taDashboard.studentId">Student ID</label>
                                                <span class="field-tag" data-i18n="portal.taDashboard.required">Required</span>
                                            </div>
                                            <input
                                                id="student-id"
                                                name="studentId"
                                                type="text"
                                                placeholder="e.g. 2023213039"
                                                inputmode="numeric"
                                                maxlength="10"
                                                required
                                            >
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="department" data-i18n="portal.taDashboard.department">Department</label>
                                                <span class="field-tag" data-i18n="portal.taDashboard.required">Required</span>
                                            </div>
                                            <input
                                                id="department"
                                                name="department"
                                                type="text"
                                                placeholder="School or department"
                                                maxlength="100"
                                                required
                                            >
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="program" data-i18n="portal.taDashboard.program">Program</label>
                                                <span class="field-tag" data-i18n="portal.taDashboard.required">Required</span>
                                            </div>
                                            <select id="program" name="program" required>
                                                <option value="" data-i18n="portal.taDashboard.selectProgram">Select your program</option>
                                                <option value="Undergraduate" data-i18n="portal.taDashboard.programUndergraduate">Undergraduate</option>
                                                <option value="Master" data-i18n="portal.taDashboard.programMaster">Master</option>
                                                <option value="PhD" data-i18n="portal.taDashboard.programPhd">PhD</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section class="form-section" aria-labelledby="section-additional-info">
                                    <div class="form-section-header">
                                        <h3 id="section-additional-info" data-i18n="portal.taDashboard.additionalInfo">Additional information</h3>
                                    </div>

                                    <div class="field-grid">
                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="gpa" data-i18n="portal.taDashboard.gpa">GPA</label>
                                            </div>
                                            <input
                                                id="gpa"
                                                name="gpa"
                                                type="text"
                                                placeholder="e.g. 3.85 / 4.00"
                                                inputmode="decimal"
                                                maxlength="20"
                                            >
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="phone" data-i18n="portal.taDashboard.phone">Phone number</label>
                                            </div>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="+86 138 0000 0000"
                                                autocomplete="tel"
                                                maxlength="30"
                                            >
                                        </div>

                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="skills" data-i18n="portal.taDashboard.skills">Skills</label>
                                            </div>
                                            <input
                                                id="skills"
                                                name="skills"
                                                type="text"
                                                placeholder="Separate skills with commas, for example Java, JSP, SQL"
                                                maxlength="300"
                                            >
                                            <p class="field-hint" data-i18n="portal.taDashboard.skillsHint">Use commas to separate each skill. The current backend stores your skills as a list.</p>
                                        </div>

                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="experience" data-i18n="portal.taDashboard.experience">Related experience</label>
                                            </div>
                                            <textarea
                                                id="experience"
                                                name="experience"
                                                rows="5"
                                                maxlength="1200"
                                                placeholder="Describe tutoring, teaching, grading, or project experience relevant to a TA role."
                                            ></textarea>
                                        </div>

                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="motivation" data-i18n="portal.taDashboard.motivation">Motivation</label>
                                            </div>
                                            <textarea
                                                id="motivation"
                                                name="motivation"
                                                rows="5"
                                                maxlength="1200"
                                                placeholder="Explain why you want this TA opportunity and what value you can bring."
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                <div class="form-actions">
                                    <button id="profile-submit" class="profile-submit-btn" type="submit" data-i18n="portal.taDashboard.saveChangesButton">
                                        Save changes
                                    </button>
                                    <button id="profile-edit-btn" class="ghost-btn" type="button" hidden data-i18n="portal.taDashboard.editProfileButton">Edit profile</button>
                                    <button id="profile-cancel-btn" class="ghost-btn" type="button" hidden data-i18n="portal.taDashboard.cancelButton">Cancel</button>
                                </div>
                            </form>

                            <div class="profile-card-divider" aria-hidden="true"></div>

                            <section class="upload-card" aria-labelledby="resume-upload-title">
                                <h3 id="resume-upload-title" data-i18n="portal.taDashboard.resumeUploadTitle">Resume upload</h3>
                                <p class="side-card-copy" data-i18n="portal.taDashboard.resumeUploadLead">Upload your resume in PDF, DOC, or DOCX format. Maximum size is 10MB.</p>

                                <div class="upload-file-panel">
                                    <label class="upload-file-label" for="resume-file-input" data-i18n="portal.taDashboard.chooseFile">Choose file</label>
                                    <input
                                        id="resume-file-input"
                                        class="upload-file-input"
                                        type="file"
                                        name="resume"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    >
                                    <p id="resume-file-name" class="upload-file-name">No file selected.</p>
                                </div>

                                <div id="resume-current-info" class="upload-current hidden" aria-live="polite"></div>

                                <div class="upload-progress-box hidden" id="resume-progress-wrap" aria-live="polite">
                                    <div class="upload-progress-meta">
                                        <span id="resume-progress-text">0%</span>
                                        <span id="resume-progress-status">Waiting to upload</span>
                                    </div>
                                    <div class="upload-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                                        <span id="resume-progress-bar" class="upload-progress-bar"></span>
                                    </div>
                                </div>

                                <div class="upload-hint-box">
                                    <div class="upload-hint-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" focusable="false">
                                            <path d="M12 3.75L16.5 8.25V18.75H7.5V5.25H12ZM12.75 4.81V8.25H16.19L12.75 4.81ZM9.75 12H14.25V13.5H9.75V12ZM9.75 15H14.25V16.5H9.75V15ZM9.75 9H11.25V10.5H9.75V9Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="upload-placeholder-title" data-i18n="portal.taDashboard.createProfileFirst">Create profile first</p>
                                        <p class="upload-placeholder-text" data-i18n="portal.taDashboard.resumeTip">If you choose a file before profile creation, it will upload automatically right after the profile is created.</p>
                                    </div>
                                </div>
                                <div id="resume-upload-message" class="upload-message hidden" role="status" aria-live="polite"></div>
                                <button id="resume-upload-btn" class="placeholder-button" type="button" disabled data-i18n="portal.taDashboard.uploadSelectedResume">Upload selected resume</button>
                            </section>
                        </section>
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
    <script src="<%= contextPath %>/js/ta-dashboard.js" defer></script>
</body>
</html>
