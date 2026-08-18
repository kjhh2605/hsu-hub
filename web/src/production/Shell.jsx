import React from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, FileText, LogOut, Menu, Users } from 'lucide-react';
import { useOperator } from './OperatorContext';

export function RequireOperator({ children }) {
  const { user, clubs, loading } = useOperator(); const location = useLocation();
  if (loading) return <div className="prod-loading"><span /><p>운영진 권한을 확인하고 있습니다</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!clubs.length) return <div className="prod-empty full"><h1>운영할 수 있는 동아리가 없습니다</h1><p>서비스 관리자에게 운영진 매핑을 요청해 주세요.</p></div>;
  return children;
}

const nav = [
  { to: '/admin/club', label: '동아리 프로필', icon: Building2 },
  { to: '/admin/recruitments', label: '모집 관리', icon: FileText },
  { to: '/admin/applicants', label: '지원자', icon: Users },
];

export function AdminShell() {
  const { clubs, clubId, setClubId, selectedClub, logout } = useOperator(); const navigate = useNavigate();
  return <div className="prod-shell"><aside className="prod-sidebar"><Link className="prod-brand" to="/admin/club"><span>H</span><div><strong>HSU HUB</strong><small>OPERATOR</small></div></Link><nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} />{label}</NavLink>)}</nav><div className="sidebar-foot"><p>한성대학교 동아리 허브</p><button onClick={async () => { await logout(); navigate('/login'); }}><LogOut size={16} /> 로그아웃</button></div></aside><section className="prod-main"><header className="prod-topbar"><div><Menu size={18} /><span>현재 운영 동아리</span></div>{clubs.length > 1 ? <label className="club-select"><span className="sr-only">동아리 선택</span><select value={clubId ?? ''} onChange={(event) => setClubId(event.target.value)}>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label> : <strong>{selectedClub?.name}</strong>}</header><Outlet /></section></div>;
}

export function PageHeader({ eyebrow, title, description, action }) { return <header className="page-header"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</header>; }
export function ErrorNotice({ children }) { return children ? <p className="prod-error" role="alert">{children}</p> : null; }
export function NotFound() { return <main className="prod-not-found"><span>404</span><h1>페이지를 찾을 수 없습니다</h1><p>주소가 잘못되었거나 MVP에서 제공하지 않는 화면입니다.</p><Link className="prod-button primary" to="/admin/club">동아리 프로필로 이동</Link></main>; }
