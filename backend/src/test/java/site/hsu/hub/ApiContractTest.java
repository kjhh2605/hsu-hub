package site.hsu.hub;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiContractTest {
    @Autowired MockMvc mvc;

    @Test
    void unauthorizedJsonUsesEnvelopeAndRequestId() throws Exception {
        mvc.perform(get("/api/v1/clubs"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().exists("X-Request-ID"))
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.requestId", not(blankOrNullString())));
    }

    @Test
    void csrfIsRequiredForLogout() throws Exception {
        mvc.perform(post("/api/v1/auth/logout").with(user("verified")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "/api/v1/auth/signup",
        "/api/v1/auth/login",
        "/api/v1/auth/email-verifications/resend",
        "/api/v1/auth/email-verifications/confirm",
        "/api/v1/auth/password-resets/request",
        "/api/v1/auth/password-resets/confirm"
    })
    void removedEmailAuthenticationRoutesReturnWrapped404(String route) throws Exception {
        mvc.perform(post(route).with(user("verified")).with(csrf()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void openApiCarriesKakaoLoginDocsWithoutLegacySignupInstructions() throws Exception {
        mvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("카카오 로그인")))
            .andExpect(content().string(not(containsString("한성대학교 이메일과 10자 이상의 비밀번호"))))
            .andExpect(content().string(containsString("모집 게시")));
    }

    @Test
    void unknownFrontendCannotSelectAnOAuthCallbackOrigin() throws Exception {
        mvc.perform(get("/api/v1/auth/kakao/start").header("X-HSU-Frontend", "evil"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void removedApiRouteReturnsWrapped404() throws Exception {
        mvc.perform(get("/api/v1/interviews").with(user("verified")))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
