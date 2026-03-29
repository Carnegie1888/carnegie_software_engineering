package com.example.authlogin.util;

import java.nio.file.Paths;

/**
 * StoragePaths - 统一管理运行时数据目录
 *
 * 配置方式：在 config.bat 中设置 TA_HIRING_DATA_DIR 环境变量
 *
 * 数据目录结构：
 * ${TA_HIRING_DATA_DIR}/
 * ├── users/
 * ├── jobs/
 * ├── applicants/
 * ├── applications/
 * ├── invites/
 * ├── resumes/
 * └── photos/
 */
public final class StoragePaths {

    private static final String DATA_DIR_ENV = "TA_HIRING_DATA_DIR";

    private StoragePaths() {
    }

    /**
     * 获取数据根目录
     * 必须通过 config.bat 配置 TA_HIRING_DATA_DIR 环境变量
     */
    public static String getDataDir() {
        String dataDir = System.getenv(DATA_DIR_ENV);
        if (dataDir != null && !dataDir.trim().isEmpty()) {
            return dataDir.trim();
        }
        throw new IllegalStateException(
            "数据目录未配置。请在 config.bat 中设置 TA_HIRING_DATA_DIR 环境变量。\n" +
            "例如：set TA_HIRING_DATA_DIR=%CATALINA_HOME%\\data"
        );
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
}
