package com.example.authlogin.servlet;

import com.example.authlogin.dao.NotificationDao;
import com.example.authlogin.model.Notification;
import com.example.authlogin.model.User;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * NotificationServlet — 系统通知 API
 *
 * GET  /api/notifications          — 所有已登录用户可查看
 * POST /api/notifications          — 仅 ADMIN 可发布 (params: title, content)
 * DELETE /api/notifications        — 仅 ADMIN 可删除 (param: notificationId)
 */
@WebServlet("/api/notifications")
public class NotificationServlet extends HttpServlet {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private NotificationDao notificationDao;

    @Override
    public void init() throws ServletException {
        notificationDao = NotificationDao.getInstance();
    }

    // ── GET — list all notifications ─────────────────────────────────────

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = currentUser(request);
        if (user == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }

        List<Notification> notifications = notificationDao.findAll();
        List<Map<String, Object>> payload = new ArrayList<>();
        for (Notification n : notifications) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("notificationId", n.getNotificationId());
            item.put("title", n.getTitle() != null ? n.getTitle() : "");
            item.put("content", n.getContent() != null ? n.getContent() : "");
            item.put("publishedAt", n.getPublishedAt() != null ? n.getPublishedAt().format(FMT) : "");
            item.put("publishedByUsername", n.getPublishedByUsername() != null ? n.getPublishedByUsername() : "");
            payload.add(item);
        }

        JsonResponseUtil.writeResponse(response, 200, true, "OK",
                "\"data\":" + JsonResponseUtil.toJsonValue(payload));
    }

    // ── POST — publish a notification (admin only) ────────────────────────

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = currentUser(request);
        if (user == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }
        if (user.getRole() != User.Role.ADMIN) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only admins can publish notifications", null);
            return;
        }

        String title   = safe(request.getParameter("title"));
        String content = safe(request.getParameter("content"));

        if (title.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "Title is required", null);
            return;
        }
        if (content.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "Content is required", null);
            return;
        }

        Notification n = new Notification();
        n.setTitle(title);
        n.setContent(content);
        n.setPublishedByUserId(user.getUserId());
        n.setPublishedByUsername(user.getUsername());

        notificationDao.save(n);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("notificationId", n.getNotificationId());
        JsonResponseUtil.writeJsonResponse(response, 201, true, "Notification published", data);
    }

    // ── DELETE — remove a notification (admin only) ───────────────────────

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = currentUser(request);
        if (user == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }
        if (user.getRole() != User.Role.ADMIN) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only admins can delete notifications", null);
            return;
        }

        String notificationId = safe(request.getParameter("notificationId"));
        if (notificationId.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "notificationId is required", null);
            return;
        }

        boolean removed = notificationDao.deleteById(notificationId);
        if (removed) {
            JsonResponseUtil.writeJsonResponse(response, 200, true, "Notification deleted", null);
        } else {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Notification not found", null);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private User currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (User) session.getAttribute("user");
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
