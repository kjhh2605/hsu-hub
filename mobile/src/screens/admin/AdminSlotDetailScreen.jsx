import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { Screen, TopBar } from '../../components/layout.jsx';
import { Badge, Button, Card, EmptyState } from '../../components/ui.jsx';
import { Calendar, Clock, MapPin, User, Users } from '../../components/icons.jsx';
import { fmtFullDate, fmtTimeKo } from '../../utils/date.js';
import { INTERNAL_META, STATUS_META } from '../../data/constants.js';

export default function AdminSlotDetailScreen() {
  const { slotId } = useParams();
  const { sel, actions } = useApp();
  const nav = useNavigate();

  const slot = sel.findSlot(slotId);
  const session = sel.sessionOfSlot(slotId);
  const roster = sel.rosterOfSlot(slotId);

  if (!slot || !session) {
    return (
      <>
        <TopBar title="면접 슬롯" back="/admin/sessions" />
        <Screen>
          <EmptyState title="슬롯을 찾을 수 없습니다" action={<Button onClick={() => nav('/admin/sessions')}>세션 목록</Button>} />
        </Screen>
      </>
    );
  }

  const booked = sel.slotBooked(slot);
  const remaining = sel.slotRemaining(slot);
  const hidden = booked - roster.length; // 더미 타 지원자(상세 미제공)

  return (
    <>
      <TopBar title="면접 슬롯 상세" over={`SLOT · ${slot.start}`} back="/admin/sessions" />
      <Screen>
        <Card variant="primary" className="card--pad20 col g8">
          <Badge tone="mint">{session.name}</Badge>
          <p className="t-h2 c-white">{slot.start} — {slot.end}</p>
          <p className="t-body-s c-white80">{fmtFullDate(slot.date)}</p>
        </Card>

        <Card pad className="col g12 mt16">
          <Row icon={<Calendar size={16} />} label="날짜" value={fmtFullDate(slot.date)} />
          <Row icon={<Clock size={16} />} label="시간" value={`${fmtTimeKo(slot.start)} - ${fmtTimeKo(slot.end)} (${session.durationMin}분)`} />
          <Row icon={<MapPin size={16} />} label="장소" value={session.place} />
          <Row icon={<User size={16} />} label="면접관" value={session.interviewers.join(', ')} />
        </Card>

        <Card variant="tint" className="card--flat card--pad col g8 mt16">
          <div className="row between">
            <span className="t-label">수용 인원 현황</span>
            <span className="t-label c-primary">{booked} / {slot.capacity}</span>
          </div>
          <div className="progress">
            <span className="progress-bar" style={{ width: `${(booked / slot.capacity) * 100}%` }} />
          </div>
          <p className="t-cap ink2">
            {remaining > 0 ? `잔여 ${remaining}석 — 지원자가 예약할 수 있습니다.` : '정원이 모두 찼습니다.'}
          </p>
        </Card>

        <div className="row between mt24 mb12">
          <h2 className="t-h4">예약된 지원자</h2>
          <Badge tone="neutral">{booked}명</Badge>
        </div>

        <div className="col g8">
          {roster.length === 0 && hidden <= 0 && (
            <EmptyState icon={<Users size={24} />} title="예약자가 없습니다" desc="지원자가 이 시간대를 선택하면 표시됩니다." />
          )}

          {roster.map((p) => {
            const meta = STATUS_META[p.status];
            const internal = INTERNAL_META[p.internalStatus] ?? INTERNAL_META.UNREVIEWED;
            return (
              <Card key={p.id} className="col">
                <div className="p16 row g12">
                  <span
                    className="center shrink0"
                    style={{ width: 48, height: 48, borderRadius: 999, background: p.avatarColor || 'var(--c-primary)', color: '#fff', fontWeight: 800, display: 'flex' }}
                    aria-hidden
                  >
                    {p.name?.slice(0, 2)}
                  </span>
                  <span className="col g2 grow" style={{ minWidth: 0 }}>
                    <span className="row g6">
                      <span className="t-h4">{p.name}</span>
                      {p.isMe && <Badge tone="accent">본인</Badge>}
                    </span>
                    <span className="t-cap ink3">{p.department}</span>
                    <span className="row g6 mt4">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <Badge tone={internal.tone}>{internal.label}</Badge>
                    </span>
                  </span>
                </div>

                <div
                  className="row between g8 p16"
                  style={{ borderTop: '1px solid var(--c-line-soft)', background: 'var(--c-surface-alt)' }}
                >
                  <span className="t-cap ink3">출석 상태</span>
                  <div className="row g4">
                    {[
                      { v: 'present', label: '출석' },
                      { v: 'absent', label: '결석' },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        className="chip"
                        aria-pressed={p.attendance === o.v}
                        onClick={() => {
                          actions.adminSetAttendance(p.id, p.isMe, o.v);
                          actions.toast(`${p.name} 출석 상태: ${o.label}`);
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => nav(`/admin/applicants/${p.id}`)}>
                      지원서
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {hidden > 0 && (
            <Card variant="tint" className="card--flat card--pad row g12">
              <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--c-tint-400)', color: 'var(--c-ink-2)', display: 'flex' }}>
                <Users size={17} />
              </span>
              <span className="col g2">
                <span className="t-label">타 지원자 {hidden}명</span>
                <span className="t-cap ink3">데모 데이터로, 상세 정보는 제공되지 않습니다.</span>
              </span>
            </Card>
          )}

          {remaining > 0 &&
            Array.from({ length: remaining }).map((_, i) => (
              <div key={`empty-${i}`} className="dashed">
                <span className="t-cap ink3">배정 가능한 좌석</span>
              </div>
            ))}
        </div>
      </Screen>
    </>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="row between g12">
      <span className="row g8 t-body-s ink3">
        {icon} {label}
      </span>
      <span className="t-body-s ink right-text">{value}</span>
    </div>
  );
}
