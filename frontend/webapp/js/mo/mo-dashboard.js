(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";

    var form = document.getElementById("job-create-form");
    var publishButton = document.getElementById("publish-btn");
    var resetButton = document.getElementById("reset-btn");
    var messageNode = document.getElementById("form-message");

    if (!form || !publishButton) {
        return;
    }

    var fields = {
        title: document.getElementById("job-title"),
        courseCode: document.getElementById("course-code"),
        courseName: document.getElementById("course-name"),
        description: document.getElementById("description"),
        requiredSkills: document.getElementById("required-skills"),
        positions: document.getElementById("positions"),
        deadline: document.getElementById("deadline"),
        workload: document.getElementById("workload"),
        salary: document.getElementById("salary")
    };
    var orderedFieldKeys = [
        "title",
        "courseCode",
        "courseName",
        "description",
        "requiredSkills",
        "positions",
        "deadline",
        "workload",
        "salary"
    ];

    var state = {
        submitting: false
    };
    var fieldValidationState = {
        touchedByKey: {},
        feedbackByKey: {}
    };

    initializeRealtimeValidation();

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitCreate();
    });

    form.addEventListener("reset", function () {
        hideMessage();
        clearAllFieldValidation();
        resetFieldTouchedState();
    });

    function submitCreate() {
        if (state.submitting) {
            return;
        }

        hideMessage();

        var validationResult = validateForm();
        if (validationResult && validationResult.message) {
            showMessage(validationResult.message, "error");
            if (validationResult.field && typeof validationResult.field.focus === "function") {
                validationResult.field.focus();
            }
            return;
        }

        var formData = new URLSearchParams();
        formData.set("title", fields.title.value.trim());
        formData.set("courseCode", fields.courseCode.value.trim());
        formData.set("courseName", fields.courseName.value.trim());
        formData.set("description", fields.description.value.trim());
        formData.set("requiredSkills", normalizeSkillsForSubmit(fields.requiredSkills.value));
        formData.set("positions", fields.positions.value.trim());
        formData.set("workload", fields.workload.value.trim());
        formData.set("salary", fields.salary.value.trim());

        var deadlineValue = normalizeDeadline(fields.deadline.value);
        if (deadlineValue) {
            formData.set("deadline", deadlineValue);
        }

        setSubmitting(true);

        request(contextPath + "/jobs", {
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

                if (response.status === 403) {
                    showMessage("Only MO accounts can publish jobs.", "error");
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = "Failed to publish job. Please check your input and try again.";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return;
                }

                form.reset();
                fields.positions.value = "1";
                showMessage("Job posted successfully.", "success");
            })
            .catch(function () {
                showMessage("Network error while posting job.", "error");
            })
            .finally(function () {
                setSubmitting(false);
            });
    }

    function validateForm() {
        var firstError = null;

        orderedFieldKeys.forEach(function (key) {
            var field = fields[key];
            if (!field) {
                return;
            }
            fieldValidationState.touchedByKey[key] = true;
            var result = validateSingleField(key, { forceRequired: true });
            if (!firstError && result && result.message) {
                firstError = result;
            }
        });

        if (!firstError) {
            return null;
        }
        return buildValidationError(firstError.message, firstError.field);
    }

    function initializeRealtimeValidation() {
        orderedFieldKeys.forEach(function (key) {
            var field = fields[key];
            if (!field) {
                return;
            }

            fieldValidationState.feedbackByKey[key] = ensureFieldFeedbackNode(key, field);
            fieldValidationState.touchedByKey[key] = false;

            field.addEventListener("blur", function () {
                fieldValidationState.touchedByKey[key] = true;
                validateSingleField(key, { forceRequired: true });
            });

            field.addEventListener("input", function () {
                validateSingleField(key, {
                    forceRequired: fieldValidationState.touchedByKey[key] === true
                });
            });

            field.addEventListener("change", function () {
                validateSingleField(key, {
                    forceRequired: fieldValidationState.touchedByKey[key] === true
                });
            });
        });
    }

    function validateSingleField(key, options) {
        var field = fields[key];
        if (!field) {
            return null;
        }

        var settings = options || {};
        var value = typeof field.value === "string" ? field.value.trim() : "";
        var message = getFieldValidationMessage(key, value, settings.forceRequired === true);
        setFieldValidationResult(key, message);

        return {
            field: field,
            message: message
        };
    }

    function getFieldValidationMessage(key, value, forceRequired) {
        if (key === "title") {
            return validateTitle(value, forceRequired);
        }
        if (key === "courseCode") {
            return validateCourseCode(value, forceRequired);
        }
        if (key === "courseName") {
            return validateCourseName(value, forceRequired);
        }
        if (key === "description") {
            return validateDescription(value, forceRequired);
        }
        if (key === "requiredSkills") {
            return validateRequiredSkills(value, forceRequired);
        }
        if (key === "positions") {
            return validatePositions(value, forceRequired);
        }
        if (key === "workload") {
            return validateWorkload(value, forceRequired);
        }
        if (key === "salary") {
            return validateSalary(value, forceRequired);
        }
        if (key === "deadline") {
            return validateDeadline(value, forceRequired);
        }
        return "";
    }

    function setFieldValidationResult(key, message) {
        var field = fields[key];
        var feedback = fieldValidationState.feedbackByKey[key];
        if (!field) {
            return;
        }

        if (feedback) {
            if (message) {
                feedback.textContent = message;
                feedback.classList.add("is-visible");
            } else {
                feedback.textContent = "";
                feedback.classList.remove("is-visible");
            }
        }

        if (message) {
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
            return;
        }

        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
    }

    function clearAllFieldValidation() {
        orderedFieldKeys.forEach(function (key) {
            setFieldValidationResult(key, "");
        });
    }

    function resetFieldTouchedState() {
        orderedFieldKeys.forEach(function (key) {
            fieldValidationState.touchedByKey[key] = false;
        });
    }

    function ensureFieldFeedbackNode(key, field) {
        var container = field.closest(".field");
        if (!container) {
            return null;
        }

        var selector = ".field-feedback[data-for=\"" + key + "\"]";
        var feedback = container.querySelector(selector);
        if (!feedback) {
            feedback = document.createElement("p");
            feedback.className = "field-feedback";
            feedback.setAttribute("data-for", key);
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");
            feedback.id = field.id ? field.id + "-feedback" : key + "-feedback";
            container.appendChild(feedback);
        }

        var describedBy = field.getAttribute("aria-describedby");
        if (!describedBy) {
            field.setAttribute("aria-describedby", feedback.id);
        } else if ((" " + describedBy + " ").indexOf(" " + feedback.id + " ") === -1) {
            field.setAttribute("aria-describedby", describedBy + " " + feedback.id);
        }

        return feedback;
    }

    function validateTitle(value, forceRequired) {
        if (forceRequired && !value) {
            return "Job title is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 200) {
            return "Job title must be 200 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Job title contains unsupported characters.";
        }
        return "";
    }

    function validateCourseCode(value, forceRequired) {
        if (forceRequired && !value) {
            return "Course code is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 50) {
            return "Course code must be 50 characters or fewer.";
        }
        if (!/^[A-Za-z0-9][A-Za-z0-9 _\-/.]{0,49}$/.test(value)) {
            return "Course code contains unsupported characters.";
        }
        return "";
    }

    function validateCourseName(value, forceRequired) {
        if (forceRequired && !value) {
            return "Course name is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 120) {
            return "Course name must be 120 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Course name contains unsupported characters.";
        }
        return "";
    }

    function validateDescription(value, forceRequired) {
        if (forceRequired && !value) {
            return "Description is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 4000) {
            return "Description must be 4000 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Description contains unsupported characters.";
        }
        return "";
    }

    function validateRequiredSkills(value, forceRequired) {
        if (forceRequired && !value) {
            return "Required skills are required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 500) {
            return "Required skills must be 500 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Required skills contain unsupported characters.";
        }

        var normalizedSkills = normalizeSkillsForSubmit(value);
        if (!normalizedSkills) {
            return "Please remove empty skill items.";
        }
        if (normalizedSkills.split(",").length > 20) {
            return "Please list up to 20 skills.";
        }

        return "";
    }

    function validatePositions(value, forceRequired) {
        if (forceRequired && !value) {
            return "Positions must be a whole number.";
        }
        if (!value) {
            return "";
        }
        if (!/^\d+$/.test(value)) {
            return "Positions must be a whole number.";
        }
        var positions = Number(value);
        if (!isFinite(positions) || positions < 1 || positions > 200) {
            return "Positions must be between 1 and 200.";
        }
        return "";
    }

    function validateWorkload(value, forceRequired) {
        if (forceRequired && !value) {
            return "Workload is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 120) {
            return "Workload must be 120 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Workload contains unsupported characters.";
        }
        return "";
    }

    function validateSalary(value, forceRequired) {
        if (forceRequired && !value) {
            return "Salary is required.";
        }
        if (!value) {
            return "";
        }
        if (value.length > 120) {
            return "Salary must be 120 characters or fewer.";
        }
        if (containsControlChars(value) || containsDangerousMarkup(value)) {
            return "Salary contains unsupported characters.";
        }
        return "";
    }

    function validateDeadline(value, forceRequired) {
        if (forceRequired && !value) {
            return "Application deadline is required.";
        }
        if (!value) {
            return "";
        }
        var parsedDeadline = parseLocalDateTime(value);
        if (!parsedDeadline) {
            return "Invalid deadline format.";
        }
        if (parsedDeadline.getTime() < Date.now() - 60000) {
            return "Deadline cannot be in the past.";
        }
        return "";
    }

    function setSubmitting(submitting) {
        state.submitting = submitting;
        publishButton.disabled = submitting;
        if (resetButton) {
            resetButton.disabled = submitting;
        }
        publishButton.textContent = submitting ? "Publishing..." : "Publish job";
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

    function normalizeSkillsForSubmit(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "";
        }
        return value
            .split(/[;,]/)
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            })
            .join(",");
    }

    function parseLocalDateTime(value) {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }
        var date = new Date(value);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
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

    function buildValidationError(message, field) {
        return {
            message: message,
            field: field || null
        };
    }

    function normalizeDeadline(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "";
        }
        var text = value.trim();
        if (text.length === 16) {
            return text + ":00";
        }
        return text;
    }

})();
