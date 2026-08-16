package site.hsu.hub.file.api;
import site.hsu.hub.file.domain.FileValidation;import java.net.URI;
public final class FilePolicy{private FilePolicy(){}public static URI validateHttpsUrl(String raw){return FileValidation.validateHttpsUrl(raw);}}
