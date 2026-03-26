(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var i18n = window.AppI18n && typeof window.AppI18n.t === "function" ? window.AppI18n : null;

    var inviteForm = document.getElementById("admin-invite-form");
    if (!inviteForm) {
        return;
    }

    var inviteEmailInput = document.getElementById("invite-email");
    var inviteExpireHoursInput = document.getElementById("invite-expire-hours");
    var inviteSubmitButton = document.getElementById("send-invite-btn");
    var inviteMessageNode = document.getElementById("invite-message");
    var inviteResultNode = document.getElementById("invite-result");
    var state = {
        inviteSubmitting: false
    };

    inviteForm.addEventListener("submit", function (event) {
        event.preventDefault();
        createAdminInvite();
    });

    function createAdminInvite() {
        if (state.inviteSubmitting) {
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
            inviteForm.reset();
            if (inviteExpireHoursInput) {
                inviteExpireHoursInput.value = "48";
            }
            if (inviteEmailInput) {
                inviteEmailInput.focus();
            }
        }).catch(function () {
            showInviteMessage(t("portal.dynamic.inviteCreateNetworkError", "Network error while creating invitation."), "error");
        }).finally(function () {
            state.inviteSubmitting = false;
            setInviteSubmitting(false);
        });
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

    function handleUnauthorized() {
        showInviteMessage(t("portal.dynamic.sessionExpiredRedirect", "Session expired. Redirecting to login..."), "error");
        window.setTimeout(function () {
            window.location.href = contextPath + "/login.jsp";
        }, 900);
    }

    function parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
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
