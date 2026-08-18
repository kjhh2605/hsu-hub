package site.hsu.hub.recruitment.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.hsu.hub.club.api.*;
import site.hsu.hub.common.exception.*;
import site.hsu.hub.identity.api.CurrentUser;
import site.hsu.hub.recruitment.adapter.out.persistence.*;
import site.hsu.hub.recruitment.api.*;
import site.hsu.hub.recruitment.domain.*;

import java.time.Instant;
import java.util.*;

import static site.hsu.hub.recruitment.domain.RecruitmentCommands.*;

@Service
public class RecruitmentService implements RecruitmentApplicationReader {
    private final RecruitmentRepository recruitments;
    private final RecruitmentStageRepository stages;
    private final ApplicationFormRepository forms;
    private final FormStepRepository steps;
    private final FormQuestionRepository questions;
    private final QuestionOptionRepository options;
    private final ClubScope clubScope;
    private final CurrentUser current;

    public RecruitmentService(RecruitmentRepository r, RecruitmentStageRepository s, ApplicationFormRepository f,
                              FormStepRepository st, FormQuestionRepository q, QuestionOptionRepository o,
                              ClubScope c, CurrentUser current) {
        recruitments = r; stages = s; forms = f; steps = st; questions = q; options = o;
        clubScope = c; this.current = current;
    }

    @Transactional
    public RecruitmentView publish(Long clubId, PublishCommand cmd) {
        new RecruitmentPeriod(cmd.opensAt(), cmd.closesAt());
        FormSchemaValidator.validate(cmd.form());
        validateStages(cmd.stages());
        clubScope.lockOperatorClub(clubId);
        if (recruitments.hasOverlap(clubId, cmd.opensAt(), cmd.closesAt()))
            throw new ApiException(ErrorCode.CONFLICT, "기존 모집 기간과 겹칩니다.");
        var entity = recruitments.save(new RecruitmentEntity(clubId, cmd.opensAt(), cmd.closesAt(), current.id()));
        int i = 0;
        for (var s : cmd.stages()) stages.save(new RecruitmentStageEntity(entity.id(), s.type(), s.label(), s.startsAt(), s.endsAt(), s.enabled(), i++));
        var form = forms.save(new ApplicationFormEntity(entity.id())); i = 0;
        for (var sc : cmd.form().steps()) {
            var step = steps.save(new FormStepEntity(form.id(), sc.title(), i++)); int qi = 0;
            for (var qc : sc.questions()) {
                var q = questions.save(new FormQuestionEntity(step.id(), qc.type(), qc.label(), qc.required(), qc.helpText(), qc.placeholder(), qc.maxLength(), qi++)); int oi = 0;
                for (String value : qc.options() == null ? List.<String>of() : qc.options()) options.save(new QuestionOptionEntity(q.id(), value, oi++));
            }
        }
        return view(entity);
    }

    @Transactional(readOnly = true)
    public List<RecruitmentView> operatorList(Long clubId) {
        clubScope.requireOperator(clubId);
        return recruitments.findByClubIdOrderByPublishedAtDesc(clubId).stream().map(this::view).toList();
    }

    @Override @Transactional(readOnly = true)
    public FormDefinition form(Long recruitmentId) {
        var r = find(recruitmentId);
        var f = forms.findByRecruitmentId(r.id()).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        var stepEntities = steps.findByFormIdOrderByOrder(f.id());
        var qs = questions.findByStepIdIn(stepEntities.stream().map(FormStepEntity::id).toList());
        var opts = options.findByQuestionIdIn(qs.stream().map(FormQuestionEntity::id).toList());
        Map<Long, List<String>> byQuestion = new HashMap<>();
        opts.stream().sorted(Comparator.comparingInt(QuestionOptionEntity::order)).forEach(o -> byQuestion.computeIfAbsent(o.questionId(), k -> new ArrayList<>()).add(o.value()));
        Map<Long, List<FormQuestionEntity>> byStep = new HashMap<>();
        qs.stream().sorted(Comparator.comparingInt(FormQuestionEntity::order)).forEach(q -> byStep.computeIfAbsent(q.stepId(), k -> new ArrayList<>()).add(q));
        var dtoSteps = stepEntities.stream().map(s -> new FormDefinition.Step(s.id(), s.title(), s.order(),
                byStep.getOrDefault(s.id(), List.of()).stream().map(q -> new FormDefinition.Question(q.id(), q.type(), q.label(), q.required(), q.helpText(), q.placeholder(), q.maxLength(), byQuestion.getOrDefault(q.id(), List.of()))).toList())).toList();
        return new FormDefinition(r.id(), dtoSteps);
    }

    @Override @Transactional(readOnly = true)
    public Snapshot requireOpen(Long id, Instant now) {
        var r = find(id);
        if (!clubScope.isRecruiting(r.clubId()) || new RecruitmentPeriod(r.opensAt(), r.closesAt()).stateAt(now) != RecruitmentState.OPEN
                || forms.findByRecruitmentId(r.id()).isEmpty())
            throw new ApiException(ErrorCode.CONFLICT, "현재 지원 가능한 모집이 아닙니다.");
        return new Snapshot(r.id(), r.clubId(), r.opensAt(), r.closesAt());
    }

    @Override @Transactional(readOnly = true)
    public Snapshot get(Long id) {
        var r = find(id);
        return new Snapshot(r.id(), r.clubId(), r.opensAt(), r.closesAt());
    }

    private RecruitmentEntity find(Long id) { return recruitments.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }

    private RecruitmentView view(RecruitmentEntity r) {
        return new RecruitmentView(r.id(), r.clubId(), r.opensAt(), r.closesAt(), new RecruitmentPeriod(r.opensAt(), r.closesAt()).stateAt(Instant.now()).name(),
                stages.findByRecruitmentIdOrderByOrder(r.id()).stream().map(s -> new StageView(s.type(), s.label(), s.startsAt(), s.endsAt(), s.enabled())).toList(), r.publishedAt());
    }

    private static void validateStages(List<StageCommand> stages) {
        if (stages == null) throw new ApiException(ErrorCode.VALIDATION_FAILED);
        Set<String> types = Set.of("DOCUMENT", "DOCUMENT_RESULT", "INTERVIEW", "FINAL_RESULT");
        for (var x : stages) if (!types.contains(x.type()) || x.label() == null || x.label().isBlank()
                || (x.enabled() && (x.startsAt() == null || x.endsAt() == null || !x.startsAt().isBefore(x.endsAt()))))
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "전형 일정을 확인해 주세요.");
    }

    public record RecruitmentView(Long id, Long clubId, Instant opensAt, Instant closesAt, String state,
                                  List<StageView> stages, Instant publishedAt) {}
    public record StageView(String type, String label, Instant startsAt, Instant endsAt, boolean enabled) {}
}
