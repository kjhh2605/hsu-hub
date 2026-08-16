import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, List, MapPin, Users, Clock, MoreVertical, Trash2, Edit, PlusCircle,
} from 'lucide-react';
import { AdminShell, KpiCard } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Panel, EmptyState,
} from '@/components/ui';
import { DataTable, Progress } from '@/components/ui/Data';
import { SegmentedControl, TextInput, Select } from '@/components/ui/Form';
import { Modal, Dropdown, ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { formatDayLabel } from '@/lib/utils';

export default function InterviewSessions() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm, confirmNode } = useConfirm();

  const sessions = state.sessions;
  const [viewMode, setViewMode] = useState('list');
  const [sessionFilter, setSessionFilter] = useState('active');
  const [addSlotModalOpen, setAddSlotModalOpen] = useState(false);
  const [addSlotSessionId, setAddSlotSessionId] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState('1');

  // KPI calculations
  const totalSlots = sessions.reduce((s, ses) => s + ses.slots.length, 0);
  const totalBooked = sessions.reduce((s, ses) => s + ses.slots.reduce((ss, sl) => ss + sl.booked, 0), 0);
  const totalCapacity = sessions.reduce((s, ses) => s + ses.slots.reduce((ss, sl) => ss + sl.capacity, 0), 0);
  const bookingRate = totalCapacity ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  const unassigned = state.applicants.filter((a) => a.status === 'docPass' || a.status === 'reviewing').length;
  const remainingSlots = totalCapacity - totalBooked;
  const avgDuration = sessions.length ? Math.round(sessions.reduce((s, ses) => s + ses.slotMinutes, 0) / sessions.length) : 0;

  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'archived') return sessions.filter((s) => s.status === 'done');
    return sessions.filter((s) => s.status !== 'done');
  }, [sessions, sessionFilter]);

  const handleDeleteSession = (sessionId, sessionName) => {
    confirm({
      title: '세션 삭제',
      desc: `"${sessionName}" 세션을 삭제하시겠습니까? 배정된 지원자의 면접 예약도 취소됩니다.`,
      confirmLabel: '삭제',
      tone: 'danger',
      onConfirm: () => {
        dispatch({ type: 'deleteSession', id: sessionId });
        toast.success('세션이 삭제되었습니다.');
      },
    });
  };

  const handleStatusChange = (sessionId, newStatus) => {
    dispatch({ type: 'updateSession', id: sessionId, patch: { status: newStatus } });
    toast.success('세션 상태가 변경되었습니다.');
  };

  const handleAddSlot = () => {
    if (!newSlotStart || !newSlotEnd) {
      toast.error('시작/종료 시간을 입력해 주세요.');
      return;
    }
    const slot = {
      id: `slot-${Date.now()}`,
      start: newSlotStart,
      end: newSlotEnd,
      capacity: Number(newSlotCapacity) || 1,
      booked: 0,
      applicantIds: [],
    };
    dispatch({ type: 'addSlot', sessionId: addSlotSessionId, slot });
    toast.success('슬롯이 추가되었습니다.');
    setAddSlotModalOpen(false);
    setNewSlotStart('');
    setNewSlotEnd('');
    setNewSlotCapacity('1');
  };

  const statusBadge = (status) => {
    const map = { open: ['mint', '진행중'], full: ['primary', '만석'], closed: ['slate', '마감'], done: ['neutral', '완료'] };
    const [tone, label] = map[status] ?? ['neutral', status];
    return <Badge tone={tone}>{label}</Badge>;
  };

  return (
    <AdminShell
      title="면접 세션 관리"
      subtitle={`${sessions.length}개 세션`}
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/admin/interviews/new')}>
          세션 만들기
        </Button>
      }
    >
      <div className="mx-auto max-w-[1080px] space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="총 세션" value={sessions.length} tone="primary" icon={Calendar} />
          <KpiCard label="총 슬롯" value={totalSlots} tone="slate" icon={Clock} />
          <KpiCard label="예약률" value={`${bookingRate}%`} tone="mint" icon={Users} />
          <KpiCard label="미배정 지원자" value={unassigned} tone="amber" icon={Users} />
        </div>

        {/* View toggle & filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-tint-100 p-1">
              <button
                type="button"
                onClick={() => setSessionFilter('active')}
                className={cx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  sessionFilter === 'active'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-ink-3 hover:text-ink-2',
                )}
              >
                진행중
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('archived')}
                className={cx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  sessionFilter === 'archived'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-ink-3 hover:text-ink-2',
                )}
              >
                완료
              </button>
            </div>
          </div>
          <SegmentedControl
            options={[
              { value: 'list', label: '리스트' },
              { value: 'calendar', label: '캘린더' },
            ]}
            value={viewMode}
            onChange={setViewMode}
            className="w-[200px]"
            size="sm"
          />
        </div>

        {viewMode === 'list' ? (
          /* List view */
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="면접 세션이 없습니다"
                desc="면접 세션을 만들어 지원자를 배정하세요."
                action={<Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/admin/interviews/new')}>세션 만들기</Button>}
              />
            ) : (
              filteredSessions.map((session) => {
                const sessionBooked = session.slots.reduce((s, sl) => s + sl.booked, 0);
                const sessionCap = session.slots.reduce((s, sl) => s + sl.capacity, 0);
                const sessionRate = sessionCap ? Math.round((sessionBooked / sessionCap) * 100) : 0;

                return (
                  <Panel key={session.id} className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-ink">{session.name}</h3>
                          {statusBadge(session.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{session.dayLabel}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.place}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{session.interviewers.join(', ')}</span>
                        </div>
                      </div>
                      <Dropdown
                        align="right"
                        trigger={<button type="button" aria-label="세션 액션" className="p-1.5 rounded-lg hover:bg-line/20"><MoreVertical className="h-4 w-4 text-ink-3" /></button>}
                        items={[
                          { key: 'open', label: '진행중으로 변경', onClick: () => handleStatusChange(session.id, 'open') },
                          { key: 'closed', label: '마감으로 변경', onClick: () => handleStatusChange(session.id, 'closed') },
                          { key: 'done', label: '완료로 변경', onClick: () => handleStatusChange(session.id, 'done') },
                          { divider: true },
                          { key: 'addSlot', label: '슬롯 추가', icon: PlusCircle, onClick: () => { setAddSlotSessionId(session.id); setAddSlotModalOpen(true); } },
                          { divider: true },
                          { key: 'delete', label: '세션 삭제', tone: 'danger', icon: Trash2, onClick: () => handleDeleteSession(session.id, session.name) },
                        ]}
                      />
                    </div>

                    {/* Slot grid */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {session.slots.map((slot) => {
                        const isFull = slot.booked >= slot.capacity;
                        const hasBooking = slot.booked > 0;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => navigate(`/admin/interviews/${session.id}/slots/${slot.id}`)}
                            className={cx(
                              'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                              isFull
                                ? 'border-primary bg-primary text-white'
                                : hasBooking
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-line/50 bg-surface text-ink-3 hover:bg-tint-100',
                            )}
                          >
                            {slot.start}~{slot.end}
                            <span className="ml-1 opacity-70">({slot.booked}/{slot.capacity})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Session progress */}
                    <Progress value={sessionRate} max={100} size="sm" label={`예약률 ${sessionRate}%`} showValue className="mt-2" />
                  </Panel>
                );
              })
            )}
          </div>
        ) : (
          /* Calendar view */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <Panel key={session.id} className="p-4">
                <h4 className="text-sm font-bold text-ink mb-1">{session.dayLabel}</h4>
                <p className="text-xs text-ink-3 mb-3">{session.place}</p>
                <div className="space-y-1.5">
                  {session.slots.map((slot) => {
                    const isFull = slot.booked >= slot.capacity;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => navigate(`/admin/interviews/${session.id}/slots/${slot.id}`)}
                        className={cx(
                          'w-full rounded-lg px-3 py-2 text-left text-xs transition-colors',
                          isFull
                            ? 'bg-primary text-white'
                            : slot.booked > 0
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-line/10 text-ink-3 border border-line/30 hover:bg-tint-100',
                        )}
                      >
                        <span className="font-semibold">{slot.start} ~ {slot.end}</span>
                        <span className="ml-2">({slot.booked}/{slot.capacity})</span>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>

      {/* Add slot modal */}
      <Modal
        open={addSlotModalOpen}
        onClose={() => setAddSlotModalOpen(false)}
        title="슬롯 추가"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" block onClick={() => setAddSlotModalOpen(false)}>취소</Button>
            <Button variant="primary" size="md" block onClick={handleAddSlot}>추가</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextInput label="시작 시간" type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} required />
          <TextInput label="종료 시간" type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} required />
          <TextInput label="정원" type="number" value={newSlotCapacity} onChange={(e) => setNewSlotCapacity(e.target.value)} />
        </div>
      </Modal>

      {confirmNode}
    </AdminShell>
  );
}
