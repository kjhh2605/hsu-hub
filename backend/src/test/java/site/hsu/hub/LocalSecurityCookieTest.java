package site.hsu.hub;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "hsu.security.secure-cookies=false",
    "hsu.security.csrf-cookie-name=XSRF-TOKEN"
})
@AutoConfigureMockMvc
class LocalSecurityCookieTest {
    @Autowired MockMvc mvc;

    @Test
    void localProfileExposesReadableCsrfCookieWithoutSecureFlag() throws Exception {
        mvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("XSRF-TOKEN=")))
            .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Secure"))));
    }

    @Test
    void localRawCsrfCookieAndHeaderAreAcceptedForMutation() throws Exception {
        mvc.perform(post("/api/v1/auth/logout")
                .with(user("verified"))
                .cookie(new Cookie("XSRF-TOKEN", "local-csrf"))
                .header("X-XSRF-TOKEN", "local-csrf"))
            .andExpect(status().isOk());
    }
}
