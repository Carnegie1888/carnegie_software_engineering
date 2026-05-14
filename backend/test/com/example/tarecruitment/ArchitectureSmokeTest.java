package com.example.tarecruitment;

import com.example.tarecruitment.ai.service.TaJobMatchAnalysisService;
import com.example.tarecruitment.admin.service.WorkloadStatsService;
import com.example.tarecruitment.application.dao.ApplicationDao;
import com.example.tarecruitment.application.model.Application;
import com.example.tarecruitment.auth.dao.UserDao;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.storage.CsvCodec;
import com.example.tarecruitment.common.web.JsonResponseUtil;
import com.example.tarecruitment.demo.DemoDataSeeder;
import com.example.tarecruitment.job.dao.JobDao;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.profile.dao.ApplicantDao;
import com.example.tarecruitment.profile.model.Applicant;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ArchitectureSmokeTest {

    private ArchitectureSmokeTest() {
    }

    public static void main(String[] args) {
        testCsvCodec();
        testModelRoundTrip();
        testDemoSeedDefaults();
        testRenamedDemoAccountIsNotRecreated();
        testApplicationFlowPersistence();
        testEffectiveJobStatus();
        testWorkloadUsesApplicantRealName();
        testAiUnavailableFallbackShape();
        testJsonResponseShape();
        System.out.println("ArchitectureSmokeTest passed");
    }

    private static void testCsvCodec() {
        String row = String.join(",",
                CsvCodec.escape("Java, JSP"),
                CsvCodec.escape("He said \"yes\""),
                CsvCodec.escape("plain")
        );
        String[] parts = CsvCodec.split(row);
        assertEquals("Java, JSP", CsvCodec.unescape(parts[0]), "CSV comma field");
        assertEquals("He said \"yes\"", CsvCodec.unescape(parts[1]), "CSV quote field");
        assertEquals("plain", CsvCodec.unescape(parts[2]), "CSV plain field");
    }

    private static void testModelRoundTrip() {
        User user = new User("roundtrip_ta", "Pass1234", "roundtrip@example.test", User.Role.TA);
        user.setUserId("user-roundtrip");
        user.setDisplayName("Roundtrip TA");
        User parsedUser = User.fromCsv(user.toCsv());
        assertEquals("roundtrip_ta", parsedUser.getUsername(), "User CSV username");
        assertEquals(User.Role.TA, parsedUser.getRole(), "User CSV role");

        Job job = buildJob("job-roundtrip", "mo-roundtrip");
        Job parsedJob = Job.fromCsv(job.toCsv());
        assertEquals("job-roundtrip", parsedJob.getJobId(), "Job CSV id");
        assertEquals("CS6001", parsedJob.getCourseCode(), "Job CSV course code");
        assertEquals("Java", parsedJob.getRequiredSkills().get(0), "Job CSV skills");
    }

    private static void testDemoSeedDefaults() {
        DemoDataSeeder.createDefault().seed();
        UserDao userDao = UserDao.getInstance();
        assertTrue(userDao.findByUsername("ta_demo").isPresent(), "Default TA account exists");
        assertTrue(userDao.findByUsername("mo_demo").isPresent(), "Default MO account exists");
        assertTrue(userDao.findByUsername("admin_demo").isPresent(), "Default admin account exists");
    }

    private static void testRenamedDemoAccountIsNotRecreated() {
        UserDao userDao = UserDao.getInstance();
        assertRenamedDemoAccountIsNotRecreated(userDao, "ta_demo", "renamed_ta_demo", "ta_demo@local.test");
        assertRenamedDemoAccountIsNotRecreated(userDao, "mo_demo", "renamed_mo_demo", "mo_demo@local.test");
    }

    private static void assertRenamedDemoAccountIsNotRecreated(UserDao userDao,
                                                               String oldUsername,
                                                               String newUsername,
                                                               String demoEmail) {
        User demoUser = userDao.findByUsername(oldUsername).orElseThrow();
        demoUser.setUsername(newUsername);
        demoUser.setDisplayName(newUsername);
        userDao.update(demoUser);
        userDao.ensureDefaultDemoAccounts();

        assertTrue(userDao.findByUsername(newUsername).isPresent(), "Renamed demo account remains available");
        assertTrue(userDao.findByUsername(oldUsername).isEmpty(), "Old demo username is not recreated after rename");
        assertEquals(demoUser.getUserId(), userDao.findByEmail(demoEmail).orElseThrow().getUserId(),
                "Renamed demo account keeps the original demo email");
    }

    private static void testApplicationFlowPersistence() {
        Applicant applicant = new Applicant("flow-ta", "Flow TA", "202600001");
        applicant.setDepartment("Computer Science");
        applicant.setProgram("MSc");
        applicant.setGpa("3.80 / 4.00");
        applicant.setSkills(List.of("Java", "Testing"));
        ApplicantDao.getInstance().save(applicant);

        Job job = buildJob("flow-job", "flow-mo");
        JobDao.getInstance().save(job);

        Application application = new Application(job.getJobId(), applicant.getUserId(), applicant.getFullName(), "flow@example.test");
        application.setApplicationId("flow-application");
        application.setJobTitle(job.getTitle());
        application.setCourseCode(job.getCourseCode());
        application.setMoId(job.getMoId());
        application.setMoName(job.getMoName());
        application.setCoverLetter("I have supported Java labs and testing workshops.");
        ApplicationDao.getInstance().save(application);

        Application loaded = ApplicationDao.getInstance().findById("flow-application").orElseThrow();
        assertEquals(Application.Status.PENDING, loaded.getStatus(), "Application starts pending");
        loaded.setStatus(Application.Status.ACCEPTED);
        ApplicationDao.getInstance().update(loaded);
        Application accepted = ApplicationDao.getInstance().findById("flow-application").orElseThrow();
        assertEquals(Application.Status.ACCEPTED, accepted.getStatus(), "Application update persists");
    }

    private static void testEffectiveJobStatus() {
        Job openJob = buildJob("status-open", "status-mo");
        openJob.setDeadline(LocalDateTime.now().plusDays(1));
        assertEquals(Job.Status.OPEN, openJob.getEffectiveStatus(), "Future deadline stays open");

        Job expiredJob = buildJob("status-expired", "status-mo");
        expiredJob.setDeadline(LocalDateTime.now().minusDays(1));
        assertEquals(Job.Status.CLOSED, expiredJob.getEffectiveStatus(), "Expired open job is closed");

        Job filledJob = buildJob("status-filled", "status-mo");
        filledJob.setStatus(Job.Status.FILLED);
        filledJob.setDeadline(LocalDateTime.now().minusDays(1));
        assertEquals(Job.Status.FILLED, filledJob.getEffectiveStatus(), "Filled status is preserved");
    }

    private static void testWorkloadUsesApplicantRealName() {
        User user = new User("workload_ta", "Pass1234", "workload-ta@example.test", User.Role.TA);
        user.setUserId("workload-ta-user");
        Job job = buildJob("workload-real-name-job", "workload-mo");
        job.setWorkStartDate(LocalDate.now());
        job.setWorkEndDate(LocalDate.now().plusWeeks(2));

        Application application = new Application(job.getJobId(), user.getUserId(), user.getUsername(), user.getEmail());
        application.setStatus(Application.Status.ACCEPTED);
        application.setJobTitle(job.getTitle());
        application.setCourseCode(job.getCourseCode());

        WorkloadStatsService.WorkloadReport report = new WorkloadStatsService().calculateTaWorkloadReport(
                List.of(application),
                Map.of(job.getJobId(), job),
                Map.of(user.getUserId(), user),
                Map.of(user.getUserId(), "Noah Patel"),
                null,
                null
        );

        assertEquals("Noah Patel", report.getTaWorkloads().get(0).getTaName(), "Workload card uses applicant real name");
    }

    private static void testAiUnavailableFallbackShape() {
        Job job = buildJob("ai-job", "ai-mo");
        Applicant applicant = new Applicant("ai-ta", "AI TA", "202600002");
        applicant.setDepartment("Computer Science");
        applicant.setProgram("MSc");
        applicant.setGpa("3.90 / 4.00");
        applicant.setSkills(List.of("Java", "Git", "Teaching"));
        applicant.setExperience("Supported Java labs and Git reviews.");
        TaJobMatchAnalysisService.AnalysisResult result = new TaJobMatchAnalysisService(null)
                .analyze(job, applicant, "I can support labs and code review.");
        Map<String, Object> response = result.toResponseMap();
        assertEquals(Boolean.TRUE, response.get("fallback"), "AI unavailable uses fallback");
        assertTrue(response.containsKey("overallScore"), "Fallback includes score");
        assertTrue(response.containsKey("summary"), "Fallback includes summary");
    }

    private static void testJsonResponseShape() {
        String json = JsonResponseUtil.toJsonValue(JsonResponseUtil.objectMap(
                "success", true,
                "message", "ok",
                "items", List.of("one", "two")
        ));
        assertTrue(json.contains("\"success\":true"), "JSON boolean field");
        assertTrue(json.contains("\"items\":[\"one\",\"two\"]"), "JSON array field");
    }

    private static Job buildJob(String jobId, String moId) {
        Job job = new Job(moId, "Module Owner", "Teaching Assistant - Software Engineering", "CS6001");
        job.setJobId(jobId);
        job.setCourseName("Software Engineering");
        job.setDescription("Support labs, grading, and code review.");
        job.setRequiredSkills(List.of("Java", "Git", "Testing"));
        job.setPositions(2);
        job.setWeeklyHours(8.0);
        job.setSalary("28 SGD / hour");
        job.setDeadline(LocalDateTime.now().plusDays(14));
        job.setStatus(Job.Status.OPEN);
        return job;
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(message + ": expected <" + expected + "> but was <" + actual + ">");
        }
    }
}
