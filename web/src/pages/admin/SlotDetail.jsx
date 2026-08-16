import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, UserMinus, ClipboardCheck, MapPin, Clock, Users, AlertTriangle, Search, StickyNote, Trash2,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Avatar, Panel, KeyValue, EmptyState, Divider,
} from '@/components/ui';
import { Progress } from '@/components/ui/Data';
import { Toggle, TextInput } from '@/components/ui/Form';
import { Modal, ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { matches } from '@/lib/utils';

export default function SlotDetail() {
  const { sessionId, slotId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { confirm, confirmNode } = useConfirm();

  const session = state.sessions.find((s) => s.id === sessionId);
  const slot = session?.slots.find((sl) => sl.id === slotId);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [checkedIn, setCheckedIn] = useState({});
  const [sessionMemo, setSessionMemo] = useState('');

  if (!session || !slot) {
    return (
      <AdminShell title="슬롯 상세" backTo="/admin/interviews">
        <div className="py-20 text-center text-ink-3">슬롯을 찾을 수 없습니다.</div>
      </AdminShell>
    );
  }

  const assignedApplicants = slot.applicantIds
    .map((id) => state.applicants.find((a) => a.id === id))
    .filter(Boolean);

  const isOverCapacity = slot.booked > slot.capacity;

  // Unassigned applicants for the modal
  const allAssignedIds = new Set(
    state.sessions.flatMap((s) => s.slots.flatMap((sl) => sl.applicantIds))
  );
  const unassignedApplicants = state.applicants.filter(
    (a) => !allAssignedIds.has(a.id) && (a.status === 'docPass' || a.status === 'reviewing')
  );
  const filteredUnassigned = unassignedApplicants.filter(
    (a) => matches(a.name, assignSearch) || matches(a.department, assignSearch)
  );

  const handleRemove = (applicantId, applicantName) => {
    confirm({
      title: '배정 취소',
      desc: `${applicantName}님의 면접 배정을 취소하시겠습니까?`,
      confirmLabel: '배정 취소',
      tone: 'danger',
      onConfirm: () => {
        dispatch({ type: 'removeApplicantFromSlot', sessionId, slotId, applicantId });
        toast.success('배정이 취소되었습니다.');
      },
    });
  };

  const handleAssign = (applicantId) => {
    dispatch({ type: 'assignApplicantToSlot', sessionId, slotId, applicantId });
    toast.success('지원자가 배정되었습니다.');
    setAssignModalOpen(false);
  };

  return (
    <AdminShell
      title={`${slot.start} ~ ${slot.end}`}
      subtitle={session.name}
      backTo="/admin/interviews"
    >
      <div className="mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Slot info + Memo */}
        <div className="lg:col-span-4 space-y-5">
          {/* Slot info card */}
          <Panel className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-3">면접 시간</p>
            <p className="text-sm font-semibold text-ink mb-1">{session.dayLabel}</p>
            <p className="text-sm text-ink-2 mb-4">{slot.start} — {slot.end} ({session.slotMinutes}분)</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-bg p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-ink-3">장소</p>
                  <p className="text-sm font-semibold text-ink">{session.place}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-bg p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6063EE] text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-ink-3">면접관</p>
                  <p className="text-sm font-semibold text-ink">{session.interviewers.join(', ')}</p>
                </div>
              </div>
            </div>
            {/* Capacity progress */}
            <div className="mt-4 pt-4 border-t border-line/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-ink">수용 인원 현황</span>
                <span className="text-sm font-bold text-primary">{slot.booked} / {slot.capacity}</span>
              </div>
              <Progress value={slot.booked} max={slot.capacity} tone="primary" size="md" />
              <p className="mt-2 text-xs text-ink-3">
                현재 {slot.capacity > 0 ? Math.round((slot.booked / slot.capacity) * 100) : 0}% 채워졌습니다. {Math.max(0, slot.capacity - slot.booked)}자리가 남았습니다.
              </p>
            </div>
            {isOverCapacity && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                정원을 초과했습니다. ({slot.booked}/{slot.capacity})
              </div>
            )}
          </Panel>

          {/* Session memo */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink">세션 메모</h3>
              <StickyNote className="h-4 w-4 text-ink-3" />
            </div>
            <textarea
              rows={6}
              placeholder="지원자들에 대한 메모나 면접 운영에 대한 참고사항을 기록하세요..."
              value={sessionMemo}
              onChange={(e) => setSessionMemo(e.target.value)}
              className="w-full rounded-lg border border-line/40 bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-ink-4 italic">
                {sessionMemo ? '작성됨' : '메모 없음'}
              </p>
              {sessionMemo && (
                <button
                  type="button"
                  onClick={() => setSessionMemo('')}
                  className="text-xs text-primary hover:underline"
                >
                  모두 지우기
                </button>
              )}
            </div>
          </Panel>
        </div>

        {/* Right column: Applicant list */}
        <div className="lg:col-span-8 space-y-5">
          {/* Assigned applicants */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-ink">배정된 지원자 ({assignedApplicants.length})</h3>
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setAssignModalOpen(true)}>
                지원자 배정
              </Button>
            </div>

            {assignedApplicants.length === 0 ? (
              <EmptyState
                icon={Users}
                title="배정된 지원자가 없습니다"
                desc="지원자를 배정하여 면접 일정을 구성하세요."
              />
            ) : (
              <div className="space-y-3">
                {assignedApplicants.map((applicant) => (
                  <div key={applicant.id} className="rounded-xl border border-line/40 bg-surface overflow-hidden">
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar emoji={applicant.avatar} name={applicant.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">{applicant.name}</p>
                            <Badge tone="slate">#{applicant.id.replace('apl-', 'A-')}</Badge>
                          </div>
                          <p className="text-xs text-ink-3">{applicant.department} · <Badge tone="primary">{applicant.trackLabel}</Badge></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="tint" size="sm" icon={ClipboardCheck} onClick={() => navigate(`/admin/interviews/evaluate/${applicant.id}`)}>
                          평가
                        </Button>
                        <Button variant="ghost" size="sm" icon={UserMinus} onClick={() => handleRemove(applicant.id, applicant.name)} aria-label="배정 취소" />
                      </div>
                    </div>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-line/20 bg-bg/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-3">상태:</span>
                        <div className="flex bg-tint-100 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setCheckedIn((prev) => ({ ...prev, [applicant.id]: true }))}
                            className={cx(
                              'px-3 py-1 text-xs font-medium',
                              checkedIn[applicant.id] === true
                                ? 'bg-success-ink text-white'
                                : 'text-ink-3 hover:bg-tint-200',
                            )}
                          >
                            출석
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckedIn((prev) => ({ ...prev, [applicant.id]: false }))}
                            className={cx(
                              'px-3 py-1 text-xs font-medium',
                              checkedIn[applicant.id] === false
                                ? 'bg-ink-2 text-white'
                                : 'text-ink-3 hover:bg-tint-200',
                            )}
                          >
                            결석
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs text-ink-3 hover:text-ink flex items-center gap-1"
                          onClick={() => toast.info('시간 변경 기능은 추후 업데이트됩니다.')}
                        >
                          <Clock className="h-3 w-3" />
                          시간 변경
                        </button>
                        <span className="w-px h-4 bg-line" />
                        <button
                          type="button"
                          className="text-xs text-danger hover:text-danger/80 flex items-center gap-1"
                          onClick={() => handleRemove(applicant.id, applicant.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty slot placeholder */}
            {assignedApplicants.length < slot.capacity && (
              <div className="mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line/50 p-6">
                <Users className="h-5 w-5 text-ink-4 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wide text-ink-4">배정 가능한 슬롯</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="지원자 배정"
        desc="미배정 지원자를 선택하여 이 슬롯에 배정합니다."
        size="lg"
      >
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
            <input
              type="text"
              placeholder="이름, 학과 검색..."
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="field pl-9"
            />
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto space-y-2">
          {filteredUnassigned.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-3">미배정 지원자가 없습니다.</p>
          ) : (
            filteredUnassigned.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleAssign(a.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line/40 px-4 py-3 text-left transition-colors hover:bg-tint-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar emoji={a.avatar} name={a.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{a.name}</p>
                    <p className="text-xs text-ink-3">{a.department} · {a.trackLabel}</p>
                  </div>
                </div>
                <Badge tone="slate">서류 {a.docScore}점</Badge>
              </button>
            ))
          )}
        </div>
      </Modal>

      {confirmNode}
    </AdminShell>
  );
}
