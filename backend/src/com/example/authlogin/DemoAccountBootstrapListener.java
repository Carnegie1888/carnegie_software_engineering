package com.example.authlogin;

import com.example.authlogin.dao.UserDao;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * 应用启动时预热用户数据，确保欢迎页访问前已补齐固定测试账号。
 */
@WebListener
public class DemoAccountBootstrapListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            UserDao.getInstance();
            sce.getServletContext().log("Demo accounts initialized");
        } catch (RuntimeException e) {
            sce.getServletContext().log("Demo account initialization will retry on first request", e);
        }
    }
}
