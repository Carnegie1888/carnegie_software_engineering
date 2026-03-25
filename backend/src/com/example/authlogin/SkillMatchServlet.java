package com.example.authlogin;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.SkillMatchService;
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
 * SkillMatchServlet - 为 MO 提供真实技能匹配结果。
 * 访问路径: /api/mo/skill-match
 */
@WebServlet("/api/mo/skill-match")
public class SkillMatchServlet extends HttpServlet {

    private JobDao jobDao;
    private ApplicationDao applicationDao;
    private ApplicantDao applicantDao;
    private SkillMatchService skillMatchService;

    @Override
    public void init() throws ServletException {
        jobDao = JobDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        skillMatchService = new SkillMatchService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.MO) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only MO can access skill match data", null);
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
            JsonResponseUtil.writeJsonResponse(response, 403, false, "You can only access skill match results for your own jobs", null);
            return;
        }

        List<Application> applications = applicationDao.findByJobId(job.getJobId());
        List<Map<String, Object>> matches = new ArrayList<>();
        int high = 0;
        int medium = 0;
        int low = 0;
        double totalScore = 0.0;

        for (Application application : applications) {
            Optional<Applicant> applicantOpt = applicantDao.findByUserId(application.getApplicantId());
            if (applicantOpt.isEmpty()) {
                continue;
            }

            Applicant applicant = applicantOpt.get();
            SkillMatchService.SkillMatchResult result = skillMatchService.matchWithAi(
                    job.getRequiredSkills(),
                    buildJobContext(job),
                    applicant.getSkills(),
                    buildApplicantContext(applicant, application)
            );

            totalScore += result.getScore();
            if (result.getScore() >= 85.0) {
                high++;
            } else if (result.getScore() >= 60.0) {
                medium++;
            } else {
                low++;
            }

            Map<String, Object> match = new LinkedHashMap<>();
            match.put("applicationId", application.getApplicationId());
            match.put("applicantId", application.getApplicantId());
            match.put("applicantProfileId", applicant.getApplicantId());
            match.put("applicantName", applicant.getFullName() != null && !applicant.getFullName().trim().isEmpty()
                    ? applicant.getFullName() : application.getApplicantName());
            match.put("applicantEmail", application.getApplicantEmail());
            match.put("score", result.getScore());
            match.put("level", result.getLevel().name());
            match.put("matchedSkills", result.getMatchedSkills());
            match.put("missingSkills", result.getMissingSkills());
            match.put("matchedKeywords", result.getMatchedKeywords());
            match.put("missingKeywords", result.getMissingKeywords());
            match.put("skillScore", result.getSkillScore());
            match.put("keywordScore", result.getKeywordScore());
            match.put("aiEnhanced", result.isAiEnhanced());
            match.put("aiScore", result.getAiScore());
            match.put("aiReason", result.getAiReason());
            match.put("applicationStatus", application.getStatus() != null ? application.getStatus().name() : "PENDING");
            match.put("skills", applicant.getSkills());
            match.put("department", applicant.getDepartment());
            match.put("program", applicant.getProgram());
            match.put("gpa", applicant.getGpa());
            matches.add(match);
        }

        double averageScore = matches.isEmpty() ? 0.0 : Math.round((totalScore / matches.size()) * 100.0) / 100.0;

        Map<String, Object> jobData = new LinkedHashMap<>();
        jobData.put("jobId", job.getJobId());
        jobData.put("title", job.getTitle());
        jobData.put("courseCode", job.getCourseCode());
        jobData.put("courseName", job.getCourseName());
        jobData.put("requiredSkills", job.getRequiredSkills());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalApplicants", matches.size());
        summary.put("high", high);
        summary.put("medium", medium);
        summary.put("low", low);
        summary.put("averageScore", averageScore);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("job", jobData);
        data.put("summary", summary);
        data.put("matches", matches);

        JsonResponseUtil.writeJsonResponse(response, 200, true, "Skill match results generated", data);
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private String buildJobContext(Job job) {
        StringBuilder context = new StringBuilder();
        if (job.getTitle() != null) {
            context.append(job.getTitle()).append(". ");
        }
        if (job.getCourseName() != null) {
            context.append(job.getCourseName()).append(". ");
        }
        if (job.getDescription() != null) {
            context.append(job.getDescription()).append(". ");
        }
        return context.toString().trim();
    }

    private String buildApplicantContext(Applicant applicant, Application application) {
        StringBuilder context = new StringBuilder();
        if (applicant.getExperience() != null) {
            context.append(applicant.getExperience()).append(". ");
        }
        if (applicant.getMotivation() != null) {
            context.append(applicant.getMotivation()).append(". ");
        }
        if (application.getCoverLetter() != null) {
            context.append(application.getCoverLetter()).append(". ");
        }
        return context.toString().trim();
    }
}
