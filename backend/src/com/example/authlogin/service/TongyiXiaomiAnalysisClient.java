package com.example.authlogin.service;

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
 */
public class TongyiXiaomiAnalysisClient {

    private static final Pattern CONTENT_PATTERN = Pattern.compile(
            "\"content\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
            Pattern.DOTALL
    );

    private final HttpClient httpClient;
    private final TaJobMatchAiConfig config;

    public TongyiXiaomiAnalysisClient(TaJobMatchAiConfig config) {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(3000))
                .build(), config);
    }

    TongyiXiaomiAnalysisClient(HttpClient httpClient, TaJobMatchAiConfig config) {
        this.httpClient = httpClient;
        this.config = config;
    }

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

    private String extractAssistantContent(String body) {
        Matcher matcher = CONTENT_PATTERN.matcher(body);
        if (!matcher.find()) {
            return "";
        }
        return unescapeJson(matcher.group(1)).trim();
    }

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
