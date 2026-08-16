import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../../components/layout.jsx';
import { Badge, Card, EmptyState, Input } from '../../components/ui.jsx';
import { Calendar, ChevronRight, Search, Users } from '../../components/icons.jsx';
import { AppStatus, INTERNAL_META, STATUS_META } from '../../data/constants.js';
import { fmtShort } from '../../utils/date.js';
import AdminTabs from './AdminTabs.jsx';

const FILTERS = [
  { id: 'all', label: '전체 보기' },
  { id: AppStatus.SUBMITTED, label: '미검토' },
  { id: AppStatus.DOC_REVIEW, label: '서류 평가' },
  { id: AppStatus.DOC_PASSED, label: '면접 대기' },
  { id: AppStatus.INTERVIEW_SCHEDULED, label: '면접 예정' },
  { id: AppStatus.FINAL_PASSED, label: '최종 합격' },
  { id: AppStatus.REJECTED, label: '불합격' },
];

export default function AdminApplicantsScreen() {
  const { state, sel } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const club = sel.club(state.user.managedClubId);
  const all = sel.adminApplicants();

  const stats = useMemo(
    () => ({
      total: all.length,
      review: all.filter((a) => [AppStatus.SUBMITTED, AppStatus.DOC_REVIEW].includes(a.status)).length,
      interview: all.filter((a) => [AppStatus.DOC_PASSED, AppStatus.INTERVIEW_SCHEDULED].includes(a.status)).length,
      passed: all.filter((a) => a.status === AppStatus.FINAL_PASSED).length,
    }),
    [all]
  );

  const items = all.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    const key = `${a.name} ${a.department}`.toLowerCase();
    return key.includes(q.trim().toLowerCase());
  });

  return (
    <>
      <TopBar title="지원자 명단 관리" over="ADMIN" back="/profile" />
      <Screen pad={false}>
        <AdminTabs active="applicants" />

        <div className="px16 mt16 col g4">
          <h1 className="t-h2">{club?.name}</h1>
          <p className="t-body-s ink2">
            총 {stats.total}명의 지원자가 결과를 기다리고 있어요.
          </p>
        </div>

        {/* 통계 */}
        <div className="px16 mt16 row g8" style={{ overflowX: 'auto' }}>
          <StatCard primary label="전체 지원자" value={stats.total} icon={<Users size={16} />} />
          <StatCard label="서류 평가중" value={stats.review} />
          <StatCard label="면접 단계" value={stats.interview} tone="success" />
          <StatCard label="최종 합격" value={stats.passed} tone="success" />
        </div>

        {/* 검색 */}
        <div className="px16 mt16 rel">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 또는 전공으로 지원자 검색"
            aria-label="지원자 검색"
            style={{ paddingLeft: 44 }}
          />
          <span className="ink4" style={{ position: 'absolute', left: 30, top: 15 }} aria-hidden>
            <Search size={18} />
          </span>
        </div>

        {/* 필터 */}
        <div className="chip-row mt12" role="group" aria-label="상태 필터">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="px16 mt16 col g12">
          {items.length === 0 && (
            <EmptyState icon={<Users size={26} />} title="조건에 맞는 지원자가 없습니다" desc="필터나 검색어를 변경해보세요." />
          )}

          {items.map((a) => {
            const meta = STATUS_META[a.status];
            const internal = INTERNAL_META[a.internalStatus] ?? INTERNAL_META.UNREVIEWED;
            const slot = a.interviewSlotId ? sel.findSlot(a.interviewSlotId) : null;
            return (
              <Card as="button" key={a.id} className="card--tap" onClick={() => nav(`/admin/applicants/${a.id}`)}>
                <div className="p16 col g12">
                  <div className="row between g8">
                    <div className="row g12 grow" style={{ minWidth: 0 }}>
                      <span
                        className="center shrink0"
                        style={{ width: 48, height: 48, borderRadius: 999, background: a.avatarColor || 'var(--c-primary)', color: '#fff', fontWeight: 800, display: 'flex' }}
                        aria-hidden
                      >
                        {a.name?.slice(0, 2)}
                      </span>
                      <span className="col g2 grow" style={{ minWidth: 0 }}>
                        <span className="row g6">
                          <span className="t-h4 clamp1">{a.name}</span>
                          {a.isMe && <Badge tone="accent">본인</Badge>}
                        </span>
                        <span className="t-cap ink3">
                          {a.department} · {a.admissionYear}학번
                        </span>
                      </span>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <div
                    className="row between g8"
                    style={{ borderTop: '1px solid var(--c-line-soft)', paddingTop: 10 }}
                  >
                    <span className="row g8 t-cap ink3">
                      <Calendar size={13} /> {fmtShort(a.submittedAt)} 지원
                      {slot && <> · 면접 {slot.start}</>}
                    </span>
                    <span className="row g6">
                      <Badge tone={internal.tone}>{internal.label}</Badge>
                      <span className="c-primary"><ChevronRight size={15} /></span>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}

function StatCard({ label, value, icon, primary, tone }) {
  return (
    <div
      className="col g4 shrink0"
      style={{
        minWidth: 120,
        padding: 16,
        borderRadius: 16,
        background: primary ? 'var(--c-primary-grad-diag)' : 'var(--c-surface)',
        border: primary ? 'none' : '1px solid var(--c-line-soft)',
        boxShadow: 'var(--sh-md)',
      }}
    >
      <span className={`row g6 t-cap ${primary ? 'c-white80' : 'ink3'}`}>
        {icon}
        {label}
      </span>
      <span
        className="t-num"
        style={{ color: primary ? '#fff' : tone === 'success' ? 'var(--c-success)' : 'var(--c-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}
