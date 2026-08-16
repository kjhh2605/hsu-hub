import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import {
  Badge, Button, Card, CheckBox, EmptyState, Field, Input, OptionCard, Progress, Select, Textarea,
} from '../components/ui.jsx';
import { Alert, ArrowRight, Check, ChevronLeft, Link, Save, Send, Upload } from '../components/icons.jsx';
import { DEPARTMENTS } from '../data/constants.js';
import { validateApplyStep } from '../store/logic.js';
import { fmtDate } from '../utils/date.js';

const STEP_TITLES = ['기본 정보 확인', '지원서 작성', '최종 검토'];

export default function ApplyScreen() {
  const { recruitmentId } = useParams();
  const { state, sel, actions } = useApp();
  const nav = useNavigate();

  const recruitment = sel.recruitment(recruitmentId);
  const club = recruitment ? sel.club(recruitment.clubId) : null;
  const guard = recruitment ? sel.canApply(recruitmentId) : { ok: false, reason: '모집 공고를 찾을 수 없습니다.' };

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState(
    () =>
      state.drafts[recruitmentId] || {
        name: state.user.name,
        department: state.user.department,
        studentId: state.user.studentId,
        phone: state.user.phone,
        fieldId: '',
        answers: {},
        portfolioLink: '',
        portfolioFileName: '',
        agree: false,
      }
  );

  // 자동 저장 (Figma: "입력 내용이 실시간으로 자동 저장되고 있습니다")
  useEffect(() => {
    if (!recruitment) return;
    const t = setTimeout(() => actions.saveDraft(recruitmentId, draft), 400);
    return () => clearTimeout(t);
  }, [draft, recruitmentId, recruitment]);

  if (!recruitment || !club) {
    return (
      <>
        <TopBar title="Apply Form" back />
        <Screen>
          <EmptyState title="모집 공고를 찾을 수 없습니다" action={<Button onClick={() => nav('/explore')}>탐색으로</Button>} />
        </Screen>
      </>
    );
  }

  if (!guard.ok) {
    return (
      <>
        <TopBar title="Apply Form" back />
        <Screen>
          <EmptyState
            icon={<Alert size={26} />}
            title="지원할 수 없습니다"
            desc={guard.reason}
            action={
              guard.existing ? (
                <Button onClick={() => nav(`/applications/${guard.existing.id}`)}>내 지원서 보기</Button>
              ) : (
                <Button onClick={() => nav(`/clubs/${club.id}`)}>동아리 정보로</Button>
              )
            }
          />
        </Screen>
      </>
    );
  }

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setAnswer = (qid, v) => setDraft((d) => ({ ...d, answers: { ...d.answers, [qid]: v } }));

  const next = () => {
    const e = validateApplyStep(step, draft, recruitment);
    setErrors(e);
    if (Object.keys(e).length) {
      actions.toast('필수 항목을 확인해주세요.', 'error');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const prev = () => (step > 1 ? setStep(step - 1) : nav(-1));

  const submit = () => {
    const e = validateApplyStep(3, draft, recruitment);
    setErrors(e);
    if (Object.keys(e).length) {
      actions.toast('개인정보 수집·이용 동의가 필요합니다.', 'error');
      return;
    }
    const res = actions.submitApplication(recruitmentId, club.id, draft);
    if (res.ok) nav(`/apply/${recruitmentId}/done`, { replace: true });
  };

  const field = recruitment.fields.find((f) => f.id === draft.fieldId);

  return (
    <>
      <TopBar title="Apply Form" over={club.name} back />
      <Screen>
        {/* 진행 표시 */}
        <div className="col g8 mb20">
          <div className="row between">
            <span className="t-label c-primary">{STEP_TITLES[step - 1]}</span>
            <span className="t-cap ink3">{step} / 3 단계</span>
          </div>
          <Progress value={(step / 3) * 100} />
          <div className="row g4 t-cap ink3">
            <Save size={13} /> 자동 저장됨
          </div>
        </div>

        {step === 1 && (
          <div className="col g20">
            <Card variant="tint" className="card--flat card--pad row-top g12">
              <span className="c-primary shrink0"><Alert size={18} /></span>
              <p className="t-cap ink2">
                정확한 정보 입력을 부탁드립니다. 합격 시 개별 연락에 사용되며, 지원 절차 종료 후 30일 이내에 파기됩니다.
              </p>
            </Card>

            <Field label="이름" required error={errors.name}>
              <Input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="홍길동" error={errors.name} />
            </Field>
            <Field label="학과" required error={errors.department}>
              <Select
                value={draft.department}
                onChange={(e) => set('department', e.target.value)}
                placeholder="학과를 선택해주세요"
                options={DEPARTMENTS}
                error={errors.department}
              />
            </Field>
            <Field label="학번" required error={errors.studentId} help="숫자 8~9자리">
              <Input value={draft.studentId} onChange={(e) => set('studentId', e.target.value)} inputMode="numeric" placeholder="202400000" error={errors.studentId} />
            </Field>
            <Field label="연락처" required error={errors.phone}>
              <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" placeholder="010-0000-0000" error={errors.phone} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="col g24">
            <div className="col g12">
              <h2 className="section-title"><span className="section-bar" />지원 분야 선택</h2>
              {errors.fieldId && <p className="field-error">{errors.fieldId}</p>}
              <div className="col g8">
                {recruitment.fields.map((f) => (
                  <OptionCard
                    key={f.id}
                    title={f.label}
                    desc={f.desc}
                    checked={draft.fieldId === f.id}
                    onClick={() => set('fieldId', f.id)}
                  />
                ))}
              </div>
            </div>

            <div className="col g16">
              <h2 className="section-title"><span className="section-bar" />사전 질문</h2>
              {recruitment.questions.map((q, i) => (
                <Field
                  key={q.id}
                  label={`${i + 1}. ${q.label}`}
                  required={q.required}
                  help={q.help}
                  error={errors[q.id]}
                >
                  {q.type === 'long' && (
                    <>
                      <Textarea
                        value={draft.answers[q.id] || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder={`${q.maxLength}자 이내로 자유롭게 작성해주세요.`}
                        error={errors[q.id]}
                      />
                      <p className={`char-count${(draft.answers[q.id] || '').length > q.maxLength ? ' char-count--over' : ''}`}>
                        {(draft.answers[q.id] || '').length} / {q.maxLength}자
                      </p>
                    </>
                  )}
                  {q.type === 'short' && (
                    <Input
                      value={draft.answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="입력해주세요"
                      maxLength={q.maxLength}
                      error={errors[q.id]}
                    />
                  )}
                  {q.type === 'choice' && (
                    <div className="col g8">
                      {q.options.map((o) => (
                        <OptionCard
                          key={o}
                          title={o}
                          checked={draft.answers[q.id] === o}
                          onClick={() => setAnswer(q.id, o)}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              ))}
            </div>

            {recruitment.portfolio.enabled && (
              <div className="col g12">
                <div className="row between">
                  <h2 className="section-title"><span className="section-bar" />포트폴리오 제출</h2>
                  <Badge tone="neutral">선택사항</Badge>
                </div>
                <Field label="포트폴리오 링크" error={errors.portfolioLink}>
                  <div className="rel">
                    <Input
                      value={draft.portfolioLink}
                      onChange={(e) => set('portfolioLink', e.target.value)}
                      placeholder="https://notion.so/..."
                      style={{ paddingLeft: 44 }}
                      error={errors.portfolioLink}
                    />
                    <span className="ink4" style={{ position: 'absolute', left: 14, top: 15 }} aria-hidden>
                      <Link size={18} />
                    </span>
                  </div>
                </Field>
                <Field label="첨부 파일" help={`PDF · 최대 ${recruitment.portfolio.maxMb}MB`}>
                  {draft.portfolioFileName ? (
                    <div className="input-locked">
                      <span className="row g8 grow" style={{ minWidth: 0 }}>
                        <span className="c-primary"><Check size={16} /></span>
                        <span className="t-body-s clamp1">{draft.portfolioFileName}</span>
                      </span>
                      <button type="button" className="t-cap c-danger" onClick={() => set('portfolioFileName', '')}>
                        삭제
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="dashed full"
                      onClick={() => {
                        set('portfolioFileName', `${draft.name || '지원자'}_포트폴리오.pdf`);
                        actions.toast('샘플 PDF가 첨부되었습니다.', 'success');
                      }}
                    >
                      <span className="center" style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--c-primary-10)', color: 'var(--c-primary)', display: 'flex' }}>
                        <Upload size={20} />
                      </span>
                      <span className="t-label">PDF 파일을 업로드해주세요</span>
                      <span className="t-cap ink3">클릭하면 데모용 파일이 첨부됩니다</span>
                    </button>
                  )}
                </Field>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="col g16">
            <p className="t-body-s ink2">
              입력하신 정보를 마지막으로 확인해주세요. 제출 후에는{' '}
              {recruitment.policy.allowEdit ? '모집 마감 전까지 수정할 수 있습니다.' : '수정이 불가능합니다.'}
            </p>

            <ReviewBlock title="기본 정보" onEdit={() => setStep(1)}>
              <KV k="이름" v={draft.name} />
              <KV k="학과" v={draft.department} />
              <KV k="학번" v={draft.studentId} />
              <KV k="연락처" v={draft.phone} />
            </ReviewBlock>

            <ReviewBlock title="지원 분야" onEdit={() => setStep(2)}>
              <div className="row g8">
                <Badge tone="primary-solid">{field?.label ?? '미선택'}</Badge>
                <Badge tone="mint">1지망</Badge>
              </div>
            </ReviewBlock>

            <ReviewBlock title="답변 요약" onEdit={() => setStep(2)}>
              <div className="col g12">
                {recruitment.questions.map((q, i) => (
                  <div key={q.id} className="col g4">
                    <p className="t-cap ink3">Q{i + 1}. {q.label}</p>
                    <p className="t-body-s ink clamp3">{draft.answers[q.id] || '—'}</p>
                  </div>
                ))}
              </div>
            </ReviewBlock>

            {recruitment.portfolio.enabled && (
              <ReviewBlock title="포트폴리오" onEdit={() => setStep(2)}>
                {draft.portfolioFileName || draft.portfolioLink ? (
                  <div className="col g4">
                    {draft.portfolioFileName && <KV k="파일" v={draft.portfolioFileName} />}
                    {draft.portfolioLink && <KV k="링크" v={draft.portfolioLink} />}
                  </div>
                ) : (
                  <p className="t-body-s ink3">첨부하지 않음 (선택사항)</p>
                )}
              </ReviewBlock>
            )}

            <Card variant="tint" className="card--flat card--pad col g8">
              <div className="row g8">
                <span className="c-primary"><Alert size={18} /></span>
                <span className="t-label">향후 일정 안내</span>
              </div>
              <KV k="서류 결과 발표" v={fmtDate(recruitment.docResultAt)} />
              <KV k="면접 기간" v={`${fmtDate(recruitment.interviewFrom)} ~ ${fmtDate(recruitment.interviewTo)}`} />
              <KV k="최종 발표" v={fmtDate(recruitment.finalResultAt)} />
            </Card>

            <CheckBox checked={draft.agree} onChange={(v) => set('agree', v)} error={errors.agree}>
              (필수) 개인정보 수집 및 이용에 동의하며, 입력한 정보가 사실임을 확인합니다.
            </CheckBox>
          </div>
        )}
      </Screen>

      <div className="actionbar">
        <div className="row g8">
          <Button variant="soft" size="lg" onClick={prev} style={{ flex: '0 0 40%' }}>
            <ChevronLeft size={18} /> {step === 1 ? '나가기' : '이전'}
          </Button>
          {step < 3 ? (
            <Button variant="primary" size="lg" onClick={next} style={{ flex: 1 }}>
              다음 단계 <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={submit} disabled={!draft.agree} style={{ flex: 1 }}>
              최종 제출하기 <Send size={17} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function ReviewBlock({ title, onEdit, children }) {
  return (
    <Card variant="tint" className="card--flat card--pad col g12">
      <div className="row between">
        <span className="t-h4">{title}</span>
        <button type="button" className="t-cap-b c-primary" onClick={onEdit}>
          수정
        </button>
      </div>
      <div className="col g6">{children}</div>
    </Card>
  );
}

function KV({ k, v }) {
  return (
    <div className="row between g12">
      <span className="t-cap ink3 shrink0">{k}</span>
      <span className="t-body-s ink right-text" style={{ wordBreak: 'break-all' }}>{v || '—'}</span>
    </div>
  );
}
