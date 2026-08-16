package site.hsu.hub.file.adapter.out.storage;
import org.springframework.beans.factory.annotation.Value; import org.springframework.context.annotation.Profile; import org.springframework.stereotype.Component; import site.hsu.hub.common.exception.*; import site.hsu.hub.file.application.port.ObjectStorage; import software.amazon.awssdk.core.sync.RequestBody; import software.amazon.awssdk.services.s3.S3Client; import software.amazon.awssdk.services.s3.model.*;
@Component @Profile("prod") class S3ObjectStorage implements ObjectStorage {
 private final S3Client s3;private final String bucket;S3ObjectStorage(S3Client s3,@Value("${hsu.storage.bucket}")String bucket){this.s3=s3;this.bucket=bucket;}
 public void put(String key,String type,byte[] bytes){try{s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(type).serverSideEncryption(ServerSideEncryption.AES256).build(),RequestBody.fromBytes(bytes));}catch(RuntimeException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
 public byte[] get(String key){try{return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build()).asByteArray();}catch(RuntimeException e){throw new ApiException(ErrorCode.STORAGE_UNAVAILABLE);}}
 public void delete(String key){s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());}
}
