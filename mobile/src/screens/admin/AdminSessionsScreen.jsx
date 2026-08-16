import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../../components/layout.jsx';
import { Badge, Card, EmptyState } from '../../components/ui.jsx';
import { Calendar, ChevronRight, Clock, MapPin, Users } from '../../components/icons.jsx';
import { fmtFullDate } from '../../utils/date.js';
import AdminTabs from './AdminTabs.jsx';

export default function AdminSessionsScreen() {
  const { state, sel } = useApp();
  const nav = useNavigate();

  const club = sel.club(state.user.managedClubId);
  const recruitment = sel.recruitmentOfClub(state.user.managedClubId);
  const sessions = useMemo(
    () => (recruitment ? sel.sessionsOfRecruitment(recruitment.id) : []),
    [recruitment, state]
  );

  const totals = useMemo(() => {
    const slots = sessions.flatMap((s) => s.slots);
    const capacity = slots.reduce((n, s) => n + s.capacity, 0);
    const booked = slots.reduce((n, s) => n + sel.slotBooked(s), 0);
    return { capacity, booked, remaining: capacity - booked, slots: slots.length };
  }, [sessions, state]);

  return (
    <>
      <TopBar title="면접 세션 관리" over="ADMIN" back="/profile" />
      <Screen pad={false}>
        <AdminTabs active="sessions" />

        <div className="px16 mt16 col g4">
          <h1 className="t-h2">면접 일정 현황</h1>
          <p className="t-body-s ink2">
            {club?.name} {recruitment?.generation} 면접 일정을 관리하세요.
          </p>
        </div>

        {/* 요약 */}
        <div className="px16 mt16 row g8">
          <Summary label="총 면접 슬롯" value={totals.slots} />
          <Summary label="예약 완료" value={totals.booked} primary />
          <Summary label="잔여 좌석" value={totals.remaining} tone="success" />
        </div>

        <div className="px16 mt24 col g16">
          {sessions.length === 0 && (
            <EmptyState icon={<Calendar size={26} />} title="등록된 면접 세션이 없습니다" desc="모집 공고에 면접 전형을 추가해주세요." />
          )}

          {sessions.map((s) => {
            const capacity = s.slots.reduce((n, x) => n + x.capacity, 0);
            const booked = s.slots.reduce((n, x) => n + sel.slotBooked(x), 0);
            const pct = capacity ? Math.round((booked / capacity) * 100) : 0;
            return (
              <div key={s.id} className="col g8">
                <div className="row between">
                  <div className="col g2">
                    <span className="t-h4">{s.name}</span>
                    <span className="row g6 t-cap ink3">
                      <Calendar size={13} /> {fmtFullDate(s.date)}
                    </span>
                  </div>
                  <Badge tone={s.status === 'OPEN' ? 'mint' : 'neutral'}>
                    {s.status === 'OPEN' ? '공개 중' : '임시저장'}
                  </Badge>
                </div>

                <Card pad className="col g8">
                  <div className="row between t-cap ink3">
                    <span className="row g6"><MapPin size={13} /> {s.place}</span>
                    <span className="row g6"><Users size={13} /> {s.interviewers.join(', ')}</span>
                  </div>
                  <div className="row between t-cap">
                    <span className="ink3">예약률</span>
                    <span className="c-primary w700">{booked} / {capacity}석 ({pct}%)</span>
                  </div>
                  <div className="progress"><span className="progress-bar" style={{ width: `${pct}%` }} /></div>
                </Card>

                <div className="col g8">
                  {s.slots.map((slot) => {
                    const b = sel.slotBooked(slot);
                    const full = b >= slot.capacity;
                    return (
                      <Card
                        as="button"
                        key={slot.id}
                        className="card--tap card--pad row between g12"
                        style={{ opacity: full ? 0.85 : 1 }}
                        onClick={() => nav(`/admin/sessions/${slot.id}`)}
                      >
                        <span className="row g12 grow" style={{ minWidth: 0 }}>
                          <span
                            className="center shrink0"
                            style={{ width: 40, height: 40, borderRadius: 999, background: full ? 'var(--c-tint-400)' : 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}
                            aria-hidden
                          >
                            <Clock size={17} />
                          </span>
                          <span className="col g2" style={{ textAlign: 'left' }}>
                            <span className="t-label">{slot.start} - {slot.end}</span>
                            <span className="t-cap ink3">면접관 {s.interviewers.join(', ')}</span>
                          </span>
                        </span>
                        <span className="row g8 shrink0">
                          <Badge tone={full ? 'danger' : 'mint-soft'}>
                            {b}/{slot.capacity}명
                          </Badge>
                          <span className="ink4"><ChevronRight size={16} /></span>
                        </span>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}

function Summary({ label, value, primary, tone }) {
  return (
    <div
      className="col g4 grow"
      style={{
        padding: 14,
        borderRadius: 16,
        background: primary ? 'var(--c-primary-grad-diag)' : 'var(--c-surface)',
        border: primary ? 'none' : '1px solid var(--c-line-soft)',
        boxShadow: 'var(--sh-md)',
      }}
    >
      <span className={`t-cap ${primary ? 'c-white80' : 'ink3'}`}>{label}</span>
      <span
        className="t-h1"
        style={{ color: primary ? '#fff' : tone === 'success' ? 'var(--c-success)' : 'var(--c-ink)' }}
      >
        {value}
      </span>
    </div>
  );
}
