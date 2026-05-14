package com.example.tarecruitment.job.web;

import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.api.ApiRoutes;
import com.example.tarecruitment.common.service.ServiceResult;
import com.example.tarecruitment.common.util.Logger;
import com.example.tarecruitment.common.web.ApiResponses;
import com.example.tarecruitment.job.mapper.JobRequestMapper;
import com.example.tarecruitment.job.service.JobService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Map;

@WebServlet(urlPatterns = {ApiRoutes.JOBS, ApiRoutes.JOBS + "/*"})
public class JobServlet extends HttpServlet {

    private static final String[] JOB_FIELDS = {
            "title",
            "courseCode",
            "courseName",
            "description",
            "requiredSkills",
            "positions",
            "weeklyHours",
            "workStartDate",
            "workEndDate",
            "salary",
            "deadline",
            "status"
    };

    private JobService jobService;

    @Override
    public void init() throws ServletException {
        jobService = JobService.getInstance();
        Logger.i("JobServlet", "JobServlet initialized");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String jobId = JobRequestMapper.pathJobId(request.getPathInfo());
            if (!jobId.isEmpty()) {
                write(response, jobService.detail(jobId));
                return;
            }

            write(response, jobService.list(
                    request.getParameter("courseCode"),
                    request.getParameter("status"),
                    request.getParameter("keyword"),
                    request.getParameter("moId")
            ));
        } catch (Exception e) {
            Logger.e("JobServlet", "Error retrieving jobs", e);
            ApiResponses.serverError(response, "An error occurred. Please try again later.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            if (!JobRequestMapper.pathJobId(request.getPathInfo()).isEmpty()) {
                ApiResponses.methodNotAllowed(response);
                return;
            }
            write(response, jobService.create(getCurrentUser(request), JobRequestMapper.requestParameters(request, JOB_FIELDS)));
        } catch (Exception e) {
            Logger.e("JobServlet", "Unexpected error during job creation", e);
            ApiResponses.serverError(response, "An error occurred. Please try again later.");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String jobId = JobRequestMapper.pathJobId(request.getPathInfo());
            Map<String, String> parameters = JobRequestMapper.formParameters(request);
            write(response, jobService.update(getCurrentUser(request), jobId, parameters));
        } catch (Exception e) {
            Logger.e("JobServlet", "Unexpected error during job update", e);
            ApiResponses.serverError(response, "An error occurred. Please try again later.");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            write(response, jobService.delete(getCurrentUser(request), JobRequestMapper.pathJobId(request.getPathInfo())));
        } catch (Exception e) {
            Logger.e("JobServlet", "Unexpected error during job deletion", e);
            ApiResponses.serverError(response, "An error occurred. Please try again later.");
        }
    }

    private void write(HttpServletResponse response, ServiceResult result) throws IOException {
        ApiResponses.write(response, result.getStatusCode(), result.isSuccess(), result.getMessage(), result.getData());
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }
}
