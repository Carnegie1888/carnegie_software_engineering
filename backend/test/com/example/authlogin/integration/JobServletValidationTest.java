package com.example.authlogin.integration;

import com.example.authlogin.servlet.JobServlet;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class JobServletValidationTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        JobServlet servlet = new JobServlet();

        test("validateInput should accept valid posting payload", () -> {
            String futureDeadline = LocalDateTime.now().plusDays(3).withNano(0)
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            String result = (String) invokePrivate(
                    servlet,
                    "validateInput",
                    new Class<?>[] {
                            String.class, String.class, String.class, String.class, String.class,
                            String.class, String.class, String.class, String.class
                    },
                    "Teaching Assistant - Data Structures",
                    "EBU6304",
                    "Software Engineering",
                    "Assist with labs and grading.",
                    "Java, SQL, communication",
                    "2",
                    "8 hours / week",
                    "25 SGD / hour",
                    futureDeadline
            );
            assert result == null : "Expected valid payload to pass validation";
        });

        test("validateInput should reject more than 20 skills", () -> {
            StringBuilder skills = new StringBuilder();
            for (int i = 1; i <= 21; i += 1) {
                if (i > 1) {
                    skills.append(",");
                }
                skills.append("skill").append(i);
            }
            String futureDeadline = LocalDateTime.now().plusDays(2).withNano(0)
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            String result = (String) invokePrivate(
                    servlet,
                    "validateInput",
                    new Class<?>[] {
                            String.class, String.class, String.class, String.class, String.class,
                            String.class, String.class, String.class, String.class
                    },
                    "Valid title",
                    "CS601",
                    "Valid course name",
                    "Valid description",
                    skills.toString(),
                    "1",
                    "8h/week",
                    "30/hour",
                    futureDeadline
            );
            assert "Please list up to 20 skills".equals(result) : "Expected skills count validation message";
        });

        test("normalizeSkillsToList should support semicolon and comma", () -> {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) invokePrivate(
                    servlet,
                    "normalizeSkillsToList",
                    new Class<?>[] { String.class },
                    "Java; SQL, communication ;teamwork"
            );
            assert skills.size() == 4 : "Expected normalized skill size to be 4";
            assert "Java".equals(skills.get(0)) : "Expected first skill Java";
            assert "SQL".equals(skills.get(1)) : "Expected second skill SQL";
        });

        test("validateStatus should reject invalid enum value", () -> {
            String invalid = (String) invokePrivate(
                    servlet,
                    "validateStatus",
                    new Class<?>[] { String.class, boolean.class },
                    "INVALID_STATUS",
                    true
            );
            assert "Invalid status value".equals(invalid) : "Expected invalid status to be rejected";

            String valid = (String) invokePrivate(
                    servlet,
                    "validateStatus",
                    new Class<?>[] { String.class, boolean.class },
                    "OPEN",
                    true
            );
            assert valid == null : "Expected OPEN status to pass";
        });

        test("validatePositions should reject empty when required", () -> {
            String result = (String) invokePrivate(
                    servlet,
                    "validatePositions",
                    new Class<?>[] { String.class, boolean.class },
                    "",
                    true
            );
            assert "Positions must be a whole number".equals(result)
                    : "Expected required positions validation to fail on empty value";
        });

        test("validateDeadline should reject past datetime", () -> {
            String pastDeadline = LocalDateTime.now().minusDays(1).withNano(0)
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            String result = (String) invokePrivate(
                    servlet,
                    "validateDeadline",
                    new Class<?>[] { String.class, boolean.class },
                    pastDeadline,
                    true
            );
            assert "Deadline cannot be in the past".equals(result)
                    : "Expected past deadline validation failure";
        });

        System.out.println("========================================");
        System.out.println("JobServletValidationTest Summary");
        System.out.println("========================================");
        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Total:  " + (passed + failed));
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static Object invokePrivate(Object target, String methodName, Class<?>[] paramTypes, Object... args)
            throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName, paramTypes);
        method.setAccessible(true);
        return method.invoke(target, args);
    }

    private static void test(String name, TestAction action) {
        try {
            action.run();
            passed += 1;
            System.out.println("[PASS] " + name);
        } catch (Throwable t) {
            failed += 1;
            System.out.println("[FAIL] " + name + " - " + t.getMessage());
        }
    }

    @FunctionalInterface
    private interface TestAction {
        void run() throws Exception;
    }
}
