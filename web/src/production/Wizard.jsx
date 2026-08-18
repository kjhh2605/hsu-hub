import React, { createContext, useContext, useEffect, useState } from 'react';
import { FormRenderer, QUESTION_TYPES } from '@hsu-hub/form';
import { Check, ChevronLeft, ChevronRight, Eye, GripVertical, Plus, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useOperator } from './OperatorContext';
import { api, messageOf } from './api';
import { ErrorNotice, PageHeader } from './Shell';

const starter = () => ({
  openAt: '', closeAt: '',
  stages: [
    { type: 'DOCUMENT_RESULT', label: '서류 결과', enabled: true, startAt: '' },
    { type: 'INTERVIEW', label: '면접', enabled: true, startAt: '', endAt: '' },
    { type: 'FINAL_RESULT', label: '최종 결과', enabled: true, startAt: '' },
  ],
  steps: [{ id: 'basic', title: '기본 정보', description: '지원자 본인이 직접 입력합니다.', questions: [
    { id: 'name', type: QUESTION_TYPES.SHORT_TEXT, label: '이름', required: true, maxLength: 30 },
    { id: 'studentNumber', type: QUESTION_TYPES.SHORT_TEXT, label: '학번', required: true, maxLength: 10 },
  ] }],
});
const WizardContext = createContext(null);
export function WizardProvider({ children }) {
  const [draft, setDraft] = useState(starter); const [dirty, setDirty] = useState(false);
  useEffect(() => { const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const update = (patch) => { setDraft((value) => ({ ...value, ...patch })); setDirty(true); };
  return <WizardContext.Provider value={{ draft, update, dirty, reset: () => { setDraft(starter()); setDirty(false); } }}>{children}</WizardContext.Provider>;
}
const useWizard = () => useContext(WizardContext);
const steps = [
  { id: 'page', label: '모집 일정', path: '/admin/recruitments/new/page' },
  { id: 'stages', label: '전형 설정', path: '/admin/recruitments/new/stages' },
  { id: 'form', label: '지원서 설계', path: '/admin/recruitments/new/form' },
  { id: 'review', label: '검토 및 게시', path: '/admin/recruitments/new/review' },
];
function WizardFrame({ active, title, description, children, preview, next, previous }) {
  return <main className="prod-page wizard-page"><PageHeader eyebrow="NEW RECRUITMENT" title={title} description={description} /><nav className="wizard-nav" aria-label="모집 생성 단계">{steps.map((step, index) => <Link className={step.id === active ? 'active' : ''} key={step.id} to={step.path}><span>{step.id === active ? index + 1 : index + 1}</span><div><small>STEP {index + 1}</small><strong>{step.label}</strong></div></Link>)}</nav><div className={`wizard-workspace ${preview ? 'with-preview' : ''}`}><section className="prod-panel wizard-editor">{children}</section>{preview}</div><footer className="wizard-footer"><div><p>작성 중인 내용은 브라우저 메모리에만 보관됩니다.</p><span>새로고침하거나 페이지를 닫으면 사라질 수 있어요.</span></div><div>{previous && <Link className="prod-button secondary" to={previous}><ChevronLeft size={16} /> 이전</Link>}<Link className="prod-button primary" to={next ?? '#'}>{active === 'review' ? '게시 준비' : '저장하고 계속'} <ChevronRight size={16} /></Link></div></footer></main>;
}
const Input = ({ label, ...props }) => <label>{label}<input {...props} /></label>;

export function WizardPage() {
  const { draft, update } = useWizard();
  return <WizardFrame active="page" title="모집 일정" description="동아리 프로필 소개글을 기준으로 지원 기간만 설정합니다." next="/admin/recruitments/new/stages"><div className="section-title"><span>01</span><div><h2>지원 기간</h2><p>소개글은 동아리 프로필에서 관리하고, 모집관리는 일정과 절차만 관리합니다.</p></div></div><div className="editor-fields"><div className="two-fields"><Input label="지원 시작" type="datetime-local" value={draft.openAt} onChange={(e) => update({ openAt: e.target.value })} /><Input label="지원 마감" type="datetime-local" value={draft.closeAt} onChange={(e) => update({ closeAt: e.target.value })} /></div></div></WizardFrame>;
}

export function WizardStages() {
  const { draft, update } = useWizard(); const change = (index, patch) => update({ stages: draft.stages.map((stage, i) => i === index ? { ...stage, ...patch } : stage) });
  const missingApplicationDates = [!draft.openAt && '지원 시작일', !draft.closeAt && '지원 마감일'].filter(Boolean);
  const applicationDateWarning = missingApplicationDates.length > 0 ? `${missingApplicationDates.join('과 ')}을 입력해 주세요.` : null;
  return <WizardFrame active="stages" title="전형 일정 설정" description="MVP에서는 일정을 안내용으로 보관하며 별도 결과 처리는 제공하지 않습니다." previous="/admin/recruitments/new/page" next="/admin/recruitments/new/form"><div className="section-title"><span>02</span><div><h2>전형 단계</h2><p>서류 결과, 면접, 최종 결과 일정을 구성합니다.</p></div></div><div className="stage-list"><article className="stage-card required"><span>1</span><div><strong>지원서 접수</strong><p className={applicationDateWarning ? 'stage-date warning' : 'stage-date'}>{draft.openAt || '시작 미정'} — {draft.closeAt || '마감 미정'}</p>{applicationDateWarning && <p className="stage-warning" role="alert">{applicationDateWarning}</p>}</div><small>필수</small></article>{draft.stages.map((stage, index) => <article className={`stage-card ${stage.enabled ? '' : 'muted'}`} key={stage.type}><span>{index + 2}</span><div className="stage-fields"><label className="toggle"><input type="checkbox" checked={stage.enabled} onChange={(e) => change(index, { enabled: e.target.checked })} /> {stage.label} 사용</label><div className="two-fields"><Input aria-label={`${stage.label} 시작`} label={stage.type === 'INTERVIEW' ? '시작 일시' : '안내 일시'} type="datetime-local" value={stage.startAt} onChange={(e) => change(index, { startAt: e.target.value })} />{stage.type === 'INTERVIEW' && <Input label="종료 일시" type="datetime-local" value={stage.endAt} onChange={(e) => change(index, { endAt: e.target.value })} />}</div></div></article>)}</div></WizardFrame>;
}

const typeLabels = { SHORT_TEXT: '짧은 답변', LONG_TEXT: '긴 답변', SINGLE_CHOICE: '단일 선택', MULTIPLE_CHOICE: '복수 선택', DROPDOWN: '드롭다운', EMAIL: '이메일', TELEPHONE: '전화번호', RESUME: 'PDF / 링크', CONSENT: '필수 동의' };
function newQuestion(type) { return { id: crypto.randomUUID(), type, label: typeLabels[type], required: type === QUESTION_TYPES.CONSENT, options: [QUESTION_TYPES.SINGLE_CHOICE, QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.DROPDOWN].includes(type) ? [{ id: crypto.randomUUID(), label: '선택지 1' }, { id: crypto.randomUUID(), label: '선택지 2' }] : [] }; }
export function WizardForm() {
  const { draft, update } = useWizard();
  const [activeStepId, setActiveStepId] = useState(draft.steps[0]?.id);
  const stepIndex = Math.max(0, draft.steps.findIndex((step) => step.id === activeStepId));
  const step = draft.steps[stepIndex];
  const questions = step.questions;
  const [active, setActive] = useState(questions[0]?.id);
  const selected = questions.find((item) => item.id === active);
  const hasResume = draft.steps.some((item) => item.questions.some((question) => question.type === QUESTION_TYPES.RESUME));
  const setStep = (patch) => update({ steps: draft.steps.map((item, index) => index === stepIndex ? { ...item, ...patch } : item) });
  const setQuestions = (next) => setStep({ questions: next });
  const updateQuestion = (patch) => setQuestions(questions.map((item) => item.id === active ? { ...item, ...patch } : item));
  function selectStep(next) { setActiveStepId(next.id); setActive(next.questions[0]?.id); }
  function addStep() { const next = { id: crypto.randomUUID(), title: `${draft.steps.length + 1}단계`, description: '', questions: [] }; update({ steps: [...draft.steps, next] }); setActiveStepId(next.id); setActive(undefined); }
  function add(type) { if (type === QUESTION_TYPES.RESUME && hasResume) return; const item = newQuestion(type); setQuestions([...questions, item]); setActive(item.id); }
  return <WizardFrame active="form" title="지원서 설계" description="지원자와 동일한 공용 렌더러로 모든 질문 유형을 미리 확인합니다." previous="/admin/recruitments/new/stages" next="/admin/recruitments/new/review" preview={<FormPreview step={step} index={stepIndex} total={draft.steps.length} />}><div className="form-step-tabs">{draft.steps.map((item, index) => <button className={item.id === step.id ? 'active' : ''} onClick={() => selectStep(item)} key={item.id}>{index + 1}. {item.title}</button>)}<button className="add-step" onClick={addStep}><Plus size={13} /> 단계 추가</button></div><div className="form-builder"><aside className="question-palette"><h3>질문 추가</h3>{Object.values(QUESTION_TYPES).map((type) => <button key={type} disabled={type === QUESTION_TYPES.RESUME && hasResume} onClick={() => add(type)}><Plus size={14} />{typeLabels[type]}</button>)}</aside><section className="question-canvas"><h3>{step.title} · {questions.length}개 질문</h3>{questions.map((question, index) => <button className={active === question.id ? 'active' : ''} onClick={() => setActive(question.id)} key={question.id}><GripVertical size={15} /><span>{index + 1}</span><div><strong>{question.label}</strong><small>{typeLabels[question.type]} · {question.required ? '필수' : '선택'}</small></div><Trash2 size={15} onClick={(event) => { event.stopPropagation(); setQuestions(questions.filter((item) => item.id !== question.id)); }} /></button>)}</section><aside className="property-panel"><h3>단계·질문 속성</h3><Input label="단계 제목" value={step.title} onChange={(e) => setStep({ title: e.target.value })} />{selected && <><Input label="질문 문구" value={selected.label} onChange={(e) => updateQuestion({ label: e.target.value })} /><Input label="도움말" value={selected.helpText ?? ''} onChange={(e) => updateQuestion({ helpText: e.target.value })} /><label className="toggle"><input type="checkbox" checked={selected.required} onChange={(e) => updateQuestion({ required: e.target.checked })} /> 필수 답변</label>{selected.options?.length > 0 && <div className="option-editor"><label>선택지</label>{selected.options.map((option, index) => <input key={option.id} aria-label={`선택지 ${index + 1}`} value={option.label} onChange={(e) => updateQuestion({ options: selected.options.map((item) => item.id === option.id ? { ...item, label: e.target.value } : item) })} />)}</div>}</>}</aside></div></WizardFrame>;
}
function FormPreview({ step, index, total }) { const [answers, setAnswers] = useState({}); return <aside className="phone-preview form-phone"><header><Eye size={15} /> 공용 모바일 폼 미리보기</header><div className="phone-frame"><div className="phone-top">지원서 작성</div><section><small>STEP {index + 1} / {total}</small><h2>{step.title}</h2></section><FormRenderer questions={step.questions} answers={answers} onChange={(id, value) => setAnswers({ ...answers, [id]: value })} /><button>{index + 1 === total ? '답변 검토하기' : '다음 단계'}</button></div></aside>; }

export function buildPublishPayload(draft) {
  const instant = (value) => value ? new Date(value).toISOString() : null;
  const questions = (items) => items.map((question) => ({
    type: question.type, label: question.label, required: Boolean(question.required),
    helpText: question.helpText || null, placeholder: question.placeholder || null,
    maxLength: question.maxLength || null, options: (question.options ?? []).map((option) => option.label),
  }));
  return {
    opensAt: instant(draft.openAt), closesAt: instant(draft.closeAt),
    stages: [{ type: 'DOCUMENT', label: '지원서 접수', enabled: true, startsAt: instant(draft.openAt), endsAt: instant(draft.closeAt) }, ...draft.stages.map((stage) => ({ type: stage.type, label: stage.label, enabled: stage.enabled, startsAt: instant(stage.startAt), endsAt: instant(stage.endAt) }))],
    form: { steps: draft.steps.map((step) => ({ title: step.title, questions: questions(step.questions) })) },
  };
}

export function WizardReview() {
  const { clubId } = useOperator(); const { draft, reset } = useWizard(); const navigate = useNavigate(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const checks = [draft.openAt, draft.closeAt, draft.steps.every((step) => step.title.trim() && step.questions.length)]; const valid = checks.every(Boolean) && new Date(draft.openAt) < new Date(draft.closeAt);
  async function publish() {
    if (!valid) return setError('필수 정보와 지원 기간을 확인해 주세요.');
    setBusy(true); setError('');
    try {
      await api.post(`/operator/clubs/${clubId}/recruitments`, buildPublishPayload(draft));
      reset(); navigate('/admin/recruitments', { replace: true });
    } catch (reason) { setError(messageOf(reason)); } finally { setBusy(false); }
  }
  return <WizardFrame active="review" title="검토 및 게시" description="게시 후에는 모집 일정과 지원서 구조를 수정할 수 없습니다." previous="/admin/recruitments/new/form"><div className="review-summary"><section><h2>게시 준비 상태</h2><div className="check-list">{['지원 시작 일시', '지원 마감 일시', '지원서 단계·질문'].map((label, index) => <p className={checks[index] ? 'ok' : ''} key={label}><span>{checks[index] ? <Check size={15} /> : '!'}</span>{label}<small>{checks[index] ? '확인됨' : '입력이 필요합니다'}</small></p>)}</div></section><section className="publication-card"><p>모집 일정</p><h2>동아리 프로필 소개글</h2><dl><div><dt>지원 기간</dt><dd>{draft.openAt || '미정'}<br />— {draft.closeAt || '미정'}</dd></div><div><dt>질문 수</dt><dd>{draft.steps.flatMap((step) => step.questions).length}개</dd></div></dl><ErrorNotice>{error}</ErrorNotice><button className="prod-button primary publish" disabled={busy || !valid} onClick={publish}><Send size={17} />{busy ? '게시 중…' : '모집 게시하기'}</button><small>게시 시 다른 활성 모집과 일정이 겹치면 서버가 거부합니다.</small></section></div></WizardFrame>;
}
