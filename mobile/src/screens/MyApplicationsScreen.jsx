import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState, Stepper } from '../components/ui.jsx';
import { ArrowRight, Calendar, Compass, MapPin } from '../components/icons.jsx';
import { AppStatus, STATUS_MESSAGE, STATUS_META, stepProgress } from '../data/constants.js';
import { fmtDate, fmtFullDate, fmtTimeKo } from '../utils/date.js';

export default function MyApplicationsScreen() {
  const { sel } = useApp();
  const nav = useNavigate();
  const apps = sel.myApplications();

  return (
    <>
      <TopBar brand />
      <Screen>
        <div className="col g4 mb20">
          <h1 className="t-display">나의 지원 현황</h1>
          <p className="t-body-s ink2">
            {apps.length > 0
              ? `이번 학기, 총 ${apps.length}곳의 동아리와 함께할 준비를 하고 있어요.`
              : '아직 지원한 동아리가 없어요.'}
          </p>
        </div>

        {apps.length === 0 && (
          <EmptyState
            icon={<Compass size={26} />}
            title="지원 내역이 없습니다"
            desc={'마음에 드는 동아리를 찾아\n첫 지원을 시작해보세요.'}
            action={<Button onClick={() => nav('/explore')}>동아리 탐색하기</Button>}
          />
        )}

        <div className="col g16">
          {apps.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}

function ApplicationCard({ app }) {
  const { sel } = useApp();
  const nav = useNavigate();
  const club = sel.club(app.clubId);
  const recruitment = sel.recruitment(app.recruitmentId);
  const meta = STATUS_META[app.status];
  const { done, active } = stepProgress(app.status);
  const slot = app.interviewSlotId ? sel.findSlot(app.interviewSlotId) : null;
  const session = app.interviewSlotId ? sel.sessionOfSlot(app.interviewSlotId) : null;

  const accepted = app.status === AppStatus.FINAL_PASSED;
  const rejected = app.status === AppStatus.REJECTED;

  return (
    <Card variant={accepted ? 'mint' : undefined} className="col" style={{ overflow: 'hidden' }}>
      <div className="p16 col g12">
        <div className="row between g8">
          <div className="row g12 grow" style={{ minWidth: 0 }}>
            <span
              className="center shrink0"
              style={{
                width: 48, height: 48, borderRadius: 999, display: 'flex',
                background: accepted ? '#fff' : 'var(--c-tint-400)',
                color: accepted ? 'var(--c-success)' : 'var(--c-primary)',
                fontWeight: 800, fontSize: 14,
              }}
              aria-hidden
            >
              {club?.shortName.slice(0, 2)}
            </span>
            <span className="col g4 grow" style={{ minWidth: 0 }}>
              <span className="self-start">
                <Badge tone={accepted ? 'glass' : meta.tone}>{meta.label}</Badge>
              </span>
              <span className={`t-h4 clamp1 ${accepted ? 'c-success-ink' : ''}`}>{club?.name}</span>
            </span>
          </div>
        </div>

        <p className={`t-body-s ${accepted ? 'c-success-ink' : 'ink2'}`}>
          {STATUS_MESSAGE[app.status]}
        </p>

        {!accepted && !rejected && <Stepper done={done} active={active} />}

        {/* 면접 확정 정보 */}
        {app.status === AppStatus.INTERVIEW_SCHEDULED && slot && (
          <div
            className="col g8"
            style={{ background: 'var(--c-primary-grad-diag)', borderRadius: 12, padding: 14, color: '#fff' }}
          >
            <span className="t-cap-b" style={{ opacity: 0.85 }}>면접 정보</span>
            <span className="row g8 t-body-s">
              <Calendar size={15} /> {fmtFullDate(slot.date)} {fmtTimeKo(slot.start)}
            </span>
            <span className="row g8 t-body-s">
              <MapPin size={15} /> {session?.place}
            </span>
            <Button variant="white" size="sm" block onClick={() => nav(`/applications/${app.id}/interview`)}>
              예약 상세 보기
            </Button>
          </div>
        )}

        {/* 서류 합격 → 예약 유도 */}
        {app.status === AppStatus.DOC_PASSED && (
          <Button variant="primary" block onClick={() => nav(`/applications/${app.id}/interview/pick`)}>
            면접 시간 선택하기 <ArrowRight size={17} />
          </Button>
        )}

        {/* 최종 합격 → 환영회 */}
        {accepted && app.welcome && (
          <div
            className="row between g8"
            style={{ background: 'rgba(255,255,255,.55)', borderRadius: 12, padding: 14 }}
          >
            <span className="col g2">
              <span className="t-cap-b c-success-ink">{app.welcome.title}</span>
              <span className="t-label c-success-ink">{fmtDate(app.welcome.at)} 오후 6시</span>
            </span>
          </div>
        )}

        <Button variant={accepted ? 'white' : 'soft'} block onClick={() => nav(`/applications/${app.id}`)}>
          내 지원서 보기
        </Button>

        {recruitment && (
          <p className="t-cap ink3 center-text">
            {app.status === AppStatus.DOC_REVIEW || app.status === AppStatus.SUBMITTED
              ? `서류 결과 발표: ${fmtDate(recruitment.docResultAt)}`
              : `최종 발표: ${fmtDate(recruitment.finalResultAt)}`}
          </p>
        )}
      </div>
    </Card>
  );
}
