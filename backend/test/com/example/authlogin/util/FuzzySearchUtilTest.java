package com.example.authlogin.util;

import java.util.Arrays;
import java.util.List;

/**
 * FuzzySearchUtil 关键场景测试（main + assert）。
 */
public class FuzzySearchUtilTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        test("English typo should match within 1-2 edits", () -> {
            List<String> candidates = Arrays.asList("Database Fundamentals");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "databse", item -> List.of(item));
            assert outcome.hasMatches() : "typo query should have matches";
            assert outcome.getItems().size() == 1 : "expected one matched item";
            assert outcome.isApproximateOnly() : "typo-only hit should be marked as approximate";
        });

        test("Course code should ignore spaces and hyphens", () -> {
            List<String> candidates = Arrays.asList("EBU-6304 Data Structures");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "ebu 6304", item -> List.of(item));
            assert outcome.hasMatches() : "course code normalization should match";
            assert !outcome.isApproximateOnly() : "course code normalization should count as direct match";
        });

        test("Chinese original text should match directly", () -> {
            List<String> candidates = Arrays.asList("数据库系统助教岗位");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "数据库", item -> List.of(item));
            assert outcome.hasMatches() : "Chinese original query should match";
            assert !outcome.isApproximateOnly() : "Chinese original hit should be direct";
        });

        test("Pinyin full text should match Chinese text", () -> {
            List<String> candidates = Arrays.asList("数据库系统助教岗位");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "shujuku", item -> List.of(item));
            assert outcome.hasMatches() : "pinyin full query should match";
            assert outcome.isApproximateOnly() : "pinyin full is treated as approximate";
        });

        test("Pinyin initials should match Chinese text", () -> {
            List<String> candidates = Arrays.asList("数据库系统助教岗位");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "sjk", item -> List.of(item));
            assert outcome.hasMatches() : "pinyin initials query should match";
            assert outcome.isApproximateOnly() : "pinyin initials is treated as approximate";
        });

        test("Low-confidence query should be rejected", () -> {
            List<String> candidates = Arrays.asList("数据库系统助教岗位", "Advanced Database");
            FuzzySearchUtil.SearchOutcome<String> outcome = FuzzySearchUtil.search(candidates, "zzzq", item -> List.of(item));
            assert !outcome.hasMatches() : "low-confidence query should return no match";
            assert outcome.getItems().isEmpty() : "result list should be empty";
        });

        System.out.println("========================================");
        System.out.println("FuzzySearchUtilTest Summary");
        System.out.println("========================================");
        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Total:  " + (passed + failed));
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
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
}

