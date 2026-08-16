package site.hsu.hub.recruitment.domain;
import com.fasterxml.jackson.databind.JsonNode;import java.time.Instant;import java.util.List;
public final class RecruitmentCommands{private RecruitmentCommands(){}
 public record PublishCommand(String title,int quota,Instant opensAt,Instant closesAt,JsonNode contentBlocks,List<StageCommand> stages,FormCommand form){}
 public record StageCommand(String type,String label,Instant startsAt,Instant endsAt,boolean enabled){}
 public record FormCommand(List<StepCommand> steps){}
 public record StepCommand(String title,List<QuestionCommand> questions){}
 public record QuestionCommand(String type,String label,boolean required,String helpText,String placeholder,Integer maxLength,List<String> options){}
}
