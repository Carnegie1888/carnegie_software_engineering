(function () {
    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var currentUserId = typeof window.APP_CURRENT_USER_ID === "string" ? window.APP_CURRENT_USER_ID : "";

    // ==========================================
    // State
    // ==========================================
    var state = {
        jobs: [],
        submitting: false,
        deletingJobId: null,
        editingJobId: null
    };

    // ==========================================
    // DOM Elements - Create Form
    // ==========================================
    var form = document.getElementById("job-create-form");
    var publishButton = document.getElementById("publish-btn");
    var resetButton = document.getElementById("reset-btn");
    var messageNode = document.getElementById("form-message");

    // ==========================================
    // DOM Elements - Tab Navigation
    // ==========================================
    var tabMyJobs = document.getElementById("tab-my-jobs");
    var tabPostJob = document.getElementById("tab-post-job");
    var panelMyJobs = document.getElementById("panel-my-jobs");
    var panelPostJob = document.getElementById("panel-post-job");

    // ==========================================
    // DOM Elements - Job List
    // ==========================================
    var jobListContainer = document.getElementById("job-list-container");
    var jobsLoading = document.getElementById("jobs-loading");
    var jobList = document.getElementById("job-list");
    var jobsEmpty = document.getElementById("jobs-empty");
    var jobsListMessage = document.getElementById("jobs-list-message");

    // ==========================================
    // DOM Elements - Edit Modal
    // ==========================================
    var editModal = document.getElementById("edit-job-modal");
    var editForm = document.getElementById("job-edit-form");
    var editFormMessage = document.getElementById("edit-form-message");
    var editJobId = document.getElementById("edit-job-id");
    var editSaveBtn = document.getElementById("edit-save-btn");
    var editCancelBtn = document.getElementById("edit-cancel-btn");
    var editModalClose = document.getElementById("edit-modal-close");

    var editFields = {
        title: document.getElementById("edit-job-title"),
        courseCode: document.getElementById("edit-course-code"),
        courseName: document.getElementById("edit-course-name"),
        description: document.getElementById("edit-description"),
        requiredSkills: document.getElementById("edit-required-skills"),
        positions: document.getElementById("edit-positions"),
        deadline: document.getElementById("edit-deadline"),
        workload: document.getElementById("edit-workload"),
        salary: document.getElementById("edit-salary"),
        status: document.getElementById("edit-status")
    };

    // ==========================================
    // DOM Elements - Delete Modal
    // ==========================================
    var deleteModal = document.getElementById("delete-job-modal");
    var deleteJobTitle = document.getElementById("delete-job-title");
    var deleteConfirmBtn = document.getElementById("delete-confirm-btn");
    var deleteCancelBtn = document.getElementById("delete-cancel-btn");
    var deleteModalClose = document.getElementById("delete-modal-close");

    // ==========================================
    // Create Form Fields
    // ==========================================
    var createFields = {
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

    var createFieldValidationState = {
        touchedByKey: {},
        feedbackByKey: {}
    };

    // ==========================================
    // Initialization
    // ==========================================
    function init() {
        if (!form || !publishButton) {
            return;
        }

        initializeRealtimeValidation();
        initTabSwitching();
        initJobList();
        initEditModal();
        initDeleteModal();

        // Create form submit
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitCreate();
        });

        // Create form reset
        form.addEventListener("reset", function () {
            hideMessage();
            clearAllFieldValidation();
            resetFieldTouchedState();
        });
    }

    // ==========================================
    // Tab Switching
    // ==========================================
    function initTabSwitching() {
        if (tabMyJobs) {
            tabMyJobs.addEventListener("click", function () {
                switchTab("my-jobs");
            });
        }
        if (tabPostJob) {
            tabPostJob.addEventListener("click", function () {
                switchTab("post-job");
            });
        }
    }

    function switchTab(tabId) {
        if (tabId === "my-jobs") {
            tabMyJobs.classList.add("is-active");
            tabMyJobs.setAttribute("aria-selected", "true");
            tabPostJob.classList.remove("is-active");
            tabPostJob.setAttribute("aria-selected", "false");
            panelMyJobs.classList.add("is-active");
            panelMyJobs.hidden = false;
            panelPostJob.classList.remove("is-active");
            panelPostJob.hidden = true;
            // Refresh job list when switching to it
            loadJobs();
        } else {
            tabPostJob.classList.add("is-active");
            tabPostJob.setAttribute("aria-selected", "true");
            tabMyJobs.classList.remove("is-active");
            tabMyJobs.setAttribute("aria-selected", "false");
            panelPostJob.classList.add("is-active");
            panelPostJob.hidden = false;
            panelMyJobs.classList.remove("is-active");
            panelMyJobs.hidden = true;
        }
    }

    // ==========================================
    // Job List
    // ==========================================
    function initJobList() {
        loadJobs();
    }

    function loadJobs() {
        if (!currentUserId) {
            showJobsMessage("User not logged in", "error");
            return;
        }

        showJobsLoading();

        request(contextPath + "/jobs?moId=" + encodeURIComponent(currentUserId), {
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
                    showJobsMessage("Failed to load jobs", "error");
                    return;
                }

                state.jobs = payload.data && payload.data.jobs ? payload.data.jobs : [];
                renderJobList();
            })
            .catch(function () {
                showJobsMessage("Network error while loading jobs", "error");
            });
    }

    function showJobsLoading() {
        hideElement(jobsEmpty);
        hideElement(jobList);
        showElement(jobsLoading);
        hideJobsMessage();
    }

    function renderJobList() {
        hideElement(jobsLoading);

        if (state.jobs.length === 0) {
            showElement(jobsEmpty);
            hideElement(jobList);
            return;
        }

        hideElement(jobsEmpty);
        showElement(jobList);
        jobList.innerHTML = "";

        state.jobs.forEach(function (job) {
            var card = createJobCard(job);
            jobList.appendChild(card);
        });
    }

    function createJobCard(job) {
        var card = document.createElement("div");
        card.className = "mo-job-card status-" + (job.status || "unknown").toLowerCase();
        card.setAttribute("role", "listitem");

        var formattedDeadline = formatDeadline(job.deadline);

        card.innerHTML =
            '<div class="job-accent"></div>' +
            '<div class="job-main">' +
            '<div class="job-heading">' +
            '<h3>' + escapeHtml(job.title || "") + '</h3>' +
            '</div>' +
            '<p class="job-subtitle">' +
            '<span class="job-course-code">' + escapeHtml(job.courseCode || "") + '</span>' +
            '<span> - </span>' +
            '<span>' + escapeHtml(job.courseName || "") + '</span>' +
            '</p>' +
            '<p class="job-meta-line">' +
            '<span>' + escapeHtml(job.positions || "0") + ' position(s)</span>' +
            '<span class="job-meta-separator">|</span>' +
            '<span>' + escapeHtml(formattedDeadline) + '</span>' +
            '</p>' +
            '</div>' +
            '<div class="job-actions">' +
            '<button class="edit-btn" type="button" data-job-id="' + escapeHtml(job.jobId || "") + '">Edit</button>' +
            '<button class="delete-btn" type="button" data-job-id="' + escapeHtml(job.jobId || "") + '">Delete</button>' +
            '</div>';

        // Attach event listeners
        var editBtn = card.querySelector(".edit-btn");
        var deleteBtn = card.querySelector(".delete-btn");

        if (editBtn) {
            editBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                openEditModal(job.jobId);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                openDeleteModal(job.jobId, job.title);
            });
        }

        return card;
    }

    // ==========================================
    // Edit Modal
    // ==========================================
    function initEditModal() {
        if (!editModal) return;

        // Close button
        if (editModalClose) {
            editModalClose.addEventListener("click", closeEditModal);
        }

        // Cancel button
        if (editCancelBtn) {
            editCancelBtn.addEventListener("click", closeEditModal);
        }

        // Form submit
        if (editForm) {
            editForm.addEventListener("submit", function (event) {
                event.preventDefault();
                submitEdit();
            });
        }

        // Close on overlay click
        editModal.addEventListener("click", function (event) {
            if (event.target === editModal) {
                closeEditModal();
            }
        });

        // Close on Escape
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !editModal.classList.contains("hidden")) {
                closeEditModal();
            }
        });
    }

    function openEditModal(jobId) {
        var job = findJobById(jobId);
        if (!job) {
            showEditMessage("Job not found", "error");
            return;
        }

        state.editingJobId = jobId;

        // Fill form fields
        editJobId.value = job.jobId || "";
        editFields.title.value = job.title || "";
        editFields.courseCode.value = job.courseCode || "";
        editFields.courseName.value = job.courseName || "";
        editFields.description.value = job.description || "";
        editFields.requiredSkills.value = job.requiredSkills || "";
        editFields.positions.value = job.positions || "1";
        editFields.workload.value = job.workload || "";
        editFields.salary.value = job.salary || "";
        editFields.status.value = job.status || "OPEN";

        // Format deadline for datetime-local input
        if (job.deadline) {
            editFields.deadline.value = formatDeadlineForInput(job.deadline);
        }

        hideEditMessage();
        showEditModal();
    }

    function showEditModal() {
        editModal.classList.remove("hidden");
        editModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeEditModal() {
        editModal.classList.add("hidden");
        editModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        state.editingJobId = null;
        hideEditMessage();
    }

    function submitEdit() {
        if (state.submitting) return;
        if (!state.editingJobId) return;

        var formData = new URLSearchParams();
        formData.set("title", editFields.title.value.trim());
        formData.set("courseCode", editFields.courseCode.value.trim());
        formData.set("courseName", editFields.courseName.value.trim());
        formData.set("description", editFields.description.value.trim());
        formData.set("requiredSkills", normalizeSkillsForSubmit(editFields.requiredSkills.value));
        formData.set("positions", editFields.positions.value.trim());
        formData.set("workload", editFields.workload.value.trim());
        formData.set("salary", editFields.salary.value.trim());
        formData.set("status", editFields.status.value.trim());

        var deadlineValue = normalizeDeadline(editFields.deadline.value);
        if (deadlineValue) {
            formData.set("deadline", deadlineValue);
        }

        setEditSubmitting(true);

        request(contextPath + "/jobs?id=" + encodeURIComponent(state.editingJobId), {
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
                    var errorMessage = "Failed to update job";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showEditMessage(errorMessage, "error");
                    return;
                }

                closeEditModal();
                showJobsMessage("Job updated successfully", "success");
                loadJobs();
            })
            .catch(function () {
                showEditMessage("Network error while updating job", "error");
            })
            .finally(function () {
                setEditSubmitting(false);
            });
    }

    function setEditSubmitting(submitting) {
        state.submitting = submitting;
        editSaveBtn.disabled = submitting;
        editSaveBtn.textContent = submitting ? "Saving..." : "Save Changes";
    }

    function showEditMessage(message, type) {
        if (!editFormMessage) return;
        editFormMessage.textContent = message;
        editFormMessage.classList.remove("hidden", "error", "success");
        editFormMessage.classList.add(type);
    }

    function hideEditMessage() {
        if (!editFormMessage) return;
        editFormMessage.textContent = "";
        editFormMessage.classList.remove("error", "success");
        editFormMessage.classList.add("hidden");
    }

    // ==========================================
    // Delete Modal
    // ==========================================
    function initDeleteModal() {
        if (!deleteModal) return;

        // Close button
        if (deleteModalClose) {
            deleteModalClose.addEventListener("click", closeDeleteModal);
        }

        // Cancel button
        if (deleteCancelBtn) {
            deleteCancelBtn.addEventListener("click", closeDeleteModal);
        }

        // Confirm button
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener("click", confirmDelete);
        }

        // Close on overlay click
        deleteModal.addEventListener("click", function (event) {
            if (event.target === deleteModal) {
                closeDeleteModal();
            }
        });

        // Close on Escape
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !deleteModal.classList.contains("hidden")) {
                closeDeleteModal();
            }
        });
    }

    function openDeleteModal(jobId, jobTitle) {
        state.deletingJobId = jobId;
        deleteJobTitle.textContent = jobTitle || "";
        showDeleteModal();
    }

    function showDeleteModal() {
        deleteModal.classList.remove("hidden");
        deleteModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeDeleteModal() {
        deleteModal.classList.add("hidden");
        deleteModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        state.deletingJobId = null;
    }

    function confirmDelete() {
        if (!state.deletingJobId) return;
        if (state.submitting) return;

        setDeleteSubmitting(true);

        request(contextPath + "/jobs?id=" + encodeURIComponent(state.deletingJobId), {
            method: "DELETE",
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
                    var errorMessage = "Failed to delete job";
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showJobsMessage(errorMessage, "error");
                    closeDeleteModal();
                    return;
                }

                closeDeleteModal();
                showJobsMessage("Job deleted successfully", "success");
                loadJobs();
            })
            .catch(function () {
                showJobsMessage("Network error while deleting job", "error");
                closeDeleteModal();
            })
            .finally(function () {
                setDeleteSubmitting(false);
            });
    }

    function setDeleteSubmitting(submitting) {
        state.submitting = submitting;
        deleteConfirmBtn.disabled = submitting;
        deleteConfirmBtn.textContent = submitting ? "Deleting..." : "Delete";
    }

    // ==========================================
    // Job List Messages
    // ==========================================
    function showJobsMessage(message, type) {
        if (!jobsListMessage) return;
        jobsListMessage.textContent = message;
        jobsListMessage.classList.remove("hidden", "error", "success");
        jobsListMessage.classList.add(type);
    }

    function hideJobsMessage() {
        if (!jobsListMessage) return;
        jobsListMessage.textContent = "";
        jobsListMessage.classList.remove("error", "success");
        jobsListMessage.classList.add("hidden");
    }

    // ==========================================
    // Create Form (Existing functionality)
    // ==========================================
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
        formData.set("title", createFields.title.value.trim());
        formData.set("courseCode", createFields.courseCode.value.trim());
        formData.set("courseName", createFields.courseName.value.trim());
        formData.set("description", createFields.description.value.trim());
        formData.set("requiredSkills", normalizeSkillsForSubmit(createFields.requiredSkills.value));
        formData.set("positions", createFields.positions.value.trim());
        formData.set("workload", createFields.workload.value.trim());
        formData.set("salary", createFields.salary.value.trim());

        var deadlineValue = normalizeDeadline(createFields.deadline.value);
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
                createFields.positions.value = "1";
                showMessage("Job posted successfully.", "success");
                // Refresh job list if visible
                if (!panelMyJobs.hidden) {
                    loadJobs();
                }
            })
            .catch(function () {
                showMessage("Network error while posting job.", "error");
            })
            .finally(function () {
                setSubmitting(false);
            });
    }

    // ==========================================
    // Validation (from original code)
    // ==========================================
    function validateForm() {
        var firstError = null;

        orderedFieldKeys.forEach(function (key) {
            var field = createFields[key];
            if (!field) {
                return;
            }
            createFieldValidationState.touchedByKey[key] = true;
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
            var field = createFields[key];
            if (!field) {
                return;
            }

            createFieldValidationState.feedbackByKey[key] = ensureFieldFeedbackNode(key, field);
            createFieldValidationState.touchedByKey[key] = false;

            field.addEventListener("blur", function () {
                createFieldValidationState.touchedByKey[key] = true;
                validateSingleField(key, { forceRequired: true });
            });

            field.addEventListener("input", function () {
                validateSingleField(key, {
                    forceRequired: createFieldValidationState.touchedByKey[key] === true
                });
            });

            field.addEventListener("change", function () {
                validateSingleField(key, {
                    forceRequired: createFieldValidationState.touchedByKey[key] === true
                });
            });
        });
    }

    function validateSingleField(key, options) {
        var field = createFields[key];
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
        if (key === "title") return validateTitle(value, forceRequired);
        if (key === "courseCode") return validateCourseCode(value, forceRequired);
        if (key === "courseName") return validateCourseName(value, forceRequired);
        if (key === "description") return validateDescription(value, forceRequired);
        if (key === "requiredSkills") return validateRequiredSkills(value, forceRequired);
        if (key === "positions") return validatePositions(value, forceRequired);
        if (key === "workload") return validateWorkload(value, forceRequired);
        if (key === "salary") return validateSalary(value, forceRequired);
        if (key === "deadline") return validateDeadline(value, forceRequired);
        return "";
    }

    function setFieldValidationResult(key, message) {
        var field = createFields[key];
        var feedback = createFieldValidationState.feedbackByKey[key];
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
            createFieldValidationState.touchedByKey[key] = false;
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

    // Validation functions
    function validateTitle(value, forceRequired) {
        if (forceRequired && !value) return "Job title is required.";
        if (!value) return "";
        if (value.length > 200) return "Job title must be 200 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Job title contains unsupported characters.";
        return "";
    }

    function validateCourseCode(value, forceRequired) {
        if (forceRequired && !value) return "Course code is required.";
        if (!value) return "";
        if (value.length > 50) return "Course code must be 50 characters or fewer.";
        if (!/^[A-Za-z0-9][A-Za-z0-9 _\-/.]{0,49}$/.test(value)) return "Course code contains unsupported characters.";
        return "";
    }

    function validateCourseName(value, forceRequired) {
        if (forceRequired && !value) return "Course name is required.";
        if (!value) return "";
        if (value.length > 120) return "Course name must be 120 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Course name contains unsupported characters.";
        return "";
    }

    function validateDescription(value, forceRequired) {
        if (forceRequired && !value) return "Description is required.";
        if (!value) return "";
        if (value.length > 4000) return "Description must be 4000 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Description contains unsupported characters.";
        return "";
    }

    function validateRequiredSkills(value, forceRequired) {
        if (forceRequired && !value) return "Required skills are required.";
        if (!value) return "";
        if (value.length > 500) return "Required skills must be 500 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Required skills contain unsupported characters.";
        var normalizedSkills = normalizeSkillsForSubmit(value);
        if (!normalizedSkills) return "Please remove empty skill items.";
        if (normalizedSkills.split(",").length > 20) return "Please list up to 20 skills.";
        return "";
    }

    function validatePositions(value, forceRequired) {
        if (forceRequired && !value) return "Positions must be a whole number.";
        if (!value) return "";
        if (!/^\d+$/.test(value)) return "Positions must be a whole number.";
        var positions = Number(value);
        if (!isFinite(positions) || positions < 1 || positions > 200) return "Positions must be between 1 and 200.";
        return "";
    }

    function validateWorkload(value, forceRequired) {
        if (forceRequired && !value) return "Workload is required.";
        if (!value) return "";
        if (value.length > 120) return "Workload must be 120 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Workload contains unsupported characters.";
        return "";
    }

    function validateSalary(value, forceRequired) {
        if (forceRequired && !value) return "Salary is required.";
        if (!value) return "";
        if (value.length > 120) return "Salary must be 120 characters or fewer.";
        if (containsControlChars(value) || containsDangerousMarkup(value)) return "Salary contains unsupported characters.";
        return "";
    }

    function validateDeadline(value, forceRequired) {
        if (forceRequired && !value) return "Application deadline is required.";
        if (!value) return "";
        var parsedDeadline = parseLocalDateTime(value);
        if (!parsedDeadline) return "Invalid deadline format.";
        if (parsedDeadline.getTime() < Date.now() - 60000) return "Deadline cannot be in the past.";
        return "";
    }

    // ==========================================
    // Utility Functions
    // ==========================================
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
        try {
            return JSON.parse(text);
        } catch (e) {
            return {};
        }
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

    function formatDeadline(deadlineStr) {
        if (!deadlineStr) return "No deadline";
        try {
            var date = new Date(deadlineStr);
            if (isNaN(date.getTime())) return deadlineStr;
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch (e) {
            return deadlineStr;
        }
    }

    function formatDeadlineForInput(deadlineStr) {
        if (!deadlineStr) return "";
        try {
            var date = new Date(deadlineStr);
            if (isNaN(date.getTime())) return "";
            var year = date.getFullYear();
            var month = ("0" + (date.getMonth() + 1)).slice(-2);
            var day = ("0" + date.getDate()).slice(-2);
            var hours = ("0" + date.getHours()).slice(-2);
            var minutes = ("0" + date.getMinutes()).slice(-2);
            return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
        } catch (e) {
            return "";
        }
    }

    function findJobById(jobId) {
        for (var i = 0; i < state.jobs.length; i++) {
            if (state.jobs[i].jobId === jobId) {
                return state.jobs[i];
            }
        }
        return null;
    }

    function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showElement(el) {
        if (el) {
            el.classList.remove("hidden");
        }
    }

    function hideElement(el) {
        if (el) {
            el.classList.add("hidden");
        }
    }

    // ==========================================
    // Start
    // ==========================================
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();