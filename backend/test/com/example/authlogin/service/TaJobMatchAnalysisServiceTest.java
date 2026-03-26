package com.example.authlogin.service;

import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Job;
import com.example.authlogin.service.ai.TaJobMatchAiConfig;
import com.example.authlogin.service.ai.TongyiXiaomiAnalysisClient;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * TaJobMatchAnalysisService 自动化测试。
 */
public class TaJobMatchAnalysisServiceTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        test("AI success path should return structured result", () -> {
            StubClient stubClient = StubClient.success(
                    new TongyiXiaomiAnalysisClient.AnalysisPayload(
                            92,
                            "HIGH",
                            "匹配度高，可重点展示课程相关经历。",
                            List.of("技能覆盖较全面"),
                            List.of("部分经历细节可补充"),
                            List.of("补充量化成果"),
                            List.of("岗位要求 Java 与 SQL"),
                            List.of("档案技能包含 Java、SQL")
                    )
            );
            TaJobMatchAnalysisService service = new TaJobMatchAnalysisService(stubClient);
            TaJobMatchAnalysisService.AnalysisResult result = service.analyze(sampleJob(), sampleApplicant());

            Map<String, Object> data = result.toResponseMap();
            assert Boolean.FALSE.equals(data.get("fallback")) : "AI success should not fallback";
            assert "HIGH".equals(data.get("matchLevel")) : "level should be HIGH";
            assert ((Integer) data.get("overallScore")) == 92 : "score should be 92";
            assert ((List<?>) data.get("strengths")).size() == 1 : "strengths should come from AI";
        });

        test("Prompt should include whitelist+cover letter and exclude sensitive fields", () -> {
            StubClient stubClient = StubClient.success(
                    new TongyiXiaomiAnalysisClient.AnalysisPayload(
                            80,
                            "MEDIUM",
                            "中等匹配",
                            List.of("a"),
                            List.of("b"),
                            List.of("c"),
                            List.of("d"),
                            List.of("e")
                    )
            );
            TaJobMatchAnalysisService service = new TaJobMatchAnalysisService(stubClient);
            Applicant applicant = sampleApplicant();
            applicant.setFullName("Secret Name");
            applicant.setStudentId("2026123456");
            applicant.setPhone("13800138000");
            applicant.setAddress("Secret Address");
            applicant.setResumePath("resume/secret.pdf");
            applicant.setPhotoPath("photo/secret.png");
            String coverLetter = "Please contact me via test.cover@example.com or 13800138000.";

            service.analyze(sampleJob(), applicant, coverLetter);
            String userPrompt = stubClient.getLastUserPrompt();

            assert userPrompt.contains("department") : "prompt should contain department";
            assert userPrompt.contains("program") : "prompt should contain program";
            assert userPrompt.contains("gpa") : "prompt should contain gpa";
            assert userPrompt.contains("experience") : "prompt should contain experience";
            assert userPrompt.contains("coverLetter") : "prompt should contain cover letter";
            assert userPrompt.contains("[已脱敏邮箱]") : "cover letter email should be redacted";
            assert userPrompt.contains("[已脱敏手机号]") : "cover letter phone should be redacted";
            assert !userPrompt.contains("Secret Name") : "prompt should not contain full name";
            assert !userPrompt.contains("2026123456") : "prompt should not contain student id";
            assert !userPrompt.contains("13800138000") : "prompt should not contain phone";
            assert !userPrompt.contains("Secret Address") : "prompt should not contain address";
            assert !userPrompt.contains("resume/secret.pdf") : "prompt should not contain resume path";
            assert !userPrompt.contains("photo/secret.png") : "prompt should not contain photo path";
            assert !userPrompt.contains("test.cover@example.com") : "raw cover letter email should not remain";
        });

        test("Fallback path should be stable when AI unavailable", () -> {
            StubClient stubClient = StubClient.failure("mock ai unavailable");
            TaJobMatchAnalysisService service = new TaJobMatchAnalysisService(stubClient);
            TaJobMatchAnalysisService.AnalysisResult result = service.analyze(sampleJob(), sampleApplicant());

            Map<String, Object> data = result.toResponseMap();
            assert Boolean.TRUE.equals(data.get("fallback")) : "fallback should be true";
            assert ((Integer) data.get("overallScore")) >= 0 : "fallback should include score";
            assert !String.valueOf(data.get("summary")).isEmpty() : "fallback should include summary";
            assert String.valueOf(data.get("fallbackReason")).contains("mock ai unavailable")
                    : "fallback reason should retain source";
        });

        test("Fallback should redact sensitive text in free-form profile fields", () -> {
            StubClient stubClient = StubClient.failure("down");
            TaJobMatchAnalysisService service = new TaJobMatchAnalysisService(stubClient);
            Applicant applicant = sampleApplicant();
            applicant.setExperience("Contact me at ta.user@example.com, phone 13800138000, student id 2026123456.");
            applicant.setMotivation("Email second@school.edu for details.");

            String coverLetter = "Alt contact: fallback.cover@school.edu, phone 13800138000, student id 2026555566.";

            TaJobMatchAnalysisService.AnalysisResult result = service.analyze(sampleJob(), applicant, coverLetter);
            Map<String, Object> data = result.toResponseMap();
            String merged = String.join(
                    " | ",
                    asStringList(data.get("strengths")),
                    asStringList(data.get("profileEvidence")),
                    String.valueOf(data.get("summary"))
            );

            assert merged.contains("[已脱敏邮箱]") : "email should be redacted";
            assert merged.contains("[已脱敏手机号]") : "phone should be redacted";
            assert merged.contains("[已脱敏学号]") : "student id should be redacted";
            assert !merged.contains("ta.user@example.com") : "raw email should not remain";
            assert !merged.contains("13800138000") : "raw phone should not remain";
            assert !merged.contains("2026123456") : "raw student id should not remain";
        });

        System.out.println("========================================");
        System.out.println("TaJobMatchAnalysisServiceTest Summary");
        System.out.println("========================================");
        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Total:  " + (passed + failed));
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static Job sampleJob() {
        Job job = new Job();
        job.setTitle("Database TA");
        job.setCourseCode("CS502");
        job.setCourseName("Advanced Database");
        job.setDescription("Need TA who can support SQL labs and grading.");
        job.setRequiredSkills(Arrays.asList("Java", "SQL", "Database"));
        job.setPositions(2);
        job.setWorkload("10h/week");
        return job;
    }

    private static Applicant sampleApplicant() {
        Applicant applicant = new Applicant();
        applicant.setDepartment("Computer Science");
        applicant.setProgram("Master");
        applicant.setGpa("3.8");
        applicant.setSkills(Arrays.asList("Java", "SQL", "Linux"));
        applicant.setExperience("TA for programming fundamentals.");
        applicant.setMotivation("I want to help students build strong database foundations.");
        return applicant;
    }

    private static String asStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (Object item : list) {
            if (builder.length() > 0) {
                builder.append(" | ");
            }
            builder.append(String.valueOf(item));
        }
        return builder.toString();
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

    private static final class StubClient extends TongyiXiaomiAnalysisClient {
        private final AnalysisAttempt fixedAttempt;
        private String lastUserPrompt = "";

        private StubClient(AnalysisAttempt fixedAttempt) {
            super(TaJobMatchAiConfig.load(null));
            this.fixedAttempt = fixedAttempt;
        }

        private static StubClient success(AnalysisPayload payload) {
            return new StubClient(AnalysisAttempt.success(payload));
        }

        private static StubClient failure(String reason) {
            return new StubClient(AnalysisAttempt.failure(reason));
        }

        @Override
        public AnalysisAttempt analyze(String systemPrompt, String userPrompt) {
            this.lastUserPrompt = userPrompt == null ? "" : userPrompt;
            return fixedAttempt;
        }

        private String getLastUserPrompt() {
            return lastUserPrompt;
        }
    }
}
