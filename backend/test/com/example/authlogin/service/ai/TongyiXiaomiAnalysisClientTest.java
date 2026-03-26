package com.example.authlogin.service.ai;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSession;
import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * TongyiXiaomiAnalysisClient 自动化测试。
 */
public class TongyiXiaomiAnalysisClientTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        test("Client should parse valid AI response", () -> {
            TaJobMatchAiConfig config = mockConfig("test-api-key");
            String payload = "{\"overallScore\":88,\"matchLevel\":\"HIGH\",\"summary\":\"匹配度高\","
                    + "\"strengths\":[\"技能覆盖好\"],\"risks\":[\"经历可补充\"],"
                    + "\"suggestions\":[\"补充案例\"],\"jobEvidence\":[\"岗位要求 SQL\"],"
                    + "\"profileEvidence\":[\"档案含 SQL\"]}";

            TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(
                    new FakeHttpClient(200, wrapAssistantContent(payload)),
                    config
            );
            TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = client.analyze("sys", "user");

            assert attempt.hasResult() : "valid response should parse";
            assert attempt.getPayload().getOverallScore() == 88 : "score should equal payload";
            assert "HIGH".equals(attempt.getPayload().getMatchLevel()) : "level should parse";
            assert attempt.getPayload().getStrengths().size() == 1 : "strength list should parse";
        });

        test("Client should fail when required fields are missing", () -> {
            TaJobMatchAiConfig config = mockConfig("test-api-key");
            String payload = "{\"summary\":\"only summary\"}";
            TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(
                    new FakeHttpClient(200, wrapAssistantContent(payload)),
                    config
            );

            TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = client.analyze("sys", "user");
            assert !attempt.hasResult() : "missing score should fail";
            assert attempt.getFailureReason().contains("invalid") : "reason should describe format issue";
        });

        test("Client should fail on non-2xx response", () -> {
            TaJobMatchAiConfig config = mockConfig("test-api-key");
            TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(
                    new FakeHttpClient(503, "{\"error\":\"busy\"}"),
                    config
            );

            TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = client.analyze("sys", "user");
            assert !attempt.hasResult() : "non-2xx should fail";
            assert attempt.getFailureReason().contains("503") : "failure reason should contain status";
        });

        test("Client should fail when request throws IOException", () -> {
            TaJobMatchAiConfig config = mockConfig("test-api-key");
            TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(
                    FakeHttpClient.ioFailure(new IOException("timeout")),
                    config
            );

            TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = client.analyze("sys", "user");
            assert !attempt.hasResult() : "io failure should fallback";
            assert attempt.getFailureReason().contains("IO error") : "reason should contain IO error";
        });

        test("Client should reject placeholder api key", () -> {
            TaJobMatchAiConfig config = mockConfig("REPLACE_WITH_REAL_DASHSCOPE_API_KEY");
            TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(
                    new FakeHttpClient(200, "{}"),
                    config
            );

            TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = client.analyze("sys", "user");
            assert !attempt.hasResult() : "placeholder key should be rejected";
            assert attempt.getFailureReason().contains("missing or placeholder")
                    : "reason should mention placeholder";
        });

        System.out.println("========================================");
        System.out.println("TongyiXiaomiAnalysisClientTest Summary");
        System.out.println("========================================");
        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Total:  " + (passed + failed));
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static TaJobMatchAiConfig mockConfig(String apiKey) {
        String oldKey = System.getProperty("dashscope.api.key");
        String oldBase = System.getProperty("ta.job.match.ai.base-url");
        String oldModel = System.getProperty("ta.job.match.ai.model");
        String oldTimeout = System.getProperty("ta.job.match.ai.timeout-ms");
        try {
            System.setProperty("dashscope.api.key", apiKey);
            System.setProperty("ta.job.match.ai.base-url", "https://mock.example.com/compatible-mode/v1");
            System.setProperty("ta.job.match.ai.model", "tongyi-xiaomi-analysis-flash");
            System.setProperty("ta.job.match.ai.timeout-ms", "2000");
            return TaJobMatchAiConfig.load(null);
        } finally {
            restoreProperty("dashscope.api.key", oldKey);
            restoreProperty("ta.job.match.ai.base-url", oldBase);
            restoreProperty("ta.job.match.ai.model", oldModel);
            restoreProperty("ta.job.match.ai.timeout-ms", oldTimeout);
        }
    }

    private static void restoreProperty(String key, String value) {
        if (value == null) {
            System.clearProperty(key);
        } else {
            System.setProperty(key, value);
        }
    }

    private static String wrapAssistantContent(String content) {
        String escaped = content
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
        return "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + escaped + "\"}}]}";
    }

    private static void test(String name, Runnable runnable) {
        try {
            runnable.run();
            passed++;
            System.out.println("[PASS] " + name);
        } catch (Throwable t) {
            failed++;
            System.out.println("[FAIL] " + name + " - " + t.getMessage());
        }
    }

    private static final class FakeHttpClient extends HttpClient {
        private final int statusCode;
        private final String body;
        private final IOException ioException;

        private FakeHttpClient(int statusCode, String body) {
            this(statusCode, body, null);
        }

        private FakeHttpClient(int statusCode, String body, IOException ioException) {
            this.statusCode = statusCode;
            this.body = body == null ? "" : body;
            this.ioException = ioException;
        }

        private static FakeHttpClient ioFailure(IOException ex) {
            return new FakeHttpClient(500, "", ex);
        }

        @Override
        public Optional<CookieHandler> cookieHandler() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> connectTimeout() {
            return Optional.empty();
        }

        @Override
        public Redirect followRedirects() {
            return Redirect.NEVER;
        }

        @Override
        public Optional<ProxySelector> proxy() {
            return Optional.empty();
        }

        @Override
        public SSLContext sslContext() {
            return null;
        }

        @Override
        public SSLParameters sslParameters() {
            return null;
        }

        @Override
        public Optional<Authenticator> authenticator() {
            return Optional.empty();
        }

        @Override
        public Version version() {
            return Version.HTTP_1_1;
        }

        @Override
        public Optional<Executor> executor() {
            return Optional.empty();
        }

        @Override
        public <T> HttpResponse<T> send(HttpRequest request,
                                        HttpResponse.BodyHandler<T> responseBodyHandler) throws IOException {
            if (ioException != null) {
                throw ioException;
            }
            @SuppressWarnings("unchecked")
            HttpResponse<T> casted = (HttpResponse<T>) new FakeHttpResponse(request, statusCode, body);
            return casted;
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler) {
            return CompletableFuture.completedFuture(sendUnchecked(request, responseBodyHandler));
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler,
                                                                HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            return CompletableFuture.completedFuture(sendUnchecked(request, responseBodyHandler));
        }

        private <T> HttpResponse<T> sendUnchecked(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
            try {
                return send(request, responseBodyHandler);
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    private static final class FakeHttpResponse implements HttpResponse<String> {
        private final HttpRequest request;
        private final int statusCode;
        private final String body;

        private FakeHttpResponse(HttpRequest request, int statusCode, String body) {
            this.request = request;
            this.statusCode = statusCode;
            this.body = body;
        }

        @Override
        public int statusCode() {
            return statusCode;
        }

        @Override
        public HttpRequest request() {
            return request;
        }

        @Override
        public Optional<HttpResponse<String>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(Map.of(), (a, b) -> true);
        }

        @Override
        public String body() {
            return body;
        }

        @Override
        public Optional<SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return request.uri();
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }
}
