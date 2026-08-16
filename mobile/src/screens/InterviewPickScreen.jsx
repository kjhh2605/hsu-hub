import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState } from '../components/ui.jsx';
import { Alert, ArrowRight, ChevronLeft, ChevronRight, MapPin, Moon, Sun } from '../components/icons.jsx';
import { MONTH_LABEL, WEEKDAYS, fmtFullDate, fmtTimeKo, monthGrid } from '../utils/date.js';

export default function InterviewPickScreen() {
  const { appId } = useParams();
  const { sel, actions } = useApp();
  const nav = useNavigate();

  const app = sel.application(appId);
  const club = app ? sel.club(app.clubId) : null;
  const guard = sel.canBookInterview(app);

  const sessions = useMemo(
    () => (app ? sel.sessionsOfRecruitment(app.recruitmentId).filter((s) => s.status === 'OPEN') : []),
    [app, sel]
  );

  const availableDates = useMemo(
    () => [...new Set(sessions.map((s) => s.date))].sort(),
    [sessions]
  );

  const [cursor, setCursor] = useState(() => {
    const base = availableDates[0] ? new Date(availableDates[0]) : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const [pickedDate, setPickedDate] = useState(availableDates[0] ?? null);
  const [pickedSlot, setPickedSlot] = useState(app?.interviewSlotId ?? null);

  if (!app || !club) {
    return (
      <>
        <TopBar title="면접 시간 선택" back />
        <Screen>
          <EmptyState title="지원 내역을 찾을 수 없습니다" action={<Button onClick={() => nav('/applications')}>내 지원 현황</Button>} />
        </Screen>
      </>
    );
  }

  if (!guard.ok) {
    return (
      <>
        <TopBar title="면접 시간 선택" back={`/applications/${appId}`} />
        <Screen>
          <EmptyState icon={<Alert size={26} />} title="면접 예약을 할 수 없습니다" desc={guard.reason} action={<Button onClick={() => nav(`/applications/${appId}`)}>지원서로 돌아가기</Button>} />
        </Screen>
      </>
    );
  }

  if (sessions.length === 0) {
    return (
      <>
        <TopBar title="면접 시간 선택" back={`/applications/${appId}`} />
        <Screen>
          <EmptyState
            icon={<Alert size={26} />}
            title="아직 예약 가능한 면접이 없습니다"
            desc={'운영진이 면접 일정을 공개하면\n알림으로 안내드립니다.'}
            action={<Button onClick={() => nav(`/applications/${appId}`)}>지원서로 돌아가기</Button>}
          />
        </Screen>
      </>
    );
  }

  const daySessions = sessions.filter((s) => s.date === pickedDate);
  const slots = daySessions.flatMap((s) => s.slots.map((x) => ({ ...x, session: s })));
  const morning = slots.filter((x) => Number(x.start.split(':')[0]) < 12);
  const afternoon = slots.filter((x) => Number(x.start.split(':')[0]) >= 12);
  const selected = pickedSlot ? slots.find((x) => x.id === pickedSlot) : null;
  const cells = monthGrid(cursor.y, cursor.m);

  const confirm = () => {
    if (!pickedSlot) {
      actions.toast('면접 시간을 선택해주세요.', 'error');
      return;
    }
    const res = actions.bookSlot(app.id, pickedSlot);
    if (res.ok) nav(`/applications/${app.id}/interview/booked`, { replace: true });
  };

  return (
    <>
      <TopBar title="Application Form" over="CLUB RECRUIT" back={`/applications/${appId}`} />
      <Screen pad={false}>
        <div className="px16 mt16 col g4">
          <h1 className="t-h2 pre">{'면접 시간을\n선택해주세요'}</h1>
          <p className="t-body-s ink2">
            {club.name} 서류 합격을 축하드립니다! 편하신 일정을 골라주세요.
          </p>
        </div>

        {/* 달력 */}
        <div className="px16 mt16">
          <Card pad className="col g12">
            <div className="row between">
              <span className="t-h4">{MONTH_LABEL(cursor.y, cursor.m)}</span>
              <div className="row g4">
                <button type="button" className="iconbtn iconbtn--sm iconbtn--filled" aria-label="이전 달"
                  onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))}>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="iconbtn iconbtn--sm iconbtn--filled" aria-label="다음 달"
                  onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid7">
              {WEEKDAYS.map((w) => (
                <div key={w} className="cal-head">{w}</div>
              ))}
              {cells.map((c) => {
                if (!c.inMonth) return <div key={c.key} className="cal-cell cal-cell--out">{c.day}</div>;
                const has = availableDates.includes(c.iso);
                const sel_ = pickedDate === c.iso;
                const daySlots = sessions.filter((s) => s.date === c.iso).flatMap((s) => s.slots);
                const anyOpen = daySlots.some((s) => !sel.slotIsFull(s));
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={!has || !anyOpen}
                    aria-pressed={sel_}
                    className={[
                      'cal-cell',
                      sel_ ? 'cal-cell--sel' : '',
                      has && anyOpen ? 'cal-cell--has' : '',
                      has && !anyOpen ? 'cal-cell--off' : '',
                      !has ? 'cal-cell--out' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => { setPickedDate(c.iso); setPickedSlot(null); }}
                  >
                    {c.day}
                    {has && anyOpen && !sel_ && <span className="cal-cell-mark" />}
                  </button>
                );
              })}
            </div>
            <p className="t-cap ink3">파란 점이 있는 날짜에 면접 슬롯이 열려 있습니다.</p>
          </Card>
        </div>

        {/* 슬롯 */}
        <div className="px16 mt24 col g24">
          {daySessions.map((s) => (
            <div key={s.id} className="row g8 t-cap ink2" style={{ background: 'var(--c-tint-100)', borderRadius: 10, padding: '10px 12px' }}>
              <MapPin size={15} /> {s.name} · {s.place} · 면접관 {s.interviewers.join(', ')}
            </div>
          ))}

          <SlotGroup icon={<Sun size={17} />} title="오전" slots={morning} picked={pickedSlot} onPick={setPickedSlot} />
          <SlotGroup icon={<Moon size={17} />} title="오후" slots={afternoon} picked={pickedSlot} onPick={setPickedSlot} />
        </div>
      </Screen>

      <div className="actionbar">
        <div className="row between px16" style={{ padding: '0 4px 4px' }}>
          <div className="col g2">
            <span className="t-cap ink3">선택된 일정</span>
            <span className="t-label">
              {selected ? `${fmtFullDate(pickedDate)} ${fmtTimeKo(selected.start)}` : '아직 선택되지 않음'}
            </span>
          </div>
          <Badge tone="primary">대면 면접</Badge>
        </div>
        <Button variant="primary" size="lg" block disabled={!pickedSlot} onClick={confirm}>
          {app.interviewSlotId ? '예약 변경하기' : '예약 확정하기'} <ArrowRight size={18} />
        </Button>
      </div>
    </>
  );
}

function SlotGroup({ icon, title, slots, picked, onPick }) {
  const { sel } = useApp();
  if (slots.length === 0) return null;
  return (
    <div className="col g12">
      <div className="row g8 t-label ink2">
        <span className="ink3">{icon}</span>
        {title}
      </div>
      <div className="grid2">
        {slots.map((s) => {
          const remaining = sel.slotRemaining(s);
          const full = remaining === 0;
          const isPicked = picked === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={full}
              aria-pressed={isPicked}
              className={['slot', isPicked ? 'slot--sel' : '', full ? 'slot--full' : ''].filter(Boolean).join(' ')}
              onClick={() => onPick(s.id)}
            >
              <span className="slot-time">{s.start} - {s.end}</span>
              <span className="slot-meta">{full ? '마감' : isPicked ? '선택됨' : `잔여 ${remaining}석`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
