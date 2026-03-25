package com.example.authlogin.service;

import com.example.authlogin.model.Applicant;
import com.example.authlogin.model.Job;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * TA 职位匹配分析服务：
 * - 仅使用白名单档案字段构造 AI 上下文
 * - AI 不可用时稳定回退到本地分析
 */
public class TaJobMatchAnalysisService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?<!\\d)(?:\\+?86[-\\s]?)?1\\d{10}(?!\\d)");
    private static final Pattern STUDENT_ID_PATTERN = Pattern.compile("(?<!\\d)(?:20\\d{8}|\\d{8,10})(?!\\d)");
    private static final int MAX_TEXT_LENGTH = 320;

    private final TongyiXiaomiAnalysisClient aiClient;
    private final SkillMatchService fallbackSkillService;

    public TaJobMatchAnalysisService(TongyiXiaomiAnalysisClient aiClient) {
        this(aiClient, new SkillMatchService((required, applicant) -> Optional.empty()));
    }

    TaJobMatchAnalysisService(TongyiXiaomiAnalysisClient aiClient, SkillMatchService fallbackSkillService) {
        this.aiClient = aiClient;
        this.fallbackSkillService = fallbackSkillService != null
                ? fallbackSkillService
                : new SkillMatchService((required, applicant) -> Optional.empty());
    }

    public AnalysisResult analyze(Job job, Applicant applicant) {
        return analyze(job, applicant, null);
    }

    public AnalysisResult analyze(Job job, Applicant applicant, String coverLetter) {
        if (job == null) {
            throw new IllegalArgumentException("Job is required.");
        }
        if (applicant == null) {
            throw new IllegalArgumentException("Applicant profile is required.");
        }

        SanitizedProfile profile = sanitizeProfile(applicant);
        String sanitizedCoverLetter = sanitizeFreeText(coverLetter);
        List<String> requiredSkills = normalizeSkills(job.getRequiredSkills());
        String jobContext = buildJobContext(job);
        String profileContext = buildProfileContext(profile);
        if (!isBlank(sanitizedCoverLetter)) {
            profileContext = profileContext.isEmpty()
                    ? sanitizedCoverLetter
                    : profileContext + ". " + sanitizedCoverLetter;
        }

        TongyiXiaomiAnalysisClient.AnalysisAttempt attempt = requestAi(
                job,
                profile,
                requiredSkills,
                sanitizedCoverLetter
        );
        if (attempt.hasResult()) {
            TongyiXiaomiAnalysisClient.AnalysisPayload payload = attempt.getPayload();
            return AnalysisResult.fromAi(
                    payload.getOverallScore(),
                    payload.getMatchLevel(),
                    payload.getSummary(),
                    payload.getStrengths(),
                    payload.getRisks(),
                    payload.getSuggestions(),
                    payload.getJobEvidence(),
                    payload.getProfileEvidence()
            );
        }

        return buildFallbackResult(
                job,
                profile,
                requiredSkills,
                jobContext,
                profileContext,
                sanitizedCoverLetter,
                attempt.getFailureReason()
        );
    }

    private TongyiXiaomiAnalysisClient.AnalysisAttempt requestAi(Job job,
                                                                 SanitizedProfile profile,
                                                                 List<String> requiredSkills,
                                                                 String coverLetter) {
        if (aiClient == null) {
            return TongyiXiaomiAnalysisClient.AnalysisAttempt.failure("AI client is unavailable.");
        }
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(job, profile, requiredSkills, coverLetter);
        return aiClient.analyze(systemPrompt, userPrompt);
    }

    private String buildSystemPrompt() {
        return "你是 TA 岗位匹配分析助手。"
                + "请基于岗位信息和候选人非敏感档案做客观评估，输出中文结论。"
                + "你必须且只能返回 JSON 对象，禁止输出 Markdown、代码块或额外解释。"
                + "JSON 必须包含以下键："
                + "overallScore(0-100整数), matchLevel(HIGH|MEDIUM|LOW), summary(字符串), "
                + "strengths(字符串数组), risks(字符串数组), suggestions(字符串数组), "
                + "jobEvidence(字符串数组), profileEvidence(字符串数组)。"
                + "不得推测、不得输出姓名/学号/电话/邮箱等敏感信息。";
    }

    private String buildUserPrompt(Job job,
                                   SanitizedProfile profile,
                                   List<String> requiredSkills,
                                   String coverLetter) {
        StringBuilder prompt = new StringBuilder(640);
        prompt.append("岗位信息：\n");
        prompt.append("- title: ").append(safe(job.getTitle())).append("\n");
        prompt.append("- courseCode: ").append(safe(job.getCourseCode())).append("\n");
        prompt.append("- courseName: ").append(safe(job.getCourseName())).append("\n");
        prompt.append("- positions: ").append(job.getPositions()).append("\n");
        prompt.append("- workload: ").append(safe(job.getWorkload())).append("\n");
        prompt.append("- deadline: ").append(job.getDeadline() != null ? job.getDeadline() : "").append("\n");
        prompt.append("- description: ").append(safe(job.getDescription())).append("\n");
        prompt.append("- requiredSkills: ").append(join(requiredSkills)).append("\n\n");

        prompt.append("候选人档案（已做白名单和脱敏处理）：\n");
        prompt.append("- department: ").append(profile.department).append("\n");
        prompt.append("- program: ").append(profile.program).append("\n");
        prompt.append("- gpa: ").append(profile.gpa).append("\n");
        prompt.append("- skills: ").append(join(profile.skills)).append("\n");
        prompt.append("- experience: ").append(profile.experience).append("\n");
        prompt.append("- motivation: ").append(profile.motivation).append("\n");
        prompt.append("- coverLetter: ").append(safe(coverLetter)).append("\n");
        return prompt.toString();
    }

    private AnalysisResult buildFallbackResult(Job job,
                                               SanitizedProfile profile,
                                               List<String> requiredSkills,
                                               String jobContext,
                                               String profileContext,
                                               String coverLetter,
                                               String fallbackReason) {
        SkillMatchService.SkillMatchResult base = fallbackSkillService.matchByKeywords(
                requiredSkills,
                jobContext,
                profile.skills,
                profileContext
        );
        int score = (int) Math.round(Math.max(0.0, Math.min(100.0, base.getScore())));
        String level = resolveLevel(score);

        List<String> strengths = new ArrayList<>();
        if (!base.getMatchedSkills().isEmpty()) {
            strengths.add("已匹配岗位技能：" + join(limit(base.getMatchedSkills(), 4)));
        }
        if (!isBlank(profile.gpa)) {
            strengths.add("当前 GPA 信息可用：" + profile.gpa);
        }
        if (!isBlank(profile.experience)) {
            strengths.add("相关经历摘要：" + shortText(profile.experience, 100));
        }
        if (!isBlank(profile.motivation)) {
            strengths.add("申请动机摘要：" + shortText(profile.motivation, 100));
        }
        if (!isBlank(coverLetter)) {
            strengths.add("求职信摘要：" + shortText(coverLetter, 100));
        }
        if (strengths.isEmpty()) {
            strengths.add("已具备部分与岗位相关的基础条件。");
        }

        List<String> risks = new ArrayList<>();
        if (!base.getMissingSkills().isEmpty()) {
            risks.add("仍缺少部分岗位技能：" + join(limit(base.getMissingSkills(), 4)));
        }
        if (isBlank(profile.experience)) {
            risks.add("缺少可验证的相关经历描述，面试阶段建议重点核验。");
        }
        if (isBlank(profile.motivation)) {
            risks.add("申请动机信息较少，岗位投入度判断依据不足。");
        }
        if (isBlank(coverLetter)) {
            risks.add("求职信信息较少，缺少与岗位直接关联的补充说明。");
        }
        if (risks.isEmpty()) {
            risks.add("未发现明显风险，建议结合面试进一步确认细节。");
        }

        List<String> suggestions = new ArrayList<>();
        if (!base.getMissingSkills().isEmpty()) {
            suggestions.add("优先补充以下技能案例或学习计划：" + join(limit(base.getMissingSkills(), 3)));
        }
        suggestions.add("在求职信中用量化结果说明与你匹配的课程经验。");
        suggestions.add("准备 1-2 个与课程场景相关的教学或助教实践案例。");

        List<String> jobEvidence = new ArrayList<>();
        jobEvidence.add("岗位标题/课程：" + safe(job.getTitle()) + " / " + safe(job.getCourseCode()));
        jobEvidence.add("岗位技能要求：" + join(limit(requiredSkills, 6)));
        if (!isBlank(job.getDescription())) {
            jobEvidence.add("岗位描述摘要：" + shortText(job.getDescription(), 120));
        }

        List<String> profileEvidence = new ArrayList<>();
        profileEvidence.add("院系/项目：" + profile.department + " / " + profile.program);
        profileEvidence.add("技能信息：" + join(limit(profile.skills, 6)));
        if (!isBlank(profile.experience)) {
            profileEvidence.add("经历摘要：" + shortText(profile.experience, 100));
        }
        if (!isBlank(coverLetter)) {
            profileEvidence.add("求职信摘要：" + shortText(coverLetter, 100));
        }

        String summary;
        if (base.getMissingSkills().isEmpty()) {
            summary = "你的技能与岗位核心要求整体匹配度较高，建议在申请材料中突出相关经历与可投入时间。";
        } else {
            summary = "你目前已匹配 " + base.getMatchedSkills().size() + " 项技能，仍有 "
                    + base.getMissingSkills().size()
                    + " 项技能待补充，建议结合岗位要求完善案例说明。";
        }

        String reason = isBlank(fallbackReason)
                ? "AI summary is temporarily unavailable."
                : fallbackReason.trim();
        return AnalysisResult.fromFallback(
                score,
                level,
                summary,
                strengths,
                risks,
                suggestions,
                jobEvidence,
                profileEvidence,
                reason
        );
    }

    private SanitizedProfile sanitizeProfile(Applicant applicant) {
        return new SanitizedProfile(
                safe(applicant.getDepartment()),
                safe(applicant.getProgram()),
                safe(applicant.getGpa()),
                normalizeSkills(applicant.getSkills()),
                sanitizeFreeText(applicant.getExperience()),
                sanitizeFreeText(applicant.getMotivation())
        );
    }

    private String sanitizeFreeText(String text) {
        if (isBlank(text)) {
            return "";
        }
        String sanitized = text.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ').trim();
        sanitized = EMAIL_PATTERN.matcher(sanitized).replaceAll("[已脱敏邮箱]");
        sanitized = PHONE_PATTERN.matcher(sanitized).replaceAll("[已脱敏手机号]");
        sanitized = STUDENT_ID_PATTERN.matcher(sanitized).replaceAll("[已脱敏学号]");
        sanitized = sanitized.replaceAll("\\s{2,}", " ").trim();
        if (sanitized.length() > MAX_TEXT_LENGTH) {
            sanitized = sanitized.substring(0, MAX_TEXT_LENGTH).trim();
        }
        return sanitized;
    }

    private List<String> normalizeSkills(List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> deduplicated = new LinkedHashSet<>();
        for (String skill : skills) {
            String normalized = safe(skill);
            if (!normalized.isEmpty()) {
                deduplicated.add(normalized);
            }
        }
        return Collections.unmodifiableList(new ArrayList<>(deduplicated));
    }

    private List<String> limit(List<String> items, int maxSize) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }
        int end = Math.min(maxSize, items.size());
        return new ArrayList<>(items.subList(0, end));
    }

    private String buildJobContext(Job job) {
        StringBuilder context = new StringBuilder();
        appendSentence(context, job.getTitle());
        appendSentence(context, job.getCourseCode());
        appendSentence(context, job.getCourseName());
        appendSentence(context, job.getDescription());
        appendSentence(context, join(job.getRequiredSkills()));
        return context.toString().trim();
    }

    private String buildProfileContext(SanitizedProfile profile) {
        StringBuilder context = new StringBuilder();
        appendSentence(context, profile.department);
        appendSentence(context, profile.program);
        appendSentence(context, profile.gpa);
        appendSentence(context, join(profile.skills));
        appendSentence(context, profile.experience);
        appendSentence(context, profile.motivation);
        return context.toString().trim();
    }

    private void appendSentence(StringBuilder builder, String value) {
        String normalized = safe(value);
        if (normalized.isEmpty()) {
            return;
        }
        if (builder.length() > 0) {
            builder.append(". ");
        }
        builder.append(normalized);
    }

    private String resolveLevel(int score) {
        if (score >= 85) {
            return "HIGH";
        }
        if (score >= 60) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private String shortText(String text, int maxLength) {
        String value = safe(text);
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength).trim() + "...";
    }

    private String join(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }
        return String.join("、", values);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static final class SanitizedProfile {
        private final String department;
        private final String program;
        private final String gpa;
        private final List<String> skills;
        private final String experience;
        private final String motivation;

        private SanitizedProfile(String department,
                                 String program,
                                 String gpa,
                                 List<String> skills,
                                 String experience,
                                 String motivation) {
            this.department = department;
            this.program = program;
            this.gpa = gpa;
            this.skills = skills;
            this.experience = experience;
            this.motivation = motivation;
        }
    }

    public static final class AnalysisResult {
        private final int overallScore;
        private final String matchLevel;
        private final String summary;
        private final List<String> strengths;
        private final List<String> risks;
        private final List<String> suggestions;
        private final List<String> jobEvidence;
        private final List<String> profileEvidence;
        private final boolean fallback;
        private final String fallbackReason;

        private AnalysisResult(int overallScore,
                               String matchLevel,
                               String summary,
                               List<String> strengths,
                               List<String> risks,
                               List<String> suggestions,
                               List<String> jobEvidence,
                               List<String> profileEvidence,
                               boolean fallback,
                               String fallbackReason) {
            this.overallScore = Math.max(0, Math.min(100, overallScore));
            this.matchLevel = normalizeLevel(matchLevel, this.overallScore);
            this.summary = summary == null ? "" : summary.trim();
            this.strengths = immutableCopy(strengths);
            this.risks = immutableCopy(risks);
            this.suggestions = immutableCopy(suggestions);
            this.jobEvidence = immutableCopy(jobEvidence);
            this.profileEvidence = immutableCopy(profileEvidence);
            this.fallback = fallback;
            this.fallbackReason = fallbackReason == null ? "" : fallbackReason.trim();
        }

        public static AnalysisResult fromAi(int overallScore,
                                            String matchLevel,
                                            String summary,
                                            List<String> strengths,
                                            List<String> risks,
                                            List<String> suggestions,
                                            List<String> jobEvidence,
                                            List<String> profileEvidence) {
            return new AnalysisResult(
                    overallScore,
                    matchLevel,
                    summary,
                    strengths,
                    risks,
                    suggestions,
                    jobEvidence,
                    profileEvidence,
                    false,
                    ""
            );
        }

        public static AnalysisResult fromFallback(int overallScore,
                                                  String matchLevel,
                                                  String summary,
                                                  List<String> strengths,
                                                  List<String> risks,
                                                  List<String> suggestions,
                                                  List<String> jobEvidence,
                                                  List<String> profileEvidence,
                                                  String fallbackReason) {
            return new AnalysisResult(
                    overallScore,
                    matchLevel,
                    summary,
                    strengths,
                    risks,
                    suggestions,
                    jobEvidence,
                    profileEvidence,
                    true,
                    fallbackReason
            );
        }

        public Map<String, Object> toResponseMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("overallScore", overallScore);
            map.put("matchLevel", matchLevel);
            map.put("summary", summary);
            map.put("strengths", strengths);
            map.put("risks", risks);
            map.put("suggestions", suggestions);
            map.put("jobEvidence", jobEvidence);
            map.put("profileEvidence", profileEvidence);
            map.put("fallback", fallback);
            map.put("fallbackReason", fallbackReason);
            return map;
        }

        private static String normalizeLevel(String level, int score) {
            String normalized = level == null ? "" : level.trim().toUpperCase(Locale.ROOT);
            if ("HIGH".equals(normalized) || "MEDIUM".equals(normalized) || "LOW".equals(normalized)) {
                return normalized;
            }
            if (score >= 85) {
                return "HIGH";
            }
            if (score >= 60) {
                return "MEDIUM";
            }
            return "LOW";
        }

        private static List<String> immutableCopy(List<String> values) {
            if (values == null || values.isEmpty()) {
                return Collections.emptyList();
            }
            List<String> copy = new ArrayList<>();
            for (String value : values) {
                if (value != null && !value.trim().isEmpty()) {
                    copy.add(value.trim());
                }
            }
            return Collections.unmodifiableList(copy);
        }
    }
}
