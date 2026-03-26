package com.example.authlogin.service.ai;

import jakarta.servlet.ServletContext;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Properties;

/**
 * TA 职位 AI 匹配配置。
 * 读取优先级：本地 properties 文件 > System Property > Environment Variable。
 */
public final class TaJobMatchAiConfig {

    private static final String LOCAL_CONFIG_PATH = "/WEB-INF/ai/ta-job-match.local.properties";
    private static final String DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    private static final String DEFAULT_MODEL = "tongyi-xiaomi-analysis-flash";
    private static final long DEFAULT_TIMEOUT_MS = 6000L;

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final long timeoutMillis;

    private TaJobMatchAiConfig(String apiKey, String baseUrl, String model, long timeoutMillis) {
        this.apiKey = safe(apiKey);
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.model = isBlank(model) ? DEFAULT_MODEL : model.trim();
        this.timeoutMillis = timeoutMillis > 0 ? timeoutMillis : DEFAULT_TIMEOUT_MS;
    }

    public static TaJobMatchAiConfig load(ServletContext servletContext) {
        Properties localProps = loadLocalProperties(servletContext);

        String apiKey = readConfig(localProps, "dashscope.api.key", "dashscope.api.key", "DASHSCOPE_API_KEY");
        String baseUrl = readConfig(
                localProps,
                "ta.job.match.ai.base-url",
                "ta.job.match.ai.base-url",
                "TA_JOB_MATCH_AI_BASE_URL"
        );
        String model = readConfig(
                localProps,
                "ta.job.match.ai.model",
                "ta.job.match.ai.model",
                "TA_JOB_MATCH_AI_MODEL"
        );
        String timeoutText = readConfig(
                localProps,
                "ta.job.match.ai.timeout-ms",
                "ta.job.match.ai.timeout-ms",
                "TA_JOB_MATCH_AI_TIMEOUT_MS"
        );
        long timeout = parseTimeout(timeoutText);

        return new TaJobMatchAiConfig(apiKey, baseUrl, model, timeout);
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getModel() {
        return model;
    }

    public long getTimeoutMillis() {
        return timeoutMillis;
    }

    public boolean isApiKeyConfigured() {
        if (isBlank(apiKey)) {
            return false;
        }
        String lower = apiKey.toLowerCase(Locale.ROOT);
        return !(lower.contains("replace")
                || lower.contains("placeholder")
                || lower.contains("your_api")
                || lower.contains("change_me")
                || lower.contains("changeme"));
    }

    private static Properties loadLocalProperties(ServletContext servletContext) {
        Properties properties = new Properties();
        if (servletContext == null) {
            return properties;
        }
        try (InputStream inputStream = servletContext.getResourceAsStream(LOCAL_CONFIG_PATH)) {
            if (inputStream != null) {
                properties.load(inputStream);
            }
        } catch (IOException e) {
            servletContext.log("Failed to load TA AI local config: " + LOCAL_CONFIG_PATH, e);
        }
        return properties;
    }

    private static String readConfig(Properties localProps, String localKey, String propertyName, String envName) {
        String localValue = localProps.getProperty(localKey);
        if (!isBlank(localValue)) {
            return localValue.trim();
        }

        String propertyValue = System.getProperty(propertyName);
        if (!isBlank(propertyValue)) {
            return propertyValue.trim();
        }

        String envValue = System.getenv(envName);
        if (!isBlank(envValue)) {
            return envValue.trim();
        }
        return "";
    }

    private static long parseTimeout(String text) {
        if (isBlank(text)) {
            return DEFAULT_TIMEOUT_MS;
        }
        try {
            long parsed = Long.parseLong(text.trim());
            if (parsed <= 0L) {
                return DEFAULT_TIMEOUT_MS;
            }
            return parsed;
        } catch (NumberFormatException ex) {
            return DEFAULT_TIMEOUT_MS;
        }
    }

    private static String normalizeBaseUrl(String url) {
        String normalized = isBlank(url) ? DEFAULT_BASE_URL : url.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static String safe(String text) {
        return text == null ? "" : text.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
