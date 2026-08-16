package site.hsu.hub.club.adapter.in.web;
import jakarta.servlet.http.HttpServletRequest;import jakarta.validation.Valid;import jakarta.validation.constraints.Size;import org.springframework.web.bind.annotation.*;import org.springframework.web.multipart.MultipartFile;import site.hsu.hub.club.application.ClubService;import site.hsu.hub.common.api.*;import java.io.IOException;import java.util.List;
@RestController@RequestMapping("/api/v1/operator/clubs")public class OperatorClubController implements OperatorClubControllerDocs{
 private final ClubService service;public OperatorClubController(ClubService service){this.service=service;}
 @Override@GetMapping public ApiResponse<List<ClubService.ClubView>>list(HttpServletRequest req){return Responses.ok(service.operatorClubs(),req);}
 @Override@GetMapping("/{id}")public ApiResponse<ClubService.ClubView>get(@PathVariable Long id,HttpServletRequest req){return Responses.ok(service.operatorGet(id),req);}
 @Override@PatchMapping("/{id}")public ApiResponse<ClubService.ClubView>update(@PathVariable Long id,@Valid@RequestBody UpdateRequest body,HttpServletRequest req){return Responses.ok(service.update(id,new ClubService.UpdateClub(body.shortIntroduction(),body.detailedIntroduction(),body.activityPeriod(),body.activityPlace())),req);}
 @Override@PutMapping(value="/{id}/cover",consumes=org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)public ApiResponse<ClubService.ClubView>cover(@PathVariable Long id,@RequestPart("file")MultipartFile file,HttpServletRequest req)throws IOException{return Responses.ok(service.replaceCover(id,file.getOriginalFilename(),file.getContentType(),file.getBytes()),req);}
 public record UpdateRequest(@Size(max=240)String shortIntroduction,@Size(max=10000)String detailedIntroduction,@Size(max=100)String activityPeriod,@Size(max=100)String activityPlace){}
}
