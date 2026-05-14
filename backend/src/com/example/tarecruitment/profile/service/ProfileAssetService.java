package com.example.tarecruitment.profile.service;

import com.example.tarecruitment.common.storage.StoragePaths;
import com.example.tarecruitment.profile.model.Applicant;
import com.example.tarecruitment.profile.validator.ProfileAssetValidator;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

public class ProfileAssetService {

    public static final String SESSION_DRAFT_RESUME_PATH = "applicantDraftResumePath";
    public static final String SESSION_DRAFT_RESUME_NAME = "applicantDraftResumeName";

    private static ProfileAssetService instance;

    private ProfileAssetService() {
        ensureDirectories();
    }

    public static synchronized ProfileAssetService getInstance() {
        if (instance == null) {
            instance = new ProfileAssetService();
        }
        return instance;
    }

    public void ensureDirectories() {
        ensureDirectoryExists(StoragePaths.getResumeDir());
        ensureDirectoryExists(StoragePaths.getResumeDraftDir());
        ensureDirectoryExists(StoragePaths.getPhotoDir());
    }

    public String saveResumeFile(Part filePart, String userId) throws IOException {
        String fileName = ProfileAssetValidator.extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "", ".pdf", "resume");
        ensureDirectoryExists(StoragePaths.getResumeDir());
        File file = new File(StoragePaths.getResumeDir(), newFileName);
        filePart.write(file.getAbsolutePath());
        return "resumes/" + newFileName;
    }

    public String savePhotoFile(Part filePart, String userId) throws IOException {
        String fileName = ProfileAssetValidator.extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "", ".jpg", "photo");
        ensureDirectoryExists(StoragePaths.getPhotoDir());
        File file = new File(StoragePaths.getPhotoDir(), newFileName);
        filePart.write(file.getAbsolutePath());
        return "photos/" + newFileName;
    }

    public String saveDraftFile(Part filePart, String userId) throws IOException {
        String fileName = ProfileAssetValidator.extractFileName(filePart);
        String newFileName = buildStoredFileName(fileName, userId, "draft_", ".pdf", "resume");
        ensureDirectoryExists(StoragePaths.getResumeDraftDir());
        File file = new File(StoragePaths.getResumeDraftDir(), newFileName);
        filePart.write(file.getAbsolutePath());
        return "resume-drafts/" + newFileName;
    }

    public String copyDraftResumeToFinal(String draftRelativePath, String userId, String originalFileName) throws IOException {
        File draftFile = resolveStoredFile(draftRelativePath);
        if (draftFile == null || !draftFile.exists() || !draftFile.isFile()) {
            throw new IllegalArgumentException("The pending resume draft is unavailable. Please choose the file again.");
        }

        String sourceFileName = isNotEmpty(originalFileName) ? originalFileName : buildDisplayFileName(draftRelativePath, draftFile.getName());
        String newFileName = buildStoredFileName(sourceFileName, userId, "", ".pdf", "resume");
        ensureDirectoryExists(StoragePaths.getResumeDir());

        File finalFile = new File(StoragePaths.getResumeDir(), newFileName);
        Files.copy(draftFile.toPath(), finalFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return "resumes/" + newFileName;
    }

    public Optional<FileResource> photoResource(Applicant applicant) throws IOException {
        if (applicant == null || !isNotEmpty(applicant.getPhotoPath())) {
            return Optional.empty();
        }
        File file = resolveStoredFile(applicant.getPhotoPath());
        if (!isUsableFile(file)) {
            return Optional.empty();
        }
        String contentType = Files.probeContentType(file.toPath());
        if (!isNotEmpty(contentType) || !contentType.startsWith("image/")) {
            contentType = detectPhotoContentType(file.getName());
        }
        return Optional.of(new FileResource(file, contentType, null, "no-store"));
    }

    public Optional<FileResource> resumeResource(Applicant applicant) throws IOException {
        if (applicant == null || !isNotEmpty(applicant.getResumePath())) {
            return Optional.empty();
        }
        File file = resolveStoredFile(applicant.getResumePath());
        if (!isUsableFile(file)) {
            return Optional.empty();
        }
        String contentType = Files.probeContentType(file.toPath());
        if (!isNotEmpty(contentType)) {
            contentType = detectResumeContentType(file.getName());
        }
        boolean isPdf = "application/pdf".equalsIgnoreCase(contentType);
        String disposition = (isPdf ? "inline" : "attachment") + "; filename=\"" + file.getName() + "\"";
        return Optional.of(new FileResource(file, contentType, disposition, "no-store"));
    }

    public void storeDraftResumeState(HttpSession session, String draftResumePath, String originalFileName) {
        if (session == null) {
            return;
        }
        session.setAttribute(SESSION_DRAFT_RESUME_PATH, draftResumePath);
        session.setAttribute(SESSION_DRAFT_RESUME_NAME, originalFileName != null ? originalFileName : "");
    }

    public void clearDraftResumeState(HttpSession session, boolean deleteFile) {
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

    public String getDraftResumePath(HttpSession session) {
        if (session == null) {
            return "";
        }
        Object value = session.getAttribute(SESSION_DRAFT_RESUME_PATH);
        return value instanceof String ? ((String) value).trim() : "";
    }

    public String getDraftResumeName(HttpSession session) {
        if (session == null) {
            return "";
        }
        Object value = session.getAttribute(SESSION_DRAFT_RESUME_NAME);
        return value instanceof String ? ((String) value).trim() : "";
    }

    public boolean hasDraftResume(HttpSession session) {
        return isNotEmpty(getDraftResumePath(session));
    }

    public File resolveStoredFile(String relativePath) {
        if (!isNotEmpty(relativePath)) {
            return null;
        }
        return new File(StoragePaths.getDataDir(), relativePath);
    }

    public long getStoredFileSize(String relativePath) {
        File file = resolveStoredFile(relativePath);
        return isUsableFile(file) ? file.length() : 0L;
    }

    public void deleteStoredFile(String relativePath) {
        File file = resolveStoredFile(relativePath);
        if (file != null && file.exists() && !file.delete()) {
            file.deleteOnExit();
        }
    }

    public void cleanupReplacedResume(String previousResumePath, String currentResumePath) {
        cleanupReplacedFile(previousResumePath, currentResumePath);
    }

    public void cleanupReplacedPhoto(String previousPhotoPath, String currentPhotoPath) {
        cleanupReplacedFile(previousPhotoPath, currentPhotoPath);
    }

    public String buildDisplayFileName(String relativePath, String fallbackName) {
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

    private void cleanupReplacedFile(String previousPath, String currentPath) {
        if (!isNotEmpty(previousPath)) {
            return;
        }
        String safeCurrentPath = currentPath != null ? currentPath.trim() : "";
        if (!previousPath.equals(safeCurrentPath)) {
            deleteStoredFile(previousPath);
        }
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
        return baseName.length() > 60 ? baseName.substring(0, 60) : baseName;
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

    private String detectResumeContentType(String fileName) {
        String safeName = fileName != null ? fileName.toLowerCase() : "";
        if (safeName.endsWith(".pdf")) return "application/pdf";
        if (safeName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return "application/msword";
    }

    private void ensureDirectoryExists(String dirPath) {
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    private boolean isUsableFile(File file) {
        return file != null && file.exists() && file.isFile();
    }

    private boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
    }

    public static final class FileResource {
        private final File file;
        private final String contentType;
        private final String contentDisposition;
        private final String cacheControl;

        private FileResource(File file, String contentType, String contentDisposition, String cacheControl) {
            this.file = file;
            this.contentType = contentType;
            this.contentDisposition = contentDisposition;
            this.cacheControl = cacheControl;
        }

        public File getFile() {
            return file;
        }

        public String getContentType() {
            return contentType;
        }

        public String getContentDisposition() {
            return contentDisposition;
        }

        public String getCacheControl() {
            return cacheControl;
        }
    }
}
