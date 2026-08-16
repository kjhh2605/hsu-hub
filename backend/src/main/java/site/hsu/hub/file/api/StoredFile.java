package site.hsu.hub.file.api;
public record StoredFile(Long id,String filename,String mediaType,long size,String sha256,byte[] bytes) { public StoredFile { bytes=bytes==null?null:bytes.clone(); } }
