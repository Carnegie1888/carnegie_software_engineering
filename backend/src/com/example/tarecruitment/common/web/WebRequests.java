package com.example.tarecruitment.common.web;

import com.example.tarecruitment.auth.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * Shared request helpers for Servlet entry points.
 */
public final class WebRequests {

    private WebRequests() {
    }

    public static User currentUser(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Object value = session.getAttribute("user");
        return value instanceof User ? (User) value : null;
    }

    public static boolean isAjax(HttpServletRequest request) {
        return request != null && "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

    public static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    public static boolean containsControlChars(String value) {
        return value != null && value.chars().anyMatch(ch -> ch < 32 || ch == 127);
    }

    public static boolean containsDangerousMarkup(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String text = value.toLowerCase();
        return text.matches(".*<[^>]*>.*")
                || text.contains("javascript:")
                || text.matches(".*on\\w+\\s*=.*");
    }
}
