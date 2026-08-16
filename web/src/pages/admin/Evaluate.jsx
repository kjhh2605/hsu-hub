import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Timer, Save, CheckCircle2, ChevronRight, ChevronLeft, FileText, Sparkles,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Avatar, Panel, KeyValue, Divider,
} from '@/components/ui';
import { Progress } from '@/components/ui/Data';
import { TextArea, RadioGroup } from '@/components/ui/Form';
import { ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { weightedScore, groupBy, formatDateTime } from '@/lib/utils';
import { EVALUATION_CRITERIA, EVALUATION_RECOMMENDATIONS, INTERVIEW_QUESTIONS } from '@/data/admin';

export default function Evaluate() {
  const { applicantId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { confirm, confirmNode } = useConfirm();

  const applicant = state.applicants.find((a) => a.id === applicantId);

  // 이전/다음 지원자 목록.
  // 면접 단계 지원자에 "지금 열려 있는 지원자"를 반드시 포함시킨다.
  // (포함하지 않으면 currentIdx 가 -1 이 되어 "지원자 -- / N" 처럼 깨진다.)
  const interviewApplicants = useMemo(() => {
    const inStage = (a) =>
      a.status === 'interviewScheduled' || a.status === 'interviewDone' || a.status === 'docPass';
    return state.applicants.filter((a) => inStage(a) || a.id === applicantId);
  }, [state.applicants, applicantId]);
  const currentIdx = interviewApplicants.findIndex((a) => a.id === applicantId);
  const prevApplicant = currentIdx > 0 ? interviewApplicants[currentIdx - 1] : null;
  const nextApplicant =
    currentIdx >= 0 && currentIdx < interviewApplicants.length - 1
      ? interviewApplicants[currentIdx + 1]
      : null;

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Evaluation state
  const [scores, setScores] = useState(() => {
    const existing = state.evaluations[applicantId];
    return existing?.scores ?? {};
  });
  const [recommendation, setRecommendation] = useState(() => {
    return state.evaluations[applicantId]?.recommendation ?? '';
  });
  const [notes, setNotes] = useState(() => {
    return state.evaluations[applicantId]?.notes ?? '';
  });
  const [questionMemos, setQuestionMemos] = useState({});
  const [questionChecked, setQuestionChecked] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const totalScore = weightedScore(scores, EVALUATION_CRITERIA);

  const groupedQuestions = useMemo(() => groupBy(INTERVIEW_QUESTIONS, (q) => q.category), []);

  if (!applicant) {
    return (
      <AdminShell title="면접 평가" backTo="/admin/interviews">
        <div className="py-20 text-center text-ink-3">지원자를 찾을 수 없습니다.</div>
      </AdminShell>
    );
  }

  const handleScoreChange = (criterionId, value) => {
    setScores((prev) => ({ ...prev, [criterionId]: value }));
    setValidationErrors((prev) => ({ ...prev, [criterionId]: undefined }));
  };

  const handleTempSave = () => {
    localStorage.setItem(`eval-temp-${applicantId}`, JSON.stringify({ scores, recommendation, notes, questionMemos }));
    toast.info('임시 저장되었습니다.');
  };

  const validate = () => {
    const errs = {};
    EVALUATION_CRITERIA.forEach((c) => {
      if (!scores[c.id]) errs[c.id] = '점수를 선택해 주세요.';
    });
    if (!recommendation) errs.recommendation = '추천 등급을 선택해 주세요.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error('모든 평가 항목을 입력해 주세요.');
      return;
    }
    confirm({
      title: '평가 완료',
      desc: `${applicant.name}님에 대한 면접 평가를 제출하시겠습니까? 제출 후 수정이 어렵습니다.`,
      confirmLabel: '평가 완료',
      onConfirm: () => {
        dispatch({
          type: 'saveEvaluation',
          applicantId,
          payload: { scores, recommendation, notes },
        });
        localStorage.removeItem(`eval-temp-${applicantId}`);
        toast.success('평가가 저장되었습니다.');
        // Navigate to next applicant in current slot or back
        navigate('/admin/interviews');
      },
    });
  };

  return (
    <AdminShell
      title="면접 평가"
      subtitle={applicant.name}
      backTo="/admin/interviews"
      compact
      actions={
        <div className="flex items-center gap-3">
          {/* Applicant navigation */}
          <div className="flex items-center gap-1 rounded-lg bg-tint-100 px-2 py-1">
            <button
              type="button"
              disabled={!prevApplicant}
              onClick={() => prevApplicant && navigate(`/admin/interviews/evaluate/${prevApplicant.id}`)}
              className="px-2 py-1 text-xs font-medium text-ink-3 rounded hover:bg-tint-200 disabled:opacity-40"
            >
              이전
            </button>
            <span className="w-px h-4 bg-line" />
            <span className="px-3 text-xs font-semibold text-ink">
              지원자 {currentIdx >= 0 ? String(currentIdx + 1).padStart(2, '0') : '--'} / {interviewApplicants.length}
            </span>
            <span className="w-px h-4 bg-line" />
            <button
              type="button"
              disabled={!nextApplicant}
              onClick={() => nextApplicant && navigate(`/admin/interviews/evaluate/${nextApplicant.id}`)}
              className="px-2 py-1 text-xs font-medium text-ink-3 rounded hover:bg-tint-200 disabled:opacity-40"
            >
              다음
            </button>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 rounded-full bg-tint-100 px-3 py-1.5">
            <Timer className="h-4 w-4 text-ink-2" />
            <span className="text-sm font-bold tabular-nums text-ink">{formatTimer(timerSeconds)}</span>
            <button
              type="button"
              onClick={() => setTimerRunning((v) => !v)}
              aria-label={timerRunning ? '일시정지' : '시작'}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
            >
              {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}
              aria-label="리셋"
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-line/20"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <Button variant="ghost" size="md" icon={Save} onClick={handleTempSave}>임시저장</Button>
          <Button variant="primary" size="md" icon={CheckCircle2} onClick={handleSubmit}>평가 완료</Button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Applicant info */}
        <div className="lg:col-span-3 space-y-4">
          <Panel className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar emoji={applicant.avatar} name={applicant.name} size="md" />
              <div>
                <p className="text-sm font-bold text-ink">{applicant.name}</p>
                <p className="text-xs text-ink-3">{applicant.department} · {applicant.grade}학년</p>
              </div>
            </div>
            <Divider className="my-3" />
            <div className="space-y-1 text-xs">
              <KeyValue label="트랙" value={applicant.trackLabel} />
              <KeyValue label="서류점수" value={`${applicant.docScore}점`} />
              <KeyValue label="학번" value={applicant.studentId} />
            </div>
          </Panel>

          {/* Answers summary */}
          <Panel className="p-4 max-h-[400px] overflow-y-auto">
            <h4 className="text-sm font-bold text-ink mb-3">지원서 답변</h4>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-ink-3 mb-1">지원 동기</p>
                <p className="text-xs text-ink-2 leading-relaxed">{applicant.answers.motivation}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-3 mb-1">관련 경험</p>
                <p className="text-xs text-ink-2 leading-relaxed">{applicant.answers.experience}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-3 mb-1">보유 스킬</p>
                <div className="flex flex-wrap gap-1">
                  {applicant.answers.skills.map((s) => (
                    <Badge key={s} tone="slate">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Center: Question guide */}
        <div className="lg:col-span-5 space-y-4">
          <Panel className="p-4">
            <h3 className="text-base font-bold text-ink mb-4">질문 가이드</h3>
            <div className="space-y-5">
              {Object.entries(groupedQuestions).map(([category, questions]) => (
                <div key={category}>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{category}</p>
                  <div className="space-y-3">
                    {questions.map((q) => (
                      <div key={q.id} className="rounded-lg border border-line/40 p-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={!!questionChecked[q.id]}
                            onChange={(e) => setQuestionChecked((prev) => ({ ...prev, [q.id]: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 accent-[#0058BE]"
                            aria-label={`${q.text} 완료`}
                          />
                          <p className={cx('text-sm text-ink leading-snug flex-1', questionChecked[q.id] && 'line-through text-ink-3')}>
                            {q.text}
                          </p>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="메모..."
                          value={questionMemos[q.id] ?? ''}
                          onChange={(e) => setQuestionMemos((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          className="mt-2 w-full rounded-lg border border-line/30 bg-tint-50 px-3 py-2 text-xs text-ink-2 placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right: Evaluation sheet */}
        <div className="lg:col-span-4 space-y-4">
          <Panel className="p-4">
            <h3 className="text-base font-bold text-ink mb-4">평가 시트</h3>
            <div className="space-y-5">
              {EVALUATION_CRITERIA.map((crit) => {
                const score = scores[crit.id] ?? 0;
                return (
                  <div key={crit.id}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-semibold text-ink">{crit.label}</span>
                      <span className="text-[11px] text-ink-3">가중치 {crit.weight}%</span>
                    </div>
                    <p className="text-[11px] text-ink-3 mb-2">{crit.desc}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleScoreChange(crit.id, v)}
                          className={cx(
                            'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all',
                            score === v
                              ? 'bg-primary text-white shadow-primary'
                              : 'bg-line/20 text-ink-3 hover:bg-tint-200',
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {validationErrors[crit.id] && (
                      <p className="mt-1 text-xs text-danger">{validationErrors[crit.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <Divider className="my-4" />

            {/* Total score gauge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">가중 총점</span>
              <span className="text-2xl font-bold text-primary">{totalScore}</span>
            </div>
            <Progress value={totalScore} max={100} tone="primary" size="lg" />

            <Divider className="my-4" />

            {/* Recommendation */}
            <div>
              <p className="text-sm font-semibold text-ink mb-2" id="rec-grade-label">추천 등급</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="rec-grade-label">
                {EVALUATION_RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.value}
                    type="button"
                    role="radio"
                    aria-checked={recommendation === rec.value}
                    onClick={() => { setRecommendation(rec.value); setValidationErrors((p) => ({ ...p, recommendation: undefined })); }}
                    className={cx(
                      'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                      recommendation === rec.value
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-line/40 bg-surface text-ink-2 hover:bg-tint-100',
                    )}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
              {validationErrors.recommendation && (
                <p role="alert" className="mt-1 text-xs text-danger">{validationErrors.recommendation}</p>
              )}
            </div>

            <Divider className="my-4" />

            {/* Notes */}
            <TextArea
              label="종합 의견"
              rows={4}
              placeholder="면접 전반에 대한 총평을 작성하세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Panel>

          {/* Document review reference — matches Figma Korean variant "서류 검토 참고" */}
          <Panel className="p-4 bg-tint-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-3">서류 검토 참고</p>
              <Badge tone="mint">우선순위 높음</Badge>
            </div>
            <div className="space-y-3">
              {applicant.memos.length > 0 ? (
                applicant.memos.map((memo) => (
                  <div key={memo.id} className="rounded-lg border border-line/20 bg-bg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="h-4 w-4 text-ink-3" />
                      <span className="text-xs font-semibold text-ink">검토자: {memo.author}</span>
                    </div>
                    <p className="text-xs text-ink-2 italic leading-relaxed">"{memo.text}"</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-3 italic py-2">서류 검토 메모가 없습니다.</p>
              )}
            </div>

            {/* Previous scores */}
            <div className="mt-4 pt-3 border-t border-line/20">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-3 mb-2">이전 점수</p>
              <div className="space-y-2">
                {EVALUATION_CRITERIA.map((crit) => {
                  const prevScore = applicant.scores[crit.id];
                  return (
                    <div key={crit.id} className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">{crit.label}</span>
                      <span className="text-xs font-semibold text-ink">{prevScore ?? '-'} / 5</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {confirmNode}
    </AdminShell>
  );
}
