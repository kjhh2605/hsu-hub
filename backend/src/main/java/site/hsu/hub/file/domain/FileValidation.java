package site.hsu.hub.file.domain;

import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.apache.tika.Tika;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;

public final class FileValidation {
    public static final int RESUME_MAX = 10 * 1024 * 1024;
    public static final int COVER_MAX = 5 * 1024 * 1024;
    public static final int INTRODUCTION_IMAGE_MAX = COVER_MAX;
    private FileValidation() {}

    public static void validateResume(String filename, String contentType, byte[] bytes) {
        String safe = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (bytes == null || bytes.length == 0 || bytes.length > RESUME_MAX)
            throw new ApiException(bytes != null && bytes.length > RESUME_MAX ? ErrorCode.PAYLOAD_TOO_LARGE : ErrorCode.VALIDATION_FAILED, "PDF 파일 크기를 확인해 주세요.");
        if (!safe.endsWith(".pdf") || !"application/pdf".equalsIgnoreCase(contentType)
                || bytes.length < 5 || !new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")
                || !"application/pdf".equals(detect(bytes)))
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "유효한 PDF 파일만 업로드할 수 있습니다.");
    }

    public static void validateCover(String filename, String contentType, byte[] bytes) {
        validateImage(filename, contentType, bytes, COVER_MAX, "커버 이미지 크기를 확인해 주세요.");
    }

    public static void validateIntroductionImage(String filename, String contentType, byte[] bytes) {
        validateImage(filename, contentType, bytes, INTRODUCTION_IMAGE_MAX, "소개 이미지를 확인해 주세요.");
    }

    private static void validateImage(String filename, String contentType, byte[] bytes, int max, String sizeMessage) {
        if (bytes == null || bytes.length == 0 || bytes.length > max)
            throw new ApiException(bytes != null && bytes.length > max ? ErrorCode.PAYLOAD_TOO_LARGE : ErrorCode.VALIDATION_FAILED, sizeMessage);
        boolean jpeg = bytes.length > 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
        boolean png = bytes.length > 8 && bytes[0] == (byte)0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
        boolean webp = bytes.length > 12 && new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(bytes, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
        String ct = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        String safe=filename==null?"":filename.toLowerCase(Locale.ROOT);
        boolean extension=(jpeg&&(safe.endsWith(".jpg")||safe.endsWith(".jpeg")))||(png&&safe.endsWith(".png"))||(webp&&safe.endsWith(".webp"));
        boolean declared=(jpeg&&ct.equals("image/jpeg"))||(png&&ct.equals("image/png"))||(webp&&ct.equals("image/webp"));
        boolean detected=(jpeg&&"image/jpeg".equals(detect(bytes)))||(png&&"image/png".equals(detect(bytes)))||(webp&&"image/webp".equals(detect(bytes)));
        boolean decodable=webp||decodable(bytes);
        if (!extension || !declared || !detected || !decodable)
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "JPEG, PNG 또는 WebP 이미지만 업로드할 수 있습니다.");
    }

    public static URI validateHttpsUrl(String raw) {
        try {
            URI uri = URI.create(raw == null ? "" : raw.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null)
                throw new IllegalArgumentException();
            return uri;
        } catch (RuntimeException ex) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "HTTPS 형식의 유효한 링크를 입력해 주세요.");
        }
    }

    public static String sanitizeFilename(String raw) {
        String value = raw == null ? "file" : raw.replaceAll("[\\r\\n\\\\/]", "_").replaceAll("[^\\p{L}\\p{N}._ -]", "_").trim();
        if (value.isBlank()) value = "file";
        return value.substring(0, Math.min(value.length(), 120));
    }

    private static String detect(byte[] bytes){return new Tika().detect(bytes);}
    private static boolean decodable(byte[] bytes){try{return ImageIO.read(new ByteArrayInputStream(bytes))!=null;}catch(Exception e){return false;}}
}
