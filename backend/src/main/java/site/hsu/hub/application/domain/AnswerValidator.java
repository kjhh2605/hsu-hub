package site.hsu.hub.application.domain;

import site.hsu.hub.common.api.ApiResponse;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.file.api.FilePolicy;
import site.hsu.hub.recruitment.api.FormDefinition;
import java.util.*;
import java.util.regex.Pattern;

public final class AnswerValidator {
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^[0-9+() -]{7,20}$");
    private AnswerValidator() {}

    public static void validate(List<FormDefinition.Question> questions, Map<String, Object> answers, boolean hasPdf) {
        Map<String,Object> safe = answers == null ? Map.of() : answers;
        Set<String> known = new HashSet<>();
        for (var q : questions) {
            String key = q.id().toString(); known.add(key);
            Object value = safe.get(key);
            boolean empty = value == null || (value instanceof String s && s.isBlank()) || (value instanceof Collection<?> c && c.isEmpty());
            if ("RESUME".equals(q.type())) {
                boolean hasUrl = value instanceof String s && !s.isBlank();
                if (hasUrl && hasPdf) fail(key, "PDF와 링크 중 하나만 제출해 주세요.");
                if (q.required() && hasUrl == hasPdf) fail(key, "PDF 또는 HTTPS 링크 하나를 제출해 주세요.");
                if (hasUrl) FilePolicy.validateHttpsUrl((String)value);
                continue;
            }
            if (q.required() && empty) fail(key, "필수 항목입니다.");
            if (empty) continue;
            switch (q.type()) {
                case "SHORT_TEXT", "LONG_TEXT" -> validateText(q, key, value);
                case "EMAIL" -> { if (!(value instanceof String s) || !EMAIL.matcher(s).matches()) fail(key, "이메일 형식을 확인해 주세요."); }
                case "TELEPHONE" -> { if (!(value instanceof String s) || !PHONE.matcher(s).matches()) fail(key, "전화번호 형식을 확인해 주세요."); }
                case "SINGLE_CHOICE", "DROPDOWN" -> validateOneChoice(q, key, value);
                case "MULTIPLE_CHOICE" -> validateManyChoices(q, key, value);
                case "CONSENT" -> { if (!(value instanceof Boolean b) || !b) fail(key, "동의가 필요합니다."); }
                default -> fail(key, "지원하지 않는 질문 유형입니다.");
            }
        }
        for (String key : safe.keySet()) if (!known.contains(key)) fail(key, "게시된 지원서에 없는 질문입니다.");
    }

    private static void validateText(FormDefinition.Question q, String key, Object value) {
        if (!(value instanceof String s)) fail(key, "문자열로 입력해 주세요.");
        if (q.maxLength() != null && ((String)value).length() > q.maxLength()) fail(key, "입력 가능한 글자 수를 초과했습니다.");
    }
    private static void validateOneChoice(FormDefinition.Question q, String key, Object value) {
        if (!(value instanceof String s) || !q.options().contains(s)) fail(key, "선택지 중 하나를 골라 주세요.");
    }
    private static void validateManyChoices(FormDefinition.Question q, String key, Object value) {
        if (!(value instanceof Collection<?> c) || c.stream().anyMatch(v -> !(v instanceof String) || !q.options().contains(v)))
            fail(key, "유효한 선택지만 골라 주세요.");
    }
    private static void fail(String field, String message) {
        throw new ApiException(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.message(),
                List.of(new ApiResponse.FieldError(field, message)));
    }
}
