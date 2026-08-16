package site.hsu.hub.application.adapter.in.web;
import jakarta.servlet.http.HttpServletRequest;import jakarta.validation.Valid;import jakarta.validation.constraints.NotNull;import org.springframework.http.MediaType;import org.springframework.web.bind.annotation.*;import org.springframework.web.multipart.MultipartFile;import site.hsu.hub.application.application.ApplicationService;import site.hsu.hub.common.api.*;import java.io.IOException;import java.util.Map;
@RestController@RequestMapping("/api/v1/recruitments/{recruitmentId}/applications")public class ApplicationController implements ApplicationControllerDocs{
 private final ApplicationService service;public ApplicationController(ApplicationService service){this.service=service;}
 @Override@PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)public ApiResponse<ApplicationService.SubmissionResult>submit(@PathVariable Long recruitmentId,@RequestHeader("Idempotency-Key")String key,@Valid@RequestPart("payload")SubmitRequest payload,@RequestPart(value="file",required=false)MultipartFile file,HttpServletRequest req)throws IOException{byte[]bytes=file==null?null:file.getBytes();return Responses.ok(service.submit(recruitmentId,key,payload.answers(),file==null?null:file.getOriginalFilename(),file==null?null:file.getContentType(),bytes),req);}
 public record SubmitRequest(@NotNull Map<String,Object>answers){}
}
