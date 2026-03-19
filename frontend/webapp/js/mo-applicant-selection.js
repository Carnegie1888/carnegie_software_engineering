(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var currentUserId = typeof window.APP_CURRENT_USER_ID === "string" ? window.APP_CURRENT_USER_ID.trim() : "";

    var jobSelect = document.getElementById("job-select");
    var statusFilter = document.getElementById("status-filter");
    var refreshJobsButton = document.getElementById("refresh-jobs-btn");
    var refreshApplicationsButton = document.getElementById("refresh-applications-btn");
    var messageNode = document.getElementById("review-message");
    var listSummaryNode = document.getElementById("list-summary");
    var listNode = document.getElementById("applications-list");

    var summaryNodes = {
        total: document.getElementById("summary-total"),
        pending: document.getElementById("summary-pending"),
        accepted: document.getElementById("summary-accepted"),
        rejected: document.getElementById("summary-rejected"),
        withdrawn: document.getElementById("summary-withdrawn")
    };

    if (!jobSelect || !listNode || !listSummaryNode) {
        return;
    }

    var state = {
        loadingJobs: false,
        loadingApplications: false,
        jobs: [],
        applications: [],
        actioningId: ""
    };

    jobSelect.addEventListener("change", function () {
        loadApplicationsForSelectedJob();
    });

    statusFilter.addEventListener("change", function () {
        render();
    });

    if (refreshJobsButton) {
        refreshJobsButton.addEventListener("click", function () {
            loadJobs();
        });
    }

    if (refreshApplicationsButton) {
        refreshApplicationsButton.addEventListener("click", function () {
            loadApplicationsForSelectedJob();
        });
    }

    initialize();

    function initialize() {
        if (!currentUserId) {
            showMessage("Unable to identify current MO account. Please login again.", "error");
            setJobSelectDisabled(true);
            return;
        }

        loadJobs();
    }

    function loadJobs() {
        if (state.loadingJobs) {
            return;
        }

        setLoadingJobs(true);
        hideMessage();

        request(contextPath + "/jobs?moId=" + encodeURIComponent(currentUserId), {
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
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to load your posted jobs.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    state.jobs = [];
                    renderJobSelect();
                    render();
                    return;
                }

                state.jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
                renderJobSelect();
                return loadApplicationsForSelectedJob();
            })
            .catch(function () {
                showMessage("Network error while loading jobs.", "error");
            })
            .finally(function () {
                setLoadingJobs(false);
            });
    }

    function renderJobSelect() {
        var previousSelection = jobSelect.value.trim();
        var preferredSelection = getInitialJobIdFromQuery() || previousSelection;

        jobSelect.innerHTML = "";

        if (!Array.isArray(state.jobs) || state.jobs.length === 0) {
            var emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = "No posted jobs available";
            jobSelect.appendChild(emptyOption);
            setJobSelectDisabled(true);
            state.applications = [];
            render();
            return;
        }

        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select a job";
        jobSelect.appendChild(placeholder);

        state.jobs.forEach(function (job) {
            var option = document.createElement("option");
            option.value = safeText(job.jobId, "");
            option.textContent = safeText(job.title, "Untitled") + " · " + safeText(job.courseCode, "-");
            jobSelect.appendChild(option);
        });

        if (preferredSelection && hasJob(preferredSelection)) {
            jobSelect.value = preferredSelection;
        } else {
            jobSelect.value = state.jobs.length > 0 ? safeText(state.jobs[0].jobId, "") : "";
        }

        setJobSelectDisabled(false);
    }

    function loadApplicationsForSelectedJob() {
        var selectedJobId = jobSelect.value.trim();
        if (!selectedJobId) {
            state.applications = [];
            render();
            return Promise.resolve();
        }

        if (state.loadingApplications) {
            return Promise.resolve();
        }

        setLoadingApplications(true);
        listSummaryNode.textContent = "Loading applications...";
        listNode.innerHTML = "";

        return request(contextPath + "/apply?jobId=" + encodeURIComponent(selectedJobId), {
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
                    return;
                }

                if (response.status === 403) {
                    showMessage("Only MO accounts can review applications here.", "error");
                    state.applications = [];
                    render();
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to load applications for the selected job.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    state.applications = [];
                    render();
                    return;
                }

                state.applications = Array.isArray(payload.applications) ? payload.applications : [];
                render();
            })
            .catch(function () {
                showMessage("Network error while loading applications.", "error");
                state.applications = [];
                render();
            })
            .finally(function () {
                setLoadingApplications(false);
            });
    }

    function render() {
        var filteredApplications = getFilteredApplications();
        renderSummary(state.applications);
        renderList(filteredApplications);
    }

    function getFilteredApplications() {
        var selectedStatus = statusFilter.value.trim().toUpperCase();
        return state.applications.filter(function (app) {
            var status = safeText(app.status, "PENDING").toUpperCase();
            if (!selectedStatus) {
                return true;
            }
            return status === selectedStatus;
        });
    }

    function renderSummary(applications) {
        var counts = {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0
        };

        if (Array.isArray(applications)) {
            counts.total = applications.length;
            applications.forEach(function (app) {
                var status = safeText(app.status, "PENDING").toUpperCase();
                if (status === "PENDING") {
                    counts.pending += 1;
                } else if (status === "ACCEPTED") {
                    counts.accepted += 1;
                } else if (status === "REJECTED") {
                    counts.rejected += 1;
                } else if (status === "WITHDRAWN") {
                    counts.withdrawn += 1;
                }
            });
        }

        summaryNodes.total.textContent = String(counts.total);
        summaryNodes.pending.textContent = String(counts.pending);
        summaryNodes.accepted.textContent = String(counts.accepted);
        summaryNodes.rejected.textContent = String(counts.rejected);
        summaryNodes.withdrawn.textContent = String(counts.withdrawn);
    }

    function renderList(applications) {
        listNode.innerHTML = "";

        if (!jobSelect.value.trim()) {
            listSummaryNode.textContent = "Select a job to view applications.";
            listNode.appendChild(createEmptyState("No job selected", "Choose one of your postings to start reviewing applicants."));
            return;
        }

        if (!Array.isArray(applications) || applications.length === 0) {
            listSummaryNode.textContent = "No applications match the selected filters.";
            listNode.appendChild(createEmptyState("No applications found", "Try another status filter or refresh the selected job."));
            return;
        }

        listSummaryNode.textContent = "Showing " + applications.length + " application" + (applications.length > 1 ? "s" : "") + ".";
        applications.forEach(function (app) {
            listNode.appendChild(createApplicationCard(app));
        });
    }

    function createApplicationCard(app) {
        var card = document.createElement("article");
        card.className = "application-card";

        var status = safeText(app.status, "PENDING").toUpperCase();
        var appId = safeText(app.applicationId, "");
        var isPending = status === "PENDING";
        var isActioning = state.actioningId === appId;

        var coverLetter = safeText(app.coverLetter, "");
        if (!coverLetter) {
            coverLetter = "No cover letter submitted.";
        }

        card.innerHTML =
            "<header class=\"application-header\">" +
                "<div>" +
                    "<h3>" + escapeHtml(safeText(app.applicantName, "Unnamed applicant")) + "</h3>" +
                    "<p>" + escapeHtml(safeText(app.applicantEmail, "-")) + " · Applicant ID: " + escapeHtml(safeText(app.applicantId, "-")) + "</p>" +
                "</div>" +
                "<span class=\"status-pill status-" + escapeHtml(status.toLowerCase()) + "\">" + escapeHtml(status) + "</span>" +
            "</header>" +
            "<div class=\"application-meta\">" +
                "<p><span>Applied at</span><strong>" + escapeHtml(formatDateTime(app.appliedAt)) + "</strong></p>" +
                "<p><span>Course</span><strong>" + escapeHtml(safeText(app.courseCode, "-")) + "</strong></p>" +
            "</div>" +
            "<section class=\"cover-letter-block\">" +
                "<h4>Cover letter</h4>" +
                "<p>" + escapeHtml(coverLetter) + "</p>" +
            "</section>" +
            "<div class=\"application-actions\">" +
                "<button class=\"accept-btn\" type=\"button\" data-action=\"accept\" data-id=\"" + escapeHtml(appId) + "\"" + (!isPending || isActioning ? " disabled" : "") + ">" + escapeHtml(isActioning ? "Processing..." : "Accept") + "</button>" +
                "<button class=\"reject-btn\" type=\"button\" data-action=\"reject\" data-id=\"" + escapeHtml(appId) + "\"" + (!isPending || isActioning ? " disabled" : "") + ">" + escapeHtml(isActioning ? "Processing..." : "Reject") + "</button>" +
            "</div>";

        if (isPending) {
            var acceptButton = card.querySelector("button[data-action=\"accept\"]");
            var rejectButton = card.querySelector("button[data-action=\"reject\"]");
            if (acceptButton) {
                acceptButton.addEventListener("click", function () {
                    handleDecision(appId, "accept");
                });
            }
            if (rejectButton) {
                rejectButton.addEventListener("click", function () {
                    handleDecision(appId, "reject");
                });
            }
        }

        return card;
    }

    function createEmptyState(title, description) {
        var empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML =
            "<p class=\"empty-title\">" + escapeHtml(title) + "</p>" +
            "<p class=\"empty-copy\">" + escapeHtml(description) + "</p>";
        return empty;
    }

    function handleDecision(applicationId, action) {
        if (!applicationId || state.actioningId) {
            return;
        }

        state.actioningId = applicationId;
        render();
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
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to update application status.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return;
                }

                var successText = action === "accept" ? "Application accepted successfully." : "Application rejected successfully.";
                showMessage(successText, "success");
                loadApplicationsForSelectedJob();
            })
            .catch(function () {
                showMessage("Network error while updating application.", "error");
            })
            .finally(function () {
                state.actioningId = "";
                render();
            });
    }

    function hasJob(jobId) {
        return state.jobs.some(function (job) {
            return safeText(job.jobId, "") === jobId;
        });
    }

    function getInitialJobIdFromQuery() {
        try {
            var params = new URLSearchParams(window.location.search || "");
            var jobId = params.get("jobId");
            return jobId ? jobId.trim() : "";
        } catch (error) {
            return "";
        }
    }

    function setLoadingJobs(loading) {
        state.loadingJobs = loading;
        if (refreshJobsButton) {
            refreshJobsButton.disabled = loading;
        }
        setJobSelectDisabled(loading || !currentUserId || state.jobs.length === 0);
    }

    function setLoadingApplications(loading) {
        state.loadingApplications = loading;
        if (refreshApplicationsButton) {
            refreshApplicationsButton.disabled = loading;
        }
        if (statusFilter) {
            statusFilter.disabled = loading;
        }
    }

    function setJobSelectDisabled(disabled) {
        jobSelect.disabled = disabled;
    }

    function showMessage(message, type) {
        messageNode.textContent = message;
        messageNode.classList.remove("hidden", "error", "success");
        messageNode.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        messageNode.textContent = "";
        messageNode.classList.remove("error", "success");
        messageNode.classList.add("hidden");
    }

    function handleUnauthorized() {
        showMessage("Your session has expired. Redirecting to login...", "error");
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
        try {
            return JSON.parse(text);
        } catch (error) {
            return parseLegacyResponse(text);
        }
    }

    function parseLegacyResponse(text) {
        if (typeof text !== "string") {
            return null;
        }

        var successMatch = text.match(/"success"\s*:\s*(true|false)/i);
        if (!successMatch) {
            return null;
        }

        var payload = {
            success: successMatch[1].toLowerCase() === "true"
        };

        var messageMatch = text.match(/"message"\s*:\s*"([^"]*)"/i);
        if (messageMatch) {
            payload.message = decodeEscapedText(messageMatch[1]);
        }

        return payload;
    }

    function decodeEscapedText(value) {
        return value
            .replace(/\\"/g, "\"")
            .replace(/\\\\/g, "\\")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
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
