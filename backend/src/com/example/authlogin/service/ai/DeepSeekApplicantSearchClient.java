package com.example.authlogin.service.ai;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * DeepSeek client for MO applicant AI search.
 */
public class DeepSeekApplicantSearchClient {

    private static final Pattern CONTENT_PATTERN = Pattern.compile(
            "\"content\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
            Pattern.DOTALL
    );

    private final HttpClient httpClient;
    private final DeepSeekAiConfig config;

    public DeepSeekApplicantSearchClient(DeepSeekAiConfig config) {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(3000))
                .build(), config);
    }

    DeepSeekApplicantSearchClient(HttpClient httpClient, DeepSeekAiConfig config) {
        this.httpClient = httpClient;
        this.config = config;
    }

    public boolean isConfigured() {
        return config != null && config.isApiKeyConfigured();
    }

    public SearchAttempt search(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            return SearchAttempt.failure("deepseek.api.key is missing or placeholder.");
        }
        if (isBlank(systemPrompt) || isBlank(userPrompt)) {
            return SearchAttempt.failure("Prompt content is empty.");
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
                return SearchAttempt.failure("DeepSeek endpoint returned status " + response.statusCode() + ".");
            }

            Optional<SearchPayload> payload = parseResponse(response.body());
            if (payload.isEmpty()) {
                return SearchAttempt.failure("DeepSeek response format is invalid.");
            }
            return SearchAttempt.success(payload.get());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return SearchAttempt.failure("DeepSeek request interrupted.");
        } catch (IOException ex) {
            return SearchAttempt.failure("DeepSeek request IO error: " + ex.getMessage());
        } catch (RuntimeException ex) {
            return SearchAttempt.failure("DeepSeek request failed: " + ex.getMessage());
        }
    }

    private String buildRequestBody(String systemPrompt, String userPrompt) {
        return "{"
                + "\"model\":\"" + escapeJson(config.getModel()) + "\","
                + "\"temperature\":0.2,"
                + "\"response_format\":{\"type\":\"json_object\"},"
                + "\"stream\":false,"
                + "\"messages\":["
                + "{\"role\":\"system\",\"content\":\"" + escapeJson(systemPrompt) + "\"},"
                + "{\"role\":\"user\",\"content\":\"" + escapeJson(userPrompt) + "\"}"
                + "]"
                + "}";
    }

    private Optional<SearchPayload> parseResponse(String body) {
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

        String action = extractStringField(json, "action").toLowerCase(Locale.ROOT);
        if (!"recommend".equals(action) && !"out_of_scope".equals(action)) {
            return Optional.empty();
        }

        String message = safe(extractStringField(json, "message"));
        List<SearchRecommendation> results = "recommend".equals(action)
                ? extractRecommendations(json)
                : Collections.emptyList();

        return Optional.of(new SearchPayload(action, message, results));
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

    private List<SearchRecommendation> extractRecommendations(String json) {
        String arrayBody = extractArrayBody(json, "results");
        if (isBlank(arrayBody)) {
            return Collections.emptyList();
        }
        List<String> objects = extractObjectBlocks(arrayBody);
        List<SearchRecommendation> recommendations = new ArrayList<>();
        for (String object : objects) {
            String candidateRef = extractStringField(object, "candidateRef");
            String recommendation = extractStringField(object, "recommendation");
            if (!isBlank(candidateRef) && !isBlank(recommendation)) {
                recommendations.add(new SearchRecommendation(candidateRef, recommendation));
            }
        }
        return Collections.unmodifiableList(recommendations);
    }

    private String extractArrayBody(String json, String fieldName) {
        Pattern fieldPattern = Pattern.compile("\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\\[", Pattern.DOTALL);
        Matcher matcher = fieldPattern.matcher(json);
        if (!matcher.find()) {
            return "";
        }
        int start = matcher.end();
        int depth = 1;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < json.length(); i++) {
            char ch = json.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (ch == '[') {
                depth++;
            } else if (ch == ']') {
                depth--;
                if (depth == 0) {
                    return json.substring(start, i);
                }
            }
        }
        return "";
    }

    private List<String> extractObjectBlocks(String arrayBody) {
        List<String> objects = new ArrayList<>();
        int start = -1;
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < arrayBody.length(); i++) {
            char ch = arrayBody.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (ch == '{') {
                if (depth == 0) {
                    start = i;
                }
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0 && start >= 0) {
                    objects.add(arrayBody.substring(start, i + 1));
                    start = -1;
                }
            }
        }
        return objects;
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

    public static final class SearchAttempt {
        private final SearchPayload payload;
        private final String failureReason;

        private SearchAttempt(SearchPayload payload, String failureReason) {
            this.payload = payload;
            this.failureReason = safe(failureReason);
        }

        public static SearchAttempt success(SearchPayload payload) {
            return new SearchAttempt(payload, "");
        }

        public static SearchAttempt failure(String reason) {
            return new SearchAttempt(null, reason);
        }

        public boolean hasResult() {
            return payload != null;
        }

        public SearchPayload getPayload() {
            return payload;
        }

        public String getFailureReason() {
            return failureReason;
        }
    }

    public static final class SearchPayload {
        private final String action;
        private final String message;
        private final List<SearchRecommendation> recommendations;

        public SearchPayload(String action, String message, List<SearchRecommendation> recommendations) {
            this.action = safe(action).toLowerCase(Locale.ROOT);
            this.message = safe(message);
            this.recommendations = recommendations == null
                    ? Collections.emptyList()
                    : Collections.unmodifiableList(new ArrayList<>(recommendations));
        }

        public String getAction() {
            return action;
        }

        public String getMessage() {
            return message;
        }

        public List<SearchRecommendation> getRecommendations() {
            return recommendations;
        }
    }

    public static final class SearchRecommendation {
        private final String candidateRef;
        private final String recommendation;

        public SearchRecommendation(String candidateRef, String recommendation) {
            this.candidateRef = safe(candidateRef);
            this.recommendation = safe(recommendation);
        }

        public String getCandidateRef() {
            return candidateRef;
        }

        public String getRecommendation() {
            return recommendation;
        }
    }
}
