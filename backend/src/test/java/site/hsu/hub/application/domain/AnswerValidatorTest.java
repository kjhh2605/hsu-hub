package site.hsu.hub.application.domain;

import org.junit.jupiter.api.Test;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.recruitment.api.FormDefinition;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class AnswerValidatorTest {
    @Test void rejectsChoiceOutsidePublishedOptions() {
        var question = new FormDefinition.Question(1L, "SINGLE_CHOICE", "학년", true,
                null, null, null, List.of("1학년", "2학년"));
        assertThatThrownBy(() -> AnswerValidator.validate(List.of(question), Map.of("1", List.of("3학년")), false))
                .isInstanceOf(ApiException.class);
    }

    @Test void requiredResumeNeedsExactlyOneSource() {
        var question = new FormDefinition.Question(7L, "RESUME", "이력서", true,
                null, null, null, List.of());
        assertThatThrownBy(() -> AnswerValidator.validate(List.of(question), Map.of("7", "https://example.com/cv.pdf"), true))
                .isInstanceOf(ApiException.class);
    }

    @Test void acceptsEverySupportedNonResumeQuestionType() {
        var questions=List.of(
                new FormDefinition.Question(1L,"SHORT_TEXT","이름",true,null,null,10,List.of()),
                new FormDefinition.Question(2L,"LONG_TEXT","소개",true,null,null,100,List.of()),
                new FormDefinition.Question(3L,"SINGLE_CHOICE","학년",true,null,null,null,List.of("1","2")),
                new FormDefinition.Question(4L,"MULTIPLE_CHOICE","관심",true,null,null,null,List.of("A","B")),
                new FormDefinition.Question(5L,"DROPDOWN","전공",true,null,null,null,List.of("컴공")),
                new FormDefinition.Question(6L,"EMAIL","연락 이메일",true,null,null,null,List.of()),
                new FormDefinition.Question(7L,"TELEPHONE","전화",true,null,null,null,List.of()),
                new FormDefinition.Question(8L,"CONSENT","동의",true,null,null,null,List.of()));
        var values=Map.<String,Object>of("1","홍길동","2","안녕하세요","3","1","4",List.of("A","B"),"5","컴공","6","hello@example.com","7","010-1234-5678","8",true);
        assertThatCode(()->AnswerValidator.validate(questions,values,false)).doesNotThrowAnyException();
    }

    @Test void enforcesTextLengthAndRequiredConsent() {
        var text=new FormDefinition.Question(1L,"SHORT_TEXT","이름",true,null,null,2,List.of());
        assertThatThrownBy(()->AnswerValidator.validate(List.of(text),Map.of("1","세글자"),false)).isInstanceOf(ApiException.class);
        var consent=new FormDefinition.Question(2L,"CONSENT","동의",true,null,null,null,List.of());
        assertThatThrownBy(()->AnswerValidator.validate(List.of(consent),Map.of("2",false),false)).isInstanceOf(ApiException.class);
    }

    @Test void acceptsExactlyOneHttpsResumeSource() {
        var resume=new FormDefinition.Question(9L,"RESUME","이력서",true,null,null,null,List.of());
        assertThatCode(()->AnswerValidator.validate(List.of(resume),Map.of("9","https://example.com/cv.pdf"),false)).doesNotThrowAnyException();
        assertThatCode(()->AnswerValidator.validate(List.of(resume),Map.of(),true)).doesNotThrowAnyException();
    }
}
