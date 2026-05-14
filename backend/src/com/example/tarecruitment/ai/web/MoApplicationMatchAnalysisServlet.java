package com.example.tarecruitment.ai.web;

import com.example.tarecruitment.ai.client.MatchAnalysisAiConfig;
import com.example.tarecruitment.ai.client.DashScopeAnalysisClient;
import com.example.tarecruitment.ai.service.TaJobMatchAnalysisService;
import com.example.tarecruitment.application.dao.ApplicationDao;
import com.example.tarecruitment.application.model.Application;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.api.ApiRoutes;
import com.example.tarecruitment.common.web.ApiResponses;
import com.example.tarecruitment.common.web.WebRequests;
import com.example.tarecruitment.job.dao.JobDao;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.profile.dao.ApplicantDao;
import com.example.tarecruitment.profile.model.Applicant;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * MO application-level match analysis endpoint.
 * Access path: POST /api/mo/application-match-analyses
 */
@WebServlet(ApiRoutes.MO_APPLICATION_MATCH_ANALYSES)
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
        MatchAnalysisAiConfig config = MatchAnalysisAiConfig.load(getServletContext());
        analysisService = new TaJobMatchAnalysisService(new DashScopeAnalysisClient(config));
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ApiResponses.methodNotAllowed(response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = WebRequests.currentUser(request);
        if (currentUser == null) {
            ApiResponses.unauthorized(response, "Please login first");
            return;
        }
        if (currentUser.getRole() != User.Role.MO) {
            ApiResponses.forbidden(response, "Only MO can request this analysis");
            return;
        }

        String applicationId = normalizeId(request.getParameter("applicationId"));
        if (applicationId.isEmpty()) {
            ApiResponses.badRequest(response, "applicationId is required");
            return;
        }
        if (WebRequests.containsControlChars(applicationId) || WebRequests.containsDangerousMarkup(applicationId)) {
            ApiResponses.badRequest(response, "applicationId contains invalid characters");
            return;
        }

        Optional<Application> applicationOpt = applicationDao.findById(applicationId);
        if (applicationOpt.isEmpty()) {
            ApiResponses.notFound(response, "Application not found");
            return;
        }

        Application application = applicationOpt.get();
        if (!currentUser.getUserId().equals(application.getMoId())) {
            ApiResponses.forbidden(response, "You can only analyze applications for your own jobs");
            return;
        }

        Optional<Job> jobOpt = jobDao.findById(application.getJobId());
        if (jobOpt.isEmpty()) {
            ApiResponses.notFound(response, "Job not found");
            return;
        }

        Optional<Applicant> applicantOpt = applicantDao.findByUserId(application.getApplicantId());
        if (applicantOpt.isEmpty()) {
            ApiResponses.notFound(response, "Applicant profile not found");
            return;
        }

        try {
            TaJobMatchAnalysisService.AnalysisResult result = analysisService.analyze(
                    jobOpt.get(),
                    applicantOpt.get(),
                    application.getCoverLetter()
            );
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("applicationId", application.getApplicationId());
            data.put("jobId", application.getJobId());
            data.put("applicantId", application.getApplicantId());
            data.putAll(result.toResponseMap());
            ApiResponses.write(response, 200, true, "Application match analysis generated", data);
        } catch (IllegalArgumentException ex) {
            ApiResponses.badRequest(response, ex.getMessage());
        } catch (Exception ex) {
            getServletContext().log("Failed to generate MO application match analysis", ex);
            ApiResponses.serverError(response, "Unable to generate analysis right now. Please try again later.");
        }
    }

    private String normalizeId(String rawId) {
        String value = WebRequests.trim(rawId);
        return value.length() > 128 ? "" : value;
    }
}
