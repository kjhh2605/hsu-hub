import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState, Sheet } from '../components/ui.jsx';
import { Alert, Calendar, Clock, Edit, MapPin, Users, X } from '../components/icons.jsx';
import { dDay, fmtFullDate, fmtTimeKo, slotDateTime } from '../utils/date.js';

const NOTICES = [
  '면접 시작 10분 전까지 대기 장소에 도착해 주세요.',
  '본인 확인을 위한 학생증 혹은 신분증을 지참 바랍니다.',
  '부득이한 사정으로 늦을 경우 사전에 연락 부탁드립니다.',
];

export default function InterviewDetailScreen() {
  const { appId } = useParams();
  const { sel, actions } = useApp();
  const nav = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const app = sel.application(appId);
  const club = app ? sel.club(app.clubId) : null;
  const slot = app?.interviewSlotId ? sel.findSlot(app.interviewSlotId) : null;
  const session = app?.interviewSlotId ? sel.sessionOfSlot(app.interviewSlotId) : null;
  const recruitment = app ? sel.recruitment(app.recruitmentId) : null;

  if (!app || !club || !slot || !session) {
    return (
      <>
        <TopBar title="면접 예약" back="/applications" />
        <Screen>
          <EmptyState
            icon={<Alert size={26} />}
            title="예약된 면접이 없습니다"
            desc={'서류 합격 후 면접 시간을 선택하면\n이 화면에서 확인할 수 있습니다.'}
            action={<Button onClick={() => nav(`/applications/${appId}`)}>지원서로 돌아가기</Button>}
          />
        </Screen>
      </>
    );
  }

  const changeGuard = sel.canChangeBooking(app);
  const hours = recruitment?.policy?.rescheduleHours ?? 24;

  const doCancel = () => {
    setConfirmCancel(false);
    const res = actions.cancelBooking(app.id);
    if (res.ok) nav(`/applications/${app.id}/interview/pick`, { replace: true });
  };

  return (
    <>
      <TopBar brand />
      <Screen>
        {/* Hero */}
        <Card variant="primary" className="card--pad20 col g8">
          <div className="row g8">
            <Badge tone="mint">INTERVIEW CONFIRMED</Badge>
            <Badge tone="glass">{dDay(slotDateTime(slot))}</Badge>
          </div>
          <p className="t-h2 c-white">면접 예약이 확정되었습니다</p>
          <p className="t-body-s c-white80">
            지원하신 &lsquo;{club.name}&rsquo;의 면접 일정입니다.
          </p>
        </Card>

        {/* 상세 */}
        <div className="row between mt24 mb12">
          <h2 className="t-h3">예약 상세 정보</h2>
          <Badge tone="primary">{session.durationMin}분</Badge>
        </div>

        <Card pad className="col g16">
          <Row icon={<Calendar size={17} />} label="면접 날짜" value={fmtFullDate(slot.date)} />
          <Row icon={<Clock size={17} />} label="면접 시간" value={`${fmtTimeKo(slot.start)} - ${fmtTimeKo(slot.end)}`} />
          <Row icon={<MapPin size={17} />} label="면접 장소" value={session.place} />
          <Row icon={<Users size={17} />} label="면접관" value={session.interviewers.join(', ')} />
        </Card>

        {/* 유의사항 */}
        <Card variant="tint" className="card--flat card--pad20 col g12 mt16">
          <div className="row g8">
            <span className="ink"><Alert size={17} /></span>
            <span className="t-label">면접 유의사항</span>
          </div>
          <ul className="col g8">
            {NOTICES.map((n) => (
              <li key={n} className="row-top g8">
                <span className="dot mt4" style={{ background: 'var(--c-primary)', marginTop: 7 }} />
                <span className="t-body-s ink2">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* 액션 */}
        <div className="col g8 mt24">
          {changeGuard.ok ? (
            <div className="row g8">
              <Button variant="soft" block onClick={() => nav(`/applications/${app.id}/interview/pick`)}>
                <Edit size={16} /> 예약 변경
              </Button>
              <Button variant="dangerline" block onClick={() => setConfirmCancel(true)}>
                <X size={16} /> 예약 취소
              </Button>
            </div>
          ) : (
            <Card variant="tint" className="card--flat card--pad row-top g8">
              <span className="c-danger shrink0"><Alert size={16} /></span>
              <p className="t-cap ink2">
                {changeGuard.reason} (정책: 면접 {hours}시간 전까지 변경 가능)
              </p>
            </Card>
          )}
          <Button variant="ghost" block onClick={() => nav(`/applications/${app.id}`)}>
            내 지원서 보기
          </Button>
        </div>
      </Screen>

      <Sheet
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="면접 예약을 취소할까요?"
        footer={
          <div className="row g8">
            <Button variant="soft" block onClick={() => setConfirmCancel(false)}>
              돌아가기
            </Button>
            <Button variant="danger" block onClick={doCancel}>
              예약 취소
            </Button>
          </div>
        }
      >
        <p className="t-body-s ink2">
          취소하면 해당 슬롯이 다른 지원자에게 열립니다. 남은 좌석이 있는 시간대로 다시 예약해야 합니다.
        </p>
      </Sheet>
    </>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="row g12">
      <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
        {icon}
      </span>
      <span className="col g2 grow">
        <span className="t-cap ink3">{label}</span>
        <span className="t-label">{value}</span>
      </span>
    </div>
  );
}
