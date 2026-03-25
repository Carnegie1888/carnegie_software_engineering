(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";

    var searchForm = document.getElementById("selection-search-form");
    var searchInput = document.getElementById("selection-search-input");
    var searchButton = document.getElementById("selection-search-btn");
    var messageNode = document.getElementById("selection-message");
    var listSummaryNode = document.getElementById("selection-list-summary");
    var listNode = document.getElementById("applications-list");

    var summaryNodes = {
        total: document.getElementById("summary-total"),
        pending: document.getElementById("summary-pending"),
        accepted: document.getElementById("summary-accepted"),
        rejected: document.getElementById("summary-rejected")
    };

    if (!searchForm || !searchInput || !listSummaryNode || !listNode) {
        return;
    }

    var state = {
        loading: false,
        reviewingId: "",
        applications: [],
        applicantDetailsByApplicationId: {},
        approximateOnly: false
    };

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loadApplications();
    });

    loadApplications();

    function loadApplications() {
        if (state.loading) {
            return Promise.resolve();
        }

        setLoading(true);
        state.approximateOnly = false;
        hideMessage();
        listSummaryNode.textContent = t("portal.moApplicantSelection.loadingApplications", "Loading applications...");
        listNode.innerHTML = "";
        state.applicantDetailsByApplicationId = {};

        var url = buildApplyUrl();

        return request(url, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    state.applications = [];
                    renderSummary([]);
                    renderList([]);
                    return;
                }

                if (response.status === 403) {
                    showMessage(t("portal.dynamic.moOnlyPage", "This page is available for MO accounts only."), "error");
                    state.applications = [];
                    renderSummary([]);
                    renderList([]);
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = t("portal.dynamic.unableLoadApplicationsNow", "Unable to load applications right now.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    state.applications = [];
                    renderSummary([]);
                    renderList([]);
                    return;
                }

                state.applications = getPayloadDataArray(payload, "applications");
                state.approximateOnly = !!getPayloadDataObject(payload).approximateOnly;
                return loadApplicantDetails(state.applications)
                    .then(function () {
                        renderSummary(state.applications);
                        renderList(state.applications);
                    });
            })
            .catch(function () {
                showMessage(t("portal.dynamic.networkErrorTryAgain", "Network error. Please try again."), "error");
                state.applications = [];
                renderSummary([]);
                renderList([]);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    function loadApplicantDetails(applications) {
        if (!Array.isArray(applications) || applications.length === 0) {
            return Promise.resolve();
        }

        var detailRequests = applications.map(function (application) {
            var applicationId = safeText(application.applicationId, "");
            if (!applicationId) {
                return Promise.resolve();
            }

            return request(contextPath + "/api/applicants/detail?applicationId=" + encodeURIComponent(applicationId), {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            }).then(function (result) {
                var response = result.response;
                var payload = result.payload;
                if (!response.ok || !payload || payload.success !== true) {
                    return;
                }
                state.applicantDetailsByApplicationId[applicationId] = getPayloadDataObject(payload);
            }).catch(function () {
                // keep partial rendering, detail can fail independently
            });
        });

        return Promise.all(detailRequests);
    }

    function buildApplyUrl() {
        var keyword = searchInput.value.trim();
        if (!keyword) {
            return contextPath + "/apply";
        }
        return contextPath + "/apply?keyword=" + encodeURIComponent(keyword);
    }

    function renderSummary(applications) {
        var counts = {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0
        };

        if (Array.isArray(applications)) {
            counts.total = applications.length;
            applications.forEach(function (application) {
                var status = safeText(application.status, "PENDING").toUpperCase();
                if (status === "PENDING") {
                    counts.pending += 1;
                } else if (status === "ACCEPTED") {
                    counts.accepted += 1;
                } else if (status === "REJECTED") {
                    counts.rejected += 1;
                }
            });
        }

        summaryNodes.total.textContent = String(counts.total);
        summaryNodes.pending.textContent = String(counts.pending);
        summaryNodes.accepted.textContent = String(counts.accepted);
        summaryNodes.rejected.textContent = String(counts.rejected);
    }

    function renderList(applications) {
        listNode.innerHTML = "";
        var keyword = searchInput.value.trim();
        if (!Array.isArray(applications) || applications.length === 0) {
            var isSearching = !!keyword;
            listSummaryNode.textContent = isSearching
                ? t("portal.dynamic.noApplicationsForSearch", "No applications match your keyword.")
                : t("portal.dynamic.noApplicationsForPostedJobs", "No applications submitted for your jobs yet.");
            listNode.appendChild(createEmptyState(isSearching));
            return;
        }

        listSummaryNode.textContent = buildSummaryText(applications.length, t("portal.dynamic.applicationUnit", "application"));
        if (state.approximateOnly && keyword) {
            showMessage(t("portal.dynamic.closestMatchesNotice", "No exact matches. Showing closest results."), "success");
        } else {
            hideMessage();
        }
        applications.forEach(function (application) {
            listNode.appendChild(createApplicationCard(application, state.applicantDetailsByApplicationId[safeText(application.applicationId, "")]));
        });
    }

    function createApplicationCard(application, detail) {
        var card = document.createElement("article");
        card.className = "application-card";

        var applicationId = safeText(application.applicationId, "");
        var status = safeText(application.status, "PENDING").toUpperCase();
        var progressStage = safeText(application.progressStage, "SUBMITTED").toUpperCase();
        var statusClass = getStatusClass(status);
        var reviewingThis = state.reviewingId && state.reviewingId === applicationId;
        var coverLetter = safeText(application.coverLetter, "");
        var coverLetterText = coverLetter ? shortenText(coverLetter, 180) : "No cover letter provided.";

        card.innerHTML =
            "<header class=\"application-header\">" +
                "<div class=\"application-heading\">" +
                    "<h3>" + escapeHtml(safeText(application.applicantName, "Unknown applicant")) + "</h3>" +
                    "<p>" + escapeHtml(safeText(application.applicantEmail, "-")) + "</p>" +
                "</div>" +
                "<span class=\"status-pill status-" + escapeHtml(statusClass) + "\">" + escapeHtml(status) + "</span>" +
            "</header>" +
            "<div class=\"application-meta\">" +
                "<p><span>Job</span><strong>" + escapeHtml(safeText(application.jobTitle, "Untitled position")) + "</strong></p>" +
                "<p><span>Course</span><strong>" + escapeHtml(safeText(application.courseCode, "-")) + "</strong></p>" +
                "<p><span>Applied at</span><strong>" + escapeHtml(formatDateTime(application.appliedAt)) + "</strong></p>" +
                "<p><span>Progress</span><strong>" + escapeHtml(progressStage) + "</strong></p>" +
            "</div>" +
            buildDetailBlock(detail, applicationId) +
            "<div class=\"cover-letter-block\">" +
                "<p class=\"cover-letter-label\">Cover letter</p>" +
                "<p class=\"cover-letter-content\">" + escapeHtml(coverLetterText) + "</p>" +
            "</div>" +
            buildReviewActionsHtml(status, progressStage, applicationId, reviewingThis);

        if (status === "PENDING" && applicationId) {
            card.querySelectorAll("button[data-action]").forEach(function (btn) {
                var action = btn.getAttribute("data-action");
                btn.addEventListener("click", function () {
                    if (action === "start_review" || action === "schedule_interview") {
                        handleProgressAction(applicationId, action);
                    } else if (action === "accept" || action === "reject") {
                        handleReview(applicationId, action);
                    }
                });
            });
        }

        return card;
    }

    function buildReviewActionsHtml(status, progressStage, applicationId, reviewingThis) {
        if (status !== "PENDING") {
            return "<div class=\"review-actions\"><p class=\"review-note\">This application has already been reviewed.</p></div>";
        }
        var dis = reviewingThis ? " disabled" : "";
        var proc = reviewingThis ? "Processing..." : "";
        var startLabel = reviewingThis ? proc : "Start review";
        var schedLabel = reviewingThis ? proc : "Schedule interview";
        var acceptLabel = reviewingThis ? proc : "Accept";
        var rejectLabel = reviewingThis ? proc : "Reject";

        var row = "<div class=\"review-actions review-actions--staged\">";
        if (progressStage === "SUBMITTED") {
            row += "<button class=\"stage-btn\" type=\"button\" data-action=\"start_review\" data-id=\"" +
                escapeHtml(applicationId) + "\"" + dis + ">" + escapeHtml(startLabel) + "</button>";
        } else if (progressStage === "UNDER_REVIEW") {
            row += "<button class=\"stage-btn\" type=\"button\" data-action=\"schedule_interview\" data-id=\"" +
                escapeHtml(applicationId) + "\"" + dis + ">" + escapeHtml(schedLabel) + "</button>";
        }
        row += "<button class=\"accept-btn\" type=\"button\" data-action=\"accept\" data-id=\"" +
            escapeHtml(applicationId) + "\"" + dis + ">" + escapeHtml(acceptLabel) + "</button>" +
            "<button class=\"reject-btn\" type=\"button\" data-action=\"reject\" data-id=\"" +
            escapeHtml(applicationId) + "\"" + dis + ">" + escapeHtml(rejectLabel) + "</button>" +
            "</div>";
        return row;
    }

    function handleProgressAction(applicationId, action) {
        if (!applicationId || !action || state.reviewingId) {
            return;
        }

        state.reviewingId = applicationId;
        renderList(state.applications);
        hideMessage();

        request(contextPath + "/apply?id=" + encodeURIComponent(applicationId) + "&action=" + encodeURIComponent(action), {
            method: "PUT",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return false;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to update progress.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return false;
                }

                showMessage(action === "start_review" ? "Review started." : "Interview scheduled.", "success");
                return true;
            })
            .then(function (shouldReload) {
                if (shouldReload) {
                    return loadApplications();
                }
                return null;
            })
            .catch(function () {
                showMessage("Network error while updating progress.", "error");
            })
            .finally(function () {
                state.reviewingId = "";
                renderList(state.applications);
            });
    }

    function buildDetailBlock(detail, applicationId) {
        if (!detail) {
            return "<section class=\"applicant-detail-block\">" +
                "<p class=\"detail-title\">Applicant profile</p>" +
                "<p class=\"detail-empty\">Applicant profile details are temporarily unavailable.</p>" +
            "</section>";
        }

        var skills = Array.isArray(detail.skills) ? detail.skills : [];
        var skillsMarkup = skills.length
            ? skills.map(function (skill) {
                return "<span class=\"detail-chip\">" + escapeHtml(safeText(skill, "")) + "</span>";
            }).join("")
            : "<span class=\"detail-chip muted\">No skills listed</span>";

        var resumeAction = detail.hasResume
            ? "<a class=\"inline-link\" href=\"" + contextPath + "/api/applicants/resume?applicationId=" + encodeURIComponent(applicationId) + "\" target=\"_blank\" rel=\"noopener\">View resume</a>"
            : "<span class=\"detail-muted\">Resume not uploaded</span>";

        return "<section class=\"applicant-detail-block\">" +
            "<p class=\"detail-title\">Applicant profile</p>" +
            "<div class=\"detail-grid\">" +
                buildDetailItem("Department", detail.department) +
                buildDetailItem("Program", detail.program) +
                buildDetailItem("GPA", detail.gpa) +
                buildDetailItem("Phone", detail.phone) +
            "</div>" +
            "<div class=\"detail-section\">" +
                "<p class=\"detail-label\">Skills</p>" +
                "<div class=\"detail-chips\">" + skillsMarkup + "</div>" +
            "</div>" +
            "<div class=\"detail-section\">" +
                "<p class=\"detail-label\">Experience</p>" +
                "<p class=\"detail-copy\">" + escapeHtml(safeText(detail.experience, "No experience provided.")) + "</p>" +
            "</div>" +
            "<div class=\"detail-section\">" +
                "<p class=\"detail-label\">Motivation</p>" +
                "<p class=\"detail-copy\">" + escapeHtml(safeText(detail.motivation, "No motivation statement provided.")) + "</p>" +
            "</div>" +
            "<div class=\"detail-section detail-actions\">" +
                "<p class=\"detail-label\">Resume</p>" +
                resumeAction +
            "</div>" +
        "</section>";
    }

    function buildDetailItem(label, value) {
        return "<div class=\"detail-item\">" +
            "<span>" + escapeHtml(label) + "</span>" +
            "<strong>" + escapeHtml(safeText(value, "-")) + "</strong>" +
        "</div>";
    }

    function handleReview(applicationId, action) {
        if (!applicationId || !action || state.reviewingId) {
            return;
        }

        state.reviewingId = applicationId;
        renderList(state.applications);
        hideMessage();

        request(contextPath + "/apply?id=" + encodeURIComponent(applicationId) + "&action=" + encodeURIComponent(action), {
            method: "PUT",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return false;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to update this application.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return false;
                }

                showMessage(action === "accept" ? "Application accepted successfully." : "Application rejected successfully.", "success");
                return true;
            })
            .then(function (shouldReload) {
                if (shouldReload) {
                    return loadApplications();
                }
                return null;
            })
            .catch(function () {
                showMessage("Network error while updating application.", "error");
            })
            .finally(function () {
                state.reviewingId = "";
                renderList(state.applications);
            });
    }

    function createEmptyState(isSearching) {
        var empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML =
            "<p class=\"empty-title\">" + escapeHtml(isSearching
                ? t("portal.dynamic.noMatchingApplicationsTitle", "No matching applications")
                : t("portal.dynamic.noApplicationsYetTitle", "No applications yet")) + "</p>" +
            "<p class=\"empty-copy\">" +
                escapeHtml(isSearching
                    ? t("portal.dynamic.tryAnotherKeyword", "Try another keyword.")
                    : t("portal.dynamic.noApplicationsForPostedJobsHint", "Once TAs apply for your posted jobs, applicant cards will appear here.")) +
            "</p>";
        return empty;
    }

    function setLoading(loading) {
        state.loading = loading;
        if (searchButton) {
            searchButton.disabled = loading;
            searchButton.textContent = loading
                ? t("portal.dynamic.searching", "Searching...")
                : t("portal.common.search", "Search");
        }
    }

    function getStatusClass(status) {
        if (status === "PENDING") {
            return "pending";
        }
        if (status === "ACCEPTED") {
            return "accepted";
        }
        if (status === "REJECTED") {
            return "rejected";
        }
        if (status === "WITHDRAWN") {
            return "withdrawn";
        }
        return "unknown";
    }

    function showMessage(message, type) {
        if (!messageNode) {
            return;
        }
        messageNode.textContent = message;
        messageNode.classList.remove("hidden", "error", "success");
        messageNode.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        if (!messageNode) {
            return;
        }
        messageNode.textContent = "";
        messageNode.classList.remove("error", "success");
        messageNode.classList.add("hidden");
    }

    function handleUnauthorized() {
        showMessage(t("portal.dynamic.sessionExpiredRedirect", "Session expired. Redirecting to login..."), "error");
        window.setTimeout(function () {
            window.location.href = contextPath + "/login.jsp";
        }, 900);
    }

    function request(url, options) {
        return fetch(url, options).then(function (response) {
            return response.text().then(function (text) {
                return {
                    response: response,
                    payload: parseJson(text)
                };
            });
        });
    }

    function parseJson(text) {
        return JSON.parse(text);
    }

    function getPayloadDataArray(payload, key) {
        if (!payload || typeof payload !== "object") {
            return [];
        }
        if (payload.data && Array.isArray(payload.data[key])) {
            return payload.data[key];
        }
        if (Array.isArray(payload[key])) {
            return payload[key];
        }
        return [];
    }

    function getPayloadDataObject(payload) {
        if (!payload || typeof payload !== "object") {
            return {};
        }
        if (payload.data && typeof payload.data === "object") {
            return payload.data;
        }
        return payload;
    }

    function buildSummaryText(count, singularUnit) {
        var unit = singularUnit;
        if (useEnglishPluralSuffix() && count !== 1) {
            unit += "s";
        }
        return t("portal.dynamic.showing", "Showing") + " " + count + " " + unit + ".";
    }

    function useEnglishPluralSuffix() {
        if (window.AppI18n && typeof window.AppI18n.getLocale === "function") {
            return window.AppI18n.getLocale() === "en";
        }
        return true;
    }

    function t(key, fallback) {
        if (window.AppI18n && typeof window.AppI18n.t === "function") {
            return window.AppI18n.t(key, fallback || key);
        }
        return fallback || key;
    }

    function safeText(value, fallback) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
        if (typeof value === "number") {
            return String(value);
        }
        return typeof fallback === "string" ? fallback : "";
    }

    function formatDateTime(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "-";
        }
        var date = new Date(value);
        if (isNaN(date.getTime())) {
            return value;
        }
        return date.getFullYear() + "-" +
            pad2(date.getMonth() + 1) + "-" +
            pad2(date.getDate()) + " " +
            pad2(date.getHours()) + ":" +
            pad2(date.getMinutes());
    }

    function shortenText(value, maxLength) {
        if (typeof value !== "string" || !value.trim()) {
            return "";
        }
        var trimmed = value.trim();
        if (trimmed.length <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength - 1) + "…";
    }

    function pad2(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function escapeHtml(value) {
        if (typeof value !== "string") {
            return "";
        }
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
