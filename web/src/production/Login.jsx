import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOperator } from './OperatorContext';
import { messageOf } from './api';

export default function OperatorLogin() {
  const { user, loading, login } = useOperator(); const navigate = useNavigate(); const location = useLocation(); const [values, setValues] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user) navigate('/admin/club', { replace: true }); }, [loading, user, navigate]);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await login(values); navigate(location.state?.from || '/admin/club', { replace: true }); } catch (reason) { setError(messageOf(reason)); } finally { setBusy(false); } }
  return <main className="operator-login"><section className="login-art"><div className="login-grid" /><span className="prod-brand inverted"><b>H</b><strong>HSU HUB</strong></span><div><p>CLUB OPERATIONS</p><h2>좋은 모집은<br />명확한 흐름에서<br />시작됩니다.</h2><span>동아리 소개부터 지원서 확인까지, 한 곳에서 운영하세요.</span></div><footer>HANSUNG UNIVERSITY · 2026</footer></section><section className="login-panel"><form onSubmit={submit}><p>OPERATOR ACCESS</p><h1>운영진 로그인</h1><span>승인된 동아리 운영진 계정으로 로그인해 주세요.</span><label>학교 이메일<input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} autoComplete="email" /></label><label>비밀번호<input type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} autoComplete="current-password" /></label>{error && <p className="prod-error" role="alert">{error}</p>}<button className="prod-button primary" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button></form></section></main>;
}
