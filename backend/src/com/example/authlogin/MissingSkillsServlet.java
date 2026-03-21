package com.example.authlogin;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.MissingSkillsService;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * MissingSkillsServlet - 缺失技能可视化数据接口
 * 访问路径: /api/mo/missing-skills
 */
@WebServlet("/api/mo/missing-skills")
public class MissingSkillsServlet extends HttpServlet {

    private JobDao jobDao;
    private ApplicationDao applicationDao;
    private ApplicantDao applicantDao;
    private MissingSkillsService missingSkillsService;

    @Override
    public void init() throws ServletException {
        jobDao = JobDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        missingSkillsService = new MissingSkillsService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }

        if (currentUser.getRole() != User.Role.MO && currentUser.getRole() != User.Role.ADMIN) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only MO or ADMIN can access missing skills data", null);
            return;
        }

        String jobId = request.getParameter("jobId");
        if (jobId == null || jobId.trim().isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "jobId is required", null);
            return;
        }

        Optional<Job> jobOpt = jobDao.findById(jobId.trim());
        if (jobOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Job not found", null);
            return;
        }
        Job job = jobOpt.get();

        if (currentUser.getRole() == User.Role.MO && !job.getMoId().equals(currentUser.getUserId())) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "You can only access missing skills for your own jobs", null);
            return;
        }

        String applicantId = request.getParameter("applicantId");
        if (applicantId != null && !applicantId.trim().isEmpty()) {
            handleSingleApplicant(response, job, applicantId.trim());
            return;
        }

        handleAggregateApplicants(response, job);
    }

    private void handleSingleApplicant(HttpServletResponse response, Job job, String applicantId) throws IOException {
        Optional<Applicant> applicantOpt = resolveApplicantByIdentifier(applicantId);
        if (applicantOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Applicant not found", null);
            return;
        }

        Applicant applicant = applicantOpt.get();
        MissingSkillsService.MissingSkillsReport report = missingSkillsService.generateMissingSkillsReport(
                job.getRequiredSkills(),
                applicant.getSkills()
        );
        MissingSkillsService.MissingSkillsVisualizationData visualizationData = missingSkillsService.generateVisualizationData(
                job.getRequiredSkills(),
                applicant.getSkills()
        );

        StringBuilder data = new StringBuilder();
        data.append("\"jobId\": \"").append(escapeJson(job.getJobId())).append("\", ");
        data.append("\"applicantId\": \"").append(escapeJson(applicant.getApplicantId())).append("\", ");
        data.append("\"applicantName\": \"").append(escapeJson(applicant.getFullName())).append("\", ");
        data.append("\"summary\": \"").append(escapeJson(report.getSummary())).append("\", ");
        data.append("\"matchScore\": ").append(report.getAnalysis().getMatchScore()).append(", ");
        data.append("\"matchedSkills\": ").append(stringListToJson(report.getAnalysis().getMatchedSkills())).append(", ");
        data.append("\"missingSkills\": ").append(stringListToJson(report.getAnalysis().getMissingSkills())).append(", ");
        data.append("\"recommendations\": ").append(stringListToJson(report.getRecommendations())).append(", ");
        data.append("\"visualization\": {");
        data.append("\"requiredCount\": ").append(visualizationData.getRequiredCount()).append(", ");
        data.append("\"matchedCount\": ").append(visualizationData.getMatchedCount()).append(", ");
        data.append("\"missingCount\": ").append(visualizationData.getMissingCount()).append(", ");
        data.append("\"gapFrequency\": ").append(skillFrequencyToJson(visualizationData.getGapFrequency()));
        data.append("}");

        JsonResponseUtil.writeResponse(response, 200, true, "Missing skills visualization data generated", data.toString());
    }

    private void handleAggregateApplicants(HttpServletResponse response, Job job) throws IOException {
        List<Applicant> applicants = resolveApplicantsForJob(job.getJobId());
        List<List<String>> applicantSkillLists = new ArrayList<>();
        int high = 0;
        int medium = 0;
        int low = 0;
        int none = 0;

        for (Applicant applicant : applicants) {
            List<String> skills = applicant.getSkills() != null ? applicant.getSkills() : new ArrayList<>();
            applicantSkillLists.add(skills);
            MissingSkillsService.MissingSkillsAnalysis analysis = missingSkillsService.analyzeMissingSkills(job.getRequiredSkills(), skills);
            if (analysis.getMatchScore() >= 85.0) {
                high++;
            } else if (analysis.getMatchScore() >= 60.0) {
                medium++;
            } else if (analysis.getMatchScore() > 0.0) {
                low++;
            } else {
                none++;
            }
        }

        Map<String, Integer> frequency = missingSkillsService.aggregateMissingSkillFrequency(job.getRequiredSkills(), applicantSkillLists);

        StringBuilder data = new StringBuilder();
        data.append("\"jobId\": \"").append(escapeJson(job.getJobId())).append("\", ");
        data.append("\"jobTitle\": \"").append(escapeJson(job.getTitle())).append("\", ");
        data.append("\"applicantCount\": ").append(applicants.size()).append(", ");
        data.append("\"requiredSkillCount\": ").append(job.getRequiredSkills() != null ? job.getRequiredSkills().size() : 0).append(", ");
        data.append("\"scoreBuckets\": {");
        data.append("\"high\": ").append(high).append(", ");
        data.append("\"medium\": ").append(medium).append(", ");
        data.append("\"low\": ").append(low).append(", ");
        data.append("\"none\": ").append(none);
        data.append("}, ");
        data.append("\"missingSkillFrequency\": ").append(skillFrequencyToJson(frequency));

        JsonResponseUtil.writeResponse(response, 200, true, "Aggregate missing skills visualization data generated", data.toString());
    }

    Optional<Applicant> resolveApplicantByIdentifier(String applicantIdentifier) {
        if (applicantIdentifier == null || applicantIdentifier.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalizedIdentifier = applicantIdentifier.trim();
        Optional<Applicant> applicantByUserId = applicantDao.findByUserId(normalizedIdentifier);
        if (applicantByUserId.isPresent()) {
            return applicantByUserId;
        }

        return applicantDao.findById(normalizedIdentifier);
    }

    List<Applicant> resolveApplicantsForJob(String jobId) {
        if (jobId == null || jobId.trim().isEmpty()) {
            return List.of();
        }

        Map<String, Applicant> applicantsByUserId = new LinkedHashMap<>();
        for (Application application : applicationDao.findByJobId(jobId.trim())) {
            if (application == null || application.getApplicantId() == null || application.getApplicantId().trim().isEmpty()) {
                continue;
            }

            String applicantUserId = application.getApplicantId().trim();
            if (applicantsByUserId.containsKey(applicantUserId)) {
                continue;
            }

            applicantDao.findByUserId(applicantUserId)
                    .ifPresent(applicant -> applicantsByUserId.put(applicantUserId, applicant));
        }

        return new ArrayList<>(applicantsByUserId.values());
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private String stringListToJson(List<String> values) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        if (values != null) {
            for (int i = 0; i < values.size(); i++) {
                json.append("\"").append(escapeJson(values.get(i))).append("\"");
                if (i < values.size() - 1) {
                    json.append(", ");
                }
            }
        }
        json.append("]");
        return json.toString();
    }

    private String skillFrequencyToJson(Map<String, Integer> frequency) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        if (frequency != null) {
            int index = 0;
            int size = frequency.size();
            for (Map.Entry<String, Integer> entry : frequency.entrySet()) {
                json.append("{");
                json.append("\"skill\": \"").append(escapeJson(entry.getKey())).append("\", ");
                json.append("\"count\": ").append(entry.getValue());
                json.append("}");
                if (index < size - 1) {
                    json.append(", ");
                }
                index++;
            }
        }
        json.append("]");
        return json.toString();
    }

    private String escapeJson(String str) {
        if (str == null) {
            return "";
        }
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
