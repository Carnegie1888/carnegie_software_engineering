package com.example.tarecruitment.job.mapper;

import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class JobRequestMapper {

    private JobRequestMapper() {
    }

    public static String pathJobId(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank() || "/".equals(pathInfo)) {
            return "";
        }
        String text = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = text.indexOf('/');
        return slash >= 0 ? text.substring(0, slash) : text;
    }

    public static String trimToEmpty(String value) {
        return value != null ? value.trim() : "";
    }

    public static List<String> normalizeSkillsToList(String rawSkills) {
        if (rawSkills == null || rawSkills.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(rawSkills.split("[,，]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public static Double parseWeeklyHours(String weeklyHoursText) {
        if (weeklyHoursText == null || weeklyHoursText.trim().isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(weeklyHoursText.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static LocalDateTime parseDeadline(String deadlineStr) {
        if (deadlineStr == null || deadlineStr.trim().isEmpty()) {
            return null;
        }

        String text = deadlineStr.trim();
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {
            // Try the legacy browser datetime-local variants below.
        }

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        } catch (Exception ignored) {
            // Try minute precision below.
        }

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
        } catch (Exception ignored) {
            return null;
        }
    }

    public static Map<String, String> formParameters(HttpServletRequest request) throws IOException {
        Map<String, String> values = new LinkedHashMap<>();
        if (request == null) {
            return values;
        }
        String contentType = request.getContentType();
        if (contentType == null || !contentType.toLowerCase().contains("application/x-www-form-urlencoded")) {
            return values;
        }

        String body = request.getReader().lines().collect(Collectors.joining("&"));
        if (body.trim().isEmpty()) {
            return values;
        }

        for (String pair : body.split("&")) {
            if (pair.isEmpty()) {
                continue;
            }
            int separator = pair.indexOf('=');
            String rawKey = separator >= 0 ? pair.substring(0, separator) : pair;
            String rawValue = separator >= 0 ? pair.substring(separator + 1) : "";
            String key = URLDecoder.decode(rawKey, StandardCharsets.UTF_8);
            String value = URLDecoder.decode(rawValue, StandardCharsets.UTF_8);
            values.put(key, value);
        }
        return values;
    }

    public static Map<String, String> requestParameters(HttpServletRequest request, String... names) {
        Map<String, String> values = new LinkedHashMap<>();
        if (request == null || names == null) {
            return values;
        }
        for (String name : names) {
            values.put(name, request.getParameter(name));
        }
        return values;
    }
}
