import com.example.tarecruitment.auth.dao.UserDao;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.service.ServiceResult;
import com.example.tarecruitment.common.util.SecurityTokenUtil;

public class Member1BackendTest {

    private static int passed;

    public static void main(String[] args) {
        testServiceResult();
        testSecurityTokenUtil();
        testUserCsvRoundTrip();
        testUserDaoDemoAccountsAndLogin();
        System.out.println("[member1] PASS total=" + passed);
    }

    private static void testServiceResult() {
        ServiceResult created = ServiceResult.created("created", "payload");
        assertEquals(201, created.getStatusCode(), "created status");
        assertTrue(created.isSuccess(), "created success flag");
        assertEquals("payload", created.getData(), "created data");

        ServiceResult forbidden = ServiceResult.forbidden("blocked");
        assertEquals(403, forbidden.getStatusCode(), "forbidden status");
        assertFalse(forbidden.isSuccess(), "forbidden success flag");
        pass("ServiceResult keeps service-layer status/message/data contract");
    }

    private static void testSecurityTokenUtil() {
        String code = SecurityTokenUtil.generateInviteCode();
        assertTrue(code.matches("[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}"), "invite code format");
        assertEquals(
                "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                SecurityTokenUtil.sha256Hex("abc"),
                "sha256 known value"
        );
        assertEquals("", SecurityTokenUtil.sha256Hex(null), "sha256 null fallback");
        pass("SecurityTokenUtil generates short codes and stable hashes");
    }

    private static void testUserCsvRoundTrip() {
        User user = new User("member1_user", "secret", "member1@example.test", User.Role.TA);
        user.setUserId("user-001");
        user.setDisplayName("Member One, TA");
        user.setRealName("Alice Zhang");
        user.setProfessionalTitle("Teaching Assistant");
        user.setAvatarPath("account-avatars/alice.png");

        User parsed = User.fromCsv(user.toCsv());
        assertNotNull(parsed, "parsed user");
        assertEquals("user-001", parsed.getUserId(), "user id");
        assertEquals("Member One, TA", parsed.getDisplayName(), "display name csv escaping");
        assertEquals("account-avatars/alice.png", parsed.getAvatarPath(), "avatar path");
        pass("User CSV round-trip preserves account profile fields");
    }

    private static void testUserDaoDemoAccountsAndLogin() {
        UserDao dao = UserDao.getInstance();
        dao.deleteAll();
        dao.ensureDefaultDemoAccounts();

        assertEquals(3L, dao.count(), "demo account count");
        assertTrue(dao.verifyLogin("ta_demo", "Pass1234").isPresent(), "demo login by username");
        assertTrue(dao.verifyLogin("mo_demo@local.test", "Pass1234").isPresent(), "demo login by email");

        User created = dao.create(new User("member1_extra", "Pass1234", "member1-extra@example.test", User.Role.TA));
        assertTrue(dao.findByUsername("MEMBER1_EXTRA").isPresent(), "case-insensitive username lookup");
        assertTrue(!"Pass1234".equals(created.getPassword()), "password is hashed before storage");
        assertThrows(IllegalArgumentException.class,
                () -> dao.create(new User("member1_extra", "Pass1234", "member1-dup@example.test", User.Role.TA)),
                "duplicate username rejected");
        pass("UserDao initializes demo accounts, verifies login, and rejects duplicates");
    }

    private static void pass(String message) {
        passed++;
        System.out.println("[member1] PASS - " + message);
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertFalse(boolean condition, String message) {
        assertTrue(!condition, message);
    }

    private static void assertNotNull(Object value, String message) {
        assertTrue(value != null, message);
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(message + " expected=" + expected + " actual=" + actual);
        }
    }

    private static void assertThrows(Class<? extends Throwable> expectedType, Runnable action, String message) {
        try {
            action.run();
        } catch (Throwable thrown) {
            if (expectedType.isInstance(thrown)) {
                return;
            }
            throw new AssertionError(message + " wrong exception=" + thrown);
        }
        throw new AssertionError(message + " expected exception=" + expectedType.getSimpleName());
    }
}
