import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, errorMessage } from '../lib/api.js';

const EMAIL_PATTERN = /^[^\s@]+@hansung\.ac\.kr$/i;

function AuthShell({ eyebrow, title, description, children, footer }) {
  return <main className="screen auth-screen"><Link className="wordmark auth-mark" to="/">HSU HUB</Link><section className="auth-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>{children}{footer && <p className="auth-footer">{footer}</p>}</main>;
}

function Field({ label, ...props }) {
  return <label className="field-label"><span>{label}</span><input {...props} /></label>;
}

export function Login() {
  const { login, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.from || '/clubs';
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user?.emailVerified) navigate('/clubs', { replace: true }); }, [user, navigate]);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!EMAIL_PATTERN.test(values.email)) return setError('한성대학교 이메일(@hansung.ac.kr)을 입력해 주세요.');
    setBusy(true);
    try { await login(values); navigate(destination, { replace: true }); } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  }
  return <AuthShell eyebrow="WELCOME BACK" title="다시 만나 반가워요" description={destination !== '/clubs' ? '로그인하면 요청한 화면으로 돌아갑니다.' : '로그인하면 동아리 목록으로 돌아갑니다.'} footer={<>계정이 없나요? <Link to="/signup">회원가입</Link></>}><form className="auth-form" onSubmit={submit}><Field label="학교 이메일" type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="name@hansung.ac.kr" /><Field label="비밀번호" type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button><Link className="inline-link" to="/forgot-password">비밀번호를 잊으셨나요?</Link></form></AuthShell>;
}

export function Signup() {
  const [values, setValues] = useState({ email: '', password: '', confirm: '' });
  const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!EMAIL_PATTERN.test(values.email)) return setError('한성대학교 이메일(@hansung.ac.kr)만 가입할 수 있어요.');
    if (values.password.length < 10) return setError('비밀번호는 10자 이상 입력해 주세요.');
    if (values.password !== values.confirm) return setError('비밀번호가 서로 일치하지 않아요.');
    try { await api.post('/auth/signup', { email: values.email, password: values.password }); setNotice('인증 메일을 보냈어요. 메일의 링크를 열어 가입을 완료해 주세요.'); } catch (reason) { setError(errorMessage(reason)); }
  }
  return <AuthShell eyebrow="JOIN HSU HUB" title="학교 이메일로 시작해요" description="한성대학교 구성원인지 확인한 뒤 안전하게 이용할 수 있어요." footer={<>이미 계정이 있나요? <Link to="/login">로그인</Link></>}><form className="auth-form" onSubmit={submit}><Field label="학교 이메일" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /><Field label="비밀번호 (10자 이상)" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /><Field label="비밀번호 확인" type="password" value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} />{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-notice" role="status">{notice}</p>}<button className="primary-button">인증 메일 받기</button></form></AuthShell>;
}

export function VerifyEmail() {
  const [params] = useSearchParams(); const token = params.get('token');
  const [state, setState] = useState(token ? 'loading' : 'missing'); const [email, setEmail] = useState(''); const [resendError, setResendError] = useState('');
  useEffect(() => { if (token) api.post('/auth/email-verifications/confirm', { token }).then(() => setState('done')).catch(() => setState('error')); }, [token]);
  async function resend(event) { event.preventDefault(); setResendError(''); if (!EMAIL_PATTERN.test(email)) return setResendError('한성대학교 이메일을 입력해 주세요.'); try { await api.post('/auth/email-verifications/resend', { email }); setState('resent'); } catch (reason) { setResendError(errorMessage(reason)); } }
  const canResend = ['missing', 'error', 'resent'].includes(state);
  return <AuthShell eyebrow="EMAIL CHECK" title={state === 'done' ? '이메일 인증이 완료됐어요' : state === 'resent' ? '인증 메일을 다시 보냈어요' : '이메일을 확인하고 있어요'} description={state === 'missing' ? '메일에 포함된 인증 링크로 접속하거나 인증 메일을 다시 받아 보세요.' : state === 'error' ? '인증 링크가 만료됐거나 이미 사용됐어요.' : state === 'resent' ? '가입 여부와 관계없이 안내 가능한 경우 메일이 도착합니다.' : state === 'done' ? '이제 HSU HUB에 로그인할 수 있어요.' : '잠시만 기다려 주세요.'}>{canResend && <form className="auth-form" onSubmit={resend}><Field label="학교 이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />{resendError && <p className="form-error" role="alert">{resendError}</p>}<button className="primary-button">인증 메일 다시 받기</button></form>}<Link className={canResend ? 'inline-link' : 'primary-button'} to="/login">로그인으로 이동</Link></AuthShell>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); if (!EMAIL_PATTERN.test(email)) return setError('한성대학교 이메일을 입력해 주세요.'); try { await api.post('/auth/password-resets/request', { email }); setMessage('가입 여부와 관계없이 안내 가능한 경우 재설정 메일을 보냈어요.'); setError(''); } catch (reason) { setError(errorMessage(reason)); } }
  return <AuthShell eyebrow="PASSWORD" title="비밀번호를 다시 설정해요" description="학교 이메일로 30분 동안 유효한 재설정 링크를 보내드려요."><form className="auth-form" onSubmit={submit}><Field label="학교 이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-notice">{message}</p>}<button className="primary-button">재설정 메일 받기</button></form></AuthShell>;
}

export function ResetPassword() {
  const [params] = useSearchParams(); const token = params.get('token'); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); if (!token) return setError('유효한 재설정 링크가 필요해요.'); if (password.length < 10) return setError('비밀번호는 10자 이상 입력해 주세요.'); try { await api.post('/auth/password-resets/confirm', { token, password }); setMessage('비밀번호를 변경했어요. 새 비밀번호로 로그인해 주세요.'); setError(''); } catch (reason) { setError(errorMessage(reason)); } }
  return <AuthShell eyebrow="NEW PASSWORD" title="새 비밀번호를 입력해요" description="다른 서비스에서 사용하지 않는 10자 이상의 비밀번호를 권장해요."><form className="auth-form" onSubmit={submit}><Field label="새 비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-notice">{message} <Link to="/login">로그인</Link></p>}<button className="primary-button">비밀번호 변경</button></form></AuthShell>;
}
