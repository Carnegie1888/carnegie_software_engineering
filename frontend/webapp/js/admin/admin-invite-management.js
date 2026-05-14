(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var i18n = window.AppI18n && typeof window.AppI18n.t === "function" ? window.AppI18n : null;

    var codeDisplay = document.getElementById("code-display");
    var countdownBar = document.getElementById("countdown-bar");
    var countdownLabel = document.getElementById("countdown-label");
    var rotateBtn = document.getElementById("rotate-btn");
    var codeError = document.getElementById("code-error");

    if (!codeDisplay) return;

    var countdownInterval = null;
    var currentSeconds = 30;

    fetchCurrentCode();

    if (rotateBtn) {
        rotateBtn.addEventListener("click", function () {
            rotateBtn.disabled = true;
            hideError();
            fetch(contextPath + "/api/admin/invite/current-code", {
                method: "POST",
                headers: { "X-Requested-With": "XMLHttpRequest" }
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (!data || data.success !== true) {
                        showError(t("portal.adminDashboard.codePanel.refreshError", "Failed to refresh code."));
                        return;
                    }
                    renderCode(data.data.code, data.data.secondsRemaining);
                })
                .catch(function () {
                    showError(t("portal.adminDashboard.codePanel.refreshError", "Failed to refresh code."));
                })
                .finally(function () {
                    rotateBtn.disabled = false;
                });
        });
    }

    function fetchCurrentCode() {
        hideError();
        fetch(contextPath + "/api/admin/invite/current-code", {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
            .then(function (res) {
                if (res.status === 401) {
                    window.location.href = contextPath + "/login.jsp";
                    return null;
                }
                return res.json();
            })
            .then(function (data) {
                if (!data) return;
                if (!data.success) {
                    showError(t("portal.adminDashboard.codePanel.loadError", "Failed to load invite code."));
                    return;
                }
                renderCode(data.data.code, data.data.secondsRemaining);
            })
            .catch(function () {
                showError(t("portal.adminDashboard.codePanel.loadError", "Failed to load invite code."));
            });
    }

    function renderCode(code, seconds) {
        if (codeDisplay) {
            var formatted = formatCode(code);
            codeDisplay.textContent = formatted;
            codeDisplay.classList.remove("code-loading");
        }
        startCountdown(seconds);
    }

    function formatCode(code) {
        if (typeof code !== "string" || code.length !== 8) return code || "—";
        return code.slice(0, 4) + " " + code.slice(4);
    }

    function startCountdown(seconds) {
        clearInterval(countdownInterval);
        currentSeconds = typeof seconds === "number" ? Math.max(0, seconds) : 600;
        updateCountdownUI();

        countdownInterval = setInterval(function () {
            currentSeconds -= 1;
            if (currentSeconds <= 0) {
                clearInterval(countdownInterval);
                fetchCurrentCode();
            } else {
                updateCountdownUI();
            }
        }, 1000);
    }

    function updateCountdownUI() {
        var pct = Math.max(0, currentSeconds / 600) * 100;
        if (countdownBar) countdownBar.style.width = pct + "%";
        if (countdownLabel) {
            var m = Math.floor(currentSeconds / 60);
            var s = currentSeconds % 60;
            countdownLabel.textContent = m + ":" + (s < 10 ? "0" : "") + s;
        }
    }

    function showError(msg) {
        if (codeError) {
            codeError.textContent = msg;
            codeError.classList.remove("hidden");
        }
    }

    function hideError() {
        if (codeError) {
            codeError.textContent = "";
            codeError.classList.add("hidden");
        }
    }

    function t(key, fallback) {
        if (i18n) return i18n.t(key, fallback);
        return fallback || key;
    }
})();
