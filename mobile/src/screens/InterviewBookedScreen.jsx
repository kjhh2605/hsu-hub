import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Button, Card, EmptyState } from '../components/ui.jsx';
import { ArrowRight, Calendar, Check, FileText, MapPin, Sparkle, Ticket } from '../components/icons.jsx';
import { fmtFullDate, fmtTimeKo } from '../utils/date.js';

export default function InterviewBookedScreen() {
  const { appId } = useParams();
  const { sel } = useApp();
  const nav = useNavigate();

  const app = sel.application(appId);
  const club = app ? sel.club(app.clubId) : null;
  const slot = app?.interviewSlotId ? sel.findSlot(app.interviewSlotId) : null;
  const session = app?.interviewSlotId ? sel.sessionOfSlot(app.interviewSlotId) : null;

  if (!app || !club || !slot || !session) {
    return (
      <>
        <TopBar title="면접 예약" back="/applications" />
        <Screen>
          <EmptyState title="예약 정보를 찾을 수 없습니다" action={<Button onClick={() => nav('/applications')}>내 지원 현황</Button>} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <TopBar brand />
      <Screen>
        <div className="col center g12" style={{ padding: '24px 0' }}>
          <span
            className="center"
            style={{
              width: 80, height: 80, borderRadius: 999, display: 'flex',
              background: 'var(--c-mint)', color: 'var(--c-success-ink)',
              boxShadow: '0 12px 24px -8px rgba(108,248,187,.6)',
            }}
            aria-hidden
          >
            <Check size={34} />
          </span>
          <h1 className="t-h2 center-text">예약이 완료되었습니다!</h1>
          <p className="t-body-s ink2">면접 일정이 성공적으로 확정되었어요.</p>
        </div>

        {/* 면접 패스 카드 */}
        <Card className="col" style={{ overflow: 'hidden' }}>
          <div className="p16 col g12">
            <div className="row g12">
              <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
                <Ticket size={20} />
              </span>
              <span className="col g2">
                <span className="t-over c-primary">{club.shortName}</span>
                <span className="t-h4">{session.name}</span>
              </span>
            </div>

            <div className="col g8">
              <Row icon={<Calendar size={16} />} label="날짜 및 시간" value={`${fmtFullDate(slot.date)} ${fmtTimeKo(slot.start)}`} />
              <Row icon={<MapPin size={16} />} label="장소" value={session.place} />
              <Row icon={<FileText size={16} />} label="면접관" value={session.interviewers.join(', ')} />
            </div>

            <div
              className="center"
              style={{ height: 100, borderRadius: 8, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex', flexDirection: 'column', gap: 6 }}
              aria-label="약도 자리표시자"
            >
              <MapPin size={22} />
              <span className="t-cap">{session.place} 약도</span>
            </div>
          </div>
        </Card>

        <Card variant="tint" className="card--flat card--pad row-top g12 mt16">
          <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--c-primary-600)', color: '#fff', display: 'flex' }}>
            <Sparkle size={18} />
          </span>
          <div className="col g4">
            <p className="t-label c-primary">면접 팁</p>
            <p className="t-cap ink2 pre">
              {'면접 시작 10분 전까지 도착해주세요.\n포트폴리오를 지참하시면 더 원활한 인터뷰가 가능합니다.'}
            </p>
          </div>
        </Card>

        <div className="col g8 mt24">
          <Button variant="primary" size="lg" block onClick={() => nav(`/applications/${app.id}/interview`)}>
            예약 상세 보기 <ArrowRight size={18} />
          </Button>
          <Button variant="soft" block onClick={() => nav('/applications')}>
            내 지원 현황으로
          </Button>
        </div>
      </Screen>
    </>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="row g12" style={{ background: 'var(--c-bg)', borderRadius: 8, padding: 12 }}>
      <span className="c-primary shrink0">{icon}</span>
      <span className="col g2 grow">
        <span className="t-cap ink3">{label}</span>
        <span className="t-label">{value}</span>
      </span>
    </div>
  );
}
