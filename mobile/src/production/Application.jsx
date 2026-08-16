import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FormRenderer, answerLabel, createTextDraft, draftStorageKey, normalizeFormSchema, validateAnswers } from '@hsu-hub/form';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, errorMessage } from '../lib/api.js';
import { AppHeader, LoadingScreen } from './Layout.jsx';

function usePublishedForm(recruitmentId) {
  const [result, setResult] = useState({ loading: true, schema: null, error: '' });
  useEffect(() => { let current = true; api.get(`/recruitments/${recruitmentId}/form`).then((data) => current && setResult({ loading: false, schema: normalizeFormSchema(data), error: '' })).catch((error) => current && setResult({ loading: false, schema: null, error: errorMessage(error) })); return () => { current = false; }; }, [recruitmentId]);
  return result;
}

export function Apply() {
  const { recruitmentId } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const { loading, schema, error } = usePublishedForm(recruitmentId); const key = draftStorageKey(user.id, recruitmentId);
  const [step, setStep] = useState(0); const [answers, setAnswers] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? {}; } catch { return {}; } }); const [errors, setErrors] = useState({});
  useEffect(() => { localStorage.setItem(key, JSON.stringify(createTextDraft(answers))); }, [answers, key]);
  const current = schema?.steps[step];
  if (loading) return <LoadingScreen />;
  if (error) return <main className="screen centered"><h1>지원서를 불러오지 못했어요</h1><p>{error}</p><Link className="primary-button compact" to="/clubs">동아리 목록</Link></main>;
  if (!schema?.steps.length) return <Navigate to="/clubs" replace />;
  function next() { const nextErrors = validateAnswers(current.questions, answers); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; if (step < schema.steps.length - 1) { setStep(step + 1); window.scrollTo(0, 0); } else navigate(`/apply/${recruitmentId}/review`, { state: { schema, answers } }); }
  return <><AppHeader title="지원서 작성" back /><main className="screen application-screen"><div className="step-meta"><span>STEP {step + 1} / {schema.steps.length}</span><div>{schema.steps.map((item, index) => <i key={item.id} className={index <= step ? 'active' : ''} />)}</div></div><section className="form-heading"><p>{schema.title}</p><h1>{current.title}</h1>{current.description && <span>{current.description}</span>}</section><FormRenderer questions={current.questions} answers={answers} errors={errors} onChange={(id, value) => { setAnswers({ ...answers, [id]: value }); setErrors({ ...errors, [id]: undefined }); }} /></main><div className="sticky-action split">{step > 0 && <button className="secondary-button" onClick={() => setStep(step - 1)}>이전</button>}<button className="primary-button" onClick={next}>{step === schema.steps.length - 1 ? '답변 검토하기' : '다음 단계'}</button></div></>;
}

export function ApplyReview() {
  const { recruitmentId } = useParams(); const { user } = useAuth(); const location = useLocation(); const navigate = useNavigate();
  const fallback = usePublishedForm(recruitmentId); const schema = location.state?.schema ?? fallback.schema; const [answers] = useState(() => location.state?.answers ?? (() => { try { return JSON.parse(localStorage.getItem(draftStorageKey(user.id, recruitmentId))) ?? {}; } catch { return {}; } })()); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const questions = useMemo(() => schema?.steps.flatMap((step) => step.questions) ?? [], [schema]);
  const idempotencyKey = useRef(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  if (!schema && fallback.loading) return <LoadingScreen />;
  if (!schema) return <Navigate to={`/apply/${recruitmentId}`} replace />;
  const errors = validateAnswers(questions, answers); const missingFile = Object.values(answers).some((value) => value?.fileName && !value?.file);
  async function submit() {
    setError(''); if (Object.keys(errors).length || missingFile) return setError(missingFile ? '새로고침 후에는 PDF 파일을 다시 선택해 주세요.' : '필수 답변을 다시 확인해 주세요.');
    const resume = Object.values(answers).find((value) => value?.file)?.file;
    const payloadAnswers = Object.fromEntries(Object.entries(answers).map(([questionId, value]) => [questionId, value?.url ? value.url : value?.file ? null : value]));
    const formData = new FormData(); formData.append('payload', new Blob([JSON.stringify({ answers: payloadAnswers })], { type: 'application/json' })); if (resume) formData.append('file', resume);
    setBusy(true);
    try { await api.post(`/recruitments/${recruitmentId}/applications`, formData, { headers: { 'Idempotency-Key': idempotencyKey.current } }); localStorage.removeItem(draftStorageKey(user.id, recruitmentId)); navigate(`/apply/${recruitmentId}/done`, { replace: true }); } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  return <><AppHeader title="지원서 검토" back /><main className="screen review-screen"><section className="form-heading"><p>FINAL REVIEW</p><h1>제출 전에 확인해 주세요</h1><span>제출한 지원서는 수정하거나 취소할 수 없어요.</span></section>{schema.steps.map((step) => <section className="review-group" key={step.id}><h2>{step.title}</h2>{step.questions.map((question) => <dl key={question.id}><dt>{question.label}</dt><dd>{answerLabel(question, answers[question.id]) || '답변 없음'}</dd></dl>)}</section>)}{error && <p role="alert" className="form-error review-error">{error}</p>}</main><div className="sticky-action"><button className="primary-button" onClick={submit} disabled={busy}>{busy ? '안전하게 제출 중…' : '지원서 최종 제출'}</button></div></>;
}

export function ApplyDone() {
  return <main className="screen done-screen"><div className="done-symbol">✓</div><p>APPLICATION COMPLETE</p><h1>지원이 완료됐어요!</h1><span>소중한 답변이 안전하게 전달되었습니다.<br />동아리의 안내를 기다려 주세요.</span><Link className="primary-button" to="/clubs">동아리 더 둘러보기</Link></main>;
}
