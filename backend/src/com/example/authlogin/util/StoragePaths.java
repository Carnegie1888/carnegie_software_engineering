package com.example.authlogin.util;

import java.nio.file.Paths;

/**
 * StoragePaths - 统一管理运行时数据目录
 * 优先使用显式配置，其次使用 Tomcat 的 catalina.base，最后回退到当前工作目录。
 */
public final class StoragePaths {

    private static final String DATA_DIR_PROPERTY = "ta.hiring.data.dir";
    private static final String DATA_DIR_ENV = "TA_HIRING_DATA_DIR";
    private static final String APP_NAME = "groupproject";

    private StoragePaths() {
    }

    public static String getDataDir() {
        String configuredDir = firstNonBlank(
                System.getProperty(DATA_DIR_PROPERTY),
                System.getenv(DATA_DIR_ENV)
        );

        if (configuredDir != null) {
            return configuredDir;
        }

        // 优先使用项目根目录 (user.dir) 下的 data 文件夹
        String userDir = System.getProperty("user.dir");
        if (userDir != null && !userDir.trim().isEmpty()) {
            String projectDataDir = Paths.get(userDir, "data").toString();
            // 检查项目根目录下是否存在 data 目录
            if (java.nio.file.Files.exists(java.nio.file.Paths.get(projectDataDir))) {
                return projectDataDir;
            }
        }

        // 回退到 Tomcat catalina.base 下的 data/groupproject
        String catalinaBase = System.getProperty("catalina.base");
        if (catalinaBase != null && !catalinaBase.trim().isEmpty()) {
            return Paths.get(catalinaBase, "data", APP_NAME).toString();
        }

        // 最终回退到 user.dir/data
        return Paths.get(userDir, "data").toString();
    }

    public static String getUsersDir() {
        return Paths.get(getDataDir(), "users").toString();
    }

    public static String getApplicantsDir() {
        return Paths.get(getDataDir(), "applicants").toString();
    }

    public static String getJobsDir() {
        return Paths.get(getDataDir(), "jobs").toString();
    }

    public static String getApplicationsDir() {
        return Paths.get(getDataDir(), "applications").toString();
    }

    public static String getInvitesDir() {
        return Paths.get(getDataDir(), "invites").toString();
    }

    public static String getResumeDir() {
        return Paths.get(getDataDir(), "resumes").toString();
    }

    public static String getResumeDraftDir() {
        return Paths.get(getDataDir(), "resume-drafts").toString();
    }

    public static String getPhotoDir() {
        return Paths.get(getDataDir(), "photos").toString();
    }

    public static String getPhotoDraftDir() {
        return Paths.get(getDataDir(), "photo-drafts").toString();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return null;
    }
}
