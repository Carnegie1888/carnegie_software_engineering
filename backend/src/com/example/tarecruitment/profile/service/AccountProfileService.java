package com.example.tarecruitment.profile.service;

import com.example.tarecruitment.application.dao.ApplicationDao;
import com.example.tarecruitment.application.model.Application;
import com.example.tarecruitment.auth.dao.UserDao;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.common.service.ServiceResult;
import com.example.tarecruitment.common.storage.StoragePaths;
import com.example.tarecruitment.common.util.Logger;
import com.example.tarecruitment.job.dao.JobDao;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.profile.dao.ApplicantDao;
import com.example.tarecruitment.profile.mapper.AccountProfileResponseMapper;
import com.example.tarecruitment.profile.model.Applicant;
import com.example.tarecruitment.profile.validator.AccountProfileValidator;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

public class AccountProfileService {

    private static final String AVATAR_DIR_NAME = "account-avatars";
    private static AccountProfileService instance;

    private final UserDao userDao;
    private final JobDao jobDao;
    private final ApplicantDao applicantDao;
    private final ApplicationDao applicationDao;

    private AccountProfileService() {
        this.userDao = UserDao.getInstance();
        this.jobDao = JobDao.getInstance();
        this.applicantDao = ApplicantDao.getInstance();
        this.applicationDao = ApplicationDao.getInstance();
        ensureDirectoryExists(StoragePaths.getAccountAvatarDir());
    }

    public static synchronized AccountProfileService getInstance() {
        if (instance == null) {
            instance = new AccountProfileService();
        }
        return instance;
    }

    public User currentUser(HttpSession session) {
        if (session == null) {
            return null;
        }

        Object userObject = session.getAttribute("user");
        if (userObject instanceof User) {
            User sessionUser = (User) userObject;
            return userDao.findById(sessionUser.getUserId()).orElse(sessionUser);
        }

        Object userIdObject = session.getAttribute("userId");
        String userId = userIdObject != null ? String.valueOf(userIdObject) : "";
        if (!AccountProfileValidator.isNotEmpty(userId)) {
            return null;
        }
        return userDao.findById(userId).orElse(null);
    }

    public ServiceResult get(User currentUser) {
        if (currentUser == null) {
            return ServiceResult.unauthorized("Please login first");
        }
        return ServiceResult.ok(
                "Account profile retrieved successfully",
                AccountProfileResponseMapper.toPayload(currentUser, buildSharedRealName(currentUser), hasAccountAvatar(currentUser))
        );
    }

    public ServiceResult update(User currentUser,
                                HttpSession session,
                                String displayName,
                                String realName,
                                String professionalTitle,
                                Part avatarPart) {
        String newAvatarPath = null;
        boolean persisted = false;
        try {
            if (currentUser == null) {
                return ServiceResult.unauthorized("Please login first");
            }
            if (currentUser.getRole() != User.Role.TA && currentUser.getRole() != User.Role.MO) {
                return ServiceResult.forbidden("Only TA or MO accounts can update account profile");
            }

            String username = AccountProfileValidator.normalizeUsername(displayName);
            String normalizedRealName = AccountProfileValidator.normalizeInput(realName);
            String normalizedTitle = currentUser.getRole() == User.Role.MO
                    ? AccountProfileValidator.normalizeInput(professionalTitle)
                    : safeText(currentUser.getProfessionalTitle());

            String validationError = AccountProfileValidator.validateUsernameFormat(username);
            if (validationError == null) {
                validationError = validateUsernameAvailability(username, currentUser);
            }
            if (validationError == null) {
                validationError = AccountProfileValidator.validateNames(normalizedRealName, normalizedTitle);
            }

            Optional<Applicant> taApplicant = findTaApplicant(currentUser);
            String taRealNameError = AccountProfileValidator.validateTaSharedRealName(normalizedRealName, taApplicant.isPresent());
            if (validationError != null) return ServiceResult.badRequest(validationError);
            if (taRealNameError != null) return ServiceResult.badRequest(taRealNameError);

            String previousAvatarPath = currentUser.getAvatarPath();
            String nextAvatarPath = previousAvatarPath;
            if (AccountProfileValidator.isUsableFilePart(avatarPart)) {
                String avatarError = AccountProfileValidator.validateAvatar(avatarPart);
                if (avatarError != null) {
                    return ServiceResult.badRequest(avatarError);
                }
                newAvatarPath = saveAvatarFile(avatarPart, currentUser.getUserId());
                nextAvatarPath = newAvatarPath;
            }

            currentUser.setUsername(username);
            currentUser.setDisplayName(username);
            currentUser.setRealName(normalizedRealName);
            if (currentUser.getRole() == User.Role.MO) {
                currentUser.setProfessionalTitle(normalizedTitle);
            }
            currentUser.setAvatarPath(nextAvatarPath);

            User saved = userDao.update(currentUser);
            persisted = true;
            syncTaApplicantRealName(saved, taApplicant);
            syncMoDisplayName(saved);
            updateSessionUser(session, saved);
            cleanupReplacedAvatar(previousAvatarPath, nextAvatarPath);

            return ServiceResult.ok(
                    "Account profile updated successfully",
                    AccountProfileResponseMapper.toPayload(saved, buildSharedRealName(saved), hasAccountAvatar(saved))
            );
        } catch (IllegalArgumentException e) {
            if (!persisted) {
                deleteNewAvatar(newAvatarPath);
            }
            return ServiceResult.badRequest(e.getMessage());
        } catch (Exception e) {
            if (!persisted) {
                deleteNewAvatar(newAvatarPath);
            }
            return ServiceResult.serverError("An error occurred. Please try again later.");
        }
    }

    public Optional<AvatarResource> avatar(User user) throws IOException {
        String avatarPath = safeText(user.getAvatarPath());
        if (!isAccountAvatarPath(avatarPath)) {
            return Optional.empty();
        }

        File file = new File(StoragePaths.getDataDir(), avatarPath);
        if (!file.exists() || !file.isFile()) {
            return Optional.empty();
        }

        String contentType = Files.probeContentType(file.toPath());
        if (!AccountProfileValidator.isNotEmpty(contentType) || !contentType.startsWith("image/")) {
            contentType = detectImageContentType(file.getName());
        }
        return Optional.of(new AvatarResource(file, contentType, "private, max-age=300"));
    }

    private String validateUsernameAvailability(String username, User currentUser) {
        Optional<User> existing = userDao.findByUsername(username);
        if (existing.isPresent()
                && currentUser != null
                && !safeText(existing.get().getUserId()).equals(safeText(currentUser.getUserId()))) {
            return "Username already exists";
        }
        return null;
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
        if (taApplicant.isPresent() && AccountProfileValidator.isNotEmpty(taApplicant.get().getFullName())) {
            return safeText(taApplicant.get().getFullName());
        }
        return safeText(user.getRealName());
    }

    private void syncTaApplicantRealName(User user, Optional<Applicant> existingApplicant) {
        if (user == null || user.getRole() != User.Role.TA || existingApplicant.isEmpty()) {
            return;
        }

        String realName = safeText(user.getRealName()).trim();
        if (!AccountProfileValidator.isNotEmpty(realName)) {
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
        if (applicant == null || !AccountProfileValidator.isNotEmpty(applicant.getApplicantId())) {
            return;
        }

        String fullName = safeText(applicant.getFullName()).trim();
        if (!AccountProfileValidator.isNotEmpty(fullName)) {
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

    private String saveAvatarFile(Part avatarPart, String userId) throws IOException {
        ensureDirectoryExists(StoragePaths.getAccountAvatarDir());
        String originalName = avatarPart.getSubmittedFileName();
        String extension = AccountProfileValidator.extractExtension(originalName, ".jpg");
        String baseName = AccountProfileValidator.sanitizeBaseName(originalName, "avatar");
        String fileName = userId + "_" + System.currentTimeMillis() + "_" + baseName + extension;
        File target = new File(StoragePaths.getAccountAvatarDir(), fileName);
        Files.copy(avatarPart.getInputStream(), target.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return AVATAR_DIR_NAME + "/" + fileName;
    }

    private void cleanupReplacedAvatar(String previousAvatarPath, String currentAvatarPath) {
        if (!isAccountAvatarPath(previousAvatarPath) || previousAvatarPath.equals(currentAvatarPath)) {
            return;
        }
        File file = new File(StoragePaths.getDataDir(), previousAvatarPath);
        if (file.exists() && !file.delete()) {
            Logger.i("AccountProfileService", "Unable to delete old account avatar: " + previousAvatarPath);
        }
    }

    private void deleteNewAvatar(String newAvatarPath) {
        if (!isAccountAvatarPath(newAvatarPath)) {
            return;
        }
        File file = new File(StoragePaths.getDataDir(), newAvatarPath);
        if (file.exists() && !file.delete()) {
            file.deleteOnExit();
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
        return AccountProfileValidator.isNotEmpty(fileName)
                && !fileName.contains("/")
                && !fileName.contains("\\")
                && !fileName.contains("..");
    }

    private void updateSessionUser(HttpSession session, User user) {
        if (session == null || user == null) {
            return;
        }
        session.setAttribute("user", user);
        session.setAttribute("userId", user.getUserId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("role", user.getRole().name());
    }

    private String detectImageContentType(String fileName) {
        String safeName = fileName != null ? fileName.toLowerCase() : "";
        if (safeName.endsWith(".png")) return "image/png";
        if (safeName.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private void ensureDirectoryExists(String dirPath) {
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    public static final class AvatarResource {
        private final File file;
        private final String contentType;
        private final String cacheControl;

        private AvatarResource(File file, String contentType, String cacheControl) {
            this.file = file;
            this.contentType = contentType;
            this.cacheControl = cacheControl;
        }

        public File getFile() {
            return file;
        }

        public String getContentType() {
            return contentType;
        }

        public String getCacheControl() {
            return cacheControl;
        }
    }
}
