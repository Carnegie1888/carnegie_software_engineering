package com.example.tarecruitment.common.web;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

public final class ApiResponses {

    private ApiResponses() {
    }

    public static void ok(HttpServletResponse response, String message, Map<String, Object> data) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_OK, true, message, data);
    }

    public static void created(HttpServletResponse response, String message, Map<String, Object> data) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_CREATED, true, message, data);
    }

    public static void badRequest(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_BAD_REQUEST, false, message, null);
    }

    public static void unauthorized(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_UNAUTHORIZED, false, message, null);
    }

    public static void forbidden(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_FORBIDDEN, false, message, null);
    }

    public static void notFound(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_NOT_FOUND, false, message, null);
    }

    public static void methodNotAllowed(HttpServletResponse response) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, false, "Method not allowed", null);
    }

    public static void methodNotAllowed(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, false, message, null);
    }

    public static void serviceUnavailable(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE, false, message, null);
    }

    public static void serverError(HttpServletResponse response, String message) throws IOException {
        JsonResponseUtil.write(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, message, null);
    }

    public static void write(HttpServletResponse response,
                             int status,
                             boolean success,
                             String message,
                             Object data) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");

        StringBuilder json = new StringBuilder(256);
        json.append("{");
        json.append("\"success\":").append(success);
        json.append(",\"message\":\"").append(JsonResponseUtil.escapeJson(message)).append("\"");
        if (data != null) {
            json.append(",\"data\":").append(JsonResponseUtil.toJsonValue(data));
        }
        json.append("}");

        PrintWriter out = response.getWriter();
        out.write(json.toString());
    }

    public static void writeRaw(HttpServletResponse response,
                                int status,
                                boolean success,
                                String message,
                                String rawData) throws IOException {
        JsonResponseUtil.writeResponse(response, status, success, message, rawData);
    }

    public static Map<String, Object> objectMap(Object... keyValues) {
        return JsonResponseUtil.objectMap(keyValues);
    }

    public static Map<String, Object> rawObject(String rawMembers) {
        return JsonResponseUtil.rawObject(rawMembers);
    }

    public static String toJsonValue(Object value) {
        return JsonResponseUtil.toJsonValue(value);
    }
}
