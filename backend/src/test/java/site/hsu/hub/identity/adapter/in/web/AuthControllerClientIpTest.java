package site.hsu.hub.identity.adapter.in.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class AuthControllerClientIpTest {
    @Test
    void usesTheCloudFrontGeneratedIpv4AddressWithoutItsPort() {
        var request = request("10.42.1.10", "198.51.100.10:46532");

        assertThat(AuthController.clientIp(request)).isEqualTo("198.51.100.10");
    }

    @Test
    void usesTheCloudFrontGeneratedBracketedIpv6AddressWithoutItsPort() {
        var request = request("10.42.1.10", "[2001:db8::7]:46532");

        assertThat(AuthController.clientIp(request)).isEqualTo("2001:db8::7");
    }

    @Test
    void fallsBackToTheDirectPeerWhenTheTrustedHeaderIsMissingOrMalformed() {
        assertThat(AuthController.clientIp(request("127.0.0.1", null))).isEqualTo("127.0.0.1");
        assertThat(AuthController.clientIp(request("10.42.1.10", "not-an-address"))).isEqualTo("10.42.1.10");
    }

    private static MockHttpServletRequest request(String remoteAddress, String viewerAddress) {
        var request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        if (viewerAddress != null) request.addHeader("CloudFront-Viewer-Address", viewerAddress);
        return request;
    }
}
