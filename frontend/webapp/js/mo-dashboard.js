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

    var state = {
        submitting: false
    };

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitCreate();
    });

    form.addEventListener("reset", function () {
        hideMessage();
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

                showMessage("Job posted successfully.", "success");
                form.reset();
                fields.positions.value = "1";
            })
            .catch(function () {
                showMessage("Network error while posting job.", "error");
            })
            .finally(function () {
                setSubmitting(false);
            });
    }

    function validateForm() {
        var title = fields.title.value.trim();
        var courseCode = fields.courseCode.value.trim();
        var courseName = fields.courseName.value.trim();
        var description = fields.description.value.trim();
        var requiredSkills = fields.requiredSkills.value.trim();
        var positionsText = fields.positions.value.trim();
        var workload = fields.workload.value.trim();
        var salary = fields.salary.value.trim();
        var deadlineText = fields.deadline.value.trim();

        if (!title) {
            return buildValidationError("Job title is required.", fields.title);
        }
        if (title.length > 200) {
            return buildValidationError("Job title must be 200 characters or fewer.", fields.title);
        }
        if (containsControlChars(title) || containsDangerousMarkup(title)) {
            return buildValidationError("Job title contains unsupported characters.", fields.title);
        }

        if (!courseCode) {
            return buildValidationError("Course code is required.", fields.courseCode);
        }
        if (courseCode.length > 50) {
            return buildValidationError("Course code must be 50 characters or fewer.", fields.courseCode);
        }
        if (!/^[A-Za-z0-9][A-Za-z0-9 _\-/.]{0,49}$/.test(courseCode)) {
            return buildValidationError("Course code contains unsupported characters.", fields.courseCode);
        }

        if (courseName.length > 120) {
            return buildValidationError("Course name must be 120 characters or fewer.", fields.courseName);
        }
        if (courseName && (containsControlChars(courseName) || containsDangerousMarkup(courseName))) {
            return buildValidationError("Course name contains unsupported characters.", fields.courseName);
        }

        if (description.length > 4000) {
            return buildValidationError("Description must be 4000 characters or fewer.", fields.description);
        }
        if (description && (containsControlChars(description) || containsDangerousMarkup(description))) {
            return buildValidationError("Description contains unsupported characters.", fields.description);
        }

        if (requiredSkills.length > 500) {
            return buildValidationError("Required skills must be 500 characters or fewer.", fields.requiredSkills);
        }
        if (requiredSkills && (containsControlChars(requiredSkills) || containsDangerousMarkup(requiredSkills))) {
            return buildValidationError("Required skills contain unsupported characters.", fields.requiredSkills);
        }

        if (requiredSkills) {
            var normalizedSkills = normalizeSkillsForSubmit(requiredSkills);
            if (!normalizedSkills) {
                return buildValidationError("Please remove empty skill items.", fields.requiredSkills);
            }
            if (normalizedSkills.split(",").length > 20) {
                return buildValidationError("Please list up to 20 skills.", fields.requiredSkills);
            }
        }

        if (!/^\d+$/.test(positionsText)) {
            return buildValidationError("Positions must be a whole number.", fields.positions);
        }

        var positions = Number(positionsText);
        if (!isFinite(positions) || positions < 1 || positions > 200) {
            return buildValidationError("Positions must be between 1 and 200.", fields.positions);
        }

        if (workload.length > 120) {
            return buildValidationError("Workload must be 120 characters or fewer.", fields.workload);
        }
        if (workload && (containsControlChars(workload) || containsDangerousMarkup(workload))) {
            return buildValidationError("Workload contains unsupported characters.", fields.workload);
        }

        if (salary.length > 120) {
            return buildValidationError("Salary must be 120 characters or fewer.", fields.salary);
        }
        if (salary && (containsControlChars(salary) || containsDangerousMarkup(salary))) {
            return buildValidationError("Salary contains unsupported characters.", fields.salary);
        }

        if (deadlineText) {
            var parsedDeadline = parseLocalDateTime(deadlineText);
            if (!parsedDeadline) {
                return buildValidationError("Invalid deadline format.", fields.deadline);
            }
            if (parsedDeadline.getTime() < Date.now() - 60000) {
                return buildValidationError("Deadline cannot be in the past.", fields.deadline);
            }
        }

        return null;
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
