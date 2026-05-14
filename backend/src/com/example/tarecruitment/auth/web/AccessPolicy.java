package com.example.tarecruitment.auth.web;

import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.api.ApiRoutes;

import java.util.Locale;

final class AccessPolicy {

    private AccessPolicy() {
    }

    static boolean isStaticAsset(String path) {
        if (path == null) {
            return false;
        }
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith(".css")
                || lower.endsWith(".js")
                || lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".gif")
                || lower.endsWith(".ico")
                || lower.endsWith(".woff")
                || lower.endsWith(".woff2")
                || lower.endsWith(".ttf")
                || lower.endsWith(".svg")
                || path.startsWith("/static/")
                || path.startsWith("/css/")
                || path.startsWith("/js/")
                || path.startsWith("/images/");
    }

    static boolean isPublic(String method, String path) {
        String verb = normalizeMethod(method);
        if ("/".equals(path)
                || "/index.jsp".equals(path)
                || "/login.jsp".equals(path)
                || "/register.jsp".equals(path)
                || "/admin-invite.jsp".equals(path)
                || "/admin-register.jsp".equals(path)) {
            return true;
        }
        if ("POST".equals(verb)
                && (ApiRoutes.AUTH_LOGIN.equals(path)
                || ApiRoutes.AUTH_REGISTER.equals(path)
                || ApiRoutes.AUTH_LOGOUT.equals(path)
                || ApiRoutes.ADMIN_INVITATION_ACCEPTANCE.equals(path))) {
            return true;
        }
        if ("GET".equals(verb)
                && (ApiRoutes.AUTH_AVAILABILITY.equals(path)
                || ApiRoutes.JOBS.equals(path)
                || path.startsWith(ApiRoutes.JOBS + "/"))) {
            return true;
        }
        return false;
    }

    static boolean canAccess(String method, String path, User.Role role) {
        if (role == null) {
            return false;
        }
        if (role == User.Role.ADMIN) {
            return !ApiRoutes.MO_SKILL_MATCHES.equals(path);
        }
        if (path.startsWith("/jsp/admin/") || path.startsWith("/api/admin/")) {
            return false;
        }
        if (role == User.Role.MO) {
            return path.startsWith("/jsp/mo/")
                    || path.startsWith("/jsp/ta/")
                    || path.startsWith("/api/mo/")
                    || path.startsWith("/api/ta/")
                    || path.startsWith(ApiRoutes.APPLICATIONS)
                    || path.startsWith(ApiRoutes.ME_ACCOUNT)
                    || path.startsWith(ApiRoutes.ME_AVATAR)
                    || path.startsWith(ApiRoutes.NOTIFICATIONS)
                    || isMoJobWrite(method, path);
        }
        if (role == User.Role.TA) {
            return path.startsWith("/jsp/ta/")
                    || path.startsWith("/api/ta/")
                    || path.startsWith(ApiRoutes.APPLICATIONS)
                    || path.startsWith("/api/me/")
                    || path.startsWith(ApiRoutes.NOTIFICATIONS);
        }
        return false;
    }

    private static boolean isMoJobWrite(String method, String path) {
        String verb = normalizeMethod(method);
        return path.startsWith(ApiRoutes.JOBS)
                && ("POST".equals(verb) || "PUT".equals(verb) || "DELETE".equals(verb));
    }

    private static String normalizeMethod(String method) {
        return method == null ? "" : method.toUpperCase(Locale.ROOT);
    }
}
