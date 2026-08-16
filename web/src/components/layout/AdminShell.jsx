import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Settings,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { cx, Avatar, Badge, Dropdown, EmptyState } from '@/components/ui';
import { BrandMark } from './BrandMark';
import { useStore, useToast } from '@/store/AppStore';
import { timeAgo } from '@/lib/utils';

export const ADMIN_NAV = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard, to: '/admin' },
  { key: 'recruitments', label: '모집 관리', icon: Megaphone, to: '/admin/recruitments' },
  { key: 'applicants', label: '지원자', icon: Users, to: '/admin/applicants' },
  { key: 'interviews', label: '면접', icon: CalendarDays, to: '/admin/interviews' },
  { key: 'results', label: '결과 발표', icon: Trophy, to: '/admin/results' },
  { key: 'settings', label: '설정', icon: Settings, to: '/admin/settings' },
];

/* ------------------------------------------------------------------ */
/* Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function AdminSidebar() {
  const { state } = useStore();
  const unreviewed = state.applicants.filter((a) => a.status === 'pending').length;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-sidebar flex-col border-r border-line/50 bg-surface shadow-top lg:flex">
      <div className="flex h-20 shrink-0 items-center gap-3 px-6">
        <BrandMark size={32} />
        <span className="text-xl font-bold tracking-tight text-primary">UniClub Admin</span>
      </div>

      <nav aria-label="운영진 메뉴" className="flex-1 overflow-y-auto px-4 pt-4">
        <ul className="space-y-1">
          {ADMIN_NAV.map((n) => (
            <li key={n.key}>
              <NavLink
                to={n.to}
                end={n.to === '/admin'}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white shadow-primary'
                      : 'text-ink-2 hover:bg-tint-100 hover:text-ink',
                  )
                }
              >
                <n.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {n.label}
                {n.key === 'applicants' && unreviewed > 0 ? (
                  <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreviewed}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl bg-tint-100 p-4">
          <p className="text-xs font-bold text-ink">{state.dashboard.clubName}</p>
          <p className="mt-0.5 text-[11px] text-ink-3">{state.dashboard.semester} 모집 진행중</p>
          <div className="mt-3 flex items-center gap-2">
            <Avatar emoji={state.admin.avatar} name={state.admin.name} size="xs" />
            <span className="min-w-0 truncate text-[11px] font-semibold text-ink-2">
              {state.admin.name} · 대표
            </span>
          </div>
        </div>
      </nav>

      <div className="shrink-0 border-t border-line px-4 py-5">
        <NavLink
          to="/screens"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-xs font-bold text-success-ink transition-transform hover:brightness-105 active:scale-[0.985]"
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
          전체 화면 목록
        </NavLink>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Compact nav for narrow viewports                                   */
/* ------------------------------------------------------------------ */

export function AdminCompactNav() {
  return (
    <nav
      aria-label="운영진 메뉴"
      className="sticky top-0 z-40 flex gap-1 overflow-x-auto border-b border-line/40 bg-surface/90 px-3 py-2 no-scrollbar backdrop-blur-xl lg:hidden"
    >
      {ADMIN_NAV.map((n) => (
        <NavLink
          key={n.key}
          to={n.to}
          end={n.to === '/admin'}
          className={({ isActive }) =>
            cx(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors',
              isActive ? 'bg-primary text-white' : 'text-ink-2 hover:bg-tint-100',
            )
          }
        >
          <n.icon className="h-4 w-4" aria-hidden="true" />
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Notification panel (in-console)                                    */
/* ------------------------------------------------------------------ */

const NOTI_TONES = {
  result: 'bg-mint/30 text-success-ink',
  interview: 'bg-primary/10 text-primary',
  reminder: 'bg-warn-soft text-warn',
  system: 'bg-line/25 text-ink-2',
  comment: 'bg-accent-soft text-accent',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();

  const items = state.notifications;
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림${unread ? ` ${unread}건 읽지 않음` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-line/20"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="알림 목록"
          className="absolute right-0 z-50 mt-2 w-[380px] animate-scale-in overflow-hidden rounded-2xl border border-line/40 bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line/30 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
              알림
              {unread > 0 ? <Badge tone="danger">{unread}</Badge> : null}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'readAllNotifications' });
                  toast.success('모든 알림을 읽음으로 처리했습니다.');
                }}
                disabled={unread === 0}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-tint-100 disabled:opacity-40"
              >
                <CheckCheck className="h-3 w-3" aria-hidden="true" />
                모두 읽음
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="알림 닫기"
                className="rounded-full p-1 text-ink-3 hover:bg-line/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <ul className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <li>
                <EmptyState icon={Bell} title="알림이 없습니다" className="py-10" />
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-line/20 last:border-0">
                  <div
                    className={cx(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      n.read ? 'bg-surface' : 'bg-primary/[0.04]',
                    )}
                  >
                    <span
                      className={cx(
                        'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px]',
                        NOTI_TONES[n.type] ?? NOTI_TONES.system,
                      )}
                      aria-hidden="true"
                    >
                      {n.type === 'result' ? '🎉' : n.type === 'interview' ? '📅' : n.type === 'reminder' ? '⏰' : n.type === 'comment' ? '💬' : 'ℹ️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                        {!n.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /> : null}
                        <span className="truncate">{n.title}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-3">{n.body}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-ink-4">{timeAgo(n.createdAt)}</span>
                        {n.consoleTo ? (
                          <button
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'readNotification', id: n.id });
                              setOpen(false);
                              navigate(n.consoleTo);
                            }}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            바로 가기
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!n.read ? (
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'readNotification', id: n.id })}
                          aria-label={`${n.title} 읽음 처리`}
                          className="rounded p-1 text-ink-4 hover:bg-line/20 hover:text-primary"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'deleteNotification', id: n.id });
                          toast.show('알림을 삭제했습니다.');
                        }}
                        aria-label={`${n.title} 삭제`}
                        className="rounded p-1 text-ink-4 hover:bg-danger-soft hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

export function AdminHeader({ title, subtitle, breadcrumb, actions, backTo, compact }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const toast = useToast();

  return (
    <header
      className={cx(
        'sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line/40 bg-bg/80 px-6 backdrop-blur-xl',
        compact ? 'h-16' : 'h-20',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backTo ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="뒤로 가기"
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-line/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          {breadcrumb ? (
            <p className="mb-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              {breadcrumb}
            </p>
          ) : null}
          <h1 className="truncate text-xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-[13px] text-ink-3">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <NotificationBell />
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              aria-label={`${state.admin.name} 계정 메뉴`}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-line/20"
            >
              <Avatar emoji={state.admin.avatar} name={state.admin.name} size="sm" ring />
              <span className="hidden text-sm font-semibold text-ink sm:block">{state.admin.name}</span>
            </button>
          }
          items={[
            { key: 'me', label: '내 계정 설정', icon: Settings, onClick: () => navigate('/admin/settings') },
            { key: 'screens', label: '전체 화면 목록', icon: LayoutGrid, onClick: () => navigate('/screens') },
            { divider: true },
            {
              key: 'out',
              label: '로그아웃',
              icon: LogOut,
              tone: 'danger',
              onClick: () => toast.info('프로토타입에서는 로그아웃이 동작하지 않습니다.'),
            },
          ]}
        />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */

export function AdminShell({
  title,
  subtitle,
  breadcrumb,
  actions,
  backTo,
  compact,
  children,
  footer,
  contentClassName,
}) {
  return (
    <div className="min-h-screen bg-bg lg:pl-sidebar">
      <AdminSidebar />
      <AdminCompactNav />
      <AdminHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb}
        actions={actions}
        backTo={backTo}
        compact={compact}
      />
      <main className={cx('px-6 py-6', contentClassName)}>{children}</main>
      {footer ? (
        <div className="sticky bottom-0 z-30 border-t border-line/40 bg-surface/95 px-6 py-4 backdrop-blur-xl">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                           */
/* ------------------------------------------------------------------ */

export function KpiCard({ label, value, suffix, delta, deltaLabel, icon: Icon, tone = 'primary', onClick }) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    mint: 'bg-mint/30 text-success-ink',
    amber: 'bg-warn-soft text-warn',
    slate: 'bg-line/25 text-ink-2',
    danger: 'bg-danger-soft text-danger',
  };
  const up = (delta ?? 0) >= 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cx(
        'rounded-2xl border border-line/40 bg-surface p-5 shadow-xs transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-3">{label}</span>
        {Icon ? (
          <span className={cx('inline-flex h-9 w-9 items-center justify-center rounded-xl', toneMap[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-ink">{value}</span>
        {suffix ? <span className="text-sm font-semibold text-ink-3">{suffix}</span> : null}
      </p>
      {delta != null ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px]">
          <Badge tone={up ? 'mint' : 'danger'}>
            {up ? '▲' : '▼'} {Math.abs(delta)}
          </Badge>
          <span className="text-ink-4">{deltaLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
