package com.example.authlogin.servlet;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.service.TaJobAiSearchService;
import com.example.authlogin.service.TaJobAiSearchService.RecommendedJob;
import com.example.authlogin.service.TaJobAiSearchService.SearchResult;
import com.example.authlogin.service.ai.DeepSeekAiConfig;
import com.example.authlogin.service.ai.DeepSeekTaJobSearchClient;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * TA job-list AI recommendation endpoint.
 * Access path: POST /api/ta/job-ai-search
 */
@WebServlet("/api/ta/job-ai-search")
public class TaJobAiSearchServlet extends HttpServlet {

    private static final int MAX_QUERY_LENGTH = 500;

    private JobDao jobDao;
    private ApplicationDao applicationDao;
    private ApplicantDao applicantDao;
    private TaJobAiSearchService aiSearchService;

    @Override
    public void init() throws ServletException {
        jobDao = JobDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        DeepSeekAiConfig config = DeepSeekAiConfig.load(getServletContext());
        aiSearchService = new TaJobAiSearchService(new DeepSeekTaJobSearchClient(config));
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
        if (currentUser.getRole() != User.Role.TA) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only TA can use job AI search", null);
            return;
        }

        String query = request.getParameter("query");
        if (query != null && query.length() > MAX_QUERY_LENGTH) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "query is too long", null);
            return;
        }
        if (containsControlChars(query)) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "query contains invalid characters", null);
            return;
        }

        try {
            Optional<Applicant> applicantOpt = applicantDao.findByUserId(currentUser.getUserId());
            if (applicantOpt.isEmpty()) {
                JsonResponseUtil.writeJsonResponse(
                        response,
                        400,
                        false,
                        TaJobAiSearchService.PROFILE_REQUIRED_MESSAGE,
                        JsonResponseUtil.objectMap("action", "profile_required")
                );
                return;
            }

            List<Job> jobs = loadApplicableOpenJobs(currentUser.getUserId());
            SearchResult result = aiSearchService.search(applicantOpt.get(), jobs, query);

            if (!result.isSuccess()) {
                int status = "profile_required".equals(result.getAction()) ? 400 : 503;
                JsonResponseUtil.writeJsonResponse(
                        response,
                        status,
                        false,
                        result.getMessage(),
                        JsonResponseUtil.objectMap("action", result.getAction())
                );
                return;
            }

            Map<String, Object> data = buildResponseData(result);
            JsonResponseUtil.writeJsonResponse(response, 200, true, result.getMessage(), data);
        } catch (IllegalArgumentException ex) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, ex.getMessage(), null);
        } catch (Exception ex) {
            getServletContext().log("Failed to run TA job AI search", ex);
            JsonResponseUtil.writeJsonResponse(response, 503, false, TaJobAiSearchService.UNAVAILABLE_MESSAGE, null);
        }
    }

    private List<Job> loadApplicableOpenJobs(String currentUserId) {
        LocalDateTime effectiveNow = LocalDateTime.now();
        return jobDao.findAll().stream()
                .filter(job -> job != null && job.getEffectiveStatus(effectiveNow) == Job.Status.OPEN)
                .filter(job -> job.getJobId() != null && !job.getJobId().trim().isEmpty())
                .filter(job -> !applicationDao.hasApplied(job.getJobId(), currentUserId))
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildResponseData(SearchResult result) {
        List<Map<String, Object>> jobs = new ArrayList<>();
        List<Map<String, Object>> recommendations = new ArrayList<>();
        Map<String, Object> recommendationsById = new LinkedHashMap<>();

        for (RecommendedJob recommended : result.getRecommendations()) {
            Job job = recommended.getJob();
            if (job == null) {
                continue;
            }
            jobs.add(buildJobPayload(job));
            Map<String, Object> recommendation = JsonResponseUtil.objectMap(
                    "jobId", safeText(job.getJobId()),
                    "recommendation", recommended.getRecommendation()
            );
            recommendations.add(recommendation);
            recommendationsById.put(safeText(job.getJobId()), recommended.getRecommendation());
        }

        return JsonResponseUtil.objectMap(
                "action", result.getAction(),
                "message", result.getMessage(),
                "jobs", jobs,
                "recommendations", recommendations,
                "recommendationsByJobId", recommendationsById,
                "total", jobs.size()
        );
    }

    private Map<String, Object> buildJobPayload(Job job) {
        Job.Status effectiveStatus = job.getEffectiveStatus();
        return JsonResponseUtil.objectMap(
                "jobId", safeText(job.getJobId()),
                "moId", safeText(job.getMoId()),
                "moName", safeText(job.getMoName()),
                "title", safeText(job.getTitle()),
                "courseCode", safeText(job.getCourseCode()),
                "courseName", safeText(job.getCourseName()),
                "description", safeText(job.getDescription()),
                "requiredSkills", safeText(job.getRequiredSkillsAsString()),
                "positions", job.getPositions(),
                "workload", safeText(job.getWorkload()),
                "salary", safeText(job.getSalary()),
                "deadline", job.getDeadline() != null ? job.getDeadline().toString() : "",
                "status", effectiveStatus != null ? effectiveStatus.name() : "OPEN"
        );
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private boolean containsControlChars(String value) {
        return value != null && value.chars().anyMatch(ch -> ch < 32 || ch == 127);
    }

    private String safeText(String value) {
        return value != null ? value : "";
    }
}
