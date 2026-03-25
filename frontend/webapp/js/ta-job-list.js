(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";

    var searchForm = document.getElementById("job-search-form");
    var searchInput = document.getElementById("job-search-input");
    var searchButton = document.getElementById("job-search-btn");
    var listMessage = document.getElementById("list-message");
    var listSummary = document.getElementById("job-list-summary");
    var jobList = document.getElementById("job-list");

    if (!searchForm || !searchInput || !listSummary || !jobList) {
        return;
    }

    var state = {
        loading: false,
        loadError: false,
        approximateOnly: false,
        lastKeyword: "",
        keywordSearchTriggered: false
    };

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitSearch();
    });

    searchInput.addEventListener("blur", function () {
        if (searchInput.value.trim()) {
            return;
        }
        if (state.lastKeyword !== "" || state.keywordSearchTriggered) {
            loadJobs("", false);
        }
    });

    loadJobs("", false);

    function submitSearch() {
        loadJobs(searchInput.value.trim(), true);
    }

    function loadJobs(keyword, isUserTriggeredSearch) {
        if (state.loading) {
            return;
        }

        var normalizedKeyword = typeof keyword === "string" ? keyword.trim() : searchInput.value.trim();
        state.lastKeyword = normalizedKeyword;
        state.keywordSearchTriggered = !!isUserTriggeredSearch && normalizedKeyword.length > 0;

        setLoading(true);
        state.loadError = false;
        state.approximateOnly = false;
        hideMessage();
        listSummary.textContent = t("portal.taJobList.loadingPositions", "Loading positions...");
        jobList.innerHTML = "";

        request(buildJobsUrl(normalizedKeyword), {
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
                    var errorMessage = t("portal.dynamic.unableLoadJobsRetry", "Unable to load jobs right now. Please try again.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    state.loadError = true;
                    renderJobs([]);
                    return;
                }

                var data = getPayloadDataObject(payload);
                var jobs = getPayloadDataArray(payload, "jobs");
                state.approximateOnly = !!data.approximateOnly;
                renderJobs(jobs);
            })
            .catch(function () {
                showMessage(t("portal.dynamic.networkErrorMoment", "Network error. Please try again in a moment."), "error");
                state.loadError = true;
                renderJobs([]);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    function buildJobsUrl(keyword) {
        var params = new URLSearchParams();
        if (keyword) {
            params.set("keyword", keyword);
        }
        var queryString = params.toString();
        return contextPath + "/jobs" + (queryString ? "?" + queryString : "");
    }

    function renderJobs(jobs) {
        var keyword = state.lastKeyword;
        var hasKeywordSearch = state.keywordSearchTriggered;
        jobList.innerHTML = "";

        if (state.loadError) {
            listSummary.textContent = t("portal.dynamic.unableLoadJobs", "Unable to load jobs right now.");
            jobList.appendChild(createEmptyState("load-error"));
            return;
        }

        if (!Array.isArray(jobs) || jobs.length === 0) {
            if (hasKeywordSearch && keyword) {
                listSummary.textContent = t("portal.dynamic.noJobsForSearch", "No jobs match your keyword.");
                jobList.appendChild(createEmptyState("no-match"));
            } else {
                listSummary.textContent = t("portal.dynamic.noJobsAvailable", "No jobs available right now.");
                jobList.appendChild(createEmptyState("no-jobs"));
            }
            return;
        }

        listSummary.textContent = buildSummaryText(jobs.length, t("portal.dynamic.jobUnit", "job"));

        if (state.approximateOnly && hasKeywordSearch) {
            showMessage(t("portal.dynamic.closestMatchesNotice", "No exact matches. Showing closest results."), "success");
        } else {
            hideMessage();
        }

        jobs.forEach(function (job) {
            jobList.appendChild(createJobCard(job));
        });
    }

    function createJobCard(job) {
        var card = document.createElement("article");
        var jobId = getSafeText(job.jobId, "");
        var status = getSafeText(job.status || "OPEN").toUpperCase();
        var statusClass = getJobStatusClass(status);
        var detailHref = contextPath + "/jsp/ta/job-detail.jsp?id=" + encodeURIComponent(jobId);
        var title = getSafeText(job.title, t("portal.dynamic.untitledPosition", "Untitled position"));
        var subtitle = buildJobSubtitle(job);
        var metaLine = buildJobMeta(job);

        card.className = "job-card status-" + statusClass;
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", t("portal.dynamic.viewDetails", "View details") + " " + title);
        card.setAttribute("data-job-id", jobId);

        card.innerHTML =
            "<span class=\"job-accent\" aria-hidden=\"true\"></span>" +
            "<div class=\"job-main\">" +
                "<div class=\"job-heading\">" +
                    "<h3>" + escapeHtml(title) + "</h3>" +
                    "<p class=\"job-subtitle\">" + subtitle + "</p>" +
                    (metaLine
                        ? "<p class=\"job-meta-line\">" + metaLine + "</p>"
                        : "") +
                "</div>" +
            "</div>" +
            "<div class=\"job-side\">" +
                "<span class=\"job-status-chip status-" + statusClass + "\">" + escapeHtml(getJobStatusLabel(status)) + "</span>" +
            "</div>";

        card.addEventListener("click", function () {
            window.location.href = detailHref;
        });
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.location.href = detailHref;
            }
        });

        return card;
    }

    function getJobStatusClass(status) {
        if (status === "OPEN") {
            return "open";
        }
        if (status === "CLOSED") {
            return "closed";
        }
        if (status === "FILLED") {
            return "filled";
        }
        return "unknown";
    }

    function getJobStatusLabel(status) {
        if (status === "OPEN") {
            return t("portal.common.open", "Open");
        }
        if (status === "CLOSED") {
            return t("portal.common.closed", "Closed");
        }
        if (status === "FILLED") {
            return t("portal.common.filled", "Filled");
        }
        return getSafeText(status, "-");
    }

    function buildJobSubtitle(job) {
        var parts = [];
        var courseCode = getSafeText(job.courseCode, "");
        var courseName = getSafeText(job.courseName, "");
        var moName = getSafeText(job.moName, "-");
        var deadlineLabel = t("portal.common.deadline", "Deadline");
        var deadlineText = formatDateTime(job.deadline);

        if (courseCode) {
            parts.push("<span class=\"job-course-code\">" + escapeHtml(courseCode) + "</span>");
        }
        if (courseName) {
            parts.push("<span class=\"job-course-name\">" + escapeHtml(courseName) + "</span>");
        }
        parts.push("<span class=\"job-mo\">" + escapeHtml(t("portal.dynamic.moShort", "MO") + " " + moName) + "</span>");
        parts.push("<span class=\"job-deadline\">" + escapeHtml(deadlineLabel + " " + deadlineText) + "</span>");

        return parts.join("<span class=\"job-subtitle-separator\" aria-hidden=\"true\">·</span>");
    }

    function buildJobMeta(job) {
        var parts = [];

        parts.push(escapeHtml(t("portal.common.positions", "Positions") + " " + String(job.positions || 0)));

        if (job.salary) {
            parts.push(escapeHtml(t("portal.common.salary", "Salary") + " " + getSafeText(job.salary)));
        }
        if (job.workload) {
            parts.push(escapeHtml(t("portal.common.workload", "Workload") + " " + getSafeText(job.workload)));
        }

        return parts.join("<span class=\"job-meta-separator\" aria-hidden=\"true\">·</span>");
    }

    function createEmptyState(mode) {
        var empty = document.createElement("div");
        empty.className = "empty-state";

        if (mode === "load-error") {
            empty.innerHTML =
                "<p class=\"empty-title\">" + escapeHtml(t("portal.dynamic.unableLoadPositionsTitle", "Unable to load positions")) + "</p>" +
                "<p class=\"empty-copy\">" + escapeHtml(t("portal.dynamic.refreshAfterNetworkCheck", "Please refresh the list after checking your network connection.")) + "</p>";
            return empty;
        }

        if (mode === "no-jobs") {
            empty.innerHTML =
                "<p class=\"empty-title\">" + escapeHtml(t("portal.dynamic.noPositionsPublishedTitle", "No positions published yet")) + "</p>" +
                "<p class=\"empty-copy\">" + escapeHtml(t("portal.dynamic.positionsAppearAfterPublish", "When MO publishes new jobs, they will appear here.")) + "</p>";
            return empty;
        }

        empty.innerHTML =
            "<p class=\"empty-title\">" + escapeHtml(t("portal.dynamic.noMatchingPositionsTitle", "No matching positions")) + "</p>" +
            "<p class=\"empty-copy\">" + escapeHtml(t("portal.dynamic.tryAnotherKeyword", "Try another keyword.")) + "</p>";
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

    function showMessage(message, type) {
        if (!listMessage) {
            return;
        }
        listMessage.textContent = message;
        listMessage.classList.remove("hidden", "error", "success");
        listMessage.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        if (!listMessage) {
            return;
        }
        listMessage.textContent = "";
        listMessage.classList.remove("error", "success");
        listMessage.classList.add("hidden");
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

    function getSafeText(value, fallback) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
        if (typeof value === "number") {
            return String(value);
        }
        return typeof fallback === "string" ? fallback : "";
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
