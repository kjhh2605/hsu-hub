package site.hsu.hub.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record ApiResponse<T>(boolean success, String code, String message, T data,
                             List<FieldError> errors, Instant timestamp, String requestId) {
    public record FieldError(String field, String message) {}

    public static <T> ApiResponse<T> ok(T data, String requestId) {
        return new ApiResponse<>(true, "OK", "요청이 성공했습니다.", data, List.of(), Instant.now(), requestId);
    }

    public static ApiResponse<Void> error(String code, String message, List<FieldError> errors, String requestId) {
        return new ApiResponse<>(false, code, message, null, errors, Instant.now(), requestId);
    }
}
