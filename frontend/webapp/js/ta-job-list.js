(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var currentRole = typeof window.APP_CURRENT_ROLE === "string" ? window.APP_CURRENT_ROLE.trim().toUpperCase() : "";

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
        approximateOnly: false
    };

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loadJobs();
    });

    loadJobs();

    function loadJobs() {
        if (state.loading) {
            return;
        }

        setLoading(true);
        state.loadError = false;
        state.approximateOnly = false;
        hideMessage();
        listSummary.textContent = t("portal.taJobList.loadingPositions", "Loading positions...");
        jobList.innerHTML = "";

        request(buildJobsUrl(), {
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

    function buildJobsUrl() {
        var keyword = searchInput.value.trim();
        var params = new URLSearchParams();
        if (keyword) {
            params.set("keyword", keyword);
        }
        var queryString = params.toString();
        return contextPath + "/jobs" + (queryString ? "?" + queryString : "");
    }

    function renderJobs(jobs) {
        var keyword = searchInput.value.trim();
        jobList.innerHTML = "";

        if (state.loadError) {
            listSummary.textContent = t("portal.dynamic.unableLoadJobs", "Unable to load jobs right now.");
            jobList.appendChild(createEmptyState("load-error"));
            return;
        }

        if (!Array.isArray(jobs) || jobs.length === 0) {
            if (keyword) {
                listSummary.textContent = t("portal.dynamic.noJobsForSearch", "No jobs match your keyword.");
                jobList.appendChild(createEmptyState("no-match"));
            } else {
                listSummary.textContent = t("portal.dynamic.noJobsAvailable", "No jobs available right now.");
                jobList.appendChild(createEmptyState("no-jobs"));
            }
            return;
        }

        listSummary.textContent = buildSummaryText(jobs.length, t("portal.dynamic.jobUnit", "job"));

        if (state.approximateOnly && keyword) {
            showMessage(t("portal.dynamic.closestMatchesNotice", "No exact matches. Showing closest results."), "success");
        } else {
            hideMessage();
        }

        jobs.forEach(function (job) {
            jobList.appendChild(createJobCard(job));
        });
    }

    function createJobCard(job) {
        var article = document.createElement("article");
        article.className = "job-card";

        var status = getSafeText(job.status || "OPEN").toUpperCase();
        var canApply = currentRole === "TA" && status === "OPEN";
        var detailHref = contextPath + "/jsp/ta/job-detail.jsp?id=" + encodeURIComponent(getSafeText(job.jobId));
        var tagsHtml = buildTagItems(job);

        article.innerHTML =
            "<header class=\"job-card-header\">" +
                "<div class=\"job-heading\">" +
                    "<h2>" + escapeHtml(getSafeText(job.title, t("portal.dynamic.untitledPosition", "Untitled position"))) + "</h2>" +
                    "<p>" + escapeHtml(getSafeText(job.courseCode, "-")) +
                        (job.courseName ? " · " + escapeHtml(job.courseName) : "") + "</p>" +
                "</div>" +
                "<span class=\"status-pill status-" + escapeHtml(status.toLowerCase()) + "\">" + escapeHtml(status) + "</span>" +
            "</header>" +
            "<div class=\"job-meta\">" +
                "<p><span class=\"meta-label\">" + escapeHtml(t("portal.dynamic.moShort", "MO")) + "</span><span class=\"meta-value\">" + escapeHtml(getSafeText(job.moName, "-")) + "</span></p>" +
                "<p><span class=\"meta-label\">" + escapeHtml(t("portal.common.positions", "Positions")) + "</span><span class=\"meta-value\">" + escapeHtml(String(job.positions || 0)) + "</span></p>" +
                "<p><span class=\"meta-label\">" + escapeHtml(t("portal.common.deadline", "Deadline")) + "</span><span class=\"meta-value\">" + escapeHtml(formatDateTime(job.deadline)) + "</span></p>" +
            "</div>" +
            "<div class=\"job-tags\">" + tagsHtml + "</div>" +
            "<div class=\"job-card-actions\">" +
                "<a class=\"primary-link\" href=\"" + detailHref + "\">" + escapeHtml(t("portal.dynamic.viewDetails", "View details")) + "</a>" +
                (canApply ? "<a class=\"ghost-link\" href=\"" + detailHref + "#apply\">" + escapeHtml(t("portal.dynamic.applyNow", "Apply now")) + "</a>" : "") +
            "</div>";

        return article;
    }

    function buildTagItems(job) {
        var tags = [];
        if (job.salary) {
            tags.push({ label: t("portal.common.salary", "Salary"), value: getSafeText(job.salary) });
        }
        if (job.workload) {
            tags.push({ label: t("portal.common.workload", "Workload"), value: getSafeText(job.workload) });
        }
        if (job.requiredSkills) {
            tags.push({ label: t("portal.common.requiredSkills", "Required skills"), value: normalizeSkills(job.requiredSkills) });
        }

        if (tags.length === 0) {
            return "<span class=\"tag-item muted\">" + escapeHtml(t("portal.dynamic.noExtraTags", "No extra tags")) + "</span>";
        }

        return tags.map(function (tag) {
            return "<span class=\"tag-item\"><strong>" + escapeHtml(tag.label) + ":</strong> " + escapeHtml(tag.value) + "</span>";
        }).join("");
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

    function normalizeSkills(rawSkills) {
        if (typeof rawSkills !== "string" || !rawSkills.trim()) {
            return "-";
        }
        return rawSkills
            .split(/[;,]/)
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            })
            .join(", ");
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
