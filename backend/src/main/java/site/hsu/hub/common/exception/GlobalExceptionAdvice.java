package site.hsu.hub.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import site.hsu.hub.common.api.ApiResponse;
import site.hsu.hub.common.api.RequestIdFilter;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionAdvice {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionAdvice.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiResponse<Void>> api(ApiException ex, HttpServletRequest request) {
        return response(ex.code(), ex.getMessage(), ex.errors(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ApiResponse.FieldError(e.getField(), e.getDefaultMessage())).toList();
        return response(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.message(), errors, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiResponse<Void>> constraint(ConstraintViolationException ex, HttpServletRequest request) {
        var errors = ex.getConstraintViolations().stream()
                .map(e -> new ApiResponse.FieldError(e.getPropertyPath().toString(), e.getMessage())).toList();
        return response(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.message(), errors, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestPartException.class})
    ResponseEntity<ApiResponse<Void>> malformed(Exception ex, HttpServletRequest request) {
        return response(ErrorCode.BAD_REQUEST, ErrorCode.BAD_REQUEST.message(), List.of(), request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse<Void>> tooLarge(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return response(ErrorCode.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE.message(), List.of(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> conflict(DataIntegrityViolationException ex, HttpServletRequest request) {
        return response(ErrorCode.CONFLICT, ErrorCode.CONFLICT.message(), List.of(), request);
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    ResponseEntity<ApiResponse<Void>> notFound(Exception ex, HttpServletRequest request) {
        return response(ErrorCode.NOT_FOUND, ErrorCode.NOT_FOUND.message(), List.of(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> internal(Exception ex, HttpServletRequest request) {
        log.error("Unhandled request failure requestId={}", request.getAttribute(RequestIdFilter.REQUEST_ID), ex);
        return response(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.message(), List.of(), request);
    }

    private ResponseEntity<ApiResponse<Void>> response(ErrorCode code, String message,
                                                        List<ApiResponse.FieldError> errors, HttpServletRequest request) {
        String id = (String) request.getAttribute(RequestIdFilter.REQUEST_ID);
        return ResponseEntity.status(code.status()).body(ApiResponse.error(code.name(), message, errors, id));
    }
}
