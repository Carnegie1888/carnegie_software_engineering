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
    <title data-i18n="portal.page.moDashboard.title">MO Dashboard - Post TA Jobs</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/mo/mo-dashboard.css">
</head>
<body>
    <div class="portal-shell portal-shell-mo">
        <aside class="portal-sidebar" data-i18n-aria-label="portal.nav.mo.aria">
            <p class="portal-brand" data-i18n="portal.brand.mo">MO Portal</p>
            <nav class="portal-nav">
                <a class="portal-nav-link" href="<%= contextPath %>/jsp/mo/applicant-selection.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M7 18c.2-2.6 2.4-4.5 5-4.5s4.8 1.9 5 4.5"></path>
                        <circle cx="12" cy="8.5" r="3"></circle>
                        <path d="M3.5 18c.1-1.6 1.3-2.8 2.9-3.1"></path>
                        <path d="M20.5 18c-.1-1.6-1.3-2.8-2.9-3.1"></path>
                    </svg>
                    <span data-i18n="portal.nav.mo.applicants">Applicants</span>
                </a>
                <a class="portal-nav-link is-active" href="<%= contextPath %>/jsp/mo/dashboard.jsp">
                    <svg class="portal-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    <span data-i18n="portal.nav.mo.postJob">Post Job</span>
                </a>
            </nav>
        </aside>

        <section class="portal-main">
            <header class="portal-topbar">
                <div class="portal-topbar-menu">
                    <span class="portal-topbar-role" data-i18n="portal.brand.mo">MO Portal</span>
                    <span class="portal-topbar-divider" aria-hidden="true"></span>
                    <span class="portal-topbar-page" data-i18n="portal.moDashboard.title">Post New Job</span>
                </div>
                <div class="portal-topbar-right">
                    <div class="portal-user">
                        <span class="portal-user-avatar"><%= username != null && !username.isEmpty() ? username.substring(0, 1).toUpperCase() : "M" %></span>
                        <span class="portal-user-name"><%= username == null || username.isEmpty() ? "MO User" : username %></span>
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
                <main class="mo-page">
                    <section class="mo-hero" aria-labelledby="mo-page-title">
                        <h1 id="mo-page-title" class="portal-page-title" data-i18n="portal.moDashboard.title">Post New Job</h1>
                        <p class="subtitle">Create a new TA position listing for your course.</p>
                    </section>

                    <!-- Tab Navigation -->
                    <div class="mo-tabs" role="tablist">
                        <button class="mo-tab is-active" role="tab" aria-selected="true" data-tab="my-jobs" id="tab-my-jobs" aria-controls="panel-my-jobs">
                            <span data-i18n="portal.moDashboard.myJobs">My Postings</span>
                        </button>
                        <button class="mo-tab" role="tab" aria-selected="false" data-tab="post-job" id="tab-post-job" aria-controls="panel-post-job">
                            <span data-i18n="portal.moDashboard.postNew">Post New Job</span>
                        </button>
                    </div>

                    <!-- My Jobs Tab Panel -->
                    <div class="mo-tab-panel is-active" id="panel-my-jobs" role="tabpanel" aria-labelledby="tab-my-jobs">
                        <section class="mo-card" aria-label="我的岗位列表">
                            <div class="section-heading">
                                <div>
                                    <p class="eyebrow">Manage</p>
                                    <h2 data-i18n="portal.moDashboard.myJobs">My Postings</h2>
                                    <p class="section-copy" data-i18n="portal.moDashboard.myJobsDesc">View and manage your job postings.</p>
                                </div>
                            </div>

                            <div id="jobs-list-message" class="form-message hidden" role="status" aria-live="polite"></div>

                            <div id="jobs-list-container" class="job-list-container">
                                <!-- Jobs list will be loaded here -->
                                <div class="jobs-loading" id="jobs-loading">
                                    <span data-i18n="portal.common.loading">Loading...</span>
                                </div>
                                <div class="job-list hidden" id="job-list" role="list"></div>
                                <div class="empty-state hidden" id="jobs-empty">
                                    <p class="empty-title" data-i18n="portal.moDashboard.noJobsTitle">No job postings yet</p>
                                    <p class="empty-copy" data-i18n="portal.moDashboard.noJobsDesc">Click "Post New Job" to create your first TA position listing.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Post New Job Tab Panel -->
                    <div class="mo-tab-panel" id="panel-post-job" role="tabpanel" aria-labelledby="tab-post-job" hidden>
                        <section class="mo-card" aria-label="发布职位表单">
                            <div class="section-heading">
                                <div>
                                    <p class="eyebrow">Create posting</p>
                                    <h2>Post a new TA position</h2>
                                    <p class="section-copy" data-i18n="portal.moDashboard.requiredLead">Fields labeled Required are required for publishing.</p>
                                </div>
                            </div>

                            <div id="form-message" class="form-message hidden" role="status" aria-live="polite"></div>

                            <form id="job-create-form" class="mo-form" novalidate>
                                <div class="field-grid">
                                    <div class="field field-full">
                                        <div class="field-label-row">
                                            <label for="job-title" data-i18n="portal.moDashboard.jobTitle">Job title</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="job-title" name="title" type="text" maxlength="200" placeholder="e.g. Teaching Assistant - Data Structures" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="course-code" data-i18n="portal.common.courseCode">Course code</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="course-code" name="courseCode" type="text" maxlength="50" placeholder="e.g. EBU6304" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="course-name">Course name</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="course-name" name="courseName" type="text" maxlength="120" placeholder="e.g. Software Engineering" required>
                                    </div>

                                    <div class="field field-full">
                                        <div class="field-label-row">
                                            <label for="description">Description</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <textarea id="description" name="description" rows="5" maxlength="4000" placeholder="Describe responsibilities, expectations, and any course-specific requirements." required></textarea>
                                    </div>

                                    <div class="field field-full">
                                        <div class="field-label-row">
                                            <label for="required-skills">Required skills</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="required-skills" name="requiredSkills" type="text" maxlength="500" placeholder="Separate skills with commas, e.g. Java, SQL, communication" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="positions" data-i18n="portal.common.positions">Positions</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="positions" name="positions" type="number" min="1" max="200" value="1" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="deadline">Application deadline</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="deadline" name="deadline" type="datetime-local" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="workload">Workload</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="workload" name="workload" type="text" maxlength="120" placeholder="e.g. 8 hours / week" required>
                                    </div>

                                    <div class="field">
                                        <div class="field-label-row">
                                            <label for="salary">Salary</label>
                                            <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                        </div>
                                        <input id="salary" name="salary" type="text" maxlength="120" placeholder="e.g. 25 SGD / hour" required>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button id="publish-btn" class="primary-btn" type="submit">Publish job</button>
                                    <button id="reset-btn" class="ghost-btn" type="reset">Reset form</button>
                                </div>
                            </form>
                        </section>
                    </div>
                    <!-- End of Tab Panels -->

                <!-- Edit Job Modal -->
                    <div class="modal-overlay hidden" id="edit-job-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
                        <div class="modal-container">
                            <div class="modal-header">
                                <h2 id="edit-modal-title" data-i18n="portal.moDashboard.editJob">Edit Job</h2>
                                <button class="modal-close" id="edit-modal-close" aria-label="Close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div id="edit-form-message" class="form-message hidden" role="status" aria-live="polite"></div>
                                <form id="job-edit-form" class="mo-form" novalidate>
                                    <input type="hidden" id="edit-job-id" name="jobId">

                                    <div class="field-grid">
                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="edit-job-title" data-i18n="portal.moDashboard.jobTitle">Job title</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-job-title" name="title" type="text" maxlength="200" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-course-code" data-i18n="portal.common.courseCode">Course code</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-course-code" name="courseCode" type="text" maxlength="50" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-course-name">Course name</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-course-name" name="courseName" type="text" maxlength="120" required>
                                        </div>

                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="edit-description">Description</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <textarea id="edit-description" name="description" rows="5" maxlength="4000" required></textarea>
                                        </div>

                                        <div class="field field-full">
                                            <div class="field-label-row">
                                                <label for="edit-required-skills">Required skills</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-required-skills" name="requiredSkills" type="text" maxlength="500" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-positions" data-i18n="portal.common.positions">Positions</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-positions" name="positions" type="number" min="1" max="200" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-deadline">Application deadline</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-deadline" name="deadline" type="datetime-local" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-workload">Workload</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-workload" name="workload" type="text" maxlength="120" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-salary">Salary</label>
                                                <span class="field-tag" data-i18n="portal.moDashboard.required">Required</span>
                                            </div>
                                            <input id="edit-salary" name="salary" type="text" maxlength="120" required>
                                        </div>

                                        <div class="field">
                                            <div class="field-label-row">
                                                <label for="edit-status">Status</label>
                                            </div>
                                            <select id="edit-status" name="status">
                                                <option value="OPEN">Open</option>
                                                <option value="CLOSED">Closed</option>
                                                <option value="FILLED">Filled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="form-actions">
                                        <button id="edit-save-btn" class="primary-btn" type="submit" data-i18n="portal.action.save">Save Changes</button>
                                        <button id="edit-cancel-btn" class="ghost-btn" type="button" data-i18n="portal.action.cancel">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Delete Confirmation Modal -->
                    <div class="modal-overlay hidden" id="delete-job-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                        <div class="modal-container modal-small">
                            <div class="modal-header">
                                <h2 id="delete-modal-title" data-i18n="portal.moDashboard.confirmDelete">Confirm Delete</h2>
                                <button class="modal-close" id="delete-modal-close" aria-label="Close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <p id="delete-message" data-i18n="portal.moDashboard.deleteConfirmMsg">Are you sure you want to delete this job posting?</p>
                                <p class="delete-job-title" id="delete-job-title"></p>
                                <div class="form-actions">
                                    <button id="delete-confirm-btn" class="danger-btn" type="button" data-i18n="portal.action.delete">Delete</button>
                                    <button id="delete-cancel-btn" class="ghost-btn" type="button" data-i18n="portal.action.cancel">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>

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
    <script src="<%= contextPath %>/js/mo/mo-dashboard.js" defer></script>
</body>
</html>
