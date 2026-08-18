package site.hsu.hub.identity.adapter.in.web;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

interface AuthControllerDocs {
    @Operation(summary = "카카오 로그인 시작", description = "카카오 로그인 상태를 발급하고 카카오 인증 화면으로 이동합니다.")
    void kakaoStart(String returnTo, HttpServletRequest request, HttpServletResponse response);

    @Operation(summary = "카카오 로그인 콜백", description = "카카오 계정을 확인하고 호스트 전용 서비스 세션을 발급합니다.")
    void kakaoCallback(String oauthCookie, String state, String code, String error,
                       HttpServletRequest request, HttpServletResponse response);

    @Operation(summary = "로그아웃", description = "현재 HSU Hub 세션을 폐기하고 쿠키를 만료합니다.")
    site.hsu.hub.common.api.ApiResponse<Void> logout(
        String session, HttpServletRequest request, HttpServletResponse response);

    @Operation(summary = "현재 세션", description = "로그인한 사용자의 최소 세션 정보를 반환합니다.")
    site.hsu.hub.common.api.ApiResponse<AuthController.SessionResponse> session(HttpServletRequest request);
}
