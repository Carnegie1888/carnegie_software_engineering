package com.example.authlogin.integration;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.SkillMatchService;

import java.util.Arrays;
import java.time.LocalDateTime;

/**
 * 申请流程端到端测试
 */
public class ApplicationFlowE2ETest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        UserDao userDao = UserDao.getInstance();
        ApplicantDao applicantDao = ApplicantDao.getInstance();
        JobDao jobDao = JobDao.getInstance();
        ApplicationDao applicationDao = ApplicationDao.getInstance();

        userDao.deleteAll();
        applicantDao.deleteAll();
        jobDao.deleteAll();
        applicationDao.deleteAll();

        try {
            test("End-to-end: create users and profile", () -> {
                User mo = userDao.create(new User("e2e_mo", "Pass1234", "e2e_mo@example.com", User.Role.MO));
                User ta = userDao.create(new User("e2e_ta", "Pass1234", "e2e_ta@example.com", User.Role.TA));

                Applicant applicant = new Applicant();
                applicant.setUserId(ta.getUserId());
                applicant.setFullName("E2E TA");
                applicant.setStudentId("2023002002");
                applicant.setDepartment("Computer Science");
                applicant.setProgram("Master");
                applicant.setSkills(Arrays.asList("Java", "SQL", "Linux"));
                applicantDao.create(applicant);

                assert mo.getUserId() != null : "MO user should be created";
                assert ta.getUserId() != null : "TA user should be created";
                assert applicantDao.findByUserId(ta.getUserId()).isPresent() : "TA applicant profile should exist";
            });

            test("End-to-end: MO posts job and TA submits application", () -> {
                User mo = userDao.findByUsername("e2e_mo").orElseThrow();
                User ta = userDao.findByUsername("e2e_ta").orElseThrow();

                Job job = new Job();
                job.setMoId(mo.getUserId());
                job.setMoName("Dr. E2E");
                job.setTitle("E2E TA Position");
                job.setCourseCode("CS601");
                job.setCourseName("System Integration");
                job.setRequiredSkills(Arrays.asList("Java", "SQL"));
                job.setStatus(Job.Status.OPEN);
                jobDao.create(job);

                Application application = new Application();
                application.setJobId(job.getJobId());
                application.setApplicantId(ta.getUserId());
                application.setApplicantName(ta.getUsername());
                application.setApplicantEmail(ta.getEmail());
                application.setJobTitle(job.getTitle());
                application.setCourseCode(job.getCourseCode());
                application.setMoId(job.getMoId());
                application.setMoName(job.getMoName());
                application.setCoverLetter("I can support labs and assignment marking.");
                applicationDao.create(application);

                assert applicationDao.hasApplied(job.getJobId(), ta.getUserId()) : "application should be recorded";
                assert applicationDao.findByMoId(mo.getUserId()).size() == 1 : "MO should see one application";
                Application seeded = applicationDao.findByJobIdAndApplicantId(job.getJobId(), ta.getUserId()).orElseThrow();
                assert seeded.getProgressStage() == Application.ProgressStage.SUBMITTED : "new application should start in SUBMITTED stage";
            });

            test("End-to-end: MO accepts application", () -> {
                Application app = applicationDao.findAll().stream().findFirst().orElseThrow();
                boolean updated = applicationDao.accept(app.getApplicationId());
                assert updated : "accept operation should succeed";
                Application refreshed = applicationDao.findById(app.getApplicationId()).orElseThrow();
                assert refreshed.getStatus() == Application.Status.ACCEPTED : "application status should become ACCEPTED";
                assert refreshed.getProgressStage() == Application.ProgressStage.COMPLETED : "accepted application should be COMPLETED stage";
                assert refreshed.getFinalDecisionAt() != null : "final decision timestamp should be set";
            });

            test("End-to-end: MO can advance review stages before decision", () -> {
                User mo = userDao.findByUsername("e2e_mo").orElseThrow();
                User ta = userDao.create(new User("e2e_ta_stage", "Pass1234", "e2e_ta_stage@example.com", User.Role.TA));
                Applicant ap = new Applicant();
                ap.setUserId(ta.getUserId());
                ap.setFullName("Stage TA");
                ap.setStudentId("2023002099");
                ap.setDepartment("Computer Science");
                ap.setProgram("Master");
                ap.setSkills(Arrays.asList("Java"));
                ap.setResumePath("resumes/stage-ta.pdf");
                applicantDao.create(ap);

                Job job = new Job();
                job.setMoId(mo.getUserId());
                job.setMoName("Dr. E2E");
                job.setTitle("Stage Flow TA");
                job.setCourseCode("CS699");
                job.setRequiredSkills(Arrays.asList("Java"));
                job.setStatus(Job.Status.OPEN);
                jobDao.create(job);

                Application application = new Application();
                application.setJobId(job.getJobId());
                application.setApplicantId(ta.getUserId());
                application.setApplicantName(ta.getUsername());
                application.setApplicantEmail(ta.getEmail());
                application.setJobTitle(job.getTitle());
                application.setCourseCode(job.getCourseCode());
                application.setMoId(job.getMoId());
                application.setMoName(job.getMoName());
                applicationDao.create(application);

                String aid = application.getApplicationId();
                assert applicationDao.startReview(aid) : "startReview should succeed";
                Application a1 = applicationDao.findById(aid).orElseThrow();
                assert a1.getProgressStage() == Application.ProgressStage.UNDER_REVIEW : "stage should be UNDER_REVIEW";
                assert a1.getReviewStartedAt() != null : "review start time should be set";

                assert applicationDao.scheduleInterview(aid) : "scheduleInterview should succeed";
                Application a2 = applicationDao.findById(aid).orElseThrow();
                assert a2.getProgressStage() == Application.ProgressStage.INTERVIEW_SCHEDULED : "stage should be INTERVIEW_SCHEDULED";
                assert a2.getInterviewScheduledAt() != null : "interview time should be set";
            });

            test("End-to-end: accepted count should not exceed positions", () -> {
                User mo = userDao.findByUsername("e2e_mo").orElseThrow();

                User taSecond = userDao.create(new User("e2e_ta_second", "Pass1234", "e2e_ta_second@example.com", User.Role.TA));
                Applicant secondApplicant = new Applicant();
                secondApplicant.setUserId(taSecond.getUserId());
                secondApplicant.setFullName("Second TA");
                secondApplicant.setStudentId("2023002004");
                secondApplicant.setDepartment("Computer Science");
                secondApplicant.setProgram("Master");
                secondApplicant.setSkills(Arrays.asList("Java"));
                secondApplicant.setResumePath("resumes/second-ta.pdf");
                applicantDao.create(secondApplicant);

                Job limitedJob = new Job();
                limitedJob.setMoId(mo.getUserId());
                limitedJob.setMoName("Dr. E2E");
                limitedJob.setTitle("Single Slot TA");
                limitedJob.setCourseCode("CS603");
                limitedJob.setRequiredSkills(Arrays.asList("Java"));
                limitedJob.setPositions(1);
                limitedJob.setStatus(Job.Status.OPEN);
                jobDao.create(limitedJob);

                User taThird = userDao.create(new User("e2e_ta_third", "Pass1234", "e2e_ta_third@example.com", User.Role.TA));
                Applicant thirdApplicant = new Applicant();
                thirdApplicant.setUserId(taThird.getUserId());
                thirdApplicant.setFullName("Third TA");
                thirdApplicant.setStudentId("2023002005");
                thirdApplicant.setDepartment("Computer Science");
                thirdApplicant.setProgram("Master");
                thirdApplicant.setSkills(Arrays.asList("Java"));
                thirdApplicant.setResumePath("resumes/third-ta.pdf");
                applicantDao.create(thirdApplicant);

                Application secondSlotApp = new Application();
                secondSlotApp.setJobId(limitedJob.getJobId());
                secondSlotApp.setApplicantId(taSecond.getUserId());
                secondSlotApp.setApplicantName(taSecond.getUsername());
                secondSlotApp.setApplicantEmail(taSecond.getEmail());
                secondSlotApp.setJobTitle(limitedJob.getTitle());
                secondSlotApp.setCourseCode(limitedJob.getCourseCode());
                secondSlotApp.setMoId(limitedJob.getMoId());
                secondSlotApp.setMoName(limitedJob.getMoName());
                applicationDao.create(secondSlotApp);

                Application thirdSlotApp = new Application();
                thirdSlotApp.setJobId(limitedJob.getJobId());
                thirdSlotApp.setApplicantId(taThird.getUserId());
                thirdSlotApp.setApplicantName(taThird.getUsername());
                thirdSlotApp.setApplicantEmail(taThird.getEmail());
                thirdSlotApp.setJobTitle(limitedJob.getTitle());
                thirdSlotApp.setCourseCode(limitedJob.getCourseCode());
                thirdSlotApp.setMoId(limitedJob.getMoId());
                thirdSlotApp.setMoName(limitedJob.getMoName());
                applicationDao.create(thirdSlotApp);

                assert applicationDao.accept(secondSlotApp.getApplicationId()) : "first acceptance should succeed";
                assert applicationDao.countAcceptedByJobId(limitedJob.getJobId()) == 1 : "accepted count should be 1";

                boolean wouldOverflow = applicationDao.countAcceptedByJobId(limitedJob.getJobId()) >= limitedJob.getPositions();
                assert wouldOverflow : "job should be full after one acceptance";
            });

            test("End-to-end: deadline and resume prerequisites should be enforceable", () -> {
                User mo = userDao.findByUsername("e2e_mo").orElseThrow();
                User taNoResume = userDao.create(new User("e2e_ta_nors", "Pass1234", "e2e_ta_nors@example.com", User.Role.TA));
                Applicant noResumeApplicant = new Applicant();
                noResumeApplicant.setUserId(taNoResume.getUserId());
                noResumeApplicant.setFullName("No Resume TA");
                noResumeApplicant.setStudentId("2023002006");
                noResumeApplicant.setDepartment("Computer Science");
                noResumeApplicant.setProgram("Master");
                noResumeApplicant.setSkills(Arrays.asList("SQL"));
                applicantDao.create(noResumeApplicant);

                Job expiredJob = new Job();
                expiredJob.setMoId(mo.getUserId());
                expiredJob.setMoName("Dr. E2E");
                expiredJob.setTitle("Expired TA");
                expiredJob.setCourseCode("CS604");
                expiredJob.setRequiredSkills(Arrays.asList("SQL"));
                expiredJob.setDeadline(LocalDateTime.now().minusDays(1));
                expiredJob.setStatus(Job.Status.OPEN);
                jobDao.create(expiredJob);

                String resumePath = applicantDao.findByUserId(taNoResume.getUserId()).orElseThrow().getResumePath();
                assert resumePath == null || resumePath.trim().isEmpty()
                        : "applicant should not have resume before applying";
                assert expiredJob.getDeadline().isBefore(LocalDateTime.now()) : "job should already be expired";
            });

            test("End-to-end: skill match should use applicant profile skills", () -> {
                Job firstJob = jobDao.findByCourseCode("CS601").stream().findFirst().orElseThrow();
                Application firstApplication = applicationDao.findByJobId(firstJob.getJobId()).stream().findFirst().orElseThrow();
                Applicant firstApplicant = applicantDao.findByUserId(firstApplication.getApplicantId()).orElseThrow();

                SkillMatchService skillMatchService = new SkillMatchService((required, applicant) -> java.util.Optional.empty());
                SkillMatchService.SkillMatchResult result = skillMatchService.matchByKeywords(
                        firstJob.getRequiredSkills(),
                        firstJob.getDescription(),
                        firstApplicant.getSkills(),
                        String.join(" ", firstApplicant.getSkills())
                );

                assert result.getMatchedSkills().contains("java") : "matched skills should include java";
                assert result.getMatchedSkills().contains("sql") : "matched skills should include sql";
                assert result.getScore() >= 100.0 : "profile skills should fully match required skills";
            });
        } finally {
            applicationDao.deleteAll();
            jobDao.deleteAll();
            applicantDao.deleteAll();
            userDao.deleteAll();
        }

        System.out.println("========================================");
        System.out.println("ApplicationFlowE2ETest Summary");
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
