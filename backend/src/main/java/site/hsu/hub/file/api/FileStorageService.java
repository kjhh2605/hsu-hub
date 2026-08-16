package site.hsu.hub.file.api;
public interface FileStorageService {
 StoredFile storeResume(String filename,String contentType,byte[] bytes);
 StoredFile storeCover(String filename,String contentType,byte[] bytes);
 StoredFile read(Long id);
 void delete(Long id);
}
