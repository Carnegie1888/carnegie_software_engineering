package com.example.tarecruitment.auth.web;

import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.web.ApiResponses;
import com.example.tarecruitment.common.web.WebRequests;
import com.example.tarecruitment.common.util.Logger;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * AuthFilter - 权限验证过滤器
 * 用于保护需要登录才能访问的资源
 *
 * 权限规则集中在 AccessPolicy，避免 Servlet 与前端路由迁移时散落修改路径集合。
 */
@WebFilter("/*")
public class AuthFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        Logger.i("AuthFilter", "Initialized");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String uri = httpRequest.getRequestURI();
        String contextPath = httpRequest.getContextPath();
        String path = uri.substring(contextPath.length());

        if (AccessPolicy.isStaticAsset(path)) {
            chain.doFilter(request, response);
            return;
        }

        if (AccessPolicy.isPublic(httpRequest.getMethod(), path)) {
            chain.doFilter(request, response);
            return;
        }

        // 获取session（不创建）
        HttpSession session = httpRequest.getSession(false);

        // 检查用户是否已登录
        User user = null;
        if (session != null) {
            user = (User) session.getAttribute("user");
        }

        // 需要登录的路径
        if (user == null) {
            // AJAX请求返回JSON
            if (WebRequests.isAjax(httpRequest)) {
                ApiResponses.unauthorized(httpResponse, "Please login first");
                return;
            }

            // 普通请求重定向到登录页
            httpResponse.sendRedirect(contextPath + "/login.jsp");
            return;
        }

        // 验证角色权限
        if (!AccessPolicy.canAccess(httpRequest.getMethod(), path, user.getRole())) {
            if (WebRequests.isAjax(httpRequest)) {
                ApiResponses.forbidden(httpResponse, "You don't have permission to access this resource");
                return;
            }

            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return;
        }

        // 放行请求
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        Logger.i("AuthFilter", "Destroyed");
    }
}
