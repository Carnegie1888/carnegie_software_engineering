import com.example.tarecruitment.ai.client.MatchAnalysisAiConfig;
import com.example.tarecruitment.job.dao.JobDao;
import com.example.tarecruitment.job.mapper.JobRequestMapper;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.job.validator.JobValidator;
import com.example.tarecruitment.profile.validator.AccountProfileValidator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Member3BackendTest {

    private static int passed;

    public static void main(String[] args) {
        testJobValidationRules();
        testJobEffectiveStatus();
        testJobDaoSearchAndStatus();
        testAccountProfileValidation();
        testMatchAnalysisConfigFallbacks();
        System.out.println("[member3] PASS total=" + passed);
    }

    private static void testJobValidationRules() {
        LocalDateTime deadline = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        LocalDate start = deadline.toLocalDate().plusDays(1);
        LocalDate end = start.plusWeeks(8);
        String deadlineText = deadline.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));

        String validError = JobValidator.validateCreate(
                "Teaching Assistant",
                "SE601",
                "Software Engineering",
                "Support tutorials and labs",
                "Java, Testing, CSV",
                "3",
                "8.5",
                start.toString(),
                end.toString(),
                "20 GBP/hour",
                deadlineText
        );
        assertNull(validError, "valid job payload");
        assertEquals("Please use English commas or Chinese commas to separate skills",
                JobValidator.validateSkills("Java;Testing", true),
                "skill separator validation");
        assertEquals("Duplicate skills found. Please keep each skill only once",
                JobValidator.validateSkills("Java, java", true),
                "duplicate skill validation");
        assertEquals("Job title contains unsupported characters",
                JobValidator.validateTitle("<script>alert(1)</script>", true),
                "dangerous title validation");
        assertEquals(8.5, JobRequestMapper.parseWeeklyHours("8.5"), "weekly hours parser");
        pass("JobValidator accepts valid jobs and rejects unsafe or ambiguous fields");
    }

    private static void testJobEffectiveStatus() {
        Job job = new Job("mo-3", "MO Three", "Tutor", "SE602");
        job.setStatus(Job.Status.OPEN);
        job.setDeadline(LocalDateTime.now().minusDays(1));
        assertEquals(Job.Status.CLOSED, job.getEffectiveStatus(LocalDateTime.now()), "past deadline closes job");

        job.setStatus(Job.Status.FILLED);
        assertEquals(Job.Status.FILLED, job.getEffectiveStatus(LocalDateTime.now()), "filled status is preserved");
        pass("Job effective status handles deadlines and final states");
    }

    private static void testJobDaoSearchAndStatus() {
        JobDao dao = JobDao.getInstance();
        dao.deleteAll();

        Job job = new Job("mo-3", "MO Three", "Software Engineering TA", "SE603");
        job.setCourseName("Software Engineering");
        job.setDescription("Support architecture and testing labs");
        job.setRequiredSkillsFromString("Java, Testing");
        job.setPositions(2);
        job.setWeeklyHours(6.0);
        job.setWorkStartDate(LocalDate.now().plusDays(3));
        job.setWorkEndDate(LocalDate.now().plusWeeks(8));
        job.setSalary("20 GBP/hour");
        job.setDeadline(LocalDateTime.now().plusDays(2));
        dao.create(job);

        assertEquals(1L, dao.countOpenJobs(), "open job count");
        assertEquals(1, dao.search("architecture").size(), "fuzzy search finds description");
        assertTrue(dao.updateStatus(job.getJobId(), Job.Status.CLOSED), "status update returns true");
        assertEquals(Job.Status.CLOSED, dao.findById(job.getJobId()).get().getStatus(), "stored status updated");
        pass("JobDao stores jobs, searches fields, and updates status");
    }

    private static void testAccountProfileValidation() {
        assertNull(AccountProfileValidator.validateUsernameFormat("member_3"), "valid username");
        assertEquals("Username cannot end with an underscore",
                AccountProfileValidator.validateUsernameFormat("member3_"),
                "username trailing underscore");
        assertEquals("Full name is required.",
                AccountProfileValidator.validateTaSharedRealName(" ", true),
                "TA profile real name required");
        assertEquals("resume_file", AccountProfileValidator.sanitizeBaseName("../resume file.pdf", "fallback"),
                "safe file base name");
        pass("AccountProfileValidator protects account names and uploaded file names");
    }

    private static void testMatchAnalysisConfigFallbacks() {
        String oldKey = System.getProperty("dashscope.api.key");
        String oldBaseUrl = System.getProperty("ta.job.match.ai.base-url");
        String oldModel = System.getProperty("ta.job.match.ai.model");
        String oldTimeout = System.getProperty("ta.job.match.ai.timeout-ms");
        try {
            System.setProperty("dashscope.api.key", "placeholder-key");
            System.setProperty("ta.job.match.ai.base-url", "https://dashscope.example.test///");
            System.setProperty("ta.job.match.ai.model", "analysis-test-model");
            System.setProperty("ta.job.match.ai.timeout-ms", "0");

            MatchAnalysisAiConfig config = MatchAnalysisAiConfig.load(null);
            assertFalse(config.isApiKeyConfigured(), "placeholder key is not configured");
            assertEquals("https://dashscope.example.test", config.getBaseUrl(), "base url normalization");
            assertEquals("analysis-test-model", config.getModel(), "model property");
            assertEquals(6000L, config.getTimeoutMillis(), "invalid timeout fallback");
            pass("MatchAnalysisAiConfig handles missing real AI credentials safely");
        } finally {
            restoreProperty("dashscope.api.key", oldKey);
            restoreProperty("ta.job.match.ai.base-url", oldBaseUrl);
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

    private static void pass(String message) {
        passed++;
        System.out.println("[member3] PASS - " + message);
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertFalse(boolean condition, String message) {
        assertTrue(!condition, message);
    }

    private static void assertNull(Object value, String message) {
        if (value != null) {
            throw new AssertionError(message + " expected null actual=" + value);
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(message + " expected=" + expected + " actual=" + actual);
        }
    }
}
