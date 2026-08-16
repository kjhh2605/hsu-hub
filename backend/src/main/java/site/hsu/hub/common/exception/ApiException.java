package site.hsu.hub.common.exception;

import site.hsu.hub.common.api.ApiResponse;
import java.util.List;

public class ApiException extends RuntimeException {
    private final ErrorCode code;
    private final List<ApiResponse.FieldError> errors;
    public ApiException(ErrorCode code) { this(code, code.message(), List.of()); }
    public ApiException(ErrorCode code, String message) { this(code, message, List.of()); }
    public ApiException(ErrorCode code, String message, List<ApiResponse.FieldError> errors) {
        super(message); this.code = code; this.errors = List.copyOf(errors);
    }
    public ErrorCode code() { return code; }
    public List<ApiResponse.FieldError> errors() { return errors; }
}
