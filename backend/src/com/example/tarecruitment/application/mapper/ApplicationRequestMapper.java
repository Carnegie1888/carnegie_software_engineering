package com.example.tarecruitment.application.mapper;

/**
 * Maps application resource paths into application identifiers and sub-resources.
 */
public final class ApplicationRequestMapper {

    private ApplicationRequestMapper() {
    }

    public static String applicationId(String pathInfo) {
        String[] segments = segments(pathInfo);
        return segments.length > 0 ? segments[0] : "";
    }

    public static boolean isCollection(String pathInfo) {
        return applicationId(pathInfo).isEmpty();
    }

    public static boolean isDetail(String pathInfo) {
        return segments(pathInfo).length == 1;
    }

    public static boolean isTransition(String pathInfo) {
        String[] segments = segments(pathInfo);
        return segments.length == 2 && "transition".equals(segments[1]);
    }

    public static boolean isApplicantDetail(String pathInfo) {
        String[] segments = segments(pathInfo);
        return segments.length == 2 && "applicant".equals(segments[1]);
    }

    public static boolean isApplicantResume(String pathInfo) {
        String[] segments = segments(pathInfo);
        return segments.length == 3 && "applicant".equals(segments[1]) && "resume".equals(segments[2]);
    }

    public static boolean isApplicantPhoto(String pathInfo) {
        String[] segments = segments(pathInfo);
        return segments.length == 3 && "applicant".equals(segments[1]) && "photo".equals(segments[2]);
    }

    private static String[] segments(String pathInfo) {
        if (pathInfo == null || pathInfo.trim().isEmpty() || "/".equals(pathInfo.trim())) {
            return new String[0];
        }
        String trimmed = pathInfo.trim();
        if (trimmed.startsWith("/")) {
            trimmed = trimmed.substring(1);
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        if (trimmed.isEmpty()) {
            return new String[0];
        }
        return trimmed.split("/");
    }
}
