import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState, Field, Sheet, Textarea, Stepper } from '../components/ui.jsx';
import { Alert, Check, Edit, FileText, Link, Paperclip, Trash, User } from '../components/icons.jsx';
import { AppStatus, STATUS_META, STATUS_MESSAGE, stepProgress } from '../data/constants.js';
import { fmtDateTime } from '../utils/date.js';

export default function ApplicationDetailScreen() {
  const { appId } = useParams();
  const { state, sel, actions } = useApp();
  const nav = useNavigate();

  const app = sel.application(appId);
  const club = app ? sel.club(app.clubId) : null;
  const recruitment = app ? sel.recruitment(app.recruitmentId) : null;

  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(app?.answers ?? {});
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!app || !club || !recruitment) {
    return (
      <>
        <TopBar title="지원서" back="/applications" />
        <Screen>
          <EmptyState title="지원 내역을 찾을 수 없습니다" action={<Button onClick={() => nav('/applications')}>내 지원 현황</Button>} />
        </Screen>
      </>
    );
  }

  const meta = STATUS_META[app.status];
  const { done, active } = stepProgress(app.status);
  const field = recruitment.fields.find((f) => f.id === app.fieldId);
  const editGuard = sel.canEditApplication(app);
  const cancelGuard = sel.canCancelApplication(app);

  const saveEdit = () => {
    const res = actions.updateApplication(app.id, { answers });
    if (res.ok) setEditing(false);
  };

  const doCancel = () => {
    setConfirmCancel(false);
    const res = actions.cancelApplication(app.id);
    if (res.ok) nav('/applications', { replace: true });
  };

  return (
    <>
      <TopBar title="제출 지원서" over={club.name} back="/applications" />
      <Screen>
        {/* 상태 헤더 */}
        <Card variant="primary" className="card--pad20 col g8">
          <div className="row g8">
            <Badge tone="mint">{meta.label}</Badge>
            <span className="t-cap c-white80">{fmtDateTime(app.submittedAt)} 제출</span>
          </div>
          <p className="t-h3 c-white">{recruitment.title}</p>
          <p className="t-body-s c-white80">{STATUS_MESSAGE[app.status]}</p>
        </Card>

        <div className="mt16">
          <Stepper done={done} active={active} />
        </div>

        {/* 인적 사항 */}
        <Section icon={<User size={17} />} title="인적 사항">
          <Card variant="tint" className="card--flat card--pad grid2" style={{ rowGap: 12 }}>
            <KV k="이름" v={state.user.name} />
            <KV k="학번" v={state.user.studentId} />
            <KV k="학과" v={state.user.department} />
            <KV k="연락처" v={state.user.phone} />
          </Card>
        </Section>

        {/* 지원 분야 */}
        <Section icon={<FileText size={17} />} title="지원 분야">
          <div className="row g8">
            <Badge tone="primary-solid">{field?.label ?? '—'}</Badge>
            <Badge tone="mint">1지망</Badge>
          </div>
        </Section>

        {/* 문항 */}
        <Section
          icon={<FileText size={17} />}
          title="지원 문항"
          right={
            editGuard.ok &&
            (editing ? (
              <div className="row g8">
                <button type="button" className="t-cap ink3" onClick={() => { setEditing(false); setAnswers(app.answers); }}>
                  취소
                </button>
                <button type="button" className="t-cap-b c-primary" onClick={saveEdit}>
                  저장
                </button>
              </div>
            ) : (
              <button type="button" className="row g4 t-cap-b c-primary" onClick={() => setEditing(true)}>
                <Edit size={14} /> 수정
              </button>
            ))
          }
        >
          <div className="col g12">
            {recruitment.questions.map((q, i) => (
              <div key={q.id} className="qa-card">
                <span className="t-cap-b c-primary">질문 {i + 1}</span>
                <span className="t-label">{q.label}</span>
                {editing && q.type !== 'choice' ? (
                  <Field help={q.maxLength ? `${(answers[q.id] || '').length} / ${q.maxLength}자` : undefined}>
                    <Textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  </Field>
                ) : (
                  <p className="qa-answer">{app.answers[q.id] || '—'}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 포트폴리오 */}
        {app.portfolio && (
          <Section icon={<Paperclip size={17} />} title="포트폴리오">
            <Card pad className="col g12">
              {app.portfolio.fileName && (
                <div className="row g12">
                  <span className="center shrink0" style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
                    <FileText size={20} />
                  </span>
                  <span className="col g2 grow" style={{ minWidth: 0 }}>
                    <span className="self-start">
                      <Badge tone="mint-soft">PDF 첨부됨</Badge>
                    </span>
                    <span className="t-label clamp1">{app.portfolio.fileName}</span>
                    <span className="t-cap ink3">
                      {app.portfolio.sizeMb} MB{app.portfolio.pages ? ` · ${app.portfolio.pages} 페이지` : ''}
                    </span>
                  </span>
                </div>
              )}
              {app.portfolio.link && (
                <div className="row g8" style={{ background: 'var(--c-tint-100)', borderRadius: 8, padding: 12 }}>
                  <span className="c-primary shrink0"><Link size={16} /></span>
                  <span className="t-body-s c-primary clamp1" style={{ textDecoration: 'underline' }}>
                    {app.portfolio.link}
                  </span>
                </div>
              )}
            </Card>
          </Section>
        )}

        {/* 정책 안내 */}
        <Card variant="tint" className="card--flat card--pad row-top g8 mt24">
          <span className="ink3 shrink0"><Alert size={16} /></span>
          <p className="t-cap ink2">
            {recruitment.policy.allowEdit
              ? '제출된 지원서는 모집 마감 전까지 수정 및 취소가 가능합니다.'
              : '이 모집은 제출 후 수정이 불가능합니다.'}
          </p>
        </Card>

        {/* 액션 */}
        <div className="col g8 mt16">
          {app.status === AppStatus.DOC_PASSED && (
            <Button variant="primary" size="lg" block onClick={() => nav(`/applications/${app.id}/interview/pick`)}>
              면접 시간 선택하기
            </Button>
          )}
          {app.status === AppStatus.INTERVIEW_SCHEDULED && (
            <Button variant="soft" size="lg" block onClick={() => nav(`/applications/${app.id}/interview`)}>
              면접 예약 상세 보기
            </Button>
          )}
          {cancelGuard.ok ? (
            <Button variant="dangerline" block onClick={() => setConfirmCancel(true)}>
              <Trash size={16} /> 지원 취소하기
            </Button>
          ) : (
            <p className="t-cap ink3 center-text">{cancelGuard.reason}</p>
          )}
        </div>
      </Screen>

      <Sheet
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="지원을 취소할까요?"
        footer={
          <div className="row g8">
            <Button variant="soft" block onClick={() => setConfirmCancel(false)}>
              돌아가기
            </Button>
            <Button variant="danger" block onClick={doCancel}>
              지원 취소
            </Button>
          </div>
        }
      >
        <p className="t-body-s ink2">
          취소하면 작성한 지원서와 예약된 면접 일정이 모두 사라지며, 되돌릴 수 없습니다.
        </p>
      </Sheet>
    </>
  );
}

function Section({ icon, title, right, children }) {
  return (
    <div className="col g12 mt24">
      <div className="row between">
        <span className="row g8 t-h4">
          <span className="c-primary">{icon}</span>
          {title}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="col g2">
      <span className="t-cap ink3">{k}</span>
      <span className="t-body-s ink">{v || '—'}</span>
    </div>
  );
}
