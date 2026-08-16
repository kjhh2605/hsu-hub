import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileClock, CalendarCheck, TrendingUp, Plus,
  CheckCircle2, CalendarPlus, PencilLine, BellRing, MessageSquare,
  ExternalLink, Check, FileText, Mail, Bell, Megaphone,
  UserCheck, Calendar,
} from 'lucide-react';
import { AdminShell, KpiCard } from '@/components/layout/AdminShell';
import {
  Button, Card, Panel, SectionTitle, Badge, Progress, SegmentedControl,
  BarChart, DonutChart, FunnelChart, DataTable, Divider, cx,
} from '@/components/ui';
import { useStore, useToast } from '@/store/AppStore';
import { formatDate, daysUntil } from '@/lib/utils';

const ICON_MAP = { Users, FileClock, CalendarCheck, TrendingUp };
const ACTIVITY_ICONS = { CheckCircle2, CalendarPlus, PencilLine, BellRing, MessageSquare };

const NAV_MAP = {
  applicants: '/admin/applicants',
  unreviewed: '/admin/applicants',
  interviewBooked: '/admin/interviews',
  competition: '/admin/recruitments',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useStore();
  const toast = useToast();
  const { dashboard, applicants, recruitmentDraft, recruitments, sessions, notifications } = state;

  const [period, setPeriod] = useState('7d');
  const [todoState, setTodoState] = useState(() => {
    const map = {};
    dashboard.todos.forEach((t) => { map[t.id] = t.done; });
    return map;
  });

  // Period-sliced daily applications
  const dailyData = (() => {
    const d = dashboard.dailyApplications;
    if (period === '7d') return d.slice(-7);
    if (period === '14d') return d.slice(-14);
    return d;
  })();

  // Pending applicants table
  const pending = applicants.filter((a) => a.status === 'pending').slice(0, 5);

  // Recruitment stages timeline
  const stages = recruitmentDraft.stages;

  // Computed KPI values from state.applicants
  const computedKpis = useMemo(() => {
    const total = applicants.length;
    const pendingCount = applicants.filter((a) => a.status === 'pending').length;
    const interviewScheduled = applicants.filter((a) => a.status === 'interviewScheduled' || a.status === 'interviewDone').length;
    const totalSlots = sessions.reduce((acc, s) => acc + s.slots.length, 0);
    return { total, pendingCount, interviewScheduled, totalSlots };
  }, [applicants, sessions]);

  // Active recruitment for the "모집 진행 중" card
  const activeRecruitment = useMemo(() => {
    return recruitments.find((r) => r.status === 'open');
  }, [recruitments]);

  // Unread notifications
  const unreadNotifications = useMemo(() => {
    return (notifications || []).filter((n) => !n.read).slice(0, 3);
  }, [notifications]);

  const toggleTodo = (id) => {
    setTodoState((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success('완료 처리되었습니다.');
  };

  return (
    <AdminShell
      title="대시보드"
      subtitle={`${dashboard.clubName} · ${dashboard.semester}`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" icon={FileText} onClick={() => toast.success('보고서가 준비되었습니다.')}>
            보고서 내보내기
          </Button>
          <Button variant="primary" size="md" icon={Plus} to="/admin/recruitments/new/page">
            모집 공고 생성
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1080px] space-y-6">
        {/* KPI Grid - computed from state */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="총 지원자"
            value={computedKpis.total}
            delta={dashboard.kpis[0]?.delta}
            deltaLabel="전분기 대비"
            icon={Users}
            tone="primary"
            onClick={() => navigate('/admin/applicants')}
          />
          <KpiCard
            label="미검토 지원서"
            value={computedKpis.pendingCount}
            delta={null}
            deltaLabel="조치 필요"
            icon={FileClock}
            tone="amber"
            onClick={() => navigate('/admin/applicants')}
          />
          <KpiCard
            label="면접 예약"
            value={computedKpis.interviewScheduled}
            suffix={`/ ${computedKpis.totalSlots}`}
            delta={dashboard.kpis[2]?.delta}
            deltaLabel="완료율"
            icon={CalendarCheck}
            tone="mint"
            onClick={() => navigate('/admin/interviews')}
          />
          <KpiCard
            label="경쟁률"
            value={dashboard.kpis[3]?.value}
            suffix={dashboard.kpis[3]?.suffix}
            delta={dashboard.kpis[3]?.delta}
            deltaLabel={dashboard.kpis[3]?.deltaLabel}
            icon={TrendingUp}
            tone="slate"
            onClick={() => navigate('/admin/recruitments')}
          />
        </div>

        {/* Active Recruitment Status (from Figma Korean frame) */}
        {activeRecruitment && (
          <Panel className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex rounded-xl bg-primary p-3">
                  <Megaphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">모집 진행 중</p>
                  <p className="mt-0.5 text-xs font-semibold text-ink-3">
                    마감까지 {Math.max(0, daysUntil(activeRecruitment.closeAt))}일 남음
                  </p>
                </div>
              </div>
              <Button variant="tint" size="sm" onClick={() => navigate('/admin/recruitments')}>
                상태 관리
              </Button>
            </div>
          </Panel>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/admin/recruitments/new/page')}
            className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">모집 만들기</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/applicants')}
            className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-success-ink">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">지원자 평가 계속하기</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/interviews')}
            className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Calendar className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">면접 일정 관리</span>
          </button>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-8">
            {/* Recruitment Progress Panel */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">모집 단계 현황</h3>
                  <p className="mt-1 text-sm text-ink-3">현재 서류 평가 단계가 진행 중입니다.</p>
                </div>
                <Badge tone="primary">Stage 2 of 4</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 py-4">
                {['모집 공고', '서류 평가', '면접 전형', '최종 발표'].map((label, i) => {
                  const isCompleted = i < 1;
                  const isActive = i === 1;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={cx(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                          isCompleted ? 'bg-primary text-white shadow-primary' :
                          isActive ? 'bg-primary text-white ring-4 ring-primary/10 shadow-primary' :
                          'bg-tint-200 text-ink-3',
                        )}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cx('text-xs font-semibold', isActive ? 'text-primary' : isCompleted ? 'text-ink' : 'text-ink-3')}>
                        {label}
                      </span>
                      {i < 3 && <span className="mx-2 h-0.5 w-6 bg-line/50" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-6 rounded-xl bg-tint-100/30 p-5">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">진행률</span>
                    <span className="text-sm font-semibold text-primary">35%</span>
                  </div>
                  <Progress value={35} tone="primary" />
                </div>
                <Divider vertical className="h-12" />
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Remaining Tasks</p>
                  <p className="mt-1 text-lg font-bold text-ink">{computedKpis.pendingCount}건</p>
                </div>
              </div>
            </Panel>

            {/* Recent Applicants Table */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-ink">최근 지원자</h3>
                <Button variant="ghost" size="sm" iconRight={ExternalLink} to="/admin/applicants">
                  전체 지원자 보기
                </Button>
              </div>
              <DataTable
                dense
                columns={[
                  { key: 'name', header: '지원자', render: (r) => (
                    <div className="flex items-center gap-2">
                      <span className="text-base">{r.avatar}</span>
                      <div>
                        <span className="font-semibold text-ink">{r.name}</span>
                        <p className="text-[11px] text-ink-3">{r.grade}학년</p>
                      </div>
                    </div>
                  )},
                  { key: 'department', header: '학과' },
                  { key: 'status', header: '상태', render: (r) => <Badge tone={r.tone}>{r.statusLabel}</Badge> },
                  { key: 'submittedAt', header: '시간', render: (r) => formatDate(r.submittedAt) },
                ]}
                rows={pending}
                onRowClick={(row) => navigate(`/admin/applicants/${row.id}`)}
              />
            </Panel>

            {/* 모집 퍼널 현황 */}
            <Panel className="p-6">
              <h3 className="mb-6 text-xl font-bold text-ink">모집 퍼널 현황</h3>
              <FunnelChart data={dashboard.funnel} />
            </Panel>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-4">
            {/* 도움이 필요하신가요? Help Card */}
            <div className="rounded-3xl bg-primary p-8 text-white shadow-primary">
              <h3 className="text-lg font-semibold">도움이 필요하신가요?</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                새로운 AI 기반 평가 도구를 사용하여 서류 심사 프로세스를 자동화해보세요.
              </p>
              <button
                type="button"
                onClick={() => toast.success('기능 안내 페이지로 이동합니다.')}
                className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-white/90"
              >
                기능 살펴보기
              </button>
            </div>

            {/* 시스템 알림 */}
            <Panel className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">시스템 알림</h3>
                {unreadNotifications.length > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              <div className="space-y-5">
                {unreadNotifications.length > 0 ? unreadNotifications.map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-danger" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-ink">{n.title || '새 알림'}</p>
                      <p className="text-xs leading-relaxed text-ink-3">{n.body || n.message || ''}</p>
                      {n.actionLabel && (
                        <button
                          type="button"
                          onClick={() => { navigate(n.to || '/admin'); }}
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          지금 해결하기
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-danger" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-ink">면접 일정 충돌 감지</p>
                        <p className="text-xs leading-relaxed text-ink-3">금요일 오후 3:00 면접이 A강의실 예약과 겹칩니다.</p>
                        <button type="button" onClick={() => navigate('/admin/interviews')} className="text-[11px] font-medium text-primary hover:underline">지금 해결하기</button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-ink">신규 지원서 접수</p>
                        <p className="text-xs leading-relaxed text-ink-3">장영우 님이 개발자 직군을 위한 특화 포트폴리오를 제출했습니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-success-ink" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-ink">주간 요약 보고서 준비됨</p>
                        <p className="text-xs leading-relaxed text-ink-3">3주차 모집 현황 개요가 검토를 위해 준비되었습니다.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            {/* 빠른 링크 Quick Links */}
            <div className="rounded-3xl bg-tint-200 p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">빠른 링크</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '양식 수정', icon: FileText, to: '/admin/recruitments/new/page' },
                  { label: '단체 메일', icon: Mail, to: '/admin/settings' },
                  { label: '공지 설정', icon: Bell, to: '/admin/settings' },
                  { label: '홍보 키트', icon: Megaphone, to: '/admin/settings' },
                ].map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => navigate(link.to)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 transition-all hover:shadow-md"
                  >
                    <link.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm text-ink">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Applications BarChart */}
            <Panel className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-ink">일별 지원자 추이</h3>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: '7d', label: '7일' },
                    { value: '14d', label: '14일' },
                    { value: 'all', label: '전체' },
                  ]}
                  value={period}
                  onChange={setPeriod}
                  className="w-[200px]"
                />
              </div>
              <BarChart data={dailyData} height={140} className="mt-2" />
            </Panel>

            {/* Track Distribution */}
            <Panel className="p-5">
              <h3 className="mb-4 text-sm font-bold text-ink">트랙 분포</h3>
              <div className="flex items-center justify-center">
                <DonutChart data={dashboard.trackDistribution} size={140} thickness={18} />
              </div>
              <div className="mt-4 space-y-2">
                {dashboard.trackDistribution.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.tone }} />
                      <span className="text-xs font-medium text-ink-2">{t.label}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-ink">{t.value}명</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Todos */}
            <Panel className="p-5">
              <h3 className="mb-3 text-sm font-bold text-ink">오늘의 할 일</h3>
              <div className="space-y-2">
                {dashboard.todos.map((todo) => {
                  const done = todoState[todo.id];
                  return (
                    <div key={todo.id} className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={done ? '완료됨' : '체크'}
                        onClick={() => toggleTodo(todo.id)}
                        className={cx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          done ? 'border-primary bg-primary text-white' : 'border-line hover:border-primary/50',
                        )}
                      >
                        {done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(todo.to)}
                        className={cx(
                          'min-w-0 flex-1 text-left text-[13px] font-medium transition-colors hover:text-primary',
                          done ? 'text-ink-3 line-through' : 'text-ink',
                        )}
                      >
                        {todo.label}
                      </button>
                      <span className="shrink-0 text-[11px] text-ink-4">{todo.due}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Activity Timeline */}
            <Panel className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">최근 활동</h3>
                <button
                  type="button"
                  onClick={() => navigate('/admin/settings')}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  모두 보기
                </button>
              </div>
              <div className="space-y-3">
                {dashboard.activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.icon] ?? CheckCircle2;
                  return (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint-200 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-ink">
                          <span className="font-semibold">{a.who}</span>{' '}
                          <span className="text-ink-2">{a.what}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-4">{a.at}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 시스템 상태 */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-tint-100/20 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-ink-3">시스템 상태</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-ink" />
                    <span className="text-[11px] font-semibold text-success-ink">운영 중 (정상)</span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
