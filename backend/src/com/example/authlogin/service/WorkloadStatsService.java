package com.example.authlogin.service;

import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WorkloadStatsService - 管理员 TA 录用工作量统计服务。
 *
 * 统计口径：
 * - 只统计 ACCEPTED 申请；
 * - 申请人必须是 TA 用户；
 * - 职位必须包含 weeklyHours、workStartDate、workEndDate；
 * - 日期筛选按职位工作期与筛选区间的交集计算。
 */
public class WorkloadStatsService {

    private static final double MIN_WEEKLY_HOURS = 0.5;
    private static final double MAX_WEEKLY_HOURS = 40.0;

    public static class WorkloadReport {
        private final List<TaWorkloadStats> taWorkloads;
        private final List<InvalidJob> invalidJobs;
        private final int totalTaCount;
        private final int totalAcceptedJobs;
        private final int totalWorkWeeks;
        private final double totalWorkHours;

        public WorkloadReport(List<TaWorkloadStats> taWorkloads, List<InvalidJob> invalidJobs) {
            this.taWorkloads = Collections.unmodifiableList(new ArrayList<>(taWorkloads));
            this.invalidJobs = Collections.unmodifiableList(new ArrayList<>(invalidJobs));
            int acceptedJobs = 0;
            int workWeeks = 0;
            double workHours = 0.0;
            for (TaWorkloadStats stats : taWorkloads) {
                acceptedJobs += stats.getAcceptedJobCount();
                workWeeks += stats.getTotalWorkWeeks();
                workHours += stats.getTotalWorkHours();
            }
            this.totalTaCount = taWorkloads.size();
            this.totalAcceptedJobs = acceptedJobs;
            this.totalWorkWeeks = workWeeks;
            this.totalWorkHours = workHours;
        }

        public List<TaWorkloadStats> getTaWorkloads() {
            return taWorkloads;
        }

        public List<InvalidJob> getInvalidJobs() {
            return invalidJobs;
        }

        public int getTotalTaCount() {
            return totalTaCount;
        }

        public int getTotalAcceptedJobs() {
            return totalAcceptedJobs;
        }

        public int getTotalWorkWeeks() {
            return totalWorkWeeks;
        }

        public double getTotalWorkHours() {
            return totalWorkHours;
        }
    }

    public static class TaWorkloadStats {
        private final String taId;
        private final String taName;
        private final List<TaJobWorkload> jobs = new ArrayList<>();
        private int totalWorkWeeks;
        private double totalWorkHours;

        public TaWorkloadStats(String taId, String taName) {
            this.taId = taId;
            this.taName = taName;
        }

        private void addJob(TaJobWorkload job) {
            jobs.add(job);
            totalWorkWeeks += job.getCountedWeeks();
            totalWorkHours += job.getCountedHours();
        }

        public String getTaId() {
            return taId;
        }

        public String getTaName() {
            return taName;
        }

        public int getAcceptedJobCount() {
            return jobs.size();
        }

        public int getTotalWorkWeeks() {
            return totalWorkWeeks;
        }

        public double getTotalWorkHours() {
            return totalWorkHours;
        }

        public List<TaJobWorkload> getJobs() {
            return Collections.unmodifiableList(jobs);
        }
    }

    public static class TaJobWorkload {
        private final String jobId;
        private final String jobTitle;
        private final String courseCode;
        private final double weeklyHours;
        private final LocalDate workStartDate;
        private final LocalDate workEndDate;
        private final int countedWeeks;
        private final double countedHours;

        public TaJobWorkload(String jobId,
                             String jobTitle,
                             String courseCode,
                             double weeklyHours,
                             LocalDate workStartDate,
                             LocalDate workEndDate,
                             int countedWeeks) {
            this.jobId = jobId;
            this.jobTitle = jobTitle;
            this.courseCode = courseCode;
            this.weeklyHours = weeklyHours;
            this.workStartDate = workStartDate;
            this.workEndDate = workEndDate;
            this.countedWeeks = countedWeeks;
            this.countedHours = weeklyHours * countedWeeks;
        }

        public String getJobId() {
            return jobId;
        }

        public String getJobTitle() {
            return jobTitle;
        }

        public String getCourseCode() {
            return courseCode;
        }

        public double getWeeklyHours() {
            return weeklyHours;
        }

        public LocalDate getWorkStartDate() {
            return workStartDate;
        }

        public LocalDate getWorkEndDate() {
            return workEndDate;
        }

        public int getCountedWeeks() {
            return countedWeeks;
        }

        public double getCountedHours() {
            return countedHours;
        }
    }

    public static class InvalidJob {
        private final String applicationId;
        private final String applicantId;
        private final String applicantName;
        private final String jobId;
        private final String jobTitle;
        private final String reason;

        public InvalidJob(String applicationId,
                          String applicantId,
                          String applicantName,
                          String jobId,
                          String jobTitle,
                          String reason) {
            this.applicationId = applicationId;
            this.applicantId = applicantId;
            this.applicantName = applicantName;
            this.jobId = jobId;
            this.jobTitle = jobTitle;
            this.reason = reason;
        }

        public String getApplicationId() {
            return applicationId;
        }

        public String getApplicantId() {
            return applicantId;
        }

        public String getApplicantName() {
            return applicantName;
        }

        public String getJobId() {
            return jobId;
        }

        public String getJobTitle() {
            return jobTitle;
        }

        public String getReason() {
            return reason;
        }
    }

    public WorkloadReport calculateTaWorkloadReport(List<Application> applications,
                                                    Map<String, Job> jobsById,
                                                    Map<String, User> usersById,
                                                    LocalDateTime rangeStart,
                                                    LocalDateTime rangeEnd) {
        List<Application> safeApplications = applications != null ? applications : Collections.emptyList();
        Map<String, Job> safeJobsById = jobsById != null ? jobsById : Collections.emptyMap();
        Map<String, User> safeUsersById = usersById != null ? usersById : Collections.emptyMap();

        Map<String, TaWorkloadStats> grouped = new LinkedHashMap<>();
        List<InvalidJob> invalidJobs = new ArrayList<>();

        for (Application application : safeApplications) {
            if (application == null || application.getStatus() != Application.Status.ACCEPTED) {
                continue;
            }

            User applicant = safeUsersById.get(application.getApplicantId());
            if (applicant == null || applicant.getRole() != User.Role.TA) {
                continue;
            }

            Job job = safeJobsById.get(application.getJobId());
            String invalidReason = validateJobForWorkload(job);
            if (invalidReason != null) {
                invalidJobs.add(new InvalidJob(
                        safeText(application.getApplicationId(), ""),
                        safeText(application.getApplicantId(), ""),
                        safeText(application.getApplicantName(), safeText(applicant.getUsername(), "Unknown TA")),
                        safeText(application.getJobId(), ""),
                        job != null ? safeText(job.getTitle(), safeText(application.getJobTitle(), "Untitled job")) : safeText(application.getJobTitle(), "Missing job"),
                        invalidReason
                ));
                continue;
            }

            int countedWeeks = calculateCountedWeeks(job.getWorkStartDate(), job.getWorkEndDate(), rangeStart, rangeEnd);
            if (countedWeeks <= 0) {
                continue;
            }

            String taName = safeText(application.getApplicantName(), safeText(applicant.getUsername(), "Unknown TA"));
            TaWorkloadStats stats = grouped.computeIfAbsent(
                    applicant.getUserId(),
                    ignored -> new TaWorkloadStats(applicant.getUserId(), taName)
            );
            stats.addJob(new TaJobWorkload(
                    job.getJobId(),
                    safeText(job.getTitle(), safeText(application.getJobTitle(), "Untitled job")),
                    safeText(job.getCourseCode(), safeText(application.getCourseCode(), "")),
                    job.getWeeklyHours(),
                    job.getWorkStartDate(),
                    job.getWorkEndDate(),
                    countedWeeks
            ));
        }

        List<TaWorkloadStats> stats = new ArrayList<>(grouped.values());
        for (TaWorkloadStats taStats : stats) {
            taStats.jobs.sort(Comparator
                    .comparingDouble(TaJobWorkload::getCountedHours)
                    .reversed()
                    .thenComparing(TaJobWorkload::getJobTitle, String.CASE_INSENSITIVE_ORDER));
        }
        stats.sort(Comparator
                .comparingDouble(TaWorkloadStats::getTotalWorkHours)
                .reversed()
                .thenComparing(TaWorkloadStats::getTaName, String.CASE_INSENSITIVE_ORDER));

        return new WorkloadReport(stats, invalidJobs);
    }

    public String exportTaWorkloadCsv(WorkloadReport report) {
        WorkloadReport safeReport = report != null
                ? report
                : new WorkloadReport(Collections.emptyList(), Collections.emptyList());
        StringBuilder csv = new StringBuilder();
        csv.append("taId,taName,acceptedJobCount,totalWorkWeeks,totalWorkHours,jobId,jobTitle,courseCode,weeklyHours,workStartDate,workEndDate,countedWeeks,countedHours\n");
        for (TaWorkloadStats stats : safeReport.getTaWorkloads()) {
            for (TaJobWorkload job : stats.getJobs()) {
                csv.append(escapeCsv(stats.getTaId())).append(",")
                        .append(escapeCsv(stats.getTaName())).append(",")
                        .append(stats.getAcceptedJobCount()).append(",")
                        .append(stats.getTotalWorkWeeks()).append(",")
                        .append(formatNumber(stats.getTotalWorkHours())).append(",")
                        .append(escapeCsv(job.getJobId())).append(",")
                        .append(escapeCsv(job.getJobTitle())).append(",")
                        .append(escapeCsv(job.getCourseCode())).append(",")
                        .append(formatNumber(job.getWeeklyHours())).append(",")
                        .append(job.getWorkStartDate()).append(",")
                        .append(job.getWorkEndDate()).append(",")
                        .append(job.getCountedWeeks()).append(",")
                        .append(formatNumber(job.getCountedHours()))
                        .append("\n");
            }
        }
        return csv.toString();
    }

    private String validateJobForWorkload(Job job) {
        if (job == null) {
            return "Job record not found";
        }
        Double weeklyHours = job.getWeeklyHours();
        if (weeklyHours == null) {
            return "Missing weekly hours";
        }
        if (weeklyHours < MIN_WEEKLY_HOURS || weeklyHours > MAX_WEEKLY_HOURS) {
            return "Weekly hours must be between 0.5 and 40";
        }
        if (!hasAtMostOneDecimal(weeklyHours)) {
            return "Weekly hours must have at most one decimal place";
        }
        if (job.getWorkStartDate() == null) {
            return "Missing work start date";
        }
        if (job.getWorkEndDate() == null) {
            return "Missing work end date";
        }
        if (job.getWorkEndDate().isBefore(job.getWorkStartDate())) {
            return "Work end date cannot be before work start date";
        }
        return null;
    }

    private int calculateCountedWeeks(LocalDate jobStart,
                                      LocalDate jobEnd,
                                      LocalDateTime rangeStart,
                                      LocalDateTime rangeEnd) {
        LocalDate overlapStart = maxDate(jobStart, rangeStart != null ? rangeStart.toLocalDate() : jobStart);
        LocalDate overlapEnd = minDate(jobEnd, rangeEnd != null ? rangeEnd.toLocalDate() : jobEnd);
        if (overlapStart.isAfter(overlapEnd)) {
            return 0;
        }
        long overlapDays = ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
        return Math.max(1, (int) Math.ceil(overlapDays / 7.0));
    }

    private LocalDate maxDate(LocalDate left, LocalDate right) {
        return left.isAfter(right) ? left : right;
    }

    private LocalDate minDate(LocalDate left, LocalDate right) {
        return left.isBefore(right) ? left : right;
    }

    private boolean hasAtMostOneDecimal(double value) {
        double scaled = value * 10.0;
        return Math.abs(scaled - Math.rint(scaled)) < 0.0001;
    }

    private String safeText(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        return value.trim();
    }

    public static String formatNumber(double value) {
        return BigDecimal.valueOf(value).stripTrailingZeros().toPlainString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
