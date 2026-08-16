package site.hsu.hub.file.adapter.out.persistence;
import jakarta.persistence.*; import site.hsu.hub.file.domain.FilePurpose; import java.time.Instant;
@Entity @Table(name="file_assets") public class FileAssetEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="object_key",nullable=false,unique=true,length=80) private String objectKey;
 @Column(name="original_filename",nullable=false,length=120) private String filename;
 @Column(name="media_type",nullable=false,length=100) private String mediaType;
 @Column(name="byte_size",nullable=false) private long size;
 @Column(name="sha256",nullable=false,length=64) private String sha256;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private FilePurpose purpose;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 protected FileAssetEntity(){} public FileAssetEntity(String key,String filename,String mediaType,long size,String sha,FilePurpose purpose){objectKey=key;this.filename=filename;this.mediaType=mediaType;this.size=size;sha256=sha;this.purpose=purpose;createdAt=Instant.now();}
 public Long id(){return id;} public String objectKey(){return objectKey;} public String filename(){return filename;} public String mediaType(){return mediaType;} public long size(){return size;} public String sha256(){return sha256;} public FilePurpose purpose(){return purpose;}
}
