import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal, Users as UsersIcon,
  Pencil, Copy, Trash2, ToggleLeft, Eye, Download, FileText, Clock, CheckCircle,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import {
  Button, Panel, Badge, DataTable, Tabs, SegmentedControl, EmptyState,
  Dropdown, ConfirmDialog, Card, cx,
} from '@/components/ui';
import { TextInput } from '@/components/ui/Form';
import { useStore, useToast } from '@/store/AppStore';
import { getClub } from '@/data/clubs';
import { formatDate, matches, pct } from '@/lib/utils';

const STATUS_MAP = {
  open: { label: '접수중', tone: 'mint' },
  screening: { label: '심사중', tone: 'primary' },
  closed: { label: '마감', tone: 'danger' },
  scheduled: { label: '게시 예정', tone: 'amber' },
  draft: { label: '임시저장', tone: 'slate' },
};

export default function RecruitmentList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const recruitments = state.recruitments;

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Stats - matching Figma metrics
  const stats = useMemo(() => {
    const all = recruitments.length;
    const open = recruitments.filter((r) => r.status === 'open').length;
    const screening = recruitments.filter((r) => r.status === 'screening').length;
    const scheduled = recruitments.filter((r) => r.status === 'scheduled').length;
    const closed = recruitments.filter((r) => r.status === 'closed').length;
    const draft = recruitments.filter((r) => r.status === 'draft').length;
    const totalApplicants = recruitments.reduce((acc, r) => acc + (r.applicantCount || 0), 0);
    // 서류 검토 진행률: reviewed vs total (approx from applicant data)
    const applicants = state.applicants || [];
    const reviewed = applicants.filter((a) => a.status !== 'pending').length;
    const reviewRate = applicants.length > 0 ? Math.round((reviewed / applicants.length) * 100) : 0;
    // 평균 전형 소요 기간: 첫 전형 시작 ~ 마지막 전형 종료 (일)
    const durations = recruitments
      .map((r) => {
        const from = r.stages?.[0]?.from;
        const to = r.stages?.[r.stages.length - 1]?.to;
        if (!from || !to) return null;
        return Math.round((new Date(to) - new Date(from)) / 86400000);
      })
      .filter((d) => d != null && d > 0);
    const avgDurationDays = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    return {
      all,
      open,
      screening,
      scheduled,
      closed,
      draft,
      totalApplicants,
      reviewRate,
      avgDurationDays,
    };
  }, [recruitments, state.applicants]);

  // Filtered
  const filtered = useMemo(() => {
    let list = recruitments;
    if (tab !== 'all') list = list.filter((r) => r.status === tab);
    if (query) list = list.filter((r) => matches(r.title, query) || matches(getClub(r.clubId)?.name, query));
    return list;
  }, [recruitments, tab, query]);

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'deleteRecruitment', id: deleteTarget });
      toast.success('모집이 삭제되었습니다.');
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = (id) => {
    dispatch({ type: 'duplicateRecruitment', id });
    toast.success('모집이 복제되었습니다.');
  };

  const handleStatusChange = (id, status) => {
    dispatch({ type: 'setRecruitmentStatus', id, status });
    toast.success('상태가 변경되었습니다.');
  };

  const columns = [
    {
      key: 'title',
      header: '모집명',
      render: (r) => {
        const club = getClub(r.clubId);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
            <p className="mt-0.5 text-[11px] text-ink-3">{club?.name}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '90px',
      render: (r) => {
        const s = STATUS_MAP[r.status] ?? STATUS_MAP.draft;
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: 'period',
      header: '기간',
      render: (r) => (
        <span className="text-xs text-ink-2">
          {formatDate(r.openAt)} ~ {formatDate(r.closeAt)}
        </span>
      ),
    },
    { key: 'quota', header: '정원', align: 'center', render: (r) => <span className="tabular-nums">{r.quota}명</span> },
    {
      key: 'applicantCount',
      header: '지원자',
      align: 'center',
      sortable: true,
      render: (r) => (
        <span className="tabular-nums">
          {r.applicantCount}명
          <span className="ml-1 text-[11px] text-ink-3">({(r.applicantCount / (r.quota || 1)).toFixed(1)}:1)</span>
        </span>
      ),
    },
    {
      key: 'viewCount',
      header: '조회수',
      align: 'right',
      sortable: true,
      render: (r) => <span className="tabular-nums text-ink-2">{r.viewCount.toLocaleString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '48px',
      align: 'center',
      render: (r) => (
        <Dropdown
          align="right"
          trigger={
            <button type="button" aria-label="더보기" className="rounded-full p-1 text-ink-3 hover:bg-line/20">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { key: 'view', label: '지원자 보기', icon: UsersIcon, onClick: () => navigate('/admin/applicants') },
            { key: 'edit', label: '편집', icon: Pencil, onClick: () => navigate('/admin/recruitments/new/page') },
            { divider: true },
            { key: 'open', label: '상태: 접수중', icon: ToggleLeft, onClick: () => handleStatusChange(r.id, 'open') },
            { key: 'screening', label: '상태: 심사중', icon: ToggleLeft, onClick: () => handleStatusChange(r.id, 'screening') },
            { key: 'close', label: '상태: 마감', icon: ToggleLeft, onClick: () => handleStatusChange(r.id, 'closed') },
            { divider: true },
            { key: 'duplicate', label: '복제', icon: Copy, onClick: () => handleDuplicate(r.id) },
            { key: 'delete', label: '삭제', icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(r.id) },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminShell
      title="모집 공고 관리"
      subtitle={`총 ${stats.all}개 모집`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" icon={Download} onClick={() => toast.success('데이터를 내보냈습니다.')}>
            데이터 내보내기
          </Button>
          <Button variant="primary" size="md" icon={Plus} to="/admin/recruitments/new/page">
            새 모집 공고 만들기
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1080px] space-y-5">
        {/* Stats - Figma Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Panel className="space-y-2 rounded-2xl border border-line/30 p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </span>
              <Badge tone="mint">접수중 {stats.open}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{stats.open + stats.screening}</p>
            <p className="text-sm text-ink-3">진행 중인 모집</p>
          </Panel>
          <Panel className="space-y-2 rounded-2xl border border-line/30 p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex rounded-lg bg-violet-100 p-2">
                <UsersIcon className="h-5 w-5 text-violet-600" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{stats.totalApplicants}</p>
            <p className="text-sm text-ink-3">전체 누적 지원자</p>
          </Panel>
          <Panel className="space-y-2 rounded-2xl border border-line/30 p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex rounded-lg bg-mint/30 p-2">
                <CheckCircle className="h-5 w-5 text-success-ink" />
              </span>
              <span className="text-xs font-semibold text-ink-3">{stats.reviewRate}% 완료</span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{stats.reviewRate}%</p>
            <p className="text-sm text-ink-3">서류 검토 진행률</p>
          </Panel>
          <div className="relative overflow-hidden rounded-2xl bg-grad-primary p-5 text-white shadow-primary">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{stats.avgDurationDays}일</p>
            <p className="text-sm text-white/80">평균 전형 소요 기간</p>
          </div>
        </div>

        {/* Search + Tabs + View toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[240px] shrink-0">
              <TextInput
                placeholder="모집명 검색..."
                prefix={<Search className="h-4 w-4" />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="모집명 검색"
              />
            </div>
            <Tabs
              tabs={[
                { value: 'all', label: '전체보기', count: stats.all },
                { value: 'open', label: '접수중', count: stats.open },
                { value: 'screening', label: '심사중', count: stats.screening },
                { value: 'scheduled', label: '게시 예정', count: stats.scheduled },
                { value: 'closed', label: '마감', count: stats.closed },
                { value: 'draft', label: '임시저장', count: stats.draft },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="테이블 보기"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className={cx('rounded-lg p-2', viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-ink-3 hover:bg-line/20')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="카드 보기"
              aria-pressed={viewMode === 'card'}
              onClick={() => setViewMode('card')}
              className={cx('rounded-lg p-2', viewMode === 'card' ? 'bg-primary/10 text-primary' : 'text-ink-3 hover:bg-line/20')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="모집이 없습니다"
            desc={query ? '검색 조건을 변경해 보세요.' : '새 모집을 만들어 시작해 보세요.'}
            action={
              <Button variant="primary" size="md" icon={Plus} to="/admin/recruitments/new/page">
                새 모집 만들기
              </Button>
            }
          />
        ) : viewMode === 'table' ? (
          <DataTable columns={columns} rows={filtered} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const club = getClub(r.clubId);
              const s = STATUS_MAP[r.status] ?? STATUS_MAP.draft;
              return (
                <Card
                  key={r.id}
                  className="cursor-pointer p-5 transition-shadow hover:shadow-lg"
                  onClick={() => navigate('/admin/recruitments/new/page')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          aria-label="더보기"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full p-1 text-ink-3 hover:bg-line/20"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                      items={[
                        { key: 'duplicate', label: '복제', icon: Copy, onClick: () => handleDuplicate(r.id) },
                        { key: 'delete', label: '삭제', icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(r.id) },
                      ]}
                    />
                  </div>
                  <h3 className="mt-3 truncate text-sm font-bold text-ink">{r.title}</h3>
                  <p className="mt-1 text-[11px] text-ink-3">{club?.name}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-2">
                    <span>정원 {r.quota}명</span>
                    <span>지원 {r.applicantCount}명</span>
                    <span>조회 {r.viewCount.toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-4">{formatDate(r.openAt)} ~ {formatDate(r.closeAt)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="모집을 삭제하시겠습니까?"
        desc="삭제된 모집은 복구할 수 없으며, 관련 지원 데이터도 함께 삭제됩니다."
        confirmLabel="삭제"
        tone="danger"
      />
    </AdminShell>
  );
}
