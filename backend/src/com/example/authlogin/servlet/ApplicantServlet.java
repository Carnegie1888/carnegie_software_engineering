package com.example.authlogin.servlet;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.User;
import com.example.authlogin.util.JsonResponseUtil;
import com.example.authlogin.util.Logger;
import com.example.authlogin.util.StoragePaths;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ApplicantServlet - 处理TA申请人档案的创建和查询
 * 访问路径: /applicant
 *
 * 功能:
 * - POST /applicant - 创建新的申请人档案（支持文件上传）
 * - GET /applicant - 获取当前用户的档案
 * - PUT /applicant - 更新档案
 * - POST /applicant/upload - 上传简历文件
 */
@WebServlet("/applicant")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,       // 1 MB - 当文件超过此大小时写入磁盘
    maxFileSize = 1024 * 1024 * 10,       // 10 MB - 单个文件最大大小
    maxRequestSize = 1024 * 1024 * 20     // 20 MB - 整个请求最大大小
)
public class ApplicantServlet extends HttpServlet {

    private ApplicantDao applicantDao;

    // 上传目录
    private static final String UPLOAD_DIR = StoragePaths.getResumeDir();
    private static final String DRAFT_UPLOAD_DIR = StoragePaths.getResumeDraftDir();
    private static final String PHOTO_UPLOAD_DIR = StoragePaths.getPhotoDir();
    private static final String DRAFT_RESUME_FLAG = "draftResume";
    private static final String SESSION_DRAFT_RESUME_PATH = "applicantDraftResumePath";
    private static final String SESSION_DRAFT_RESUME_NAME = "applicantDraftResumeName";
    private static final String PHOTO_ASSET_PARAM = "asset";
    private static final String PHOTO_ASSET_VALUE = "photo";

    // 允许的文件类型
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final List<String> ALLOWED_PHOTO_CONTENT_TYPES = Arrays.asList(
        "image/jpeg",
        "image/png",
        "image/webp"
    );

    // 允许的扩展名
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".pdf", ".doc", ".docx"
    );

    private static final List<String> ALLOWED_PHOTO_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".webp"
    );

    private static final List<String> ALLOWED_PROGRAMS = Arrays.asList(
        "Undergraduate", "Master", "PhD"
    );

    // 文件大小限制 (10 MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_PHOTO_SIZE = 5 * 1024 * 1024;

    // 简单的日志方法
    private void logInfo(String message) {
        Logger.i("ApplicantServlet", message);
    }

    private void logError(String message, Throwable t) {
        Logger.e("ApplicantServlet", message, t);
    }

    @Override
    public void init() throws ServletException {
        applicantDao = ApplicantDao.getInstance();
        // 创建上传目录
        createUploadDirectory();
        logInfo("ApplicantServlet initialized");
    }

    private void createUploadDirectory() {
        ensureDirectoryExists(UPLOAD_DIR);
        ensureDirectoryExists(DRAFT_UPLOAD_DIR);
        ensureDirectoryExists(PHOTO_UPLOAD_DIR);
    }

    private void ensureDirectoryExists(String dirPath) {
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (isPhotoAssetRequest(request)) {
            streamProfilePhoto(request, response);
            return;
        }

        response.setContentType("application/json;charset=UTF-8");

        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeResponse(response, 401, false, "Please login first", null);
                return;
            }

            // 查询用户的档案
            Optional<Applicant> applicantOpt = applicantDao.findByUserId(currentUser.getUserId());

            if (applicantOpt.isEmpty()) {
                JsonResponseUtil.writeJsonResponse(
                        response,
                        404,
                        false,
                        "Applicant profile not found",
                        buildDraftResumePayload(request)
                );
                return;
            }

            Applicant applicant = applicantOpt.get();
            JsonResponseUtil.writeJsonResponse(
                    response,
                    200,
                    true,
                    "Applicant profile retrieved successfully",
                    buildApplicantPayload(applicant, request)
            );

        } catch (Exception e) {
            logError("Error retrieving applicant profile", e);
            JsonResponseUtil.writeResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        // 检查是否是multipart请求（文件上传）
        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase().contains("multipart/form-data")) {
            if (isDraftResumeRequest(request)) {
                handleDraftResumeUpload(request, response);
                return;
            }
            handleMultipartRequest(request, response);
            return;
        }

        // 普通表单请求
        handleFormRequest(request, response, false);
    }

    /**
     * 处理普通表单请求（创建档案）
     */
    private void handleFormRequest(HttpServletRequest request, HttpServletResponse response, boolean isUpdate)
            throws ServletException, IOException {
        String newResumePath = null;
        boolean clearDraftAfterSave = false;
        String draftResumeName = "";
        String previousPhotoPath = "";
        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeResponse(response, 401, false, "Please login first", null);
                return;
            }

            Optional<Applicant> existingApplicant = applicantDao.findByUserId(currentUser.getUserId());

            if (isUpdate) {
                // 更新模式
                if (existingApplicant.isEmpty()) {
                    JsonResponseUtil.writeResponse(response, 404, false, "Applicant profile not found. Please create one first.", null);
                    return;
                }
            } else {
                // 创建模式
                if (existingApplicant.isPresent()) {
                    JsonResponseUtil.writeResponse(response, 409, false, "Applicant profile already exists. Use PUT to update.", null);
                    return;
                }
            }

            // 获取请求参数
            String fullName = normalizeInput(request.getParameter("fullName"));
            String studentId = normalizeInput(request.getParameter("studentId"));
            String department = normalizeInput(request.getParameter("department"));
            String program = normalizeInput(request.getParameter("program"));
            String gpa = normalizeInput(request.getParameter("gpa"));
            String skills = normalizeInput(request.getParameter("skills"));
            String phone = normalizeInput(request.getParameter("phone"));
            String address = normalizeInput(request.getParameter("address"));
            String experience = normalizeInput(request.getParameter("experience"));
            String motivation = normalizeInput(request.getParameter("motivation"));

            // 输入验证
            String error = validateInput(
                    fullName, studentId, department, program,
                    gpa, skills, phone, address, experience, motivation,
                    true
            );
            if (error != null) {
                logInfo("Validation failed: " + error);
                JsonResponseUtil.writeResponse(response, 400, false, error, null);
                return;
            }

            Optional<Applicant> existingWithStudentId = applicantDao.findByStudentId(studentId);
            if (existingWithStudentId.isPresent()) {
                if (!isUpdate || existingApplicant.isEmpty()
                        || !existingWithStudentId.get().getApplicantId().equals(existingApplicant.get().getApplicantId())) {
                    JsonResponseUtil.writeResponse(response, 400, false, "Student ID already exists", null);
                    return;
                }
            }

            Applicant applicant;
            if (isUpdate) {
                applicant = existingApplicant.get();
            } else {
                applicant = new Applicant();
                applicant.setUserId(currentUser.getUserId());
            }
            String previousResumePath = applicant.getResumePath();
            previousPhotoPath = applicant.getPhotoPath();
            boolean removePhoto = isTruthyFlag(request.getParameter("removePhoto"));

            applicant.setFullName(fullName);
            applicant.setStudentId(studentId);
            applicant.setDepartment(department);
            applicant.setProgram(program);
            applicant.setGpa(gpa);
            applicant.setPhone(phone);
            applicant.setAddress(address);
            applicant.setExperience(experience);
            applicant.setMotivation(motivation);
            applicant.setSkills(parseSkills(skills));

            HttpSession session = request.getSession(false);
            String draftResumePath = getDraftResumePath(session);
            draftResumeName = getDraftResumeName(session);
            if (isNotEmpty(draftResumePath)) {
                newResumePath = copyDraftResumeToFinal(draftResumePath, currentUser.getUserId(), draftResumeName);
                applicant.setResumePath(newResumePath);
                clearDraftAfterSave = true;
            }

            if (removePhoto) {
                applicant.setPhotoPath("");
            }

            if (!isNotEmpty(applicant.getResumePath())) {
                JsonResponseUtil.writeResponse(response, 400, false, "Please upload your resume before saving your profile.", null);
                return;
            }

            // 保存档案
            Applicant savedApplicant;
            if (isUpdate) {
                applicant.setUpdatedAt(LocalDateTime.now());
                savedApplicant = applicantDao.update(applicant);
                logInfo("Applicant profile updated successfully for user: " + currentUser.getUsername());
            } else {
                savedApplicant = applicantDao.create(applicant);
                logInfo("Applicant profile created successfully for user: " + currentUser.getUsername());
            }

            if (clearDraftAfterSave) {
                clearDraftResumeState(session, true);
            }
            cleanupReplacedResume(previousResumePath, savedApplicant.getResumePath());
            cleanupReplacedPhoto(previousPhotoPath, savedApplicant.getPhotoPath());

            java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("applicantId", savedApplicant.getApplicantId());
            appendStoredResumePayload(data, savedApplicant.getResumePath(), draftResumeName);
            appendStoredPhotoPayload(data, savedApplicant.getPhotoPath(), "");
            int status = isUpdate ? 200 : 201;
            String message = isUpdate ? "Applicant profile updated successfully!" : "Applicant profile created successfully!";
            JsonResponseUtil.writeJsonResponse(response, status, true, message, data);

        } catch (IllegalArgumentException e) {
            if (isNotEmpty(newResumePath)) {
                deleteStoredFile(newResumePath);
            }
            logInfo("Profile operation failed: " + e.getMessage());
            JsonResponseUtil.writeResponse(response, 400, false, e.getMessage(), null);
        } catch (Exception e) {
            if (isNotEmpty(newResumePath)) {
                deleteStoredFile(newResumePath);
            }
            logError("Unexpected error during profile operation", e);
            JsonResponseUtil.writeResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    /**
     * 处理multipart请求（文件上传）
     */
    private void handleMultipartRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String newResumePath = null;
        String newPhotoPath = null;
        boolean clearDraftAfterSave = false;
        String currentResumeName = "";
        String currentPhotoName = "";
        try {
            // 获取当前登录用户
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeResponse(response, 401, false, "Please login first", null);
                return;
            }

            // 查询现有档案
            Optional<Applicant> applicantOpt = applicantDao.findByUserId(currentUser.getUserId());
            boolean isUpdate = applicantOpt.isPresent();
            Applicant applicant = isUpdate ? applicantOpt.get() : new Applicant();
            if (!isUpdate) {
                applicant.setUserId(currentUser.getUserId());
            }
            String previousResumePath = applicant.getResumePath();
            String previousPhotoPath = applicant.getPhotoPath();
            HttpSession session = request.getSession(false);
            currentResumeName = getDraftResumeName(session);

            // 获取文本参数
            String fullName = request.getParameter("fullName");
            String studentId = request.getParameter("studentId");
            String department = request.getParameter("department");
            String program = request.getParameter("program");
            String gpa = request.getParameter("gpa");
            String skills = request.getParameter("skills");
            String phone = request.getParameter("phone");
            String address = request.getParameter("address");
            String experience = request.getParameter("experience");
            String motivation = request.getParameter("motivation");
            boolean removePhoto = isTruthyFlag(request.getParameter("removePhoto"));

            String normalizedFullName = normalizeInput(fullName);
            String normalizedStudentId = normalizeInput(studentId);
            String normalizedDepartment = normalizeInput(department);
            String normalizedProgram = normalizeInput(program);
            String normalizedGpa = normalizeInput(gpa);
            String normalizedSkills = normalizeInput(skills);
            String normalizedPhone = normalizeInput(phone);
            String normalizedAddress = normalizeInput(address);
            String normalizedExperience = normalizeInput(experience);
            String normalizedMotivation = normalizeInput(motivation);

            if (isUpdate) {
                String updateValidationError = validatePartialInput(
                        fullName, studentId, department, program,
                        gpa, skills, phone, address, experience, motivation
                );
                if (updateValidationError != null) {
                    logInfo("Partial update validation failed: " + updateValidationError);
                    JsonResponseUtil.writeResponse(response, 400, false, updateValidationError, null);
                    return;
                }
            } else {
                String createValidationError = validateInput(
                        normalizedFullName,
                        normalizedStudentId,
                        normalizedDepartment,
                        normalizedProgram,
                        normalizedGpa,
                        normalizedSkills,
                        normalizedPhone,
                        normalizedAddress,
                        normalizedExperience,
                        normalizedMotivation,
                        true
                );
                if (createValidationError != null) {
                    logInfo("Create validation failed: " + createValidationError);
                    JsonResponseUtil.writeResponse(response, 400, false, createValidationError, null);
                    return;
                }

                Optional<Applicant> existingWithStudentId = applicantDao.findByStudentId(normalizedStudentId);
                if (existingWithStudentId.isPresent()) {
                    JsonResponseUtil.writeResponse(response, 400, false, "Student ID already exists", null);
                    return;
                }
            }

            // 处理文件上传
            Part filePart = request.getPart("resume");
            if (filePart != null && filePart.getSize() > 0) {
                // 验证文件
                String fileError = validateResumeFile(filePart);
                if (fileError != null) {
                    JsonResponseUtil.writeResponse(response, 400, false, fileError, null);
                    return;
                }

                // 保存文件
                newResumePath = saveResumeFile(filePart, currentUser.getUserId());
                applicant.setResumePath(newResumePath);
                currentResumeName = extractFileName(filePart);
                clearDraftAfterSave = hasDraftResume(session);
                logInfo("Resume prepared for profile save: " + newResumePath);
            } else if (hasDraftResume(session)) {
                newResumePath = copyDraftResumeToFinal(getDraftResumePath(session), currentUser.getUserId(), currentResumeName);
                applicant.setResumePath(newResumePath);
                clearDraftAfterSave = true;
                logInfo("Resume draft prepared for profile save: " + newResumePath);
            }

            if (!isNotEmpty(applicant.getResumePath())) {
                JsonResponseUtil.writeResponse(response, 400, false, "Please upload your resume before saving your profile.", null);
                return;
            }

            if (removePhoto) {
                applicant.setPhotoPath("");
            }

            Part photoPart = request.getPart("photo");
            if (photoPart != null && photoPart.getSize() > 0) {
                String photoError = validatePhotoFile(photoPart);
                if (photoError != null) {
                    JsonResponseUtil.writeResponse(response, 400, false, photoError, null);
                    return;
                }
                newPhotoPath = savePhotoFile(photoPart, currentUser.getUserId());
                applicant.setPhotoPath(newPhotoPath);
                currentPhotoName = extractFileName(photoPart);
                logInfo("Photo prepared for profile save: " + newPhotoPath);
            }

            // 更新文本字段（如果有提供）
            if (isUpdate) {
                if (fullName != null) {
                    applicant.setFullName(normalizedFullName);
                }
                if (studentId != null) {
                    Optional<Applicant> existingWithStudentId = applicantDao.findByStudentId(normalizedStudentId);
                    if (existingWithStudentId.isPresent() && !existingWithStudentId.get().getApplicantId().equals(applicant.getApplicantId())) {
                        JsonResponseUtil.writeResponse(response, 400, false, "Student ID already exists", null);
                        return;
                    }
                    applicant.setStudentId(normalizedStudentId);
                }
                if (department != null) {
                    applicant.setDepartment(normalizedDepartment);
                }
                if (program != null) {
                    applicant.setProgram(normalizedProgram);
                }
                if (gpa != null) {
                    applicant.setGpa(normalizedGpa);
                }
                if (phone != null) {
                    applicant.setPhone(normalizedPhone);
                }
                if (address != null) {
                    applicant.setAddress(normalizedAddress);
                }
                if (experience != null) {
                    applicant.setExperience(normalizedExperience);
                }
                if (motivation != null) {
                    applicant.setMotivation(normalizedMotivation);
                }
                if (skills != null) {
                    applicant.setSkills(parseSkills(normalizedSkills));
                }
            } else {
                applicant.setFullName(normalizedFullName);
                applicant.setStudentId(normalizedStudentId);
                applicant.setDepartment(normalizedDepartment);
                applicant.setProgram(normalizedProgram);
                applicant.setGpa(normalizedGpa);
                applicant.setPhone(normalizedPhone);
                applicant.setAddress(normalizedAddress);
                applicant.setExperience(normalizedExperience);
                applicant.setMotivation(normalizedMotivation);
                applicant.setSkills(parseSkills(normalizedSkills));
            }

            Applicant savedApplicant;
            if (isUpdate) {
                applicant.setUpdatedAt(LocalDateTime.now());
                savedApplicant = applicantDao.update(applicant);
            } else {
                savedApplicant = applicantDao.create(applicant);
            }

            if (clearDraftAfterSave) {
                clearDraftResumeState(session, true);
            }
            cleanupReplacedResume(previousResumePath, savedApplicant.getResumePath());
            cleanupReplacedPhoto(previousPhotoPath, savedApplicant.getPhotoPath());

            logInfo("Applicant profile saved successfully for user: " + currentUser.getUsername());

            java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("applicantId", savedApplicant.getApplicantId());
            appendStoredResumePayload(data, savedApplicant.getResumePath(), currentResumeName);
            appendStoredPhotoPayload(data, savedApplicant.getPhotoPath(), currentPhotoName);

            int status = isUpdate ? 200 : 201;
            String message = isUpdate ? "Applicant profile updated successfully!" : "Applicant profile created successfully!";
            JsonResponseUtil.writeJsonResponse(response, status, true, message, data);

        } catch (IllegalArgumentException e) {
            if (isNotEmpty(newResumePath)) {
                deleteStoredFile(newResumePath);
            }
            if (isNotEmpty(newPhotoPath)) {
                deleteStoredFile(newPhotoPath);
            }
            logInfo("Resume save failed: " + e.getMessage());
            JsonResponseUtil.writeResponse(response, 400, false, e.getMessage(), null);
        } catch (ServletException e) {
            if (isNotEmpty(newResumePath)) {
                deleteStoredFile(newResumePath);
            }
            if (isNotEmpty(newPhotoPath)) {
                deleteStoredFile(newPhotoPath);
            }
            // 处理文件大小超限异常
            String message = e.getMessage();
            if (message != null && message.toLowerCase().contains("size")) {
                logInfo("File size exceeded: " + message);
                JsonResponseUtil.writeResponse(response, 413, false, "File size exceeds the maximum limit of 10MB. Please upload a smaller file.", null);
            } else {
                logError("Servlet error during profile save", e);
                JsonResponseUtil.writeResponse(response, 400, false, "File upload failed. " + e.getMessage(), null);
            }
        } catch (Exception e) {
            if (isNotEmpty(newResumePath)) {
                deleteStoredFile(newResumePath);
            }
            if (isNotEmpty(newPhotoPath)) {
                deleteStoredFile(newPhotoPath);
            }
            logError("Unexpected error during profile save", e);
            JsonResponseUtil.writeResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    private void handleDraftResumeUpload(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            User currentUser = getCurrentUser(request);
            if (currentUser == null) {
                JsonResponseUtil.writeResponse(response, 401, false, "Please login first", null);
                return;
            }

            Part filePart = request.getPart("resume");
            if (filePart == null || filePart.getSize() <= 0) {
                JsonResponseUtil.writeResponse(response, 400, false, "Please choose a resume file first.", null);
                return;
            }

            String fileError = validateResumeFile(filePart);
            if (fileError != null) {
                JsonResponseUtil.writeResponse(response, 400, false, fileError, null);
                return;
            }

            HttpSession session = request.getSession();
            clearDraftResumeState(session, true);

            String originalFileName = extractFileName(filePart);
            String draftResumePath = saveDraftFile(filePart, currentUser.getUserId());
            storeDraftResumeState(session, draftResumePath, originalFileName);

            JsonResponseUtil.writeJsonResponse(
                    response,
                    200,
                    true,
                    "Resume draft uploaded successfully!",
                    buildDraftResumePayload(request)
            );
        } catch (IllegalArgumentException e) {
            logInfo("Draft resume upload failed: " + e.getMessage());
            JsonResponseUtil.writeResponse(response, 400, false, e.getMessage(), null);
        } catch (ServletException e) {
            String message = e.getMessage();
            if (message != null && message.toLowerCase().contains("size")) {
                logInfo("Draft file size exceeded: " + message);
                JsonResponseUtil.writeResponse(response, 413, false, "File size exceeds the maximum limit of 10MB. Please upload a smaller file.", null);
            } else {
                logError("Servlet error during draft resume upload", e);
                JsonResponseUtil.writeResponse(response, 400, false, "File upload failed. " + e.getMessage(), null);
            }
        } catch (Exception e) {
            logError("Unexpected error during draft resume upload", e);
            JsonResponseUtil.writeResponse(response, 500, false, "An error occurred. Please try again later.", null);
        }
    }

    /**
     * 验证上传的简历文件
     */
    private String validateResumeFile(Part filePart) {
        return validateFile(
                filePart,
                ALLOWED_CONTENT_TYPES,
                ALLOWED_EXTENSIONS,
                MAX_FILE_SIZE,
                "PDF, DOC, and DOCX",
                10
        );
    }

    /**
     * 验证上传的照片文件
     */
    private String validatePhotoFile(Part filePart) {
        return validateFile(
                filePart,
                ALLOWED_PHOTO_CONTENT_TYPES,
                ALLOWED_PHOTO_EXTENSIONS,
                MAX_PHOTO_SIZE,
                "JPG, JPEG, PNG, and WEBP",
                5
        );
    }

    private String validateFile(
            Part filePart,
            List<String> allowedContentTypes,
            List<String> allowedExtensions,
            long maxSize,
            String allowedDescription,
            int maxSizeMb
    ) {
        String contentType = filePart.getContentType();
        String fileName = extractFileName(filePart);

        if (contentType == null || !allowedContentTypes.contains(contentType.toLowerCase())) {
            return "Invalid file type. Only " + allowedDescription + " files are allowed.";
        }

        String lowerFileName = fileName.toLowerCase();
        boolean hasValidExtension = allowedExtensions.stream()
                .anyMatch(lowerFileName::endsWith);
        if (!hasValidExtension) {
            return "Invalid file extension. Only " + allowedDescription + " files are allowed.";
        }

        if (filePart.getSize() > maxSize) {
            return "File size exceeds " + maxSizeMb + "MB limit.";
        }

        return null;
    }

    /**
     * 保存上传的简历文件
     */
    private String saveResumeFile(Part filePart, String userId) throws IOException {
        String fileName = extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "", ".pdf", "resume");

        ensureDirectoryExists(UPLOAD_DIR);

        File file = new File(UPLOAD_DIR, newFileName);
        filePart.write(file.getAbsolutePath());

        return "resumes/" + newFileName;
    }

    /**
     * 保存上传的头像文件
     */
    private String savePhotoFile(Part filePart, String userId) throws IOException {
        String fileName = extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "", ".jpg", "photo");

        ensureDirectoryExists(PHOTO_UPLOAD_DIR);

        File file = new File(PHOTO_UPLOAD_DIR, newFileName);
        filePart.write(file.getAbsolutePath());

        return "photos/" + newFileName;
    }

    private String saveDraftFile(Part filePart, String userId) throws IOException {
        String fileName = extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "draft_", ".pdf", "resume");

        ensureDirectoryExists(DRAFT_UPLOAD_DIR);

        File file = new File(DRAFT_UPLOAD_DIR, newFileName);
        filePart.write(file.getAbsolutePath());

        return "resume-drafts/" + newFileName;
    }

    private String copyDraftResumeToFinal(String draftRelativePath, String userId, String originalFileName) throws IOException {
        File draftFile = resolveStoredFile(draftRelativePath);
        if (draftFile == null || !draftFile.exists() || !draftFile.isFile()) {
            throw new IllegalArgumentException("The pending resume draft is unavailable. Please choose the file again.");
        }

        String sourceFileName = isNotEmpty(originalFileName) ? originalFileName : buildDisplayFileName(draftRelativePath, draftFile.getName());
        String newFileName = buildStoredFileName(sourceFileName, userId, "", ".pdf", "resume");
        ensureDirectoryExists(UPLOAD_DIR);

        File finalFile = new File(UPLOAD_DIR, newFileName);
        Files.copy(draftFile.toPath(), finalFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return "resumes/" + newFileName;
    }

    private String buildStoredFileName(String originalFileName, String userId, String prefix, String defaultExtension, String fallbackBaseName) {
        String extension = extractExtension(originalFileName, defaultExtension);
        String safeBaseName = sanitizeBaseName(originalFileName, fallbackBaseName);
        return prefix + userId + "_" + System.currentTimeMillis() + "_" + safeBaseName + extension;
    }

    private String extractExtension(String fileName, String defaultExtension) {
        String safeDefaultExtension = isNotEmpty(defaultExtension) ? defaultExtension.toLowerCase() : ".bin";
        if (fileName == null) {
            return safeDefaultExtension;
        }
        int dotIndex = fileName.lastIndexOf(".");
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return safeDefaultExtension;
        }
        return fileName.substring(dotIndex).toLowerCase();
    }

    private String sanitizeBaseName(String fileName, String fallbackBaseName) {
        String safeFileName = fileName != null ? fileName.trim() : "";
        int slashIndex = Math.max(safeFileName.lastIndexOf('/'), safeFileName.lastIndexOf('\\'));
        if (slashIndex >= 0 && slashIndex < safeFileName.length() - 1) {
            safeFileName = safeFileName.substring(slashIndex + 1);
        }

        int dotIndex = safeFileName.lastIndexOf('.');
        String baseName = dotIndex > 0 ? safeFileName.substring(0, dotIndex) : safeFileName;
        baseName = baseName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        baseName = baseName.replaceAll("_+", "_");
        baseName = baseName.replaceAll("^[._-]+", "");
        baseName = baseName.replaceAll("[._-]+$", "");

        if (!isNotEmpty(baseName)) {
            return isNotEmpty(fallbackBaseName) ? fallbackBaseName : "file";
        }
        if (baseName.length() > 60) {
            return baseName.substring(0, 60);
        }
        return baseName;
    }

    private File resolveStoredFile(String relativePath) {
        if (!isNotEmpty(relativePath)) {
            return null;
        }
        return new File(StoragePaths.getDataDir(), relativePath);
    }

    private long getStoredFileSize(String relativePath) {
        File file = resolveStoredFile(relativePath);
        if (file == null || !file.exists() || !file.isFile()) {
            return 0L;
        }
        return file.length();
    }

    private String buildDisplayFileName(String relativePath, String fallbackName) {
        String safeFallbackName = fallbackName != null ? fallbackName.trim() : "";
        if (isNotEmpty(safeFallbackName)) {
            return safeFallbackName;
        }

        File file = resolveStoredFile(relativePath);
        String fileName = file != null ? file.getName() : "";
        if (!isNotEmpty(fileName) && isNotEmpty(relativePath)) {
            int slashIndex = Math.max(relativePath.lastIndexOf('/'), relativePath.lastIndexOf('\\'));
            fileName = slashIndex >= 0 ? relativePath.substring(slashIndex + 1) : relativePath;
        }

        if (!isNotEmpty(fileName)) {
            return "";
        }

        String normalizedName = fileName.replaceFirst("^(draft_)?[^_]+_\\d+_", "");
        return isNotEmpty(normalizedName) ? normalizedName : fileName;
    }

    private void appendStoredResumePayload(java.util.Map<String, Object> data, String resumePath, String fallbackName) {
        String safeResumePath = resumePath != null ? resumePath : "";
        data.put("resumePath", safeResumePath);
        data.put("resumeName", buildDisplayFileName(safeResumePath, fallbackName));
        data.put("resumeSize", getStoredFileSize(safeResumePath));
    }

    private void appendStoredPhotoPayload(java.util.Map<String, Object> data, String photoPath, String fallbackName) {
        String safePhotoPath = photoPath != null ? photoPath : "";
        data.put("photoPath", safePhotoPath);
        data.put("photoName", buildDisplayFileName(safePhotoPath, fallbackName));
        data.put("photoSize", getStoredFileSize(safePhotoPath));
    }

    private void deleteStoredFile(String relativePath) {
        File file = resolveStoredFile(relativePath);
        if (file != null && file.exists() && !file.delete()) {
            file.deleteOnExit();
        }
    }

    private void cleanupReplacedResume(String previousResumePath, String currentResumePath) {
        if (!isNotEmpty(previousResumePath)) {
            return;
        }
        String safeCurrentResumePath = currentResumePath != null ? currentResumePath.trim() : "";
        if (previousResumePath.equals(safeCurrentResumePath)) {
            return;
        }
        deleteStoredFile(previousResumePath);
    }

    private void cleanupReplacedPhoto(String previousPhotoPath, String currentPhotoPath) {
        if (!isNotEmpty(previousPhotoPath)) {
            return;
        }
        String safeCurrentPhotoPath = currentPhotoPath != null ? currentPhotoPath.trim() : "";
        if (previousPhotoPath.equals(safeCurrentPhotoPath)) {
            return;
        }
        deleteStoredFile(previousPhotoPath);
    }

    private boolean isPhotoAssetRequest(HttpServletRequest request) {
        String asset = request.getParameter(PHOTO_ASSET_PARAM);
        return PHOTO_ASSET_VALUE.equalsIgnoreCase(asset);
    }

    private void streamProfilePhoto(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Optional<Applicant> applicantOpt = applicantDao.findByUserId(currentUser.getUserId());
        if (applicantOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        Applicant applicant = applicantOpt.get();
        String photoPath = applicant.getPhotoPath();
        if (!isNotEmpty(photoPath)) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        File file = resolveStoredFile(photoPath);
        if (file == null || !file.exists() || !file.isFile()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = Files.probeContentType(file.toPath());
        if (!isNotEmpty(contentType) || !contentType.startsWith("image/")) {
            contentType = detectPhotoContentType(file.getName());
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(contentType);
        response.setHeader("Cache-Control", "no-store");
        response.setContentLengthLong(file.length());
        Files.copy(file.toPath(), response.getOutputStream());
        response.getOutputStream().flush();
    }

    private String detectPhotoContentType(String fileName) {
        String safeName = fileName != null ? fileName.toLowerCase() : "";
        if (safeName.endsWith(".png")) {
            return "image/png";
        }
        if (safeName.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private boolean isDraftResumeRequest(HttpServletRequest request) {
        String draftFlag = request.getParameter(DRAFT_RESUME_FLAG);
        if (draftFlag == null) {
            return false;
        }
        return "true".equalsIgnoreCase(draftFlag) || "1".equals(draftFlag);
    }

    private void storeDraftResumeState(HttpSession session, String draftResumePath, String originalFileName) {
        if (session == null) {
            return;
        }
        session.setAttribute(SESSION_DRAFT_RESUME_PATH, draftResumePath);
        session.setAttribute(SESSION_DRAFT_RESUME_NAME, originalFileName != null ? originalFileName : "");
    }

    private void clearDraftResumeState(HttpSession session, boolean deleteFile) {
        if (session == null) {
            return;
        }
        String draftResumePath = getDraftResumePath(session);
        if (deleteFile && isNotEmpty(draftResumePath)) {
            deleteStoredFile(draftResumePath);
        }
        session.removeAttribute(SESSION_DRAFT_RESUME_PATH);
        session.removeAttribute(SESSION_DRAFT_RESUME_NAME);
    }

    private String getDraftResumePath(HttpSession session) {
        if (session == null) {
            return "";
        }
        Object value = session.getAttribute(SESSION_DRAFT_RESUME_PATH);
        return value instanceof String ? ((String) value).trim() : "";
    }

    private String getDraftResumeName(HttpSession session) {
        if (session == null) {
            return "";
        }
        Object value = session.getAttribute(SESSION_DRAFT_RESUME_NAME);
        return value instanceof String ? ((String) value).trim() : "";
    }

    private boolean hasDraftResume(HttpSession session) {
        return isNotEmpty(getDraftResumePath(session));
    }

    private java.util.Map<String, Object> buildDraftResumePayload(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        java.util.LinkedHashMap<String, Object> data = new java.util.LinkedHashMap<>();
        String pendingResumePath = getDraftResumePath(session);
        data.put("pendingResumePath", pendingResumePath);
        data.put("pendingResumeName", buildDisplayFileName(pendingResumePath, getDraftResumeName(session)));
        data.put("pendingResumeSize", getStoredFileSize(pendingResumePath));
        data.put("hasPendingResume", hasDraftResume(session));
        return data;
    }

    /**
     * 从Part中提取文件名
     */
    private String extractFileName(Part part) {
        String contentDisposition = part.getHeader("content-disposition");
        if (contentDisposition != null) {
            for (String token : contentDisposition.split(";")) {
                token = token.trim();
                if (token.startsWith("filename=")) {
                    String fileName = token.substring(9);
                    // 移除可能的引号
                    if (fileName.startsWith("\"") && fileName.endsWith("\"")) {
                        fileName = fileName.substring(1, fileName.length() - 1);
                    }
                    return fileName;
                }
            }
        }
        // 如果无法从header获取，使用原始文件名
        String submittedFileName = part.getSubmittedFileName();
        return submittedFileName != null ? submittedFileName : "resume";
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        if (isDraftResumeRequest(request)) {
            handleDraftResumeUpload(request, response);
            return;
        }

        // 检查是否是multipart请求
        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase().contains("multipart/form-data")) {
            handleMultipartRequest(request, response);
            return;
        }

        handleFormRequest(request, response, true);
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        if (!isDraftResumeRequest(request)) {
            JsonResponseUtil.writeJsonResponse(response, 405, false, "Delete is not supported for this endpoint.", null);
            return;
        }

        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeResponse(response, 401, false, "Please login first", null);
            return;
        }

        clearDraftResumeState(request.getSession(false), true);
        JsonResponseUtil.writeJsonResponse(
                response,
                200,
                true,
                "Pending resume changes discarded.",
                buildDraftResumePayload(request)
        );
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

    private String normalizeInput(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> parseSkills(String skills) {
        if (skills == null || skills.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(skills.split("[;,]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String validatePartialInput(
            String fullNameRaw,
            String studentIdRaw,
            String departmentRaw,
            String programRaw,
            String gpaRaw,
            String skillsRaw,
            String phoneRaw,
            String addressRaw,
            String experienceRaw,
            String motivationRaw
    ) {
        if (fullNameRaw != null) {
            String fullName = normalizeInput(fullNameRaw);
            if (fullName == null) {
                return "Full name cannot be empty.";
            }
            String fullNameError = validateFullName(fullName);
            if (fullNameError != null) {
                return fullNameError;
            }
        }

        if (studentIdRaw != null) {
            String studentId = normalizeInput(studentIdRaw);
            if (studentId == null) {
                return "Student ID cannot be empty.";
            }
            String studentIdError = validateStudentId(studentId);
            if (studentIdError != null) {
                return studentIdError;
            }
        }

        if (departmentRaw != null) {
            String department = normalizeInput(departmentRaw);
            if (department == null) {
                return "Department cannot be empty.";
            }
            String departmentError = validateDepartment(department);
            if (departmentError != null) {
                return departmentError;
            }
        }

        if (programRaw != null) {
            String program = normalizeInput(programRaw);
            if (program == null) {
                return "Program cannot be empty.";
            }
            String programError = validateProgram(program);
            if (programError != null) {
                return programError;
            }
        }

        String gpa = normalizeInput(gpaRaw);
        if (gpaRaw != null && gpa == null) {
            return "GPA cannot be empty.";
        }
        if (gpaRaw != null && gpa != null) {
            String gpaError = validateGpa(gpa);
            if (gpaError != null) {
                return gpaError;
            }
        }

        String skills = normalizeInput(skillsRaw);
        if (skillsRaw != null && skills == null) {
            return "Skills cannot be empty.";
        }
        if (skillsRaw != null && skills != null) {
            String skillsError = validateSkills(skills);
            if (skillsError != null) {
                return skillsError;
            }
        }

        String phone = normalizeInput(phoneRaw);
        if (phoneRaw != null && phone == null) {
            return "Phone number cannot be empty.";
        }
        if (phoneRaw != null && phone != null) {
            String phoneError = validatePhone(phone);
            if (phoneError != null) {
                return phoneError;
            }
        }

        String address = normalizeInput(addressRaw);
        if (addressRaw != null && address != null) {
            String addressError = validateAddress(address);
            if (addressError != null) {
                return addressError;
            }
        }

        String experience = normalizeInput(experienceRaw);
        if (experienceRaw != null && experience == null) {
            return "Related experience cannot be empty.";
        }
        if (experienceRaw != null && experience != null) {
            String experienceError = validateLongTextField(experience, "Related experience");
            if (experienceError != null) {
                return experienceError;
            }
        }

        String motivation = normalizeInput(motivationRaw);
        if (motivationRaw != null && motivation == null) {
            return "Motivation cannot be empty.";
        }
        if (motivationRaw != null && motivation != null) {
            String motivationError = validateLongTextField(motivation, "Motivation");
            if (motivationError != null) {
                return motivationError;
            }
        }

        return null;
    }

    private String validateInput(
            String fullName,
            String studentId,
            String department,
            String program,
            String gpa,
            String skills,
            String phone,
            String address,
            String experience,
            String motivation,
            boolean requireRequiredFields
    ) {
        if (requireRequiredFields && fullName == null) {
            return "Full name is required.";
        }
        if (fullName != null) {
            String fullNameError = validateFullName(fullName);
            if (fullNameError != null) {
                return fullNameError;
            }
        }

        if (requireRequiredFields && studentId == null) {
            return "Student ID is required.";
        }
        if (studentId != null) {
            String studentIdError = validateStudentId(studentId);
            if (studentIdError != null) {
                return studentIdError;
            }
        }

        if (requireRequiredFields && department == null) {
            return "Department is required.";
        }
        if (department != null) {
            String departmentError = validateDepartment(department);
            if (departmentError != null) {
                return departmentError;
            }
        }

        if (requireRequiredFields && program == null) {
            return "Program is required.";
        }
        if (program != null) {
            String programError = validateProgram(program);
            if (programError != null) {
                return programError;
            }
        }

        if (requireRequiredFields && gpa == null) {
            return "GPA is required.";
        }
        if (gpa != null) {
            String gpaError = validateGpa(gpa);
            if (gpaError != null) {
                return gpaError;
            }
        }
        if (requireRequiredFields && skills == null) {
            return "Skills are required.";
        }
        if (skills != null) {
            String skillsError = validateSkills(skills);
            if (skillsError != null) {
                return skillsError;
            }
        }
        if (requireRequiredFields && phone == null) {
            return "Phone number is required.";
        }
        if (phone != null) {
            String phoneError = validatePhone(phone);
            if (phoneError != null) {
                return phoneError;
            }
        }
        if (address != null) {
            String addressError = validateAddress(address);
            if (addressError != null) {
                return addressError;
            }
        }
        if (requireRequiredFields && experience == null) {
            return "Related experience is required.";
        }
        if (experience != null) {
            String experienceError = validateLongTextField(experience, "Related experience");
            if (experienceError != null) {
                return experienceError;
            }
        }
        if (requireRequiredFields && motivation == null) {
            return "Motivation is required.";
        }
        if (motivation != null) {
            String motivationError = validateLongTextField(motivation, "Motivation");
            if (motivationError != null) {
                return motivationError;
            }
        }

        return null;
    }

    private String validateFullName(String value) {
        if (value.length() < 2) {
            return "Full name must be at least 2 characters.";
        }
        if (value.length() > 100) {
            return "Full name must be 100 characters or fewer.";
        }
        if (!hasLetterOrCjk(value)) {
            return "Full name must include at least one letter.";
        }
        if (!value.matches("^[A-Za-z\\u00C0-\\u024F\\u4E00-\\u9FFF\\s.'-]+$")) {
            return "Full name contains unsupported characters.";
        }
        if (hasExcessiveRepeatedChars(value, 4)) {
            return "Full name contains too many repeated characters.";
        }
        return null;
    }

    private String validateStudentId(String value) {
        if (!value.matches("^\\d{10}$")) {
            return "Student ID must be exactly 10 digits, for example 2023213039.";
        }
        if (!value.matches("^20\\d{8}$")) {
            return "Student ID should start with 20, for example 2023213051.";
        }
        int year = Integer.parseInt(value.substring(0, 4));
        if (year < 2010 || year > 2099) {
            return "Student ID year appears invalid. Please check the first 4 digits.";
        }
        if (value.matches("^(\\d)\\1{9}$")) {
            return "Student ID appears invalid. Please check your official 10-digit student number.";
        }
        return null;
    }

    private String validateDepartment(String value) {
        if (value.length() < 2) {
            return "Department must be at least 2 characters.";
        }
        if (value.length() > 100) {
            return "Department must be 100 characters or fewer.";
        }
        if (!hasLetterOrCjk(value)) {
            return "Department should include letters.";
        }
        if (!value.matches("^[A-Za-z0-9\\u00C0-\\u024F\\u4E00-\\u9FFF\\s&(),./'-]+$")) {
            return "Department contains unsupported characters.";
        }
        if (hasExcessiveRepeatedChars(value, 6)) {
            return "Department contains too many repeated characters.";
        }
        return null;
    }

    private String validateProgram(String value) {
        if (!ALLOWED_PROGRAMS.contains(value)) {
            return "Please select a valid program option.";
        }
        return null;
    }

    private String validateGpa(String value) {
        if (value.length() > 20) {
            return "GPA must be 20 characters or fewer.";
        }
        if (!value.matches("^[0-9.,/\\s]+$")) {
            return "GPA may only include digits, spaces, decimal separators, and '/'.";
        }

        String normalized = value.replaceAll("\\s+", "").replace(",", ".");
        String[] parts = normalized.split("/", -1);
        if (parts.length > 2) {
            return "GPA format is invalid. Use one optional '/'.";
        }
        if (!parts[0].matches("^\\d{1,3}(\\.\\d{1,2})?$")) {
            return "GPA value supports up to 2 decimal places.";
        }

        double actual = Double.parseDouble(parts[0]);
        if (actual < 0) {
            return "GPA cannot be negative.";
        }

        if (parts.length == 2) {
            if (!parts[1].matches("^\\d{1,3}(\\.\\d{1,2})?$")) {
                return "GPA scale supports up to 2 decimal places.";
            }
            double scale = Double.parseDouble(parts[1]);
            if (scale < 4 || scale > 100) {
                return "GPA scale should be between 4 and 100.";
            }
            if (actual > scale) {
                return "GPA value cannot be greater than the GPA scale.";
            }
        } else if (actual > 4.3) {
            return "For GPA above 4.3, please include scale (for example 85/100).";
        }

        return null;
    }

    private String validateSkills(String value) {
        if (value.length() > 300) {
            return "Skills must be 300 characters or fewer.";
        }
        if (value.matches("(^[;,].*|.*[;,]\\s*[;,].*|.*[;,]\\s*$)")) {
            return "Please remove empty skill items between separators.";
        }

        List<String> items = parseSkills(value);
        if (items.size() > 12) {
            return "Please list up to 12 skills.";
        }

        Set<String> seen = new HashSet<>();
        for (String skill : items) {
            if (skill.length() < 2 || skill.length() > 40) {
                return "Each skill should be 2 to 40 characters.";
            }
            if (!hasLetterOrCjk(skill)) {
                return "Each skill should include letters.";
            }
            if (!skill.matches("^[A-Za-z0-9\\u00C0-\\u024F\\u4E00-\\u9FFF+#&./\\-\\s]+$")) {
                return "Skills contain unsupported characters.";
            }
            if (hasExcessiveRepeatedChars(skill, 5)) {
                return "A skill item has too many repeated characters.";
            }
            String normalized = skill.toLowerCase().replaceAll("\\s+", " ").trim();
            if (!seen.add(normalized)) {
                return "Duplicate skills found. Please keep each skill only once.";
            }
        }

        return null;
    }

    private String validatePhone(String value) {
        if (value.length() > 30) {
            return "Phone number must be 30 characters or fewer.";
        }
        if (!value.matches("^[\\d+\\-()./\\s]+$")) {
            return "Phone number may only include digits, spaces, and + - ( ) . /.";
        }
        if (countOccurrences(value, '+') > 1) {
            return "Phone number can contain only one '+'.";
        }
        if (value.indexOf('+') > 0) {
            return "If used, '+' must be at the beginning.";
        }
        if (!hasBalancedParentheses(value)) {
            return "Phone number parentheses are not balanced.";
        }

        String digits = value.replaceAll("\\D", "");
        if (digits.length() < 8 || digits.length() > 15) {
            return "Phone number should contain 8 to 15 digits.";
        }
        if (digits.matches("^(\\d)\\1+$")) {
            return "Phone number appears invalid. Please check repeated digits.";
        }
        if (value.startsWith("+") && digits.length() < 10) {
            return "International format should usually contain at least 10 digits.";
        }
        return null;
    }

    private String validateAddress(String value) {
        if (value.length() > 200) {
            return "Address must be 200 characters or fewer.";
        }
        if (value.length() < 5) {
            return "Address should be at least 5 characters if provided.";
        }
        if (!hasLetterOrCjk(value)) {
            return "Address should include letters.";
        }
        if (hasOnlyPunctuationAndSpace(value)) {
            return "Address cannot contain only punctuation.";
        }
        if (!value.matches("^[A-Za-z0-9\\u00C0-\\u024F\\u4E00-\\u9FFF\\s#&(),./:'-]+$")) {
            return "Address contains unsupported characters.";
        }
        if (hasExcessiveRepeatedChars(value, 8)) {
            return "Address contains too many repeated characters.";
        }
        return null;
    }

    private String validateLongTextField(String value, String label) {
        if (value.length() > 1200) {
            return label + " must be 1200 characters or fewer.";
        }
        if (value.length() < 20) {
            return label + " should be at least 20 characters if provided.";
        }
        if (getTextContentUnits(value) < 10) {
            return label + " should contain more detail (about 10 words/characters).";
        }
        if (hasExcessiveRepeatedChars(value, 8)) {
            return label + " contains too many repeated characters.";
        }
        return null;
    }

    private boolean hasLetterOrCjk(String value) {
        return value != null && value.matches(".*[A-Za-z\\u00C0-\\u024F\\u4E00-\\u9FFF].*");
    }

    private boolean hasOnlyPunctuationAndSpace(String value) {
        return value != null && !value.matches(".*[A-Za-z0-9\\u00C0-\\u024F\\u4E00-\\u9FFF].*");
    }

    private boolean hasExcessiveRepeatedChars(String value, int threshold) {
        if (value == null) {
            return false;
        }
        int safeThreshold = Math.max(1, threshold);
        return value.matches(".*(.)\\1{" + safeThreshold + ",}.*");
    }

    private boolean hasBalancedParentheses(String value) {
        int balance = 0;
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '(') {
                balance++;
            } else if (c == ')') {
                balance--;
                if (balance < 0) {
                    return false;
                }
            }
        }
        return balance == 0;
    }

    private int countOccurrences(String value, char target) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) == target) {
                count++;
            }
        }
        return count;
    }

    private int getTextContentUnits(String value) {
        if (value == null || value.isEmpty()) {
            return 0;
        }

        int cjkChars = value.replaceAll("[^\\u4E00-\\u9FFF]", "").length();
        String latinPart = value.replaceAll("[\\u4E00-\\u9FFF]", " ");
        String[] tokens = latinPart.split("[^A-Za-z0-9'-]+");

        int latinWords = 0;
        for (String token : tokens) {
            if (!token.isEmpty()) {
                latinWords++;
            }
        }

        return cjkChars + latinWords;
    }

    /**
     * 档案完整性验证结果
     */
    private static class CompletenessResult {
        int completeness;
        List<String> missingFields;

        CompletenessResult(int completeness, List<String> missingFields) {
            this.completeness = completeness;
            this.missingFields = missingFields;
        }
    }

    /**
     * 计算档案完整性
     */
    private CompletenessResult calculateCompleteness(Applicant applicant) {
        int totalFields = 12; // 总字段数
        int filledFields = 0;
        List<String> missingFields = new ArrayList<>();

        // 必填字段 (4个)
        if (isNotEmpty(applicant.getFullName())) {
            filledFields++;
        } else {
            missingFields.add("fullName");
        }
        if (isNotEmpty(applicant.getStudentId())) {
            filledFields++;
        } else {
            missingFields.add("studentId");
        }
        if (isNotEmpty(applicant.getDepartment())) {
            filledFields++;
        } else {
            missingFields.add("department");
        }
        if (isNotEmpty(applicant.getProgram())) {
            filledFields++;
        } else {
            missingFields.add("program");
        }

        // 选填字段 (8个)
        if (isNotEmpty(applicant.getGpa())) filledFields++;
        else missingFields.add("gpa");

        if (applicant.getSkills() != null && !applicant.getSkills().isEmpty()) filledFields++;
        else missingFields.add("skills");

        if (isNotEmpty(applicant.getResumePath())) filledFields++;
        else missingFields.add("resume");

        if (isNotEmpty(applicant.getPhone())) filledFields++;
        else missingFields.add("phone");

        if (isNotEmpty(applicant.getAddress())) filledFields++;
        else missingFields.add("address");

        if (isNotEmpty(applicant.getExperience())) filledFields++;
        else missingFields.add("experience");

        if (isNotEmpty(applicant.getMotivation())) filledFields++;
        else missingFields.add("motivation");

        int completeness = (int) Math.round((double) filledFields / totalFields * 100);
        return new CompletenessResult(completeness, missingFields);
    }

    private boolean isTruthyFlag(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim();
        return "true".equalsIgnoreCase(normalized) || "1".equals(normalized);
    }

    /**
     * 检查字符串是否不为空
     */
    private boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }

    /**
     * 构建申请人档案JSON数据
     */
    private String buildApplicantJson(Applicant applicant) {
        // 计算完整性
        CompletenessResult completeness = calculateCompleteness(applicant);

        StringBuilder json = new StringBuilder();
        json.append("\"applicantId\": \"").append(escapeJson(applicant.getApplicantId())).append("\", ");
        json.append("\"userId\": \"").append(escapeJson(applicant.getUserId())).append("\", ");
        json.append("\"fullName\": \"").append(escapeJson(applicant.getFullName())).append("\", ");
        json.append("\"studentId\": \"").append(escapeJson(applicant.getStudentId())).append("\", ");
        json.append("\"department\": \"").append(escapeJson(applicant.getDepartment() != null ? applicant.getDepartment() : "")).append("\", ");
        json.append("\"program\": \"").append(escapeJson(applicant.getProgram() != null ? applicant.getProgram() : "")).append("\", ");
        json.append("\"gpa\": \"").append(escapeJson(applicant.getGpa() != null ? applicant.getGpa() : "")).append("\", ");
        json.append("\"skills\": \"").append(escapeJson(applicant.getSkillsAsString())).append("\", ");
        json.append("\"resumePath\": \"").append(escapeJson(applicant.getResumePath() != null ? applicant.getResumePath() : "")).append("\", ");
        json.append("\"photoPath\": \"").append(escapeJson(applicant.getPhotoPath() != null ? applicant.getPhotoPath() : "")).append("\", ");
        json.append("\"phone\": \"").append(escapeJson(applicant.getPhone() != null ? applicant.getPhone() : "")).append("\", ");
        json.append("\"address\": \"").append(escapeJson(applicant.getAddress() != null ? applicant.getAddress() : "")).append("\", ");
        json.append("\"experience\": \"").append(escapeJson(applicant.getExperience() != null ? applicant.getExperience() : "")).append("\", ");
        json.append("\"motivation\": \"").append(escapeJson(applicant.getMotivation() != null ? applicant.getMotivation() : "")).append("\", ");

        // 添加完整性信息
        json.append("\"completeness\": ").append(completeness.completeness).append(", ");
        json.append("\"missingFields\": [");
        for (int i = 0; i < completeness.missingFields.size(); i++) {
            json.append("\"").append(completeness.missingFields.get(i)).append("\"");
            if (i < completeness.missingFields.size() - 1) {
                json.append(", ");
            }
        }
        json.append("]");
        return json.toString();
    }

    private java.util.Map<String, Object> buildApplicantPayload(Applicant applicant, HttpServletRequest request) {
        CompletenessResult completeness = calculateCompleteness(applicant);
        java.util.LinkedHashMap<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("applicantId", applicant.getApplicantId());
        data.put("userId", applicant.getUserId());
        data.put("fullName", applicant.getFullName());
        data.put("studentId", applicant.getStudentId());
        data.put("department", applicant.getDepartment() != null ? applicant.getDepartment() : "");
        data.put("program", applicant.getProgram() != null ? applicant.getProgram() : "");
        data.put("gpa", applicant.getGpa() != null ? applicant.getGpa() : "");
        data.put("skills", applicant.getSkillsAsString());
        appendStoredResumePayload(data, applicant.getResumePath(), "");
        appendStoredPhotoPayload(data, applicant.getPhotoPath(), "");
        data.put("phone", applicant.getPhone() != null ? applicant.getPhone() : "");
        data.put("address", applicant.getAddress() != null ? applicant.getAddress() : "");
        data.put("experience", applicant.getExperience() != null ? applicant.getExperience() : "");
        data.put("motivation", applicant.getMotivation() != null ? applicant.getMotivation() : "");
        data.put("completeness", completeness.completeness);
        data.put("missingFields", completeness.missingFields);
        data.putAll(buildDraftResumePayload(request));
        return data;
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
