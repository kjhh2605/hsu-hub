package site.hsu.hub.club.adapter.in.web;
import jakarta.servlet.http.HttpServletRequest;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import site.hsu.hub.club.application.ClubService;import site.hsu.hub.common.api.*;import java.util.List;
@RestController@RequestMapping("/api/v1/clubs")public class ClubController implements ClubControllerDocs{
 private final ClubService service;public ClubController(ClubService service){this.service=service;}
 @Override@GetMapping public ApiResponse<List<ClubService.ClubView>>list(HttpServletRequest req){return Responses.ok(service.list(),req);}
 @Override@GetMapping("/{id}")public ApiResponse<ClubService.ClubView>get(@PathVariable Long id,HttpServletRequest req){return Responses.ok(service.get(id),req);}
 @Override@GetMapping("/{id}/cover")public ResponseEntity<byte[]>cover(@PathVariable Long id){var f=service.cover(id);return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.mediaType())).cacheControl(CacheControl.noStore()).header("X-Content-Type-Options","nosniff").header(HttpHeaders.CONTENT_DISPOSITION,"inline").body(f.bytes());}
}
