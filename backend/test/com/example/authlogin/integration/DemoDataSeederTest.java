package com.example.authlogin.integration;

import com.example.authlogin.bootstrap.DemoDataSeeder;
import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * DemoDataSeeder 手动回归测试
 */
public class DemoDataSeederTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) throws IOException {
        Path tempDir = Files.createTempDirectory("demo-data-seeder-test");
        System.setProperty("ta.hiring.data.dir", tempDir.toString());

        UserDao userDao = UserDao.getInstance();
        ApplicantDao applicantDao = ApplicantDao.getInstance();
        JobDao jobDao = JobDao.getInstance();
        ApplicationDao applicationDao = ApplicationDao.getInstance();
        DemoDataSeeder seeder = DemoDataSeeder.createDefault();

        try {
            DemoDataSeeder.SeedSummary firstRun = seeder.seed();
            DemoDataSeeder.SeedSummary secondRun = seeder.seed();

            test("First seed should create demo records", () -> {
                assert firstRun.getCreatedUsers() == 6 : "Expected 6 extra demo users";
                assert firstRun.getCreatedApplicants() == 5 : "Expected 5 applicant profiles";
                assert firstRun.getCreatedJobs() == 6 : "Expected 6 demo jobs";
                assert firstRun.getCreatedApplications() == 13 : "Expected 13 demo applications";
                assert firstRun.getCreatedResumes() == 5 : "Expected 5 demo resumes";
            });

            test("Second seed should be idempotent", () -> {
                assert secondRun.getCreatedUsers() == 0 : "Second run should not recreate users";
                assert secondRun.getCreatedApplicants() == 0 : "Second run should not recreate applicants";
                assert secondRun.getCreatedJobs() == 0 : "Second run should not recreate jobs";
                assert secondRun.getCreatedApplications() == 0 : "Second run should not recreate applications";
                assert secondRun.getCreatedResumes() == 0 : "Second run should not recreate resumes";
            });

            test("Seeded accounts and profiles should be queryable", () -> {
                User taDemo = userDao.findByUsername("ta_demo").orElseThrow();
                User moDemo = userDao.findByUsername("mo_demo").orElseThrow();
                User extraMo = userDao.findByUsername("mo_demo_alice").orElseThrow();
                assert userDao.findByUsername("admin_demo").isPresent() : "Admin demo account should exist";
                assert userDao.count() == 9 : "Should have 9 total demo users";
                assert applicantDao.findByUserId(taDemo.getUserId()).isPresent() : "ta_demo should have a seeded profile";
                assert jobDao.findByMoId(moDemo.getUserId()).size() >= 2 : "mo_demo should have demo jobs";
                assert jobDao.findByMoId(extraMo.getUserId()).size() >= 2 : "extra MO should have demo jobs";
            });

            test("Seeded applications should cover multiple statuses", () -> {
                User taDemo = userDao.findByUsername("ta_demo").orElseThrow();
                List<Application> taApplications = applicationDao.findByApplicantId(taDemo.getUserId());
                long acceptedCount = applicationDao.findAll().stream()
                        .filter(app -> app.getStatus() == Application.Status.ACCEPTED)
                        .count();
                long pendingCount = applicationDao.findAll().stream()
                        .filter(app -> app.getStatus() == Application.Status.PENDING)
                        .count();
                long rejectedCount = applicationDao.findAll().stream()
                        .filter(app -> app.getStatus() == Application.Status.REJECTED)
                        .count();
                long withdrawnCount = applicationDao.findAll().stream()
                        .filter(app -> app.getStatus() == Application.Status.WITHDRAWN)
                        .count();

                assert taApplications.size() == 3 : "ta_demo should have 3 seeded applications";
                assert acceptedCount >= 3 : "Should have accepted applications";
                assert pendingCount >= 3 : "Should have pending applications";
                assert rejectedCount >= 3 : "Should have rejected applications";
                assert withdrawnCount >= 2 : "Should have withdrawn applications";
            });

            test("Seeded jobs and resumes should exist on disk", () -> {
                long filledJobs = jobDao.findAll().stream()
                        .filter(job -> job.getStatus() == Job.Status.FILLED)
                        .count();
                long openJobs = jobDao.findAll().stream()
                        .filter(job -> job.getStatus() == Job.Status.OPEN)
                        .count();

                for (Applicant applicant : applicantDao.findAll()) {
                    assert applicant.getResumePath() != null && !applicant.getResumePath().isEmpty()
                            : "Each seeded applicant should have a resume path";
                    assert Files.exists(tempDir.resolve(applicant.getResumePath()))
                            : "Resume file should exist for " + applicant.getFullName();
                }

                assert filledJobs == 2 : "Should have 2 filled demo jobs";
                assert openJobs == 3 : "Should have 3 open demo jobs";
            });
        } finally {
            applicationDao.deleteAll();
            jobDao.deleteAll();
            applicantDao.deleteAll();
            userDao.deleteAll();
        }

        System.out.println("========================================");
        System.out.println("DemoDataSeederTest Summary");
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
