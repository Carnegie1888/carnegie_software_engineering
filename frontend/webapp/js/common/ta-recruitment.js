(function (window) {
    "use strict";

    var namespace = window.TARecruitment || {};

    function parseJson(text, strictJson) {
        if (typeof text !== "string" || !text.trim()) {
            return {};
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            if (strictJson) {
                throw error;
            }
            return {};
        }
    }

    function request(url, options, meta) {
        var settings = options || {};
        var requestMeta = meta || {};
        var parser = typeof requestMeta.parser === "function" ? requestMeta.parser : null;
        var strictJson = requestMeta.strictJson !== false;
        var redirectOnUnauthorized = requestMeta.redirectOnUnauthorized === true;

        return fetch(url, settings).then(function (response) {
            if (redirectOnUnauthorized && response.status === 401) {
                redirectToLogin();
            }
            return response.text().then(function (bodyText) {
                return {
                    response: response,
                    payload: parser ? parser(bodyText) : parseJson(bodyText, strictJson)
                };
            });
        });
    }

    function redirectToLogin(delayMs) {
        window.setTimeout(function () {
            window.location.href = resolveContextPath() + "/login.jsp";
        }, typeof delayMs === "number" ? delayMs : 900);
    }

    function resolveContextPath() {
        if (typeof window.APP_CONTEXT_PATH === "string") {
            return window.APP_CONTEXT_PATH;
        }
        if (typeof window.contextPath === "string") {
            return window.contextPath;
        }
        var meta = document.querySelector("meta[name='context-path']");
        return meta ? meta.getAttribute("content") || "" : "";
    }

    function apiPath(path) {
        return resolveContextPath() + path;
    }

    function appendQuery(url, query) {
        if (!query) {
            return url;
        }
        var parts = [];
        Object.keys(query).forEach(function (key) {
            var value = query[key];
            if (value === null || typeof value === "undefined" || value === "") {
                return;
            }
            parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
        });
        return parts.length ? url + "?" + parts.join("&") : url;
    }

    function safeText(value, fallback) {
        if (value === null || typeof value === "undefined") {
            return typeof fallback === "string" ? fallback : "";
        }
        return String(value);
    }

    function escapeHtml(value) {
        return safeText(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDateTime(value, fallback) {
        if (!value) {
            return typeof fallback === "string" ? fallback : "-";
        }
        return String(value).replace("T", " ").slice(0, 16);
    }

    function formatDate(value, fallback) {
        if (!value) {
            return typeof fallback === "string" ? fallback : "-";
        }
        return String(value).slice(0, 10);
    }

    function formatNumber(value, fallback) {
        var number = Number(value);
        if (!Number.isFinite(number)) {
            return typeof fallback === "string" ? fallback : "0";
        }
        return String(number);
    }

    function normalizeStatus(value) {
        return safeText(value).trim().toUpperCase();
    }

    namespace.api = Object.assign({}, namespace.api, {
        request: request,
        redirectToLogin: redirectToLogin,
        parseJson: parseJson
    });
    namespace.dom = Object.assign({}, namespace.dom, {
        escapeHtml: escapeHtml,
        safeText: safeText
    });
    namespace.format = Object.assign({}, namespace.format, {
        date: formatDate,
        dateTime: formatDateTime,
        number: formatNumber,
        status: normalizeStatus
    });
    namespace.routes = Object.assign({}, namespace.routes, {
        auth: {
            login: function () {
                return apiPath("/api/auth/login");
            },
            register: function () {
                return apiPath("/api/auth/register");
            },
            logout: function () {
                return apiPath("/api/auth/logout");
            },
            availability: function (type, value) {
                return appendQuery(apiPath("/api/auth/availability"), {
                    type: type,
                    value: value
                });
            }
        },
        jobs: {
            list: function (query) {
                return appendQuery(apiPath("/api/jobs"), query);
            },
            detail: function (jobId) {
                return apiPath("/api/jobs/" + encodeURIComponent(jobId));
            },
            item: function (jobId) {
                return this.detail(jobId);
            }
        },
        applications: {
            list: function (query) {
                return appendQuery(apiPath("/api/applications"), query);
            },
            detail: function (applicationId) {
                return apiPath("/api/applications/" + encodeURIComponent(applicationId));
            },
            create: function () {
                return apiPath("/api/applications");
            },
            transition: function (applicationId) {
                return apiPath("/api/applications/" + encodeURIComponent(applicationId) + "/transition");
            },
            applicant: function (applicationId) {
                return apiPath("/api/applications/" + encodeURIComponent(applicationId) + "/" + "applicant");
            },
            applicantResume: function (applicationId) {
                return apiPath("/api/applications/" + encodeURIComponent(applicationId) + "/" + "applicant/resume");
            },
            applicantPhoto: function (applicationId) {
                return apiPath("/api/applications/" + encodeURIComponent(applicationId) + "/" + "applicant/photo");
            }
        },
        me: {
            account: function () {
                return apiPath("/api/me/account");
            },
            avatar: function () {
                return apiPath("/api/me/avatar");
            },
            applicantProfile: function () {
                return apiPath("/api/me/applicant-profile");
            },
            applicantPhoto: function () {
                return apiPath("/api/me/applicant-profile/photo");
            },
            applicantResume: function () {
                return apiPath("/api/me/applicant-profile/resume");
            },
            resumeDraft: function () {
                return apiPath("/api/me/applicant-profile/resume-draft");
            }
        },
        admin: {
            workloadStatistics: function (query) {
                return appendQuery(apiPath("/api/admin/workload-statistics"), query);
            },
            invitations: function () {
                return apiPath("/api/admin/invitations");
            },
            invitationValidation: function (query) {
                return appendQuery(apiPath("/api/admin/invitations/validation"), query);
            },
            invitationAcceptance: function () {
                return apiPath("/api/admin/invitations/acceptance");
            },
            currentInvitationCode: function () {
                return apiPath("/api/admin/invitations/current-code");
            }
        },
        mo: {
            skillMatches: function (jobId) {
                return appendQuery(apiPath("/api/mo/skill-matches"), { jobId: jobId });
            },
            applicantRecommendations: function () {
                return apiPath("/api/mo/applicant-recommendations");
            },
            applicationMatchAnalyses: function () {
                return apiPath("/api/mo/application-match-analyses");
            }
        },
        ta: {
            jobRecommendations: function () {
                return apiPath("/api/ta/job-recommendations");
            },
            jobMatchAnalyses: function () {
                return apiPath("/api/ta/job-match-analyses");
            }
        },
        notifications: function () {
            return apiPath("/api/notifications");
        }
    });

    window.TARecruitment = namespace;
})(window);
