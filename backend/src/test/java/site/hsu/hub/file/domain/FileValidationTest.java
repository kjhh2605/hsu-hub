package site.hsu.hub.file.domain;

import org.junit.jupiter.api.Test;
import site.hsu.hub.common.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidationTest {
    @Test void forgedPdfIsRejected() {
        assertThatThrownBy(() -> FileValidation.validateResume("resume.pdf", "application/pdf",
                "not a pdf".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(ApiException.class);
    }

    @Test void hostileResumeUrlIsRejected() {
        assertThatThrownBy(() -> FileValidation.validateHttpsUrl("javascript:alert(1)"))
                .isInstanceOf(ApiException.class);
    }

    @Test void imageBytesWithMismatchedExtensionAreRejected() {
        byte[] png=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
        assertThatThrownBy(() -> FileValidation.validateCover("cover.txt","image/png",png))
                .isInstanceOf(ApiException.class);
    }

    @Test void introductionImagesUseTheSameSafeImagePolicy() {
        byte[] png=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
        FileValidation.validateIntroductionImage("intro.png", "image/png", png);
    }

    @Test void oversizedIntroductionImageIsRejected() {
        assertThatThrownBy(() -> FileValidation.validateIntroductionImage(
                "intro.png", "image/png", new byte[FileValidation.INTRODUCTION_IMAGE_MAX + 1]))
                .isInstanceOf(ApiException.class);
    }
}
