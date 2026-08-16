package site.hsu.hub.file.adapter.out.storage;
import org.springframework.beans.factory.annotation.Value; import org.springframework.context.annotation.Profile; import org.springframework.stereotype.Component; import site.hsu.hub.common.exception.*; import site.hsu.hub.file.application.port.ObjectStorage; import java.io.IOException; import java.nio.file.*;
@Component @Profile({"local","dev","test"}) public class LocalObjectStorage implements ObjectStorage {
 private final Path root; public LocalObjectStorage(@Value("${hsu.storage.local-path:.local-storage}") String path){try{root=Path.of(path).toAbsolutePath().normalize();Files.createDirectories(root);}catch(IOException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
 private Path resolve(String key){Path p=root.resolve(key).normalize();if(!p.getParent().equals(root))throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);return p;}
 public void put(String key,String type,byte[] bytes){try{Files.write(resolve(key),bytes,StandardOpenOption.CREATE_NEW);}catch(IOException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
 public byte[] get(String key){try{return Files.readAllBytes(resolve(key));}catch(IOException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
 public void delete(String key){try{Files.deleteIfExists(resolve(key));}catch(IOException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
}
