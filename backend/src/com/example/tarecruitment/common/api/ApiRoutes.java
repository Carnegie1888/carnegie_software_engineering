package com.example.tarecruitment.common.api;

public final class ApiRoutes {

    public static final String AUTH_LOGIN = "/api/auth/login";
    public static final String AUTH_REGISTER = "/api/auth/register";
    public static final String AUTH_LOGOUT = "/api/auth/logout";
    public static final String AUTH_AVAILABILITY = "/api/auth/availability";

    public static final String JOBS = "/api/jobs";
    public static final String APPLICATIONS = "/api/applications";

    public static final String ME_ACCOUNT = "/api/me/account";
    public static final String ME_AVATAR = "/api/me/avatar";
    public static final String ME_APPLICANT_PROFILE = "/api/me/applicant-profile";
    public static final String ME_APPLICANT_RESUME_DRAFT = "/api/me/applicant-profile/resume-draft";
    public static final String ME_APPLICANT_PHOTO = "/api/me/applicant-profile/photo";
    public static final String ME_APPLICANT_RESUME = "/api/me/applicant-profile/resume";

    public static final String NOTIFICATIONS = "/api/notifications";

    public static final String ADMIN_WORKLOAD_STATISTICS = "/api/admin/workload-statistics";
    public static final String ADMIN_INVITATIONS = "/api/admin/invitations";
    public static final String ADMIN_INVITATION_VALIDATION = "/api/admin/invitations/validation";
    public static final String ADMIN_INVITATION_ACCEPTANCE = "/api/admin/invitations/acceptance";
    public static final String ADMIN_CURRENT_INVITATION_CODE = "/api/admin/invitations/current-code";

    public static final String MO_SKILL_MATCHES = "/api/mo/skill-matches";
    public static final String MO_APPLICANT_RECOMMENDATIONS = "/api/mo/applicant-recommendations";
    public static final String MO_APPLICATION_MATCH_ANALYSES = "/api/mo/application-match-analyses";

    public static final String TA_JOB_RECOMMENDATIONS = "/api/ta/job-recommendations";
    public static final String TA_JOB_MATCH_ANALYSES = "/api/ta/job-match-analyses";

    private ApiRoutes() {
    }
}
