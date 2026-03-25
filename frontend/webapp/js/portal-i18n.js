(function () {
    "use strict";
    var CHINESE_LOCALE = "zh-CN";

    function hasI18n() {
        return window.AppI18n && typeof window.AppI18n.t === "function";
    }

    function t(key, fallback) {
        if (hasI18n()) {
            return window.AppI18n.t(key, fallback || key);
        }
        return fallback || key;
    }

    function useEnglishPluralSuffix() {
        if (!hasI18n() || typeof window.AppI18n.getLocale !== "function") {
            return true;
        }
        return window.AppI18n.getLocale() === "en";
    }

    function currentLocale() {
        if (window.AppI18n && typeof window.AppI18n.getLocale === "function") {
            return window.AppI18n.getLocale();
        }
        var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
        if (lang.indexOf("zh") === 0) {
            return CHINESE_LOCALE;
        }
        return "en";
    }

    var localZhByKey = {
        "portal.dynamic.currentCompleteness": "当前完整度：",
        "portal.dynamic.checkingProfile": "正在检查档案...",
        "portal.dynamic.creatingProfile": "正在创建档案...",
        "portal.dynamic.profileAlreadyExists": "当前账号已存在档案，正在加载已保存内容...",
        "portal.dynamic.fixHighlightedFields": "请先修正高亮字段后再试。",
        "portal.dynamic.noProfileFound": "尚未找到档案，请先填写下方表单。",
        "portal.dynamic.unableCheckProfile": "暂时无法检查已有档案，你仍可以尝试创建。",
        "portal.dynamic.unableCreateProfile": "无法创建档案，请检查表单后重试。",
        "portal.dynamic.unableUpdateProfile": "无法更新档案，请检查表单后重试。",
        "portal.dynamic.profileCreatedUploadingResume": "档案创建成功，正在上传你选择的简历...",
        "portal.dynamic.profileCreatedResumeFailed": "档案创建成功，但简历上传失败，请稍后重试。",
        "portal.dynamic.profileCreatedSuccess": "档案创建成功，已在下方显示你的已保存信息。",
        "portal.dynamic.profileCreatedResumeFailed": "档案创建成功，但简历上传失败，请稍后重试。",
        "portal.dynamic.profileUpdatedSuccess": "档案更新成功。",
        "portal.dynamic.savingChanges": "保存中...",
        "portal.dynamic.profileReadonly": "你的档案已创建，当前以只读模式显示。",
        "portal.dynamic.currentResumePrefix": "当前已上传简历：",
        "portal.dynamic.noResumeUploaded": "尚未上传简历。",
        "portal.dynamic.noResumeSelected": "尚未选择简历文件。",
        "portal.dynamic.chooseResumeFirst": "请先选择简历文件。",
        "portal.dynamic.resumeRequiredToSave": "请先上传简历，再保存档案。",
        "portal.dynamic.choosePhotoFirst": "请先选择照片文件。",
        "portal.dynamic.photoReadyToSave": "照片已选择，点击保存更改后生效。",
        "portal.dynamic.savedPhotoRemoved": "当前照片已移除，点击保存更改后生效。",
        "portal.dynamic.photoReady": "照片已就绪",
        "portal.dynamic.resumeDraftUploading": "正在上传简历草稿：",
        "portal.dynamic.resumeDraftSaved": "简历草稿已上传，点击保存更改后生效。",
        "portal.dynamic.resumeDraftReplaceSaved": "新简历已上传，点击保存更改后会替换当前简历。",
        "portal.dynamic.pendingResumePrefix": "待保存简历：",
        "portal.dynamic.pendingResumeCreateSuffix": " 填写其他信息后点击保存更改即可创建档案。",
        "portal.dynamic.pendingResumeReplaceSuffix": " 点击保存更改后将替换当前简历。",
        "portal.dynamic.resumeDiscardFailed": "暂时无法丢弃待保存简历，请稍后重试。",
        "portal.dynamic.createProfileThenUpload": "请先创建档案，再上传简历。",
        "portal.dynamic.createProfileAutoUpload": "请先创建档案。创建成功后会自动上传当前已选文件。",
        "portal.dynamic.resumeReadyAfterCreate": "简历文件已就绪，将在档案创建后自动上传。",
        "portal.dynamic.resumeReadyReplace": "简历文件已就绪，点击上传以替换当前简历。",
        "portal.dynamic.resumeWillUploadAfterCreate": "将在档案创建后上传",
        "portal.dynamic.replaceUploadedResume": "替换已上传简历",
        "portal.dynamic.uploading": "上传中",
        "portal.dynamic.uploadCompleted": "上传完成",
        "portal.dynamic.uploadAborted": "上传已中止。",
        "portal.dynamic.uploadInterrupted": "上传被中断，请重试。",
        "portal.dynamic.uploadNetworkError": "上传简历时网络异常，请稍后再试。",
        "portal.dynamic.resumeUploadSuccess": "简历上传成功。",
        "portal.dynamic.resumeUpdateSuccess": "简历更新成功。",
        "portal.dynamic.resumeUploadFailed": "简历上传失败，请稍后重试。",
        "portal.dynamic.invalidResumeFormat": "文件格式无效，请上传 PDF、DOC 或 DOCX 文件。",
        "portal.dynamic.resumeTooLarge": "文件超过 10MB，请选择更小的文件。",
        "portal.dynamic.invalidPhotoFormat": "照片格式无效，请上传 JPG、PNG 或 WEBP 文件。",
        "portal.dynamic.photoTooLarge": "照片超过 5MB，请选择更小的文件。",
        "portal.dynamic.noSpecificSkills": "未列出具体技能。",
        "portal.dynamic.unableLoadJobs": "暂时无法加载职位。",
        "portal.dynamic.unableLoadJobsRetry": "暂时无法加载职位，请稍后重试。",
        "portal.dynamic.noJobsForFilters": "当前筛选条件下没有职位。",
        "portal.dynamic.noJobsAvailable": "当前暂无可用职位。",
        "portal.dynamic.showing": "显示",
        "portal.dynamic.jobUnit": "职位",
        "portal.dynamic.unableLoadPositionsTitle": "无法加载职位",
        "portal.dynamic.refreshAfterNetworkCheck": "请检查网络后点击刷新重试。",
        "portal.dynamic.noPositionsPublishedTitle": "暂未发布职位",
        "portal.dynamic.positionsAppearAfterPublish": "MO 发布新职位后将显示在这里。",
        "portal.dynamic.noMatchingPositionsTitle": "没有匹配的职位",
        "portal.dynamic.broadenKeywordHint": "可尝试放宽关键词或清除部分筛选条件。",
        "portal.dynamic.noExtraTags": "无额外标签",
        "portal.dynamic.viewDetails": "查看详情",
        "portal.dynamic.applyNow": "立即申请",
        "portal.dynamic.moShort": "MO",
        "portal.dynamic.submitting": "提交中...",
        "portal.dynamic.applicationSubmitted": "申请已提交。",
        "portal.dynamic.applicationSubmittedRedirect": "申请提交成功，正在跳转到申请状态页...",
        "portal.dynamic.failedSubmitApplication": "提交申请失败，请重试。",
        "portal.dynamic.currentAccountCannotSubmit": "当前账号无法在此页面提交申请。",
        "portal.dynamic.onlyTaSubmit": "仅 TA 账号可提交申请。",
        "portal.dynamic.alreadyApplied": "你已申请过该职位。",
        "portal.dynamic.jobNoLongerAvailable": "该职位不存在，可能已被移除。",
        "portal.dynamic.jobNotAccepting": "该职位当前不接受新申请。",
        "portal.dynamic.positionCurrently": "该职位当前状态为",
        "portal.dynamic.newApplicationsDisabled": "。已关闭新申请。",
        "portal.dynamic.jobNotFound": "职位不存在，可能已被移除。",
        "portal.dynamic.applicationUnavailable": "申请不可用",
        "portal.dynamic.applicationStatusPrefix": "申请状态：",
        "portal.dynamic.networkErrorSubmitApplication": "提交申请时网络异常。",
        "portal.dynamic.taOnlyPage": "该页面仅 TA 账号可访问。",
        "portal.dynamic.unableLoadApplications": "无法加载你的申请数据。",
        "portal.dynamic.unableLoadApplicationsNow": "暂时无法加载申请数据。",
        "portal.dynamic.noApplicationsSubmitted": "你还没有提交任何申请。",
        "portal.dynamic.noApplicationsMatchFilters": "当前筛选条件下没有申请记录。",
        "portal.dynamic.applicationUnit": "申请",
        "portal.dynamic.unableLoadApplicationsTitle": "无法加载申请",
        "portal.dynamic.noMatchingApplicationsTitle": "没有匹配的申请",
        "portal.dynamic.noApplicationsYetTitle": "暂无申请",
        "portal.dynamic.statusAppearsAfterApply": "你申请职位后，状态会显示在这里。",
        "portal.dynamic.clearFiltersToBroaden": "尝试清除状态或关键词筛选来扩大结果范围。",
        "portal.dynamic.applicationWithdrawnSuccess": "申请已成功撤回。",
        "portal.dynamic.unableWithdrawApplication": "无法撤回该申请。",
        "portal.dynamic.networkErrorWithdrawApplication": "撤回申请时网络异常。",
        "portal.dynamic.appliedAt": "申请时间",
        "portal.dynamic.coverLetterColon": "求职信：",
        "portal.dynamic.noCoverLetterProvided": "未提供求职信。",
        "portal.dynamic.viewJob": "查看职位",
        "portal.dynamic.withdraw": "撤回",
        "portal.dynamic.onlyMoPublish": "仅 MO 账号可发布职位。",
        "portal.dynamic.failedPublishJob": "发布职位失败，请检查输入后重试。",
        "portal.dynamic.jobPostedSuccess": "职位发布成功。",
        "portal.dynamic.networkErrorPostingJob": "发布职位时网络异常。",
        "portal.dynamic.unableLoadPostings": "暂时无法加载发布列表。",
        "portal.dynamic.noJobsPostedYet": "你尚未发布职位。",
        "portal.dynamic.youHavePosted": "你已发布",
        "portal.dynamic.noPostingsYetTitle": "尚无发布记录",
        "portal.dynamic.publishFirstTaPosition": "使用表单发布你的第一个 TA 职位。",
        "portal.dynamic.reviewApplicants": "审核申请人",
        "portal.dynamic.untitledPosition": "未命名职位",
        "portal.dynamic.overviewPartialLoad": "部分概览数据加载失败，已展示可用结果。",
        "portal.dynamic.unableLoadOverview": "暂时无法加载概览数据。",
        "portal.dynamic.moOnlyPage": "该页面仅 MO 账号可访问。",
        "portal.dynamic.noActivityYet": "暂无活动。",
        "portal.dynamic.tracking": "跟踪",
        "portal.dynamic.noRecentActivityTitle": "暂无最近活动",
        "portal.dynamic.latestUpdatesAppear": "当 TA 申请你的职位后，最新动态会显示在这里。",
        "portal.dynamic.newApplicationReceived": "收到新申请",
        "portal.dynamic.offerAccepted": "录用已确认",
        "portal.dynamic.applicationRejected": "申请已拒绝",
        "portal.dynamic.applicationWithdrawn": "申请已撤回",
        "portal.dynamic.applicationUpdated": "申请已更新",
        "portal.dynamic.unknownApplicant": "未知申请人",
        "portal.dynamic.loadingMatchResults": "正在加载匹配结果...",
        "portal.dynamic.unableLoadJobsMatching": "无法加载用于匹配分析的职位。",
        "portal.dynamic.unableLoadApplicationMatches": "无法加载申请匹配结果。",
        "portal.dynamic.networkErrorLoadingMatchData": "加载匹配数据时网络异常。",
        "portal.dynamic.noApplicantsForJob": "所选职位暂无申请人。",
        "portal.dynamic.noMatchDataTitle": "暂无匹配数据",
        "portal.dynamic.askCandidatesThenLoadMatch": "请先让候选人提交申请，再加载匹配结果。",
        "portal.dynamic.skillScore": "技能分",
        "portal.dynamic.keywordScore": "关键词分",
        "portal.dynamic.matchedColon": "匹配：",
        "portal.dynamic.missingColon": "缺失：",
        "portal.dynamic.keywordColon": "关键词：",
        "portal.dynamic.gapKeywordColon": "缺口关键词：",
        "portal.dynamic.noStructuredSkillData": "暂无结构化技能数据",
        "portal.dynamic.noKeywordInsights": "暂无关键词洞察",
        "portal.dynamic.aiEnhancedApplied": "已应用 AI 增强匹配。",
        "portal.dynamic.loadingMissingSkillsData": "正在加载缺失技能数据...",
        "portal.dynamic.unableLoadJobsGapAnalysis": "无法加载用于缺口分析的职位。",
        "portal.dynamic.unableLoadMissingSkillsData": "无法加载缺失技能数据。",
        "portal.dynamic.networkErrorLoadingMissingSkills": "加载缺失技能数据时网络异常。",
        "portal.dynamic.noMissingSkillsFound": "当前所选数据没有缺失技能。",
        "portal.dynamic.noGapSkillsTitle": "暂无缺口技能",
        "portal.dynamic.gapInsightsWhenReady": "当申请数据与职位数据就绪后，此面板会显示缺失技能洞察。",
        "portal.dynamic.noFrequencyData": "暂无频次数据。",
        "portal.dynamic.noScoreBucketData": "暂无分桶数据。",
        "portal.dynamic.repeatedGapSkillHint": "该技能在所选职位申请人中反复出现缺口。",
        "portal.dynamic.unknownSkill": "未知技能",
        "portal.dynamic.gapSkill": "缺口技能",
        "portal.dynamic.found": "发现",
        "portal.dynamic.applicantsSuffix": "位申请人",
        "portal.dynamic.recommendTrainingFor": "建议为以下技能准备短期培训：",
        "portal.dynamic.topPriorityFor": "优先建议：围绕以下技能增加定向筛选问题与入职方案：",
        "portal.dynamic.considerPracticalCheckFor": "建议对以下技能增加简短实操评估：",
        "portal.dynamic.beforeInterviewRounds": "（建议在面试前执行）。",
        "portal.dynamic.duringCandidateReview": "（建议在候选人评审期间执行）。",
        "portal.dynamic.failedLoadApplicationTotals": "加载申请总量失败。",
        "portal.dynamic.failedLoadMoWorkloads": "加载 MO 工作量失败。",
        "portal.dynamic.networkErrorLoadingDashboard": "加载仪表盘时网络异常。",
        "portal.dynamic.exporting": "导出中...",
        "portal.dynamic.csvExportedSuccess": "CSV 导出成功。",
        "portal.dynamic.unableExportCsv": "无法导出 CSV。",
        "portal.dynamic.noMoWorkloadSelectedRange": "所选时间范围内无 MO 工作量数据。",
        "portal.dynamic.loaded": "已加载",
        "portal.dynamic.moWorkloadItemUnit": "条 MO 工作量记录",
        "portal.dynamic.noStatusData": "暂无状态数据。",
        "portal.dynamic.noMoWorkloadData": "暂无 MO 工作量数据。",
        "portal.dynamic.noWorkloadDataYetTitle": "暂无工作量数据",
        "portal.dynamic.adjustTimeRangeHint": "请调整时间范围或等待更多申请活动。",
        "portal.dynamic.sessionExpiredRedirect": "会话已过期，正在跳转到登录页...",
        "portal.dynamic.networkErrorTryAgain": "网络异常，请重试。",
        "portal.dynamic.networkErrorMoment": "网络异常，请稍后再试。"
    };

    function resolveByKey(key, fallbackText) {
        if (hasI18n()) {
            var localized = window.AppI18n.t(key, "");
            if (localized) {
                return localized;
            }
        }
        if (currentLocale() === CHINESE_LOCALE && Object.prototype.hasOwnProperty.call(localZhByKey, key)) {
            return localZhByKey[key];
        }
        return fallbackText || key;
    }

    function textMap() {
        return {
            "TA Profile Setup - TA Hiring System": { key: "portal.page.taDashboard.title" },
            "Job list - TA Hiring System": { key: "portal.page.taJobList.title" },
            "Job detail - TA Hiring System": { key: "portal.page.taJobDetail.title" },
            "Application status - TA Hiring System": { key: "portal.page.taApplicationStatus.title" },
            "Application detail - TA Hiring System": { key: "portal.page.taApplicationDetail.title" },
            "MO Dashboard - Post TA Jobs": { key: "portal.page.moDashboard.title" },
            "MO Overview - TA Hiring System": { key: "portal.page.moOverview.title" },
            "Applicant review - TA Hiring System": { key: "portal.page.moApplicantSelection.title" },
            "AI Skill Match - TA Hiring System": { key: "portal.page.moAiSkillMatch.title" },
            "AI Missing Skills - TA Hiring System": { key: "portal.page.moAiMissingSkills.title" },
            "Admin Workload Dashboard - TA Hiring System": { key: "portal.page.adminDashboard.title" },

            "Sign Out": { key: "portal.action.signOut" },
            "Switch Roles": { key: "portal.action.switchRoles" },
            "Jobs": { key: "portal.nav.ta.jobs" },
            "Job List": { key: "portal.nav.ta.jobs" },
            "Status": { key: "portal.nav.ta.status" },
            "AI Match": { key: "portal.nav.ta.aiMatch" },
            "Profile": { key: "portal.nav.ta.profile" },
            "Applicants": { key: "portal.nav.mo.applicants" },
            "Post Job": { key: "portal.nav.mo.postJob" },
            "Dashboard": { key: "portal.nav.admin.dashboard" },
            "TA Portal": { key: "portal.brand.ta" },
            "MO Portal": { key: "portal.brand.mo" },
            "Admin Portal": { key: "portal.brand.admin" },

            "Manage your personal information and academic background.": { key: "portal.taDashboard.subtitle" },
            "Create your TA profile": { key: "portal.taDashboard.createProfileTitle" },
            "Complete the required fields first, then enrich optional details. After creation, this form becomes read-only and you can replace your resume from the right panel.": { key: "portal.taDashboard.createProfileLead" },
            "Basic details": { key: "portal.taDashboard.basicDetails" },
            "These fields are required to create your profile.": { key: "portal.taDashboard.basicDetailsLead" },
            "Full name": { key: "portal.taDashboard.fullName" },
            "Required": { key: "portal.taDashboard.required" },
            "Student ID": { key: "portal.taDashboard.studentId" },
            "Department": { key: "portal.taDashboard.department" },
            "Program": { key: "portal.taDashboard.program" },
            "Select your program": { key: "portal.taDashboard.selectProgram" },
            "Undergraduate": { key: "portal.taDashboard.programUndergraduate" },
            "Master": { key: "portal.taDashboard.programMaster" },
            "PhD": { key: "portal.taDashboard.programPhd" },
            "Additional information": { key: "portal.taDashboard.additionalInfo" },
            "These fields are optional for now, but completing them will make your profile stronger.": { key: "portal.taDashboard.additionalInfoLead" },
            "GPA": { key: "portal.taDashboard.gpa" },
            "Phone number": { key: "portal.taDashboard.phone" },
            "Skills": { key: "portal.taDashboard.skills" },
            "Use commas to separate each skill. The current backend stores your skills as a list.": { key: "portal.taDashboard.skillsHint" },
            "Related experience": { key: "portal.taDashboard.experience" },
            "Motivation": { key: "portal.taDashboard.motivation" },
            "Create profile": { key: "portal.taDashboard.createProfileButton" },
            "Save changes": { key: "portal.taDashboard.saveChangesButton" },
            "Edit profile": { key: "portal.taDashboard.editProfileButton" },
            "Cancel": { key: "portal.taDashboard.cancelButton" },
            "You can continue to enrich this profile later in the next planned steps.": { key: "portal.taDashboard.profileHint" },
            "Photo upload": { key: "portal.taDashboard.photoUploadTitle" },
            "Upload your photo": { key: "portal.taDashboard.photoCardEmptyTitle" },
            "JPG, PNG, or WEBP. Maximum size is 5MB.": { key: "portal.taDashboard.photoCardEmptyHint" },
            "Remove photo": { key: "portal.taDashboard.photoRemoveAria" },
            "Resume upload": { key: "portal.taDashboard.resumeUploadTitle" },
            "Upload one PDF, DOC, or DOCX resume. Maximum size is 10MB.": { key: "portal.taDashboard.resumeUploadLead" },
            "Upload your resume in PDF, DOC, or DOCX format. Maximum size is 10MB.": { key: "portal.taDashboard.resumeUploadLead" },
            "Choose file": { key: "portal.taDashboard.chooseFile" },
            "No file selected.": { key: "portal.taDashboard.noFileSelected" },
            "Waiting to upload": { key: "portal.taDashboard.waitingUpload" },
            "Save together": { key: "portal.taDashboard.resumeDraftTitle" },
            "Create profile first": { key: "portal.taDashboard.createProfileFirst" },
            "You can upload the resume first or fill the other fields first. The newest file takes effect after you save changes.": { key: "portal.taDashboard.resumeTip" },
            "If you choose a file before profile creation, it will upload automatically right after the profile is created.": { key: "portal.taDashboard.resumeTip" },
            "Upload selected resume": { key: "portal.taDashboard.uploadSelectedResume" },

            "Browse and apply for open TA positions.": { key: "portal.taJobList.subtitle" },
            "Keyword": { key: "portal.common.keyword" },
            "All": { key: "portal.common.all" },
            "Open": { key: "portal.common.open" },
            "Closed": { key: "portal.common.closed" },
            "Filled": { key: "portal.common.filled" },
            "Course code": { key: "portal.common.courseCode" },
            "Apply filters": { key: "portal.common.applyFilters" },
            "Clear": { key: "portal.common.clear" },
            "Loading positions...": { key: "portal.taJobList.loadingPositions" },
            "Refresh": { key: "portal.common.refresh" },

            "Job Detail": { key: "portal.taJobDetail.title" },
            "Review role requirements and submit your application.": { key: "portal.taJobDetail.subtitle" },
            "Loading job details...": { key: "portal.taJobDetail.loadingDetails" },
            "OPEN": { key: "portal.common.openUpper" },
            "Module organizer": { key: "portal.taJobDetail.moduleOrganizer" },
            "Positions": { key: "portal.common.positions" },
            "Workload": { key: "portal.common.workload" },
            "Salary": { key: "portal.common.salary" },
            "Deadline": { key: "portal.common.deadline" },
            "Description": { key: "portal.common.description" },
            "Required skills": { key: "portal.common.requiredSkills" },
            "Application": { key: "portal.common.application" },
            "Submit your application": { key: "portal.taJobDetail.submitApplicationTitle" },
            "Add a short cover letter to highlight your fit for this role.": { key: "portal.taJobDetail.coverLetterHint" },
            "Cover letter": { key: "portal.taJobDetail.coverLetter" },
            "Apply for this job": { key: "portal.taJobDetail.applyNow" },
            "Only TA accounts can submit applications. If you have already applied, this panel will show your latest status.": { key: "portal.taJobDetail.onlyTaHint" },

            "My Applications": { key: "portal.taApplicationStatus.title" },
            "Track the status of your submitted applications.": { key: "portal.taApplicationStatus.subtitle" },
            "Pending": { key: "portal.common.pending" },
            "Accepted": { key: "portal.common.accepted" },
            "Rejected": { key: "portal.common.rejected" },
            "Withdrawn": { key: "portal.common.withdrawn" },
            "Total": { key: "portal.common.total" },
            "Loading applications...": { key: "portal.taApplicationStatus.loadingApplications" },

            "Application detail": { key: "portal.taApplicationDetail.title" },
            "← My applications": { key: "portal.taApplicationDetail.backToList" },
            "Applied position details": { key: "portal.taApplicationDetail.jobTeaserTitle" },
            "View details →": { key: "portal.taApplicationDetail.viewDetailsCta" },
            "Out of 4.0": { key: "portal.taApplicationDetail.gpaScale" },
            "Application progress": { key: "portal.taApplicationDetail.progressTitle" },
            "My skills": { key: "portal.taApplicationDetail.mySkills" },
            "Responsibilities": { key: "portal.taApplicationDetail.responsibilities" },
            "View file": { key: "portal.taApplicationDetail.viewResumeFile" },
            "Resume": { key: "portal.taApplicationDetail.resumeShort" },
            "Close": { key: "portal.taApplicationDetail.closeModal" },

            "Post New Job": { key: "portal.moDashboard.title" },
            "Create a new TA position listing for your course.": { key: "portal.moDashboard.subtitle" },
            "Create posting": { key: "portal.moDashboard.createPosting" },
            "Post a new TA position": { key: "portal.moDashboard.postPosition" },
            "Fields marked with * are required for publishing.": { key: "portal.moDashboard.requiredLead" },
            "Fields labeled Required are required for publishing.": { key: "portal.moDashboard.requiredLead" },
            "Job title": { key: "portal.moDashboard.jobTitle" },
            "Job title *": { key: "portal.moDashboard.jobTitleRequired" },
            "Course code *": { key: "portal.moDashboard.courseCodeRequired" },
            "Course name": { key: "portal.moDashboard.courseName" },
            "Application deadline": { key: "portal.moDashboard.applicationDeadline" },
            "Publish job": { key: "portal.moDashboard.publishJob" },
            "Reset form": { key: "portal.moDashboard.resetForm" },
            "My postings": { key: "portal.moDashboard.myPostings" },
            "Published jobs": { key: "portal.moDashboard.publishedJobs" },
            "Loading your jobs...": { key: "portal.moDashboard.loadingJobs" },

            "Track hiring activity, then jump directly to posting and applicant review workflows.": { key: "portal.moOverview.subtitle" },
            "Active jobs": { key: "portal.moOverview.activeJobs" },
            "Total applicants": { key: "portal.moOverview.totalApplicants" },
            "Pending review": { key: "portal.moOverview.pendingReview" },
            "Offers sent": { key: "portal.moOverview.offersSent" },
            "Recent activity": { key: "portal.moOverview.recentActivity" },
            "View applicants": { key: "portal.moOverview.viewApplicants" },
            "Loading activity...": { key: "portal.moOverview.loadingActivity" },

            "Review and manage all candidate applications.": { key: "portal.moApplicantSelection.subtitle" },
            "Job": { key: "portal.moApplicantSelection.job" },
            "All jobs": { key: "portal.moApplicantSelection.allJobs" },
            "Applicant profile": { key: "portal.moApplicantSelection.applicantProfile" },
            "Select an applicant": { key: "portal.moApplicantSelection.selectApplicant" },
            "View resume": { key: "portal.moApplicantSelection.viewResume" },
            "Academic": { key: "portal.moApplicantSelection.academic" },
            "Contact": { key: "portal.moApplicantSelection.contact" },
            "Email": { key: "portal.moApplicantSelection.email" },
            "Phone": { key: "portal.moApplicantSelection.phone" },
            "Experience": { key: "portal.moApplicantSelection.experience" },

            "AI Skill Match": { key: "portal.moAiSkillMatch.title" },
            "Review applicant matching scores aligned with your posted job requirements.": { key: "portal.moAiSkillMatch.subtitle" },
            "Select a job": { key: "portal.common.selectJob" },
            "Load results": { key: "portal.moAiSkillMatch.loadResults" },
            "High match (≥85)": { key: "portal.moAiSkillMatch.highMatch" },
            "Medium match (60-84)": { key: "portal.moAiSkillMatch.mediumMatch" },
            "Low match (<60)": { key: "portal.moAiSkillMatch.lowMatch" },
            "Average Match Score": { key: "portal.moAiSkillMatch.averageScore" },
            "Score Distribution": { key: "portal.moAiSkillMatch.scoreDistribution" },
            "High": { key: "portal.common.high" },
            "Medium": { key: "portal.common.medium" },
            "Low": { key: "portal.common.low" },
            "Choose a job to load skill match results.": { key: "portal.moAiSkillMatch.chooseJobHint" },

            "AI Missing Skills": { key: "portal.moAiMissingSkills.title" },
            "Identify the most common capability gaps and plan targeted upskilling actions.": { key: "portal.moAiMissingSkills.subtitle" },
            "Load gaps": { key: "portal.moAiMissingSkills.loadGaps" },
            "Unique gap skills": { key: "portal.moAiMissingSkills.uniqueGapSkills" },
            "Missing Skill Frequency": { key: "portal.moAiMissingSkills.missingSkillFrequency" },
            "Most frequently missing capabilities": { key: "portal.moAiMissingSkills.missingCapabilityLead" },
            "Match Score Buckets": { key: "portal.moAiMissingSkills.matchScoreBuckets" },
            "Distribution by high / medium / low / none": { key: "portal.moAiMissingSkills.distributionLead" },
            "Choose a job to load missing skills insights.": { key: "portal.moAiMissingSkills.chooseJobHint" },

            "Admin Workload Dashboard": { key: "portal.adminDashboard.title" },
            "Track application volume and module owner review workload in one place.": { key: "portal.adminDashboard.subtitle" },
            "Start": { key: "portal.adminDashboard.start" },
            "End": { key: "portal.adminDashboard.end" },
            "Apply range": { key: "portal.adminDashboard.applyRange" },
            "Export CSV": { key: "portal.adminDashboard.exportCsv" },
            "Application Status Distribution": { key: "portal.adminDashboard.applicationStatusDistribution" },
            "Breakdown by review status in current range.": { key: "portal.adminDashboard.applicationStatusLead" },
            "MO Workload Overview": { key: "portal.adminDashboard.moWorkloadOverview" },
            "Workload intensity by module owner.": { key: "portal.adminDashboard.moWorkloadLead" },
            "MO Workload": { key: "portal.adminDashboard.moWorkload" },
            "Loading workload...": { key: "portal.adminDashboard.loadingWorkload" },

            "Checking profile...": { key: "portal.dynamic.checkingProfile" },
            "Creating profile...": { key: "portal.dynamic.creatingProfile" },
            "A profile already exists for this account. Loading your saved profile...": { key: "portal.dynamic.profileAlreadyExists" },
            "Please fix the highlighted fields and try again.": { key: "portal.dynamic.fixHighlightedFields" },
            "No profile found yet. Please complete the form below.": { key: "portal.dynamic.noProfileFound" },
            "Unable to check your existing profile right now. You can still try creating one.": { key: "portal.dynamic.unableCheckProfile" },
            "Unable to create your profile. Please review the form and try again.": { key: "portal.dynamic.unableCreateProfile" },
            "Profile created. Uploading your selected resume...": { key: "portal.dynamic.profileCreatedUploadingResume" },
            "Profile created, but resume upload failed. Please try uploading again.": { key: "portal.dynamic.profileCreatedResumeFailed" },
            "Profile created successfully. Your saved information is now displayed below.": { key: "portal.dynamic.profileCreatedSuccess" },
            "Your profile has already been created and is now shown in read-only mode.": { key: "portal.dynamic.profileReadonly" },
            "Current uploaded resume:": { key: "portal.dynamic.currentResumePrefix" },
            "No resume uploaded yet.": { key: "portal.dynamic.noResumeUploaded" },
            "No resume file selected.": { key: "portal.dynamic.noResumeSelected" },
            "Please choose a resume file first.": { key: "portal.dynamic.chooseResumeFirst" },
            "Please choose a photo file first.": { key: "portal.dynamic.choosePhotoFirst" },
            "Please upload your resume before saving your profile.": { key: "portal.dynamic.resumeRequiredToSave" },
            "Photo selected. Save changes to apply it.": { key: "portal.dynamic.photoReadyToSave" },
            "Current photo removed. Save changes to apply it.": { key: "portal.dynamic.savedPhotoRemoved" },
            "Photo ready": { key: "portal.dynamic.photoReady" },
            "Uploading resume draft:": { key: "portal.dynamic.resumeDraftUploading" },
            "Resume draft uploaded. Save changes to apply it.": { key: "portal.dynamic.resumeDraftSaved" },
            "New resume uploaded. Save changes to replace the current resume.": { key: "portal.dynamic.resumeDraftReplaceSaved" },
            "Pending resume:": { key: "portal.dynamic.pendingResumePrefix" },
            " It will be saved when you create the profile.": { key: "portal.dynamic.pendingResumeCreateSuffix" },
            " It will replace your current resume after you save.": { key: "portal.dynamic.pendingResumeReplaceSuffix" },
            "Unable to discard the pending resume. Please try again.": { key: "portal.dynamic.resumeDiscardFailed" },
            "Please create your profile first, then upload the resume.": { key: "portal.dynamic.createProfileThenUpload" },
            "Please create your profile first. The selected resume will also upload automatically after creation.": { key: "portal.dynamic.createProfileAutoUpload" },
            "Resume file is ready and will upload right after profile creation.": { key: "portal.dynamic.resumeReadyAfterCreate" },
            "Resume file is ready. Click upload to replace your current resume.": { key: "portal.dynamic.resumeReadyReplace" },
            "Uploading": { key: "portal.dynamic.uploading" },
            "Upload completed": { key: "portal.dynamic.uploadCompleted" },
            "Upload aborted.": { key: "portal.dynamic.uploadAborted" },
            "Upload was interrupted. Please try again.": { key: "portal.dynamic.uploadInterrupted" },
            "Network error during file upload. Please try again.": { key: "portal.dynamic.uploadNetworkError" },
            "Resume uploaded successfully.": { key: "portal.dynamic.resumeUploadSuccess" },
            "Resume updated successfully.": { key: "portal.dynamic.resumeUpdateSuccess" },
            "Resume upload failed. Please try again.": { key: "portal.dynamic.resumeUploadFailed" },
            "Invalid file format. Please upload a PDF, DOC, or DOCX file.": { key: "portal.dynamic.invalidResumeFormat" },
            "File size exceeds 10MB. Please choose a smaller file.": { key: "portal.dynamic.resumeTooLarge" },
            "Invalid photo format. Please upload JPG, PNG, or WEBP.": { key: "portal.dynamic.invalidPhotoFormat" },
            "Photo size exceeds 5MB. Please choose a smaller file.": { key: "portal.dynamic.photoTooLarge" },
            "No specific skills listed.": { key: "portal.dynamic.noSpecificSkills" },

            "Unable to load jobs right now.": { key: "portal.dynamic.unableLoadJobs" },
            "Unable to load jobs right now. Please try again.": { key: "portal.dynamic.unableLoadJobsRetry" },
            "No jobs found for the current filters.": { key: "portal.dynamic.noJobsForFilters" },
            "No jobs available right now.": { key: "portal.dynamic.noJobsAvailable" },
            "Showing": { key: "portal.dynamic.showing" },
            "job": { key: "portal.dynamic.jobUnit" },
            "Unable to load positions": { key: "portal.dynamic.unableLoadPositionsTitle" },
            "Please refresh the list after checking your network connection.": { key: "portal.dynamic.refreshAfterNetworkCheck" },
            "No positions published yet": { key: "portal.dynamic.noPositionsPublishedTitle" },
            "When MO publishes new jobs, they will appear here.": { key: "portal.dynamic.positionsAppearAfterPublish" },
            "No matching positions": { key: "portal.dynamic.noMatchingPositionsTitle" },
            "Try broadening your keyword or clearing one filter.": { key: "portal.dynamic.broadenKeywordHint" },
            "No extra tags": { key: "portal.dynamic.noExtraTags" },
            "View details": { key: "portal.dynamic.viewDetails" },
            "Apply now": { key: "portal.dynamic.applyNow" },
            "Salary": { key: "portal.common.salary" },
            "Workload": { key: "portal.common.workload" },
            "Skills": { key: "portal.taDashboard.skills" },
            "MO": { key: "portal.dynamic.moShort" },

            "Submitting...": { key: "portal.dynamic.submitting" },
            "Application has been submitted.": { key: "portal.dynamic.applicationSubmitted" },
            "Application submitted successfully. Redirecting to application status...": { key: "portal.dynamic.applicationSubmittedRedirect" },
            "Failed to submit application. Please try again.": { key: "portal.dynamic.failedSubmitApplication" },
            "Current account cannot submit applications on this page.": { key: "portal.dynamic.currentAccountCannotSubmit" },
            "Only TA accounts can submit applications.": { key: "portal.dynamic.onlyTaSubmit" },
            "You have already applied for this job.": { key: "portal.dynamic.alreadyApplied" },
            "This job is no longer available.": { key: "portal.dynamic.jobNoLongerAvailable" },
            "This job is not accepting new applications.": { key: "portal.dynamic.jobNotAccepting" },
            "This position is currently": { key: "portal.dynamic.positionCurrently" },
            ". New applications are disabled.": { key: "portal.dynamic.newApplicationsDisabled" },
            "Job not found. It may have been removed.": { key: "portal.dynamic.jobNotFound" },
            "Application unavailable": { key: "portal.dynamic.applicationUnavailable" },
            "Application status:": { key: "portal.dynamic.applicationStatusPrefix" },
            "Network error while submitting application.": { key: "portal.dynamic.networkErrorSubmitApplication" },

            "This page is available for TA accounts only.": { key: "portal.dynamic.taOnlyPage" },
            "Unable to load your applications.": { key: "portal.dynamic.unableLoadApplications" },
            "Unable to load applications right now.": { key: "portal.dynamic.unableLoadApplicationsNow" },
            "No applications submitted yet.": { key: "portal.dynamic.noApplicationsSubmitted" },
            "No applications match the current filters.": { key: "portal.dynamic.noApplicationsMatchFilters" },
            "application": { key: "portal.dynamic.applicationUnit" },
            "Unable to load applications": { key: "portal.dynamic.unableLoadApplicationsTitle" },
            "No matching applications": { key: "portal.dynamic.noMatchingApplicationsTitle" },
            "No applications yet": { key: "portal.dynamic.noApplicationsYetTitle" },
            "After you apply for a job, the status will appear here.": { key: "portal.dynamic.statusAppearsAfterApply" },
            "Try clearing status or keyword filters to broaden results.": { key: "portal.dynamic.clearFiltersToBroaden" },
            "Application withdrawn successfully.": { key: "portal.dynamic.applicationWithdrawnSuccess" },
            "Unable to withdraw this application.": { key: "portal.dynamic.unableWithdrawApplication" },
            "Network error while withdrawing application.": { key: "portal.dynamic.networkErrorWithdrawApplication" },
            "Applied at": { key: "portal.dynamic.appliedAt" },
            "Cover letter:": { key: "portal.dynamic.coverLetterColon" },
            "No cover letter provided.": { key: "portal.dynamic.noCoverLetterProvided" },
            "View job": { key: "portal.dynamic.viewJob" },
            "Withdraw": { key: "portal.dynamic.withdraw" },

            "Only MO accounts can publish jobs.": { key: "portal.dynamic.onlyMoPublish" },
            "Failed to publish job. Please check your input and try again.": { key: "portal.dynamic.failedPublishJob" },
            "Job posted successfully.": { key: "portal.dynamic.jobPostedSuccess" },
            "Network error while posting job.": { key: "portal.dynamic.networkErrorPostingJob" },
            "Unable to load postings right now.": { key: "portal.dynamic.unableLoadPostings" },
            "No jobs posted yet.": { key: "portal.dynamic.noJobsPostedYet" },
            "You have posted": { key: "portal.dynamic.youHavePosted" },
            "No postings yet": { key: "portal.dynamic.noPostingsYetTitle" },
            "Use the form to publish your first TA position.": { key: "portal.dynamic.publishFirstTaPosition" },
            "Review applicants": { key: "portal.dynamic.reviewApplicants" },
            "Untitled position": { key: "portal.dynamic.untitledPosition" },

            "Loading activity...": { key: "portal.moOverview.loadingActivity" },
            "Some overview data could not be loaded. Showing available results.": { key: "portal.dynamic.overviewPartialLoad" },
            "Unable to load overview data right now.": { key: "portal.dynamic.unableLoadOverview" },
            "This page is available for MO accounts only.": { key: "portal.dynamic.moOnlyPage" },
            "No activity yet.": { key: "portal.dynamic.noActivityYet" },
            "Tracking": { key: "portal.dynamic.tracking" },
            "No recent activity": { key: "portal.dynamic.noRecentActivityTitle" },
            "Once TAs apply for your jobs, latest updates will appear here.": { key: "portal.dynamic.latestUpdatesAppear" },
            "New application received": { key: "portal.dynamic.newApplicationReceived" },
            "Offer accepted": { key: "portal.dynamic.offerAccepted" },
            "Application rejected": { key: "portal.dynamic.applicationRejected" },
            "Application withdrawn": { key: "portal.dynamic.applicationWithdrawn" },
            "Application updated": { key: "portal.dynamic.applicationUpdated" },
            "Unknown applicant": { key: "portal.dynamic.unknownApplicant" },

            "Loading match results...": { key: "portal.dynamic.loadingMatchResults" },
            "Unable to load jobs for matching.": { key: "portal.dynamic.unableLoadJobsMatching" },
            "Unable to load application matches.": { key: "portal.dynamic.unableLoadApplicationMatches" },
            "Network error while loading match data.": { key: "portal.dynamic.networkErrorLoadingMatchData" },
            "No applicants found for selected job.": { key: "portal.dynamic.noApplicantsForJob" },
            "No match data available": { key: "portal.dynamic.noMatchDataTitle" },
            "Ask candidates to apply first, then load match results again.": { key: "portal.dynamic.askCandidatesThenLoadMatch" },
            "Skill score": { key: "portal.dynamic.skillScore" },
            "Keyword score": { key: "portal.dynamic.keywordScore" },
            "Matched:": { key: "portal.dynamic.matchedColon" },
            "Missing:": { key: "portal.dynamic.missingColon" },
            "Keyword:": { key: "portal.dynamic.keywordColon" },
            "Gap keyword:": { key: "portal.dynamic.gapKeywordColon" },
            "No structured skill data available": { key: "portal.dynamic.noStructuredSkillData" },
            "No keyword insights available": { key: "portal.dynamic.noKeywordInsights" },
            "AI-enhanced matching applied.": { key: "portal.dynamic.aiEnhancedApplied" },

            "Loading missing skills data...": { key: "portal.dynamic.loadingMissingSkillsData" },
            "Unable to load jobs for gap analysis.": { key: "portal.dynamic.unableLoadJobsGapAnalysis" },
            "Unable to load missing skills data.": { key: "portal.dynamic.unableLoadMissingSkillsData" },
            "Network error while loading missing skills data.": { key: "portal.dynamic.networkErrorLoadingMissingSkills" },
            "No missing skills found for selected data.": { key: "portal.dynamic.noMissingSkillsFound" },
            "No gap skills available": { key: "portal.dynamic.noGapSkillsTitle" },
            "When applicants and job data are ready, this panel will show missing skills insights.": { key: "portal.dynamic.gapInsightsWhenReady" },
            "No frequency data available.": { key: "portal.dynamic.noFrequencyData" },
            "No score bucket data available.": { key: "portal.dynamic.noScoreBucketData" },
            "This skill appears as a repeated gap across applicants for the selected job.": { key: "portal.dynamic.repeatedGapSkillHint" },
            "Unknown Skill": { key: "portal.dynamic.unknownSkill" },
            "gap skill": { key: "portal.dynamic.gapSkill" },
            "Found": { key: "portal.dynamic.found" },
            "applicant(s)": { key: "portal.dynamic.applicantsSuffix" },
            "Recommend creating a short training module for": { key: "portal.dynamic.recommendTrainingFor" },
            "Top priority: add a focused screening question and onboarding plan for": { key: "portal.dynamic.topPriorityFor" },
            "Consider a quick practical check for": { key: "portal.dynamic.considerPracticalCheckFor" },
            "before interview rounds.": { key: "portal.dynamic.beforeInterviewRounds" },
            "during candidate review.": { key: "portal.dynamic.duringCandidateReview" },

            "Failed to load application totals.": { key: "portal.dynamic.failedLoadApplicationTotals" },
            "Failed to load MO workloads.": { key: "portal.dynamic.failedLoadMoWorkloads" },
            "Network error while loading dashboard.": { key: "portal.dynamic.networkErrorLoadingDashboard" },
            "Exporting...": { key: "portal.dynamic.exporting" },
            "CSV exported successfully.": { key: "portal.dynamic.csvExportedSuccess" },
            "Unable to export CSV.": { key: "portal.dynamic.unableExportCsv" },
            "No MO workload data in selected range.": { key: "portal.dynamic.noMoWorkloadSelectedRange" },
            "Loaded": { key: "portal.dynamic.loaded" },
            "MO workload item": { key: "portal.dynamic.moWorkloadItemUnit" },
            "No status data available.": { key: "portal.dynamic.noStatusData" },
            "No MO workload data available.": { key: "portal.dynamic.noMoWorkloadData" },
            "No workload data yet": { key: "portal.dynamic.noWorkloadDataYetTitle" },
            "Adjust time range or wait for application activity to appear.": { key: "portal.dynamic.adjustTimeRangeHint" },
            "Session expired. Redirecting to login...": { key: "portal.dynamic.sessionExpiredRedirect" },
            "Your session has expired. Redirecting to login...": { key: "portal.dynamic.sessionExpiredRedirect" },
            "Saving changes...": { key: "portal.dynamic.savingChanges" },
            "Profile updated successfully.": { key: "portal.dynamic.profileUpdatedSuccess" },
            "Unable to update your profile. Please review the form and try again.": { key: "portal.dynamic.unableUpdateProfile" },
            "Will upload after profile creation": { key: "portal.dynamic.resumeWillUploadAfterCreate" },
            "Replace uploaded resume": { key: "portal.dynamic.replaceUploadedResume" },
            "Network error. Please try again.": { key: "portal.dynamic.networkErrorTryAgain" },
            "Network error. Please try again in a moment.": { key: "portal.dynamic.networkErrorMoment" }
        };
    }

    var mapping = textMap();

    function dynamicPatternMap() {
        return [
            {
                regex: /^Showing (\d+) job(s?)\.$/,
                handler: function (match) {
                    var count = match[1];
                    var plural = useEnglishPluralSuffix() && count !== "1" ? "s" : "";
                    return t("portal.dynamic.showing", "Showing") + " " + count + " " +
                        t("portal.dynamic.jobUnit", "job") + plural + ".";
                }
            },
            {
                regex: /^You have posted (\d+) job(s?)\.$/,
                handler: function (match) {
                    var count = match[1];
                    var plural = useEnglishPluralSuffix() && count !== "1" ? "s" : "";
                    return t("portal.dynamic.youHavePosted", "You have posted") + " " + count + " " +
                        t("portal.dynamic.jobUnit", "job") + plural + ".";
                }
            },
            {
                regex: /^Showing (\d+) application(s?)\.$/,
                handler: function (match) {
                    var count = match[1];
                    var plural = useEnglishPluralSuffix() && count !== "1" ? "s" : "";
                    return t("portal.dynamic.showing", "Showing") + " " + count + " " +
                        t("portal.dynamic.applicationUnit", "application") + plural + ".";
                }
            },
            {
                regex: /^Tracking (\d+) application(s?)\.$/,
                handler: function (match) {
                    var count = match[1];
                    var plural = useEnglishPluralSuffix() && count !== "1" ? "s" : "";
                    return t("portal.dynamic.tracking", "Tracking") + " " + count + " " +
                        t("portal.dynamic.applicationUnit", "application") + plural + ".";
                }
            },
            {
                regex: /^Loaded (\d+) MO workload item(s?)\.$/,
                handler: function (match) {
                    var count = match[1];
                    var plural = useEnglishPluralSuffix() && count !== "1" ? "s" : "";
                    return t("portal.dynamic.loaded", "Loaded") + " " + count + " " +
                        t("portal.dynamic.moWorkloadItemUnit", "MO workload item") + plural + ".";
                }
            },
            {
                regex: /^Found (\d+) applicant\(s\)$/,
                handler: function (match) {
                    return t("portal.dynamic.found", "Found") + " " + match[1] + " " +
                        t("portal.dynamic.applicantsSuffix", "applicant(s)");
                }
            },
            {
                regex: /^Current uploaded resume:\s*(.+)$/,
                handler: function (match) {
                    return t("portal.dynamic.currentResumePrefix", "Current uploaded resume:") + " " + match[1];
                }
            },
            {
                regex: /^Uploading\s+(.+)$/,
                handler: function (match) {
                    return t("portal.dynamic.uploading", "Uploading") + " " + match[1];
                }
            },
            {
                regex: /^Current completeness:\s*(\d+)%$/,
                handler: function (match) {
                    return t("portal.dynamic.currentCompleteness", "Current completeness:") + " " + match[1] + "%";
                }
            },
            {
                regex: /^This position is currently\s+([A-Z]+)\.\s+New applications are disabled\.$/,
                handler: function (match) {
                    return t("portal.dynamic.positionCurrently", "This position is currently") + " " + match[1] +
                        t("portal.dynamic.newApplicationsDisabled", ". New applications are disabled.");
                }
            }
        ];
    }

    var dynamicPatterns = dynamicPatternMap();

    function tryDynamicPattern(text) {
        for (var i = 0; i < dynamicPatterns.length; i += 1) {
            var pattern = dynamicPatterns[i];
            var match = text.match(pattern.regex);
            if (match) {
                return pattern.handler(match);
            }
        }
        return "";
    }

    function translateRawText(text) {
        var entry = mapping[text];
        if (entry) {
            return resolveByKey(entry.key, text);
        }
        return tryDynamicPattern(text) || "";
    }

    function replaceTextNode(node) {
        if (!node || !node.nodeValue) {
            return;
        }
        if (node.parentElement) {
            var tagName = node.parentElement.tagName;
            if (tagName === "SCRIPT" || tagName === "STYLE") {
                return;
            }
        }
        var raw = node.nodeValue;
        var text = raw.replace(/\s+/g, " ").trim();
        if (!text) {
            return;
        }
        var translated = translateRawText(text);
        if (translated && translated !== text) {
            node.nodeValue = raw.replace(text, translated);
        }
    }

    function translateNodeTree(root) {
        if (!root) {
            return;
        }
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var node = walker.nextNode();
        while (node) {
            replaceTextNode(node);
            node = walker.nextNode();
        }
    }

    function translateDocument() {
        if (!hasI18n()) {
            return;
        }
        translateNodeTree(document.body);
    }

    function observeMutations() {
        if (!window.MutationObserver || !document.body) {
            return;
        }
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === "childList") {
                    Array.prototype.forEach.call(mutation.addedNodes, function (node) {
                        if (node && node.nodeType === Node.ELEMENT_NODE) {
                            translateNodeTree(node);
                        } else if (node && node.nodeType === Node.TEXT_NODE) {
                            replaceTextNode(node);
                        }
                    });
                    return;
                }
                if (mutation.type === "characterData" && mutation.target) {
                    replaceTextNode(mutation.target);
                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    function bindLocaleEvent() {
        document.addEventListener("app:locale-changed", function () {
            window.setTimeout(function () {
                translateDocument();
            }, 0);
        });
    }

    function initialize() {
        translateDocument();
        observeMutations();
        bindLocaleEvent();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
