package site.hsu.hub.identity.adapter.in.web;
import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.responses.ApiResponse; import io.swagger.v3.oas.annotations.responses.ApiResponses;import jakarta.servlet.http.*;
interface AuthControllerDocs {
 @Operation(summary="회원가입",description="한성대학교 이메일과 10자 이상의 비밀번호로 가입하고 인증 메일을 전송합니다.") @ApiResponses({@ApiResponse(responseCode="200",description="가입 처리 완료"),@ApiResponse(responseCode="422",description="허용되지 않은 이메일 또는 유효성 실패"),@ApiResponse(responseCode="503",description="메일 서비스 장애")}) site.hsu.hub.common.api.ApiResponse<Void> signup(AuthController.SignupRequest body,HttpServletRequest req);
 @Operation(summary="인증 메일 재전송",description="계정 존재 여부를 노출하지 않고 인증 메일을 재전송합니다.") site.hsu.hub.common.api.ApiResponse<Void> resend(AuthController.EmailRequest body,HttpServletRequest req);
 @Operation(summary="이메일 인증",description="24시간 유효한 일회용 토큰을 확인합니다.") site.hsu.hub.common.api.ApiResponse<Void> confirmEmail(AuthController.TokenRequest body,HttpServletRequest req);
 @Operation(summary="로그인",description="검증된 계정으로 로그인하고 안전한 호스트 전용 세션 쿠키를 설정합니다.") site.hsu.hub.common.api.ApiResponse<AuthController.SessionResponse> login(AuthController.LoginRequest body,HttpServletRequest req,HttpServletResponse response);
 @Operation(summary="로그아웃",description="현재 서버 세션을 폐기하고 쿠키를 만료합니다.") site.hsu.hub.common.api.ApiResponse<Void> logout(String session,HttpServletRequest req,HttpServletResponse response);
 @Operation(summary="비밀번호 재설정 요청",description="계정 존재 여부를 노출하지 않고 재설정 메일을 요청합니다.") site.hsu.hub.common.api.ApiResponse<Void> requestReset(AuthController.EmailRequest body,HttpServletRequest req);
 @Operation(summary="비밀번호 재설정",description="30분 유효한 일회용 토큰으로 비밀번호를 변경합니다.") site.hsu.hub.common.api.ApiResponse<Void> confirmReset(AuthController.ResetConfirmRequest body,HttpServletRequest req);
 @Operation(summary="현재 세션",description="로그인한 사용자의 최소 세션 정보를 반환합니다.") site.hsu.hub.common.api.ApiResponse<AuthController.SessionResponse> session(HttpServletRequest req);
}
