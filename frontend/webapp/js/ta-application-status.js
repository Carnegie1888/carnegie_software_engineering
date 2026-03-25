(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";

    var filterForm = document.getElementById("status-filter-form");
    var statusFilter = document.getElementById("status-filter");
    var keywordFilter = document.getElementById("keyword-filter");
    var resetButton = document.getElementById("reset-btn");
    var refreshButton = document.getElementById("refresh-btn");
    var searchButton = document.getElementById("search-btn");
    var messageNode = document.getElementById("status-message");
    var listSummaryNode = document.getElementById("list-summary");
    var listNode = document.getElementById("applications-list");

    if (!filterForm || !listNode || !listSummaryNode) {
        return;
    }

    var state = {
        loading: false,
        applications: [],
        loadError: false
    };

    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
    });

    if (resetButton) {
        resetButton.addEventListener("click", function () {
            statusFilter.value = "";
            keywordFilter.value = "";
            hideMessage();
            render();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", function () {
            loadApplications();
        });
    }

    loadApplications();

    function loadApplications() {
        if (state.loading) {
            return;
        }

        setLoading(true);
        state.loadError = false;
        hideMessage();
        listSummaryNode.textContent = "Loading applications...";
        listNode.innerHTML = "";

        request(contextPath + "/apply", {
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
                    showMessage("This page is available for TA accounts only.", "error");
                    state.loadError = true;
                    state.applications = [];
                    render();
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Unable to load your applications.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    state.loadError = true;
                    state.applications = [];
                    render();
                    return;
                }

                state.applications = getPayloadDataArray(payload, "applications");
                render();
            })
            .catch(function () {
                showMessage("Network error. Please try again.", "error");
                state.loadError = true;
                state.applications = [];
                render();
            })
            .finally(function () {
                setLoading(false);
            });
    }

    function render() {
        var filtered = getFilteredApplications();
        renderList(filtered);
    }

    function getFilteredApplications() {
        var selectedStatus = statusFilter.value.trim().toUpperCase();
        var keyword = keywordFilter.value.trim().toLowerCase();

        return state.applications.filter(function (app) {
            var appStatus = safeText(app.status, "").toUpperCase();
            if (selectedStatus && appStatus !== selectedStatus) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            var searchable = [
                safeText(app.jobTitle, ""),
                safeText(app.courseCode, ""),
                safeText(app.moName, ""),
                safeText(app.status, "")
            ].join(" ").toLowerCase();

            return searchable.indexOf(keyword) >= 0;
        });
    }

    function renderList(applications) {
        listNode.innerHTML = "";

        if (state.loadError) {
            listSummaryNode.textContent = "Unable to load applications right now.";
            listNode.appendChild(createEmptyState("load-error"));
            return;
        }

        if (!Array.isArray(state.applications) || state.applications.length === 0) {
            listSummaryNode.textContent = "No applications submitted yet.";
            listNode.appendChild(createEmptyState("no-applications"));
            return;
        }

        if (!Array.isArray(applications) || applications.length === 0) {
            listSummaryNode.textContent = "No applications match the current filters.";
            listNode.appendChild(createEmptyState("no-match"));
            return;
        }

        listSummaryNode.textContent = "Showing " + applications.length + " application" + (applications.length > 1 ? "s" : "") + ".";

        applications.forEach(function (app) {
            listNode.appendChild(createApplicationCard(app));
        });
    }

    function createApplicationCard(app) {
        var card = document.createElement("article");
        var applicationId = safeText(app.applicationId, "");
        var status = safeText(app.status, "PENDING").toUpperCase();
        var statusClass = getApplicationStatusClass(status);
        var detailLink =
            contextPath + "/jsp/ta/application-detail.jsp?id=" + encodeURIComponent(applicationId);
        var title = safeText(app.jobTitle, "Untitled position");
        var subtitle = buildApplicationSubtitle(safeText(app.courseCode, ""), app.appliedAt);

        card.className = "application-card status-" + statusClass;
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", "View details of " + title);
        card.setAttribute("data-application-id", applicationId);

        card.innerHTML =
            "<span class=\"application-accent\" aria-hidden=\"true\"></span>" +
            "<div class=\"application-main\">" +
                "<div class=\"application-heading\">" +
                    "<h3>" + escapeHtml(title) + "</h3>" +
                    "<p class=\"application-subtitle\">" + subtitle + "</p>" +
                "</div>" +
            "</div>" +
            "<div class=\"application-side\">" +
                "<span class=\"application-status-chip status-" + statusClass + "\">" +
                    getStatusIconMarkup(statusClass) +
                    "<span class=\"application-status-text\">" + escapeHtml(getApplicationStatusLabel(status)) + "</span>" +
                "</span>" +
            "</div>";

        card.addEventListener("click", function () {
            window.location.href = detailLink;
        });
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.location.href = detailLink;
            }
        });

        return card;
    }

    function buildApplicationSubtitle(courseCode, appliedAt) {
        var parts = [];
        if (courseCode) {
            parts.push("<span class=\"application-course-code\">" + escapeHtml(courseCode) + "</span>");
        }

        parts.push("<span class=\"application-date-label\">Applied at</span>");
        parts.push(
            "<time class=\"application-date-value\" datetime=\"" + escapeHtml(safeText(appliedAt, "")) + "\">" +
                escapeHtml(formatDateTime(appliedAt)) +
            "</time>"
        );

        return parts.join("<span class=\"application-subtitle-separator\" aria-hidden=\"true\">·</span>");
    }

    function getApplicationStatusClass(status) {
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

    function getApplicationStatusLabel(status) {
        if (status === "PENDING") {
            return "Pending";
        }
        if (status === "ACCEPTED") {
            return "Accepted";
        }
        if (status === "REJECTED") {
            return "Rejected";
        }
        if (status === "WITHDRAWN") {
            return "Withdrawn";
        }
        return safeText(status, "-");
    }

    function getStatusIconMarkup(statusClass) {
        if (statusClass === "pending") {
            return "<span class=\"application-status-icon\" aria-hidden=\"true\">" +
                "<svg viewBox=\"0 0 20 20\" focusable=\"false\" aria-hidden=\"true\">" +
                    "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                    "<path d=\"M10 6.25v4.1l2.7 1.7\"></path>" +
                "</svg>" +
            "</span>";
        }

        if (statusClass === "accepted") {
            return "<span class=\"application-status-icon\" aria-hidden=\"true\">" +
                "<svg viewBox=\"0 0 20 20\" focusable=\"false\" aria-hidden=\"true\">" +
                    "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                    "<path d=\"M6.7 10.2l2.2 2.2 4.4-4.5\"></path>" +
                "</svg>" +
            "</span>";
        }

        if (statusClass === "rejected") {
            return "<span class=\"application-status-icon\" aria-hidden=\"true\">" +
                "<svg viewBox=\"0 0 20 20\" focusable=\"false\" aria-hidden=\"true\">" +
                    "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                    "<path d=\"M7.2 7.2l5.6 5.6\"></path>" +
                    "<path d=\"M12.8 7.2l-5.6 5.6\"></path>" +
                "</svg>" +
            "</span>";
        }

        if (statusClass === "withdrawn") {
            return "<span class=\"application-status-icon\" aria-hidden=\"true\">" +
                "<svg viewBox=\"0 0 20 20\" focusable=\"false\" aria-hidden=\"true\">" +
                    "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                    "<path d=\"M6.6 10h6.8\"></path>" +
                "</svg>" +
            "</span>";
        }

        return "<span class=\"application-status-icon\" aria-hidden=\"true\">" +
            "<svg viewBox=\"0 0 20 20\" focusable=\"false\" aria-hidden=\"true\">" +
                "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                "<path d=\"M10 10h0\"></path>" +
            "</svg>" +
        "</span>";
    }

    function createEmptyState(mode) {
        var empty = document.createElement("div");
        empty.className = "empty-state";

        if (mode === "load-error") {
            empty.innerHTML =
                "<p class=\"empty-title\">Unable to load applications</p>" +
                "<p class=\"empty-copy\">Please check your network and click refresh to retry.</p>";
            return empty;
        }

        if (mode === "no-match") {
            empty.innerHTML =
                "<p class=\"empty-title\">No matching applications</p>" +
                "<p class=\"empty-copy\">Try clearing status or keyword filters to broaden results.</p>";
            return empty;
        }

        empty.innerHTML =
            "<p class=\"empty-title\">No applications yet</p>" +
            "<p class=\"empty-copy\">After you apply for a job, the status will appear here.</p>";
        return empty;
    }

    function setLoading(loading) {
        state.loading = loading;
        if (refreshButton) {
            refreshButton.disabled = loading;
        }
        if (resetButton) {
            resetButton.disabled = loading;
        }
        if (searchButton) {
            searchButton.disabled = loading;
            searchButton.textContent = loading ? "Loading..." : "Apply filters";
        }
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
