package com.example.authlogin;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.User;
import com.example.authlogin.util.JsonResponseUtil;
import com.example.authlogin.util.StoragePaths;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * ApplicantAccessServlet - MO/ADMIN/TA 访问申请人详情与受控简历下载
 * 路径：
 * - GET /api/applicants/detail?applicationId=...
 * - GET /api/applicants/resume?applicationId=...
 */
@WebServlet(urlPatterns = {"/api/applicants/detail", "/api/applicants/resume"})
public class ApplicantAccessServlet extends HttpServlet {

    private ApplicantDao applicantDao;
    private ApplicationDao applicationDao;

    @Override
    public void init() throws ServletException {
        applicantDao = ApplicantDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }

        String servletPath = request.getServletPath();
        String applicationId = safeText(request.getParameter("applicationId"));
        if (applicationId.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, "applicationId is required", null);
            return;
        }

        Optional<Application> applicationOpt = applicationDao.findById(applicationId);
        if (applicationOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Application not found", null);
            return;
        }

        Application application = applicationOpt.get();
        if (!canAccessApplication(currentUser, application)) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "You don't have permission to access this applicant", null);
            return;
        }

        Optional<Applicant> applicantOpt = applicantDao.findByUserId(application.getApplicantId());
        if (applicantOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Applicant profile not found", null);
            return;
        }

        Applicant applicant = applicantOpt.get();
        if ("/api/applicants/resume".equals(servletPath)) {
            streamResume(response, applicant);
            return;
        }

        JsonResponseUtil.writeJsonResponse(
                response,
                200,
                true,
                "Applicant detail retrieved successfully",
                buildApplicantDetailPayload(applicant, application)
        );
    }

    private boolean canAccessApplication(User currentUser, Application application) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return true;
        }
        if (currentUser.getRole() == User.Role.MO) {
            return currentUser.getUserId().equals(application.getMoId());
        }
        return currentUser.getRole() == User.Role.TA && currentUser.getUserId().equals(application.getApplicantId());
    }

    private Map<String, Object> buildApplicantDetailPayload(Applicant applicant, Application application) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("applicationId", application.getApplicationId());
        data.put("applicantId", applicant.getApplicantId());
        data.put("userId", applicant.getUserId());
        data.put("fullName", applicant.getFullName());
        data.put("studentId", applicant.getStudentId());
        data.put("department", applicant.getDepartment());
        data.put("program", applicant.getProgram());
        data.put("gpa", applicant.getGpa());
        data.put("skills", applicant.getSkills());
        data.put("resumePath", applicant.getResumePath());
        data.put("phone", applicant.getPhone());
        data.put("address", applicant.getAddress());
        data.put("experience", applicant.getExperience());
        data.put("motivation", applicant.getMotivation());
        data.put("hasResume", applicant.getResumePath() != null && !applicant.getResumePath().trim().isEmpty());
        data.put("applicationStatus", application.getStatus() != null ? application.getStatus().name() : "PENDING");
        data.put("coverLetter", application.getCoverLetter());
        return data;
    }

    private void streamResume(HttpServletResponse response, Applicant applicant) throws IOException {
        String resumePath = safeText(applicant.getResumePath());
        if (resumePath.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Resume not found for this applicant", null);
            return;
        }

        File file = new File(StoragePaths.getDataDir(), resumePath);
        if (!file.exists() || !file.isFile()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Resume file is unavailable", null);
            return;
        }

        String contentType = Files.probeContentType(file.toPath());
        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = "application/octet-stream";
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(contentType);
        response.setHeader("Content-Disposition", "inline; filename=\"" + file.getName().replace("\"", "") + "\"");
        response.setContentLengthLong(file.length());
        Files.copy(file.toPath(), response.getOutputStream());
        response.getOutputStream().flush();
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
