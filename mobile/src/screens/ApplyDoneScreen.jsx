import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState } from '../components/ui.jsx';
import { ArrowRight, Bell, Check, FileText } from '../components/icons.jsx';
import { fmtDate, fmtDateTime } from '../utils/date.js';

export default function ApplyDoneScreen() {
  const { recruitmentId } = useParams();
  const { sel } = useApp();
  const nav = useNavigate();

  const recruitment = sel.recruitment(recruitmentId);
  const app = sel.applicationForRecruitment(recruitmentId);
  const club = app ? sel.club(app.clubId) : null;

  if (!app || !recruitment || !club) {
    return (
      <>
        <TopBar title="지원 완료" />
        <Screen>
          <EmptyState title="지원 내역을 찾을 수 없습니다" action={<Button onClick={() => nav('/applications')}>내 지원 현황</Button>} />
        </Screen>
      </>
    );
  }

  const field = recruitment.fields.find((f) => f.id === app.fieldId);

  return (
    <>
      <TopBar title="지원 완료" />
      <Screen>
        <div className="col center g12" style={{ padding: '32px 0 24px' }}>
          <span
            className="center"
            style={{
              width: 80, height: 80, borderRadius: 999, display: 'flex',
              background: 'var(--c-primary)', color: '#fff',
              boxShadow: '0 20px 25px -5px rgba(0,88,190,.35)',
            }}
            aria-hidden
          >
            <Check size={36} />
          </span>
          <h1 className="t-h2 center-text">지원이 완료되었습니다!</h1>
          <p className="t-body-s ink2">소중한 첫 걸음을 응원합니다.</p>
        </div>

        <Card pad className="col g12">
          <div className="row g12" style={{ borderBottom: '1px solid var(--c-line-soft)', paddingBottom: 12 }}>
            <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
              <FileText size={18} />
            </span>
            <span className="col g2 grow">
              <span className="t-cap ink3">지원 완료 정보</span>
              <span className="t-h4 clamp1">{club.name}</span>
            </span>
          </div>
          <KV k="제출 일시" v={fmtDateTime(app.submittedAt)} />
          <KV k="지원 분야" v={field?.label ?? '—'} accent />
          <KV k="지원서 번호" v={`#${app.id.slice(-6).toUpperCase()}`} />
        </Card>

        <Card variant="tint" className="card--flat card--pad col g12 mt16">
          <span className="t-label c-primary">향후 일정 안내</span>
          <div className="timeline" style={{ paddingLeft: 20 }}>
            <div className="timeline-item timeline-item--on">
              <p className="t-label">서류 결과 발표</p>
              <p className="t-cap ink2">{fmtDate(recruitment.docResultAt)} 예정</p>
            </div>
            <div className="timeline-item">
              <p className="t-label ink2">면접 전형</p>
              <p className="t-cap ink2">
                {fmtDate(recruitment.interviewFrom)} ~ {fmtDate(recruitment.interviewTo)}
              </p>
            </div>
            <div className="timeline-item">
              <p className="t-label ink2">최종 발표</p>
              <p className="t-cap ink2">{fmtDate(recruitment.finalResultAt)}</p>
            </div>
          </div>
        </Card>

        <Card variant="tint" className="card--flat card--pad row-top g8 mt16">
          <span className="c-primary shrink0"><Bell size={16} /></span>
          <p className="t-cap ink2">지원 결과는 앱 알림과 이메일로 함께 발송됩니다.</p>
        </Card>

        <div className="col g8 mt24">
          <Button variant="primary" size="lg" block onClick={() => nav(`/applications/${app.id}`)}>
            내 지원 현황 보기 <ArrowRight size={18} />
          </Button>
          <Button variant="ghost" block onClick={() => nav('/explore')}>
            다른 동아리 더 보기
          </Button>
        </div>
      </Screen>
    </>
  );
}

function KV({ k, v, accent }) {
  return (
    <div className="row between g12">
      <span className="t-body-s ink3">{k}</span>
      <span className={`t-body-s ${accent ? 'c-primary w700' : 'ink'}`}>{v}</span>
    </div>
  );
}
