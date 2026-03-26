(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var currentRole = typeof window.APP_CURRENT_ROLE === "string" ? window.APP_CURRENT_ROLE.trim().toUpperCase() : "";

    function t(key, fallback) {
        if (window.AppI18n && typeof window.AppI18n.t === "function") {
            return window.AppI18n.t(key, fallback);
        }
        return fallback || key;
    }

    var titleNode = document.getElementById("job-title");
    var courseNode = document.getElementById("job-course");
    var statusNode = document.getElementById("job-status");
    var positionsNode = document.getElementById("job-positions");
    var workloadNode = document.getElementById("job-workload");
    var salaryNode = document.getElementById("job-salary");
    var deadlineNode = document.getElementById("job-deadline");
    var descriptionNode = document.getElementById("job-description");
    var skillsNode = document.getElementById("job-skills");
    var detailMessageNode = document.getElementById("detail-message");
    var applyOpenButton = document.getElementById("apply-open-btn");
    var applyInlineStatus = document.getElementById("apply-inline-status");

    var applyForm = document.getElementById("apply-form");
    var coverLetterInput = document.getElementById("cover-letter");
    var applySubmitButton = document.getElementById("apply-submit-btn");
    var applyStatusBanner = document.getElementById("apply-status-banner");
    var applyModal = document.getElementById("apply-modal");
    var applyModalDialog = document.getElementById("apply-modal-dialog");
    var applyModalClose = document.getElementById("apply-modal-close");
    var aiMatchButton = document.getElementById("detail-ai-match-btn");
    var aiMatchModal = document.getElementById("ai-match-modal");
    var aiMatchModalDialog = document.getElementById("ai-match-modal-dialog");
    var aiMatchModalClose = document.getElementById("ai-match-modal-close");
    var aiMatchRefreshButton = document.getElementById("ai-match-refresh-btn");
    var aiMatchStatusBanner = document.getElementById("ai-match-status-banner");
    var aiMatchLoading = document.getElementById("ai-match-loading");
    var aiMatchResult = document.getElementById("ai-match-result");
    var aiMatchScore = document.getElementById("ai-match-score");
    var aiMatchLevel = document.getElementById("ai-match-level");
    var aiMatchSummary = document.getElementById("ai-match-summary");
    var aiMatchStrengths = document.getElementById("ai-match-strengths");
    var aiMatchRisks = document.getElementById("ai-match-risks");
    var aiMatchSuggestions = document.getElementById("ai-match-suggestions");
    var aiMatchJobEvidence = document.getElementById("ai-match-job-evidence");
    var aiMatchProfileEvidence = document.getElementById("ai-match-profile-evidence");

    if (
        !titleNode ||
        !applyOpenButton ||
        !applyInlineStatus ||
        !applyForm ||
        !coverLetterInput ||
        !applySubmitButton ||
        !applyStatusBanner ||
        !applyModal ||
        !applyModalDialog
    ) {
        return;
    }

    var state = {
        jobId: "",
        loadingJob: false,
        submitting: false,
        loadedJob: null,
        hasApplied: false,
        applicationStatus: "",
        applyDisabled: true,
        applyDisabledMessage: "",
        applyDisabledTone: "error",
        lastFocus: null,
        aiSubmitting: false,
        aiResult: null,
        aiLastFocus: null
    };

    applyForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitApplication();
    });

    applyOpenButton.addEventListener("click", function () {
        openApplyModal();
    });

    if (aiMatchButton) {
        aiMatchButton.addEventListener("click", function () {
            if (isModalVisible(aiMatchModal)) {
                closeAiMatchModal();
                return;
            }
            openAiMatchModal();
        });
    }

    if (applyModalClose) {
        applyModalClose.addEventListener("click", function () {
            closeApplyModal();
        });
    }

    applyModal.addEventListener("click", function (event) {
        if (event.target && event.target.getAttribute("data-close-modal") !== null) {
            closeApplyModal();
        }
    });

    if (aiMatchModalClose) {
        aiMatchModalClose.addEventListener("click", function () {
            closeAiMatchModal();
        });
    }

    if (aiMatchRefreshButton) {
        aiMatchRefreshButton.addEventListener("click", function () {
            requestAiMatchAnalysis(true);
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }
        if (isModalVisible(aiMatchModal)) {
            closeAiMatchModal();
            return;
        }
        if (isModalVisible(applyModal)) {
            closeApplyModal();
        }
    });

    document.addEventListener("app:locale-changed", function () {
        rerenderCurrentView();
    });

    initialize();

    function initialize() {
        syncApplyControls();
        syncAiMatchTrigger();
        state.jobId = getJobIdFromLocation();
        if (!state.jobId) {
            showDetailMessage(t("portal.taJobDetail.missingId", "Missing job ID. Please return to the list and try again."), "error");
            setApplyDisabled(true, t("portal.dynamic.jobIdMissing", "Job ID is missing."), "error");
            syncAiMatchTrigger();
            return;
        }

        if (currentRole !== "TA") {
            setApplyDisabled(true, t("portal.dynamic.currentAccountCannotSubmit", "Current account cannot submit applications on this page."), "error");
        }

        loadJobDetail();
    }

    function rerenderCurrentView() {
        syncApplyControls();
        syncAiMatchTrigger();
        if (!state.loadedJob) {
            return;
        }
        renderJob(state.loadedJob);
        if (state.hasApplied) {
            setApplyDisabled(true, applicationStatusMessage(state.applicationStatus), "success");
        }
        if (state.aiResult) {
            renderAiMatchResult(state.aiResult);
        }
    }

    function loadJobDetail() {
        if (state.loadingJob) {
            return;
        }

        setJobLoading(true);
        hideDetailMessage();

        request(contextPath + "/jobs?id=" + encodeURIComponent(state.jobId), {
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

                if (response.status === 404) {
                    showDetailMessage(t("portal.dynamic.jobNotFound", "Job not found. It may have been removed."), "error");
                    setApplyDisabled(true, t("portal.dynamic.jobNoLongerAvailable", "This job is no longer available."), "error");
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = t("portal.dynamic.unableLoadJobDetailsNow", "Unable to load job details right now.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showDetailMessage(errorMessage, "error");
                    setApplyDisabled(true);
                    return;
                }

                var job = getPayloadDataObject(payload);
                if (!job) {
                    showDetailMessage(t("portal.dynamic.unableLoadJobDetailsNow", "Unable to load job details right now."), "error");
                    setApplyDisabled(true);
                    return;
                }

                state.loadedJob = job;
                renderJob(job);
                return refreshMyApplicationStatus();
            })
            .catch(function () {
                showDetailMessage(t("portal.dynamic.networkErrorMoment", "Network error. Please try again in a moment."), "error");
                setApplyDisabled(true);
            })
            .finally(function () {
                setJobLoading(false);
            });
    }

    function renderJob(job) {
        var status = safeText(job.status, "OPEN").toUpperCase();
        var courseParts = [];
        var courseCode = safeText(job.courseCode, "");
        var courseName = safeText(job.courseName, "");
        var moName = safeText(job.moName, "");

        if (courseCode) {
            courseParts.push(courseCode);
        }
        if (courseName) {
            courseParts.push(courseName);
        }
        if (moName) {
            courseParts.push(t("portal.taJobDetail.moduleOrganizer", "Module organizer") + " " + moName);
        }

        titleNode.textContent = safeText(job.title, t("portal.dynamic.untitledPosition", "Untitled position"));
        courseNode.textContent = courseParts.length ? courseParts.join(" · ") : "-";
        positionsNode.textContent = safeText(String(job.positions || 0), "-");
        workloadNode.textContent = safeText(job.workload, "-");
        salaryNode.textContent = safeText(job.salary, "-");
        deadlineNode.textContent = formatDateTime(job.deadline);
        descriptionNode.textContent = safeText(job.description, t("portal.taApplicationDetail.noDescription", "No description provided."));

        statusNode.textContent = statusLabel(status);
        statusNode.className = "status-pill status-" + status.toLowerCase();

        renderSkills(job.requiredSkills);
        syncAiMatchTrigger();

        if (currentRole !== "TA") {
            setApplyDisabled(true, t("portal.dynamic.currentAccountCannotSubmit", "Current account cannot submit applications on this page."), "error");
            return;
        }

        if (currentRole === "TA" && status !== "OPEN") {
            setApplyDisabled(true, t("portal.dynamic.jobNotAccepting", "This job is not accepting new applications."), "error");
            return;
        }

        if (!state.hasApplied) {
            setApplyDisabled(false);
        }
    }

    function renderSkills(skillsValue) {
        skillsNode.innerHTML = "";
        var skills = normalizeSkills(skillsValue);
        if (skills.length === 0) {
            var empty = document.createElement("span");
            empty.className = "skill-chip muted";
            empty.textContent = t("portal.dynamic.noSpecificSkills", "No specific skills listed.");
            skillsNode.appendChild(empty);
            return;
        }

        skills.forEach(function (skill) {
            var chip = document.createElement("span");
            chip.className = "skill-chip";
            chip.textContent = skill;
            skillsNode.appendChild(chip);
        });
    }

    function refreshMyApplicationStatus() {
        if (currentRole !== "TA") {
            return Promise.resolve();
        }

        return request(contextPath + "/apply?jobId=" + encodeURIComponent(state.jobId), {
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
                    return;
                }

                var applications = getPayloadDataArray(payload, "applications");
                if (applications.length === 0) {
                    state.hasApplied = false;
                    state.applicationStatus = "";
                    if (state.loadedJob && safeText(state.loadedJob.status, "OPEN").toUpperCase() === "OPEN") {
                        setApplyDisabled(false);
                    }
                    hideApplyStatus();
                    return;
                }

                var application = applications[0];
                state.hasApplied = true;
                state.applicationStatus = safeText(application.status, "PENDING").toUpperCase();
                hideApplyStatus();
                setApplyDisabled(true, applicationStatusMessage(state.applicationStatus), "success");
            });
    }

    function submitApplication() {
        if (state.submitting || currentRole !== "TA") {
            return;
        }

        if (state.applyDisabled) {
            showApplyStatus(state.applyDisabledMessage || t("portal.dynamic.applicationUnavailable", "Application unavailable"), state.applyDisabledTone);
            return;
        }

        if (!state.jobId) {
            showApplyStatus(t("portal.dynamic.cannotSubmitMissingJobId", "Cannot submit because job ID is missing."), "error");
            return;
        }

        if (state.hasApplied) {
            showApplyStatus(t("portal.dynamic.alreadyApplied", "You have already applied for this job."), "error");
            return;
        }

        var coverLetter = coverLetterInput.value.trim();
        if (coverLetter && containsControlChars(coverLetter)) {
            showApplyStatus(t("portal.dynamic.coverLetterControlChars", "Cover letter contains unsupported control characters."), "error");
            coverLetterInput.focus();
            return;
        }
        if (coverLetter && containsDangerousMarkup(coverLetter)) {
            showApplyStatus(t("portal.dynamic.coverLetterUnsupportedMarkup", "Cover letter contains unsupported markup."), "error");
            coverLetterInput.focus();
            return;
        }
        if (coverLetter.length > 2000) {
            showApplyStatus(t("portal.dynamic.coverLetterTooLong", "Cover letter must be 2000 characters or fewer."), "error");
            coverLetterInput.focus();
            return;
        }

        hideApplyStatus();
        setApplySubmitting(true);

        var formData = new URLSearchParams();
        formData.set("jobId", state.jobId);
        formData.set("coverLetter", coverLetter);

        request(contextPath + "/apply", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData.toString()
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = t("portal.dynamic.failedSubmitApplication", "Failed to submit application. Please try again.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showApplyStatus(errorMessage, "error");
                    return;
                }

                state.hasApplied = true;
                state.applicationStatus = "PENDING";
                setApplyDisabled(true, applicationStatusMessage(state.applicationStatus), "success");
                showApplyStatus(t("portal.dynamic.applicationSubmittedRedirect", "Application submitted successfully. Redirecting to application status..."), "success");
                coverLetterInput.value = "";
                window.setTimeout(function () {
                    window.location.href = contextPath + "/jsp/ta/application-status.jsp";
                }, 900);
                return;
            })
            .catch(function () {
                showApplyStatus(t("portal.dynamic.networkErrorSubmitApplication", "Network error while submitting application."), "error");
            })
            .finally(function () {
                setApplySubmitting(false);
            });
    }

    function setJobLoading(loading) {
        state.loadingJob = loading;
        if (loading) {
            titleNode.textContent = t("portal.taJobDetail.loadingDetails", "Loading job details...");
            courseNode.textContent = "-";
        }
        syncApplyControls();
        syncAiMatchTrigger();
    }

    function setApplySubmitting(submitting) {
        state.submitting = submitting;
        syncApplyControls();
    }

    function setApplyDisabled(disabled, reasonText, tone) {
        state.applyDisabled = !!disabled;
        state.applyDisabledMessage = typeof reasonText === "string" ? reasonText : "";
        state.applyDisabledTone = tone === "success" ? "success" : "error";
        syncApplyControls();
    }

    function showDetailMessage(message, type) {
        detailMessageNode.textContent = message;
        detailMessageNode.classList.remove("hidden", "error", "success");
        detailMessageNode.classList.add(type === "success" ? "success" : "error");
    }

    function hideDetailMessage() {
        detailMessageNode.textContent = "";
        detailMessageNode.classList.remove("error", "success");
        detailMessageNode.classList.add("hidden");
    }

    function showApplyInlineStatus(message, type) {
        applyInlineStatus.textContent = message;
        applyInlineStatus.classList.remove("hidden", "error", "success");
        applyInlineStatus.classList.add(type === "success" ? "success" : "error");
    }

    function hideApplyInlineStatus() {
        applyInlineStatus.textContent = "";
        applyInlineStatus.classList.remove("error", "success");
        applyInlineStatus.classList.add("hidden");
    }

    function showApplyStatus(message, type) {
        applyStatusBanner.textContent = message;
        applyStatusBanner.classList.remove("hidden", "error", "success");
        applyStatusBanner.classList.add(type === "success" ? "success" : "error");
    }

    function hideApplyStatus() {
        applyStatusBanner.textContent = "";
        applyStatusBanner.classList.remove("error", "success");
        applyStatusBanner.classList.add("hidden");
    }

    function openApplyModal() {
        if (applyOpenButton.disabled || state.applyDisabled) {
            return;
        }
        if (isModalVisible(aiMatchModal)) {
            closeAiMatchModal();
        }
        state.lastFocus = document.activeElement;
        hideApplyStatus();
        applyModal.classList.remove("hidden");
        applyModal.setAttribute("aria-hidden", "false");
        applyOpenButton.setAttribute("aria-expanded", "true");
        syncBodyModalState();
        if (!coverLetterInput.disabled) {
            coverLetterInput.focus();
        } else {
            applyModalDialog.focus();
        }
    }

    function closeApplyModal() {
        if (applyModal.classList.contains("hidden")) {
            return;
        }
        applyModal.classList.add("hidden");
        applyModal.setAttribute("aria-hidden", "true");
        applyOpenButton.setAttribute("aria-expanded", "false");
        syncBodyModalState();
        if (state.lastFocus && typeof state.lastFocus.focus === "function") {
            state.lastFocus.focus();
        } else {
            applyOpenButton.focus();
        }
    }

    function openAiMatchModal() {
        if (!hasAiModalElements()) {
            return;
        }
        if (aiMatchButton && aiMatchButton.disabled) {
            return;
        }
        if (currentRole !== "TA") {
            showDetailMessage(t("portal.dynamic.currentAccountCannotSubmit", "Current account cannot submit applications on this page."), "error");
            return;
        }
        if (!state.jobId || !state.loadedJob) {
            showDetailMessage(t("portal.dynamic.jobIdMissing", "Job ID is missing."), "error");
            return;
        }

        if (isModalVisible(applyModal)) {
            closeApplyModal();
        }

        state.aiLastFocus = document.activeElement;
        hideAiMatchStatus();
        aiMatchModal.classList.remove("hidden");
        aiMatchModal.setAttribute("aria-hidden", "false");
        aiMatchButton.setAttribute("aria-expanded", "true");
        aiMatchModalDialog.focus();
        scrollToAiMatchCard();

        if (!state.aiResult) {
            requestAiMatchAnalysis(false);
            return;
        }
        renderAiMatchResult(state.aiResult);
    }

    function closeAiMatchModal() {
        if (!isModalVisible(aiMatchModal)) {
            return;
        }
        aiMatchModal.classList.add("hidden");
        aiMatchModal.setAttribute("aria-hidden", "true");
        if (aiMatchButton) {
            aiMatchButton.setAttribute("aria-expanded", "false");
        }
        if (state.aiLastFocus && typeof state.aiLastFocus.focus === "function") {
            state.aiLastFocus.focus();
        } else if (aiMatchButton && typeof aiMatchButton.focus === "function") {
            aiMatchButton.focus();
        }
    }

    function requestAiMatchAnalysis(forceRefresh) {
        if (!hasAiModalElements()) {
            return Promise.resolve();
        }
        if (state.aiSubmitting) {
            return Promise.resolve();
        }
        if (currentRole !== "TA") {
            showAiMatchStatus(t("portal.dynamic.currentAccountCannotSubmit", "Current account cannot submit applications on this page."), "error");
            return Promise.resolve();
        }
        if (!state.jobId) {
            showAiMatchStatus(t("portal.dynamic.jobIdMissing", "Job ID is missing."), "error");
            return Promise.resolve();
        }
        if (state.aiResult && !forceRefresh) {
            renderAiMatchResult(state.aiResult);
            return Promise.resolve();
        }

        state.aiSubmitting = true;
        syncAiMatchTrigger();
        hideAiMatchStatus();
        setAiMatchLoading(true);

        var formData = new URLSearchParams();
        formData.set("jobId", state.jobId);

        return request(contextPath + "/api/ta/job-match-analysis", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData.toString()
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = t("portal.dynamic.aiAnalysisFailed", "Unable to generate AI analysis right now.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showAiMatchStatus(errorMessage, "error");
                    return;
                }

                var data = getPayloadDataObject(payload);
                if (!data) {
                    showAiMatchStatus(t("portal.dynamic.aiAnalysisFailed", "Unable to generate AI analysis right now."), "error");
                    return;
                }

                state.aiResult = normalizeAiMatchResult(data);
                renderAiMatchResult(state.aiResult);
                if (state.aiResult.fallback) {
                    var fallbackMessage = t("portal.dynamic.aiAnalysisFallbackUsed", "AI service is temporarily unavailable. Showing local analysis.");
                    if (state.aiResult.fallbackReason) {
                        fallbackMessage += " " + state.aiResult.fallbackReason;
                    }
                    showAiMatchStatus(fallbackMessage, "success");
                } else {
                    hideAiMatchStatus();
                }
            })
            .catch(function () {
                showAiMatchStatus(t("portal.dynamic.aiAnalysisNetworkError", "Network error while requesting AI analysis."), "error");
            })
            .finally(function () {
                state.aiSubmitting = false;
                setAiMatchLoading(false);
                syncAiMatchTrigger();
            });
    }

    function setAiMatchLoading(loading) {
        if (!hasAiModalElements()) {
            return;
        }
        aiMatchLoading.classList.toggle("hidden", !loading);
        if (loading) {
            aiMatchResult.classList.add("hidden");
        }
        if (aiMatchRefreshButton) {
            aiMatchRefreshButton.disabled = loading;
        }
    }

    function renderAiMatchResult(result) {
        if (!hasAiModalElements()) {
            return;
        }
        if (!result) {
            aiMatchResult.classList.add("hidden");
            return;
        }
        aiMatchScore.textContent = formatAiScore(result.overallScore);
        aiMatchLevel.textContent = aiMatchLevelText(result.matchLevel);
        aiMatchSummary.textContent = safeText(
            result.summary,
            t("portal.dynamic.aiNoSummary", "No summary is available yet.")
        );

        renderAiList(
            aiMatchStrengths,
            result.strengths,
            t("portal.dynamic.aiNoStrengths", "No clear strengths identified.")
        );
        renderAiList(
            aiMatchRisks,
            result.risks,
            t("portal.dynamic.aiNoRisks", "No obvious risks identified.")
        );
        renderAiList(
            aiMatchSuggestions,
            result.suggestions,
            t("portal.dynamic.aiNoSuggestions", "No additional suggestions at this time.")
        );
        renderAiList(
            aiMatchJobEvidence,
            result.jobEvidence,
            t("portal.dynamic.aiNoJobEvidence", "No job evidence captured.")
        );
        renderAiList(
            aiMatchProfileEvidence,
            result.profileEvidence,
            t("portal.dynamic.aiNoProfileEvidence", "No profile evidence captured.")
        );

        aiMatchResult.classList.remove("hidden");
    }

    function renderAiList(listNode, items, emptyText) {
        if (!listNode) {
            return;
        }
        listNode.innerHTML = "";
        if (!items || items.length === 0) {
            var emptyItem = document.createElement("li");
            emptyItem.textContent = emptyText;
            listNode.appendChild(emptyItem);
            return;
        }
        items.forEach(function (item) {
            var li = document.createElement("li");
            li.textContent = item;
            listNode.appendChild(li);
        });
    }

    function normalizeAiMatchResult(data) {
        var score = Number(data.overallScore);
        if (isNaN(score)) {
            score = Number(data.score);
        }
        if (isNaN(score)) {
            score = 0;
        }
        score = Math.max(0, Math.min(100, Math.round(score)));

        var level = safeText(data.matchLevel, "").toUpperCase();
        if (level !== "HIGH" && level !== "MEDIUM" && level !== "LOW") {
            if (score >= 85) {
                level = "HIGH";
            } else if (score >= 60) {
                level = "MEDIUM";
            } else {
                level = "LOW";
            }
        }

        return {
            overallScore: score,
            matchLevel: level,
            summary: safeText(data.summary, ""),
            strengths: normalizeStringArray(data.strengths),
            risks: normalizeStringArray(data.risks),
            suggestions: normalizeStringArray(data.suggestions),
            jobEvidence: normalizeStringArray(data.jobEvidence),
            profileEvidence: normalizeStringArray(data.profileEvidence),
            fallback: !!data.fallback,
            fallbackReason: safeText(data.fallbackReason, "")
        };
    }

    function showAiMatchStatus(message, type) {
        if (!aiMatchStatusBanner) {
            return;
        }
        aiMatchStatusBanner.textContent = message;
        aiMatchStatusBanner.classList.remove("hidden", "error", "success");
        aiMatchStatusBanner.classList.add(type === "success" ? "success" : "error");
    }

    function hideAiMatchStatus() {
        if (!aiMatchStatusBanner) {
            return;
        }
        aiMatchStatusBanner.textContent = "";
        aiMatchStatusBanner.classList.remove("error", "success");
        aiMatchStatusBanner.classList.add("hidden");
    }

    function aiMatchLevelText(level) {
        if (level === "HIGH") {
            return t("portal.dynamic.aiMatchLevelHigh", "High");
        }
        if (level === "MEDIUM") {
            return t("portal.dynamic.aiMatchLevelMedium", "Medium");
        }
        if (level === "LOW") {
            return t("portal.dynamic.aiMatchLevelLow", "Low");
        }
        return "-";
    }

    function formatAiScore(score) {
        if (typeof score !== "number" || isNaN(score)) {
            return "-";
        }
        return Math.round(score) + "%";
    }

    function normalizeStringArray(value) {
        if (Array.isArray(value)) {
            return value
                .map(function (item) {
                    return safeText(item, "");
                })
                .filter(function (item) {
                    return item.length > 0;
                });
        }
        if (typeof value !== "string" || !value.trim()) {
            return [];
        }
        return value
            .split(/[;\n]/)
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            });
    }

    function hasAiModalElements() {
        return !!(
            aiMatchButton &&
            aiMatchModal &&
            aiMatchModalDialog &&
            aiMatchStatusBanner &&
            aiMatchLoading &&
            aiMatchResult &&
            aiMatchScore &&
            aiMatchLevel &&
            aiMatchSummary &&
            aiMatchStrengths &&
            aiMatchRisks &&
            aiMatchSuggestions &&
            aiMatchJobEvidence &&
            aiMatchProfileEvidence
        );
    }

    function syncAiMatchTrigger() {
        if (!aiMatchButton) {
            return;
        }
        var disabled = state.loadingJob || !state.jobId || !state.loadedJob || currentRole !== "TA";
        aiMatchButton.disabled = disabled;
        if (disabled) {
            aiMatchButton.setAttribute("aria-expanded", "false");
        }
        if (aiMatchRefreshButton) {
            aiMatchRefreshButton.disabled = state.aiSubmitting;
        }
    }

    function syncBodyModalState() {
        if (!document.body) {
            return;
        }
        if (isModalVisible(applyModal)) {
            document.body.classList.add("apply-modal-open");
        } else {
            document.body.classList.remove("apply-modal-open");
        }
    }

    function scrollToAiMatchCard() {
        if (!aiMatchModal || typeof aiMatchModal.scrollIntoView !== "function") {
            return;
        }
        aiMatchModal.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function isModalVisible(modalNode) {
        return !!(modalNode && !modalNode.classList.contains("hidden"));
    }

    function handleUnauthorized() {
        showDetailMessage(t("portal.dynamic.sessionExpiredRedirect", "Session expired. Redirecting to login..."), "error");
        window.setTimeout(function () {
            window.location.href = contextPath + "/login.jsp";
        }, 900);
    }

    function shouldShowStoppedApplyButton() {
        return currentRole === "TA" &&
            !state.hasApplied &&
            !!state.loadedJob &&
            safeText(state.loadedJob.status, "OPEN").toUpperCase() !== "OPEN";
    }

    function syncApplyControls() {
        var controlsDisabled = state.applyDisabled || state.loadingJob;
        var hideTrigger = false;
        var showInlineStatus = false;
        var inlineMessage = "";
        var inlineTone = state.applyDisabledTone;
        var buttonLabel = t("portal.dynamic.applyNow", "Apply now");

        coverLetterInput.disabled = controlsDisabled || state.submitting;
        applySubmitButton.textContent = state.submitting
            ? t("portal.dynamic.submitting", "Submitting...")
            : t("portal.taJobDetail.applyNow", "Apply for this job");
        applySubmitButton.disabled = controlsDisabled || state.submitting;
        coverLetterInput.placeholder = t(
            "portal.taJobDetail.coverLetterPlaceholder",
            "Briefly explain your relevant experience, strengths, and availability."
        );

        if (state.hasApplied) {
            hideTrigger = true;
            showInlineStatus = true;
            inlineMessage = applicationStatusMessage(state.applicationStatus);
            inlineTone = "success";
        } else if (shouldShowStoppedApplyButton()) {
            buttonLabel = t("portal.dynamic.applicationStopped", "Applications closed");
        } else if (state.applyDisabledMessage) {
            showInlineStatus = true;
            inlineMessage = state.applyDisabledMessage;
            hideTrigger = !state.loadedJob || currentRole !== "TA";
        }

        applyOpenButton.hidden = hideTrigger;
        applyOpenButton.disabled = hideTrigger ? true : controlsDisabled;
        applyOpenButton.textContent = buttonLabel;

        if (hideTrigger) {
            applyOpenButton.setAttribute("aria-expanded", "false");
        }

        if (showInlineStatus) {
            showApplyInlineStatus(inlineMessage, inlineTone);
        } else {
            hideApplyInlineStatus();
        }
    }

    function applicationStatusMessage(status) {
        return t("portal.dynamic.applicationAlreadySubmitted", "Application already submitted.") +
            " " +
            t("portal.dynamic.applicationStatusPrefix", "Application status:") +
            " " +
            statusLabel(status || "PENDING") +
            ".";
    }

    function statusLabel(status) {
        var value = safeText(status, "").toUpperCase();
        if (value === "OPEN") {
            return t("portal.common.openUpper", "OPEN");
        }
        if (value === "CLOSED") {
            return t("portal.common.closed", "Closed");
        }
        if (value === "FILLED") {
            return t("portal.common.filled", "Filled");
        }
        if (value === "PENDING") {
            return t("portal.common.pending", "Pending");
        }
        if (value === "ACCEPTED") {
            return t("portal.common.accepted", "Accepted");
        }
        if (value === "REJECTED") {
            return t("portal.common.rejected", "Rejected");
        }
        if (value === "WITHDRAWN") {
            return t("portal.common.withdrawn", "Withdrawn");
        }
        return value || "-";
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
            return null;
        }
        if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
            return payload.data;
        }
        return null;
    }

    function normalizeSkills(rawSkills) {
        if (typeof rawSkills !== "string" || !rawSkills.trim()) {
            return [];
        }
        return rawSkills
            .split(/[;,]/)
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            });
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

    function safeText(value, fallback) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
        if (typeof value === "number") {
            return String(value);
        }
        return typeof fallback === "string" ? fallback : "";
    }

    function containsControlChars(value) {
        return /[\u0000-\u001F\u007F]/.test(value || "");
    }

    function containsDangerousMarkup(value) {
        if (typeof value !== "string" || !value) {
            return false;
        }
        return /<[^>]*>/.test(value) || /javascript:/i.test(value) || /on\w+\s*=/.test(value);
    }

    function getJobIdFromLocation() {
        try {
            var params = new URLSearchParams(window.location.search || "");
            return params.get("id") ? params.get("id").trim() : "";
        } catch (error) {
            return "";
        }
    }
})();
