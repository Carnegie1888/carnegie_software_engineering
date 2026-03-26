(function () {
    var USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,19}$/;
    var EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    var PASSWORD_MIN_LENGTH = 6;
    var PASSWORD_MAX_LENGTH = 100;

    var form = document.getElementById("admin-invite-form");
    if (!form) {
        return;
    }

    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var i18n = window.AppI18n && typeof window.AppI18n.t === "function" ? window.AppI18n : null;
    var messageBox = document.getElementById("form-message");
    var inviteStatus = document.getElementById("invite-status");
    var tokenInput = document.getElementById("invite-token");
    var emailInput = document.getElementById("email");
    var inviteCodeInput = document.getElementById("invite-code");
    var usernameInput = document.getElementById("username");
    var passwordInput = document.getElementById("password");
    var confirmPasswordInput = document.getElementById("confirm-password");
    var submitButton = document.getElementById("invite-submit");

    var inviteToken = getQueryParam("token");
    if (tokenInput) {
        tokenInput.value = inviteToken;
    }

    if (inviteToken) {
        validateInvitationByToken(inviteToken);
    } else if (inviteStatus) {
        inviteStatus.textContent = t("adminInvite.status.noToken", "No invitation token detected. Enter your email and invite code.");
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        handleSubmit();
    });

    function handleSubmit() {
        hideMessage();

        var email = trim(emailInput.value).toLowerCase();
        var inviteCode = trim(inviteCodeInput.value).toUpperCase();
        var username = trim(usernameInput.value);
        var password = trim(passwordInput.value);
        var confirmPassword = trim(confirmPasswordInput.value);
        var token = tokenInput ? trim(tokenInput.value) : "";

        if (!email || !EMAIL_PATTERN.test(email)) {
            showMessage(t("adminInvite.msg.invalidEmail", "Please enter a valid email address."), "error");
            emailInput.focus();
            return;
        }
        if (!token && !inviteCode) {
            showMessage(t("adminInvite.msg.needTokenOrCode", "Please provide invitation token or invite code."), "error");
            inviteCodeInput.focus();
            return;
        }
        if (!USERNAME_PATTERN.test(username)) {
            showMessage(t("adminInvite.msg.invalidUsername", "Username must start with a letter and contain 3-20 letters, numbers, or underscores."), "error");
            usernameInput.focus();
            return;
        }
        if (!password || password.length < PASSWORD_MIN_LENGTH) {
            showMessage(t("adminInvite.msg.passwordTooShort", "Password must be at least 6 characters."), "error");
            passwordInput.focus();
            return;
        }
        if (password.length > PASSWORD_MAX_LENGTH) {
            showMessage(t("adminInvite.msg.passwordTooLong", "Password is too long."), "error");
            passwordInput.focus();
            return;
        }
        if (password !== confirmPassword) {
            showMessage(t("adminInvite.msg.passwordMismatch", "Passwords do not match."), "error");
            confirmPasswordInput.focus();
            return;
        }

        setSubmitting(true);
        var formData = new URLSearchParams();
        formData.set("email", email);
        formData.set("username", username);
        formData.set("password", password);
        formData.set("confirmPassword", confirmPassword);
        if (token) {
            formData.set("token", token);
        }
        if (inviteCode) {
            formData.set("inviteCode", inviteCode);
        }

        fetch(contextPath + "/api/admin/invite/accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData.toString()
        }).then(function (response) {
            return response.text().then(function (text) {
                return { response: response, payload: parseJson(text) };
            });
        }).then(function (result) {
            var payload = result.payload;
            if (!result.response.ok || !payload || payload.success !== true) {
                showMessage(payload && payload.message ? payload.message : t("adminInvite.msg.createFailed", "Failed to create admin account."), "error");
                return;
            }

            showMessage(t("adminInvite.msg.createSuccessRedirect", "Admin account created. Redirecting to login..."), "success");
            if (inviteStatus) {
                inviteStatus.textContent = t("adminInvite.status.completed", "Invitation completed successfully.");
            }
            window.setTimeout(function () {
                window.location.href = contextPath + "/login.jsp";
            }, 1200);
        }).catch(function () {
            showMessage(t("adminInvite.msg.networkError", "Network error. Please try again."), "error");
        }).finally(function () {
            setSubmitting(false);
        });
    }

    function validateInvitationByToken(token) {
        var query = new URLSearchParams();
        query.set("token", token);
        fetch(contextPath + "/api/admin/invite/validate?" + query.toString(), {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }).then(function (response) {
            return response.text().then(function (text) {
                return { response: response, payload: parseJson(text) };
            });
        }).then(function (result) {
            if (!result.response.ok || !result.payload || result.payload.success !== true) {
                tokenInput.value = "";
                if (inviteStatus) {
                    inviteStatus.textContent = t("adminInvite.status.invalidOrExpired", "Invitation link is invalid or expired. You can still use email + invite code.");
                }
                return;
            }

            var data = result.payload.data || {};
            if (data.email) {
                emailInput.value = String(data.email).trim();
                emailInput.readOnly = true;
            }
            if (inviteStatus) {
                var suffix = data.expiresAt ? t("adminInvite.status.expiresAtPrefix", " Expires at: ") + data.expiresAt : "";
                inviteStatus.textContent = t("adminInvite.status.validated", "Invitation validated.") + suffix;
            }
        }).catch(function () {
            if (inviteStatus) {
                inviteStatus.textContent = t("adminInvite.status.validateFailed", "Could not validate invitation link. You can use email + invite code.");
            }
        });
    }

    function setSubmitting(submitting) {
        if (submitButton) {
            submitButton.disabled = submitting;
            submitButton.textContent = submitting
                ? t("adminInvite.msg.creating", "Creating...")
                : t("adminInvite.form.submit", "Create admin account");
        }
    }

    function showMessage(message, type) {
        if (!messageBox) {
            return;
        }
        messageBox.textContent = message;
        messageBox.classList.remove("hidden", "error", "success");
        messageBox.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        if (!messageBox) {
            return;
        }
        messageBox.textContent = "";
        messageBox.classList.remove("error", "success");
        messageBox.classList.add("hidden");
    }

    function getQueryParam(name) {
        var params = new URLSearchParams(window.location.search);
        return trim(params.get(name) || "");
    }

    function trim(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function parseJson(text) {
        return JSON.parse(text);
    }

    function t(key, fallback) {
        if (i18n) {
            return i18n.t(key, fallback);
        }
        return fallback || key;
    }
})();
