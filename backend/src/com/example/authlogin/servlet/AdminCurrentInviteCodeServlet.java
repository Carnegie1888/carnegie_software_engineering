package com.example.authlogin.servlet;

import com.example.authlogin.model.User;
import com.example.authlogin.service.InviteCodeService;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * AdminCurrentInviteCodeServlet - 当前邀请码查询与主动刷新接口。
 *
 * GET  /api/admin/invite/current-code  返回当前码和剩余秒数（需 ADMIN）
 * POST /api/admin/invite/current-code  主动轮换，返回新码（需 ADMIN）
 */
@WebServlet("/api/admin/invite/current-code")
public class AdminCurrentInviteCodeServlet extends HttpServlet {

    private InviteCodeService inviteCodeService;

    @Override
    public void init() {
        inviteCodeService = InviteCodeService.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        User user = requireAdmin(request, response);
        if (user == null) return;

        JsonResponseUtil.write(response, 200, true, "OK",
                JsonResponseUtil.objectMap(
                        "code", inviteCodeService.getCurrentCode(),
                        "secondsRemaining", inviteCodeService.getSecondsRemaining()
                ));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        User user = requireAdmin(request, response);
        if (user == null) return;

        String newCode = inviteCodeService.forceRotate();
        JsonResponseUtil.write(response, 200, true, "Code rotated",
                JsonResponseUtil.objectMap(
                        "code", newCode,
                        "secondsRemaining", inviteCodeService.getSecondsRemaining()
                ));
    }

    private User requireAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("user") : null;
        if (user == null) {
            JsonResponseUtil.write(response, 401, false, "Please login first", null);
            return null;
        }
        if (user.getRole() != User.Role.ADMIN) {
            JsonResponseUtil.write(response, 403, false, "Admin access required", null);
            return null;
        }
        return user;
    }
}
