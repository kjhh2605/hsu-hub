import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOperator } from './OperatorContext';
import { api, itemsOf, messageOf } from './api';
import { ErrorNotice, PageHeader } from './Shell';

const labels = { OPEN: '모집 중', SCHEDULED: '모집 예정', CLOSED: '마감' };
export default function RecruitmentList() {
  const { clubId } = useOperator(); const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!clubId) return; setLoading(true); api.get(`/operator/clubs/${clubId}/recruitments`).then((data) => setItems(itemsOf(data, 'recruitments'))).catch((reason) => setError(messageOf(reason))).finally(() => setLoading(false)); }, [clubId]);
  return <main className="prod-page"><PageHeader eyebrow="RECRUITMENTS" title="모집 관리" description="게시된 모집 이력과 현재 상태를 확인합니다. 게시 후에는 수정할 수 없습니다." action={<Link className="prod-button primary" to="/admin/recruitments/new/page"><Plus size={17} /> 새 모집 만들기</Link>} /><ErrorNotice>{error}</ErrorNotice>{loading ? <div className="prod-loading inline"><span /><p>모집 이력을 불러오는 중입니다</p></div> : items.length ? <div className="recruitment-list">{items.map((item) => { const state = item.status ?? item.state; return <article className="recruit-card" key={item.id}><div className="recruit-state"><span className={state?.toLowerCase()}>{labels[state] ?? state}</span><small>#{item.id}</small></div><div><p>{item.title}</p><h2>{item.quota ?? 0}명 모집</h2></div><dl><div><dt><CalendarDays size={15} /> 지원 기간</dt><dd>{(item.opensAt ?? item.openAt)?.slice(0, 10)} — {(item.closesAt ?? item.closeAt)?.slice(0, 10)}</dd></div><div><dt>지원자</dt><dd>{item.applicationCount ?? item.applicantCount ?? 0}명</dd></div></dl><Link to={`/admin/applicants?recruitmentId=${item.id}`}>지원자 보기 <ArrowRight size={15} /></Link></article>; })}</div> : <div className="prod-empty"><span>01</span><h2>첫 모집을 시작해 보세요</h2><p>모집 페이지, 전형 일정, 지원서를 네 단계로 완성할 수 있습니다.</p><Link className="prod-button primary" to="/admin/recruitments/new/page">새 모집 만들기</Link></div>}</main>;
}
