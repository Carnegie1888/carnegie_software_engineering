<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
    String userId = "";
    Object userIdObj = session.getAttribute("userId");
    if (userIdObj != null) {
        userId = userIdObj.toString();
    }
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Applicant Selection - TA Hiring System</title>
    <link rel="stylesheet" href="<%= contextPath %>/css/mo-applicant-selection.css">
</head>
<body>
    <main class="review-page">
        <section class="review-hero" aria-labelledby="review-title">
            <div class="hero-actions">
                <a class="nav-link" href="<%= contextPath %>/jsp/mo/dashboard.jsp">Back to posting page</a>
                <a class="logout-link" href="<%= contextPath %>/logout">Log out</a>
            </div>
            <span class="review-badge">MO Workspace</span>
            <h1 id="review-title">Select applicants for your TA positions</h1>
            <p class="subtitle">Choose one of your jobs, review candidate details, and mark each pending application as accepted or rejected.</p>
        </section>

        <section class="review-layout">
            <aside class="side-card" aria-label="职位选择与统计">
                <div class="section-heading">
                    <div>
                        <p class="side-card-label">Step 1</p>
                        <h2>Select a job</h2>
                    </div>
                </div>

                <div class="field">
                    <label for="job-select">Your postings</label>
                    <select id="job-select" name="jobId">
                        <option value="">Loading jobs...</option>
                    </select>
                </div>

                <div class="field">
                    <label for="status-filter">Application status filter</label>
                    <select id="status-filter" name="statusFilter">
                        <option value="">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                </div>

                <div class="side-actions">
                    <button id="refresh-jobs-btn" class="ghost-btn" type="button">Refresh jobs</button>
                    <button id="refresh-applications-btn" class="inline-btn" type="button">Refresh applications</button>
                </div>

                <section class="summary-grid" aria-label="申请统计">
                    <article class="summary-card">
                        <p>Total</p>
                        <strong id="summary-total">0</strong>
                    </article>
                    <article class="summary-card pending">
                        <p>Pending</p>
                        <strong id="summary-pending">0</strong>
                    </article>
                    <article class="summary-card accepted">
                        <p>Accepted</p>
                        <strong id="summary-accepted">0</strong>
                    </article>
                    <article class="summary-card rejected">
                        <p>Rejected</p>
                        <strong id="summary-rejected">0</strong>
                    </article>
                    <article class="summary-card withdrawn">
                        <p>Withdrawn</p>
                        <strong id="summary-withdrawn">0</strong>
                    </article>
                </section>
            </aside>

            <section class="review-card" aria-label="申请人列表">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">Step 2</p>
                        <h2>Review applicants</h2>
                        <p class="section-copy">Accept or reject pending applications. Processed records remain visible for tracking.</p>
                    </div>
                </div>

                <div id="review-message" class="form-message hidden" role="status" aria-live="polite"></div>
                <p id="list-summary" class="list-summary">Loading applications...</p>
                <div id="applications-list" class="applications-list" aria-live="polite"></div>
            </section>
        </section>
    </main>

    <script>
        window.APP_CONTEXT_PATH = "<%= contextPath %>";
        window.APP_CURRENT_USER_ID = "<%= userId %>";
    </script>
    <script src="<%= contextPath %>/js/mo-applicant-selection.js" defer></script>
</body>
</html>
