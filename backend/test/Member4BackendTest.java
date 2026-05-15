import com.example.tarecruitment.admin.model.AdminInvite;
import com.example.tarecruitment.application.dao.ApplicationDao;
import com.example.tarecruitment.application.model.Application;
import com.example.tarecruitment.application.validator.ApplicationValidator;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.util.SecurityTokenUtil;
import com.example.tarecruitment.notification.model.Notification;

import java.time.LocalDateTime;

public class Member4BackendTest {

    private static int passed;

    public static void main(String[] args) {
        testApplicationValidation();
        testApplicationCsvRoundTrip();
        testApplicationDaoTransitions();
        testNotificationCsvRoundTrip();
        testAdminInviteCsvAndExpiry();
        System.out.println("[member4] PASS total=" + passed);
    }

    private static void testApplicationValidation() {
        assertNull(ApplicationValidator.validateJobId("job-001"), "valid job id");
        assertEquals("Job ID is required", ApplicationValidator.validateJobId(" "), "blank job id");
        assertEquals("Cover letter contains unsupported characters",
                ApplicationValidator.validateCoverLetter("<img src=x onerror=alert(1)>"),
                "unsafe cover letter");
        assertNull(ApplicationValidator.validateTransitionAction(" ACCEPT "), "accept action");
        assertEquals("Invalid action. Use 'accept', 'reject', or 'withdraw'",
                ApplicationValidator.validateTransitionAction("approve"),
                "invalid transition action");
        pass("ApplicationValidator checks IDs, cover letters, and transition actions");
    }

    private static void testApplicationCsvRoundTrip() {
        Application application = new Application("job-4", "applicant-4", "Alice, TA", "alice@example.test");
        application.setApplicationId("application-004");
        application.setJobTitle("Software Engineering TA");
        application.setCourseCode("SE604");
        application.setMoId("mo-4");
        application.setMoName("MO Four");
        application.setCoverLetter("I can support labs, testing, and feedback.");

        Application parsed = Application.fromCsv(application.toCsv());
        assertNotNull(parsed, "parsed application");
        assertEquals("Alice, TA", parsed.getApplicantName(), "applicant name csv escaping");
        assertEquals(Application.Status.PENDING, parsed.getStatus(), "default status");
        assertEquals(Application.ProgressStage.UNDER_REVIEW, parsed.getProgressStage(), "default review stage");
        pass("Application CSV round-trip preserves applicant and progress fields");
    }

    private static void testApplicationDaoTransitions() {
        ApplicationDao dao = ApplicationDao.getInstance();
        dao.deleteAll();

        Application first = new Application("job-4", "applicant-4-a", "Alice", "alice@example.test");
        first.setCourseCode("SE604");
        dao.create(first);
        assertTrue(dao.hasApplied("job-4", "applicant-4-a"), "has applied");
        assertEquals(1L, dao.countPendingByJobId("job-4"), "pending count");
        assertTrue(dao.accept(first.getApplicationId()), "accept transition");

        Application accepted = dao.findById(first.getApplicationId()).get();
        assertEquals(Application.Status.ACCEPTED, accepted.getStatus(), "accepted status");
        assertEquals(Application.ProgressStage.COMPLETED, accepted.getProgressStage(), "accepted completed stage");
        assertEquals(1L, dao.countAcceptedByJobId("job-4"), "accepted count");

        Application second = new Application("job-4", "applicant-4-b", "Bob", "bob@example.test");
        dao.create(second);
        assertTrue(dao.withdraw(second.getApplicationId()), "withdraw transition");
        assertEquals(Application.Status.WITHDRAWN, dao.findById(second.getApplicationId()).get().getStatus(),
                "withdrawn status");
        pass("ApplicationDao stores applications and applies accept/withdraw status transitions");
    }

    private static void testNotificationCsvRoundTrip() {
        Notification notification = new Notification();
        notification.setNotificationId("notice-004");
        notification.setTitle("Interview update, week 4");
        notification.setContent("Please check your application status.");
        notification.setPublishedByUserId("admin-4");
        notification.setPublishedByUsername("admin_demo");

        Notification parsed = Notification.fromCsv(notification.toCsv());
        assertNotNull(parsed, "parsed notification");
        assertEquals("Interview update, week 4", parsed.getTitle(), "notification title csv escaping");
        assertEquals("admin_demo", parsed.getPublishedByUsername(), "publisher snapshot");
        pass("Notification CSV round-trip preserves published message fields");
    }

    private static void testAdminInviteCsvAndExpiry() {
        AdminInvite invite = new AdminInvite();
        invite.setInviteId("invite-004");
        invite.setEmail("admin4@example.test");
        invite.setTokenHash(SecurityTokenUtil.sha256Hex("token"));
        invite.setInviteCodeHash(SecurityTokenUtil.sha256Hex("ABCD2345"));
        invite.setRole(User.Role.ADMIN);
        invite.setCreatedByUserId("admin-owner");
        invite.setCreatedByUsername("admin_demo");
        invite.setCreatedAt(LocalDateTime.now().minusDays(2));
        invite.setExpiresAt(LocalDateTime.now().minusDays(1));

        assertTrue(invite.isExpired(LocalDateTime.now()), "expired invite");
        AdminInvite parsed = AdminInvite.fromCsv(invite.toCsv());
        assertNotNull(parsed, "parsed invite");
        assertEquals(AdminInvite.Status.PENDING, parsed.getStatus(), "default invite status");
        assertEquals(User.Role.ADMIN, parsed.getRole(), "invite role");
        pass("AdminInvite keeps CSV fields and expiry rule stable");
    }

    private static void pass(String message) {
        passed++;
        System.out.println("[member4] PASS - " + message);
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertNull(Object value, String message) {
        if (value != null) {
            throw new AssertionError(message + " expected null actual=" + value);
        }
    }

    private static void assertNotNull(Object value, String message) {
        assertTrue(value != null, message);
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(message + " expected=" + expected + " actual=" + actual);
        }
    }
}
