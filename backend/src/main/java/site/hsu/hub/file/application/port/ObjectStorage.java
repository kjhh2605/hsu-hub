package site.hsu.hub.file.application.port; public interface ObjectStorage { void put(String key,String mediaType,byte[] bytes); byte[] get(String key); void delete(String key); }
