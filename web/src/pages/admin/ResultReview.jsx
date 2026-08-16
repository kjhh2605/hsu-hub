import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Send, CheckCircle2, Clock, Bell, Mail, MessageCircle,
  Download, AlertTriangle,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Avatar, Panel, Divider,
} from '@/components/ui';
import { TextArea, RadioGroup, Toggle } from '@/components/ui/Form';
import { ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { formatDateTime } from '@/lib/utils';

function KanbanCard({ applicant, onMoveLeft, onMoveRight, showLeft, showRight }) {
  if (!applicant) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-line/40 bg-surface px-3 py-2.5 shadow-xs">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar emoji={applicant.avatar} name={applicant.name} size="xs" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{applicant.name}</p>
          <p className="text-[11px] text-ink-3 truncate">{applicant.department}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {showLeft && (
          <button type="button" onClick={onMoveLeft} aria-label="왼쪽으로 이동" className="h-6 w-6 flex items-center justify-center rounded text-ink-3 hover:bg-tint-100">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {showRight && (
          <button type="button" onClick={onMoveRight} aria-label="오른쪽으로 이동" className="h-6 w-6 flex items-center justify-center rounded text-ink-3 hover:bg-tint-100">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResultReview() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { confirm, confirmNode } = useConfirm();
  const batch = state.resultBatch;
  const applicants = state.applicants;

  const [publishMode, setPublishMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');

  const getApplicant = (id) => applicants.find((a) => a.id === id);

  const passApplicants = batch.passIds.map(getApplicant).filter(Boolean);
  const holdApplicants = batch.holdIds.map(getApplicant).filter(Boolean);
  const failApplicants = batch.failIds.map(getApplicant).filter(Boolean);
  const totalCount = passApplicants.length + holdApplicants.length + failApplicants.length;

  const handleMove = (id, to) => {
    dispatch({ type: 'moveResultTarget', id, to });
  };

  const handleTemplateChange = (key, value) => {
    dispatch({ type: 'patchResultBatch', patch: { [key]: value } });
  };

  const handleChannelToggle = (channel) => {
    dispatch({
      type: 'patchResultBatch',
      patch: { channels: { ...batch.channels, [channel]: !batch.channels[channel] } },
    });
  };

  const handlePublish = () => {
    const totalRecipients = batch.passIds.length + batch.failIds.length;
    confirm({
      title: '결과 발표',
      desc: `${totalRecipients}명에게 발송됩니다. 발표를 진행하시겠습니까?`,
      confirmLabel: '발표하기',
      onConfirm: () => {
        dispatch({ type: 'publishResults', mode: publishMode });
        toast.success('결과가 성공적으로 발표되었습니다.');
      },
    });
  };

  const isPublished = batch.status === 'published' || batch.status === 'scheduled';

  // Preview template with real name
  const previewTemplate = (template, name) => {
    return template.replace(/\{이름\}/g, name);
  };

  return (
    <AdminShell
      title="결과 발표 대상 검토"
      subtitle={batch.stageLabel}
      footer={
        !isPublished ? (
          <div className="flex items-center justify-between max-w-[1080px] mx-auto">
            <Badge tone={batch.status === 'draft' ? 'amber' : 'mint'}>
              {batch.status === 'draft' ? '초안' : batch.status}
            </Badge>
            <Button variant="primary" size="md" icon={Send} onClick={handlePublish}>
              발표하기
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 max-w-[1080px] mx-auto">
            <CheckCircle2 className="h-5 w-5 text-success-ink" />
            <span className="text-sm font-semibold text-success-ink">발표 완료</span>
          </div>
        )
      }
    >
      <div className="mx-auto max-w-[1080px] space-y-6">
        {/* Header info */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge tone="primary">{batch.stageLabel}</Badge>
            <div className="flex items-center gap-1.5 text-sm text-ink-2">
              <Clock className="h-3.5 w-3.5" />
              <span>예정: {formatDateTime(batch.scheduledAt)}</span>
            </div>
            <Badge tone={isPublished ? 'mint' : batch.status === 'scheduled' ? 'amber' : 'slate'}>
              {isPublished ? '발표 완료' : batch.status === 'scheduled' ? '예약됨' : '초안'}
            </Badge>
          </div>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => toast.success('CSV 파일이 다운로드되었습니다.')}>CSV 내보내기</Button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[rgba(108,248,187,0.3)] p-6 relative overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-success-ink mb-1">서류 합격 예정</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-success-ink">{passApplicants.length}</span>
              <span className="text-sm text-success-ink/70">명</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-success-ink/10">
                <div className="h-full rounded-full bg-success-ink/40" style={{ width: `${totalCount > 0 ? (passApplicants.length / totalCount * 100) : 0}%` }} />
              </div>
              <span className="text-sm text-success-ink">{totalCount > 0 ? Math.round(passApplicants.length / totalCount * 100) : 0}%</span>
            </div>
          </div>
          <div className="rounded-2xl bg-[#DCE9FF] p-6 relative overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-1">서류 불합격 예정</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-ink">{failApplicants.length}</span>
              <span className="text-sm text-ink-3">명</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-ink/30" style={{ width: `${totalCount > 0 ? (failApplicants.length / totalCount * 100) : 0}%` }} />
              </div>
              <span className="text-sm text-ink-3">{totalCount > 0 ? Math.round(failApplicants.length / totalCount * 100) : 0}%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(186,26,26,0.1)] bg-[rgba(255,218,214,0.2)] p-6 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-danger" />
              <p className="text-xs font-semibold uppercase tracking-wider text-danger">보류 중</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-danger">{holdApplicants.length}</span>
              <span className="text-sm text-danger/70">미결정</span>
            </div>
            <p className="mt-3 text-xs text-danger/80 leading-relaxed">
              {holdApplicants.length === 0 ? '모든 지원자에게 결과가 배정되었습니다. 발표를 진행할 수 있습니다.' : '보류 중인 지원자를 합격 또는 불합격으로 이동해 주세요.'}
            </p>
          </div>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pass column */}
          <div className="rounded-xl border border-line/40 bg-tint-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-success-ink">합격</h3>
              <Badge tone="mint">{passApplicants.length}명</Badge>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {passApplicants.map((a) => (
                <KanbanCard
                  key={a.id}
                  applicant={a}
                  showRight
                  onMoveRight={() => handleMove(a.id, 'hold')}
                />
              ))}
            </div>
          </div>

          {/* Hold column */}
          <div className="rounded-xl border border-line/40 bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink-2">보류</h3>
              <Badge tone="amber">{holdApplicants.length}명</Badge>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {holdApplicants.map((a) => (
                <KanbanCard
                  key={a.id}
                  applicant={a}
                  showLeft
                  showRight
                  onMoveLeft={() => handleMove(a.id, 'pass')}
                  onMoveRight={() => handleMove(a.id, 'fail')}
                />
              ))}
            </div>
          </div>

          {/* Fail column */}
          <div className="rounded-xl border border-line/40 bg-danger-soft/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-danger">불합격</h3>
              <Badge tone="danger">{failApplicants.length}명</Badge>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {failApplicants.map((a) => (
                <KanbanCard
                  key={a.id}
                  applicant={a}
                  showLeft
                  onMoveLeft={() => handleMove(a.id, 'hold')}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Templates */}
        <Panel className="p-5">
          <h3 className="text-base font-bold text-ink mb-4">발표 문구</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <TextArea
                label="합격 메시지"
                rows={4}
                value={batch.passTemplate}
                onChange={(e) => handleTemplateChange('passTemplate', e.target.value)}
              />
              {passApplicants[0] && (
                <div className="mt-2 rounded-lg bg-tint-50 p-3">
                  <p className="text-[11px] font-semibold text-ink-3 mb-1">미리보기</p>
                  <p className="text-xs text-ink-2 whitespace-pre-line">
                    {previewTemplate(batch.passTemplate, passApplicants[0].name)}
                  </p>
                </div>
              )}
            </div>
            <div>
              <TextArea
                label="불합격 메시지"
                rows={4}
                value={batch.failTemplate}
                onChange={(e) => handleTemplateChange('failTemplate', e.target.value)}
              />
              {failApplicants[0] && (
                <div className="mt-2 rounded-lg bg-tint-50 p-3">
                  <p className="text-[11px] font-semibold text-ink-3 mb-1">미리보기</p>
                  <p className="text-xs text-ink-2 whitespace-pre-line">
                    {previewTemplate(batch.failTemplate, failApplicants[0].name)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Channels */}
        <Panel className="p-5">
          <h3 className="text-base font-bold text-ink mb-4">발송 채널</h3>
          <div className="space-y-3">
            <Toggle
              label="푸시 알림"
              desc="앱 푸시 알림으로 발송합니다"
              checked={batch.channels.push}
              onChange={() => handleChannelToggle('push')}
            />
            <Toggle
              label="이메일"
              desc="등록된 이메일로 발송합니다"
              checked={batch.channels.email}
              onChange={() => handleChannelToggle('email')}
            />
            <Toggle
              label="카카오톡"
              desc="카카오 알림톡으로 발송합니다"
              checked={batch.channels.kakao}
              onChange={() => handleChannelToggle('kakao')}
            />
          </div>
        </Panel>

        {/* Publish mode */}
        <Panel className="p-5">
          <h3 className="text-base font-bold text-ink mb-4">발표 방식</h3>
          <RadioGroup
            options={[
              { value: 'now', label: '즉시 발표', desc: '저장 즉시 대상자에게 발송합니다' },
              { value: 'schedule', label: '예약 발표', desc: '지정한 일시에 자동으로 발송합니다' },
            ]}
            value={publishMode}
            onChange={setPublishMode}
          />
          {publishMode === 'schedule' && (
            <div className="mt-4">
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="field"
              />
            </div>
          )}
        </Panel>
      </div>

      {confirmNode}
    </AdminShell>
  );
}
