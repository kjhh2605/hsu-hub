package site.hsu.hub.recruitment.domain;
import org.junit.jupiter.api.Test;import site.hsu.hub.common.exception.ApiException;import site.hsu.hub.recruitment.domain.RecruitmentCommands.*;import java.util.List;import static org.assertj.core.api.Assertions.assertThatThrownBy;
class FormSchemaValidatorTest{
 @Test void rejectsMoreThanOneResumeQuestion(){var resume=new QuestionCommand("RESUME","이력서",true,null,null,null,List.of());var form=new FormCommand(List.of(new StepCommand("기본",List.of(resume,resume))));assertThatThrownBy(()->FormSchemaValidator.validate(form)).isInstanceOf(ApiException.class);}
 @Test void rejectsDuplicateOptions(){var choice=new QuestionCommand("SINGLE_CHOICE","학년",true,null,null,null,List.of("1학년","1학년"));var form=new FormCommand(List.of(new StepCommand("기본",List.of(choice))));assertThatThrownBy(()->FormSchemaValidator.validate(form)).isInstanceOf(ApiException.class);}
}
