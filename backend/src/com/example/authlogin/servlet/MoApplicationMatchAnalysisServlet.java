package com.example.authlogin;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.TaJobMatchAiConfig;
import com.example.authlogin.service.TaJobMatchAnalysisService;
import com.example.authlogin.service.TongyiXiaomiAnalysisClient;
import com.example.authlogin.util.JsonResponseUtil;
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
 * MO 侧申请匹配分析接口。
 * 访问路径：POST /api/mo/application-match-analysis
 */
@WebServlet("/api/mo/application-match-analysis")
public class MoApplicationMatchAnalysisServlet extends HttpServlet {

    private ApplicationDao applicationDao;
    private JobDao jobDao;
    private ApplicantDao applicantDao;
    private TaJobMatchAnalysisService analysisService;

    @Override
    public void init() throws ServletException {
        applicationDao = ApplicationDao.getInstance();
        jobDao = JobDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        TaJobMatchAiConfig config = TaJobMatchAiConfig.load(getServletContext());
        TongyiXiaomiAnalysisClient client = new TongyiXiaomiAnalysisClient(config);
        analysisService = new TaJobMatchAnalysisService(client);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonResponseUtil.writeJsonResponse(response, 405, false, "Method not allowed", null);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.MO) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only MO can request this analysis", null);
            return;
        }

        String applicationId = normalizeApplicationId(request.getParameter("applicationId"));
        if (applicationId.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "applicationId is required", null);
            return;
        }
        if (containsControlChars(applicationId) || containsDangerousMarkup(applicationId)) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "applicationId contains invalid characters", null);
            return;
        }

        Optional<Application> applicationOpt = applicationDao.findById(applicationId);
        if (applicationOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Application not found", null);
            return;
        }

        Application application = applicationOpt.get();
        if (!safeText(application.getMoId()).equals(currentUser.getUserId())) {
            JsonResponseUtil.writeJsonResponse(
                    response,
                    403,
                    false,
                    "You can only analyze applications for your own jobs",
                    null
            );
            return;
        }

        String jobId = normalizeJobId(application.getJobId());
        if (jobId.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "Application has invalid jobId", null);
            return;
        }

        Optional<Job> jobOpt = jobDao.findById(jobId);
        if (jobOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Job not found", null);
            return;
        }

        Optional<Applicant> applicantOpt = applicantDao.findByUserId(application.getApplicantId());
        if (applicantOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Applicant profile not found", null);
            return;
        }

        try {
            TaJobMatchAnalysisService.AnalysisResult result = analysisService.analyze(
                    jobOpt.get(),
                    applicantOpt.get(),
                    application.getCoverLetter()
            );
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("applicationId", applicationId);
            data.put("jobId", jobId);
            data.put("applicantId", safeText(application.getApplicantId()));
            data.putAll(result.toResponseMap());
            JsonResponseUtil.writeJsonResponse(response, 200, true, "Application match analysis generated", data);
        } catch (IllegalArgumentException ex) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, ex.getMessage(), null);
        } catch (Exception ex) {
            getServletContext().log("Failed to generate MO application match analysis", ex);
            JsonResponseUtil.writeJsonResponse(
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

    private String normalizeApplicationId(String rawApplicationId) {
        if (rawApplicationId == null) {
            return "";
        }
        String trimmed = rawApplicationId.trim();
        if (trimmed.length() > 128) {
            return "";
        }
        return trimmed;
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

    private String safeText(String value) {
        return value == null ? "" : value.trim();
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
