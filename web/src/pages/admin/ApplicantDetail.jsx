import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Send, ExternalLink, Paperclip, Clock,
  Mail, Phone, User, BookOpen, Star,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Avatar, Card, Panel, KeyValue, Divider,
} from '@/components/ui';
import { Progress } from '@/components/ui/Data';
import { TextArea } from '@/components/ui/Form';
import { ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { formatDateTime, timeAgo, weightedScore } from '@/lib/utils';
import { EVALUATION_CRITERIA } from '@/data/admin';
import { findFieldLabel } from '@/data/applications';

export default function ApplicantDetail() {
  const { applicantId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { confirm, confirmNode } = useConfirm();

  const applicants = state.applicants;
  const currentIdx = applicants.findIndex((a) => a.id === applicantId);
  const applicant = applicants[currentIdx];

  const [memoText, setMemoText] = useState('');

  if (!applicant) {
    return (
      <AdminShell title="지원자 상세" backTo="/admin/applicants">
        <div className="py-20 text-center text-ink-3">지원자를 찾을 수 없습니다.</div>
      </AdminShell>
    );
  }

  const prevId = currentIdx > 0 ? applicants[currentIdx - 1].id : null;
  const nextId = currentIdx < applicants.length - 1 ? applicants[currentIdx + 1].id : null;

  const totalScore = weightedScore(applicant.scores, EVALUATION_CRITERIA);

  const handleScore = (criterion, value) => {
    dispatch({ type: 'setApplicantScore', id: applicant.id, criterion, value });
  };

  const handleAddMemo = () => {
    if (!memoText.trim()) return;
    dispatch({ type: 'addApplicantMemo', id: applicant.id, text: memoText.trim() });
    setMemoText('');
    toast.success('메모가 추가되었습니다.');
  };

  const handleStatus = (status, label) => {
    confirm({
      title: `${label} 처리`,
      desc: `${applicant.name}님을 ${label} 처리하시겠습니까?`,
      confirmLabel: label,
      tone: status === 'docFail' ? 'danger' : 'primary',
      onConfirm: () => {
        dispatch({ type: 'setApplicantStatus', ids: [applicant.id], status });
        toast.success(`${applicant.name}님이 ${label} 처리되었습니다.`);
        if (nextId) navigate(`/admin/applicants/${nextId}`);
      },
    });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        icon={ChevronLeft}
        disabled={!prevId}
        onClick={() => prevId && navigate(`/admin/applicants/${prevId}`)}
        aria-label="이전 지원자"
      />
      <Badge tone={applicant.tone}>{applicant.statusLabel}</Badge>
      <Button
        variant="ghost"
        size="sm"
        icon={ChevronRight}
        disabled={!nextId}
        onClick={() => nextId && navigate(`/admin/applicants/${nextId}`)}
        aria-label="다음 지원자"
      />
    </div>
  );

  return (
    <AdminShell
      title={applicant.name}
      subtitle={`${applicant.department} · ${applicant.grade}학년`}
      backTo="/admin/applicants"
      actions={headerActions}
      footer={
        <div className="flex items-center justify-end gap-3 max-w-[1080px] mx-auto">
          <Button variant="danger" size="md" onClick={() => handleStatus('docFail', '불합격')}>불합격</Button>
          <Button variant="secondary" size="md" onClick={() => handleStatus('reviewing', '보류')}>보류</Button>
          <Button variant="primary" size="md" onClick={() => handleStatus('docPass', '서류 합격')}>서류 합격</Button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Profile card */}
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <Avatar emoji={applicant.avatar} name={applicant.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">{applicant.name}</h2>
                  <Badge tone={applicant.tone}>{applicant.statusLabel}</Badge>
                </div>
                <p className="text-sm text-ink-3 mt-1">{applicant.department} · {applicant.grade}학년</p>
              </div>
            </div>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 gap-y-1">
              <KeyValue icon={User} label="학번" value={applicant.studentId} />
              <KeyValue icon={BookOpen} label="트랙" value={applicant.trackLabel} />
              <KeyValue icon={Phone} label="연락처" value={applicant.phone} />
              <KeyValue icon={Mail} label="이메일" value={applicant.email} />
              <KeyValue icon={Clock} label="제출시각" value={formatDateTime(applicant.submittedAt)} />
              <KeyValue icon={Star} label="서류점수" value={`${applicant.docScore}점`} />
            </div>
          </Panel>

          {/* Answers */}
          <Panel className="p-5">
            <h3 className="text-base font-bold text-ink mb-4">지원서 답변</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-ink mb-1.5">{findFieldLabel(null, 'motivation')}</p>
                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line bg-tint-50 rounded-lg p-3">{applicant.answers.motivation}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink mb-1.5">{findFieldLabel(null, 'experience')}</p>
                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line bg-tint-50 rounded-lg p-3">{applicant.answers.experience}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink mb-1.5">{findFieldLabel(null, 'skills')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {applicant.answers.skills.map((s) => (
                    <Badge key={s} tone="slate">{s}</Badge>
                  ))}
                </div>
              </div>
              {applicant.answers.portfolio && (
                <div>
                  <p className="text-sm font-semibold text-ink mb-1.5">{findFieldLabel(null, 'portfolio')}</p>
                  <a href={applicant.answers.portfolio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {applicant.answers.portfolio}
                  </a>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Evaluation panel */}
          <Panel className="p-5">
            <h3 className="text-base font-bold text-ink mb-1">평가</h3>
            <p className="text-xs text-ink-3 mb-4">각 항목을 1~5점으로 평가하세요</p>
            <div className="space-y-4">
              {EVALUATION_CRITERIA.map((crit) => {
                const score = applicant.scores?.[crit.id] ?? 0;
                return (
                  <div key={crit.id}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm font-semibold text-ink">{crit.label}</span>
                      <span className="text-xs text-ink-3">가중치 {crit.weight}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleScore(crit.id, v)}
                          className={cx(
                            'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all',
                            score === v ? 'bg-primary text-white shadow-primary' : 'bg-line/20 text-ink-3 hover:bg-tint-200'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-bold text-primary">{score || '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Divider className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">가중 총점</span>
              <span className="text-xl font-bold text-primary">{totalScore}점</span>
            </div>
            <Progress value={totalScore} max={100} tone="primary" size="md" className="mt-2" />
          </Panel>

          {/* Memos */}
          <Panel className="p-5">
            <h3 className="text-base font-bold text-ink mb-3">메모 ({applicant.memos?.length ?? 0})</h3>
            <div className="space-y-3 max-h-[240px] overflow-y-auto mb-4">
              {(applicant.memos ?? []).map((m) => (
                <div key={m.id} className="rounded-lg bg-tint-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-ink">{m.author}</span>
                    <span className="text-[11px] text-ink-4">{timeAgo(m.at)}</span>
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed">{m.text}</p>
                </div>
              ))}
              {(!applicant.memos || applicant.memos.length === 0) && (
                <p className="text-sm text-ink-3 text-center py-4">메모가 없습니다.</p>
              )}
            </div>
            <div className="flex gap-2">
              <TextArea
                rows={2}
                placeholder="메모를 입력하세요..."
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button variant="tint" size="sm" icon={Send} className="mt-2" onClick={handleAddMemo} disabled={!memoText.trim()}>
              메모 추가
            </Button>
          </Panel>

          {/* Activity log */}
          <Panel className="p-5">
            <h3 className="text-base font-bold text-ink mb-3">활동 로그</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-ink-2">
                <span className="shrink-0 h-1.5 w-1.5 mt-2 rounded-full bg-primary" />
                <span>지원서 제출 — {formatDateTime(applicant.submittedAt)}</span>
              </div>
              {applicant.memos?.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-ink-2">
                  <span className="shrink-0 h-1.5 w-1.5 mt-2 rounded-full bg-ink-4" />
                  <span>{m.author}님이 메모 작성 — {timeAgo(m.at)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {confirmNode}
    </AdminShell>
  );
}
