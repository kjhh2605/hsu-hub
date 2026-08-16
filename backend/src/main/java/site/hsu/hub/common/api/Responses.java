package site.hsu.hub.common.api;

import jakarta.servlet.http.HttpServletRequest;

public final class Responses {
    private Responses() {}
    public static <T> ApiResponse<T> ok(T data, HttpServletRequest request) {
        return ApiResponse.ok(data, (String) request.getAttribute(RequestIdFilter.REQUEST_ID));
    }
}
