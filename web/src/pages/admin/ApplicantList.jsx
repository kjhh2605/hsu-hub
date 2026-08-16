import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Columns3, Star, StarOff, MoreHorizontal,
  ChevronLeft, ChevronRight, X, CalendarDays,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Avatar, Chip, EmptyState, Panel,
} from '@/components/ui';
import { DataTable, useSortedRows, Progress } from '@/components/ui/Data';
import { TextInput, Select } from '@/components/ui/Form';
import { Modal, Dropdown, ConfirmDialog, useConfirm } from '@/components/ui/Overlay';
import { matches, formatDateTime, weightedScore } from '@/lib/utils';
import { EVALUATION_CRITERIA } from '@/data/admin';

const STATUS_OPTIONS = [
  { value: 'pending', label: '미검토' },
  { value: 'reviewing', label: '검토중' },
  { value: 'docPass', label: '서류 합격' },
  { value: 'docFail', label: '서류 불합격' },
  { value: 'interviewScheduled', label: '면접 예정' },
  { value: 'interviewDone', label: '면접 완료' },
  { value: 'finalPass', label: '최종 합격' },
  { value: 'finalFail', label: '최종 불합격' },
];

const TRACK_OPTIONS = [
  { value: 'fe', label: '프론트엔드' },
  { value: 'be', label: '백엔드' },
  { value: 'design', label: '디자인' },
  { value: 'pm', label: '기획/PM' },
];

const GRADE_OPTIONS = [
  { value: 1, label: '1학년' },
  { value: 2, label: '2학년' },
  { value: 3, label: '3학년' },
  { value: 4, label: '4학년' },
];

const PAGE_SIZE = 20;

const SUMMARY_CHIPS = [
  { key: 'all', label: '전체', filter: null },
  { key: 'pending', label: '미검토', filter: ['pending'] },
  { key: 'docPass', label: '서류합격', filter: ['docPass'] },
  { key: 'interviewDone', label: '면접완료', filter: ['interviewDone'] },
  { key: 'finalPass', label: '최종합격', filter: ['finalPass'] },
];

export default function ApplicantList() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm, confirmNode } = useConfirm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [trackFilter, setTrackFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sort, setSort] = useState({ key: 'submittedAt', dir: 'desc' });
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [activeChip, setActiveChip] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSession, setAssignSession] = useState('');
  const [assignSlot, setAssignSlot] = useState('');
  const [visibleCols, setVisibleCols] = useState({
    studentId: true, dept: true, track: true, docScore: true,
    interviewScore: true, status: true, submittedAt: true, memoCount: true,
  });
  const [colDropOpen, setColDropOpen] = useState(false);

  const applicants = state.applicants;

  // Chip click → set status filter
  const handleChipClick = (chip) => {
    setActiveChip(chip.key);
    setStatusFilter(chip.filter ?? []);
    setPage(0);
  };

  // Summary counts
  const counts = useMemo(() => ({
    all: applicants.length,
    pending: applicants.filter((a) => a.status === 'pending').length,
    docPass: applicants.filter((a) => a.status === 'docPass').length,
    interviewDone: applicants.filter((a) => a.status === 'interviewDone').length,
    finalPass: applicants.filter((a) => a.status === 'finalPass').length,
  }), [applicants]);

  // Filtered rows
  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      if (search && !matches(a.name, search) && !matches(a.studentId, search) && !matches(a.department, search)) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false;
      if (trackFilter && a.track !== trackFilter) return false;
      if (gradeFilter && a.grade !== Number(gradeFilter)) return false;
      return true;
    });
  }, [applicants, search, statusFilter, trackFilter, gradeFilter]);

  // Sorted rows
  const sorted = useSortedRows(filtered, sort, {
    docScore: (r) => r.docScore,
    interviewScore: (r) => r.interviewScore ?? -1,
    submittedAt: (r) => r.submittedAt,
    name: (r) => r.name,
  });

  // Paginated
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // CSV export
  const handleExportCSV = () => {
    toast.success('CSV 파일이 다운로드되었습니다.');
  };

  // Bulk actions
  const handleBulkStatus = (status) => {
    dispatch({ type: 'setApplicantStatus', ids: selected, status });
    toast.success(`${selected.length}명의 상태가 변경되었습니다.`);
    setSelected([]);
  };

  const handleBulkAssign = () => {
    setAssignModalOpen(true);
  };

  const doAssign = () => {
    if (!assignSession || !assignSlot) {
      toast.error('세션과 슬롯을 선택해 주세요.');
      return;
    }
    selected.forEach((id) => {
      dispatch({ type: 'assignApplicantToSlot', sessionId: assignSession, slotId: assignSlot, applicantId: id });
    });
    toast.success(`${selected.length}명이 면접에 배정되었습니다.`);
    setSelected([]);
    setAssignModalOpen(false);
    setAssignSession('');
    setAssignSlot('');
  };

  const selectedSession = state.sessions.find((s) => s.id === assignSession);

  const columns = [
    {
      key: 'name',
      header: '이름',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar emoji={row.avatar} name={row.name} size="sm" />
          <div className="min-w-0">
            <span className="font-semibold text-ink">{row.name}</span>
          </div>
          <button
            type="button"
            aria-label={row.starred ? '별표 해제' : '별표'}
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'toggleApplicantStar', id: row.id }); }}
            className="shrink-0 text-ink-4 hover:text-primary"
          >
            {row.starred ? <Star className="h-3.5 w-3.5 fill-primary text-primary" /> : <StarOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      ),
    },
    ...(visibleCols.studentId ? [{
      key: 'studentId',
      header: '학번',
      sortable: true,
      render: (row) => <span className="text-ink-2 text-xs tabular-nums">{row.studentId}</span>,
    }] : []),
    ...(visibleCols.dept ? [{
      key: 'department',
      header: '학과·학년',
      render: (row) => <span className="text-xs text-ink-2">{row.department} {row.grade}학년</span>,
    }] : []),
    ...(visibleCols.track ? [{
      key: 'track',
      header: '트랙',
      render: (row) => <Badge tone="primary">{row.trackLabel}</Badge>,
    }] : []),
    ...(visibleCols.docScore ? [{
      key: 'docScore',
      header: '서류점수',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <Progress value={row.docScore} max={100} size="sm" className="flex-1" />
          <span className="text-xs font-semibold tabular-nums text-ink-2">{row.docScore}</span>
        </div>
      ),
    }] : []),
    ...(visibleCols.interviewScore ? [{
      key: 'interviewScore',
      header: '면접점수',
      sortable: true,
      render: (row) => row.interviewScore != null
        ? <span className="text-xs font-semibold tabular-nums">{row.interviewScore}</span>
        : <span className="text-xs text-ink-4">—</span>,
    }] : []),
    ...(visibleCols.status ? [{
      key: 'status',
      header: '상태',
      render: (row) => <Badge tone={row.tone}>{row.statusLabel}</Badge>,
    }] : []),
    ...(visibleCols.submittedAt ? [{
      key: 'submittedAt',
      header: '제출시각',
      sortable: true,
      render: (row) => <span className="text-xs text-ink-3">{formatDateTime(row.submittedAt)}</span>,
    }] : []),
    ...(visibleCols.memoCount ? [{
      key: 'memoCount',
      header: '메모',
      align: 'center',
      render: (row) => row.memoCount > 0 ? <span className="text-xs font-semibold text-primary">{row.memoCount}</span> : <span className="text-xs text-ink-4">0</span>,
    }] : []),
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            align="right"
            trigger={<button type="button" aria-label="액션" className="p-1 rounded hover:bg-line/20"><MoreHorizontal className="h-4 w-4 text-ink-3" /></button>}
            items={[
              { key: 'detail', label: '상세 보기', onClick: () => navigate(`/admin/applicants/${row.id}`) },
              { key: 'pass', label: '서류 합격', onClick: () => { dispatch({ type: 'setApplicantStatus', ids: [row.id], status: 'docPass' }); toast.success('서류 합격 처리되었습니다.'); } },
              { key: 'fail', label: '불합격', onClick: () => { dispatch({ type: 'setApplicantStatus', ids: [row.id], status: 'docFail' }); toast.success('불합격 처리되었습니다.'); } },
              { divider: true },
              { key: 'memo', label: '메모 추가', onClick: () => navigate(`/admin/applicants/${row.id}`) },
            ]}
          />
        </div>
      ),
    },
  ];

  // Compute additional stats for header
  const reviewingCount = applicants.filter((a) => a.status === 'reviewing').length;
  const interviewPendCount = applicants.filter((a) => a.status === 'interviewScheduled').length;

  return (
    <AdminShell title="지원자 관리" subtitle={`총 ${applicants.length}명`}>
      {/* Header Summary Stats */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-primary p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-[-16px] top-[-16px] h-[128px] w-[128px] rounded-full bg-white/10 blur-[20px]" />
          <p className="text-sm text-white/80 uppercase tracking-wider mb-1">총 지원자</p>
          <p className="text-4xl font-light">{applicants.length}</p>
        </div>
        <div className="rounded-xl border border-line/30 bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-3 uppercase">검토 대기</p>
          <p className="text-2xl text-primary font-semibold mt-1">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-line/30 bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-3 uppercase">서류 합격</p>
          <p className="text-2xl text-success-ink font-semibold mt-1">{counts.docPass}</p>
        </div>
        <div className="rounded-xl border border-line/30 bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-3 uppercase">면접 예정</p>
          <p className="text-2xl text-[#4648D4] font-semibold mt-1">{interviewPendCount}</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {SUMMARY_CHIPS.map((chip) => (
          <Chip
            key={chip.key}
            active={activeChip === chip.key}
            count={counts[chip.key]}
            onClick={() => handleChipClick(chip)}
          >
            {chip.label}
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            type="text"
            placeholder="이름, 학번, 학과 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="field pl-9"
          />
        </div>
        <div className="w-[150px] shrink-0">
          <Select
            options={STATUS_OPTIONS}
            placeholder="상태"
            value={statusFilter[0] ?? ''}
            onChange={(e) => { setStatusFilter(e.target.value ? [e.target.value] : []); setActiveChip('all'); setPage(0); }}
            aria-label="상태 필터"
          />
        </div>
        <div className="w-[140px] shrink-0">
          <Select
            options={TRACK_OPTIONS}
            placeholder="트랙"
            value={trackFilter}
            onChange={(e) => { setTrackFilter(e.target.value); setPage(0); }}
            aria-label="트랙 필터"
          />
        </div>
        <div className="w-[120px] shrink-0">
          <Select
            options={GRADE_OPTIONS}
            placeholder="학년"
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(0); }}
            aria-label="학년 필터"
          />
        </div>
        {/* Column toggle */}
        <div className="relative">
          <Button variant="ghost" size="sm" icon={Columns3} onClick={() => setColDropOpen(!colDropOpen)} aria-label="컬럼 표시 토글">
            컬럼
          </Button>
          {colDropOpen && (
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-line/40 bg-surface py-2 shadow-xl">
              {Object.entries(visibleCols).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-tint-100">
                  <input type="checkbox" checked={val} onChange={() => setVisibleCols((v) => ({ ...v, [key]: !v[key] }))} className="accent-[#0058BE]" />
                  {key === 'studentId' ? '학번' : key === 'dept' ? '학과·학년' : key === 'track' ? '트랙' : key === 'docScore' ? '서류점수' : key === 'interviewScore' ? '면접점수' : key === 'status' ? '상태' : key === 'submittedAt' ? '제출시각' : '메모'}
                </label>
              ))}
              <button type="button" onClick={() => setColDropOpen(false)} className="mt-1 w-full px-3 py-1.5 text-xs text-primary font-semibold text-left hover:bg-tint-100">닫기</button>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>CSV</Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r.id}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(row) => navigate(`/admin/applicants/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        emptyMessage="조건에 맞는 지원자가 없습니다."
        dense
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-3 tracking-wide">
            총 {sorted.length}명의 지원자 중 {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} 표시 중
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-tint-100 disabled:opacity-30"
              aria-label="이전 페이지"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                  page === i ? 'bg-primary text-white' : 'text-ink-3 hover:bg-tint-100'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-tint-100 disabled:opacity-30"
              aria-label="다음 페이지"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-select action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
          <div className="flex items-center gap-6 rounded-2xl bg-navy px-6 py-4 shadow-float">
            <div className="flex items-center gap-3 border-r border-white/20 pr-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md">{selected.length}</span>
              <span className="text-sm text-[#EAF1FF]">{selected.length}명 선택</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="white" size="sm" onClick={() => handleBulkStatus('docPass')}>서류 합격</Button>
              <Button variant="white" size="sm" onClick={() => handleBulkStatus('docFail')}>불합격</Button>
              <Button variant="white" size="sm" onClick={() => handleBulkStatus('reviewing')}>보류</Button>
              <Button variant="white" size="sm" onClick={handleBulkAssign} icon={CalendarDays}>면접 배정</Button>
              <span className="mx-1 h-6 w-px bg-white/20" />
              <Button variant="white" size="sm" onClick={handleExportCSV} icon={Download}>CSV 내보내기</Button>
            </div>
            <button
              type="button"
              onClick={() => setSelected([])}
              aria-label="선택 해제"
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-[#EAF1FF] hover:text-white hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="면접 배정"
        desc={`${selected.length}명을 면접 슬롯에 배정합니다.`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" block onClick={() => setAssignModalOpen(false)}>취소</Button>
            <Button variant="primary" size="md" block onClick={doAssign}>배정하기</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="면접 세션"
            required
            options={state.sessions.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="세션 선택"
            value={assignSession}
            onChange={(e) => { setAssignSession(e.target.value); setAssignSlot(''); }}
          />
          {selectedSession && (
            <Select
              label="슬롯"
              required
              options={selectedSession.slots.map((sl) => ({
                value: sl.id,
                label: `${sl.start} ~ ${sl.end} (${sl.booked}/${sl.capacity})`,
              }))}
              placeholder="슬롯 선택"
              value={assignSlot}
              onChange={(e) => setAssignSlot(e.target.value)}
            />
          )}
        </div>
      </Modal>

      {confirmNode}
    </AdminShell>
  );
}
