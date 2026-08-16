import React from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export function LoadingScreen() {
  return <main className="screen centered" aria-busy="true"><div className="spinner" /><p>불러오는 중이에요</p></main>;
}

export function RequireVerified({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user?.emailVerified) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export function AppHeader({ title = 'HSU HUB', back = false }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return <header className="product-header">
    {back ? <button className="icon-button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>←</button> : <Link className="wordmark" to={user ? '/clubs' : '/'}>{title}</Link>}
    {back && <strong>{title}</strong>}
    {user ? <button className="text-button" onClick={async () => { await logout(); navigate('/'); }}>로그아웃</button> : <span />}
  </header>;
}

export function AsyncState({ loading, error, empty, children, onRetry }) {
  if (loading) return <LoadingScreen />;
  if (error) return <main className="screen centered"><div className="empty-mark">!</div><h1>불러오지 못했어요</h1><p>{error}</p>{onRetry && <button className="primary-button compact" onClick={onRetry}>다시 시도</button>}</main>;
  if (empty) return <div className="empty-card"><span>○</span><strong>아직 표시할 내용이 없어요</strong><p>새로운 소식이 등록되면 이곳에 나타납니다.</p></div>;
  return children;
}

export function NotFound() {
  return <main className="screen centered"><div className="empty-mark">404</div><h1>페이지를 찾을 수 없어요</h1><p>주소가 잘못되었거나 더 이상 제공하지 않는 화면이에요.</p><Link className="primary-button compact" to="/">홈으로 돌아가기</Link></main>;
}
