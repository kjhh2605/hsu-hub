package site.hsu.hub.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "이미 처리되었거나 충돌하는 요청입니다."),
    PAYLOAD_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "업로드 가능한 크기를 초과했습니다."),
    VALIDATION_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "입력 내용을 확인해 주세요."),
    KAKAO_LOGIN_FAILED(HttpStatus.BAD_GATEWAY, "카카오 로그인을 완료하지 못했습니다."),
    KAKAO_EMAIL_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY, "유효하고 인증된 카카오계정 이메일이 필요합니다."),
    STORAGE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "파일 저장소를 사용할 수 없습니다."),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
    ErrorCode(HttpStatus status, String message) { this.status = status; this.message = message; }
    public HttpStatus status() { return status; }
    public String message() { return message; }
}
