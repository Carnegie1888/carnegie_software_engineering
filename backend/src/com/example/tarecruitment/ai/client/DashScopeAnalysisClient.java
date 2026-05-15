package com.example.tarecruitment.ai.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 基于 DashScope OpenAI 兼容接口的 TA 匹配分析客户端。
 *
 * 这个客户端只负责请求和解析，不决定页面显示结构。
 * 返回字段会被 TaJobMatchAnalysisService 包装成前端可展示的分析块。
 */
public class DashScopeAnalysisClient {

    // DashScope OpenAI 兼容响应里真正要解析的是 assistant message 的 content 字段。
    private static final Pattern CONTENT_PATTERN = Pattern.compile(
            "\"content\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
            Pattern.DOTALL
    );

    private final HttpClient httpClient;
    private final MatchAnalysisAiConfig config;

    public DashScopeAnalysisClient(MatchAnalysisAiConfig config) {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(3000))
                .build(), config);
    }

    DashScopeAnalysisClient(HttpClient httpClient, MatchAnalysisAiConfig config) {
        this.httpClient = httpClient;
        this.config = config;
    }

    /**
     * 请求 DashScope 生成匹配分析。
     *
     * 方法不记录 prompt 内容，失败时只返回原因文本，避免把候选人资料、
     * 职位描述或内部 ref 暴露到日志/响应外层。
     */
    public AnalysisAttempt analyze(String systemPrompt, String userPrompt) {
        if (config == null) {
            return AnalysisAttempt.failure("AI config is missing.");
        }
        if (!config.isApiKeyConfigured()) {
            return AnalysisAttempt.failure("dashscope.api.key is missing or placeholder.");
        }
        if (isBlank(systemPrompt) || isBlank(userPrompt)) {
            return AnalysisAttempt.failure("Prompt content is empty.");
        }

        String endpoint = config.getBaseUrl() + "/chat/completions";
        String requestBody = buildRequestBody(systemPrompt, userPrompt);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofMillis(config.getTimeoutMillis()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + config.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return AnalysisAttempt.failure("AI endpoint returned status " + response.statusCode() + ".");
            }

            Optional<AnalysisPayload> payload = parseResponse(response.body());
            if (payload.isEmpty()) {
                return AnalysisAttempt.failure("AI response format is invalid.");
            }
            return AnalysisAttempt.success(payload.get());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return AnalysisAttempt.failure("AI request interrupted.");
        } catch (IOException ex) {
            return AnalysisAttempt.failure("AI request IO error: " + ex.getMessage());
        } catch (RuntimeException ex) {
            return AnalysisAttempt.failure("AI request failed: " + ex.getMessage());
        }
    }

    /**
     * 构造 OpenAI 兼容 chat/completions 请求体。
     *
     * systemPrompt 控制输出格式，userPrompt 放脱敏后的职位/候选人上下文；
     * 两者都只在请求体中传输，不在本地落盘。
     */
    private String buildRequestBody(String systemPrompt, String userPrompt) {
        return "{"
                + "\"model\":\"" + escapeJson(config.getModel()) + "\","
                + "\"temperature\":1.0,"
                + "\"messages\":["
                + "{\"role\":\"system\",\"content\":\"" + escapeJson(systemPrompt) + "\"},"
                + "{\"role\":\"user\",\"content\":\"" + escapeJson(userPrompt) + "\"}"
                + "]"
                + "}";
    }

    /**
     * 解析模型返回的 JSON 分析结果。
     *
     * 模型可能把 JSON 包在 markdown 代码块中，也可能把 score 字段命名成
     * overallScore 或 score；这里集中做兼容，service 层拿到的是稳定 payload。
     */
    private Optional<AnalysisPayload> parseResponse(String body) {
        if (isBlank(body)) {
            return Optional.empty();
        }
        String content = extractAssistantContent(body);
        if (isBlank(content)) {
            return Optional.empty();
        }
        String json = extractJsonObject(content);
        if (isBlank(json)) {
            return Optional.empty();
        }

        Double scoreValue = extractNumberField(json, "overallScore");
        if (scoreValue == null) {
            scoreValue = extractNumberField(json, "score");
        }
        if (scoreValue == null) {
            return Optional.empty();
        }
        int score = (int) Math.round(Math.max(0.0, Math.min(100.0, scoreValue)));

        String matchLevel = extractStringField(json, "matchLevel");
        matchLevel = normalizeMatchLevel(matchLevel, score);
        String summary = safe(extractStringField(json, "summary"));

        List<String> strengths = normalizeList(extractStringArray(json, "strengths"));
        List<String> risks = normalizeList(extractStringArray(json, "risks"));
        List<String> suggestions = normalizeList(extractStringArray(json, "suggestions"));
        List<String> jobEvidence = normalizeList(extractStringArray(json, "jobEvidence"));
        List<String> profileEvidence = normalizeList(extractStringArray(json, "profileEvidence"));

        return Optional.of(new AnalysisPayload(
                score,
                matchLevel,
                summary,
                strengths,
                risks,
                suggestions,
                jobEvidence,
                profileEvidence
        ));
    }

    /**
     * 从接口响应中取 assistant content。
     *
     * 这里用轻量正则而不是引入 JSON 库，是因为项目保持 Servlet/JSP
     * 轻量栈；只解析当前接口必须用到的字段。
     */
    private String extractAssistantContent(String body) {
        Matcher matcher = CONTENT_PATTERN.matcher(body);
        if (!matcher.find()) {
            return "";
        }
        return unescapeJson(matcher.group(1)).trim();
    }

    /**
     * 从 assistant content 中提取最外层 JSON 对象。
     *
     * 兼容模型返回 ```json ... ``` 的情况，防止代码块围栏影响字段解析。
     */
    private String extractJsonObject(String content) {
        String trimmed = safe(content);
        if (trimmed.startsWith("```")) {
            int firstBreak = trimmed.indexOf('\n');
            if (firstBreak >= 0) {
                trimmed = trimmed.substring(firstBreak + 1);
            }
            int lastFence = trimmed.lastIndexOf("```");
            if (lastFence >= 0) {
                trimmed = trimmed.substring(0, lastFence);
            }
        }
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1).trim();
        }
        return "";
    }

    /**
     * 读取数值字段，解析失败时返回 null 交给上层判定响应无效。
     */
    private Double extractNumberField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
        Matcher matcher = pattern.matcher(json);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Double.parseDouble(matcher.group(1));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    /**
     * 读取字符串字段，并处理 JSON 转义。
     */
    private String extractStringField(String json, String fieldName) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                Pattern.DOTALL
        );
        Matcher matcher = pattern.matcher(json);
        if (!matcher.find()) {
            return "";
        }
        return unescapeJson(matcher.group(1)).trim();
    }

    /**
     * 读取字符串数组字段。
     *
     * 分析结果中的 strengths/risks/suggestions/evidence 都走这条路径，
     * 统一过滤空项，避免前端渲染空 bullet。
     */
    private List<String> extractStringArray(String json, String fieldName) {
        Pattern arrayPattern = Pattern.compile(
                "\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\\[(.*?)\\]",
                Pattern.DOTALL
        );
        Matcher arrayMatcher = arrayPattern.matcher(json);
        if (!arrayMatcher.find()) {
            return Collections.emptyList();
        }

        String listBody = arrayMatcher.group(1);
        Matcher itemMatcher = Pattern.compile("\"((?:\\\\.|[^\"\\\\])*)\"").matcher(listBody);
        List<String> items = new ArrayList<>();
        while (itemMatcher.find()) {
            String value = unescapeJson(itemMatcher.group(1)).trim();
            if (!value.isEmpty()) {
                items.add(value);
            }
        }
        return items;
    }

    /**
     * 清洗模型返回的列表项。
     *
     * 去重和截断在客户端完成，保证即使模型输出过长，页面卡片也不会
     * 被单条分析文本撑坏。
     */
    private List<String> normalizeList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> deduplicated = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = safe(value);
            if (!normalized.isEmpty()) {
                if (normalized.length() > 220) {
                    normalized = normalized.substring(0, 220).trim();
                }
                deduplicated.add(normalized);
            }
        }
        return Collections.unmodifiableList(new ArrayList<>(deduplicated));
    }

    /**
     * 归一化匹配等级。
     *
     * 如果模型没按 HIGH/MEDIUM/LOW 返回，就根据分数推断，保证前端
     * 始终能拿到稳定的等级枚举。
     */
    private String normalizeMatchLevel(String rawLevel, int score) {
        String level = safe(rawLevel).toUpperCase(Locale.ROOT);
        if ("HIGH".equals(level) || "MEDIUM".equals(level) || "LOW".equals(level)) {
            return level;
        }
        if (score >= 85) {
            return "HIGH";
        }
        if (score >= 60) {
            return "MEDIUM";
        }
        return "LOW";
    }

    /**
     * 手动转义 JSON 字符串，避免 prompt 中的换行/引号破坏请求体。
     */
    private String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * 手动还原接口响应中的 JSON 字符串转义。
     *
     * 只实现当前 DashScope 响应需要的转义类型，不扩展成通用 JSON 解析器。
     */
    private String unescapeJson(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        StringBuilder result = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c != '\\' || i + 1 >= text.length()) {
                result.append(c);
                continue;
            }
            char next = text.charAt(++i);
            switch (next) {
                case '"':
                    result.append('"');
                    break;
                case '\\':
                    result.append('\\');
                    break;
                case '/':
                    result.append('/');
                    break;
                case 'b':
                    result.append('\b');
                    break;
                case 'f':
                    result.append('\f');
                    break;
                case 'n':
                    result.append('\n');
                    break;
                case 'r':
                    result.append('\r');
                    break;
                case 't':
                    result.append('\t');
                    break;
                case 'u':
                    if (i + 4 < text.length()) {
                        String hex = text.substring(i + 1, i + 5);
                        try {
                            result.append((char) Integer.parseInt(hex, 16));
                            i += 4;
                        } catch (NumberFormatException ex) {
                            result.append("\\u").append(hex);
                            i += 4;
                        }
                    } else {
                        result.append("\\u");
                    }
                    break;
                default:
                    result.append(next);
                    break;
            }
        }
        return result.toString();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    /**
     * 一次 AI 请求的结果包装。
     *
     * service 只检查 hasResult，不需要关心 HTTP 异常、解析异常等底层细节。
     */
    public static final class AnalysisAttempt {
        private final AnalysisPayload payload;
        private final String failureReason;

        private AnalysisAttempt(AnalysisPayload payload, String failureReason) {
            this.payload = payload;
            this.failureReason = safe(failureReason);
        }

        public static AnalysisAttempt success(AnalysisPayload payload) {
            return new AnalysisAttempt(payload, "");
        }

        public static AnalysisAttempt failure(String reason) {
            return new AnalysisAttempt(null, reason);
        }

        public boolean hasResult() {
            return payload != null;
        }

        public AnalysisPayload getPayload() {
            return payload;
        }

        public String getFailureReason() {
            return failureReason;
        }
    }

    /**
     * 前端可展示的匹配分析结构。
     *
     * 字段名和 /api/ta/job-match-analyses、/api/mo/application-match-analyses
     * 的响应 payload 对齐。
     */
    public static final class AnalysisPayload {
        private final int overallScore;
        private final String matchLevel;
        private final String summary;
        private final List<String> strengths;
        private final List<String> risks;
        private final List<String> suggestions;
        private final List<String> jobEvidence;
        private final List<String> profileEvidence;

        public AnalysisPayload(int overallScore,
                               String matchLevel,
                               String summary,
                               List<String> strengths,
                               List<String> risks,
                               List<String> suggestions,
                               List<String> jobEvidence,
                               List<String> profileEvidence) {
            this.overallScore = overallScore;
            this.matchLevel = matchLevel;
            this.summary = summary;
            this.strengths = strengths;
            this.risks = risks;
            this.suggestions = suggestions;
            this.jobEvidence = jobEvidence;
            this.profileEvidence = profileEvidence;
        }

        public int getOverallScore() {
            return overallScore;
        }

        public String getMatchLevel() {
            return matchLevel;
        }

        public String getSummary() {
            return summary;
        }

        public List<String> getStrengths() {
            return strengths;
        }

        public List<String> getRisks() {
            return risks;
        }

        public List<String> getSuggestions() {
            return suggestions;
        }

        public List<String> getJobEvidence() {
            return jobEvidence;
        }

        public List<String> getProfileEvidence() {
            return profileEvidence;
        }
    }
}
