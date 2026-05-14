package com.example.tarecruitment.profile.mapper;

import com.example.tarecruitment.profile.validator.ApplicantProfileInput;
import com.example.tarecruitment.profile.validator.ApplicantProfileValidator;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;

import java.io.IOException;

public final class ApplicantProfileRequestMapper {

    private ApplicantProfileRequestMapper() {
    }

    public static boolean isMultipart(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().contains("multipart/form-data");
    }

    public static ApplicantProfileInput input(HttpServletRequest request) {
        return new ApplicantProfileInput(
                request.getParameter("fullName"),
                request.getParameter("studentId"),
                request.getParameter("department"),
                request.getParameter("program"),
                request.getParameter("gpa"),
                request.getParameter("skills"),
                request.getParameter("phone"),
                request.getParameter("address"),
                request.getParameter("experience"),
                request.getParameter("motivation"),
                ApplicantProfileValidator.isTruthyFlag(request.getParameter("removePhoto"))
        );
    }

    public static ApplicantProfileUpload upload(HttpServletRequest request) throws ServletException, IOException {
        return new ApplicantProfileUpload(input(request), optionalPart(request, "resume"), optionalPart(request, "photo"));
    }

    private static Part optionalPart(HttpServletRequest request, String name) throws ServletException, IOException {
        Part part = request.getPart(name);
        return part != null && part.getSize() > 0 ? part : null;
    }

    public static final class ApplicantProfileUpload {
        private final ApplicantProfileInput input;
        private final Part resumePart;
        private final Part photoPart;

        private ApplicantProfileUpload(ApplicantProfileInput input, Part resumePart, Part photoPart) {
            this.input = input;
            this.resumePart = resumePart;
            this.photoPart = photoPart;
        }

        public ApplicantProfileInput getInput() {
            return input;
        }

        public Part getResumePart() {
            return resumePart;
        }

        public Part getPhotoPart() {
            return photoPart;
        }
    }
}
