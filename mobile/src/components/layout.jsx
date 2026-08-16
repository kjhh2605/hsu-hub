import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { IconButton } from './ui.jsx';
import { Bell, ChevronLeft, Compass, FileText, Logo, User } from './icons.jsx';

/* ── 상단바 ───────────────────────────────── */
export function TopBar({ title, over, back, right, brand }) {
  const nav = useNavigate();
  return (
    <header className="topbar">
      {back ? (
        <IconButton label="뒤로" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>
          <ChevronLeft />
        </IconButton>
      ) : (
        <span style={{ width: 8 }} />
      )}

      {brand ? (
        <div className="row g8 grow">
          <Logo size={30} />
          <span className="topbar-title">CampusConnect</span>
        </div>
      ) : (
        <div className="col grow" style={{ minWidth: 0 }}>
          {over && <span className="topbar-over">{over}</span>}
          <span className="topbar-title clamp1">{title}</span>
        </div>
      )}

      <div className="row g4 shrink0">{right}</div>
    </header>
  );
}

/* ── 하단 탭 ───────────────────────────────── */
const TABS = [
  { to: '/explore', label: '탐색', Icon: Compass },
  { to: '/applications', label: '내 지원', Icon: FileText },
  { to: '/notifications', label: '알림', Icon: Bell },
  { to: '/profile', label: '프로필', Icon: User },
];

export function BottomNav() {
  const { sel } = useApp();
  const unread = sel.unreadCount();
  return (
    <nav className="bottomnav" aria-label="주요 메뉴">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `navitem${isActive ? ' navitem--on' : ''}`}
        >
          <Icon size={20} />
          <span className="navitem-label">{label}</span>
          {to === '/notifications' && unread > 0 && (
            <span className="navitem-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── 화면 컨테이너 ─────────────────────────── */
export function Screen({ children, className = '', pad = true }) {
  return (
    <main className={`screen ${pad ? 'screen-pad' : ''} ${className}`.trim()}>
      {children}
      <div className="screen-bottom-space" />
    </main>
  );
}

/* ── 라우트 가드 ───────────────────────────── */
export function RequireAuth({ children }) {
  const { state, actions } = useApp();
  const loc = useLocation();

  if (!state.auth.loggedIn) {
    // 로그인 후 원래 가려던 곳으로 복귀 (Figma: "로그인 후 이전 페이지로 자동 연결")
    if (state.auth.redirectTo !== loc.pathname + loc.search) {
      actions.setRedirect(loc.pathname + loc.search);
    }
    return <Navigate to="/login" replace />;
  }
  if (!state.user.profileComplete && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { state } = useApp();
  if (state.user.role !== 'admin') return <Navigate to="/profile" replace />;
  return children;
}
