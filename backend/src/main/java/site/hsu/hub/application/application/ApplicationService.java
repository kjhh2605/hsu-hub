package site.hsu.hub.application.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.hsu.hub.application.adapter.out.persistence.*;
import site.hsu.hub.application.domain.AnswerValidator;
import site.hsu.hub.club.api.ClubScope;
import site.hsu.hub.common.exception.*;
import site.hsu.hub.file.api.*;
import site.hsu.hub.identity.api.CurrentUser;
import site.hsu.hub.recruitment.api.*;
import java.time.Instant;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;

@Service
public class ApplicationService {
    private final ApplicationRepository applications;
    private final ApplicationAnswerRepository answers;
    private final ResumeSubmissionRepository resumes;
    private final IdempotencyRepository idempotency;
    private final RecruitmentApplicationReader recruitments;
    private final CurrentUser current;
    private final ClubScope clubs;
    private final FileStorageService files;
    private final ObjectMapper mapper;

    public ApplicationService(ApplicationRepository applications, ApplicationAnswerRepository answers,
                              ResumeSubmissionRepository resumes, IdempotencyRepository idempotency,
                              RecruitmentApplicationReader recruitments, CurrentUser current, ClubScope clubs,
                              FileStorageService files, ObjectMapper mapper) {
        this.applications=applications; this.answers=answers; this.resumes=resumes; this.idempotency=idempotency;
        this.recruitments=recruitments; this.current=current; this.clubs=clubs; this.files=files; this.mapper=mapper;
    }

    @Transactional
    public SubmissionResult submit(Long recruitmentId, String key, Map<String,Object> submitted,
                                   String filename, String contentType, byte[] pdf) {
        if (key==null || key.isBlank() || key.length()>100)
            throw new ApiException(ErrorCode.BAD_REQUEST,"Idempotency-Key 헤더가 필요합니다.");
        Long userId=current.id();
        byte[] actualPdf=pdf==null||pdf.length==0?null:pdf;
        String hash=payloadHash(submitted,actualPdf);
        var replay=idempotency.findByUserIdAndRecruitmentIdAndKey(userId,recruitmentId,key);
        if(replay.isPresent()) {
            if(!replay.get().payloadHash().equals(hash))
                throw new ApiException(ErrorCode.CONFLICT,"같은 멱등성 키에 다른 요청을 사용할 수 없습니다.");
            var app=applications.findById(replay.get().applicationId()).orElseThrow(()->new ApiException(ErrorCode.CONFLICT));
            return new SubmissionResult(app.publicId(),app.submittedAt(),true);
        }
        var recruitment=recruitments.requireOpen(recruitmentId,Instant.now());
        var form=recruitments.form(recruitmentId);
        if(applications.findByUserIdAndRecruitmentId(userId,recruitmentId).isPresent())
            throw new ApiException(ErrorCode.CONFLICT,"이미 지원서를 제출했습니다.");
        Map<String,Object> safe=submitted==null?Map.of():submitted;
        AnswerValidator.validate(form.questions(),safe,actualPdf!=null);
        var resumeQuestion=form.questions().stream().filter(q->"RESUME".equals(q.type())).findFirst().orElse(null);
        if(actualPdf!=null&&resumeQuestion==null)
            throw new ApiException(ErrorCode.VALIDATION_FAILED,"게시된 지원서에 이력서 질문이 없습니다.");
        StoredFile stored=actualPdf==null?null:files.storeResume(filename,contentType,actualPdf);
        var app=applications.saveAndFlush(new ApplicationEntity(UUID.randomUUID().toString(),userId,recruitment.id()));
        for(var q:form.questions()) {
            if("RESUME".equals(q.type())) continue;
            Object value=safe.get(q.id().toString());
            if(value!=null) answers.save(new ApplicationAnswerEntity(app.id(),q.id(),json(value)));
        }
        if(resumeQuestion!=null) {
            String url=safe.get(resumeQuestion.id().toString()) instanceof String s&&!s.isBlank()?s.trim():null;
            if(stored!=null||url!=null)
                resumes.save(new ResumeSubmissionEntity(app.id(),resumeQuestion.id(),stored==null?null:stored.id(),url));
        }
        idempotency.save(new IdempotencyEntity(userId,recruitmentId,key,hash,app.id()));
        return new SubmissionResult(app.publicId(),app.submittedAt(),false);
    }

    @Transactional(readOnly=true)
    public List<ApplicationSummary> list(Long recruitmentId) {
        var r=recruitments.get(recruitmentId); clubs.requireOperator(r.clubId());
        var form=recruitments.form(recruitmentId);
        var nameQuestion=form.questions().stream().filter(q->!"RESUME".equals(q.type())&&q.label().trim().equals("이름")).findFirst().orElse(null);
        var found=applications.findByRecruitmentIdOrderBySubmittedAtDesc(recruitmentId);
        Map<Long,List<ApplicationAnswerEntity>> grouped=new HashMap<>();
        answers.findByApplicationIdIn(found.stream().map(ApplicationEntity::id).toList())
                .forEach(a->grouped.computeIfAbsent(a.applicationId(),x->new ArrayList<>()).add(a));
        return found.stream().map(a->{
            String name=null;
            if(nameQuestion!=null) name=grouped.getOrDefault(a.id(),List.of()).stream()
                    .filter(x->x.questionId().equals(nameQuestion.id())).findFirst().map(x->stringValue(x.value())).orElse(null);
            return new ApplicationSummary(a.publicId(),name==null||name.isBlank()?"지원자 "+a.publicId().substring(0,8):name,a.submittedAt());
        }).toList();
    }

    @Transactional(readOnly=true)
    public ApplicationDetail detail(String publicId) {
        var app=requireScoped(publicId); var form=recruitments.form(app.recruitmentId());
        Map<Long,FormDefinition.Question> byId=new HashMap<>(); form.questions().forEach(q->byId.put(q.id(),q));
        var answerViews=answers.findByApplicationId(app.id()).stream().map(a->{var q=byId.get(a.questionId());return new AnswerView(a.questionId(),q==null?"삭제된 질문":q.label(),q==null?"UNKNOWN":q.type(),read(a.value()));}).toList();
        var resume=resumes.findByApplicationId(app.id()).map(r->new ResumeView(r.questionId(),r.fileAssetId()!=null,r.externalUrl())).orElse(null);
        return new ApplicationDetail(app.publicId(),app.recruitmentId(),app.submittedAt(),answerViews,resume);
    }

    @Transactional(readOnly=true)
    public StoredFile resume(String publicId) {
        var app=requireScoped(publicId);
        var resume=resumes.findByApplicationId(app.id()).orElseThrow(()->new ApiException(ErrorCode.NOT_FOUND));
        if(resume.fileAssetId()==null)throw new ApiException(ErrorCode.NOT_FOUND);
        return files.read(resume.fileAssetId());
    }

    private ApplicationEntity requireScoped(String id) {
        var app=applications.findByPublicId(id).orElseThrow(()->new ApiException(ErrorCode.NOT_FOUND));
        clubs.requireOperator(recruitments.get(app.recruitmentId()).clubId());
        return app;
    }
    private String payloadHash(Map<String,Object> values,byte[] pdf){TreeMap<String,Object> sorted=new TreeMap<>(values==null?Map.of():values);String fileHash=pdf==null?"":sha256(pdf);return sha256((json(sorted)+":"+fileHash).getBytes(StandardCharsets.UTF_8));}
    private static String sha256(byte[] bytes){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
    private String json(Object value){try{return mapper.writeValueAsString(value);}catch(JsonProcessingException e){throw new ApiException(ErrorCode.BAD_REQUEST);}}
    private Object read(String value){try{return mapper.readValue(value,Object.class);}catch(JsonProcessingException e){throw new IllegalStateException(e);}}
    private String stringValue(String value){Object o=read(value);return o instanceof String s?s:null;}
    public record SubmissionResult(String publicId,Instant submittedAt,boolean replayed){}
    public record ApplicationSummary(String publicId,String displayName,Instant submittedAt){}
    public record ApplicationDetail(String publicId,Long recruitmentId,Instant submittedAt,List<AnswerView> answers,ResumeView resume){}
    public record AnswerView(Long questionId,String label,String type,Object value){}
    public record ResumeView(Long questionId,boolean pdf,String url){}
}
