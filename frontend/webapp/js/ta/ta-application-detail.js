(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";

    function t(key, fallback) {
        if (window.AppI18n && typeof window.AppI18n.t === "function") {
            return window.AppI18n.t(key, fallback);
        }
        return fallback || key;
    }

    var teaserTrigger = document.getElementById("job-teaser-trigger");
    var jobModal = document.getElementById("job-modal");
    var jobModalDialog = document.getElementById("job-modal-dialog");
    var jobModalClose = document.getElementById("job-modal-close");
    var messageNode = document.getElementById("detail-message");

    var state = {
        applicationId: "",
        application: null,
        applicant: null,
        job: null,
        lastFocus: null
    };

    if (!teaserTrigger || !jobModal) {
        return;
    }

    document.addEventListener("app:locale-changed", function () {
        if (state.application) {
            renderAll();
        }
    });

    initialize();

    function initialize() {
        state.applicationId = getApplicationIdFromLocation();
        if (!state.applicationId) {
            showMessage(t("portal.taApplicationDetail.missingId", "Missing application ID. Return to the list and try again."), "error");
            teaserTrigger.disabled = true;
            return;
        }

        loadAll()
            .then(function () {
                renderAll();
            })
            .catch(function () {
                /* errors handled in loadAll */
            });

        teaserTrigger.addEventListener("click", function () {
            openModal();
        });

        if (jobModalClose) {
            jobModalClose.addEventListener("click", function () {
                closeModal();
            });
        }

        jobModal.addEventListener("click", function (event) {
            if (event.target && event.target.getAttribute("data-close-modal") !== null) {
                closeModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !jobModal.classList.contains("hidden")) {
                closeModal();
            }
        });
    }

    function getApplicationIdFromLocation() {
        try {
            var params = new URLSearchParams(window.location.search || "");
            var id = params.get("id");
            return id ? id.trim() : "";
        } catch (e) {
            return "";
        }
    }

    function loadAll() {
        return request(contextPath + "/apply?id=" + encodeURIComponent(state.applicationId), {
            method: "GET",
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;
                if (response.status === 401) {
                    handleUnauthorized();
                    throw new Error("401");
                }
                if (!response.ok || !payload || payload.success !== true) {
                    var msg = t("portal.taApplicationDetail.loadAppFailed", "Unable to load application.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        msg = payload.message.trim();
                    }
                    showMessage(msg, "error");
                    throw new Error("app");
                }
                state.application = getPayloadDataObject(payload);
                if (!state.application) {
                    showMessage(t("portal.taApplicationDetail.loadAppFailed", "Unable to load application."), "error");
                    throw new Error("app");
                }
                var jobId = safeText(state.application.jobId, "");
                return Promise.all([
                    request(contextPath + "/api/applicants/detail?applicationId=" + encodeURIComponent(state.applicationId), {
                        method: "GET",
                        headers: { "X-Requested-With": "XMLHttpRequest" }
                    }),
                    jobId
                        ? request(contextPath + "/jobs?id=" + encodeURIComponent(jobId), {
                              method: "GET",
                              headers: { "X-Requested-With": "XMLHttpRequest" }
                          })
                        : Promise.resolve({ response: { ok: false }, payload: null })
                ]);
            })
            .then(function (results) {
                var detailResult = results[0];
                var jobResult = results[1];

                if (detailResult.response.ok && detailResult.payload && detailResult.payload.success === true) {
                    state.applicant = getPayloadDataObject(detailResult.payload);
                }

                if (jobResult.response.ok && jobResult.payload && jobResult.payload.success === true) {
                    state.job = getPayloadDataObject(jobResult.payload);
                }
            })
            .catch(function (err) {
                if (err && err.message === "401") {
                    return;
                }
                if (!messageNode || messageNode.classList.contains("error")) {
                    return;
                }
                showMessage(t("portal.taApplicationDetail.networkError", "Network error. Please try again."), "error");
            });
    }

    function renderAll() {
        hideMessage();
        var app = state.application;
        var job = state.job;
        var detail = state.applicant;

        var title = safeText(app.jobTitle, t("portal.taApplicationDetail.untitled", "Untitled position"));
        var courseCode = safeText(app.courseCode, "");

        var titleEl = document.getElementById("app-detail-title");
        var submittedEl = document.getElementById("app-detail-submitted");
        var badgeEl = document.getElementById("app-course-badge");
        var chipEl = document.getElementById("app-status-chip");

        if (titleEl) {
            titleEl.textContent = title;
        }
        if (badgeEl) {
            badgeEl.textContent = courseBadgeText(courseCode, title);
        }
        if (submittedEl) {
            submittedEl.textContent =
                t("portal.taApplicationDetail.submittedPrefix", "Submitted on") +
                " " +
                formatDisplayDate(app.appliedAt);
        }

        if (chipEl) {
            var st = safeText(app.status, "PENDING").toUpperCase();
            var sc = statusToChipClass(st);
            chipEl.className = "application-status-chip status-" + sc;
            chipEl.innerHTML =
                getStatusIconMarkup(sc) +
                '<span class="application-status-text">' +
                escapeHtml(statusLabel(st)) +
                "</span>";
        }

        renderCoverLetter(app, detail);
        renderProfileGuidance(detail);
        renderJobTeaser(job);
        renderJobModal(job);
    }

    function courseBadgeText(courseCode, title) {
        var c = safeText(courseCode, "");
        if (c.length >= 2) {
            return c.substring(0, 2).toUpperCase();
        }
        var t0 = safeText(title, "TA");
        return t0.substring(0, 2).toUpperCase();
    }

    function statusToChipClass(status) {
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

    function statusLabel(status) {
        if (status === "PENDING") {
            return t("portal.common.pending", "Pending");
        }
        if (status === "ACCEPTED") {
            return t("portal.common.accepted", "Accepted");
        }
        if (status === "REJECTED") {
            return t("portal.common.rejected", "Rejected");
        }
        if (status === "WITHDRAWN") {
            return t("portal.common.withdrawn", "Withdrawn");
        }
        return status;
    }

    function getStatusIconMarkup(statusClass) {
        if (statusClass === "pending") {
            return (
                '<span class="application-status-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">' +
                "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                "<path d=\"M10 6.25v4.1l2.7 1.7\"></path>" +
                "</svg></span>"
            );
        }
        if (statusClass === "accepted") {
            return (
                '<span class="application-status-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">' +
                "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                "<path d=\"M6.7 10.2l2.2 2.2 4.4-4.5\"></path>" +
                "</svg></span>"
            );
        }
        if (statusClass === "rejected") {
            return (
                '<span class="application-status-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">' +
                "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
                "<path d=\"M7.2 7.2l5.6 5.6\"></path>" +
                "<path d=\"M12.8 7.2l-5.6 5.6\"></path>" +
                "</svg></span>"
            );
        }
        return (
            '<span class="application-status-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">' +
            "<circle cx=\"10\" cy=\"10\" r=\"7.25\"></circle>" +
            "</svg></span>"
        );
    }

    function renderCoverLetter(app, detail) {
        var el = document.getElementById("cover-letter-body");
        if (!el) {
            return;
        }
        var text = safeText(app.coverLetter, "");
        if (!text && detail) {
            text = safeText(detail.coverLetter, "");
        }
        el.textContent = text || t("portal.taApplicationDetail.noCoverLetter", "No cover letter provided.");
    }

    function renderProfileGuidance(detail) {
        var profileCopy = document.getElementById("profile-jump-copy");
        if (profileCopy) {
            profileCopy.textContent =
                detail && detail.hasResume === true
                    ? t("portal.taApplicationDetail.profileCardHintReady", "View or edit your resume and skills.")
                    : t("portal.taApplicationDetail.profileCardHintMissingResume", "Add or update your resume, skills, and profile details.");
        }

        var noteText = document.getElementById("profile-sync-note-text");
        if (!noteText) {
            return;
        }

        var baseNote = t(
            "portal.taApplicationDetail.profileSyncNote",
            "Your profile and resume were sent with this application to the MO. You can update your profile after submission, and changes will sync to the MO view."
        );
        noteText.textContent = baseNote;
    }

    function renderJobTeaser(job) {
        var meta = document.getElementById("job-teaser-meta");
        if (!meta) {
            return;
        }
        meta.innerHTML = "";
        if (!job) {
            meta.textContent = t("portal.taApplicationDetail.jobUnavailable", "Job details unavailable.");
            teaserTrigger.disabled = true;
            return;
        }
        teaserTrigger.disabled = false;

        var workload = safeText(job.workload, "—");
        var applicants =
            typeof job.applicantCount === "number"
                ? String(job.applicantCount)
                : safeText(job.applicantCount, "0");
        var deadline = formatDisplayDateTime(job.deadline);
        var deadlineText = deadline;
        if (deadline && deadline !== "—") {
            deadlineText = t("portal.taApplicationDetail.deadlinePrefix", "截至") + " " + deadline;
        }

        meta.appendChild(teaserMetaItem("workload", t("portal.taApplicationDetail.workload", "Workload"), workload));
        meta.appendChild(teaserMetaItem("applicants", t("portal.taApplicationDetail.applicants", "Applicants"), applicants));
        meta.appendChild(teaserMetaItem("deadline", t("portal.taApplicationDetail.deadline", "Deadline"), deadlineText));
    }

    function teaserMetaItem(iconType, label, value) {
        var span = document.createElement("span");
        span.innerHTML =
            teaserMetaIconMarkup(iconType) +
            "<strong>" +
            escapeHtml(value) +
            "</strong>";
        span.setAttribute("title", label);
        return span;
    }

    function teaserMetaIconMarkup(iconType) {
        if (iconType === "workload") {
            return (
                "<span class=\"job-teaser-meta-icon\" aria-hidden=\"true\">" +
                    "<svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" +
                        "<circle cx=\"10\" cy=\"10\" r=\"7\"></circle>" +
                        "<path d=\"M10 6.4v3.8l2.4 1.6\"></path>" +
                    "</svg>" +
                "</span>"
            );
        }
        if (iconType === "applicants") {
            return (
                "<span class=\"job-teaser-meta-icon\" aria-hidden=\"true\">" +
                    "<svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" +
                        "<circle cx=\"7.2\" cy=\"7.4\" r=\"2.6\"></circle>" +
                        "<circle cx=\"13.5\" cy=\"8.4\" r=\"2.2\"></circle>" +
                        "<path d=\"M2.8 15.8c.6-2.1 2.3-3.4 4.4-3.4s3.8 1.3 4.4 3.4\"></path>" +
                        "<path d=\"M11.5 15.8c.4-1.5 1.6-2.5 3.1-2.5 1.2 0 2.3.7 2.8 1.8\"></path>" +
                    "</svg>" +
                "</span>"
            );
        }
        return (
            "<span class=\"job-teaser-meta-icon\" aria-hidden=\"true\">" +
                "<svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" +
                    "<rect x=\"3.6\" y=\"5.2\" width=\"12.8\" height=\"11\" rx=\"2\"></rect>" +
                    "<path d=\"M6.2 3.8v2.4\"></path>" +
                    "<path d=\"M13.8 3.8v2.4\"></path>" +
                    "<path d=\"M3.6 8.6h12.8\"></path>" +
                "</svg>" +
            "</span>"
        );
    }

    function renderJobModal(job) {
        if (!job) {
            return;
        }
        var courseCode = safeText(job.courseCode, "");
        var title = safeText(job.title, "—");

        var badge = document.getElementById("job-modal-badge");
        var titleEl = document.getElementById("job-modal-title");
        var subEl = document.getElementById("job-modal-subtitle");
        if (badge) {
            badge.textContent = courseBadgeText(courseCode, title);
        }
        if (titleEl) {
            titleEl.textContent = title;
        }
        if (subEl) {
            var parts = [];
            var cn = safeText(job.courseName, "");
            if (cn) {
                parts.push(cn);
            }
            var mo = safeText(job.moName, "");
            if (mo) {
                parts.push(mo);
            }
            subEl.textContent = parts.join(" · ") || "—";
        }

        var metrics = document.getElementById("job-modal-metrics");
        if (metrics) {
            metrics.innerHTML = "";
            metrics.appendChild(
                modalMetric(
                    t("portal.taApplicationDetail.workload", "Workload"),
                    safeText(job.workload, "—")
                )
            );
            var ac =
                typeof job.applicantCount === "number"
                    ? String(job.applicantCount)
                    : safeText(job.applicantCount, "0");
            metrics.appendChild(
                modalMetric(t("portal.taApplicationDetail.applicants", "Applicants"), ac)
            );
            metrics.appendChild(
                modalMetric(
                    t("portal.taApplicationDetail.deadline", "Deadline"),
                    formatDisplayDate(job.deadline)
                )
            );
        }

        var desc = document.getElementById("job-modal-description");
        if (desc) {
            desc.textContent = safeText(job.description, t("portal.taApplicationDetail.noDescription", "No description."));
        }

        var skillsWrap = document.getElementById("job-modal-skills");
        if (skillsWrap) {
            skillsWrap.innerHTML = "";
            var skills = normalizeSkills(job.requiredSkills);
            if (skills.length === 0) {
                var s = document.createElement("span");
                s.className = "skill-chip muted";
                s.textContent = t("portal.taApplicationDetail.noSkills", "No skills listed");
                skillsWrap.appendChild(s);
            } else {
                skills.forEach(function (sk) {
                    var chip = document.createElement("span");
                    chip.className = "skill-chip";
                    chip.textContent = sk;
                    skillsWrap.appendChild(chip);
                });
            }
        }
    }

    function modalMetric(label, value) {
        var div = document.createElement("div");
        div.className = "job-modal-metric";
        div.innerHTML =
            "<p class=\"job-modal-metric-label\">" +
            escapeHtml(label) +
            "</p>" +
            "<p class=\"job-modal-metric-value\">" +
            escapeHtml(value) +
            "</p>";
        return div;
    }

    function openModal() {
        if (!state.job || teaserTrigger.disabled) {
            return;
        }
        state.lastFocus = document.activeElement;
        jobModal.classList.remove("hidden");
        jobModal.setAttribute("aria-hidden", "false");
        teaserTrigger.setAttribute("aria-expanded", "true");
        if (jobModalDialog) {
            jobModalDialog.focus();
        }
    }

    function closeModal() {
        jobModal.classList.add("hidden");
        jobModal.setAttribute("aria-hidden", "true");
        teaserTrigger.setAttribute("aria-expanded", "false");
        if (state.lastFocus && typeof state.lastFocus.focus === "function") {
            state.lastFocus.focus();
        } else {
            teaserTrigger.focus();
        }
    }

    function normalizeSkills(raw) {
        if (typeof raw !== "string" || !raw.trim()) {
            return [];
        }
        return raw
            .split(/[;,]/)
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            });
    }

    function formatDisplayDate(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "—";
        }
        var d = new Date(value);
        if (isNaN(d.getTime())) {
            return value;
        }
        return (
            d.getFullYear() +
            "-" +
            pad2(d.getMonth() + 1) +
            "-" +
            pad2(d.getDate())
        );
    }

    function formatDisplayDateTime(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "—";
        }
        var d = new Date(value);
        if (isNaN(d.getTime())) {
            return value;
        }
        return (
            d.getFullYear() +
            "-" +
            pad2(d.getMonth() + 1) +
            "-" +
            pad2(d.getDate()) +
            " " +
            pad2(d.getHours()) +
            ":" +
            pad2(d.getMinutes())
        );
    }

    function pad2(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function showMessage(text, type) {
        if (!messageNode) {
            return;
        }
        messageNode.textContent = text;
        messageNode.classList.remove("hidden", "error", "success");
        messageNode.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        if (!messageNode) {
            return;
        }
        messageNode.textContent = "";
        messageNode.classList.add("hidden");
        messageNode.classList.remove("error", "success");
    }

    function handleUnauthorized() {
        showMessage(t("portal.taApplicationDetail.sessionExpired", "Your session has expired. Redirecting to login..."), "error");
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
        } catch (e) {
            return null;
        }
    }

    function getPayloadDataObject(payload) {
        if (!payload || typeof payload !== "object") {
            return null;
        }
        if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
            return payload.data;
        }
        return null;
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
})();
