import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { Screen, TopBar } from '../../components/layout.jsx';
import { Badge, Button, Card, EmptyState, Sheet, Textarea } from '../../components/ui.jsx';
import { Alert, Check, FileText, Link, Paperclip, Save, Star, User, X } from '../../components/icons.jsx';
import { AppStatus, INTERNAL_META, InternalStatus, STATUS_META } from '../../data/constants.js';
import { fmtDateTime } from '../../utils/date.js';

export default function AdminReviewScreen() {
  const { id } = useParams();
  const { sel, actions } = useApp();
  const nav = useNavigate();

  const a = sel.adminApplicant(id);
  const recruitment = a ? sel.recruitment(a.recruitmentId) : null;
  const [memo, setMemo] = useState(a?.memo ?? '');
  const [confirm, setConfirm] = useState(null); // 'PASS' | 'FAIL' | 'FINAL_PASS' | 'FINAL_FAIL'

  useEffect(() => {
    setMemo(a?.memo ?? '');
  }, [id]);

  if (!a || !recruitment) {
    return (
      <>
        <TopBar title="지원서 검토" back="/admin/applicants" />
        <Screen>
          <EmptyState title="지원서를 찾을 수 없습니다" action={<Button onClick={() => nav('/admin/applicants')}>명단으로</Button>} />
        </Screen>
      </>
    );
  }

  const meta = STATUS_META[a.status];
  const internal = INTERNAL_META[a.internalStatus] ?? INTERNAL_META.UNREVIEWED;
  const field = recruitment.fields.find((f) => f.id === a.fieldId);

  // 서류 단계에서만 합/불 결정 가능, 면접 이후에는 최종 결정
  const inDocStage = [AppStatus.SUBMITTED, AppStatus.DOC_REVIEW].includes(a.status);
  const inInterviewStage = [AppStatus.INTERVIEW_SCHEDULED, AppStatus.INTERVIEW_DONE, AppStatus.DOC_PASSED].includes(a.status);
  const decided = [AppStatus.FINAL_PASSED, AppStatus.REJECTED].includes(a.status);

  const saveMemo = () => {
    actions.adminSetMemo(a.id, a.isMe, memo);
    actions.toast('내부 평가 메모를 저장했습니다.', 'success');
  };

  const runConfirm = () => {
    const c = confirm;
    setConfirm(null);
    if (c === 'PASS' || c === 'FAIL') actions.adminDecide(a.id, a.isMe, c === 'PASS' ? 'PASS' : 'FAIL');
    if (c === 'FINAL_PASS') actions.adminFinalize(a.id, a.isMe, 'PASS');
    if (c === 'FINAL_FAIL') actions.adminFinalize(a.id, a.isMe, 'FAIL');
  };

  return (
    <>
      <TopBar title="Application Review" over="CAMPUS CONNECT" back="/admin/applicants" />
      <Screen>
        {/* 내부/공개 상태 */}
        <div className="row g8 wrap">
          <Badge tone={internal.tone}>내부: {internal.label}</Badge>
          <Badge tone="outline">공개: {meta.label}</Badge>
          {a.isMe && <Badge tone="accent">본인 지원</Badge>}
        </div>

        {/* 지원자 */}
        <div className="row g16 mt16">
          <span
            className="center shrink0"
            style={{ width: 64, height: 64, borderRadius: 20, background: a.avatarColor || 'var(--c-primary)', color: '#fff', fontWeight: 800, fontSize: 20, display: 'flex' }}
            aria-hidden
          >
            {a.name?.slice(0, 2)}
          </span>
          <div className="col g2 grow">
            <p className="t-h1">{a.name}</p>
            <p className="t-body-s ink2">{a.department} · {a.admissionYear}학번</p>
            <p className="t-cap ink3">{fmtDateTime(a.submittedAt)} 제출</p>
          </div>
        </div>

        <div className="row g8 mt12 wrap">
          <Badge tone="primary-solid">{field?.label ?? '—'}</Badge>
          {a.score != null && (
            <Badge tone="neutral">
              <Star size={12} /> 서류 점수 {a.score}
            </Badge>
          )}
        </div>

        {/* 문항 */}
        <Section icon={<FileText size={17} />} title="지원서 답변">
          <div className="col g12">
            {recruitment.questions.map((q, i) => (
              <div key={q.id} className="qa-card">
                <span className="t-cap-b c-primary">질문 {i + 1}</span>
                <span className="t-label">{q.label}</span>
                <p className="qa-answer">{a.answers?.[q.id] || '—'}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 포트폴리오 */}
        <Section icon={<Paperclip size={17} />} title="포트폴리오">
          {a.portfolio ? (
            <Card pad className="col g12">
              {a.portfolio.fileName && (
                <div className="row g12">
                  <span className="center shrink0" style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
                    <FileText size={20} />
                  </span>
                  <span className="col g2 grow" style={{ minWidth: 0 }}>
                    <span className="self-start">
                      <Badge tone="mint-soft">PDF 첨부됨</Badge>
                    </span>
                    <span className="t-label clamp1">{a.portfolio.fileName}</span>
                    <span className="t-cap ink3">{a.portfolio.sizeMb} MB{a.portfolio.pages ? ` · ${a.portfolio.pages} 페이지` : ''}</span>
                  </span>
                </div>
              )}
              {a.portfolio.link && (
                <div className="row g8" style={{ background: 'var(--c-tint-100)', borderRadius: 8, padding: 12 }}>
                  <span className="c-primary shrink0"><Link size={16} /></span>
                  <span className="t-body-s c-primary clamp1" style={{ textDecoration: 'underline' }}>{a.portfolio.link}</span>
                </div>
              )}
            </Card>
          ) : (
            <Card variant="tint" className="card--flat card--pad">
              <p className="t-body-s ink3">첨부된 포트폴리오가 없습니다.</p>
            </Card>
          )}
        </Section>

        {/* 내부 평가 메모 */}
        <Section icon={<User size={17} />} title="내부 평가 메모">
          <Card variant="tint" className="card--flat card--pad20 col g12">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="면접관 및 운영진을 위한 내부 공유용 코멘트입니다..."
              style={{ minHeight: 110 }}
            />
            <div className="row between">
              <span className="row g4 t-cap ink3">
                <Alert size={13} /> 지원자에게 공개되지 않습니다.
              </span>
              <Button variant="soft" size="sm" onClick={saveMemo}>
                <Save size={14} /> 저장하기
              </Button>
            </div>
          </Card>
        </Section>

        {/* 내부 상태 */}
        <Section icon={<Star size={17} />} title="내부 상태 지정">
          <div className="row g8 wrap">
            {[
              InternalStatus.REVIEWING,
              InternalStatus.PASS_PREDICTED,
              InternalStatus.FAIL_PREDICTED,
              InternalStatus.HOLD,
            ].map((k) => (
              <button
                key={k}
                type="button"
                className="chip"
                aria-pressed={a.internalStatus === k}
                onClick={() => {
                  actions.adminSetInternal(a.id, a.isMe, k);
                  actions.toast(`내부 상태를 '${INTERNAL_META[k].label}'로 변경했습니다.`);
                }}
              >
                {INTERNAL_META[k].label}
              </button>
            ))}
          </div>
        </Section>

        {decided && (
          <Card variant="tint" className="card--flat card--pad row-top g8 mt24">
            <span className="c-primary shrink0"><Check size={16} /></span>
            <p className="t-cap ink2">
              최종 결과가 &lsquo;{meta.label}&rsquo;로 발표되었습니다. 더 이상 상태를 변경할 수 없습니다.
            </p>
          </Card>
        )}
      </Screen>

      {/* 결정 액션 */}
      {!decided && (
        <div className="actionbar">
          <p className="t-cap ink3 center-text">
            {inDocStage
              ? '서류 전형 결정 — 합격 시 지원자가 면접 시간을 선택할 수 있습니다.'
              : '면접 전형 결정 — 최종 결과가 지원자에게 발표됩니다.'}
          </p>
          <div className="row g8">
            <Button variant="dangerline" size="lg" block onClick={() => setConfirm(inDocStage ? 'FAIL' : 'FINAL_FAIL')}>
              <X size={17} /> 불합격
            </Button>
            <Button variant="primary" size="lg" block onClick={() => setConfirm(inDocStage ? 'PASS' : 'FINAL_PASS')}>
              <Check size={17} /> {inDocStage ? '합격 (면접으로)' : '최종 합격'}
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm === 'PASS' ? '서류 합격으로 처리할까요?'
            : confirm === 'FAIL' ? '불합격으로 처리할까요?'
            : confirm === 'FINAL_PASS' ? '최종 합격으로 발표할까요?'
            : '최종 불합격으로 발표할까요?'
        }
        footer={
          <div className="row g8">
            <Button variant="soft" block onClick={() => setConfirm(null)}>취소</Button>
            <Button variant={confirm?.includes('FAIL') ? 'danger' : 'primary'} block onClick={runConfirm}>
              확인
            </Button>
          </div>
        }
      >
        <p className="t-body-s ink2">
          {confirm === 'PASS' && '지원자에게 면접 예약 안내 알림이 발송되고, 면접 시간을 직접 선택할 수 있게 됩니다.'}
          {confirm === 'FAIL' && '지원자에게 서류 결과 알림이 발송되며 전형이 종료됩니다.'}
          {confirm === 'FINAL_PASS' && '지원자에게 최종 합격 알림이 발송되고 상태가 최종 합격으로 변경됩니다.'}
          {confirm === 'FINAL_FAIL' && '지원자에게 최종 결과 알림이 발송되며 전형이 종료됩니다.'}
        </p>
      </Sheet>
    </>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="col g12 mt24">
      <span className="row g8 t-h4">
        <span className="c-primary">{icon}</span>
        {title}
      </span>
      {children}
    </div>
  );
}
