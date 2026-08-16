package site.hsu.hub.recruitment.domain;
import site.hsu.hub.common.exception.*;import site.hsu.hub.recruitment.domain.RecruitmentCommands.*;import java.util.*;
public final class FormSchemaValidator{
 private static final Set<String>TYPES=Set.of("SHORT_TEXT","LONG_TEXT","SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN","EMAIL","TELEPHONE","RESUME","CONSENT");private FormSchemaValidator(){}
 public static void validate(FormCommand form){if(form==null||form.steps()==null||form.steps().isEmpty())fail("지원서 단계가 필요합니다.");long resume=0;for(var step:form.steps()){if(step.title()==null||step.title().isBlank()||step.questions()==null||step.questions().isEmpty())fail("각 단계에는 제목과 질문이 필요합니다.");for(var q:step.questions()){if(!TYPES.contains(q.type())||q.label()==null||q.label().isBlank())fail("질문 유형과 제목을 확인해 주세요.");if("RESUME".equals(q.type()))resume++;if(List.of("SINGLE_CHOICE","MULTIPLE_CHOICE","DROPDOWN").contains(q.type())){if(q.options()==null||q.options().isEmpty()||new HashSet<>(q.options()).size()!=q.options().size())fail("선택지는 비어 있거나 중복될 수 없습니다.");}}}if(resume>1)fail("이력서 질문은 하나만 추가할 수 있습니다.");}
 private static void fail(String m){throw new ApiException(ErrorCode.VALIDATION_FAILED,m);}
}
