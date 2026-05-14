package com.example.authlogin.servlet;

import com.example.authlogin.dao.ApplicantDao;
import com.example.authlogin.dao.ApplicationDao;
import com.example.authlogin.dao.JobDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Application;
import com.example.authlogin.model.Job;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * AccountProfileServlet - edits account-level display information.
 *
 * Account avatar/display name stay account-level. TA real name is shared with
 * the applicant profile full name so both editing surfaces stay consistent.
 */
@WebServlet(urlPatterns = {"/api/account/profile", "/api/account/avatar"})
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize = 1024 * 1024 * 5,
    maxRequestSize = 1024 * 1024 * 8
)
public class AccountProfileServlet extends HttpServlet {

    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024;
    private static final int USERNAME_MAX_LENGTH = 20;
    private static final int REAL_NAME_MAX_LENGTH = 100;
    private static final int PROFESSIONAL_TITLE_MAX_LENGTH = 40;
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_]{2,19}$");
    private static final String AVATAR_DIR_NAME = "account-avatars";
    private static final List<String> ALLOWED_AVATAR_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final List<String> ALLOWED_AVATAR_EXTENSIONS = Arrays.asList(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    private UserDao userDao;
    private JobDao jobDao;
    private ApplicantDao applicantDao;
    private ApplicationDao applicationDao;

    @Override
    public void init() throws ServletException {
        userDao = UserDao.getInstance();
        jobDao = JobDao.getInstance();
        applicantDao = ApplicantDao.getInstance();
        applicationDao = ApplicationDao.getInstance();
        ensureDirectoryExists(StoragePaths.getAccountAvatarDir());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }

        if (isAvatarRequest(request)) {
            streamAvatar(response, currentUser);
            return;
        }

        String sharedRealName = buildSharedRealName(currentUser);
        JsonResponseUtil.writeJsonResponse(
                response,
                200,
                true,
                "Account profile retrieved successfully",
                JsonResponseUtil.objectMap(
                        "userId", safeText(currentUser.getUserId()),
                        "username", safeText(currentUser.getUsername()),
                        "displayName", safeText(currentUser.getDisplayName()),
                        "realName", sharedRealName,
                        "professionalTitle", safeText(currentUser.getProfessionalTitle()),
                        "hasAvatar", hasAccountAvatar(currentUser)
                )
        );
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.writeJsonResponse(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.TA && currentUser.getRole() != User.Role.MO) {
            JsonResponseUtil.writeJsonResponse(response, 403, false, "Only TA or MO accounts can update account profile", null);
            return;
        }

        String username = normalizeUsername(request.getParameter("displayName"));
        String realName = normalizeInput(request.getParameter("realName"));
        String professionalTitle = currentUser.getRole() == User.Role.MO
                ? normalizeInput(request.getParameter("professionalTitle"))
                : safeText(currentUser.getProfessionalTitle());
        String validationError = validateUsernameChange(username, currentUser);
        if (validationError == null) {
            validationError = validateNames(realName, professionalTitle);
        }
        Optional<Applicant> taApplicant = findTaApplicant(currentUser);
        String taRealNameError = validateTaSharedRealName(realName, taApplicant.isPresent());
        if (validationError != null) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, validationError, null);
            return;
        }
        if (taRealNameError != null) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, taRealNameError, null);
            return;
        }

        String previousAvatarPath = currentUser.getAvatarPath();
        String nextAvatarPath = previousAvatarPath;
        Part avatarPart = getOptionalPart(request, "avatar");
        if (isUsableFilePart(avatarPart)) {
            String avatarError = validateAvatar(avatarPart);
            if (avatarError != null) {
                JsonResponseUtil.writeJsonResponse(response, 400, false, avatarError, null);
                return;
            }
            nextAvatarPath = saveAvatarFile(avatarPart, currentUser.getUserId());
        }

        currentUser.setUsername(username);
        currentUser.setDisplayName(username);
        currentUser.setRealName(realName);
        if (currentUser.getRole() == User.Role.MO) {
            currentUser.setProfessionalTitle(professionalTitle);
        }
        currentUser.setAvatarPath(nextAvatarPath);
        User saved;
        try {
            saved = userDao.update(currentUser);
        } catch (IllegalArgumentException e) {
            JsonResponseUtil.writeJsonResponse(response, 400, false, e.getMessage(), null);
            return;
        }
        syncTaApplicantRealName(saved, taApplicant);
        syncMoDisplayName(saved);
        updateSessionUser(request, saved);
        cleanupReplacedAvatar(previousAvatarPath, nextAvatarPath);

        String sharedRealName = buildSharedRealName(saved);
        JsonResponseUtil.writeJsonResponse(
                response,
                200,
                true,
                "Account profile updated successfully",
                JsonResponseUtil.objectMap(
                        "userId", safeText(saved.getUserId()),
                        "username", safeText(saved.getUsername()),
                        "displayName", safeText(saved.getDisplayName()),
                        "realName", sharedRealName,
                        "professionalTitle", safeText(saved.getProfessionalTitle()),
                        "hasAvatar", hasAccountAvatar(saved)
                )
        );
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }

        Object userObject = session.getAttribute("user");
        if (userObject instanceof User) {
            User sessionUser = (User) userObject;
            Optional<User> persisted = userDao.findById(sessionUser.getUserId());
            return persisted.orElse(sessionUser);
        }

        Object userIdObject = session.getAttribute("userId");
        String userId = userIdObject != null ? String.valueOf(userIdObject) : "";
        if (!isNotEmpty(userId)) {
            return null;
        }
        return userDao.findById(userId).orElse(null);
    }

    private void updateSessionUser(HttpServletRequest request, User user) {
        HttpSession session = request.getSession(false);
        if (session == null || user == null) {
            return;
        }
        session.setAttribute("user", user);
        session.setAttribute("userId", user.getUserId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("role", user.getRole().name());
    }

    private boolean isAvatarRequest(HttpServletRequest request) {
        String servletPath = request.getServletPath();
        String asset = request.getParameter("asset");
        return "/api/account/avatar".equals(servletPath) || "avatar".equalsIgnoreCase(asset);
    }

    private void streamAvatar(HttpServletResponse response, User user) throws IOException {
        String avatarPath = safeText(user.getAvatarPath());
        if (!isAccountAvatarPath(avatarPath)) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        File file = new File(StoragePaths.getDataDir(), avatarPath);
        if (!file.exists() || !file.isFile()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = Files.probeContentType(file.toPath());
        if (!isNotEmpty(contentType) || !contentType.startsWith("image/")) {
            contentType = detectImageContentType(file.getName());
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(contentType);
        response.setHeader("Cache-Control", "private, max-age=300");
        response.setContentLengthLong(file.length());
        Files.copy(file.toPath(), response.getOutputStream());
        response.getOutputStream().flush();
    }

    private Part getOptionalPart(HttpServletRequest request, String name) throws IOException, ServletException {
        try {
            return request.getPart(name);
        } catch (IllegalStateException e) {
            throw e;
        } catch (ServletException e) {
            String contentType = request.getContentType();
            if (contentType == null || !contentType.toLowerCase().contains("multipart/form-data")) {
                return null;
            }
            throw e;
        }
    }

    private boolean isUsableFilePart(Part part) {
        return part != null
                && part.getSize() > 0
                && isNotEmpty(part.getSubmittedFileName());
    }

    private Optional<Applicant> findTaApplicant(User user) {
        if (user == null || user.getRole() != User.Role.TA) {
            return Optional.empty();
        }
        return applicantDao.findByUserId(user.getUserId());
    }

    private String buildSharedRealName(User user) {
        if (user == null) {
            return "";
        }
        Optional<Applicant> taApplicant = findTaApplicant(user);
        if (taApplicant.isPresent() && isNotEmpty(taApplicant.get().getFullName())) {
            return safeText(taApplicant.get().getFullName());
        }
        return safeText(user.getRealName());
    }

    private String validateTaSharedRealName(String realName, boolean hasApplicantProfile) {
        if (!hasApplicantProfile) {
            return null;
        }
        if (!isNotEmpty(realName)) {
            return "Full name is required.";
        }
        return validateApplicantFullName(realName);
    }

    private String validateUsernameChange(String username, User currentUser) {
        if (!isNotEmpty(username)) {
            return "Username is required";
        }
        if (username.length() > USERNAME_MAX_LENGTH) {
            return "Username is too long";
        }
        if (hasControlChars(username) || containsDangerousMarkup(username)) {
            return "Username contains unsupported characters";
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            return "Username format is invalid";
        }
        if (username.contains("__")) {
            return "Username cannot contain consecutive underscores";
        }
        if (username.charAt(username.length() - 1) == '_') {
            return "Username cannot end with an underscore";
        }
        Optional<User> existing = userDao.findByUsername(username);
        if (existing.isPresent() && currentUser != null
                && !safeText(existing.get().getUserId()).equals(safeText(currentUser.getUserId()))) {
            return "Username already exists";
        }
        return null;
    }

    private String validateNames(String realName, String professionalTitle) {
        if (realName != null && realName.length() > REAL_NAME_MAX_LENGTH) {
            return "Real name is too long";
        }
        if (professionalTitle != null && professionalTitle.length() > PROFESSIONAL_TITLE_MAX_LENGTH) {
            return "Professional title is too long";
        }
        if (hasControlChars(realName) || hasControlChars(professionalTitle)
                || containsDangerousMarkup(realName)
                || containsDangerousMarkup(professionalTitle)) {
            return "Account profile contains unsupported characters";
        }
        return null;
    }

    private String validateApplicantFullName(String value) {
        if (value.length() < 2) {
            return "Full name must be at least 2 characters.";
        }
        if (value.length() > REAL_NAME_MAX_LENGTH) {
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

    private String validateAvatar(Part avatarPart) {
        if (avatarPart.getSize() > MAX_AVATAR_SIZE) {
            return "Avatar file is too large";
        }

        String submittedFileName = avatarPart.getSubmittedFileName();
        String extension = extractExtension(submittedFileName, "");
        if (!ALLOWED_AVATAR_EXTENSIONS.contains(extension)) {
            return "Avatar must be JPG, PNG, or WEBP";
        }

        String contentType = avatarPart.getContentType();
        if (contentType != null && !contentType.trim().isEmpty()
                && !ALLOWED_AVATAR_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return "Avatar must be JPG, PNG, or WEBP";
        }
        return null;
    }

    private String saveAvatarFile(Part avatarPart, String userId) throws IOException {
        ensureDirectoryExists(StoragePaths.getAccountAvatarDir());
        String originalName = avatarPart.getSubmittedFileName();
        String extension = extractExtension(originalName, ".jpg");
        String baseName = sanitizeBaseName(originalName, "avatar");
        String fileName = userId + "_" + System.currentTimeMillis() + "_" + baseName + extension;
        File target = new File(StoragePaths.getAccountAvatarDir(), fileName);
        Files.copy(avatarPart.getInputStream(), target.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return AVATAR_DIR_NAME + "/" + fileName;
    }

    private void cleanupReplacedAvatar(String previousAvatarPath, String currentAvatarPath) {
        if (!isAccountAvatarPath(previousAvatarPath)) {
            return;
        }
        if (previousAvatarPath.equals(currentAvatarPath)) {
            return;
        }
        File file = new File(StoragePaths.getDataDir(), previousAvatarPath);
        if (file.exists() && !file.delete()) {
            Logger.i("AccountProfileServlet", "Unable to delete old account avatar: " + previousAvatarPath);
        }
    }

    private boolean hasAccountAvatar(User user) {
        return user != null && isAccountAvatarPath(user.getAvatarPath());
    }

    private boolean isAccountAvatarPath(String path) {
        String value = safeText(path).trim();
        if (!value.startsWith(AVATAR_DIR_NAME + "/")) {
            return false;
        }

        String fileName = value.substring((AVATAR_DIR_NAME + "/").length());
        return isNotEmpty(fileName)
                && !fileName.contains("/")
                && !fileName.contains("\\")
                && !fileName.contains("..");
    }

    private void syncTaApplicantRealName(User user, Optional<Applicant> existingApplicant) {
        if (user == null || user.getRole() != User.Role.TA || existingApplicant.isEmpty()) {
            return;
        }

        String realName = safeText(user.getRealName()).trim();
        if (!isNotEmpty(realName)) {
            return;
        }

        Applicant applicant = existingApplicant.get();
        if (!realName.equals(safeText(applicant.getFullName()))) {
            applicant.setFullName(realName);
            Applicant savedApplicant = applicantDao.update(applicant);
            syncApplicationApplicantName(savedApplicant);
        }
    }

    private void syncApplicationApplicantName(Applicant applicant) {
        if (applicant == null || !isNotEmpty(applicant.getApplicantId())) {
            return;
        }

        String fullName = safeText(applicant.getFullName()).trim();
        if (!isNotEmpty(fullName)) {
            return;
        }

        for (Application application : applicationDao.findByApplicantId(applicant.getApplicantId())) {
            if (!fullName.equals(safeText(application.getApplicantName()))) {
                application.setApplicantName(fullName);
                applicationDao.update(application);
            }
        }
    }

    private void syncMoDisplayName(User user) {
        if (user == null || user.getRole() != User.Role.MO) {
            return;
        }

        String displayName = buildMoDisplayName(user);
        for (Job job : jobDao.findByMoId(user.getUserId())) {
            job.setMoName(displayName);
            jobDao.update(job);
        }
    }

    private String buildMoDisplayName(User user) {
        String realName = safeText(user.getRealName()).trim();
        String title = safeText(user.getProfessionalTitle()).trim();
        if (!realName.isEmpty()) {
            return title.isEmpty() ? realName : title + " " + realName;
        }
        String displayName = safeText(user.getDisplayName()).trim();
        return displayName.isEmpty() ? safeText(user.getUsername()) : displayName;
    }

    private String normalizeInput(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed;
    }

    private String normalizeUsername(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
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

    private boolean hasLetterOrCjk(String value) {
        return value != null && value.matches(".*[A-Za-z\\u00C0-\\u024F\\u4E00-\\u9FFF].*");
    }

    private boolean hasExcessiveRepeatedChars(String value, int threshold) {
        if (value == null) {
            return false;
        }
        int safeThreshold = Math.max(1, threshold);
        return value.matches(".*(.)\\1{" + safeThreshold + ",}.*");
    }

    private String extractExtension(String fileName, String defaultExtension) {
        String fallback = isNotEmpty(defaultExtension) ? defaultExtension.toLowerCase() : "";
        if (fileName == null) {
            return fallback;
        }
        int dotIndex = fileName.lastIndexOf(".");
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return fallback;
        }
        return fileName.substring(dotIndex).toLowerCase();
    }

    private String sanitizeBaseName(String fileName, String fallbackName) {
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
            return isNotEmpty(fallbackName) ? fallbackName : "avatar";
        }
        if (baseName.length() > 60) {
            return baseName.substring(0, 60);
        }
        return baseName;
    }

    private String detectImageContentType(String fileName) {
        String safeName = fileName != null ? fileName.toLowerCase() : "";
        if (safeName.endsWith(".png")) {
            return "image/png";
        }
        if (safeName.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private void ensureDirectoryExists(String dirPath) {
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }
}
