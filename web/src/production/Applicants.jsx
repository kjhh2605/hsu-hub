import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, FileText, Search } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useOperator } from './OperatorContext';
import { api, itemsOf, messageOf } from './api';
import { ErrorNotice, PageHeader } from './Shell';

export function ResumeAnswer({ applicationId, resume }) {
  if (!resume) return <p className="answer-empty">첨부 없음</p>;
  const isPdf = resume.type === 'PDF' || resume.fileName || resume.hasFile || resume.pdf;
  if (isPdf) return <div className="resume-pdf"><header><FileText size={16} /><strong>{resume.fileName || '제출된 PDF'}</strong></header><iframe title={resume.fileName || '제출된 PDF'} src={`/api/v1/operator/applications/${applicationId}/resume`} sandbox="allow-same-origin" referrerPolicy="no-referrer" /></div>;
  try { const parsed = new URL(resume.url); if (parsed.protocol !== 'https:' || !parsed.hostname) throw new Error(); return <a className="external-answer" href={parsed.href} target="_blank" rel="noopener noreferrer">제출 링크를 새 탭에서 열기 <ArrowUpRight size={15} /></a>; } catch { return <p className="prod-error">안전하지 않은 링크는 열 수 없습니다.</p>; }
}

export function ApplicantList() {
  const { clubId } = useOperator(); const [params, setParams] = useSearchParams(); const [recruitments, setRecruitments] = useState([]); const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const recruitmentId = params.get('recruitmentId');
  useEffect(() => { if (!clubId) return; api.get(`/operator/clubs/${clubId}/recruitments`).then((data) => { const next = itemsOf(data, 'recruitments'); setRecruitments(next); if (!recruitmentId && next[0]) setParams({ recruitmentId: next[0].id }, { replace: true }); }).catch((reason) => setError(messageOf(reason))); }, [clubId, recruitmentId, setParams]);
  useEffect(() => { if (!recruitmentId) return; setItems([]); api.get(`/operator/recruitments/${recruitmentId}/applications`).then((data) => setItems(itemsOf(data, 'applications'))).catch((reason) => setError(messageOf(reason))); }, [recruitmentId]);
  const filtered = useMemo(() => items.filter((item) => `${item.displayName ?? ''} ${item.publicId}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return <main className="prod-page"><PageHeader eyebrow="APPLICANTS" title="지원자 목록" description="선택한 모집의 제출 완료 지원서만 확인할 수 있습니다." /><div className="applicant-toolbar"><label>모집 선택<select aria-label="모집 선택" value={recruitmentId ?? ''} onChange={(e) => setParams({ recruitmentId: e.target.value })}>{recruitments.map((item) => <option key={item.id} value={item.id}>모집 #{item.id} · {(item.opensAt ?? item.openAt)?.slice(0, 10)} — {(item.closesAt ?? item.closeAt)?.slice(0, 10)}</option>)}</select></label><label className="table-search"><Search size={16} /><input aria-label="지원자 검색" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 또는 지원번호 검색" /></label></div><ErrorNotice>{error}</ErrorNotice><section className="prod-panel applicant-table"><header><span>지원자</span><span>지원 번호</span><span>제출 일시</span><span /></header>{filtered.map((item) => { const id = item.id ?? item.publicId; return <Link key={id} to={`/admin/applicants/${id}`}><strong>{item.displayName || `지원자 ${item.publicId}`}</strong><code>{item.publicId}</code><span>{item.submittedAt?.replace('T', ' ').slice(0, 16)}</span><ArrowUpRight size={16} /></Link>; })}{!filtered.length && <div className="table-empty">이 모집에 제출된 지원서가 없습니다.</div>}</section></main>;
}

export function ApplicantDetail() {
  const { applicationId } = useParams(); const [application, setApplication] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/operator/applications/${applicationId}`).then(setApplication).catch((reason) => setError(messageOf(reason))); }, [applicationId]);
  return <main className="prod-page"><Link className="back-link" to="/admin/applicants"><ArrowLeft size={16} /> 지원자 목록</Link><ErrorNotice>{error}</ErrorNotice>{application && <><PageHeader eyebrow={`APPLICATION · ${application.publicId}`} title={application.displayName || `지원자 ${application.publicId}`} description={`지원서 · ${application.submittedAt?.replace('T', ' ').slice(0, 16)} 제출`} /><div className="application-detail"><section className="prod-panel answers-panel"><h2>지원서 답변</h2>{(application.answers ?? []).map((answer, index) => <article key={answer.questionId ?? index}><small>{answer.questionLabel ?? answer.label}</small>{answer.type === 'RESUME' ? <ResumeAnswer applicationId={applicationId} resume={answer.resume ?? answer.value} /> : Array.isArray(answer.value) ? <p>{answer.value.join(', ')}</p> : <p>{String(answer.value ?? '답변 없음')}</p>}</article>)}</section>{application.resume && <aside className="prod-panel standalone-resume"><h2>PDF / 링크 제출</h2><ResumeAnswer applicationId={applicationId} resume={application.resume} /></aside>}</div></>}</main>;
}
