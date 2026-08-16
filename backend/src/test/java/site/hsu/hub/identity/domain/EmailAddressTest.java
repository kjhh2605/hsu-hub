package site.hsu.hub.identity.domain;

import org.junit.jupiter.api.Test;
import site.hsu.hub.common.exception.ApiException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailAddressTest {
    @Test
    void normalizesHansungEmail() {
        assertThat(EmailAddress.hansung(" Student@HANSUNG.AC.KR ").value()).isEqualTo("student@hansung.ac.kr");
    }

    @Test
    void rejectsLookalikeDomain() {
        assertThatThrownBy(() -> EmailAddress.hansung("student@hansung.ac.kr.example"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("한성대학교");
    }
}
