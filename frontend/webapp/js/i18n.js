(function () {
    var STORAGE_KEY = "ta_hiring_locale";
    var DEFAULT_LOCALE = "en";
    var CHINESE_LOCALE = "zh-CN";

    var dictionaries = {
        "en": {
            common: {
                portalBrand: "TA Hiring Portal",
                utility: {
                    backToPortal: "Portal home"
                },
                locale: {
                    switchAria: "Switch language",
                    zh: "中文",
                    en: "English"
                },
                action: {
                    signIn: "Sign in",
                    createAccount: "Create account",
                    createAdmin: "Create admin account"
                },
                footer: {
                    copyright: "University Hiring System © 2026"
                }
            },
            index: {
                page: {
                    title: "TA Hiring Portal - Home"
                },
                nav: {
                    aria: "Main navigation",
                    overview: "Overview",
                    forTa: "For TA",
                    forMo: "For MO",
                    forAdmin: "For Admin",
                    process: "Process",
                    faq: "FAQ"
                },
                hero: {
                    badge: "University TA Hiring Platform",
                    title: "Manage TA hiring in one clear workflow",
                    subtitle: "A single portal for teaching assistants, module organizers, and admins to register, apply, review, and track outcomes.",
                    primary: "Get started",
                    secondary: "Sign in",
                    adminHint: "Need admin access?",
                    adminLink: "Create admin account"
                },
                preview: {
                    title: "Built on real workflows, not mock slides",
                    subtitle: "The portal reflects implemented modules already available in this project.",
                    cardTaTitle: "TA workspace",
                    cardTaDesc: "Create profile, browse openings, apply, and track application status.",
                    cardMoTitle: "MO workspace",
                    cardMoDesc: "Publish jobs, review applicants, shortlist candidates, and monitor progress.",
                    cardAdminTitle: "Admin workspace",
                    cardAdminDesc: "View workload and status distribution across the hiring pipeline."
                },
                forTa: {
                    title: "For teaching assistants",
                    lead: "Everything a TA needs from profile setup to final decision tracking.",
                    item1: "Build and update your profile with resume and skills.",
                    item2: "Search and filter open TA positions by keyword and status.",
                    item3: "Submit applications and check pending, accepted, or rejected updates.",
                    cta: "Sign in as TA"
                },
                forMo: {
                    title: "For module organizers",
                    lead: "Publish openings, evaluate applicants, and close hiring loops quickly.",
                    item1: "Create postings with title, course, skills, slots, and deadline.",
                    item2: "Review applicant profiles and attached materials in one list.",
                    item3: "Accept or reject applicants while tracking overall review progress.",
                    cta: "Sign in as MO"
                },
                forAdmin: {
                    title: "For administrators",
                    lead: "Get a system-level view of workload and status distribution.",
                    item1: "Monitor active jobs, applications, and per-status breakdown.",
                    item2: "Inspect organizer workloads and key operational trends.",
                    item3: "Export workload snapshots for reporting and planning.",
                    cta: "Sign in as Admin"
                },
                process: {
                    title: "From registration to final offer",
                    lead: "The homepage mirrors the current end-to-end process in the system.",
                    step1Title: "1. Register account",
                    step1Desc: "TA/MO use standard registration. Admin uses a dedicated admin registration page.",
                    step2Title: "2. Complete profile or post job",
                    step2Desc: "TAs prepare profile details. MOs publish openings with requirements and deadlines.",
                    step3Title: "3. Apply and review",
                    step3Desc: "TAs submit applications. MOs review applicants and make selection decisions.",
                    step4Title: "4. Track status and workload",
                    step4Desc: "TAs monitor application outcomes, while admins monitor global workload statistics."
                },
                ai: {
                    title: "AI support for organizer decisions",
                    lead: "Current AI modules are available in the MO area.",
                    item1: "Skill Match compares applicants against job requirements.",
                    item2: "Missing Skills highlights capability gaps by applicant group.",
                    item3: "Use AI insights together with manual review before selecting finalists."
                },
                faq: {
                    title: "Frequently asked questions",
                    q1: "Do I need to visit this page every time?",
                    a1: "No. Returning users can open the login page directly and continue from there.",
                    q2: "Which role should I choose?",
                    a2: "Choose TA for applicants, MO for module organizers, and Admin only for platform managers.",
                    q3: "Can I switch language later?",
                    a3: "Yes. Use the top-right language switch at any time. Your choice is remembered."
                },
                cta: {
                    title: "Ready to start your TA hiring workflow?",
                    subtitle: "Use this portal for context, then jump to the sign-in flow you need.",
                    primary: "Sign in now",
                    secondary: "Create account"
                }
            },
            login: {
                page: {
                    title: "Login - TA Hiring System"
                },
                hero: {
                    title: "TA Hiring Portal",
                    subtitle: "Sign in to your account"
                },
                form: {
                    aria: "Login form",
                    usernameLabel: "Username or email",
                    usernamePlaceholder: "username or name@university.edu",
                    passwordLabel: "Password",
                    passwordPlaceholder: "Enter your password",
                    forgot: "Forgot?",
                    keepSignedIn: "Keep me signed in",
                    roleAria: "Role login buttons",
                    ta: "TA Login",
                    mo: "MO Login",
                    admin: "Admin"
                },
                links: {
                    noAccount: "Don't have an account?",
                    createAccount: "Create one now",
                    needAdmin: "Need admin access?",
                    createAdmin: "Use admin invitation"
                },
                msg: {
                    failed: "Login failed. Please check your username and password.",
                    successRedirect: "Login successful! Redirecting...",
                    enterIdentifier: "Please enter your username or email.",
                    identifierTooLong: "Username or email is too long.",
                    identifierUnsupported: "Username or email contains unsupported characters.",
                    invalidEmail: "Please enter a valid email address.",
                    invalidUsername: "Username must start with a letter and contain 3-20 letters, numbers, or underscores.",
                    enterPassword: "Please enter your password.",
                    passwordTooShort: "Password must be at least 6 characters.",
                    passwordTooLong: "Password is too long.",
                    passwordUnsupported: "Password contains unsupported characters.",
                    networkError: "Network error. Please try again."
                }
            },
            register: {
                page: {
                    title: "Register - TA Hiring System"
                },
                hero: {
                    title: "Create your account",
                    subtitle: "Join the TA Hiring Portal in a few steps"
                },
                form: {
                    aria: "Registration form",
                    usernameLabel: "Username",
                    usernamePlaceholder: "john_smith",
                    usernameHint: "3-20 characters, start with a letter, and use only letters, numbers, or underscores.",
                    emailLabel: "Email address",
                    emailPlaceholder: "name@university.edu",
                    passwordLabel: "Password",
                    passwordPlaceholder: "Create a password",
                    passwordHint: "Use at least 6 characters.",
                    confirmLabel: "Confirm password",
                    confirmPlaceholder: "Re-enter your password",
                    roleLabel: "Register as",
                    roleAria: "Role selection buttons",
                    roleTaTitle: "TA",
                    roleTaDesc: "Applicant",
                    roleMoTitle: "MO",
                    roleMoDesc: "Module Organizer",
                    submit: "Create account"
                },
                links: {
                    haveAccount: "Already have an account?",
                    backLogin: "Back to login",
                    adminQuestion: "Need an Admin account?",
                    adminLink: "Use admin invitation"
                },
                msg: {
                    enterUsername: "Please enter a username.",
                    usernameTooLong: "Username is too long.",
                    usernameUnsupported: "Username contains unsupported characters.",
                    usernameInvalid: "Username must start with a letter and contain 3-20 letters, numbers, or underscores.",
                    enterEmail: "Please enter your email address.",
                    emailTooLong: "Email is too long.",
                    emailUnsupported: "Email contains unsupported characters.",
                    emailInvalid: "Please enter a valid email address.",
                    enterPassword: "Please create a password.",
                    passwordTooShort: "Password must be at least 6 characters.",
                    passwordTooLong: "Password is too long.",
                    passwordUnsupported: "Password contains unsupported characters.",
                    enterConfirmPassword: "Please confirm your password.",
                    passwordMismatch: "Passwords do not match.",
                    selectRole: "Please select a role.",
                    adminUsePage: "Admin accounts are created from invitation links.",
                    failed: "Registration failed. Please check your information and try again.",
                    successRedirect: "Registration successful! Redirecting to login...",
                    networkError: "Network error. Please try again."
                }
            },
            adminRegister: {
                page: {
                    title: "Admin Register - TA Hiring System"
                },
                hero: {
                    title: "Admin registration is invitation-only",
                    subtitle: "Ask an existing admin to send you an invitation link by email."
                },
                form: {
                    aria: "Admin invitation notice"
                },
                notice: {
                    primary: "Direct admin self-registration has been disabled for security reasons.",
                    lead: "If you already received an invitation email, open",
                    link: "Admin invitation page",
                    tail: "and complete account activation with your invite code."
                },
                links: {
                    needStandard: "Need TA or MO account?",
                    standardLink: "Use standard registration",
                    haveAccount: "Already have an account?",
                    backLogin: "Back to login"
                }
            },
            adminInvite: {
                page: {
                    title: "Admin Invitation - TA Hiring System"
                },
                hero: {
                    title: "Complete admin invitation",
                    subtitle: "Use your invitation link or invite code to create an Admin account"
                },
                form: {
                    aria: "Admin invitation form",
                    emailLabel: "Email address",
                    emailPlaceholder: "admin@university.edu",
                    inviteCodeLabel: "Invite code (optional if opened from email link)",
                    inviteCodePlaceholder: "ABCDEFGH",
                    usernameLabel: "Username",
                    usernamePlaceholder: "admin_username",
                    passwordLabel: "Password",
                    passwordPlaceholder: "Create a password",
                    confirmLabel: "Confirm password",
                    confirmPlaceholder: "Re-enter your password",
                    submit: "Create admin account"
                },
                status: {
                    checkingToken: "Checking invitation token...",
                    noToken: "No invitation token detected. Enter your email and invite code.",
                    invalidOrExpired: "Invitation link is invalid or expired. You can still use email + invite code.",
                    validated: "Invitation validated.",
                    expiresAtPrefix: " Expires at: ",
                    validateFailed: "Could not validate invitation link. You can use email + invite code.",
                    completed: "Invitation completed successfully."
                },
                links: {
                    haveAccount: "Already have an account?",
                    backLogin: "Back to login"
                },
                msg: {
                    invalidEmail: "Please enter a valid email address.",
                    needTokenOrCode: "Please provide invitation token or invite code.",
                    invalidUsername: "Username must start with a letter and contain 3-20 letters, numbers, or underscores.",
                    passwordTooShort: "Password must be at least 6 characters.",
                    passwordTooLong: "Password is too long.",
                    passwordMismatch: "Passwords do not match.",
                    createFailed: "Failed to create admin account.",
                    createSuccessRedirect: "Admin account created. Redirecting to login...",
                    networkError: "Network error. Please try again.",
                    creating: "Creating..."
                }
            },
            portal: {
                action: {
                    signOut: "Sign Out",
                    switchRoles: "Switch Roles"
                },
                brand: {
                    ta: "TA Portal",
                    mo: "MO Portal",
                    admin: "Admin Portal"
                },
                nav: {
                    ta: {
                        aria: "TA portal navigation",
                        jobs: "Jobs",
                        status: "Status",
                        aiMatch: "AI Match",
                        profile: "Profile"
                    },
                    mo: {
                        aria: "MO portal navigation",
                        applicants: "Applicants",
                        postJob: "Post Job",
                        aiMatch: "AI Match"
                    },
                    admin: {
                        aria: "Admin portal navigation",
                        dashboard: "Dashboard"
                    }
                },
                page: {
                    taDashboard: {
                        title: "TA Profile Setup - TA Hiring System"
                    },
                    taJobList: {
                        title: "Job list - TA Hiring System"
                    },
                    taJobDetail: {
                        title: "Job detail - TA Hiring System"
                    },
                    taApplicationStatus: {
                        title: "Application status - TA Hiring System"
                    },
                    taApplicationDetail: {
                        title: "Application detail - TA Hiring System"
                    },
                    moDashboard: {
                        title: "MO Dashboard - Post TA Jobs"
                    },
                    moOverview: {
                        title: "MO Overview - TA Hiring System"
                    },
                    moApplicantSelection: {
                        title: "Applicant review - TA Hiring System"
                    },
                    moAiSkillMatch: {
                        title: "AI Skill Match - TA Hiring System"
                    },
                    moAiMissingSkills: {
                        title: "AI Missing Skills - TA Hiring System"
                    },
                    adminDashboard: {
                        title: "Admin Workload Dashboard - TA Hiring System"
                    }
                },
                common: {
                    keyword: "Keyword",
                    all: "All",
                    open: "Open",
                    closed: "Closed",
                    filled: "Filled",
                    openUpper: "OPEN",
                    courseCode: "Course code",
                    applyFilters: "Apply filters",
                    clear: "Clear",
                    refresh: "Refresh",
                    positions: "Positions",
                    workload: "Workload",
                    salary: "Salary",
                    deadline: "Deadline",
                    description: "Description",
                    requiredSkills: "Required skills",
                    application: "Application",
                    pending: "Pending",
                    accepted: "Accepted",
                    rejected: "Rejected",
                    withdrawn: "Withdrawn",
                    total: "Total",
                    selectJob: "Select a job",
                    high: "High",
                    medium: "Medium",
                    low: "Low"
                },
                taDashboard: {
                    subtitle: "Manage your personal information and academic background.",
                    createProfileTitle: "Create your TA profile",
                    basicDetails: "Basic details",
                    fullName: "Full name",
                    required: "Required",
                    studentId: "Student ID",
                    department: "Department",
                    program: "Program",
                    selectProgram: "Select your program",
                    programUndergraduate: "Undergraduate",
                    programMaster: "Master",
                    programPhd: "PhD",
                    additionalInfo: "Additional information",
                    additionalInfoLead: "These fields are optional for now, but completing them will make your profile stronger.",
                    gpa: "GPA",
                    phone: "Phone number",
                    skills: "Skills",
                    skillsHint: "Use commas to separate each skill. The current backend stores your skills as a list.",
                    experience: "Related experience",
                    motivation: "Motivation",
                    createProfileButton: "Create profile",
                    saveChangesButton: "Save changes",
                    editProfileButton: "Edit profile",
                    cancelButton: "Cancel",
                    profileLabel: "Personal Profile",
                    resumeUploadTitle: "Resume upload",
                    resumeUploadLead: "Upload one PDF, DOC, or DOCX resume. Maximum size is 10MB.",
                    resumeCardEmptyTitle: "Upload your resume",
                    resumeCardEmptyHint: "PDF, DOC, or DOCX. Maximum size is 10MB.",
                    chooseFile: "Choose file",
                    resumeRemoveAria: "Remove resume",
                    noFileSelected: "No file selected.",
                    waitingUpload: "Waiting to upload",
                    resumeDraftTitle: "Save together",
                    createProfileFirst: "Create profile first",
                    resumeTip: "You can upload the resume first or fill the other fields first. The newest file takes effect after you save changes.",
                    uploadSelectedResume: "Upload selected resume"
                },
                taJobList: {
                    subtitle: "Browse and apply for open TA positions.",
                    loadingPositions: "Loading positions..."
                },
                taJobDetail: {
                    title: "Job Detail",
                    subtitle: "Review role requirements and submit your application.",
                    loadingDetails: "Loading job details...",
                    moduleOrganizer: "Module organizer",
                    submitApplicationTitle: "Submit your application",
                    coverLetterHint: "Add a short cover letter to highlight your fit for this role.",
                    coverLetter: "Cover letter",
                    applyNow: "Apply for this job",
                    onlyTaHint: "Only TA accounts can submit applications. If you have already applied, this panel will show your latest status."
                },
                taApplicationStatus: {
                    title: "My Applications",
                    subtitle: "Track the status of your submitted applications.",
                    loadingApplications: "Loading applications..."
                },
                taApplicationDetail: {
                    title: "Application detail",
                    backToList: "← My applications",
                    jobTeaserTitle: "Applied position details",
                    viewDetailsCta: "View details →",
                    gpaScale: "Out of 4.0",
                    progressTitle: "Application progress",
                    mySkills: "My skills",
                    responsibilities: "Responsibilities",
                    viewResumeFile: "View file",
                    resumeShort: "Resume",
                    closeModal: "Close",
                    missingId: "Missing application ID. Return to the list and try again.",
                    loadAppFailed: "Unable to load application.",
                    networkError: "Network error. Please try again.",
                    untitled: "Untitled position",
                    submittedPrefix: "Submitted on",
                    noSkills: "No skills listed",
                    noCoverLetter: "No cover letter provided.",
                    jobUnavailable: "Job details unavailable.",
                    workload: "Workload",
                    applicants: "Applicants",
                    deadline: "Deadline",
                    noDescription: "No description.",
                    sessionExpired: "Your session has expired. Redirecting to login...",
                    progressSubmit: "Submit application",
                    progressReview: "Materials in review",
                    progressInterview: "Interview arrangement",
                    progressFinal: "Final decision"
                },
                moDashboard: {
                    title: "Post New Job",
                    subtitle: "Create a new TA position listing for your course.",
                    createPosting: "Create posting",
                    postPosition: "Post a new TA position",
                    requiredLead: "Fields marked with * are required for publishing.",
                    jobTitleRequired: "Job title *",
                    courseCodeRequired: "Course code *",
                    courseName: "Course name",
                    applicationDeadline: "Application deadline",
                    publishJob: "Publish job",
                    resetForm: "Reset form",
                    myPostings: "My postings",
                    publishedJobs: "Published jobs",
                    loadingJobs: "Loading your jobs..."
                },
                moOverview: {
                    subtitle: "Track hiring activity, then jump directly to posting and applicant review workflows.",
                    activeJobs: "Active jobs",
                    totalApplicants: "Total applicants",
                    pendingReview: "Pending review",
                    offersSent: "Offers sent",
                    recentActivity: "Recent activity",
                    viewApplicants: "View applicants",
                    loadingActivity: "Loading activity..."
                },
                moApplicantSelection: {
                    subtitle: "Review and manage all candidate applications.",
                    job: "Job",
                    allJobs: "All jobs",
                    applicantProfile: "Applicant profile",
                    selectApplicant: "Select an applicant",
                    viewResume: "View resume",
                    academic: "Academic",
                    contact: "Contact",
                    email: "Email",
                    phone: "Phone",
                    experience: "Experience"
                },
                moAiSkillMatch: {
                    title: "AI Skill Match",
                    subtitle: "Review applicant matching scores aligned with your posted job requirements.",
                    loadResults: "Load results",
                    highMatch: "High match (≥85)",
                    mediumMatch: "Medium match (60-84)",
                    lowMatch: "Low match (<60)",
                    averageScore: "Average Match Score",
                    scoreDistribution: "Score Distribution",
                    chooseJobHint: "Choose a job to load skill match results."
                },
                moAiMissingSkills: {
                    title: "AI Missing Skills",
                    subtitle: "Identify the most common capability gaps and plan targeted upskilling actions.",
                    loadGaps: "Load gaps",
                    uniqueGapSkills: "Unique gap skills",
                    missingSkillFrequency: "Missing Skill Frequency",
                    missingCapabilityLead: "Most frequently missing capabilities",
                    matchScoreBuckets: "Match Score Buckets",
                    distributionLead: "Distribution by high / medium / low / none",
                    chooseJobHint: "Choose a job to load missing skills insights."
                },
                adminDashboard: {
                    title: "Admin Workload Dashboard",
                    subtitle: "Track application volume and module owner review workload in one place.",
                    start: "Start",
                    end: "End",
                    applyRange: "Apply range",
                    exportCsv: "Export CSV",
                    invitePanelAria: "Admin invitation creation",
                    inviteTitle: "Invite new admin",
                    inviteLead: "Create one-time invitation link/code and send via email.",
                    inviteeEmail: "Invitee email",
                    inviteeEmailPlaceholder: "new_admin@university.edu",
                    expiresInHours: "Expires in (hours)",
                    sendInvitation: "Send invitation",
                    applicationStatusDistribution: "Application Status Distribution",
                    applicationStatusLead: "Breakdown by review status in current range.",
                    moWorkloadOverview: "MO Workload Overview",
                    moWorkloadLead: "Workload intensity by module owner.",
                    moWorkload: "MO Workload",
                    loadingWorkload: "Loading workload..."
                },
                dynamic: {
                    checkingProfile: "Checking profile...",
                    savingChanges: "Saving changes...",
                    profileAlreadyExists: "A profile already exists for this account. Loading your saved profile...",
                    fixHighlightedFields: "Please fix the highlighted fields and try again.",
                    noProfileFound: "No profile found yet. Please complete the form below.",
                    unableCheckProfile: "Unable to check your existing profile right now. You can still try creating one.",
                    unableCreateProfile: "Unable to create your profile. Please review the form and try again.",
                    unableUpdateProfile: "Unable to update your profile. Please review the form and try again.",
                    profileCreatedUploadingResume: "Profile created. Uploading your selected resume...",
                    profileCreatedResumeFailed: "Profile created, but resume upload failed. Please try uploading again.",
                    profileCreatedSuccess: "Profile created successfully. Your saved information is now displayed below.",
                    profileUpdatedSuccess: "Profile updated successfully.",
                    profileReadonly: "Your profile has already been created and is now shown in read-only mode.",
                    currentResumePrefix: "Current uploaded resume:",
                    noResumeUploaded: "No resume uploaded yet.",
                    noResumeSelected: "No resume file selected.",
                    chooseResumeFirst: "Please choose a resume file first.",
                    resumeRequiredToSave: "Please upload your resume before saving your profile.",
                    resumeDraftUploading: "Uploading resume draft:",
                    resumeDraftSaved: "Resume draft uploaded. Save changes to apply it.",
                    resumeDraftReplaceSaved: "New resume uploaded. Save changes to replace the current resume.",
                    pendingResumeRemoved: "Pending resume removed.",
                    savedResumeRemoved: "Current resume removed. Upload a new one before saving changes.",
                    resumeReady: "Resume ready",
                    pendingResumePrefix: "Pending resume:",
                    pendingResumeCreateSuffix: " It will be saved when you create the profile.",
                    pendingResumeReplaceSuffix: " It will replace your current resume after you save.",
                    resumeDiscardFailed: "Unable to discard the pending resume. Please try again.",
                    createProfileThenUpload: "Please create your profile first, then upload the resume.",
                    createProfileAutoUpload: "Please create your profile first. The selected resume will also upload automatically after creation.",
                    resumeWillUploadAfterCreate: "Will upload after profile creation",
                    resumeReadyAfterCreate: "Resume file is ready and will upload right after profile creation.",
                    replaceUploadedResume: "Replace uploaded resume",
                    resumeReadyReplace: "Resume file is ready. Click upload to replace your current resume.",
                    uploading: "Uploading",
                    uploadCompleted: "Upload completed",
                    uploadAborted: "Upload aborted.",
                    uploadInterrupted: "Upload was interrupted. Please try again.",
                    uploadNetworkError: "Network error during file upload. Please try again.",
                    resumeUploadSuccess: "Resume uploaded successfully.",
                    resumeUpdateSuccess: "Resume updated successfully.",
                    resumeUploadFailed: "Resume upload failed. Please try again.",
                    invalidResumeFormat: "Invalid file format. Please upload a PDF, DOC, or DOCX file.",
                    resumeTooLarge: "File size exceeds 10MB. Please choose a smaller file.",
                    resumeWaitingUpload: "Waiting to upload",
                    noSpecificSkills: "No specific skills listed.",
                    unableLoadJobs: "Unable to load jobs right now.",
                    unableLoadJobsRetry: "Unable to load jobs right now. Please try again.",
                    noJobsForFilters: "No jobs found for the current filters.",
                    noJobsAvailable: "No jobs available right now.",
                    showing: "Showing",
                    jobUnit: "job",
                    unableLoadPositionsTitle: "Unable to load positions",
                    refreshAfterNetworkCheck: "Please refresh the list after checking your network connection.",
                    noPositionsPublishedTitle: "No positions published yet",
                    positionsAppearAfterPublish: "When MO publishes new jobs, they will appear here.",
                    noMatchingPositionsTitle: "No matching positions",
                    broadenKeywordHint: "Try broadening your keyword or clearing one filter.",
                    noExtraTags: "No extra tags",
                    viewDetails: "View details",
                    applyNow: "Apply now",
                    moShort: "MO",
                    submitting: "Submitting...",
                    sendingInvitation: "Sending...",
                    inviteInvalidEmail: "Please enter a valid invitee email address.",
                    inviteHoursRange: "Expiry hours must be between 1 and 168.",
                    inviteCreateFailed: "Failed to create invitation.",
                    inviteCreatedSuccess: "Invitation created successfully.",
                    inviteCreateNetworkError: "Network error while creating invitation.",
                    inviteResultLink: "Invite link:",
                    inviteResultCode: "Invite code:",
                    inviteResultExpiresAt: "Expires at:",
                    inviteResultEmailDelivery: "Email delivery:",
                    inviteResultDeliveryDetail: "Delivery detail:",
                    inviteResultEmailPreview: "Email preview",
                    applicationSubmitted: "Application has been submitted.",
                    applicationSubmittedRedirect: "Application submitted successfully. Redirecting to application status...",
                    failedSubmitApplication: "Failed to submit application. Please try again.",
                    currentAccountCannotSubmit: "Current account cannot submit applications on this page.",
                    onlyTaSubmit: "Only TA accounts can submit applications.",
                    alreadyApplied: "You have already applied for this job.",
                    jobNoLongerAvailable: "This job is no longer available.",
                    jobNotAccepting: "This job is not accepting new applications.",
                    positionCurrently: "This position is currently",
                    newApplicationsDisabled: ". New applications are disabled.",
                    jobNotFound: "Job not found. It may have been removed.",
                    applicationUnavailable: "Application unavailable",
                    applicationStatusPrefix: "Application status:",
                    networkErrorSubmitApplication: "Network error while submitting application.",
                    taOnlyPage: "This page is available for TA accounts only.",
                    unableLoadApplications: "Unable to load your applications.",
                    unableLoadApplicationsNow: "Unable to load applications right now.",
                    noApplicationsSubmitted: "No applications submitted yet.",
                    noApplicationsMatchFilters: "No applications match the current filters.",
                    applicationUnit: "application",
                    unableLoadApplicationsTitle: "Unable to load applications",
                    noMatchingApplicationsTitle: "No matching applications",
                    noApplicationsYetTitle: "No applications yet",
                    statusAppearsAfterApply: "After you apply for a job, the status will appear here.",
                    clearFiltersToBroaden: "Try clearing status or keyword filters to broaden results.",
                    applicationWithdrawnSuccess: "Application withdrawn successfully.",
                    unableWithdrawApplication: "Unable to withdraw this application.",
                    networkErrorWithdrawApplication: "Network error while withdrawing application.",
                    appliedAt: "Applied at",
                    coverLetterColon: "Cover letter:",
                    noCoverLetterProvided: "No cover letter provided.",
                    viewJob: "View job",
                    withdraw: "Withdraw",
                    onlyMoPublish: "Only MO accounts can publish jobs.",
                    failedPublishJob: "Failed to publish job. Please check your input and try again.",
                    jobPostedSuccess: "Job posted successfully.",
                    networkErrorPostingJob: "Network error while posting job.",
                    unableLoadPostings: "Unable to load postings right now.",
                    noJobsPostedYet: "No jobs posted yet.",
                    youHavePosted: "You have posted",
                    noPostingsYetTitle: "No postings yet",
                    publishFirstTaPosition: "Use the form to publish your first TA position.",
                    reviewApplicants: "Review applicants",
                    untitledPosition: "Untitled position",
                    overviewPartialLoad: "Some overview data could not be loaded. Showing available results.",
                    unableLoadOverview: "Unable to load overview data right now.",
                    moOnlyPage: "This page is available for MO accounts only.",
                    noActivityYet: "No activity yet.",
                    tracking: "Tracking",
                    noRecentActivityTitle: "No recent activity",
                    latestUpdatesAppear: "Once TAs apply for your jobs, latest updates will appear here.",
                    newApplicationReceived: "New application received",
                    offerAccepted: "Offer accepted",
                    applicationRejected: "Application rejected",
                    applicationWithdrawn: "Application withdrawn",
                    applicationUpdated: "Application updated",
                    unknownApplicant: "Unknown applicant",
                    loadingMatchResults: "Loading match results...",
                    unableLoadJobsMatching: "Unable to load jobs for matching.",
                    unableLoadApplicationMatches: "Unable to load application matches.",
                    networkErrorLoadingMatchData: "Network error while loading match data.",
                    noApplicantsForJob: "No applicants found for selected job.",
                    noMatchDataTitle: "No match data available",
                    askCandidatesThenLoadMatch: "Ask candidates to apply first, then load match results again.",
                    skillScore: "Skill score",
                    keywordScore: "Keyword score",
                    matchedColon: "Matched:",
                    missingColon: "Missing:",
                    keywordColon: "Keyword:",
                    gapKeywordColon: "Gap keyword:",
                    noStructuredSkillData: "No structured skill data available",
                    noKeywordInsights: "No keyword insights available",
                    aiEnhancedApplied: "AI-enhanced matching applied.",
                    loadingMissingSkillsData: "Loading missing skills data...",
                    unableLoadJobsGapAnalysis: "Unable to load jobs for gap analysis.",
                    unableLoadMissingSkillsData: "Unable to load missing skills data.",
                    networkErrorLoadingMissingSkills: "Network error while loading missing skills data.",
                    noMissingSkillsFound: "No missing skills found for selected data.",
                    noGapSkillsTitle: "No gap skills available",
                    gapInsightsWhenReady: "When applicants and job data are ready, this panel will show missing skills insights.",
                    noFrequencyData: "No frequency data available.",
                    noScoreBucketData: "No score bucket data available.",
                    repeatedGapSkillHint: "This skill appears as a repeated gap across applicants for the selected job.",
                    unknownSkill: "Unknown Skill",
                    gapSkill: "gap skill",
                    found: "Found",
                    applicantsSuffix: "applicant(s)",
                    recommendTrainingFor: "Recommend creating a short training module for",
                    topPriorityFor: "Top priority: add a focused screening question and onboarding plan for",
                    considerPracticalCheckFor: "Consider a quick practical check for",
                    beforeInterviewRounds: "before interview rounds.",
                    duringCandidateReview: "during candidate review.",
                    failedLoadApplicationTotals: "Failed to load application totals.",
                    failedLoadMoWorkloads: "Failed to load MO workloads.",
                    networkErrorLoadingDashboard: "Network error while loading dashboard.",
                    exporting: "Exporting...",
                    csvExportedSuccess: "CSV exported successfully.",
                    unableExportCsv: "Unable to export CSV.",
                    noMoWorkloadSelectedRange: "No MO workload data in selected range.",
                    loaded: "Loaded",
                    moWorkloadItemUnit: "MO workload item",
                    noStatusData: "No status data available.",
                    noMoWorkloadData: "No MO workload data available.",
                    noWorkloadDataYetTitle: "No workload data yet",
                    adjustTimeRangeHint: "Adjust time range or wait for application activity to appear.",
                    sessionExpiredRedirect: "Session expired. Redirecting to login...",
                    networkErrorTryAgain: "Network error. Please try again.",
                    networkErrorMoment: "Network error. Please try again in a moment.",
                    currentCompleteness: "Current completeness:"
                }
            }
        },
        "zh-CN": {
            common: {
                portalBrand: "TA 招聘门户",
                utility: {
                    backToPortal: "返回门户首页"
                },
                locale: {
                    switchAria: "切换语言",
                    zh: "中文",
                    en: "English"
                },
                action: {
                    signIn: "登录",
                    createAccount: "创建账号",
                    createAdmin: "创建管理员账号"
                },
                footer: {
                    copyright: "University Hiring System © 2026"
                }
            },
            index: {
                page: {
                    title: "TA 招聘门户 - 首页"
                },
                nav: {
                    aria: "主导航",
                    overview: "概览",
                    forTa: "面向 TA",
                    forMo: "面向 MO",
                    forAdmin: "面向管理员",
                    process: "流程",
                    faq: "常见问题"
                },
                hero: {
                    badge: "大学 TA 招聘平台",
                    title: "用一条清晰流程管理 TA 招聘",
                    subtitle: "面向助教申请人、课程负责人和管理员的一体化门户，覆盖注册、申请、审核与结果跟踪。",
                    primary: "开始使用",
                    secondary: "前往登录",
                    adminHint: "需要管理员权限？",
                    adminLink: "创建管理员账号"
                },
                preview: {
                    title: "基于真实业务流程，而不是演示稿",
                    subtitle: "门户首页展示的内容都来自当前项目里已经实现的模块。",
                    cardTaTitle: "TA 工作台",
                    cardTaDesc: "创建档案、浏览职位、提交申请，并跟踪申请状态。",
                    cardMoTitle: "MO 工作台",
                    cardMoDesc: "发布职位、查看申请人、筛选候选人并跟踪招聘进展。",
                    cardAdminTitle: "管理员工作台",
                    cardAdminDesc: "查看招聘流程中的工作量和状态分布统计。"
                },
                forTa: {
                    title: "面向助教申请人",
                    lead: "从档案准备到录用结果，TA 全流程都可以在系统内完成。",
                    item1: "创建并维护个人档案、简历和技能信息。",
                    item2: "按关键词和状态搜索、筛选开放岗位。",
                    item3: "提交申请并跟踪待处理、通过或拒绝等状态。",
                    cta: "以 TA 身份登录"
                },
                forMo: {
                    title: "面向课程负责人（MO）",
                    lead: "快速发布岗位、评估申请人，并完成招聘闭环。",
                    item1: "发布包含课程、技能、名额和截止时间的职位。",
                    item2: "在统一列表中查看申请人档案和材料。",
                    item3: "执行录取/拒绝决策并跟踪审核进度。",
                    cta: "以 MO 身份登录"
                },
                forAdmin: {
                    title: "面向系统管理员",
                    lead: "从全局视角查看招聘工作量和处理分布。",
                    item1: "监控活跃岗位、申请总量和状态分布。",
                    item2: "查看各位 MO 的工作负载与运营趋势。",
                    item3: "导出统计快照用于汇报和规划。",
                    cta: "以管理员身份登录"
                },
                process: {
                    title: "从注册到最终录用的全流程",
                    lead: "首页展示的流程与系统当前实现的端到端能力一致。",
                    step1Title: "1. 注册账号",
                    step1Desc: "TA/MO 使用普通注册，管理员使用独立的管理员注册页。",
                    step2Title: "2. 完善档案或发布职位",
                    step2Desc: "TA 完善个人资料，MO 发布带要求和截止时间的岗位。",
                    step3Title: "3. 申请与审核",
                    step3Desc: "TA 提交申请，MO 审核候选人并做出录用决策。",
                    step4Title: "4. 跟踪状态与工作量",
                    step4Desc: "TA 跟踪申请结果，管理员跟踪平台整体工作量统计。"
                },
                ai: {
                    title: "AI 辅助招聘决策",
                    lead: "当前 AI 功能主要在 MO 工作区使用。",
                    item1: "Skill Match 可对比申请人与岗位需求的匹配度。",
                    item2: "Missing Skills 可识别候选群体的能力缺口。",
                    item3: "建议将 AI 结果与人工审核结合后再做最终筛选。"
                },
                faq: {
                    title: "常见问题",
                    q1: "每次都必须先访问这个首页吗？",
                    a1: "不需要。老用户可以直接打开登录页继续使用。",
                    q2: "我应该选择哪个角色？",
                    a2: "申请人请选择 TA，课程负责人请选择 MO，平台管理人员才选择 Admin。",
                    q3: "之后还能切换语言吗？",
                    a3: "可以。右上角可随时切换语言，系统会记住你的选择。"
                },
                cta: {
                    title: "准备好开始 TA 招聘流程了吗？",
                    subtitle: "先通过门户了解全貌，再进入你需要的登录流程。",
                    primary: "立即登录",
                    secondary: "创建账号"
                }
            },
            login: {
                page: {
                    title: "登录 - TA 招聘系统"
                },
                hero: {
                    title: "TA 招聘门户",
                    subtitle: "登录你的账号"
                },
                form: {
                    aria: "登录表单",
                    usernameLabel: "用户名或邮箱",
                    usernamePlaceholder: "用户名 或 name@university.edu",
                    passwordLabel: "密码",
                    passwordPlaceholder: "输入你的密码",
                    forgot: "忘记密码？",
                    keepSignedIn: "保持登录状态",
                    roleAria: "角色登录按钮",
                    ta: "TA 登录",
                    mo: "MO 登录",
                    admin: "管理员"
                },
                links: {
                    noAccount: "还没有账号？",
                    createAccount: "立即注册",
                    needAdmin: "需要管理员权限？",
                    createAdmin: "使用管理员邀请"
                },
                msg: {
                    failed: "登录失败，请检查用户名和密码。",
                    successRedirect: "登录成功，正在跳转...",
                    enterIdentifier: "请输入用户名或邮箱。",
                    identifierTooLong: "用户名或邮箱过长。",
                    identifierUnsupported: "用户名或邮箱包含不支持的字符。",
                    invalidEmail: "请输入有效的邮箱地址。",
                    invalidUsername: "用户名需以字母开头，长度 3-20，仅允许字母、数字和下划线。",
                    enterPassword: "请输入密码。",
                    passwordTooShort: "密码长度至少为 6 位。",
                    passwordTooLong: "密码过长。",
                    passwordUnsupported: "密码包含不支持的字符。",
                    networkError: "网络异常，请稍后重试。"
                }
            },
            register: {
                page: {
                    title: "注册 - TA 招聘系统"
                },
                hero: {
                    title: "创建账号",
                    subtitle: "几步加入 TA 招聘门户"
                },
                form: {
                    aria: "注册表单",
                    usernameLabel: "用户名",
                    usernamePlaceholder: "john_smith",
                    usernameHint: "长度 3-20，需以字母开头，仅允许字母、数字和下划线。",
                    emailLabel: "邮箱地址",
                    emailPlaceholder: "name@university.edu",
                    passwordLabel: "密码",
                    passwordPlaceholder: "创建一个密码",
                    passwordHint: "至少 6 个字符。",
                    confirmLabel: "确认密码",
                    confirmPlaceholder: "再次输入密码",
                    roleLabel: "注册身份",
                    roleAria: "角色选择按钮",
                    roleTaTitle: "TA",
                    roleTaDesc: "申请人",
                    roleMoTitle: "MO",
                    roleMoDesc: "课程负责人",
                    submit: "创建账号"
                },
                links: {
                    haveAccount: "已有账号？",
                    backLogin: "返回登录",
                    adminQuestion: "需要管理员账号？",
                    adminLink: "使用管理员邀请"
                },
                msg: {
                    enterUsername: "请输入用户名。",
                    usernameTooLong: "用户名过长。",
                    usernameUnsupported: "用户名包含不支持的字符。",
                    usernameInvalid: "用户名需以字母开头，长度 3-20，仅允许字母、数字和下划线。",
                    enterEmail: "请输入邮箱地址。",
                    emailTooLong: "邮箱过长。",
                    emailUnsupported: "邮箱包含不支持的字符。",
                    emailInvalid: "请输入有效的邮箱地址。",
                    enterPassword: "请创建密码。",
                    passwordTooShort: "密码长度至少为 6 位。",
                    passwordTooLong: "密码过长。",
                    passwordUnsupported: "密码包含不支持的字符。",
                    enterConfirmPassword: "请确认密码。",
                    passwordMismatch: "两次输入的密码不一致。",
                    selectRole: "请选择角色。",
                    adminUsePage: "管理员账号需通过邀请链接开通。",
                    failed: "注册失败，请检查信息后重试。",
                    successRedirect: "注册成功，正在跳转登录页...",
                    networkError: "网络异常，请稍后重试。"
                }
            },
            adminRegister: {
                page: {
                    title: "管理员注册 - TA 招聘系统"
                },
                hero: {
                    title: "管理员账号采用邀请制开通",
                    subtitle: "请联系现有管理员发送邀请邮件"
                },
                form: {
                    aria: "管理员邀请说明"
                },
                notice: {
                    primary: "出于安全原因，系统已关闭管理员公开自助注册。",
                    lead: "如果你已经收到邀请邮件，请打开",
                    link: "管理员邀请页面",
                    tail: "并使用邀请码完成账号开通。"
                },
                links: {
                    needStandard: "需要 TA 或 MO 账号？",
                    standardLink: "使用普通注册",
                    haveAccount: "已有账号？",
                    backLogin: "返回登录"
                }
            },
            adminInvite: {
                page: {
                    title: "管理员邀请注册 - TA 招聘系统"
                },
                hero: {
                    title: "完成管理员邀请注册",
                    subtitle: "使用邀请链接或邀请码创建管理员账号"
                },
                form: {
                    aria: "管理员邀请注册表单",
                    emailLabel: "邮箱地址",
                    emailPlaceholder: "admin@university.edu",
                    inviteCodeLabel: "邀请码（如果通过邮件链接打开可选填）",
                    inviteCodePlaceholder: "ABCDEFGH",
                    usernameLabel: "用户名",
                    usernamePlaceholder: "admin_username",
                    passwordLabel: "密码",
                    passwordPlaceholder: "创建密码",
                    confirmLabel: "确认密码",
                    confirmPlaceholder: "再次输入密码",
                    submit: "创建管理员账号"
                },
                status: {
                    checkingToken: "正在校验邀请令牌...",
                    noToken: "未检测到邀请令牌，请输入邮箱和邀请码。",
                    invalidOrExpired: "邀请链接无效或已过期，你仍可使用邮箱 + 邀请码。",
                    validated: "邀请校验通过。",
                    expiresAtPrefix: " 过期时间：",
                    validateFailed: "无法校验邀请链接，你可以使用邮箱 + 邀请码。",
                    completed: "邀请注册已完成。"
                },
                links: {
                    haveAccount: "已有账号？",
                    backLogin: "返回登录"
                },
                msg: {
                    invalidEmail: "请输入有效的邮箱地址。",
                    needTokenOrCode: "请提供邀请令牌或邀请码。",
                    invalidUsername: "用户名需以字母开头，长度 3-20，仅允许字母、数字和下划线。",
                    passwordTooShort: "密码长度至少为 6 位。",
                    passwordTooLong: "密码过长。",
                    passwordMismatch: "两次输入的密码不一致。",
                    createFailed: "创建管理员账号失败。",
                    createSuccessRedirect: "管理员账号创建成功，正在跳转登录页...",
                    networkError: "网络异常，请稍后重试。",
                    creating: "创建中..."
                }
            },
            portal: {
                action: {
                    signOut: "退出登录",
                    switchRoles: "切换角色"
                },
                brand: {
                    ta: "TA 门户",
                    mo: "MO 门户",
                    admin: "管理员门户"
                },
                nav: {
                    ta: {
                        aria: "TA 门户导航",
                        jobs: "职位",
                        status: "状态",
                        aiMatch: "AI 匹配",
                        profile: "档案"
                    },
                    mo: {
                        aria: "MO 门户导航",
                        applicants: "申请人",
                        postJob: "发布职位",
                        aiMatch: "AI 匹配"
                    },
                    admin: {
                        aria: "管理员门户导航",
                        dashboard: "仪表盘"
                    }
                },
                page: {
                    taDashboard: {
                        title: "TA 档案设置 - TA 招聘系统"
                    },
                    taJobList: {
                        title: "职位列表 - TA 招聘系统"
                    },
                    taJobDetail: {
                        title: "职位详情 - TA 招聘系统"
                    },
                    taApplicationStatus: {
                        title: "申请状态 - TA 招聘系统"
                    },
                    taApplicationDetail: {
                        title: "申请详情 - TA 招聘系统"
                    },
                    moDashboard: {
                        title: "MO 仪表盘 - 发布 TA 职位"
                    },
                    moOverview: {
                        title: "MO 概览 - TA 招聘系统"
                    },
                    moApplicantSelection: {
                        title: "申请审核 - TA 招聘系统"
                    },
                    moAiSkillMatch: {
                        title: "AI 技能匹配 - TA 招聘系统"
                    },
                    moAiMissingSkills: {
                        title: "AI 缺失技能 - TA 招聘系统"
                    },
                    adminDashboard: {
                        title: "管理员工作量仪表盘 - TA 招聘系统"
                    }
                },
                common: {
                    keyword: "关键词",
                    all: "全部",
                    open: "开放中",
                    closed: "已关闭",
                    filled: "已满额",
                    openUpper: "开放中",
                    courseCode: "课程编号",
                    applyFilters: "应用筛选",
                    clear: "清空",
                    refresh: "刷新",
                    positions: "名额",
                    workload: "工作量",
                    salary: "薪资",
                    deadline: "截止时间",
                    description: "描述",
                    requiredSkills: "所需技能",
                    application: "申请",
                    pending: "待处理",
                    accepted: "已通过",
                    rejected: "已拒绝",
                    withdrawn: "已撤回",
                    total: "总数",
                    selectJob: "选择职位",
                    high: "高",
                    medium: "中",
                    low: "低"
                },
                taDashboard: {
                    subtitle: "管理你的个人信息与学术背景。",
                    createProfileTitle: "创建你的 TA 档案",
                    basicDetails: "基础信息",
                    fullName: "姓名",
                    required: "必填",
                    studentId: "学号",
                    department: "院系",
                    program: "学位项目",
                    selectProgram: "选择你的学位项目",
                    programUndergraduate: "本科",
                    programMaster: "硕士",
                    programPhd: "博士",
                    additionalInfo: "补充信息",
                    additionalInfoLead: "这些字段当前为可选，但完善后会让你的档案更完整。",
                    gpa: "绩点",
                    phone: "手机号",
                    skills: "技能",
                    skillsHint: "请使用逗号分隔每项技能，后端会按列表存储。",
                    experience: "相关经历",
                    motivation: "申请动机",
                    createProfileButton: "创建档案",
                    saveChangesButton: "保存更改",
                    editProfileButton: "编辑档案",
                    cancelButton: "取消",
                    profileLabel: "个人档案",
                    resumeUploadTitle: "简历上传",
                    resumeUploadLead: "请上传一份 PDF、DOC 或 DOCX 简历，最大 10MB。",
                    resumeCardEmptyTitle: "上传您的简历",
                    resumeCardEmptyHint: "PDF、DOC 或 DOCX，最大 10MB",
                    chooseFile: "选择文件",
                    resumeRemoveAria: "删除简历",
                    noFileSelected: "尚未选择文件。",
                    waitingUpload: "等待上传",
                    resumeDraftTitle: "统一保存",
                    createProfileFirst: "请先创建档案",
                    resumeTip: "你可以先上传简历，也可以先填写其他字段；最新简历会在点击保存更改后正式生效。",
                    uploadSelectedResume: "上传已选简历"
                },
                taJobList: {
                    subtitle: "浏览并申请当前开放的 TA 职位。",
                    loadingPositions: "正在加载职位..."
                },
                taJobDetail: {
                    title: "职位详情",
                    subtitle: "查看岗位要求并提交你的申请。",
                    loadingDetails: "正在加载职位详情...",
                    moduleOrganizer: "课程负责人",
                    submitApplicationTitle: "提交你的申请",
                    coverLetterHint: "可补充一段简短的求职信来说明你的匹配度。",
                    coverLetter: "求职信",
                    applyNow: "申请该职位",
                    onlyTaHint: "仅 TA 账号可提交申请。若你已申请，本面板将显示最新状态。"
                },
                taApplicationStatus: {
                    title: "我的申请",
                    subtitle: "跟踪你已提交申请的状态变化。",
                    loadingApplications: "正在加载申请..."
                },
                taApplicationDetail: {
                    title: "申请详情",
                    backToList: "← 我的申请",
                    jobTeaserTitle: "申请职位详情",
                    viewDetailsCta: "查看详情 →",
                    gpaScale: "满分 4.0",
                    progressTitle: "申请进度",
                    mySkills: "我的技能",
                    responsibilities: "职责描述",
                    viewResumeFile: "查看文件",
                    resumeShort: "简历",
                    closeModal: "关闭",
                    missingId: "缺少申请编号，请返回列表重试。",
                    loadAppFailed: "无法加载申请信息。",
                    networkError: "网络异常，请稍后重试。",
                    untitled: "未命名职位",
                    submittedPrefix: "提交于",
                    noSkills: "暂无技能信息",
                    noCoverLetter: "未提供求职信。",
                    jobUnavailable: "暂时无法加载职位详情。",
                    workload: "工作时长",
                    applicants: "申请人数",
                    deadline: "申请截止",
                    noDescription: "暂无职位描述。",
                    sessionExpired: "登录已过期，正在跳转登录页...",
                    progressSubmit: "提交申请",
                    progressReview: "材料审核中",
                    progressInterview: "面试安排",
                    progressFinal: "最终决定"
                },
                moDashboard: {
                    title: "发布新职位",
                    subtitle: "为你的课程创建新的 TA 招聘职位。",
                    createPosting: "创建职位",
                    postPosition: "发布新的 TA 职位",
                    requiredLead: "标记 * 的字段为发布必填项。",
                    jobTitleRequired: "职位名称 *",
                    courseCodeRequired: "课程编号 *",
                    courseName: "课程名称",
                    applicationDeadline: "申请截止时间",
                    publishJob: "发布职位",
                    resetForm: "重置表单",
                    myPostings: "我的发布",
                    publishedJobs: "已发布职位",
                    loadingJobs: "正在加载你的职位..."
                },
                moOverview: {
                    subtitle: "先查看招聘活动，再快速跳转到发布与申请审核流程。",
                    activeJobs: "活跃职位",
                    totalApplicants: "申请总数",
                    pendingReview: "待审核",
                    offersSent: "已发录用",
                    recentActivity: "最近活动",
                    viewApplicants: "查看申请人",
                    loadingActivity: "正在加载活动..."
                },
                moApplicantSelection: {
                    subtitle: "审核并管理所有候选人的申请。",
                    job: "职位",
                    allJobs: "全部职位",
                    applicantProfile: "申请人档案",
                    selectApplicant: "选择申请人",
                    viewResume: "查看简历",
                    academic: "学术信息",
                    contact: "联系方式",
                    email: "邮箱",
                    phone: "电话",
                    experience: "经历"
                },
                moAiSkillMatch: {
                    title: "AI 技能匹配",
                    subtitle: "根据已发布职位要求，查看候选人的匹配评分。",
                    loadResults: "加载结果",
                    highMatch: "高匹配（≥85）",
                    mediumMatch: "中匹配（60-84）",
                    lowMatch: "低匹配（<60）",
                    averageScore: "平均匹配分",
                    scoreDistribution: "分数分布",
                    chooseJobHint: "请选择职位以加载技能匹配结果。"
                },
                moAiMissingSkills: {
                    title: "AI 缺失技能",
                    subtitle: "识别最常见的能力缺口并制定针对性提升方案。",
                    loadGaps: "加载缺口",
                    uniqueGapSkills: "独立缺口技能数",
                    missingSkillFrequency: "缺失技能频次",
                    missingCapabilityLead: "最常见的能力缺口",
                    matchScoreBuckets: "匹配分区间",
                    distributionLead: "按高 / 中 / 低 / 无进行分布统计",
                    chooseJobHint: "请选择职位以加载缺失技能分析。"
                },
                adminDashboard: {
                    title: "管理员工作量仪表盘",
                    subtitle: "在同一页面跟踪申请量与课程负责人审核工作量。",
                    start: "开始时间",
                    end: "结束时间",
                    applyRange: "应用区间",
                    exportCsv: "导出 CSV",
                    invitePanelAria: "管理员邀请创建",
                    inviteTitle: "邀请新管理员",
                    inviteLead: "创建一次性邀请链接/邀请码并通过邮件发送。",
                    inviteeEmail: "被邀请人邮箱",
                    inviteeEmailPlaceholder: "new_admin@university.edu",
                    expiresInHours: "有效期（小时）",
                    sendInvitation: "发送邀请",
                    applicationStatusDistribution: "申请状态分布",
                    applicationStatusLead: "当前时间范围内按审核状态统计。",
                    moWorkloadOverview: "MO 工作量概览",
                    moWorkloadLead: "按课程负责人查看工作强度。",
                    moWorkload: "MO 工作量",
                    loadingWorkload: "正在加载工作量..."
                },
                dynamic: {
                    checkingProfile: "正在检查档案...",
                    savingChanges: "正在保存更改...",
                    profileAlreadyExists: "该账号已存在档案，正在加载已保存信息...",
                    fixHighlightedFields: "请先修正高亮字段后再试。",
                    noProfileFound: "暂未找到档案，请填写下方表单。",
                    unableCheckProfile: "暂时无法检查已有档案，你仍可尝试创建新档案。",
                    unableCreateProfile: "无法创建档案，请检查表单后重试。",
                    unableUpdateProfile: "无法更新档案，请检查表单后重试。",
                    profileCreatedUploadingResume: "档案创建成功，正在上传你选择的简历...",
                    profileCreatedResumeFailed: "档案已创建，但简历上传失败，请稍后重试。",
                    profileCreatedSuccess: "档案创建成功，已在下方显示保存信息。",
                    profileUpdatedSuccess: "档案更新成功。",
                    profileReadonly: "你的档案已创建，当前以只读模式显示。",
                    currentResumePrefix: "当前已上传简历：",
                    noResumeUploaded: "尚未上传简历。",
                    noResumeSelected: "尚未选择简历文件。",
                    chooseResumeFirst: "请先选择简历文件。",
                    resumeRequiredToSave: "请先上传简历，再保存档案。",
                    resumeDraftUploading: "正在上传简历草稿：",
                    resumeDraftSaved: "简历草稿已上传，点击保存更改后生效。",
                    resumeDraftReplaceSaved: "新简历已上传，点击保存更改后会替换当前简历。",
                    pendingResumeRemoved: "待保存简历已删除。",
                    savedResumeRemoved: "当前简历已移除，请先上传新的简历再保存更改。",
                    resumeReady: "简历已就绪",
                    pendingResumePrefix: "待保存简历：",
                    pendingResumeCreateSuffix: " 填写其他信息后点击保存更改即可创建档案。",
                    pendingResumeReplaceSuffix: " 点击保存更改后将替换当前简历。",
                    resumeDiscardFailed: "暂时无法丢弃待保存简历，请稍后重试。",
                    createProfileThenUpload: "请先创建档案，再上传简历。",
                    createProfileAutoUpload: "请先创建档案。创建成功后将自动上传已选简历。",
                    resumeWillUploadAfterCreate: "将于创建档案后上传",
                    resumeReadyAfterCreate: "简历文件已就绪，将在档案创建后自动上传。",
                    replaceUploadedResume: "替换已上传简历",
                    resumeReadyReplace: "简历文件已就绪，点击上传即可替换当前简历。",
                    uploading: "正在上传",
                    uploadCompleted: "上传完成",
                    uploadAborted: "上传已取消。",
                    uploadInterrupted: "上传中断，请重试。",
                    uploadNetworkError: "上传简历时网络异常，请重试。",
                    resumeUploadSuccess: "简历上传成功。",
                    resumeUpdateSuccess: "简历更新成功。",
                    resumeUploadFailed: "简历上传失败，请重试。",
                    invalidResumeFormat: "文件格式不支持，请上传 PDF、DOC 或 DOCX。",
                    resumeTooLarge: "文件超过 10MB，请选择更小的文件。",
                    resumeWaitingUpload: "等待上传",
                    noSpecificSkills: "未列出具体技能。",
                    unableLoadJobs: "暂时无法加载职位。",
                    unableLoadJobsRetry: "暂时无法加载职位，请稍后重试。",
                    noJobsForFilters: "当前筛选条件下未找到职位。",
                    noJobsAvailable: "当前暂无可申请职位。",
                    showing: "显示",
                    jobUnit: "个职位",
                    unableLoadPositionsTitle: "无法加载职位",
                    refreshAfterNetworkCheck: "请检查网络后刷新列表重试。",
                    noPositionsPublishedTitle: "暂无已发布职位",
                    positionsAppearAfterPublish: "MO 发布新职位后会显示在这里。",
                    noMatchingPositionsTitle: "没有匹配的职位",
                    broadenKeywordHint: "可尝试放宽关键词或清除部分筛选。",
                    noExtraTags: "暂无额外标签",
                    viewDetails: "查看详情",
                    applyNow: "立即申请",
                    moShort: "MO",
                    submitting: "提交中...",
                    sendingInvitation: "发送中...",
                    inviteInvalidEmail: "请输入有效的被邀请人邮箱地址。",
                    inviteHoursRange: "有效期小时数必须在 1 到 168 之间。",
                    inviteCreateFailed: "创建邀请失败。",
                    inviteCreatedSuccess: "邀请创建成功。",
                    inviteCreateNetworkError: "创建邀请时网络异常。",
                    inviteResultLink: "邀请链接：",
                    inviteResultCode: "邀请码：",
                    inviteResultExpiresAt: "过期时间：",
                    inviteResultEmailDelivery: "邮件投递：",
                    inviteResultDeliveryDetail: "投递详情：",
                    inviteResultEmailPreview: "邮件预览",
                    applicationSubmitted: "申请已提交。",
                    applicationSubmittedRedirect: "申请提交成功，正在跳转到申请状态页...",
                    failedSubmitApplication: "提交申请失败，请稍后重试。",
                    currentAccountCannotSubmit: "当前账号无法在此页面提交申请。",
                    onlyTaSubmit: "仅 TA 账号可提交申请。",
                    alreadyApplied: "你已经申请过该职位。",
                    jobNoLongerAvailable: "该职位不存在或已下线。",
                    jobNotAccepting: "该职位当前不接受新申请。",
                    positionCurrently: "该职位当前状态为",
                    newApplicationsDisabled: "。已关闭新申请。",
                    jobNotFound: "未找到该职位，可能已被移除。",
                    applicationUnavailable: "申请不可用",
                    applicationStatusPrefix: "申请状态：",
                    networkErrorSubmitApplication: "提交申请时网络异常。",
                    taOnlyPage: "该页面仅 TA 账号可访问。",
                    unableLoadApplications: "无法加载你的申请记录。",
                    unableLoadApplicationsNow: "当前无法加载申请列表。",
                    noApplicationsSubmitted: "你还未提交任何申请。",
                    noApplicationsMatchFilters: "当前筛选条件下无匹配申请。",
                    applicationUnit: "个申请",
                    unableLoadApplicationsTitle: "无法加载申请",
                    noMatchingApplicationsTitle: "没有匹配的申请",
                    noApplicationsYetTitle: "暂无申请",
                    statusAppearsAfterApply: "提交职位申请后，状态会显示在这里。",
                    clearFiltersToBroaden: "可尝试清除状态或关键词筛选以扩大结果。",
                    applicationWithdrawnSuccess: "申请撤回成功。",
                    unableWithdrawApplication: "无法撤回该申请。",
                    networkErrorWithdrawApplication: "撤回申请时网络异常。",
                    appliedAt: "申请时间",
                    coverLetterColon: "求职信：",
                    noCoverLetterProvided: "未提供求职信。",
                    viewJob: "查看职位",
                    withdraw: "撤回",
                    onlyMoPublish: "仅 MO 账号可发布职位。",
                    failedPublishJob: "发布职位失败，请检查输入后重试。",
                    jobPostedSuccess: "职位发布成功。",
                    networkErrorPostingJob: "发布职位时网络异常。",
                    unableLoadPostings: "当前无法加载发布记录。",
                    noJobsPostedYet: "暂未发布任何职位。",
                    youHavePosted: "你已发布",
                    noPostingsYetTitle: "暂无发布记录",
                    publishFirstTaPosition: "请使用左侧表单发布你的第一个 TA 职位。",
                    reviewApplicants: "审核申请人",
                    untitledPosition: "未命名职位",
                    overviewPartialLoad: "部分概览数据加载失败，已展示可用结果。",
                    unableLoadOverview: "当前无法加载概览数据。",
                    moOnlyPage: "该页面仅 MO 账号可访问。",
                    noActivityYet: "暂无活动记录。",
                    tracking: "跟踪",
                    noRecentActivityTitle: "暂无最近活动",
                    latestUpdatesAppear: "当 TA 申请你发布的职位后，最新动态会显示在这里。",
                    newApplicationReceived: "收到新申请",
                    offerAccepted: "录用已接受",
                    applicationRejected: "申请已拒绝",
                    applicationWithdrawn: "申请已撤回",
                    applicationUpdated: "申请已更新",
                    unknownApplicant: "未知申请人",
                    loadingMatchResults: "正在加载匹配结果...",
                    unableLoadJobsMatching: "无法加载用于匹配分析的职位。",
                    unableLoadApplicationMatches: "无法加载申请匹配结果。",
                    networkErrorLoadingMatchData: "加载匹配数据时网络异常。",
                    noApplicantsForJob: "所选职位暂无申请人。",
                    noMatchDataTitle: "暂无匹配数据",
                    askCandidatesThenLoadMatch: "请先让候选人提交申请，再重新加载匹配结果。",
                    skillScore: "技能分",
                    keywordScore: "关键词分",
                    matchedColon: "已匹配：",
                    missingColon: "缺失：",
                    keywordColon: "关键词：",
                    gapKeywordColon: "缺口关键词：",
                    noStructuredSkillData: "暂无结构化技能数据",
                    noKeywordInsights: "暂无关键词洞察",
                    aiEnhancedApplied: "已应用 AI 增强匹配。",
                    loadingMissingSkillsData: "正在加载缺失技能数据...",
                    unableLoadJobsGapAnalysis: "无法加载用于缺口分析的职位。",
                    unableLoadMissingSkillsData: "无法加载缺失技能数据。",
                    networkErrorLoadingMissingSkills: "加载缺失技能数据时网络异常。",
                    noMissingSkillsFound: "当前数据下未发现缺失技能。",
                    noGapSkillsTitle: "暂无缺口技能",
                    gapInsightsWhenReady: "当申请人与职位数据准备好后，此面板会显示技能缺口洞察。",
                    noFrequencyData: "暂无频次数据。",
                    noScoreBucketData: "暂无分桶数据。",
                    repeatedGapSkillHint: "该技能在所选职位申请人中多次出现缺口。",
                    unknownSkill: "未知技能",
                    gapSkill: "缺口技能",
                    found: "发现",
                    applicantsSuffix: "位申请人",
                    recommendTrainingFor: "建议为其设计简短训练模块：",
                    topPriorityFor: "优先建议：为其增加聚焦筛选问题与入职计划：",
                    considerPracticalCheckFor: "建议增加快速实践检查：",
                    beforeInterviewRounds: "（用于面试前轮次）。",
                    duringCandidateReview: "（用于候选人评审阶段）。",
                    failedLoadApplicationTotals: "加载申请总量失败。",
                    failedLoadMoWorkloads: "加载 MO 工作量失败。",
                    networkErrorLoadingDashboard: "加载仪表盘时网络异常。",
                    exporting: "导出中...",
                    csvExportedSuccess: "CSV 导出成功。",
                    unableExportCsv: "无法导出 CSV。",
                    noMoWorkloadSelectedRange: "所选时间范围内暂无 MO 工作量数据。",
                    loaded: "已加载",
                    moWorkloadItemUnit: "条 MO 工作量",
                    noStatusData: "暂无状态数据。",
                    noMoWorkloadData: "暂无 MO 工作量数据。",
                    noWorkloadDataYetTitle: "暂无工作量数据",
                    adjustTimeRangeHint: "请调整时间范围，或等待申请活动产生后再查看。",
                    sessionExpiredRedirect: "会话已过期，正在跳转到登录页...",
                    networkErrorTryAgain: "网络异常，请重试。",
                    networkErrorMoment: "网络异常，请稍后重试。",
                    currentCompleteness: "当前完整度："
                }
            }
        }
    };

    var currentLocale = DEFAULT_LOCALE;

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
            var candidate = normalizeLocale(languages[i]);
            if (candidate) {
                return candidate;
            }
        }
        return "";
    }

    function resolveInitialLocale() {
        return readSavedLocale() || readBrowserLocale() || DEFAULT_LOCALE;
    }

    function getByPath(locale, key) {
        if (!locale || !key) {
            return "";
        }
        var target = dictionaries[locale];
        if (!target) {
            return "";
        }
        var parts = key.split(".");
        var value = target;
        for (var i = 0; i < parts.length; i += 1) {
            if (!value || typeof value !== "object" || !Object.prototype.hasOwnProperty.call(value, parts[i])) {
                return "";
            }
            value = value[parts[i]];
        }
        return typeof value === "string" ? value : "";
    }

    function t(key, fallback) {
        var localized = getByPath(currentLocale, key) || getByPath(DEFAULT_LOCALE, key);
        if (localized) {
            return localized;
        }
        return typeof fallback === "string" ? fallback : key;
    }

    function rememberLocale(locale) {
        try {
            window.localStorage.setItem(STORAGE_KEY, locale);
        } catch (error) {
            // Ignore storage failures (private mode, browser policy, etc.).
        }
    }

    function updateTextContent() {
        var textNodes = document.querySelectorAll("[data-i18n]");
        Array.prototype.forEach.call(textNodes, function (node) {
            var key = node.getAttribute("data-i18n");
            if (!node.hasAttribute("data-i18n-default")) {
                node.setAttribute("data-i18n-default", node.textContent);
            }
            node.textContent = t(key, node.getAttribute("data-i18n-default") || "");
        });
    }

    function updateAttribute(selector, keyAttribute, targetAttribute, defaultStoreAttribute) {
        var nodes = document.querySelectorAll(selector);
        Array.prototype.forEach.call(nodes, function (node) {
            var key = node.getAttribute(keyAttribute);
            if (!node.hasAttribute(defaultStoreAttribute)) {
                node.setAttribute(defaultStoreAttribute, node.getAttribute(targetAttribute) || "");
            }
            node.setAttribute(targetAttribute, t(key, node.getAttribute(defaultStoreAttribute) || ""));
        });
    }

    function syncLocaleButtons() {
        var switchers = document.querySelectorAll("[data-locale-switch]");
        Array.prototype.forEach.call(switchers, function (button) {
            var buttonLocale = normalizeLocale(button.getAttribute("data-locale") || "");
            var active = buttonLocale === currentLocale;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    function applyLocale(locale, persist) {
        var normalized = normalizeLocale(locale) || DEFAULT_LOCALE;
        currentLocale = normalized;
        document.documentElement.setAttribute("lang", normalized === CHINESE_LOCALE ? CHINESE_LOCALE : "en");

        updateTextContent();
        updateAttribute("[data-i18n-placeholder]", "data-i18n-placeholder", "placeholder", "data-i18n-placeholder-default");
        updateAttribute("[data-i18n-aria-label]", "data-i18n-aria-label", "aria-label", "data-i18n-aria-label-default");
        updateAttribute("[data-i18n-title]", "data-i18n-title", "title", "data-i18n-title-default");
        updateAttribute("[data-i18n-value]", "data-i18n-value", "value", "data-i18n-value-default");
        syncLocaleButtons();

        if (persist) {
            rememberLocale(normalized);
        }

        document.dispatchEvent(new CustomEvent("app:locale-changed", { detail: { locale: normalized } }));
    }

    function bindLocaleButtons() {
        var switchers = document.querySelectorAll("[data-locale-switch]");
        Array.prototype.forEach.call(switchers, function (button) {
            button.addEventListener("click", function () {
                var targetLocale = normalizeLocale(button.getAttribute("data-locale") || "");
                if (!targetLocale || targetLocale === currentLocale) {
                    return;
                }
                applyLocale(targetLocale, true);
            });
        });
    }

    window.AppI18n = {
        t: t,
        getLocale: function () {
            return currentLocale;
        },
        setLocale: function (locale) {
            applyLocale(locale, true);
        },
        apply: function () {
            applyLocale(currentLocale, false);
        }
    };

    function initialize() {
        bindLocaleButtons();
        applyLocale(resolveInitialLocale(), false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
