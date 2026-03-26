package com.example.authlogin.servlet;

import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.model.Job;
import com.example.authlogin.model.User;
import com.example.authlogin.util.FuzzySearchUtil;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * JobServlet - 处理职位相关操作
 * 访问路径: /jobs
 *
 * 功能:
 * - POST /jobs - 创建新职位（仅MO可操作）
 * - GET /jobs - 获取职位列表（支持筛选）
 * - GET /jobs?id=xxx - 获取单个职位详情
 * - PUT /jobs?id=xxx - 更新职位（仅职位所属MO可操作）
 * - DELETE /jobs?id=xxx - 删除职位（仅职位所属MO可操作）
 */
@WebServlet("/jobs")
public class JobServlet extends HttpServlet {

    private JobDao jobDao;
    private ApplicationDao applicationDao;
    private static final int MAX_TITLE_LENGTH = 200;
    private static final int MAX_COURSE_CODE_LENGTH = 50;
    private static final int MAX_COURSE_NAME_LENGTH = 120;
    private static final int MAX_DESCRIPTION_LENGTH = 4000;
    private static final int MAX_SKILLS_LENGTH = 500;
    private static final int MAX_WORKLOAD_LENGTH = 120;
    private static final int MAX_SALARY_LENGTH = 120;
    private static final int MAX_POSITIONS = 200;

    // 简单的日志方法
    private void logInfo(String message) {
        System.out.println("[JobServlet] " + message);
    }

    private void logError(String message, Throwable t) {
        System.err.println("[JobServlet ERROR] " + message);
        if (t != null) {
            t.printStackTrace(System.err);
        }
    }

    @Override
    public void init() throws ServletException {
        jobDao = JobDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
        logInfo("JobServlet initialized");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        try {
            // 获取查询参数
            String jobId = request.getParameter("id");
            String courseCode = request.getParameter("courseCode");
            String status = request.getParameter("status");
            String keyword = request.getParameter("keyword");
            String moId = request.getParameter("moId");

            // 如果指定了jobId，返回单个职位
            if (jobId != null && !jobId.trim().isEmpty()) {
                getJobById(request, response, jobId);
                return;
            }

            // 获取职位列表
            List<Job> jobs = jobDao.findAll();
            LocalDateTime effectiveNow = LocalDateTime.now();

            // 应用筛选条件
            if (courseCode != null && !courseCode.trim().isEmpty()) {
                jobs = jobs.stream()
                        .filter(j -> j.getCourseCode().equalsIgnoreCase(courseCode.trim()))
                        .collect(Collectors.toList());
            }

            if (status != null && !status.trim().isEmpty()) {
                try {
                    Job.Status jobStatus = Job.Status.valueOf(status.toUpperCase().trim());
                    jobs = jobs.stream()
                            .filter(j -> j.getEffectiveStatus(effectiveNow) == jobStatus)
                            .collect(Collectors.toList());
                } catch (IllegalArgumentException e) {
                    // 无效状态，返回空列表
                    jobs = new ArrayList<>();
                }
            }

            if (moId != null && !moId.trim().isEmpty()) {
                jobs = jobs.stream()
                        .filter(j -> j.getMoId().equals(moId.trim()))
                        .collect(Collectors.toList());
            }

            FuzzySearchUtil.SearchOutcome<Job> searchOutcome = jobDao.searchWithMetadata(keyword, jobs);
            jobs = searchOutcome.getItems();

            // 构建JSON响应
            JsonResponseUtil.writeJsonResponse(
                    response,
                    200,
                    true,
                    "Jobs retrieved successfully",
                    JsonResponseUtil.rawObject(buildJobListJson(jobs, searchOutcome, effectiveNow))
            );

        } catch (Exception e) {
            logError("Error retrieving jobs", e);
            JsonResponseUtil.writeJsonResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    /**
     * 获取单个职位详情
     */
    private void getJobById(HttpServletRequest request, HttpServletResponse response, String jobId)
            throws IOException {
        Optional<Job> jobOpt = jobDao.findById(jobId);

        if (jobOpt.isEmpty()) {
            JsonResponseUtil.writeJsonResponse(response, 404, false, "Job not found", null);
            return;
        }

        Job job = jobOpt.get();
        long applicantCount = applicationDao.countByJobId(job.getJobId());
        JsonResponseUtil.writeJsonResponse(
                response,
                200,
                true,
                "Job retrieved successfully",
                JsonResponseUtil.rawObject(buildJobJson(job, applicantCount))
        );
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
                return;
            }

            // 检查用户角色（只有MO可以发布职位）
            if (currentUser.getRole() != User.Role.MO) {
                JsonResponseUtil.writeJsonResponse(response, 403, false, "Only MO can post jobs", null);
                return;
            }

            // 获取请求参数
            String title = request.getParameter("title");
            String courseCode = request.getParameter("courseCode");
            String courseName = request.getParameter("courseName");
            String description = request.getParameter("description");
            String skills = request.getParameter("requiredSkills");
            String positionsStr = request.getParameter("positions");
            String workload = request.getParameter("workload");
            String salary = request.getParameter("salary");
            String deadlineStr = request.getParameter("deadline");

            // 输入验证
            String error = validateInput(
                    title,
                    courseCode,
                    courseName,
                    description,
                    skills,
                    positionsStr,
                    workload,
                    salary,
                    deadlineStr
            );
            if (error != null) {
                logInfo("Validation failed: " + error);
                JsonResponseUtil.writeJsonResponse(response, 400, false, error, null);
                return;
            }

            String titleText = title != null ? title.trim() : "";
            String courseCodeText = courseCode != null ? courseCode.trim() : "";
            String courseNameText = courseName != null ? courseName.trim() : "";
            String descriptionText = description != null ? description.trim() : "";
            String skillsText = skills != null ? skills.trim() : "";
            String positionsText = positionsStr != null ? positionsStr.trim() : "";
            String workloadText = workload != null ? workload.trim() : "";
            String salaryText = salary != null ? salary.trim() : "";
            String deadlineText = deadlineStr != null ? deadlineStr.trim() : "";

            // 创建职位对象
            Job job = new Job();
            job.setMoId(currentUser.getUserId());
            job.setMoName(currentUser.getUsername()); // 使用username作为MO姓名
            job.setTitle(titleText);
            job.setCourseCode(courseCodeText);
            job.setCourseName(courseNameText);
            job.setDescription(descriptionText);

            // 处理技能列表
            job.setRequiredSkills(normalizeSkillsToList(skillsText));

            // 处理职位数量
            int positions = 1;
            if (!positionsText.isEmpty()) {
                positions = Integer.parseInt(positionsText);
            }
            job.setPositions(positions);

            job.setWorkload(workloadText);
            job.setSalary(salaryText);

            // 处理截止日期
            LocalDateTime deadline = parseDeadline(deadlineText);
            if (deadline != null) {
                job.setDeadline(deadline);
            }

            // 保存职位
            Job savedJob = jobDao.create(job);
            logInfo("Job created successfully: " + savedJob.getJobId() + " by MO: " + currentUser.getUsername());

            JsonResponseUtil.writeJsonResponse(response, 201, true, "Job created successfully!",
                    JsonResponseUtil.rawObject("\"jobId\": \"" + escapeJson(savedJob.getJobId()) + "\""));

        } catch (IllegalArgumentException e) {
            logInfo("Job creation failed: " + e.getMessage());
            JsonResponseUtil.writeJsonResponse(response, 400, false, e.getMessage(), null);
        } catch (Exception e) {
            logError("Unexpected error during job creation", e);
            JsonResponseUtil.writeJsonResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
                return;
            }

            // 获取要更新的职位ID
            String jobId = request.getParameter("id");
            if (jobId == null || jobId.trim().isEmpty()) {
                JsonResponseUtil.writeJsonResponse(response, 400, false, "Job ID is required", null);
                return;
            }

            // 查找职位
            Optional<Job> jobOpt = jobDao.findById(jobId.trim());
            if (jobOpt.isEmpty()) {
                JsonResponseUtil.writeJsonResponse(response, 404, false, "Job not found", null);
                return;
            }

            Job job = jobOpt.get();

            // 检查权限（只有职位所属MO可以更新）
            if (!job.getMoId().equals(currentUser.getUserId())) {
                JsonResponseUtil.writeJsonResponse(response, 403, false, "You can only update your own jobs", null);
                return;
            }

            // 获取请求参数
            String title = request.getParameter("title");
            String courseCode = request.getParameter("courseCode");
            String courseName = request.getParameter("courseName");
            String description = request.getParameter("description");
            String skills = request.getParameter("requiredSkills");
            String positionsStr = request.getParameter("positions");
            String workload = request.getParameter("workload");
            String salary = request.getParameter("salary");
            String deadlineStr = request.getParameter("deadline");
            String statusStr = request.getParameter("status");

            // 更新字段（对传入参数做与发布一致的校验）
            if (title != null) {
                String titleText = title.trim();
                String titleError = validateTitle(titleText, true);
                if (titleError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, titleError, null);
                    return;
                }
                job.setTitle(titleText);
            }
            if (courseCode != null) {
                String courseCodeText = courseCode.trim();
                String courseCodeError = validateCourseCode(courseCodeText, true);
                if (courseCodeError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, courseCodeError, null);
                    return;
                }
                job.setCourseCode(courseCodeText);
            }
            if (courseName != null) {
                String courseNameText = courseName.trim();
                String courseNameError = validateCourseName(courseNameText, true);
                if (courseNameError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, courseNameError, null);
                    return;
                }
                job.setCourseName(courseNameText);
            }
            if (description != null) {
                String descriptionText = description.trim();
                String descriptionError = validateDescription(descriptionText, true);
                if (descriptionError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, descriptionError, null);
                    return;
                }
                job.setDescription(descriptionText);
            }

            // 处理技能列表
            if (skills != null) {
                String skillsText = skills.trim();
                String skillsError = validateSkills(skillsText, true);
                if (skillsError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, skillsError, null);
                    return;
                }
                job.setRequiredSkills(normalizeSkillsToList(skillsText));
            }

            // 处理职位数量
            if (positionsStr != null) {
                String positionsText = positionsStr.trim();
                String positionsError = validatePositions(positionsText, true);
                if (positionsError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, positionsError, null);
                    return;
                }
                job.setPositions(Integer.parseInt(positionsText));
            }

            if (workload != null) {
                String workloadText = workload.trim();
                String workloadError = validateWorkload(workloadText, true);
                if (workloadError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, workloadError, null);
                    return;
                }
                job.setWorkload(workloadText);
            }
            if (salary != null) {
                String salaryText = salary.trim();
                String salaryError = validateSalary(salaryText, true);
                if (salaryError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, salaryError, null);
                    return;
                }
                job.setSalary(salaryText);
            }

            // 处理截止日期
            if (deadlineStr != null) {
                String deadlineText = deadlineStr.trim();
                String deadlineError = validateDeadline(deadlineText, true);
                if (deadlineError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, deadlineError, null);
                    return;
                }
                LocalDateTime deadline = parseDeadline(deadlineText);
                if (deadline == null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, "Invalid deadline format", null);
                    return;
                }
                job.setDeadline(deadline);
            }

            // 处理状态更新
            if (statusStr != null) {
                String statusText = statusStr.trim();
                String statusError = validateStatus(statusText, true);
                if (statusError != null) {
                    JsonResponseUtil.writeJsonResponse(response, 400, false, statusError, null);
                    return;
                }
                Job.Status newStatus = Job.Status.valueOf(statusText.toUpperCase());
                job.setStatus(newStatus);
            }

            // 保存更新
            Job updatedJob = jobDao.update(job);
            logInfo("Job updated successfully: " + updatedJob.getJobId());

            JsonResponseUtil.writeJsonResponse(response, 200, true, "Job updated successfully!",
                    JsonResponseUtil.rawObject("\"jobId\": \"" + escapeJson(updatedJob.getJobId()) + "\""));

        } catch (IllegalArgumentException e) {
            logInfo("Job update failed: " + e.getMessage());
            JsonResponseUtil.writeJsonResponse(response, 400, false, e.getMessage(), null);
        } catch (Exception e) {
            logError("Unexpected error during job update", e);
            JsonResponseUtil.writeJsonResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
                return;
            }

            // 获取要删除的职位ID
            String jobId = request.getParameter("id");
            if (jobId == null || jobId.trim().isEmpty()) {
                JsonResponseUtil.writeJsonResponse(response, 400, false, "Job ID is required", null);
                return;
            }

            // 查找职位
            Optional<Job> jobOpt = jobDao.findById(jobId.trim());
            if (jobOpt.isEmpty()) {
                JsonResponseUtil.writeJsonResponse(response, 404, false, "Job not found", null);
                return;
            }

            Job job = jobOpt.get();

            // 检查权限（只有职位所属MO可以删除）
            if (!job.getMoId().equals(currentUser.getUserId())) {
                JsonResponseUtil.writeJsonResponse(response, 403, false, "You can only delete your own jobs", null);
                return;
            }

            // 删除职位
            boolean deleted = jobDao.delete(jobId.trim());
            if (deleted) {
                logInfo("Job deleted successfully: " + jobId);
                JsonResponseUtil.writeJsonResponse(response, 200, true, "Job deleted successfully!", null);
            } else {
                JsonResponseUtil.writeJsonResponse(response, 500, false, "Failed to delete job", null);
            }

        } catch (Exception e) {
            logError("Unexpected error during job deletion", e);
            JsonResponseUtil.writeJsonResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    /**
     * 获取当前登录用户
     */
    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    /**
     * 验证必填字段
     */
    private String validateInput(String title,
                                 String courseCode,
                                 String courseName,
                                 String description,
                                 String skills,
                                 String positions,
                                 String workload,
                                 String salary,
                                 String deadlineStr) {
        String titleText = trimToEmpty(title);
        String courseCodeText = trimToEmpty(courseCode);
        String courseNameText = trimToEmpty(courseName);
        String descriptionText = trimToEmpty(description);
        String skillsText = trimToEmpty(skills);
        String positionsText = trimToEmpty(positions);
        String workloadText = trimToEmpty(workload);
        String salaryText = trimToEmpty(salary);
        String deadlineText = trimToEmpty(deadlineStr);

        String error = validateTitle(titleText, true);
        if (error != null) {
            return error;
        }
        error = validateCourseCode(courseCodeText, true);
        if (error != null) {
            return error;
        }
        error = validateCourseName(courseNameText, true);
        if (error != null) {
            return error;
        }
        error = validateDescription(descriptionText, true);
        if (error != null) {
            return error;
        }
        error = validateSkills(skillsText, true);
        if (error != null) {
            return error;
        }
        error = validatePositions(positionsText, false);
        if (error != null) {
            return error;
        }
        error = validateWorkload(workloadText, true);
        if (error != null) {
            return error;
        }
        error = validateSalary(salaryText, true);
        if (error != null) {
            return error;
        }
        error = validateDeadline(deadlineText, true);
        if (error != null) {
            return error;
        }
        return null;
    }

    private String trimToEmpty(String value) {
        return value != null ? value.trim() : "";
    }

    private String validateTitle(String titleText, boolean required) {
        if (required && titleText.isEmpty()) {
            return "Job title is required";
        }
        if (titleText.isEmpty()) {
            return null;
        }
        if (titleText.length() > MAX_TITLE_LENGTH) {
            return "Job title is too long";
        }
        if (hasControlChars(titleText) || containsDangerousMarkup(titleText)) {
            return "Job title contains unsupported characters";
        }
        return null;
    }

    private String validateCourseCode(String courseCodeText, boolean required) {
        if (required && courseCodeText.isEmpty()) {
            return "Course code is required";
        }
        if (courseCodeText.isEmpty()) {
            return null;
        }
        if (courseCodeText.length() > MAX_COURSE_CODE_LENGTH) {
            return "Course code is too long";
        }
        if (!courseCodeText.matches("^[A-Za-z0-9][A-Za-z0-9 _\\-/.]{0,49}$")) {
            return "Course code contains unsupported characters";
        }
        return null;
    }

    private String validateCourseName(String courseNameText, boolean required) {
        if (required && courseNameText.isEmpty()) {
            return "Course name is required";
        }
        if (courseNameText.isEmpty()) {
            return null;
        }
        if (courseNameText.length() > MAX_COURSE_NAME_LENGTH) {
            return "Course name is too long";
        }
        if (hasControlChars(courseNameText) || containsDangerousMarkup(courseNameText)) {
            return "Course name contains unsupported characters";
        }
        return null;
    }

    private String validateDescription(String descriptionText, boolean required) {
        if (required && descriptionText.isEmpty()) {
            return "Description is required";
        }
        if (descriptionText.isEmpty()) {
            return null;
        }
        if (descriptionText.length() > MAX_DESCRIPTION_LENGTH) {
            return "Description is too long";
        }
        if (hasControlChars(descriptionText) || containsDangerousMarkup(descriptionText)) {
            return "Description contains unsupported characters";
        }
        return null;
    }

    private String validateSkills(String skillsText, boolean required) {
        if (required && skillsText.isEmpty()) {
            return "Required skills are required";
        }
        if (skillsText.isEmpty()) {
            return null;
        }
        if (skillsText.length() > MAX_SKILLS_LENGTH) {
            return "Required skills are too long";
        }
        if (hasControlChars(skillsText) || containsDangerousMarkup(skillsText)) {
            return "Required skills contain unsupported characters";
        }

        List<String> normalizedSkills = normalizeSkillsToList(skillsText);
        if (normalizedSkills.isEmpty()) {
            return "Please remove empty skill items";
        }
        if (normalizedSkills.size() > 20) {
            return "Please list up to 20 skills";
        }

        return null;
    }

    private String validatePositions(String positionsText, boolean required) {
        if (required && positionsText.isEmpty()) {
            return "Positions must be a whole number";
        }
        if (positionsText.isEmpty()) {
            return null;
        }
        if (!positionsText.matches("^\\d+$")) {
            return "Positions must be a whole number";
        }
        try {
            int pos = Integer.parseInt(positionsText);
            if (pos < 1 || pos > MAX_POSITIONS) {
                return "Positions must be between 1 and " + MAX_POSITIONS;
            }
        } catch (NumberFormatException e) {
            return "Invalid positions number";
        }
        return null;
    }

    private String validateWorkload(String workloadText, boolean required) {
        if (required && workloadText.isEmpty()) {
            return "Workload is required";
        }
        if (workloadText.isEmpty()) {
            return null;
        }
        if (workloadText.length() > MAX_WORKLOAD_LENGTH) {
            return "Workload is too long";
        }
        if (hasControlChars(workloadText) || containsDangerousMarkup(workloadText)) {
            return "Workload contains unsupported characters";
        }
        return null;
    }

    private String validateSalary(String salaryText, boolean required) {
        if (required && salaryText.isEmpty()) {
            return "Salary is required";
        }
        if (salaryText.isEmpty()) {
            return null;
        }
        if (salaryText.length() > MAX_SALARY_LENGTH) {
            return "Salary is too long";
        }
        if (hasControlChars(salaryText) || containsDangerousMarkup(salaryText)) {
            return "Salary contains unsupported characters";
        }
        return null;
    }

    private String validateDeadline(String deadlineText, boolean required) {
        if (required && deadlineText.isEmpty()) {
            return "Application deadline is required";
        }
        if (deadlineText.isEmpty()) {
            return null;
        }
        LocalDateTime deadline = parseDeadline(deadlineText);
        if (deadline == null) {
            return "Invalid deadline format";
        }
        if (deadline.isBefore(LocalDateTime.now().minusMinutes(1))) {
            return "Deadline cannot be in the past";
        }
        return null;
    }

    private String validateStatus(String statusText, boolean required) {
        if (required && statusText.isEmpty()) {
            return "Status is required";
        }
        if (statusText.isEmpty()) {
            return null;
        }
        try {
            Job.Status.valueOf(statusText.toUpperCase());
        } catch (IllegalArgumentException e) {
            return "Invalid status value";
        }
        return null;
    }

    private List<String> normalizeSkillsToList(String rawSkills) {
        if (rawSkills == null || rawSkills.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(rawSkills.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private LocalDateTime parseDeadline(String deadlineStr) {
        if (deadlineStr == null || deadlineStr.trim().isEmpty()) {
            return null;
        }

        String text = deadlineStr.trim();
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {
            // fallback
        }

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        } catch (Exception ignored) {
            // fallback
        }

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
        } catch (Exception ignored) {
            // keep null
        }

        return null;
    }

    private boolean hasControlChars(String value) {
        return value != null && value.matches(".*[\\x00-\\x1F\\x7F].*");
    }

    private boolean containsDangerousMarkup(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String text = value.toLowerCase();
        return text.matches(".*<[^>]*>.*")
            || text.contains("javascript:")
            || text.matches(".*on\\w+\\s*=.*");
    }

    /**
     * @param applicantCount 若 &lt; 0 则不输出 applicantCount 字段（职位列表用）
     */
    private String buildJobJson(Job job, long applicantCount) {
        return buildJobJson(job, applicantCount, LocalDateTime.now());
    }

    private String buildJobJson(Job job, long applicantCount, LocalDateTime referenceTime) {
        Job.Status effectiveStatus = job.getEffectiveStatus(referenceTime);
        StringBuilder json = new StringBuilder();
        json.append("\"jobId\": \"").append(escapeJson(job.getJobId())).append("\", ");
        json.append("\"moId\": \"").append(escapeJson(job.getMoId())).append("\", ");
        json.append("\"moName\": \"").append(escapeJson(job.getMoName())).append("\", ");
        json.append("\"title\": \"").append(escapeJson(job.getTitle())).append("\", ");
        json.append("\"courseCode\": \"").append(escapeJson(job.getCourseCode())).append("\", ");
        json.append("\"courseName\": \"").append(escapeJson(job.getCourseName() != null ? job.getCourseName() : "")).append("\", ");
        json.append("\"description\": \"").append(escapeJson(job.getDescription() != null ? job.getDescription() : "")).append("\", ");
        json.append("\"requiredSkills\": \"").append(escapeJson(job.getRequiredSkillsAsString())).append("\", ");
        json.append("\"positions\": ").append(job.getPositions()).append(", ");
        json.append("\"workload\": \"").append(escapeJson(job.getWorkload() != null ? job.getWorkload() : "")).append("\", ");
        json.append("\"salary\": \"").append(escapeJson(job.getSalary() != null ? job.getSalary() : "")).append("\", ");
        json.append("\"deadline\": \"").append(job.getDeadline() != null ? job.getDeadline().toString() : "").append("\", ");
        json.append("\"status\": \"").append(effectiveStatus.name()).append("\"");
        if (applicantCount >= 0) {
            json.append(", \"applicantCount\": ").append(applicantCount);
        }
        return json.toString();
    }

    /**
     * 构建职位列表JSON
     */
    private String buildJobListJson(List<Job> jobs, FuzzySearchUtil.SearchOutcome<Job> searchOutcome, LocalDateTime referenceTime) {
        StringBuilder json = new StringBuilder();
        json.append("\"jobs\": [");

        for (int i = 0; i < jobs.size(); i++) {
            json.append("{");
            json.append(buildJobJson(jobs.get(i), -1L, referenceTime));
            json.append("}");
            if (i < jobs.size() - 1) {
                json.append(", ");
            }
        }

        json.append("], ");
        json.append("\"total\": ").append(jobs.size()).append(", ");
        json.append("\"keywordApplied\": ").append(searchOutcome != null && searchOutcome.isKeywordApplied()).append(", ");
        json.append("\"approximateOnly\": ").append(searchOutcome != null && searchOutcome.isApproximateOnly()).append(", ");
        json.append("\"hasMatches\": ").append(searchOutcome != null && searchOutcome.hasMatches());
        return json.toString();
    }

    /**
     * JSON字符串转义
     */
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}
