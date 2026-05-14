(function () {
    var STORAGE_KEY = "ta_hiring_locale";
    var CHINESE_LOCALE = "zh-CN";
    var root = document.documentElement;

    function normalizeLocale(input) {
        if (typeof input !== "string" || !input.trim()) {
            return "";
        }
        var normalized = input.trim().toLowerCase();
        if (normalized === "en" || normalized.indexOf("en-") === 0) {
            return "en";
        }
        if (normalized === "zh" || normalized === "zh-cn" || normalized.indexOf("zh-") === 0) {
            return CHINESE_LOCALE;
        }
        return "";
    }

    function readSavedLocale() {
        try {
            return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || "");
        } catch (error) {
            return "";
        }
    }

    function readBrowserLocale() {
        var languages = [];
        if (Array.isArray(window.navigator.languages)) {
            languages = window.navigator.languages.slice();
        }
        if (typeof window.navigator.language === "string" && window.navigator.language) {
            languages.push(window.navigator.language);
        }
        for (var i = 0; i < languages.length; i += 1) {
            var locale = normalizeLocale(languages[i]);
            if (locale) {
                return locale;
            }
        }
        return "";
    }

    var locale = readSavedLocale() || readBrowserLocale() || "en";
    root.setAttribute("lang", locale === CHINESE_LOCALE ? CHINESE_LOCALE : "en");
    root.setAttribute("data-initial-locale", locale);

    if (locale === CHINESE_LOCALE) {
        root.classList.add("i18n-pending");
        window.setTimeout(function () {
            root.classList.remove("i18n-pending");
        }, 1600);
    }
})();
