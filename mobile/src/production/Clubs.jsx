import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../lib/api.js';
import { AppHeader, AsyncState } from './Layout.jsx';

function listOf(data) { return Array.isArray(data) ? data : data?.items ?? data?.clubs ?? []; }
function statusOf(club) { return club.recruitmentStatus ?? club.activeRecruitment?.status ?? club.recruitment?.status ?? club.recruitment?.state ?? 'CLOSED'; }
const statusLabel = { OPEN: '모집 중', SCHEDULED: '모집 예정', CLOSED: '모집 마감' };

export function ClubList() {
  const [clubs, setClubs] = useState([]); const [query, setQuery] = useState(''); const [category, setCategory] = useState('전체'); const [state, setState] = useState({ loading: true, error: '' });
  const load = useCallback(() => { setState({ loading: true, error: '' }); api.get('/clubs').then((data) => { setClubs(listOf(data)); setState({ loading: false, error: '' }); }).catch((error) => setState({ loading: false, error: errorMessage(error) })); }, []);
  useEffect(load, [load]);
  const categories = ['전체', ...new Set(clubs.map((club) => club.category).filter(Boolean))];
  const filtered = useMemo(() => clubs.filter((club) => (category === '전체' || club.category === category) && `${club.name} ${club.shortIntroduction ?? ''}`.toLowerCase().includes(query.toLowerCase())), [clubs, category, query]);
  return <><AppHeader /><main className="screen club-list-screen"><section className="list-heading"><p>2026 · HANSUNG</p><h1>동아리 찾기</h1><span>취향과 관심사를 함께 나눌 팀을 만나보세요.</span></section><label className="search-field"><span>⌕</span><input aria-label="동아리 검색" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="동아리 이름이나 활동 검색" /></label><div className="filter-row">{categories.map((item) => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><AsyncState {...state} empty={!filtered.length && !state.loading} onRetry={load}><ul className="club-grid">{filtered.map((club) => <li key={club.id}><Link className="club-card" to={`/clubs/${club.id}`}><div className="club-cover" style={{ backgroundImage: `linear-gradient(180deg, transparent 25%, rgba(5,18,39,.76)), url(/api/v1/clubs/${club.id}/cover)` }}><span className={`status-badge ${statusOf(club).toLowerCase()}`}>{statusLabel[statusOf(club)] ?? '모집 마감'}</span><div><small>{club.category}</small><h2>{club.name}</h2></div></div><p>{club.shortIntroduction || '소개가 아직 등록되지 않았어요.'}</p></Link></li>)}</ul></AsyncState></main></>;
}

export function ClubDetail() {
  const { clubId } = useParams(); const [club, setClub] = useState(null); const [state, setState] = useState({ loading: true, error: '' });
  const load = useCallback(() => { setState({ loading: true, error: '' }); api.get(`/clubs/${clubId}`).then((data) => { setClub(data); setState({ loading: false, error: '' }); }).catch((error) => setState({ loading: false, error: errorMessage(error) })); }, [clubId]);
  useEffect(load, [load]);
  const recruitment = club?.activeRecruitment ?? club?.recruitment ?? club?.currentRecruitment;
  const recruitmentState = recruitment?.status ?? recruitment?.state;
  const recruitmentId = recruitment?.id ?? recruitment?.recruitmentId;
  const open = recruitmentState === 'OPEN' && !recruitment?.alreadyApplied;
  return <><AppHeader title="동아리 상세" back /><AsyncState {...state} onRetry={load}><main className="screen detail-screen"><section className="detail-hero" style={{ backgroundImage: club ? `linear-gradient(180deg, rgba(4,12,26,.16), rgba(4,12,26,.88)), url(/api/v1/clubs/${club.id}/cover)` : undefined }}><div><span className={`status-badge ${statusOf(club).toLowerCase()}`}>{statusLabel[statusOf(club)] ?? '모집 마감'}</span><small>{club?.category}</small><h1>{club?.name}</h1><p>{club?.shortIntroduction || '동아리 소개를 준비하고 있어요.'}</p></div></section><section className="detail-content"><article><p className="section-kicker">ABOUT THE CLUB</p><h2>우리는 이런 활동을 해요</h2><p className="prose">{club?.detailedIntroduction || '상세 소개가 아직 등록되지 않았어요.'}</p></article><div className="activity-grid"><article><small>활동 기간</small><strong>{club?.activityPeriod || '미정'}</strong></article><article><small>활동 장소</small><strong>{club?.activityPlace || '미정'}</strong></article></div>{recruitment && <article className="recruitment-panel"><span>{statusLabel[recruitmentState] ?? recruitmentState}</span><h2>{recruitment.title}</h2><p>{(recruitment.opensAt ?? recruitment.openAt)?.slice(0, 10)} — {(recruitment.closesAt ?? recruitment.closeAt)?.slice(0, 10)}</p><p>{recruitment.quota ? `모집 인원 ${recruitment.quota}명` : '상세 모집 정보는 지원서에서 확인해 주세요.'}</p></article>}</section></main>{recruitment && <div className="sticky-action"><Link aria-disabled={!open} className={`primary-button ${!open ? 'disabled' : ''}`} to={open ? `/apply/${recruitmentId}` : '#'}>{recruitment.alreadyApplied ? '이미 지원했어요' : open ? '지원서 작성하기' : '지금은 지원할 수 없어요'}</Link></div>}</AsyncState></>;
}
