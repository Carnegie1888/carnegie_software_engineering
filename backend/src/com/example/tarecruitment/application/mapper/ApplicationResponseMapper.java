package com.example.tarecruitment.application.mapper;

import com.example.tarecruitment.application.model.Application;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.search.FuzzySearchUtil;
import com.example.tarecruitment.common.web.ApiResponses;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Maps application domain objects to the JSON payload shape consumed by JSP pages.
 */
public final class ApplicationResponseMapper {

    private ApplicationResponseMapper() {
    }

    public static Map<String, Object> toListPayload(List<Application> applications,
                                                    FuzzySearchUtil.SearchOutcome<Application> searchOutcome) {
        List<Map<String, Object>> items = new ArrayList<>();
        if (applications != null) {
            for (Application application : applications) {
                items.add(toPayload(application));
            }
        }
        int total = applications == null ? 0 : applications.size();
        return ApiResponses.objectMap(
                "applications", items,
                "total", total,
                "keywordApplied", searchOutcome != null && searchOutcome.isKeywordApplied(),
                "approximateOnly", searchOutcome != null && searchOutcome.isApproximateOnly(),
                "hasMatches", searchOutcome != null && searchOutcome.hasMatches()
        );
    }

    public static List<String> searchFieldsForRole(Application application, User.Role role) {
        List<String> fields = new ArrayList<>();
        if (application == null || role == null) {
            return fields;
        }

        if (role == User.Role.TA) {
            fields.add(application.getJobTitle());
            fields.add(application.getCourseCode());
            fields.add(application.getMoName());
            return fields;
        }

        if (role == User.Role.MO) {
            fields.add(application.getApplicantName());
            fields.add(application.getApplicantEmail());
            fields.add(application.getJobTitle());
            return fields;
        }

        fields.add(application.getApplicantName());
        fields.add(application.getApplicantEmail());
        fields.add(application.getJobTitle());
        fields.add(application.getCourseCode());
        fields.add(application.getMoName());
        return fields;
    }

    public static Map<String, Object> toPayload(Application app) {
        return ApiResponses.objectMap(
                "applicationId", safeText(app.getApplicationId()),
                "jobId", safeText(app.getJobId()),
                "applicantId", safeText(app.getApplicantId()),
                "applicantName", safeText(app.getApplicantName()),
                "applicantEmail", safeText(app.getApplicantEmail()),
                "jobTitle", safeText(app.getJobTitle()),
                "courseCode", safeText(app.getCourseCode()),
                "moId", safeText(app.getMoId()),
                "moName", safeText(app.getMoName()),
                "status", app.getStatus() != null ? app.getStatus().name() : "PENDING",
                "coverLetter", safeText(app.getCoverLetter()),
                "appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().toString() : "",
                "updatedAt", app.getUpdatedAt() != null ? app.getUpdatedAt().toString() : "",
                "reviewedAt", app.getReviewedAt() != null ? app.getReviewedAt().toString() : "",
                "progressStage", app.getProgressStage() != null ? app.getProgressStage().name() : "SUBMITTED",
                "reviewStartedAt", app.getReviewStartedAt() != null ? app.getReviewStartedAt().toString() : "",
                "interviewScheduledAt", app.getInterviewScheduledAt() != null ? app.getInterviewScheduledAt().toString() : "",
                "finalDecisionAt", app.getFinalDecisionAt() != null ? app.getFinalDecisionAt().toString() : ""
        );
    }

    private static String safeText(String value) {
        return value != null ? value : "";
    }
}
