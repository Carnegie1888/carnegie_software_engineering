(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var i18n = window.AppI18n && typeof window.AppI18n.t === "function" ? window.AppI18n : null;

    var filterForm = document.getElementById("workload-filter-form");
    var startInput = document.getElementById("start-time");
    var endInput = document.getElementById("end-time");
    var clearButton = document.getElementById("clear-filter-btn");
    var refreshButton = document.getElementById("refresh-btn");
    var exportButton = document.getElementById("export-btn");
    var applyButton = document.getElementById("apply-filter-btn");
    var messageNode = document.getElementById("dashboard-message");
    var moSummaryNode = document.getElementById("mo-summary");
    var moListNode = document.getElementById("mo-list");
    var inviteForm = document.getElementById("admin-invite-form");
    var inviteEmailInput = document.getElementById("invite-email");
    var inviteExpireHoursInput = document.getElementById("invite-expire-hours");
    var inviteSubmitButton = document.getElementById("send-invite-btn");
    var inviteMessageNode = document.getElementById("invite-message");
    var inviteResultNode = document.getElementById("invite-result");

    var summaryNodes = {
        total: document.getElementById("summary-total"),
        pending: document.getElementById("summary-pending"),
        accepted: document.getElementById("summary-accepted"),
        rejected: document.getElementById("summary-rejected"),
        withdrawn: document.getElementById("summary-withdrawn")
    };
    var chartNodes = {
        statusChart: document.getElementById("status-chart"),
        moChart: document.getElementById("mo-chart")
    };
    var EMPTY_COUNTS = {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
    };
    var STATUS_CHART_ROWS = [
        { key: "pending", label: "Pending", style: "pending" },
        { key: "accepted", label: "Accepted", style: "accepted" },
        { key: "rejected", label: "Rejected", style: "rejected" },
        { key: "withdrawn", label: "Withdrawn", style: "withdrawn" }
    ];

    if (!filterForm || !startInput || !endInput || !moSummaryNode || !moListNode) {
        return;
    }

    var state = {
        loading: false,
        exporting: false,
        inviteSubmitting: false
    };

    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loadDashboard();
    });

    if (clearButton) {
        clearButton.addEventListener("click", function () {
            startInput.value = "";
            endInput.value = "";
            loadDashboard();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", function () {
            loadDashboard();
        });
    }

    if (exportButton) {
        exportButton.addEventListener("click", function () {
            exportCsv();
        });
    }

    if (inviteForm) {
        inviteForm.addEventListener("submit", function (event) {
            event.preventDefault();
            createAdminInvite();
        });
    }

    loadDashboard();

    function loadDashboard() {
        if (state.loading) {
            return Promise.resolve();
        }

        var validationError = validateTimeRange();
        if (validationError) {
            showMessage(validationError, "error");
            return Promise.resolve();
        }

        state.loading = true;
        setLoadingState(true);
        hideMessage();
        moSummaryNode.textContent = "Loading workload...";
        moListNode.innerHTML = "";

        return Promise.all([
            fetchCounts(),
            fetchMoWorkloads()
        ]).then(function (values) {
            var countsResult = values[0];
            var moResult = values[1];

            if (countsResult.unauthorized || moResult.unauthorized) {
                handleUnauthorized();
                return;
            }

            if (!countsResult.ok) {
                showMessage(countsResult.message || "Failed to load application totals.", "error");
            }
            renderSummary(countsResult.ok ? countsResult.payload : EMPTY_COUNTS);

            if (!moResult.ok) {
                showMessage(moResult.message || "Failed to load MO workloads.", "error");
            }
            var moWorkloads = moResult.ok && Array.isArray(getPayloadDataArray(moResult.payload, "moWorkloads"))
                ? getPayloadDataArray(moResult.payload, "moWorkloads")
                : [];
            renderMoList(moWorkloads);
            renderMoChart(moWorkloads);
        }).catch(function () {
            showMessage("Network error while loading dashboard.", "error");
            renderSummary(EMPTY_COUNTS);
            renderMoList([]);
            renderMoChart([]);
        }).finally(function () {
            state.loading = false;
            setLoadingState(false);
        });
    }

    function fetchCounts() {
        var url = contextPath + "/api/admin/workload" + buildQueryString(null);
        return request(url, {
            method: "GET",
            headers: { "X-Requested-With": "XMLHttpRequest" }
        }).then(function (result) {
            return normalizeApiResult(result, "Application totals request failed.");
        });
    }

    function fetchMoWorkloads() {
        var url = contextPath + "/api/admin/workload" + buildQueryString({ mode: "mo" });
        return request(url, {
            method: "GET",
            headers: { "X-Requested-With": "XMLHttpRequest" }
        }).then(function (result) {
            return normalizeApiResult(result, "MO workload request failed.");
        });
    }

    function exportCsv() {
        if (state.exporting) {
            return;
        }

        var validationError = validateTimeRange();
        if (validationError) {
            showMessage(validationError, "error");
            return;
        }

        state.exporting = true;
        if (exportButton) {
            exportButton.disabled = true;
            exportButton.textContent = "Exporting...";
        }

        var url = contextPath + "/api/admin/workload" + buildQueryString({
            mode: "mo",
            export: "csv"
        });
        fetch(url, {
            method: "GET",
            headers: { "X-Requested-With": "XMLHttpRequest" }
        }).then(function (response) {
            if (response.status === 401) {
                handleUnauthorized();
                return null;
            }
            if (!response.ok) {
                throw new Error("Failed to export CSV.");
            }
            return response.text();
        }).then(function (csvText) {
            if (typeof csvText !== "string") {
                return;
            }
            downloadCsv(csvText);
            showMessage("CSV exported successfully.", "success");
        }).catch(function () {
            showMessage("Unable to export CSV.", "error");
        }).finally(function () {
            state.exporting = false;
            if (exportButton) {
                exportButton.disabled = false;
                exportButton.textContent = "Export CSV";
            }
        });
    }

    function createAdminInvite() {
        if (!inviteForm || state.inviteSubmitting) {
            return;
        }
        hideInviteMessage();
        clearInviteResult();

        var email = trimText(inviteEmailInput ? inviteEmailInput.value : "").toLowerCase();
        var expireHoursText = trimText(inviteExpireHoursInput ? inviteExpireHoursInput.value : "");
        var expireHours = Number(expireHoursText || "48");

        if (!email || !isValidEmail(email)) {
            showInviteMessage(t("portal.dynamic.inviteInvalidEmail", "Please enter a valid invitee email address."), "error");
            if (inviteEmailInput) {
                inviteEmailInput.focus();
            }
            return;
        }
        if (!isFinite(expireHours) || expireHours < 1 || expireHours > 168) {
            showInviteMessage(t("portal.dynamic.inviteHoursRange", "Expiry hours must be between 1 and 168."), "error");
            if (inviteExpireHoursInput) {
                inviteExpireHoursInput.focus();
            }
            return;
        }

        state.inviteSubmitting = true;
        setInviteSubmitting(true);

        var formData = new URLSearchParams();
        formData.set("email", email);
        formData.set("expireHours", String(Math.round(expireHours)));

        fetch(contextPath + "/api/admin/invite", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData.toString()
        }).then(function (response) {
            return response.text().then(function (text) {
                return {
                    response: response,
                    payload: parseJson(text)
                };
            });
        }).then(function (result) {
            var response = result.response;
            var payload = result.payload;
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!response.ok || !payload || payload.success !== true) {
                showInviteMessage(payload && payload.message ? payload.message : t("portal.dynamic.inviteCreateFailed", "Failed to create invitation."), "error");
                return;
            }

            showInviteMessage(t("portal.dynamic.inviteCreatedSuccess", "Invitation created successfully."), "success");
            renderInviteResult(payload.data || {});
            if (inviteForm) {
                inviteForm.reset();
                if (inviteExpireHoursInput) {
                    inviteExpireHoursInput.value = "48";
                }
            }
        }).catch(function () {
            showInviteMessage(t("portal.dynamic.inviteCreateNetworkError", "Network error while creating invitation."), "error");
        }).finally(function () {
            state.inviteSubmitting = false;
            setInviteSubmitting(false);
        });
    }

    function normalizeApiResult(result, fallbackMessage) {
        var response = result.response;
        var payload = result.payload;

        if (response.status === 401) {
            return { unauthorized: true, ok: false, payload: null, message: "Please login first." };
        }
        if (!response.ok || !payload || payload.success !== true) {
            return {
                unauthorized: false,
                ok: false,
                payload: payload || null,
                message: payload && payload.message ? String(payload.message) : fallbackMessage
            };
        }
        return { unauthorized: false, ok: true, payload: payload, message: "" };
    }

    function renderSummary(payload) {
        var counts = normalizeCounts(payload);
        setSummaryCounts(counts);
        renderStatusChart(counts);
    }

    function resetSummary() {
        setSummaryCounts(EMPTY_COUNTS);
    }

    function normalizeCounts(payload) {
        if (!payload || typeof payload !== "object") {
            return EMPTY_COUNTS;
        }
        var data = payload && payload.data && typeof payload.data === "object" ? payload.data : payload;
        return {
            total: toNumber(data.total),
            pending: toNumber(data.pending),
            accepted: toNumber(data.accepted),
            rejected: toNumber(data.rejected),
            withdrawn: toNumber(data.withdrawn)
        };
    }

    function setSummaryCounts(counts) {
        summaryNodes.total.textContent = String(toNumber(counts.total));
        summaryNodes.pending.textContent = String(toNumber(counts.pending));
        summaryNodes.accepted.textContent = String(toNumber(counts.accepted));
        summaryNodes.rejected.textContent = String(toNumber(counts.rejected));
        summaryNodes.withdrawn.textContent = String(toNumber(counts.withdrawn));
    }

    function renderMoList(moWorkloads) {
        moListNode.innerHTML = "";
        if (!Array.isArray(moWorkloads) || moWorkloads.length === 0) {
            moSummaryNode.textContent = "No MO workload data in selected range.";
            moListNode.appendChild(createEmptyState());
            return;
        }

        moSummaryNode.textContent = "Loaded " + moWorkloads.length + " MO workload item" + (moWorkloads.length > 1 ? "s" : "") + ".";
        moWorkloads.forEach(function (item) {
            moListNode.appendChild(createMoItem(item));
        });
    }

    function renderStatusChart(counts) {
        if (!chartNodes.statusChart) {
            return;
        }
        chartNodes.statusChart.innerHTML = "";

        var total = toNumber(counts.total);
        if (total <= 0) {
            chartNodes.statusChart.innerHTML = "<p class=\"empty-copy\">No status data available.</p>";
            return;
        }

        STATUS_CHART_ROWS.forEach(function (row) {
            var value = toNumber(counts[row.key]);
            var percent = Math.round((value * 100) / total);
            chartNodes.statusChart.appendChild(buildChartRow(row.label, percent, value, row.style));
        });
    }

    function renderMoChart(moWorkloads) {
        if (!chartNodes.moChart) {
            return;
        }
        chartNodes.moChart.innerHTML = "";

        if (!Array.isArray(moWorkloads) || moWorkloads.length === 0) {
            chartNodes.moChart.innerHTML = "<p class=\"empty-copy\">No MO workload data available.</p>";
            return;
        }

        var sorted = moWorkloads.slice().sort(function (a, b) {
            return toNumber(b.totalApplications) - toNumber(a.totalApplications);
        }).slice(0, 6);

        var maxValue = 0;
        sorted.forEach(function (item) {
            maxValue = Math.max(maxValue, toNumber(item.totalApplications));
        });

        sorted.forEach(function (item) {
            var total = toNumber(item.totalApplications);
            var percent = maxValue > 0 ? Math.round((total * 100) / maxValue) : 0;
            chartNodes.moChart.appendChild(
                buildChartRow(safeText(item.moName, "MO"), percent, total, "mo")
            );
        });
    }

    function buildChartRow(label, percent, value, styleClass) {
        var row = document.createElement("div");
        row.className = "chart-row";
        row.innerHTML =
            "<span class=\"chart-label\">" + escapeHtml(label) + "</span>" +
            "<div class=\"chart-track\"><i class=\"chart-fill " + escapeHtml(styleClass) + "\" style=\"width:" + escapeHtml(String(percent)) + "%\"></i></div>" +
            "<strong class=\"chart-value\">" + escapeHtml(String(value)) + "</strong>";
        return row;
    }

    function createMoItem(item) {
        var element = document.createElement("article");
        element.className = "mo-item";
        element.innerHTML =
            "<div class=\"mo-item-header\">" +
                "<h3>" + escapeHtml(safeText(item.moName, "MO User")) + "</h3>" +
                "<span class=\"mo-item-id\">" + escapeHtml(safeText(item.moId, "-")) + "</span>" +
            "</div>" +
            "<div class=\"mo-item-stats\">" +
                "<p><span>Total</span><strong>" + escapeHtml(String(toNumber(item.totalApplications))) + "</strong></p>" +
                "<p><span>Pending</span><strong>" + escapeHtml(String(toNumber(item.pending))) + "</strong></p>" +
                "<p><span>Processed</span><strong>" + escapeHtml(String(toNumber(item.processed))) + "</strong></p>" +
                "<p><span>Accepted</span><strong>" + escapeHtml(String(toNumber(item.accepted))) + "</strong></p>" +
            "</div>";
        return element;
    }

    function createEmptyState() {
        var empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML =
            "<p class=\"empty-title\">No workload data yet</p>" +
            "<p class=\"empty-copy\">Adjust time range or wait for application activity to appear.</p>";
        return empty;
    }

    function setLoadingState(loading) {
        if (applyButton) {
            applyButton.disabled = loading;
            applyButton.textContent = loading ? "Loading..." : "Apply range";
        }
        if (clearButton) {
            clearButton.disabled = loading;
        }
        if (refreshButton) {
            refreshButton.disabled = loading;
        }
        if (exportButton) {
            exportButton.disabled = loading || state.exporting;
        }
    }

    function setInviteSubmitting(submitting) {
        if (inviteSubmitButton) {
            inviteSubmitButton.disabled = submitting;
            inviteSubmitButton.textContent = submitting
                ? t("portal.dynamic.sendingInvitation", "Sending...")
                : t("portal.adminDashboard.sendInvitation", "Send invitation");
        }
        if (inviteEmailInput) {
            inviteEmailInput.disabled = submitting;
        }
        if (inviteExpireHoursInput) {
            inviteExpireHoursInput.disabled = submitting;
        }
    }

    function showInviteMessage(message, type) {
        if (!inviteMessageNode) {
            return;
        }
        inviteMessageNode.textContent = message;
        inviteMessageNode.classList.remove("hidden", "error", "success");
        inviteMessageNode.classList.add(type === "success" ? "success" : "error");
    }

    function hideInviteMessage() {
        if (!inviteMessageNode) {
            return;
        }
        inviteMessageNode.textContent = "";
        inviteMessageNode.classList.remove("error", "success");
        inviteMessageNode.classList.add("hidden");
    }

    function renderInviteResult(data) {
        if (!inviteResultNode) {
            return;
        }
        var inviteUrl = safeText(data.inviteUrl, "");
        var inviteCode = safeText(data.inviteCode, "");
        var expiresAt = safeText(data.expiresAt, "");
        var emailDelivery = safeText(data.emailDelivery, "fallback");
        var deliveryDetail = safeText(data.deliveryDetail, "");
        var previewBody = safeText(data.previewBody, "");

        var html = "";
        html += "<p><strong>" + escapeHtml(t("portal.dynamic.inviteResultLink", "Invite link:")) + "</strong> <a href=\"" + escapeHtml(inviteUrl) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(inviteUrl) + "</a></p>";
        html += "<p><strong>" + escapeHtml(t("portal.dynamic.inviteResultCode", "Invite code:")) + "</strong> " + escapeHtml(inviteCode) + "</p>";
        html += "<p><strong>" + escapeHtml(t("portal.dynamic.inviteResultExpiresAt", "Expires at:")) + "</strong> " + escapeHtml(expiresAt) + "</p>";
        html += "<p><strong>" + escapeHtml(t("portal.dynamic.inviteResultEmailDelivery", "Email delivery:")) + "</strong> " + escapeHtml(emailDelivery) + "</p>";
        if (deliveryDetail) {
            html += "<p><strong>" + escapeHtml(t("portal.dynamic.inviteResultDeliveryDetail", "Delivery detail:")) + "</strong> " + escapeHtml(deliveryDetail) + "</p>";
        }
        if (previewBody && emailDelivery !== "sent") {
            html += "<details><summary>" + escapeHtml(t("portal.dynamic.inviteResultEmailPreview", "Email preview")) + "</summary><pre>" + escapeHtml(previewBody) + "</pre></details>";
        }
        inviteResultNode.innerHTML = html;
        inviteResultNode.classList.remove("hidden");
    }

    function clearInviteResult() {
        if (!inviteResultNode) {
            return;
        }
        inviteResultNode.innerHTML = "";
        inviteResultNode.classList.add("hidden");
    }

    function buildQueryString(staticParams) {
        var params = new URLSearchParams();
        if (staticParams && typeof staticParams === "object") {
            Object.keys(staticParams).forEach(function (key) {
                var value = staticParams[key];
                if (value !== null && value !== undefined && String(value).trim() !== "") {
                    params.set(key, String(value));
                }
            });
        }
        var startValue = normalizeDateTime(startInput.value);
        var endValue = normalizeDateTime(endInput.value);
        if (startValue) {
            params.set("start", startValue);
        }
        if (endValue) {
            params.set("end", endValue);
        }
        var query = params.toString();
        return query ? "?" + query : "";
    }

    function validateTimeRange() {
        var startValue = normalizeDateTime(startInput.value);
        var endValue = normalizeDateTime(endInput.value);
        if (!startValue || !endValue) {
            return "";
        }
        var startTime = Date.parse(startValue);
        var endTime = Date.parse(endValue);
        if (isNaN(startTime) || isNaN(endTime)) {
            return "Invalid datetime format.";
        }
        if (startTime > endTime) {
            return "Start time cannot be after end time.";
        }
        return "";
    }

    function normalizeDateTime(value) {
        if (typeof value !== "string") {
            return "";
        }
        var trimmed = value.trim();
        if (!trimmed) {
            return "";
        }
        return trimmed.length === 16 ? trimmed + ":00" : trimmed;
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

    function decodeEscapedText(value) {
        return value
            .replace(/\\"/g, "\"")
            .replace(/\\\\/g, "\\")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
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
        showMessage("Session expired. Redirecting to login...", "error");
        window.setTimeout(function () {
            window.location.href = contextPath + "/login.jsp";
        }, 900);
    }

    function downloadCsv(csvText) {
        var blob = new Blob([csvText], { type: "text/csv;charset=UTF-8" });
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "mo-workload-stats.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    function toNumber(value) {
        var number = Number(value);
        return isFinite(number) ? number : 0;
    }

    function trimText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function isValidEmail(value) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimText(value));
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

    function t(key, fallback) {
        if (i18n) {
            return i18n.t(key, fallback);
        }
        return fallback || key;
    }
})();
