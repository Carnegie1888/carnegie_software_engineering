package com.example.tarecruitment.ai.web;

import com.example.tarecruitment.profile.dao.ApplicantDao;
import com.example.tarecruitment.job.dao.JobDao;
import com.example.tarecruitment.profile.model.Applicant;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.ai.client.MatchAnalysisAiConfig;
import com.example.tarecruitment.ai.service.TaJobMatchAnalysisService;
import com.example.tarecruitment.ai.client.DashScopeAnalysisClient;
import com.example.tarecruitment.common.api.ApiRoutes;
import com.example.tarecruitment.common.web.ApiResponses;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * TA 侧职位匹配分析接口。
 * 访问路径：POST /api/ta/job-match-analyses
 */
@WebServlet(ApiRoutes.TA_JOB_MATCH_ANALYSES)
public class TaJobMatchAnalysisServlet extends HttpServlet {

    private JobDao jobDao;
    private ApplicantDao applicantDao;
    private TaJobMatchAnalysisService analysisService;

    @Override
    public void init() throws ServletException {
        jobDao = JobDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        MatchAnalysisAiConfig config = MatchAnalysisAiConfig.load(getServletContext());
        DashScopeAnalysisClient client = new DashScopeAnalysisClient(config);
        analysisService = new TaJobMatchAnalysisService(client);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ApiResponses.write(response, 405, false, "Method not allowed", null);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            ApiResponses.write(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.TA) {
            ApiResponses.write(response, 403, false, "Only TA can request this analysis", null);
            return;
        }

        String jobId = normalizeJobId(request.getParameter("jobId"));
        if (jobId.isEmpty()) {
            ApiResponses.write(response, 400, false, "jobId is required", null);
            return;
        }
        if (containsControlChars(jobId) || containsDangerousMarkup(jobId)) {
            ApiResponses.write(response, 400, false, "jobId contains invalid characters", null);
            return;
        }

        Optional<Job> jobOpt = jobDao.findById(jobId);
        if (jobOpt.isEmpty()) {
            ApiResponses.write(response, 404, false, "Job not found", null);
            return;
        }

        Optional<Applicant> applicantOpt = applicantDao.findByUserId(currentUser.getUserId());
        if (applicantOpt.isEmpty()) {
            ApiResponses.write(
                    response,
                    404,
                    false,
                    "TA profile not found. Please complete your profile first.",
                    null
            );
            return;
        }

        try {
            TaJobMatchAnalysisService.AnalysisResult result = analysisService.analyze(jobOpt.get(), applicantOpt.get());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("jobId", jobId);
            data.putAll(result.toResponseMap());
            ApiResponses.write(response, 200, true, "Job match analysis generated", data);
        } catch (IllegalArgumentException ex) {
            ApiResponses.write(response, 400, false, ex.getMessage(), null);
        } catch (Exception ex) {
            getServletContext().log("Failed to generate TA job match analysis", ex);
            ApiResponses.write(
                    response,
                    500,
                    false,
                    "Unable to generate analysis right now. Please try again later.",
                    null
            );
        }
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private String normalizeJobId(String rawJobId) {
        if (rawJobId == null) {
            return "";
        }
        String trimmed = rawJobId.trim();
        if (trimmed.length() > 128) {
            return "";
        }
        return trimmed;
    }

    private boolean containsControlChars(String value) {
        return value != null && value.chars().anyMatch(ch -> ch < 32 || ch == 127);
    }

    private boolean containsDangerousMarkup(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String lower = value.toLowerCase();
        return lower.contains("<") || lower.contains(">") || lower.contains("javascript:");
    }
}
