package com.example.authlogin.integration;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.MissingSkillsService;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

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
            });

            test("End-to-end: MO accepts application", () -> {
                Application app = applicationDao.findAll().stream().findFirst().orElseThrow();
                boolean updated = applicationDao.accept(app.getApplicationId());
                assert updated : "accept operation should succeed";
                Application refreshed = applicationDao.findById(app.getApplicationId()).orElseThrow();
                assert refreshed.getStatus() == Application.Status.ACCEPTED : "application status should become ACCEPTED";
            });

            test("End-to-end: missing skills aggregation should only use applied applicants", () -> {
                User mo = userDao.findByUsername("e2e_mo").orElseThrow();
                User ta = userDao.findByUsername("e2e_ta").orElseThrow();

                User taExtra = userDao.create(new User("e2e_ta_extra", "Pass1234", "e2e_ta_extra@example.com", User.Role.TA));
                Applicant extraApplicant = new Applicant();
                extraApplicant.setUserId(taExtra.getUserId());
                extraApplicant.setFullName("Extra TA");
                extraApplicant.setStudentId("2023002003");
                extraApplicant.setDepartment("Computer Science");
                extraApplicant.setProgram("Master");
                extraApplicant.setSkills(Arrays.asList("Python"));
                applicantDao.create(extraApplicant);

                Job secondJob = new Job();
                secondJob.setMoId(mo.getUserId());
                secondJob.setMoName("Dr. E2E");
                secondJob.setTitle("Another TA Position");
                secondJob.setCourseCode("CS602");
                secondJob.setRequiredSkills(Arrays.asList("Python"));
                secondJob.setStatus(Job.Status.OPEN);
                jobDao.create(secondJob);

                Application secondApplication = new Application();
                secondApplication.setJobId(secondJob.getJobId());
                secondApplication.setApplicantId(taExtra.getUserId());
                secondApplication.setApplicantName(taExtra.getUsername());
                secondApplication.setApplicantEmail(taExtra.getEmail());
                secondApplication.setJobTitle(secondJob.getTitle());
                secondApplication.setCourseCode(secondJob.getCourseCode());
                secondApplication.setMoId(secondJob.getMoId());
                secondApplication.setMoName(secondJob.getMoName());
                applicationDao.create(secondApplication);

                Job firstJob = jobDao.findByCourseCode("CS601").stream().findFirst().orElseThrow();
                Applicant firstApplicant = applicantDao.findByUserId(ta.getUserId()).orElseThrow();

                List<Application> firstJobApplications = applicationDao.findByJobId(firstJob.getJobId());
                List<List<String>> appliedApplicantSkills = firstJobApplications.stream()
                        .map(application -> applicantDao.findByUserId(application.getApplicantId()).orElseThrow().getSkills())
                        .toList();

                MissingSkillsService missingSkillsService = new MissingSkillsService();
                Map<String, Integer> frequency = missingSkillsService.aggregateMissingSkillFrequency(
                        firstJob.getRequiredSkills(),
                        appliedApplicantSkills
                );

                assert !frequency.containsKey("python") : "python should not be included from applicants of other jobs";
                assert frequency.isEmpty() : "first job applicant already matches all required skills";

                Applicant lookedUpByUserId = applicantDao.findByUserId(firstJobApplications.get(0).getApplicantId()).orElseThrow();
                assert lookedUpByUserId.getApplicantId().equals(firstApplicant.getApplicantId())
                        : "application applicantId should be resolved via applicant userId";
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
