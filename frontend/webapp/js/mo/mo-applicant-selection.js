(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var VIEW_MODE_COURSE_LIST = "course-list";
    var VIEW_MODE_COURSE_DETAIL = "course-detail";
    var VIEW_MODE_APPLICATION_DETAIL = "application-detail";

    var searchForm = document.getElementById("selection-search-form");
    var searchInput = document.getElementById("selection-search-input");
    var searchButton = document.getElementById("selection-search-btn");
    var messageNode = document.getElementById("selection-message");
    var listSummaryNode = document.getElementById("selection-list-summary");
    var listNode = document.getElementById("applications-list");

    if (!searchForm || !searchInput || !listSummaryNode || !listNode) {
        return;
    }

    function syncSearchFormVisibility() {
        var hide = state.viewMode === VIEW_MODE_APPLICATION_DETAIL;
        searchForm.classList.toggle("search-form--hidden", hide);
        if (hide) {
            searchForm.setAttribute("aria-hidden", "true");
        } else {
            searchForm.removeAttribute("aria-hidden");
        }
    }

    var state = {
        loading: false,
        reviewingId: "",
        applications: [],
        applicantDetailsByApplicationId: {},
        jobsById: {},
        courseGroups: [],
        approximateOnly: false,
        lastKeyword: "",
        viewMode: VIEW_MODE_COURSE_LIST,
        selectedCourseCode: "",
        selectedApplicationId: "",
        aiByApplicationId: {}
    };

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        resetViewSelection();
        loadApplications();
    });

    loadApplications();

    function loadApplications(options) {
        options = options || {};
        var preserveView = !!options.preserveView;
        if (state.loading) {
            return Promise.resolve();
        }
        var keyword = searchInput.value.trim();
        state.lastKeyword = keyword;
        if (!preserveView) {
            resetViewSelection();
        }

        setLoading(true);
        state.approximateOnly = false;
        hideMessage();
        setListSummary(t("portal.moApplicantSelection.loadingApplications", "Loading applications..."));
        listNode.innerHTML = "";
        state.applicantDetailsByApplicationId = {};
        state.jobsById = {};
        state.courseGroups = [];
        state.aiByApplicationId = {};

        var url = buildApplyUrl(keyword);

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
                    renderList([]);
                    return;
                }

                if (response.status === 403) {
                    showMessage(t("portal.dynamic.moOnlyPage", "This page is available for MO accounts only."), "error");
                    state.applications = [];
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
                    renderList([]);
                    return;
                }

                state.applications = getPayloadDataArray(payload, "applications");
                state.approximateOnly = !!getPayloadDataObject(payload).approximateOnly;
                return Promise.all([
                    loadApplicantDetails(state.applications),
                    loadJobsCatalog()
                ])
                    .then(function () {
                        hydrateCourseGroups();
                        restoreSelectionAfterRefresh(preserveView);
                        renderList(state.applications);
                    });
            })
            .catch(function () {
                showMessage(t("portal.dynamic.networkErrorTryAgain", "Network error. Please try again."), "error");
                state.applications = [];
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

    function loadJobsCatalog() {
        return request(contextPath + "/jobs", {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;
                if (!response.ok || !payload || payload.success !== true) {
                    return;
                }
                var jobs = getPayloadDataArray(payload, "jobs");
                jobs.forEach(function (job) {
                    var jobId = safeText(job.jobId, "");
                    if (!jobId) {
                        return;
                    }
                    state.jobsById[jobId] = job;
                });
            })
            .catch(function () {
                // course grouping can still work with /apply payload only
            });
    }

    function hydrateCourseGroups() {
        state.courseGroups = groupApplicationsByCourse(state.applications);
    }

    function restoreSelectionAfterRefresh(preserveView) {
        if (!preserveView) {
            resetViewSelection();
            return;
        }
        if (state.selectedApplicationId) {
            var selectedApplication = findApplicationById(state.selectedApplicationId);
            if (selectedApplication) {
                state.selectedCourseCode = getCourseCodeForApplication(selectedApplication);
                state.viewMode = VIEW_MODE_APPLICATION_DETAIL;
                return;
            }
            state.selectedApplicationId = "";
        }
        if (state.selectedCourseCode && getCourseGroupByCode(state.selectedCourseCode)) {
            state.viewMode = VIEW_MODE_COURSE_DETAIL;
            return;
        }
        resetViewSelection();
    }

    function resetViewSelection() {
        state.viewMode = VIEW_MODE_COURSE_LIST;
        state.selectedCourseCode = "";
        state.selectedApplicationId = "";
    }

    function buildApplyUrl(keyword) {
        if (!keyword) {
            return contextPath + "/apply";
        }
        return contextPath + "/apply?keyword=" + encodeURIComponent(keyword);
    }

    function renderList(applications) {
        renderCurrentView(applications);
    }

    function renderCurrentView(applications) {
        listNode.innerHTML = "";
        var keyword = state.lastKeyword;
        if (!Array.isArray(applications) || applications.length === 0) {
            var isSearching = !!keyword;
            setListSummary(isSearching
                ? t("portal.dynamic.noApplicationsForSearch", "No applications match your keyword.")
                : t("portal.dynamic.noApplicationsForPostedJobs", "No applications submitted for your jobs yet."));
            listNode.appendChild(createEmptyState(isSearching));
            syncSearchFormVisibility();
            return;
        }

        if (state.approximateOnly && keyword) {
            showMessage(t("portal.dynamic.closestMatchesNotice", "No exact matches. Showing closest results."), "success");
        } else {
            hideMessage();
        }

        if (state.viewMode === VIEW_MODE_APPLICATION_DETAIL) {
            var selectedApplication = findApplicationById(state.selectedApplicationId);
            if (selectedApplication) {
                renderApplicationDetailView(selectedApplication);
                syncSearchFormVisibility();
                return;
            }
            state.selectedApplicationId = "";
            state.viewMode = VIEW_MODE_COURSE_DETAIL;
        }

        if (state.viewMode === VIEW_MODE_COURSE_DETAIL) {
            var selectedGroup = getCourseGroupByCode(state.selectedCourseCode);
            if (selectedGroup) {
                renderCourseDetailView(selectedGroup);
                syncSearchFormVisibility();
                return;
            }
            resetViewSelection();
        }

        renderCourseListView(state.courseGroups);
        syncSearchFormVisibility();
    }

    function renderCourseListView(courseGroups) {
        setListSummary(buildCourseListSummaryText(courseGroups.length, state.applications.length));

        var courseList = document.createElement("div");
        courseList.className = "course-group-list";

        courseGroups.forEach(function (group) {
            courseList.appendChild(createCourseCard(group));
        });

        listNode.appendChild(courseList);
    }

    function renderCourseDetailView(group) {
        setListSummary(buildCourseDetailSummaryText(group));

        var view = document.createElement("section");
        view.className = "course-detail-view";
        view.appendChild(createBackButton(
            t("portal.moApplicantSelection.backToCourseList", "Back to course list"),
            function () {
                resetViewSelection();
                renderCurrentView(state.applications);
            }
        ));

        view.appendChild(createCourseDetailOverview(group));

        var heading = document.createElement("h3");
        heading.className = "course-detail-heading";
        heading.textContent = t("portal.moApplicantSelection.courseApplicants", "Applicants");
        view.appendChild(heading);

        var applicantList = document.createElement("div");
        applicantList.className = "course-applicant-list";
        group.applications.forEach(function (application) {
            applicantList.appendChild(createApplicantListItem(application));
        });
        view.appendChild(applicantList);

        listNode.appendChild(view);
    }

    function renderApplicationDetailView(application) {
        setListSummary(t("portal.moApplicantSelection.applicationDetail", "Application detail"));

        var applicationId = safeText(application.applicationId, "");
        var detail = state.applicantDetailsByApplicationId[applicationId];
        var view = document.createElement("section");
        view.className = "single-application-view";

        view.appendChild(createBackButton(
            t("portal.moApplicantSelection.backToApplicantList", "Back to applicant list"),
            function () {
                state.viewMode = VIEW_MODE_COURSE_DETAIL;
                state.selectedApplicationId = "";
                renderCurrentView(state.applications);
            }
        ));

        var lead = document.createElement("p");
        lead.className = "single-application-lead";
        lead.textContent = t(
            "portal.moApplicantSelection.applicationDetailLead",
            "Review applicant profile and complete your decision."
        );
        view.appendChild(lead);

        view.appendChild(createApplicationCard(application, detail));
        listNode.appendChild(view);
    }

    function createBackButton(label, onClick) {
        var backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "selection-back-btn";
        backButton.textContent = "← " + label;
        backButton.addEventListener("click", onClick);
        return backButton;
    }

    function courseMetricSvgClock() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<circle cx=\"12\" cy=\"12\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></circle>" +
            "<path d=\"M12 7.5V12l3 1.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function courseMetricSvgUsers() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<circle cx=\"9\" cy=\"7\" r=\"3.25\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></circle>" +
            "<path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<path d=\"M16 3.13a4 4 0 0 1 0 7.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function courseMetricSvgInbox() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\" ry=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></rect>" +
            "<path d=\"M4 9h16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></path>" +
            "<path d=\"M9 14h6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function courseMetricSvgBriefcase() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></path>" +
            "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></rect>" +
            "<path d=\"M12 11v4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function courseMetricSvgCheck() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M20 6L9 17l-5-5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>" +
            "</svg>";
    }

    function courseMetricSvgX() {
        return "<svg class=\"course-metric-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M18 6L6 18M6 6l12 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function overviewStatSvgClock() {
        return "<svg class=\"course-overview-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<circle cx=\"12\" cy=\"12\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></circle>" +
            "<path d=\"M12 7.5V12l3 1.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function overviewStatSvgUsers() {
        return "<svg class=\"course-overview-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<circle cx=\"9\" cy=\"7\" r=\"3.25\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></circle>" +
            "<path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<path d=\"M16 3.13a4 4 0 0 1 0 7.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function overviewStatSvgCalendar() {
        return "<svg class=\"course-overview-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></rect>" +
            "<path d=\"M3.5 9.5h17\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></path>" +
            "<path d=\"M8 3v4M16 3v4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<circle cx=\"9\" cy=\"14\" r=\"1.25\" fill=\"currentColor\"></circle>" +
            "<circle cx=\"15\" cy=\"14\" r=\"1.25\" fill=\"currentColor\"></circle>" +
            "</svg>";
    }

    function applicationMetaStatSvgBriefcase() {
        return "<svg class=\"application-meta-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></path>" +
            "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></rect>" +
            "<path d=\"M12 11v4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function applicationMetaStatSvgCourse() {
        return "<svg class=\"application-meta-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M5 6.5A2.5 2.5 0 0 1 7.5 4H19v14.5H7.5A2.5 2.5 0 0 0 5 21z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linejoin=\"round\"></path>" +
            "<path d=\"M8.5 8.5h6M8.5 12h6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function applicationMetaStatSvgCalendar() {
        return "<svg class=\"application-meta-stat-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></rect>" +
            "<path d=\"M3.5 9.5h17\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></path>" +
            "<path d=\"M8 3v4M16 3v4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "<circle cx=\"9\" cy=\"14\" r=\"1.25\" fill=\"currentColor\"></circle>" +
            "<circle cx=\"15\" cy=\"14\" r=\"1.25\" fill=\"currentColor\"></circle>" +
            "</svg>";
    }

    function createApplicationMetaStat(modifierClass, iconSvg, label, value) {
        var safeLabel = safeText(label, "");
        var safeValue = safeText(value, "—");
        var safeModifierClass = safeText(modifierClass, "").trim();
        var titleText = safeLabel ? safeLabel + ": " + safeValue : safeValue;
        return "<div class=\"application-meta-stat " + escapeHtml(safeModifierClass) + "\" title=\"" + escapeHtml(titleText) + "\">" +
            "<span class=\"application-meta-stat-icon-wrap\" aria-hidden=\"true\">" + iconSvg + "</span>" +
            "<div class=\"application-meta-stat-text\">" +
                "<span class=\"application-meta-stat-label\">" + escapeHtml(safeLabel) + "</span>" +
                "<span class=\"application-meta-stat-value\">" + escapeHtml(safeValue) + "</span>" +
            "</div>" +
            "</div>";
    }

    function overviewHeadingSvgTarget() {
        return "<svg class=\"course-overview-heading-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<circle cx=\"12\" cy=\"12\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\"></circle>" +
            "<circle cx=\"12\" cy=\"12\" r=\"3.25\" fill=\"currentColor\" opacity=\"0.22\"></circle>" +
            "</svg>";
    }

    function overviewHeadingSvgStar() {
        return "<svg class=\"course-overview-heading-svg course-overview-heading-svg--star\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path fill=\"currentColor\" d=\"M12 2.5l2.6 7.4h7.8l-6.3 4.8 2.4 7.8L12 16.9l-6.5 4.6 2.4-7.8-6.3-4.8h7.8z\"></path>" +
            "</svg>";
    }

    function formatOverviewDate(iso) {
        if (typeof iso !== "string" || !iso.trim()) {
            return "";
        }
        var date = new Date(iso);
        if (isNaN(date.getTime())) {
            return iso.trim();
        }
        var loc = "en";
        if (window.AppI18n && typeof window.AppI18n.getLocale === "function") {
            loc = window.AppI18n.getLocale() || "en";
        }
        if (loc === "zh-CN") {
            return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
        }
        try {
            return date.toLocaleDateString(loc === "en" ? "en-US" : loc, {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch (e) {
            return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
        }
    }

    function createCourseMetric(iconSvg, text, srLabel, stackLabel) {
        var label = safeText(srLabel, "");
        var titleAttr = label ? " title=\"" + escapeHtml(label) + "\"" : "";
        var stack = stackLabel != null && String(stackLabel).trim().length > 0 ? String(stackLabel).trim() : "";
        if (stack) {
            return "<span class=\"course-metric course-metric--stacked\"" + titleAttr + ">" +
                iconSvg +
                "<span class=\"course-metric-body\">" +
                "<span class=\"course-metric-label\">" + escapeHtml(stack) + "</span>" +
                "<span class=\"course-metric-text\">" + escapeHtml(text) + "</span>" +
                "</span></span>";
        }
        return "<span class=\"course-metric\"" + titleAttr + ">" +
            iconSvg +
            "<span class=\"course-metric-text\">" + escapeHtml(text) + "</span>" +
            "</span>";
    }

    function createCourseCard(group) {
        var card = document.createElement("article");
        card.className = "course-card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute(
            "aria-label",
            t("portal.moApplicantSelection.openCourseApplicants", "View applicants for") + " " + group.courseDisplayName
        );

        var workloadText = safeText(group.workload, "-");
        var workloadLabel = t("portal.common.workload", "Workload");
        var applicantsLabel = t("portal.moApplicantSelection.applicantsLabel", "Applicants");
        var pendingLabel = t("portal.common.pending", "Pending");
        card.innerHTML =
            "<div class=\"course-card-badge\">" + escapeHtml(buildCourseBadgeText(group.courseCode)) + "</div>" +
            "<div class=\"course-card-main\">" +
                "<h3>" + escapeHtml(group.courseDisplayName) + "</h3>" +
                "<p class=\"course-card-subtitle\">" +
                    escapeHtml(safeText(group.moName, t("portal.moApplicantSelection.courseOwnerFallback", "Module owner unavailable"))) +
                "</p>" +
            "</div>" +
            "<div class=\"course-card-meta\">" +
                "<div class=\"course-card-metrics\" role=\"presentation\">" +
                    createCourseMetric(courseMetricSvgClock(), workloadText, workloadLabel + ": " + workloadText) +
                    createCourseMetric(courseMetricSvgUsers(), String(group.total), applicantsLabel + ": " + String(group.total)) +
                    createCourseMetric(courseMetricSvgInbox(), String(group.pending), pendingLabel + ": " + String(group.pending)) +
                "</div>" +
                "<span class=\"course-card-arrow\" aria-hidden=\"true\">›</span>" +
            "</div>";

        card.addEventListener("click", function () {
            openCourseDetail(group.courseCode);
        });
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCourseDetail(group.courseCode);
            }
        });

        return card;
    }

    function createCourseDetailOverview(group) {
        var overview = document.createElement("article");
        overview.className = "course-overview-card";

        var jobSummary = group.jobTitles.length
            ? group.jobTitles.join(" · ")
            : t("portal.moApplicantSelection.noJobTitle", "No job title available");

        var wl = safeText(group.workload, "—");
        var wlL = t("portal.common.workload", "Workload");
        var wlTitle = t(
            "portal.moApplicantSelection.courseOverviewWorkloadTitle",
            "Weekly workload shown on the posting (e.g. hours per week)."
        );
        var wlTip = wlTitle + " " + wlL + ": " + wl;

        var appShort = t("portal.moApplicantSelection.courseOverviewApplicationsLabel", "Applications");
        var appTitle = t(
            "portal.moApplicantSelection.courseOverviewApplicationsTitle",
            "Total applications submitted across all TA postings for this course."
        );
        var appTip = appTitle + " " + appShort + ": " + String(group.total);

        var deadlineTitle = t(
            "portal.moApplicantSelection.courseOverviewDeadlineTitle",
            "Earliest application deadline across TA postings for this course."
        );
        var deadlineDisplay = group.overviewDeadlineIso
            ? formatOverviewDate(group.overviewDeadlineIso)
            : t("portal.moApplicantSelection.courseOverviewNoDeadline", "Not set");
        var deadlineTip = group.overviewDeadlineIso
            ? deadlineTitle + " " + deadlineDisplay
            : deadlineTitle;

        var accL = t("portal.common.accepted", "Accepted");
        var rejL = t("portal.common.rejected", "Rejected");

        var moKicker = t("portal.moApplicantSelection.courseOverviewMoLabel", "Module organizer");
        var rolesKicker = t("portal.moApplicantSelection.courseOverviewRolesLabel", "Posted TA roles");

        var descHeading = t("portal.moApplicantSelection.courseOverviewDescriptionHeading", "Job description");
        var descBody = safeText(group.overviewDescription, "");
        var descFallback = t("portal.moApplicantSelection.courseOverviewNoDescription", "No description available.");

        var skillsHeading = t("portal.moApplicantSelection.courseOverviewSkillsHeading", "Required skills");
        var skillsFallback = t("portal.moApplicantSelection.courseOverviewNoSkills", "No required skills listed.");

        var skillTags = (group.requiredSkillTags || []).map(function (skill) {
            return "<span class=\"course-job-tag course-overview-skill-tag\">" + escapeHtml(skill) + "</span>";
        }).join("");

        var reviewNote =
            "<p class=\"course-overview-review-note\">" +
            escapeHtml(accL) +
            " " +
            String(group.accepted) +
            " · " +
            escapeHtml(rejL) +
            " " +
            String(group.rejected) +
            "</p>";

        overview.innerHTML =
            "<div class=\"course-overview-top\">" +
                "<div class=\"course-card-badge course-card-badge-large\">" + escapeHtml(buildCourseBadgeText(group.courseCode)) + "</div>" +
                "<div class=\"course-overview-main\">" +
                    "<h2>" + escapeHtml(group.courseDisplayName) + "</h2>" +
                    "<p class=\"course-overview-instructor\">" +
                        "<span class=\"course-overview-kicker\">" + escapeHtml(moKicker) + "</span> " +
                        escapeHtml(safeText(group.moName, t("portal.moApplicantSelection.courseOwnerFallback", "Module owner unavailable"))) +
                    "</p>" +
                    "<p class=\"course-overview-job-line\">" +
                        "<span class=\"course-overview-kicker\">" + escapeHtml(rolesKicker) + "</span> " +
                        "<span class=\"course-overview-job-text\">" + escapeHtml(jobSummary) + "</span>" +
                    "</p>" +
                "</div>" +
            "</div>" +
            "<div class=\"course-overview-stats\" role=\"presentation\">" +
                "<div class=\"course-overview-stat course-overview-stat--workload\" title=\"" + escapeHtml(wlTip) + "\">" +
                    "<span class=\"course-overview-stat-icon-wrap\" aria-hidden=\"true\">" + overviewStatSvgClock() + "</span>" +
                    "<div class=\"course-overview-stat-text\">" +
                        "<span class=\"course-overview-stat-label\">" + escapeHtml(wlL) + "</span>" +
                        "<span class=\"course-overview-stat-value\">" + escapeHtml(wl) + "</span>" +
                    "</div>" +
                "</div>" +
                "<div class=\"course-overview-stat course-overview-stat--applicants\" title=\"" + escapeHtml(appTip) + "\">" +
                    "<span class=\"course-overview-stat-icon-wrap\" aria-hidden=\"true\">" + overviewStatSvgUsers() + "</span>" +
                    "<div class=\"course-overview-stat-text\">" +
                        "<span class=\"course-overview-stat-label\">" + escapeHtml(appShort) + "</span>" +
                        "<span class=\"course-overview-stat-value\">" + escapeHtml(String(group.total)) + "</span>" +
                    "</div>" +
                "</div>" +
                "<div class=\"course-overview-stat course-overview-stat--deadline\" title=\"" + escapeHtml(deadlineTip) + "\">" +
                    "<span class=\"course-overview-stat-icon-wrap\" aria-hidden=\"true\">" + overviewStatSvgCalendar() + "</span>" +
                    "<div class=\"course-overview-stat-text\">" +
                        "<span class=\"course-overview-stat-label\">" + escapeHtml(t("portal.common.deadline", "Deadline")) + "</span>" +
                        "<span class=\"course-overview-stat-value\">" + escapeHtml(deadlineDisplay) + "</span>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            reviewNote +
            "<section class=\"course-overview-section\" aria-labelledby=\"course-overview-desc-heading\">" +
                "<h3 id=\"course-overview-desc-heading\" class=\"course-overview-section-heading\">" +
                    overviewHeadingSvgTarget() +
                    "<span>" + escapeHtml(descHeading) + "</span>" +
                "</h3>" +
                "<div class=\"course-overview-section-body" + (descBody ? "" : " course-overview-section-body--muted") + "\">" +
                    escapeHtml(descBody || descFallback) +
                "</div>" +
            "</section>" +
            "<section class=\"course-overview-section\" aria-labelledby=\"course-overview-skills-heading\">" +
                "<h3 id=\"course-overview-skills-heading\" class=\"course-overview-section-heading\">" +
                    overviewHeadingSvgStar() +
                    "<span>" + escapeHtml(skillsHeading) + "</span>" +
                "</h3>" +
                "<div class=\"course-overview-skills" + (skillTags ? "" : " course-overview-skills--empty") + "\">" +
                    (skillTags || ("<span class=\"course-overview-skills-fallback\">" + escapeHtml(skillsFallback) + "</span>")) +
                "</div>" +
            "</section>";

        return overview;
    }

    function createApplicantListItem(application) {
        var item = document.createElement("article");
        var applicationId = safeText(application.applicationId, "");
        var detail = state.applicantDetailsByApplicationId[applicationId];
        var profileName = detail ? safeText(detail.fullName, "") : "";
        var applicantName = profileName || safeText(application.applicantName, t("portal.moApplicantSelection.unknownApplicant", "Unknown applicant"));
        var applicantEmail = safeText(application.applicantEmail, "-");
        var status = safeText(application.status, "PENDING").toUpperCase();
        var statusClass = getStatusClass(status);

        item.className = "course-applicant-item course-applicant-item--status-" + statusClass;

        var skills = detail && Array.isArray(detail.skills) ? detail.skills.slice(0, 3) : [];
        var skillsMarkup = skills.map(function (skill) {
            return "<span class=\"course-applicant-skill\">" + escapeHtml(safeText(skill, "")) + "</span>";
        }).join("");

        var statusLabel = getStatusDisplayLabel(status);

        var ariaStatus =
            status === "PENDING"
                ? t("portal.common.pending", "Pending")
                : status === "ACCEPTED"
                    ? t("portal.common.accepted", "Accepted")
                    : status === "REJECTED"
                        ? t("portal.common.rejected", "Rejected")
                        : status === "WITHDRAWN"
                            ? t("portal.common.withdrawn", "Withdrawn")
                            : status;

        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        item.setAttribute(
            "aria-label",
            t("portal.moApplicantSelection.openApplicationDetail", "Open application detail for") +
                " " +
                applicantName +
                " (" +
                ariaStatus +
                ")"
        );

        var nameTrim = safeText(applicantName, "").trim();
        var avatarLetter = nameTrim ? nameTrim.charAt(0).toUpperCase() : "?";

        item.innerHTML =
            "<div class=\"course-applicant-lead\">" +
                "<div class=\"course-applicant-avatar\" aria-hidden=\"true\">" + escapeHtml(avatarLetter) + "</div>" +
                "<div class=\"course-applicant-text\">" +
                    "<p class=\"course-applicant-name\">" + escapeHtml(applicantName) + "</p>" +
                    "<p class=\"course-applicant-email\">" + escapeHtml(applicantEmail) + "</p>" +
                "</div>" +
            "</div>" +
            "<div class=\"" +
                (skillsMarkup ? "course-applicant-skills" : "course-applicant-skills course-applicant-skills--empty") +
                "\" role=\"presentation\">" +
                skillsMarkup +
            "</div>" +
            "<div class=\"course-applicant-trail\">" +
                "<span class=\"status-pill status-" + escapeHtml(statusClass) + "\">" +
                    escapeHtml(statusLabel) +
                "</span>" +
            "</div>";

        item.addEventListener("click", function () {
            openApplicationDetail(applicationId);
        });
        item.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openApplicationDetail(applicationId);
            }
        });

        return item;
    }

    function openCourseDetail(courseCode) {
        state.selectedCourseCode = courseCode;
        state.selectedApplicationId = "";
        state.viewMode = VIEW_MODE_COURSE_DETAIL;
        renderCurrentView(state.applications);
    }

    function openApplicationDetail(applicationId) {
        if (!applicationId) {
            return;
        }
        var application = findApplicationById(applicationId);
        if (!application) {
            return;
        }
        state.selectedApplicationId = applicationId;
        state.selectedCourseCode = getCourseCodeForApplication(application);
        state.viewMode = VIEW_MODE_APPLICATION_DETAIL;
        renderCurrentView(state.applications);
    }

    function groupApplicationsByCourse(applications) {
        if (!Array.isArray(applications) || applications.length === 0) {
            return [];
        }
        var groupsByCode = {};

        applications.forEach(function (application) {
            var courseCode = getCourseCodeForApplication(application);
            if (!groupsByCode[courseCode]) {
                groupsByCode[courseCode] = createCourseGroup(courseCode);
            }

            var group = groupsByCode[courseCode];
            var status = safeText(application.status, "PENDING").toUpperCase();
            var jobId = safeText(application.jobId, "");
            var jobMeta = jobId ? state.jobsById[jobId] : null;
            var jobTitle = safeText(application.jobTitle, safeText(jobMeta ? jobMeta.title : "", ""));
            var courseName = safeText(jobMeta ? jobMeta.courseName : "", "");
            var workload = safeText(jobMeta ? jobMeta.workload : "", "");
            var moName = safeText(jobMeta ? jobMeta.moName : "", safeText(application.moName, ""));

            group.applications.push(application);
            group.total += 1;
            if (status === "PENDING") {
                group.pending += 1;
            } else if (status === "ACCEPTED") {
                group.accepted += 1;
            } else if (status === "REJECTED") {
                group.rejected += 1;
            }

            if (jobId) {
                pushUnique(group.jobIds, jobId);
            }
            if (jobTitle) {
                pushUnique(group.jobTitles, jobTitle);
            }
            if (!group.courseName && courseName) {
                group.courseName = courseName;
            }
            if (!group.workload && workload) {
                group.workload = workload;
            }
            if (!group.moName && moName) {
                group.moName = moName;
            }
        });

        return Object.keys(groupsByCode)
            .map(function (courseCode) {
                var group = groupsByCode[courseCode];
                group.courseDisplayName = buildCourseDisplayName(group.courseCode, group.courseName);
                enrichCourseGroupOverviewFromJobs(group);
                group.applications.sort(compareApplicationsByAppliedAtDesc);
                return group;
            })
            .sort(function (a, b) {
                return a.courseCode.localeCompare(b.courseCode);
            });
    }

    function enrichCourseGroupOverviewFromJobs(group) {
        var description = "";
        var earliestMs = NaN;
        var earliestIso = "";
        var skills = [];
        var seenSkill = {};

        if (!group || !Array.isArray(group.jobIds)) {
            return;
        }

        group.jobIds.forEach(function (jobId) {
            var job = state.jobsById[jobId];
            if (!job) {
                return;
            }
            var desc = safeText(job.description, "");
            if (!description && desc) {
                description = desc;
            }
            var dl = safeText(job.deadline, "");
            if (dl) {
                var ms = Date.parse(dl);
                if (!isNaN(ms) && (isNaN(earliestMs) || ms < earliestMs)) {
                    earliestMs = ms;
                    earliestIso = dl;
                }
            }
            var rs = job.requiredSkills;
            if (typeof rs === "string" && rs.trim()) {
                rs.split(/[,;]/).forEach(function (part) {
                    var s = part.trim();
                    if (!s || skills.length >= 16) {
                        return;
                    }
                    var key = s.toLowerCase();
                    if (seenSkill[key]) {
                        return;
                    }
                    seenSkill[key] = true;
                    skills.push(s);
                });
            }
        });

        group.overviewDescription = description;
        group.overviewDeadlineIso = earliestIso;
        group.requiredSkillTags = skills;
    }

    function createCourseGroup(courseCode) {
        return {
            courseCode: courseCode,
            courseName: "",
            courseDisplayName: courseCode,
            workload: "",
            moName: "",
            jobIds: [],
            jobTitles: [],
            applications: [],
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
            overviewDescription: "",
            overviewDeadlineIso: "",
            requiredSkillTags: []
        };
    }

    function getCourseGroupByCode(courseCode) {
        if (!courseCode || !Array.isArray(state.courseGroups)) {
            return null;
        }
        for (var i = 0; i < state.courseGroups.length; i += 1) {
            if (state.courseGroups[i].courseCode === courseCode) {
                return state.courseGroups[i];
            }
        }
        return null;
    }

    function getCourseCodeForApplication(application) {
        return safeText(
            application && application.courseCode,
            t("portal.moApplicantSelection.unknownCourseCode", "Unknown course")
        );
    }

    function findApplicationById(applicationId) {
        if (!applicationId || !Array.isArray(state.applications)) {
            return null;
        }
        for (var i = 0; i < state.applications.length; i += 1) {
            if (safeText(state.applications[i].applicationId, "") === applicationId) {
                return state.applications[i];
            }
        }
        return null;
    }

    function compareApplicationsByAppliedAtDesc(a, b) {
        var left = Date.parse(safeText(a.appliedAt, ""));
        var right = Date.parse(safeText(b.appliedAt, ""));
        if (isNaN(left) && isNaN(right)) {
            return 0;
        }
        if (isNaN(left)) {
            return 1;
        }
        if (isNaN(right)) {
            return -1;
        }
        return right - left;
    }

    function pushUnique(items, value) {
        if (!value || items.indexOf(value) !== -1) {
            return;
        }
        items.push(value);
    }

    function buildCourseDisplayName(courseCode, courseName) {
        if (!courseName) {
            return courseCode;
        }
        return courseCode + " - " + courseName;
    }

    function buildCourseListSummaryText(courseCount, applicationCount) {
        return t("portal.dynamic.showing", "Showing") +
            " " + courseCount +
            " " + buildUnitText(courseCount, t("portal.moApplicantSelection.courseUnit", "course")) +
            " · " +
            applicationCount + " " +
            buildUnitText(applicationCount, t("portal.dynamic.applicationUnit", "application")) +
            ".";
    }

    function buildCourseDetailSummaryText(group) {
        return t("portal.moApplicantSelection.courseApplicants", "Applicants") +
            ": " + group.total +
            " · " + t("portal.common.pending", "Pending") + " " + group.pending +
            " · " + t("portal.common.accepted", "Accepted") + " " + group.accepted +
            " · " + t("portal.common.rejected", "Rejected") + " " + group.rejected;
    }

    function buildUnitText(count, singularUnit) {
        var unit = singularUnit;
        if (useEnglishPluralSuffix() && count !== 1) {
            unit += "s";
        }
        return unit;
    }

    function buildCourseBadgeText(courseCode) {
        var code = safeText(courseCode, "");
        var letters = code.replace(/[^a-zA-Z]/g, "");
        if (letters) {
            return letters.substring(0, 4).toUpperCase();
        }
        if (!code) {
            return "COUR";
        }
        return code.substring(0, 4).toUpperCase();
    }

    function getStatusDisplayLabel(status) {
        var s = safeText(status, "PENDING").toUpperCase();
        if (s === "PENDING") {
            return t("portal.common.pending", "Pending");
        }
        if (s === "ACCEPTED") {
            return t("portal.common.accepted", "Accepted");
        }
        if (s === "REJECTED") {
            return t("portal.common.rejected", "Rejected");
        }
        if (s === "WITHDRAWN") {
            return t("portal.common.withdrawn", "Withdrawn");
        }
        return s;
    }

    function reviewBtnIconCheck() {
        return "<svg class=\"review-btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M20 6L9 17l-5-5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>" +
            "</svg>";
    }

    function reviewBtnIconX() {
        return "<svg class=\"review-btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M18 6L6 18M6 6l12 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function materialDocIconSvg() {
        return "<svg class=\"material-doc-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">" +
            "<path d=\"M14 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-6-6z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linejoin=\"round\"></path>" +
            "<path d=\"M14 2v6h6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linejoin=\"round\"></path>" +
            "<path d=\"M10 13h8M10 17h6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\"></path>" +
            "</svg>";
    }

    function createApplicationCard(application, detail) {
        var card = document.createElement("article");
        card.className = "application-card";

        var applicationId = safeText(application.applicationId, "");
        var status = safeText(application.status, "PENDING").toUpperCase();
        var progressStage = safeText(application.progressStage, "SUBMITTED").toUpperCase();
        var statusClass = getStatusClass(status);
        var reviewingThis = state.reviewingId && state.reviewingId === applicationId;
        var profileName = detail ? safeText(detail.fullName, "") : "";
        var applicantDisplayName = profileName || safeText(application.applicantName, t("portal.moApplicantSelection.unknownApplicant", "Unknown applicant"));
        var nameTrim = safeText(applicantDisplayName, "").trim();
        var avatarLetter = nameTrim ? nameTrim.charAt(0).toUpperCase() : "?";
        var profileUpdatedAt = detail ? safeText(detail.profileUpdatedAt, "") : "";
        var profileSyncHint = profileUpdatedAt
            ? "<p class=\"application-sync-hint\">" +
                escapeHtml(t("portal.moApplicantSelection.profileSyncedAt", "Profile synced at")) + " " +
                escapeHtml(formatDateTime(profileUpdatedAt)) +
              "</p>"
            : "";
        var coverLetter = safeText(application.coverLetter, "");
        var coverLetterText = coverLetter
            ? shortenText(coverLetter, 280)
            : t("portal.moApplicantSelection.noCoverLetter", "No cover letter provided.");
        var jobLabel = t("portal.moApplicantSelection.job", "Job");
        var courseLabel = t("portal.common.courseCode", "Course code");
        var appliedLabel = t("portal.moApplicantSelection.appliedAtLabel", "Applied at");
        var jobTitleFallback = t("portal.moApplicantSelection.noJobTitle", "No job title available");
        var coverLetterSectionLabel = t("portal.taJobDetail.coverLetter", "Cover letter");
        var jobValue = safeText(application.jobTitle, jobTitleFallback);
        var courseValue = safeText(application.courseCode, "-");
        var appliedValue = formatDateTime(application.appliedAt);
        var aiState = getApplicationAiState(applicationId);
        var aiPanelId = buildApplicationAiPanelId(applicationId);
        var aiTriggerLabel = aiState.loading
            ? t("portal.moApplicantSelection.aiAnalyzing", "AI...")
            : aiState.expanded
                ? t("portal.moApplicantSelection.aiHide", "Hide AI")
                : t("portal.moApplicantSelection.aiShow", "AI");

        card.innerHTML =
            "<header class=\"application-card-head\">" +
                "<div class=\"application-avatar\" aria-hidden=\"true\">" + escapeHtml(avatarLetter) + "</div>" +
                "<div class=\"application-head-body\">" +
                    "<div class=\"application-head-top\">" +
                        "<div class=\"application-heading\">" +
                            "<h3 class=\"application-name\">" + escapeHtml(applicantDisplayName) + "</h3>" +
                            "<p class=\"application-email\">" + escapeHtml(safeText(application.applicantEmail, "-")) + "</p>" +
                            profileSyncHint +
                        "</div>" +
                        "<div class=\"application-head-actions\">" +
                            "<button class=\"application-ai-trigger" + (aiState.expanded ? " is-expanded" : "") + "\" " +
                                "type=\"button\" data-ai-action=\"toggle\" data-id=\"" + escapeHtml(applicationId) + "\" " +
                                "aria-expanded=\"" + (aiState.expanded ? "true" : "false") + "\" " +
                                "aria-controls=\"" + escapeHtml(aiPanelId) + "\" " +
                                "aria-label=\"" + escapeHtml(aiTriggerLabel) + "\" " +
                                "title=\"" + escapeHtml(t("portal.moApplicantSelection.aiChat", "Ask AI")) + "\">" +
                                "<span aria-hidden=\"true\">AI</span>" +
                            "</button>" +
                            "<span class=\"status-pill status-" + escapeHtml(statusClass) + "\">" +
                                escapeHtml(getStatusDisplayLabel(status)) +
                            "</span>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</header>" +
            "<div class=\"application-meta-card\">" +
                "<div class=\"application-meta\" role=\"presentation\">" +
                    createApplicationMetaStat("application-meta-stat--job", applicationMetaStatSvgBriefcase(), jobLabel, jobValue) +
                    createApplicationMetaStat("application-meta-stat--course", applicationMetaStatSvgCourse(), courseLabel, courseValue) +
                    createApplicationMetaStat("application-meta-stat--applied", applicationMetaStatSvgCalendar(), appliedLabel, appliedValue) +
                "</div>" +
            "</div>" +
            buildApplicationAiPanel(application, aiState, aiPanelId) +
            buildDetailBlock(detail, applicationId, profileUpdatedAt) +
            "<div class=\"cover-letter-block\">" +
                "<p class=\"cover-letter-label\">" + escapeHtml(coverLetterSectionLabel) + "</p>" +
                "<p class=\"cover-letter-content\">" + escapeHtml(coverLetterText) + "</p>" +
            "</div>" +
            buildReviewActionsHtml(status, progressStage, applicationId, reviewingThis);

        if (status === "PENDING" && applicationId) {
            card.querySelectorAll("button[data-action]").forEach(function (btn) {
                var action = btn.getAttribute("data-action");
                btn.addEventListener("click", function () {
                    if (action === "start_review") {
                        handleProgressAction(applicationId, action);
                    } else if (action === "accept" || action === "reject") {
                        handleReview(applicationId, action);
                    }
                });
            });
        }

        var aiToggleButton = card.querySelector("button[data-ai-action=\"toggle\"]");
        if (aiToggleButton) {
            aiToggleButton.addEventListener("click", function () {
                toggleApplicationAiPanel(application);
            });
        }

        var aiRefreshButton = card.querySelector("button[data-ai-action=\"refresh\"]");
        if (aiRefreshButton) {
            aiRefreshButton.addEventListener("click", function () {
                requestApplicationAiAnalysis(application, true);
            });
        }

        return card;
    }

    function getApplicationAiState(applicationId) {
        var key = safeText(applicationId, "");
        if (!key) {
            return {
                expanded: false,
                loading: false,
                result: null,
                statusMessage: "",
                statusType: "error"
            };
        }
        if (!state.aiByApplicationId[key]) {
            state.aiByApplicationId[key] = {
                expanded: false,
                loading: false,
                result: null,
                statusMessage: "",
                statusType: "error"
            };
        }
        return state.aiByApplicationId[key];
    }

    function buildApplicationAiPanelId(applicationId) {
        var key = safeText(applicationId, "").replace(/[^a-zA-Z0-9_-]/g, "");
        if (!key) {
            key = "unknown";
        }
        return "mo-application-ai-panel-" + key;
    }

    function toggleApplicationAiPanel(application) {
        var applicationId = safeText(application && application.applicationId, "");
        if (!applicationId) {
            return;
        }
        var aiState = getApplicationAiState(applicationId);
        aiState.expanded = !aiState.expanded;
        renderList(state.applications);
        if (aiState.expanded && !aiState.result && !aiState.loading) {
            requestApplicationAiAnalysis(application, false);
        }
    }

    function requestApplicationAiAnalysis(application, forceRefresh) {
        var applicationId = safeText(application && application.applicationId, "");
        if (!applicationId) {
            return Promise.resolve();
        }

        var aiState = getApplicationAiState(applicationId);
        if (aiState.loading) {
            return Promise.resolve();
        }
        if (aiState.result && !forceRefresh) {
            return Promise.resolve();
        }

        aiState.expanded = true;
        aiState.loading = true;
        aiState.statusMessage = "";
        aiState.statusType = "error";
        renderList(state.applications);

        var formData = new URLSearchParams();
        formData.set("applicationId", applicationId);

        return request(contextPath + "/api/mo/application-match-analysis", {
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
                    var errorMessage = t("portal.dynamic.moAiAnalysisFailed", "Unable to generate AI analysis right now.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    aiState.statusMessage = errorMessage;
                    aiState.statusType = "error";
                    return;
                }

                var data = getPayloadDataObject(payload);
                if (!data || typeof data !== "object") {
                    aiState.statusMessage = t("portal.dynamic.moAiAnalysisFailed", "Unable to generate AI analysis right now.");
                    aiState.statusType = "error";
                    return;
                }

                aiState.result = normalizeApplicationAiResult(data);
                if (aiState.result.fallback) {
                    var fallbackMessage = t(
                        "portal.dynamic.moAiAnalysisFallbackUsed",
                        "AI service is temporarily unavailable. Showing local analysis."
                    );
                    if (aiState.result.fallbackReason) {
                        fallbackMessage += " " + aiState.result.fallbackReason;
                    }
                    aiState.statusMessage = fallbackMessage;
                    aiState.statusType = "success";
                } else {
                    aiState.statusMessage = "";
                }
            })
            .catch(function () {
                aiState.statusMessage = t(
                    "portal.dynamic.moAiAnalysisNetworkError",
                    "Network error while requesting AI analysis."
                );
                aiState.statusType = "error";
            })
            .finally(function () {
                aiState.loading = false;
                renderList(state.applications);
            });
    }

    function buildApplicationAiPanel(application, aiState, panelId) {
        if (!aiState || !aiState.expanded) {
            return "";
        }
        var statusMarkup = "";
        if (aiState.statusMessage) {
            statusMarkup =
                "<div class=\"application-ai-status status-banner " + (aiState.statusType === "success" ? "success" : "error") + "\">" +
                    escapeHtml(aiState.statusMessage) +
                "</div>";
        }
        var loadingMarkup = aiState.loading
            ? "<section class=\"application-ai-loading\" aria-live=\"polite\">" +
                "<span class=\"application-ai-spinner\" aria-hidden=\"true\"></span>" +
                "<p>" + escapeHtml(t("portal.dynamic.loadingMoAiAnalysis", "Analyzing applicant profile and this job...")) + "</p>" +
              "</section>"
            : "";
        var resultMarkup = aiState.result ? buildApplicationAiResult(aiState.result) : "";
        var emptyMarkup = !aiState.loading && !aiState.result
            ? "<p class=\"application-ai-empty\">" +
                escapeHtml(t("portal.dynamic.moAiNoResult", "No analysis result is available yet.")) +
              "</p>"
            : "";

        return "<section class=\"application-ai-panel\" id=\"" + escapeHtml(panelId) + "\" aria-live=\"polite\">" +
            "<div class=\"application-ai-panel-head\">" +
                "<div class=\"application-ai-panel-copy\">" +
                    "<p class=\"application-ai-kicker\">" + escapeHtml(t("portal.moApplicantSelection.aiChat", "Ask AI")) + "</p>" +
                    "<h4 class=\"application-ai-title\">" + escapeHtml(t("portal.moApplicantSelection.aiMatchTitle", "AI matching analysis")) + "</h4>" +
                    "<p class=\"application-ai-subtitle\">" +
                        escapeHtml(
                            t(
                                "portal.moApplicantSelection.aiMatchSubtitle",
                                "Analyze fit between this applicant, cover letter, and job using non-sensitive information."
                            )
                        ) +
                    "</p>" +
                "</div>" +
                "<button class=\"application-ai-refresh\" type=\"button\" data-ai-action=\"refresh\"" +
                    (aiState.loading ? " disabled" : "") + ">" +
                    escapeHtml(t("portal.moApplicantSelection.aiMatchRefresh", "Re-analyze")) +
                "</button>" +
            "</div>" +
            statusMarkup +
            loadingMarkup +
            resultMarkup +
            emptyMarkup +
        "</section>";
    }

    function buildApplicationAiResult(result) {
        return "<section class=\"application-ai-result\">" +
            "<div class=\"application-ai-overview\">" +
                "<article class=\"application-ai-overview-item\">" +
                    "<p>" + escapeHtml(t("portal.moApplicantSelection.aiMatchScoreLabel", "Overall score")) + "</p>" +
                    "<strong>" + escapeHtml(formatApplicationAiScore(result.overallScore)) + "</strong>" +
                "</article>" +
                "<article class=\"application-ai-overview-item\">" +
                    "<p>" + escapeHtml(t("portal.moApplicantSelection.aiMatchLevelLabel", "Level")) + "</p>" +
                    "<strong>" + escapeHtml(applicationAiMatchLevelText(result.matchLevel)) + "</strong>" +
                "</article>" +
            "</div>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchSummaryLabel", "Summary")) + "</h5>" +
                "<p class=\"application-ai-summary\">" +
                    escapeHtml(safeText(result.summary, t("portal.dynamic.aiNoSummary", "No summary is available yet."))) +
                "</p>" +
            "</article>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchStrengthsLabel", "Strengths")) + "</h5>" +
                renderApplicationAiList(result.strengths, t("portal.dynamic.aiNoStrengths", "No clear strengths identified.")) +
            "</article>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchRisksLabel", "Risks")) + "</h5>" +
                renderApplicationAiList(result.risks, t("portal.dynamic.aiNoRisks", "No obvious risks identified.")) +
            "</article>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchSuggestionsLabel", "Suggestions")) + "</h5>" +
                renderApplicationAiList(result.suggestions, t("portal.dynamic.aiNoSuggestions", "No additional suggestions at this time.")) +
            "</article>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchJobEvidenceLabel", "Job evidence")) + "</h5>" +
                renderApplicationAiList(result.jobEvidence, t("portal.dynamic.aiNoJobEvidence", "No job evidence captured.")) +
            "</article>" +
            "<article class=\"application-ai-block\">" +
                "<h5>" + escapeHtml(t("portal.moApplicantSelection.aiMatchProfileEvidenceLabel", "Profile evidence")) + "</h5>" +
                renderApplicationAiList(result.profileEvidence, t("portal.dynamic.aiNoProfileEvidence", "No profile evidence captured.")) +
            "</article>" +
        "</section>";
    }

    function renderApplicationAiList(items, emptyText) {
        var values = normalizeStringArray(items);
        if (!values.length) {
            return "<ul class=\"application-ai-list\"><li>" + escapeHtml(emptyText) + "</li></ul>";
        }
        var listItems = values.map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
        }).join("");
        return "<ul class=\"application-ai-list\">" + listItems + "</ul>";
    }

    function normalizeApplicationAiResult(data) {
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

    function normalizeStringArray(values) {
        if (!Array.isArray(values)) {
            return [];
        }
        var normalized = [];
        values.forEach(function (value) {
            var item = safeText(value, "");
            if (item) {
                normalized.push(item);
            }
        });
        return normalized;
    }

    function formatApplicationAiScore(score) {
        var normalizedScore = Number(score);
        if (isNaN(normalizedScore)) {
            normalizedScore = 0;
        }
        normalizedScore = Math.max(0, Math.min(100, Math.round(normalizedScore)));
        return String(normalizedScore) + "/100";
    }

    function applicationAiMatchLevelText(level) {
        var normalized = safeText(level, "").toUpperCase();
        if (normalized === "HIGH") {
            return t("portal.dynamic.aiMatchLevelHigh", "High");
        }
        if (normalized === "MEDIUM") {
            return t("portal.dynamic.aiMatchLevelMedium", "Medium");
        }
        if (normalized === "LOW") {
            return t("portal.dynamic.aiMatchLevelLow", "Low");
        }
        return normalized;
    }

    function buildReviewActionsHtml(status, progressStage, applicationId, reviewingThis) {
        if (status !== "PENDING") {
            return "";
        }
        var dis = reviewingThis ? " disabled" : "";
        var proc = t("portal.moApplicantSelection.processing", "Processing...");
        var startLabel = reviewingThis ? proc : t("portal.moApplicantSelection.startReview", "Start review");
        var acceptLabel = reviewingThis ? proc : t("portal.moApplicantSelection.hireApplicant", "Hire applicant");
        var rejectLabel = reviewingThis ? proc : t("portal.moApplicantSelection.rejectApplicant", "Reject");

        var row = "<div class=\"review-actions review-actions--staged\">";
        if (progressStage === "SUBMITTED") {
            row += "<div class=\"review-stage-row\">" +
                "<button class=\"stage-btn\" type=\"button\" data-action=\"start_review\" data-id=\"" +
                escapeHtml(applicationId) + "\"" + dis + ">" + escapeHtml(startLabel) + "</button></div>";
        }
        row += "<div class=\"review-decision-row\">" +
            "<button class=\"accept-btn\" type=\"button\" data-action=\"accept\" data-id=\"" +
            escapeHtml(applicationId) + "\"" + dis + ">" +
            reviewBtnIconCheck() +
            "<span class=\"review-btn-text\">" + escapeHtml(acceptLabel) + "</span>" +
            "</button>" +
            "<button class=\"reject-btn\" type=\"button\" data-action=\"reject\" data-id=\"" +
            escapeHtml(applicationId) + "\"" + dis + ">" +
            reviewBtnIconX() +
            "<span class=\"review-btn-text\">" + escapeHtml(rejectLabel) + "</span>" +
            "</button>" +
            "</div></div>";
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

                showMessage("Review started.", "success");
                return true;
            })
            .then(function (shouldReload) {
                if (shouldReload) {
                    return loadApplications({ preserveView: true });
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

    function buildDetailBlock(detail, applicationId, profileUpdatedAtHeader) {
        var profileTitle = t("portal.moApplicantSelection.applicantProfile", "Applicant profile");
        if (!detail) {
            return "<section class=\"applicant-detail-block\">" +
                "<div class=\"detail-panel detail-panel--empty\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(profileTitle) + "</p>" +
                "<p class=\"detail-empty\">" +
                escapeHtml(t("portal.moApplicantSelection.profileUnavailable", "Applicant profile details are temporarily unavailable.")) +
                "</p>" +
                "</div>" +
            "</section>";
        }

        var skills = Array.isArray(detail.skills) ? detail.skills : [];
        var skillsMarkup = skills.length
            ? skills.map(function (skill) {
                return "<span class=\"detail-chip\">" + escapeHtml(safeText(skill, "")) + "</span>";
            }).join("")
            : "<span class=\"detail-chip muted\">" + escapeHtml(t("portal.moApplicantSelection.noSkillsListed", "No skills listed")) + "</span>";

        var materialsLabel = t("portal.moApplicantSelection.applicationMaterials", "Application materials");
        var resumeName = t("portal.moApplicantSelection.resumeDocument", "Resume");
        var resumeHint = t("portal.moApplicantSelection.resumeFormatHint", "Uploaded file");
        var viewResume = t("portal.moApplicantSelection.viewAction", "View");
        var resumeRow = detail.hasResume
            ? "<div class=\"material-row\">" +
                materialDocIconSvg() +
                "<div class=\"material-info\">" +
                    "<span class=\"material-name\">" + escapeHtml(resumeName) + "</span>" +
                    "<span class=\"material-meta\">" + escapeHtml(resumeHint) + "</span>" +
                "</div>" +
                "<a class=\"material-view-link\" href=\"" + contextPath + "/api/applicants/resume?applicationId=" +
                encodeURIComponent(applicationId) + "\" target=\"_blank\" rel=\"noopener\">" +
                escapeHtml(viewResume) +
                "</a>" +
            "</div>"
            : "<p class=\"detail-muted material-empty\">" +
                escapeHtml(t("portal.moApplicantSelection.resumeNotUploaded", "Resume not uploaded")) +
                "</p>";

        var profileSyncSection = "";
        if (!profileUpdatedAtHeader) {
            var profileSyncCopy = detail.profileUpdatedAt
                ? t("portal.moApplicantSelection.profileSyncedAt", "Profile synced at") + " " + formatDateTime(detail.profileUpdatedAt)
                : t("portal.moApplicantSelection.profileSyncHint", "The profile will sync automatically after the applicant saves changes.");
            profileSyncSection =
                "<div class=\"detail-section detail-section--sync\">" +
                    "<p class=\"detail-label\">" + escapeHtml(t("portal.moApplicantSelection.profileSync", "Profile sync")) + "</p>" +
                    "<p class=\"detail-copy\">" + escapeHtml(profileSyncCopy) + "</p>" +
                "</div>";
        }

        return "<section class=\"applicant-detail-block\">" +
            "<div class=\"detail-panel\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(profileTitle) + "</p>" +
                "<div class=\"detail-grid\">" +
                    buildDetailItem(t("portal.taDashboard.department", "Department"), detail.department) +
                    buildDetailItem(t("portal.taDashboard.program", "Program"), detail.program) +
                    buildDetailItem(t("portal.taDashboard.gpa", "GPA"), detail.gpa) +
                    buildDetailItem(t("portal.moApplicantSelection.phone", "Phone"), detail.phone) +
                "</div>" +
            "</div>" +
            "<div class=\"detail-panel detail-panel--skills\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(t("portal.taDashboard.skills", "Skills")) + "</p>" +
                "<div class=\"detail-chips\">" + skillsMarkup + "</div>" +
            "</div>" +
            "<div class=\"detail-panel\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(t("portal.moApplicantSelection.experience", "Experience")) + "</p>" +
                "<p class=\"detail-copy detail-copy--prose\">" +
                    escapeHtml(safeText(detail.experience, t("portal.moApplicantSelection.noExperience", "No experience provided."))) +
                "</p>" +
            "</div>" +
            "<div class=\"detail-panel\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(t("portal.moApplicantSelection.motivationLabel", "Motivation")) + "</p>" +
                "<p class=\"detail-copy detail-copy--prose\">" +
                    escapeHtml(safeText(detail.motivation, t("portal.moApplicantSelection.noMotivation", "No motivation statement provided."))) +
                "</p>" +
            "</div>" +
            "<div class=\"detail-panel detail-panel--materials\">" +
                "<p class=\"detail-panel-title\">" + escapeHtml(materialsLabel) + "</p>" +
                "<div class=\"application-materials-inner\">" + resumeRow + "</div>" +
            "</div>" +
            profileSyncSection +
        "</section>";
    }

    function buildDetailItem(label, value) {
        return "<div class=\"detail-item\">" +
            "<span class=\"detail-item-label\">" + escapeHtml(label) + "</span>" +
            "<strong class=\"detail-item-value\">" + escapeHtml(safeText(value, "-")) + "</strong>" +
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
                    return loadApplications({ preserveView: true });
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

    function setListSummary(text) {
        if (typeof text !== "string" || !text.trim()) {
            listSummaryNode.hidden = true;
            listSummaryNode.textContent = "";
            return;
        }
        listSummaryNode.hidden = false;
        listSummaryNode.textContent = text;
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
