(function () {
    var form = document.getElementById("ta-profile-form");
    if (!form) {
        return;
    }

    var contextPath = typeof window.APP_CONTEXT_PATH === "string" ? window.APP_CONTEXT_PATH : "";
    var messageBox = document.getElementById("form-message");
    var submitButton = document.getElementById("profile-submit");
    var editButton = document.getElementById("profile-edit-btn");
    var cancelEditButton = document.getElementById("profile-cancel-btn");
    var formFields = form.querySelectorAll("input, select, textarea");
    var resumeFileTrigger = document.getElementById("resume-file-trigger");
    var resumeFileInput = document.getElementById("resume-file-input");
    var resumeUploadShell = document.getElementById("resume-upload-shell");
    var resumeEmptyState = document.getElementById("resume-empty-state");
    var resumeFilledState = document.getElementById("resume-filled-state");
    var resumeFileDisplayName = document.getElementById("resume-file-display-name");
    var resumeFileDisplayDetail = document.getElementById("resume-file-display-detail");
    var resumeRemoveButton = document.getElementById("resume-remove-btn");
    var resumeUploadMessage = document.getElementById("resume-upload-message");

    var ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
    var MAX_RESUME_SIZE = 10 * 1024 * 1024;

    function localizeText(key, fallback) {
        if (window.AppI18n && typeof window.AppI18n.t === "function") {
            return window.AppI18n.t(key, fallback || key);
        }
        return fallback || key;
    }

    var inputs = {
        fullName: document.getElementById("full-name"),
        studentId: document.getElementById("student-id"),
        department: document.getElementById("department"),
        program: document.getElementById("program"),
        gpa: document.getElementById("gpa"),
        skills: document.getElementById("skills"),
        phone: document.getElementById("phone"),
        experience: document.getElementById("experience"),
        motivation: document.getElementById("motivation")
    };

    var state = {
        hasExistingProfile: false,
        isEditing: false,
        isSubmitting: false,
        isLoading: false,
        isUploadingResume: false,
        selectedResumeFile: null,
        resumePath: "",
        resumeName: "",
        resumeSize: 0,
        removedSavedResume: false,
        pendingResumePath: "",
        pendingResumeName: "",
        pendingResumeSize: 0
    };

    var fieldValidationState = {
        feedbackByKey: {},
        touchedByKey: {}
    };

    var orderedInputKeys = [
        "fullName",
        "studentId",
        "department",
        "program",
        "gpa",
        "phone",
        "skills",
        "experience",
        "motivation"
    ];

    initializeRealtimeValidation();
    initializeEnterKeyBehavior();

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (state.isSubmitting || state.isLoading) {
            return;
        }

        if (state.hasExistingProfile) {
            if (!state.isEditing) {
                return;
            }
            handleUpdate();
            return;
        }

        handleCreate();
    });

    if (editButton) {
        editButton.addEventListener("click", function () {
            if (!state.hasExistingProfile || state.isSubmitting || state.isLoading) {
                return;
            }
            enterEditMode();
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", function () {
            if (!state.hasExistingProfile || state.isSubmitting || state.isLoading || state.isUploadingResume) {
                return;
            }
            handleCancelEdit();
        });
    }

    if (resumeFileInput) {
        resumeFileInput.addEventListener("change", handleResumeFileChange);
    }

    if (resumeFileTrigger && resumeFileInput) {
        resumeFileTrigger.addEventListener("click", function () {
            if (resumeFileTrigger.disabled) {
                return;
            }
            resumeFileInput.click();
        });
    }

    if (resumeRemoveButton) {
        resumeRemoveButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            handleResumeRemove();
        });
    }

    refreshResumeArea();
    loadExistingProfile({ silentWhenMissing: true });

    document.addEventListener("app:locale-changed", function () {
        refreshSubmitButton();
        refreshResumeArea();
    });

    function handleCreate() {
        hideMessage();

        var validationError = validateForm();
        if (validationError) {
            showMessage(localizeText("portal.dynamic.fixHighlightedFields", "Please fix the highlighted fields and try again."), "error");
            if (validationError.field && typeof validationError.field.focus === "function") {
                validationError.field.focus();
            }
            return;
        }

        validationError = validateResumeRequirement();
        if (validationError) {
            showMessage(validationError.message, "error");
            return;
        }

        setSubmitting(true);

        submitProfile(false)
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (response.status === 409) {
                    showMessage(localizeText("portal.dynamic.profileAlreadyExists", "A profile already exists for this account. Loading your saved profile..."), "error");
                    return loadExistingProfile({ afterCreate: false, silentWhenMissing: false });
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = localizeText("portal.dynamic.unableCreateProfile", "Unable to create your profile. Please review the form and try again.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return;
                }

                return loadExistingProfile({ afterCreate: true, silentWhenMissing: false });
            })
            .catch(function () {
                showMessage(localizeText("portal.dynamic.networkErrorMoment", "Network error. Please try again in a moment."), "error");
            })
            .finally(function () {
                setSubmitting(false);
            });
    }

    function loadExistingProfile(options) {
        var settings = options || {};

        state.isLoading = true;
        refreshResumeArea();
        if (!state.isSubmitting) {
            submitButton.disabled = true;
            submitButton.textContent = localizeText("portal.dynamic.checkingProfile", "Checking profile...");
        }

        return request(contextPath + "/applicant", {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;
                var payloadData = extractData(payload);

                if (response.status === 404) {
                    enableCreateMode(payloadData);
                    if (!settings.silentWhenMissing) {
                        showMessage(localizeText("portal.dynamic.noProfileFound", "No profile found yet. Please complete the form below."), "success");
                    }
                    return;
                }

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    enableCreateMode();
                    var errorMessage = localizeText("portal.dynamic.unableCheckProfile", "Unable to load your current profile. You can still create one below.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return;
                }

                applyExistingProfile(payloadData, settings.afterCreate === true);
            })
            .catch(function () {
                enableCreateMode();
                showMessage(localizeText("portal.dynamic.unableCheckProfile", "Unable to check your existing profile right now. You can still try creating one."), "error");
            })
            .finally(function () {
                state.isLoading = false;
                refreshSubmitButton();
                refreshResumeArea();
            });
    }

    function handleUpdate() {
        hideMessage();

        var validationError = validateForm();
        if (validationError) {
            showMessage(localizeText("portal.dynamic.fixHighlightedFields", "Please fix the highlighted fields and try again."), "error");
            if (validationError.field && typeof validationError.field.focus === "function") {
                validationError.field.focus();
            }
            return;
        }

        validationError = validateResumeRequirement();
        if (validationError) {
            showMessage(validationError.message, "error");
            return;
        }

        setSubmitting(true);

        submitProfile(true)
            .then(function (result) {
                var response = result.response;
                var payload = result.payload;

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (response.status === 404) {
                    enableCreateMode();
                    showMessage(localizeText("portal.dynamic.noProfileFound", "No profile found yet. Please complete the form below."), "error");
                    return;
                }

                if (!response.ok || !payload || payload.success !== true) {
                    var errorMessage = localizeText("portal.dynamic.unableUpdateProfile", "Unable to update your profile. Please review the form and try again.");
                    if (payload && typeof payload.message === "string" && payload.message.trim()) {
                        errorMessage = payload.message.trim();
                    }
                    showMessage(errorMessage, "error");
                    return;
                }

                showMessage(localizeText("portal.dynamic.profileUpdatedSuccess", "Profile updated successfully."), "success");
                return loadExistingProfile({ afterCreate: false, silentWhenMissing: false });
            })
            .catch(function () {
                showMessage(localizeText("portal.dynamic.networkErrorMoment", "Network error. Please try again in a moment."), "error");
            })
            .finally(function () {
                setSubmitting(false);
            });
    }

    function submitProfile(isUpdate) {
        if (isUpdate) {
            // Backend PUT currently does not parse urlencoded bodies reliably.
            // Use existing multipart update branch to submit profile edits.
            var updateData = new FormData();
            updateData.append("fullName", inputs.fullName.value.trim());
            updateData.append("studentId", inputs.studentId.value.trim());
            updateData.append("department", inputs.department.value.trim());
            updateData.append("program", inputs.program.value.trim());
            updateData.append("gpa", inputs.gpa.value.trim());
            updateData.append("skills", normalizeSkillsForSubmit(inputs.skills.value));
            updateData.append("phone", inputs.phone.value.trim());
            updateData.append("address", "");
            updateData.append("experience", inputs.experience.value.trim());
            updateData.append("motivation", inputs.motivation.value.trim());

            return request(contextPath + "/applicant", {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: updateData
            });
        }

        var createData = new URLSearchParams();
        createData.set("fullName", inputs.fullName.value.trim());
        createData.set("studentId", inputs.studentId.value.trim());
        createData.set("department", inputs.department.value.trim());
        createData.set("program", inputs.program.value.trim());
        createData.set("gpa", inputs.gpa.value.trim());
        createData.set("skills", normalizeSkillsForSubmit(inputs.skills.value));
        createData.set("phone", inputs.phone.value.trim());
        createData.set("address", "");
        createData.set("experience", inputs.experience.value.trim());
        createData.set("motivation", inputs.motivation.value.trim());

        return request(contextPath + "/applicant", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: createData.toString()
        });
    }

    function applyExistingProfile(payload, createdNow) {
        state.hasExistingProfile = true;
        state.isEditing = false;
        state.removedSavedResume = false;
        syncSavedResumeState(payload);
        syncResumeDraftState(payload);

        setFieldValue(inputs.fullName, payload.fullName);
        setFieldValue(inputs.studentId, payload.studentId);
        setFieldValue(inputs.department, payload.department);
        setSelectValue(inputs.program, payload.program);
        setFieldValue(inputs.gpa, payload.gpa);
        setFieldValue(inputs.skills, formatSkillsForDisplay(payload.skills));
        setFieldValue(inputs.phone, payload.phone);
        setFieldValue(inputs.experience, payload.experience);
        setFieldValue(inputs.motivation, payload.motivation);

        clearAllFieldValidation();
        resetFieldTouchedState();
        setFormDisabled(true);
        form.classList.add("is-readonly");

        updateProfileActionState();
        refreshResumeArea();

        if (createdNow) {
            showMessage(localizeText("portal.dynamic.profileCreatedSuccess", "Profile created successfully. Your saved information is now displayed below."), "success");
        } else {
            hideMessage();
        }
    }

    function enableCreateMode(payload) {
        state.hasExistingProfile = false;
        state.isEditing = false;
        state.resumePath = "";
        state.resumeName = "";
        state.resumeSize = 0;
        state.removedSavedResume = false;
        syncResumeDraftState(payload);
        setFormDisabled(false);
        form.classList.remove("is-readonly");
        clearAllFieldValidation();
        resetFieldTouchedState();
        refreshSubmitButton();
        refreshResumeArea();
    }

    function updateProfileActionState() {
        if (!submitButton) {
            return;
        }

        if (!state.hasExistingProfile || state.isEditing) {
            submitButton.disabled = false;
            submitButton.textContent = localizeText("portal.taDashboard.saveChangesButton", "Save changes");
            if (editButton) {
                editButton.hidden = true;
            }
            if (cancelEditButton) {
                cancelEditButton.hidden = true;
            }
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = localizeText("portal.taDashboard.saveChangesButton", "Save changes");

        if (editButton) {
            editButton.hidden = false;
            editButton.disabled = false;
        }
        if (cancelEditButton) {
            cancelEditButton.hidden = true;
            cancelEditButton.disabled = false;
        }
    }

    function enterEditMode() {
        state.isEditing = true;
        setFormDisabled(false);
        form.classList.remove("is-readonly");
        hideMessage();
        clearAllFieldValidation();

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = localizeText("portal.taDashboard.saveChangesButton", "Save changes");
        }
        if (editButton) {
            editButton.hidden = true;
        }
        if (cancelEditButton) {
            cancelEditButton.hidden = false;
            cancelEditButton.disabled = false;
        }
        refreshResumeArea();
    }

    function handleCancelEdit() {
        var reloadProfile = function () {
            state.isEditing = false;
            setSelectedResumeFile(null);
            hideResumeMessage();
            return loadExistingProfile({ afterCreate: false, silentWhenMissing: false });
        };

        if (!state.pendingResumePath) {
            reloadProfile();
            return;
        }

        discardPendingResume()
            .then(function () {
                return reloadProfile();
            })
            .catch(function (error) {
                var errorMessage = localizeText("portal.dynamic.resumeDiscardFailed", "Unable to discard the pending resume. Please try again.");
                if (error && typeof error.userMessage === "string" && error.userMessage.trim()) {
                    errorMessage = error.userMessage.trim();
                }
                showResumeMessage(errorMessage, "error");
            });
    }

    function refreshSubmitButton() {
        if (state.hasExistingProfile && !state.isEditing) {
            updateProfileActionState();
            return;
        }

        if (state.isSubmitting) {
            submitButton.textContent = localizeText("portal.dynamic.savingChanges", "Saving changes...");
            submitButton.disabled = true;
            return;
        }

        if (state.isLoading) {
            submitButton.textContent = localizeText("portal.dynamic.checkingProfile", "Checking profile...");
            submitButton.disabled = true;
            return;
        }

        if (state.isUploadingResume) {
            submitButton.textContent = localizeText("portal.dynamic.uploading", "Uploading") + "...";
            submitButton.disabled = true;
            return;
        }

        submitButton.textContent = localizeText("portal.taDashboard.saveChangesButton", "Save changes");
        submitButton.disabled = false;
    }

    function setSubmitting(submitting) {
        state.isSubmitting = submitting;
        if (!state.hasExistingProfile || state.isEditing) {
            setFormDisabled(submitting);
        }
        refreshSubmitButton();
        refreshResumeArea();
    }

    function setFormDisabled(disabled) {
        Array.prototype.forEach.call(formFields, function (field) {
            field.disabled = disabled;
        });
    }

    function syncResumeDraftState(payload) {
        state.pendingResumePath = payload && typeof payload.pendingResumePath === "string" ? payload.pendingResumePath : "";
        state.pendingResumeName = payload && typeof payload.pendingResumeName === "string" ? payload.pendingResumeName : "";
        state.pendingResumeSize = getPositiveNumber(payload && payload.pendingResumeSize);
    }

    function validateResumeRequirement() {
        if (state.pendingResumePath || hasSavedResume()) {
            return null;
        }

        var errorMessage = localizeText("portal.dynamic.resumeRequiredToSave", "Please upload your resume before saving your profile.");
        showResumeMessage(errorMessage, "error");
        if (resumeFileTrigger && typeof resumeFileTrigger.focus === "function") {
            resumeFileTrigger.focus();
        }
        return buildValidationError(errorMessage, resumeFileTrigger || submitButton);
    }

    function canEditResumeSection() {
        if (state.isLoading || state.isSubmitting || state.isUploadingResume) {
            return false;
        }
        return !state.hasExistingProfile || state.isEditing;
    }

    function handleResumeFileChange(event) {
        hideResumeMessage();

        var file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) {
            setSelectedResumeFile(null);
            return;
        }

        if (!canEditResumeSection()) {
            setSelectedResumeFile(null);
            return;
        }

        var fileError = validateResumeFile(file);
        if (fileError) {
            setSelectedResumeFile(null);
            showResumeMessage(fileError, "error");
            return;
        }

        setSelectedResumeFile(file);
        uploadDraftResume(file)
            .catch(function (error) {
                var uploadErrorMessage = localizeText("portal.dynamic.resumeUploadFailed", "Resume upload failed. Please try again.");
                if (error && typeof error.userMessage === "string" && error.userMessage.trim()) {
                    uploadErrorMessage = error.userMessage.trim();
                }
                setSelectedResumeFile(null);
                showResumeMessage(uploadErrorMessage, "error");
            });
    }

    function uploadDraftResume(file) {
        if (!file) {
            var noFileError = new Error("No resume file selected.");
            noFileError.userMessage = localizeText("portal.dynamic.chooseResumeFirst", "Please choose a resume file first.");
            return Promise.reject(noFileError);
        }

        setResumeUploading(true);
        showResumeMessage(
            localizeText("portal.dynamic.resumeDraftUploading", "Uploading resume draft:") + " " + file.name + "...",
            "success"
        );

        return uploadDraftResumeWithProgress(file)
            .then(function (result) {
                var status = result.status;
                var payload = result.payload;

                if (status === 401) {
                    handleUnauthorized();
                    var unauthorizedError = new Error("Unauthorized.");
                    unauthorizedError.userMessage = "Your session has expired. Redirecting to login...";
                    throw unauthorizedError;
                }

                if (status < 200 || status >= 300 || !payload || payload.success !== true) {
                    var serverMessage = payload && typeof payload.message === "string" && payload.message.trim()
                        ? payload.message.trim()
                        : localizeText("portal.dynamic.resumeUploadFailed", "Resume upload failed. Please try again.");
                    var uploadError = new Error(serverMessage);
                    uploadError.userMessage = serverMessage;
                    throw uploadError;
                }

                syncResumeDraftState(extractData(payload));
                setSelectedResumeFile(null);
                showResumeMessage(
                    localizeText(
                        state.resumePath ? "portal.dynamic.resumeDraftReplaceSaved" : "portal.dynamic.resumeDraftSaved",
                        state.resumePath
                            ? "New resume uploaded. Save changes to replace the current resume."
                            : "Resume draft uploaded. Save changes to apply it."
                    ),
                    "success"
                );
            })
            .finally(function () {
                setResumeUploading(false);
                refreshResumeArea();
            });
    }

    function uploadDraftResumeWithProgress(file) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("PUT", contextPath + "/applicant?draftResume=true", true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            xhr.onerror = function () {
                var networkError = new Error("Network error.");
                networkError.userMessage = localizeText("portal.dynamic.uploadNetworkError", "Network error during file upload. Please try again.");
                reject(networkError);
            };

            xhr.onabort = function () {
                var abortError = new Error("Upload aborted.");
                abortError.userMessage = localizeText("portal.dynamic.uploadInterrupted", "Upload was interrupted. Please try again.");
                reject(abortError);
            };

            xhr.onload = function () {
                resolve({
                    status: xhr.status,
                    payload: parseResponse(xhr.responseText || "")
                });
            };

            var data = new FormData();
            data.append("resume", file, file.name);
            xhr.send(data);
        });
    }

    function validateResumeFile(file) {
        if (!file) {
            return localizeText("portal.dynamic.chooseResumeFirst", "Please choose a resume file first.");
        }

        var lowerName = typeof file.name === "string" ? file.name.toLowerCase() : "";
        var extensionAllowed = ALLOWED_RESUME_EXTENSIONS.some(function (extension) {
            return lowerName.endsWith(extension);
        });
        if (!extensionAllowed) {
            return localizeText("portal.dynamic.invalidResumeFormat", "Invalid file format. Please upload a PDF, DOC, or DOCX file.");
        }

        if (typeof file.size === "number" && file.size > MAX_RESUME_SIZE) {
            return localizeText("portal.dynamic.resumeTooLarge", "File size exceeds 10MB. Please choose a smaller file.");
        }

        return null;
    }

    function setSelectedResumeFile(file) {
        state.selectedResumeFile = file || null;
        if (resumeFileInput && !file) {
            resumeFileInput.value = "";
        }
        refreshResumeArea();
    }

    function setResumeUploading(uploading) {
        state.isUploadingResume = uploading;
        refreshSubmitButton();
        refreshResumeArea();
    }

    function handleResumeRemove() {
        if (!canEditResumeSection()) {
            return;
        }

        hideResumeMessage();

        if (state.pendingResumePath) {
            discardPendingResume()
                .then(function () {
                    setSelectedResumeFile(null);
                    showResumeMessage(localizeText("portal.dynamic.pendingResumeRemoved", "Pending resume removed."), "success");
                    refreshResumeArea();
                })
                .catch(function (error) {
                    var pendingRemoveError = localizeText("portal.dynamic.resumeDiscardFailed", "Unable to discard the pending resume. Please try again.");
                    if (error && typeof error.userMessage === "string" && error.userMessage.trim()) {
                        pendingRemoveError = error.userMessage.trim();
                    }
                    showResumeMessage(pendingRemoveError, "error");
                });
            return;
        }

        if (state.selectedResumeFile) {
            setSelectedResumeFile(null);
            return;
        }

        if (hasSavedResume()) {
            state.removedSavedResume = true;
            refreshResumeArea();
            showResumeMessage(
                localizeText("portal.dynamic.savedResumeRemoved", "Current resume removed. Upload a new one before saving changes."),
                "success"
            );
        }
    }

    function refreshResumeArea() {
        var resumeSectionEditable = canEditResumeSection();
        var activeResumeCard = buildActiveResumeCard();

        if (resumeFileTrigger) {
            resumeFileTrigger.disabled = !resumeSectionEditable;
        }
        if (resumeFileInput) {
            resumeFileInput.disabled = !resumeSectionEditable;
        }

        if (resumeUploadShell) {
            resumeUploadShell.classList.toggle("is-empty", !activeResumeCard);
            resumeUploadShell.classList.toggle("is-filled", !!activeResumeCard);
            resumeUploadShell.classList.toggle("is-disabled", !resumeSectionEditable);
            resumeUploadShell.classList.toggle("is-uploading", state.isUploadingResume);
        }

        if (resumeEmptyState) {
            resumeEmptyState.hidden = !!activeResumeCard;
            resumeEmptyState.classList.toggle("hidden", !!activeResumeCard);
        }
        if (resumeFilledState) {
            resumeFilledState.hidden = !activeResumeCard;
            resumeFilledState.classList.toggle("hidden", !activeResumeCard);
        }

        if (resumeFileDisplayName && activeResumeCard) {
            resumeFileDisplayName.textContent = activeResumeCard.name;
        }
        if (resumeFileDisplayDetail && activeResumeCard) {
            resumeFileDisplayDetail.textContent = activeResumeCard.detail;
        }

        if (resumeRemoveButton) {
            var canRemoveCurrentResume = !!activeResumeCard && resumeSectionEditable && !state.isUploadingResume;
            resumeRemoveButton.hidden = !canRemoveCurrentResume;
            resumeRemoveButton.classList.toggle("hidden", !canRemoveCurrentResume);
            resumeRemoveButton.disabled = !canRemoveCurrentResume;
        }
    }

    function buildActiveResumeCard() {
        if (state.selectedResumeFile) {
            return {
                name: state.selectedResumeFile.name,
                detail: buildResumeCardDetail(state.selectedResumeFile.size)
            };
        }

        if (state.pendingResumePath) {
            return {
                name: state.pendingResumeName || extractFileNameFromPath(state.pendingResumePath),
                detail: buildResumeCardDetail(state.pendingResumeSize)
            };
        }

        if (hasSavedResume()) {
            return {
                name: state.resumeName || extractFileNameFromPath(state.resumePath),
                detail: buildResumeCardDetail(state.resumeSize)
            };
        }

        return null;
    }

    function buildResumeCardDetail(fileSize) {
        if (typeof fileSize === "number" && fileSize > 0) {
            return formatFileSize(fileSize);
        }
        return localizeText("portal.dynamic.resumeReady", "Resume ready");
    }

    function hasSavedResume() {
        return hasText(state.resumePath) && !state.removedSavedResume;
    }

    function syncSavedResumeState(payload) {
        state.resumePath = payload && typeof payload.resumePath === "string" ? payload.resumePath : "";
        state.resumeName = payload && typeof payload.resumeName === "string" ? payload.resumeName : "";
        state.resumeSize = getPositiveNumber(payload && payload.resumeSize);
    }

    function showResumeMessage(message, type) {
        if (!resumeUploadMessage) {
            return;
        }
        resumeUploadMessage.textContent = message;
        resumeUploadMessage.classList.remove("hidden", "error", "success");
        resumeUploadMessage.classList.add(type === "success" ? "success" : "error");
    }

    function hideResumeMessage() {
        if (!resumeUploadMessage) {
            return;
        }
        resumeUploadMessage.textContent = "";
        resumeUploadMessage.classList.remove("error", "success");
        resumeUploadMessage.classList.add("hidden");
    }

    function discardPendingResume() {
        return request(contextPath + "/applicant?draftResume=true", {
            method: "DELETE",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }).then(function (result) {
            var response = result.response;
            var payload = result.payload;

            if (response.status === 401) {
                handleUnauthorized();
                var unauthorizedError = new Error("Unauthorized.");
                unauthorizedError.userMessage = "Your session has expired. Redirecting to login...";
                throw unauthorizedError;
            }

            if (!response.ok || !payload || payload.success !== true) {
                var errorMessage = payload && typeof payload.message === "string" && payload.message.trim()
                    ? payload.message.trim()
                    : localizeText("portal.dynamic.resumeDiscardFailed", "Unable to discard the pending resume. Please try again.");
                var discardError = new Error(errorMessage);
                discardError.userMessage = errorMessage;
                throw discardError;
            }

            syncResumeDraftState(extractData(payload));
        });
    }

    function formatFileSize(bytes) {
        if (typeof bytes !== "number" || bytes < 0) {
            return "0 B";
        }
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + " KB";
        }
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    function getPositiveNumber(value) {
        return typeof value === "number" && value > 0 ? value : 0;
    }

    function hasText(value) {
        return typeof value === "string" && value.trim().length > 0;
    }

    function extractFileNameFromPath(path) {
        if (typeof path !== "string" || !path.trim()) {
            return "";
        }

        var normalizedPath = path.replace(/\\/g, "/");
        var segments = normalizedPath.split("/");
        return segments[segments.length - 1] || normalizedPath;
    }

    function validateForm() {
        var firstError = null;

        Object.keys(inputs).forEach(function (key) {
            if (!inputs[key]) {
                return;
            }

            fieldValidationState.touchedByKey[key] = true;
            var result = validateSingleField(key, { forceRequired: true });
            if (!firstError && result && result.message) {
                firstError = buildValidationError(result.message, result.field);
            }
        });

        return firstError;
    }

    function initializeRealtimeValidation() {
        Object.keys(inputs).forEach(function (key) {
            var field = inputs[key];
            if (!field) {
                return;
            }

            fieldValidationState.feedbackByKey[key] = ensureFieldFeedbackNode(key, field);
            fieldValidationState.touchedByKey[key] = false;

            field.addEventListener("blur", function () {
                if (state.hasExistingProfile || field.disabled) {
                    return;
                }
                fieldValidationState.touchedByKey[key] = true;
                validateSingleField(key, { forceRequired: true });
            });

            if (field.tagName === "SELECT") {
                field.addEventListener("change", function () {
                    if (state.hasExistingProfile || field.disabled) {
                        return;
                    }
                    validateSingleField(key, {
                        forceRequired: fieldValidationState.touchedByKey[key] === true
                    });
                });
                return;
            }

            field.addEventListener("input", function () {
                if (state.hasExistingProfile || field.disabled) {
                    return;
                }
                validateSingleField(key, {
                    forceRequired: fieldValidationState.touchedByKey[key] === true
                });
            });

            field.addEventListener("change", function () {
                if (state.hasExistingProfile || field.disabled) {
                    return;
                }
                validateSingleField(key, {
                    forceRequired: fieldValidationState.touchedByKey[key] === true
                });
            });
        });
    }

    function initializeEnterKeyBehavior() {
        form.addEventListener("keydown", function (event) {
            if (!event || event.key !== "Enter" || event.isComposing) {
                return;
            }

            var target = event.target;
            if (!target || target.form !== form) {
                return;
            }

            // Keep native Enter behavior for multiline input.
            if (target.tagName === "TEXTAREA") {
                return;
            }

            // Allow explicit submit from submit button.
            if (target === submitButton || (target.tagName === "BUTTON" && target.type === "submit")) {
                return;
            }

            // Avoid accidental submit from Enter while filling fields.
            event.preventDefault();

            if (state.hasExistingProfile || state.isLoading || state.isSubmitting || target.disabled) {
                return;
            }

            var key = getFieldKeyByElement(target);
            if (key) {
                fieldValidationState.touchedByKey[key] = true;
                var result = validateSingleField(key, { forceRequired: true });
                if (result && result.message) {
                    return;
                }
            }

            focusNextFormControl(target);
        });
    }

    function getFieldKeyByElement(element) {
        var matchedKey = "";
        Object.keys(inputs).some(function (key) {
            if (inputs[key] === element) {
                matchedKey = key;
                return true;
            }
            return false;
        });
        return matchedKey;
    }

    function focusNextFormControl(current) {
        var orderedControls = [];
        orderedInputKeys.forEach(function (key) {
            if (inputs[key]) {
                orderedControls.push(inputs[key]);
            }
        });
        if (submitButton) {
            orderedControls.push(submitButton);
        }

        var currentIndex = orderedControls.indexOf(current);
        if (currentIndex < 0) {
            return;
        }

        var next;
        var i;
        for (i = currentIndex + 1; i < orderedControls.length; i += 1) {
            next = orderedControls[i];
            if (!next || next.disabled || typeof next.focus !== "function") {
                continue;
            }
            next.focus();
            return;
        }
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

            var fieldHint = container.querySelector(".field-hint");
            if (fieldHint) {
                container.insertBefore(feedback, fieldHint);
            } else {
                container.appendChild(feedback);
            }
        }

        var describedBy = field.getAttribute("aria-describedby");
        if (!describedBy) {
            field.setAttribute("aria-describedby", feedback.id);
        } else if ((" " + describedBy + " ").indexOf(" " + feedback.id + " ") === -1) {
            field.setAttribute("aria-describedby", describedBy + " " + feedback.id);
        }

        return feedback;
    }

    function clearAllFieldValidation() {
        Object.keys(inputs).forEach(function (key) {
            setFieldValidationResult(key, "");
        });
    }

    function resetFieldTouchedState() {
        Object.keys(inputs).forEach(function (key) {
            fieldValidationState.touchedByKey[key] = false;
        });
    }

    function setFieldValidationResult(key, message) {
        var field = inputs[key];
        var feedback = fieldValidationState.feedbackByKey[key];
        if (!field || !feedback) {
            return;
        }

        if (message) {
            feedback.textContent = message;
            feedback.classList.add("is-visible");
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
            return;
        }

        feedback.textContent = "";
        feedback.classList.remove("is-visible");
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
    }

    function validateSingleField(key, options) {
        var field = inputs[key];
        if (!field) {
            return null;
        }

        if (field.disabled) {
            setFieldValidationResult(key, "");
            return {
                field: field,
                message: ""
            };
        }

        var settings = options || {};
        var forceRequired = settings.forceRequired === true;
        var value = typeof field.value === "string" ? field.value.trim() : "";
        var message = getFieldValidationMessage(key, value, forceRequired);
        setFieldValidationResult(key, message);

        return {
            field: field,
            message: message
        };
    }

    function getFieldValidationMessage(key, value, forceRequired) {
        var isRequired = key === "fullName"
            || key === "studentId"
            || key === "department"
            || key === "program"
            || key === "gpa"
            || key === "phone"
            || key === "skills"
            || key === "experience"
            || key === "motivation";
        if (isRequired && forceRequired && !value) {
            if (key === "fullName") {
                return "Please enter your full name.";
            }
            if (key === "studentId") {
                return "Please enter your student ID.";
            }
            if (key === "department") {
                return "Please enter your department.";
            }
            if (key === "program") {
                return "Please select your program.";
            }
            if (key === "gpa") {
                return "Please enter your GPA.";
            }
            if (key === "phone") {
                return "Please enter your phone number.";
            }
            if (key === "skills") {
                return "Please enter at least one skill.";
            }
            if (key === "experience") {
                return "Please describe your related experience.";
            }
            return "Please explain your motivation.";
        }

        if (!value) {
            return "";
        }

        if (key === "fullName") {
            if (value.length > 100) {
                return "Full name must be 100 characters or fewer.";
            }
            if (value.length < 2) {
                return "Full name must be at least 2 characters.";
            }
            if (!hasLetterOrCjk(value)) {
                return "Full name must include at least one letter.";
            }
            if (!/^[A-Za-z\u00C0-\u024F\u4E00-\u9FFF\s.'-]+$/.test(value)) {
                return "Full name may only include letters, spaces, apostrophes, periods, and hyphens.";
            }
            if (hasExcessiveRepeatedChars(value, 4)) {
                return "Full name contains too many repeated characters.";
            }
            return "";
        }

        if (key === "studentId") {
            if (!/^\d{10}$/.test(value)) {
                return "Student ID must be exactly 10 digits, for example 2023213039.";
            }
            if (!/^20\d{8}$/.test(value)) {
                return "Student ID should start with 20, for example 2023213051.";
            }
            var intakeYear = parseInt(value.substring(0, 4), 10);
            if (isNaN(intakeYear) || intakeYear < 2010 || intakeYear > 2099) {
                return "Student ID year appears invalid. Please check the first 4 digits.";
            }
            if (/^(\d)\1{9}$/.test(value)) {
                return "Student ID appears invalid. Please check your official 10-digit student number.";
            }
            return "";
        }

        if (key === "department") {
            if (value.length > 100) {
                return "Department must be 100 characters or fewer.";
            }
            if (value.length < 2) {
                return "Department must be at least 2 characters.";
            }
            if (!hasLetterOrCjk(value)) {
                return "Department should include letters.";
            }
            if (!/^[A-Za-z0-9\u00C0-\u024F\u4E00-\u9FFF\s&(),./'-]+$/.test(value)) {
                return "Department contains unsupported characters.";
            }
            if (hasExcessiveRepeatedChars(value, 6)) {
                return "Department contains too many repeated characters.";
            }
            return "";
        }

        if (key === "program") {
            if (["Undergraduate", "Master", "PhD"].indexOf(value) === -1) {
                return "Please select a valid program option.";
            }
            return "";
        }

        if (key === "gpa") {
            if (value.length > 20) {
                return "GPA must be 20 characters or fewer.";
            }
            if (!/^[0-9.,/\s]+$/.test(value)) {
                return "GPA may only include digits, spaces, decimal separators, and '/'.";
            }

            var normalized = value.replace(/\s+/g, "").replace(/,/g, ".");
            if (normalized.split("/").length > 2) {
                return "GPA format is invalid. Use one optional '/'.";
            }
            var parts = normalized.split("/");
            if (!/^\d{1,3}(\.\d{1,2})?$/.test(parts[0])) {
                return "GPA value supports up to 2 decimal places.";
            }

            var actual = parseFloat(parts[0]);
            if (isNaN(actual) || actual < 0) {
                return "GPA cannot be negative.";
            }

            if (parts.length === 2) {
                if (!/^\d{1,3}(\.\d{1,2})?$/.test(parts[1])) {
                    return "GPA scale supports up to 2 decimal places.";
                }
                var scale = parseFloat(parts[1]);
                if (isNaN(scale) || scale < 4 || scale > 100) {
                    return "GPA scale should be between 4 and 100.";
                }
                if (actual > scale) {
                    return "GPA value cannot be greater than the GPA scale.";
                }
            } else {
                if (actual > 4.3) {
                    return "For GPA above 4.3, please include scale (for example 85/100).";
                }
            }
            return "";
        }

        if (key === "skills") {
            if (value.length > 300) {
                return "Skills must be 300 characters or fewer.";
            }
            if (/(^[;,]|[;,]\s*[;,]|[;,]\s*$)/.test(value)) {
                return "Please remove empty skill items between separators.";
            }

            var items = value.split(/[;,]/).map(function (item) {
                return item.trim();
            }).filter(function (item) {
                return item.length > 0;
            });

            if (items.length === 0) {
                return "";
            }
            if (items.length > 12) {
                return "Please list up to 12 skills.";
            }

            var seen = {};
            var i;
            for (i = 0; i < items.length; i += 1) {
                var skill = items[i];
                if (skill.length < 2 || skill.length > 40) {
                    return "Each skill should be 2 to 40 characters.";
                }
                if (!hasLetterOrCjk(skill)) {
                    return "Each skill should include letters.";
                }
                if (!/^[A-Za-z0-9\u00C0-\u024F\u4E00-\u9FFF+#&./\-\s]+$/.test(skill)) {
                    return "Skills contain unsupported characters.";
                }
                if (hasExcessiveRepeatedChars(skill, 5)) {
                    return "A skill item has too many repeated characters.";
                }
                var normalizedSkill = skill.toLowerCase().replace(/\s+/g, " ");
                if (seen[normalizedSkill]) {
                    return "Duplicate skills found. Please keep each skill only once.";
                }
                seen[normalizedSkill] = true;
            }
            return "";
        }

        if (key === "phone") {
            if (value.length > 30) {
                return "Phone number must be 30 characters or fewer.";
            }
            if (!/^[\d+\-()./\s]+$/.test(value)) {
                return "Phone number may only include digits, spaces, and + - ( ) . /.";
            }

            var plusMatches = value.match(/\+/g);
            if (plusMatches && plusMatches.length > 1) {
                return "Phone number can contain only one '+'.";
            }
            if (value.indexOf("+") > 0) {
                return "If used, '+' must be at the beginning.";
            }
            if (!hasBalancedParentheses(value)) {
                return "Phone number parentheses are not balanced.";
            }

            var digits = value.replace(/\D/g, "");
            if (digits.length < 8 || digits.length > 15) {
                return "Phone number should contain 8 to 15 digits.";
            }
            if (/^(\d)\1+$/.test(digits)) {
                return "Phone number appears invalid. Please check repeated digits.";
            }
            if (value.charAt(0) === "+" && digits.length < 10) {
                return "International format should usually contain at least 10 digits.";
            }
            return "";
        }

        if (key === "experience") {
            return validateLongTextField(value, "Related experience");
        }

        if (key === "motivation") {
            return validateLongTextField(value, "Motivation");
        }

        return "";
    }

    function hasLetterOrCjk(text) {
        return /[A-Za-z\u00C0-\u024F\u4E00-\u9FFF]/.test(text || "");
    }

    function hasBalancedParentheses(text) {
        var balance = 0;
        var i;
        for (i = 0; i < text.length; i += 1) {
            var char = text.charAt(i);
            if (char === "(") {
                balance += 1;
            } else if (char === ")") {
                balance -= 1;
                if (balance < 0) {
                    return false;
                }
            }
        }
        return balance === 0;
    }

    function hasExcessiveRepeatedChars(text, threshold) {
        if (!text) {
            return false;
        }
        var safeThreshold = typeof threshold === "number" ? Math.max(1, threshold) : 4;
        var repeatedPattern = new RegExp("(.)\\1{" + safeThreshold + ",}");
        return repeatedPattern.test(text);
    }

    function getTextContentUnits(text) {
        if (!text) {
            return 0;
        }
        var cjkChars = text.match(/[\u4E00-\u9FFF]/g) || [];
        var latinWords = text
            .replace(/[\u4E00-\u9FFF]/g, " ")
            .match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || [];
        return cjkChars.length + latinWords.length;
    }

    function validateLongTextField(value, label) {
        if (value.length > 1200) {
            return label + " must be 1200 characters or fewer.";
        }
        if (!value) {
            return "";
        }
        if (value.length < 20) {
            return label + " should be at least 20 characters if provided.";
        }
        if (getTextContentUnits(value) < 10) {
            return label + " should contain more detail (about 10 words/characters).";
        }
        if (hasExcessiveRepeatedChars(value, 8)) {
            return label + " contains too many repeated characters.";
        }
        return "";
    }

    function buildValidationError(message, field) {
        return {
            message: message,
            field: field
        };
    }

    function request(url, options) {
        return fetch(url, options).then(function (response) {
            return response.text().then(function (bodyText) {
                return {
                    response: response,
                    payload: parseResponse(bodyText)
                };
            });
        });
    }

    function parseResponse(bodyText) {
        return JSON.parse(bodyText);
    }

    function extractData(payload) {
        if (!payload || typeof payload !== "object") {
            return {};
        }
        if (payload.data && typeof payload.data === "object") {
            return payload.data;
        }
        return payload;
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

    function formatSkillsForDisplay(value) {
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
            .join(", ");
    }

    function setFieldValue(field, value) {
        if (field) {
            field.value = typeof value === "string" ? value : "";
        }
    }

    function setSelectValue(field, value) {
        if (!field) {
            return;
        }

        var normalizedValue = typeof value === "string" ? value.trim() : "";
        if (!normalizedValue) {
            field.value = "";
            return;
        }

        var hasOption = Array.prototype.some.call(field.options, function (option) {
            return option.value === normalizedValue;
        });

        if (!hasOption) {
            var injectedOption = document.createElement("option");
            injectedOption.value = normalizedValue;
            injectedOption.textContent = normalizedValue;
            field.appendChild(injectedOption);
        }

        field.value = normalizedValue;
    }

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.classList.remove("hidden", "error", "success");
        messageBox.classList.add(type === "success" ? "success" : "error");
    }

    function hideMessage() {
        messageBox.textContent = "";
        messageBox.classList.remove("error", "success");
        messageBox.classList.add("hidden");
    }

    function handleUnauthorized() {
        showMessage(localizeText("portal.dynamic.sessionExpiredRedirect", "Your session has expired. Redirecting to login..."), "error");
        window.setTimeout(function () {
            window.location.href = contextPath + "/login.jsp";
        }, 1000);
    }

})();
