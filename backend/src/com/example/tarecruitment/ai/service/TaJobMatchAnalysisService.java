package com.example.tarecruitment.ai.service;

import com.example.tarecruitment.profile.model.Applicant;
import com.example.tarecruitment.job.model.Job;
import com.example.tarecruitment.ai.client.DashScopeAnalysisClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * TA 职位匹配分析服务：
 * - 仅使用白名单档案字段构造 AI 上下文
 * - AI 不可用时由 Servlet 返回 503，不生成本地普通匹配结果
 *
 * 当前前端入口：
 * - TA 职位详情页：分析“我”和某个职位是否匹配
 * - MO 申请详情页：分析某个申请人与职位是否匹配
 *
 * 页面不会展示 prompt，也不会展示原始脱敏文本；只展示分数、总结、优势、风险、
 * 建议和证据列表。
 */
public class TaJobMatchAnalysisService {

    // 外部 AI 上下文脱敏规则：这些模式只用于 prompt 前处理，不影响本地 CSV 原文。
    private static final Pattern EMAIL_PATTERN = Pattern.compile("(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?<!\\d)(?:\\+?86[-\\s]?)?1\\d{10}(?!\\d)");
    private static final Pattern STUDENT_ID_PATTERN = Pattern.compile("(?<!\\d)(?:20\\d{8}|\\d{8,10})(?!\\d)");
    // 单段自由文本只截取摘要，避免 prompt 过长，也减少敏感上下文暴露面。
    private static final int MAX_TEXT_LENGTH = 320;

    private final DashScopeAnalysisClient aiClient;

    public TaJobMatchAnalysisService(DashScopeAnalysisClient aiClient) {
        this.aiClient = aiClient;
    }

    public AnalysisResult analyze(Job job, Applicant applicant) {
        return analyze(job, applicant, null);
    }

    /**
     * 生成职位匹配分析。这里只返回真实 AI 分析结果；AI 不可用时抛出
     * AnalysisUnavailableException，由 Servlet 返回 503。
     */
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

        DashScopeAnalysisClient.AnalysisAttempt attempt = requestAi(
                job,
                profile,
                requiredSkills,
                sanitizedCoverLetter
        );
        if (attempt.hasResult()) {
            DashScopeAnalysisClient.AnalysisPayload payload = attempt.getPayload();
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

        String reason = isBlank(attempt.getFailureReason())
                ? "AI analysis is currently unavailable."
                : attempt.getFailureReason();
        throw new AnalysisUnavailableException(reason);
    }

    /**
     * 向 AI 客户端发送脱敏后的 prompt。
     *
     * 这里统一处理 aiClient 缺失场景，让上层始终收到 AnalysisAttempt。
     */
    private DashScopeAnalysisClient.AnalysisAttempt requestAi(Job job,
                                                                 SanitizedProfile profile,
                                                                 List<String> requiredSkills,
                                                                 String coverLetter) {
        if (aiClient == null) {
            return DashScopeAnalysisClient.AnalysisAttempt.failure("AI client is unavailable.");
        }
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(job, profile, requiredSkills, coverLetter);
        return aiClient.analyze(systemPrompt, userPrompt);
    }

    /**
     * 系统提示只定义输出协议和安全边界，不包含候选人或职位数据。
     */
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

    /**
     * 用户提示由职位信息和白名单档案字段组成。
     *
     * 姓名、邮箱、电话、学号等直接身份信息不会进入 prompt。
     */
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

    /**
     * 提取允许进入 AI 上下文的候选人字段，并清理自由文本。
     */
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

    /**
     * 自由文本脱敏和截断。
     *
     * 这里处理的是 prompt 副本，不修改 Applicant 原始 CSV 数据。
     */
    private String sanitizeFreeText(String text) {
        if (isBlank(text)) {
            return "";
        }
        // 发送给外部 AI 前统一压平换行并脱敏，避免 prompt 泄露邮箱、手机号和学号。
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

    /**
     * 标准化技能列表，保持原有顺序并去重。
     */
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

    /**
     * 中文展示列表使用顿号连接。
     */
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

    /**
     * 已脱敏的候选人档案快照。
     *
     * 只在本服务内部流转，避免误把完整 Applicant 暴露给 AI prompt 构造函数。
     */
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

    /**
     * 前端分析面板使用的统一结果对象。
     *
     * 仅承载外部 AI 成功返回的分析结果。
     */
    public static final class AnalysisResult {
        private final int overallScore;
        private final String matchLevel;
        private final String summary;
        private final List<String> strengths;
        private final List<String> risks;
        private final List<String> suggestions;
        private final List<String> jobEvidence;
        private final List<String> profileEvidence;

        private AnalysisResult(int overallScore,
                               String matchLevel,
                               String summary,
                               List<String> strengths,
                               List<String> risks,
                               List<String> suggestions,
                               List<String> jobEvidence,
                               List<String> profileEvidence) {
            this.overallScore = Math.max(0, Math.min(100, overallScore));
            this.matchLevel = normalizeLevel(matchLevel, this.overallScore);
            this.summary = summary == null ? "" : summary.trim();
            this.strengths = immutableCopy(strengths);
            this.risks = immutableCopy(risks);
            this.suggestions = immutableCopy(suggestions);
            this.jobEvidence = immutableCopy(jobEvidence);
            this.profileEvidence = immutableCopy(profileEvidence);
        }

        /**
         * AI 成功时创建结果。
         */
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
                    profileEvidence
            );
        }

        /**
         * 转成 ApiResponses 可序列化的 Map。
         */
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
            return map;
        }

        /**
         * 防御性归一化等级，避免外部模型返回未知字符串导致前端样式失效。
         */
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

        /**
         * 响应列表不可变，防止调用方在返回前继续修改结果。
         */
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

    public static final class AnalysisUnavailableException extends RuntimeException {
        public AnalysisUnavailableException(String message) {
            super(message);
        }
    }
}
