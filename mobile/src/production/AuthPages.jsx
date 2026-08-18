import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const LOGIN_ERRORS = {
  kakao_cancelled: '카카오 로그인이 취소됐어요. 다시 시도해 주세요.',
  kakao_email_required: '유효하고 인증된 카카오계정 이메일이 필요해요.',
  kakao_login_failed: '카카오 로그인을 완료하지 못했어요. 다시 시도해 주세요.',
};

function safeDestination(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !/[\\\u0000-\u001f\u007f]/.test(value)
    ? value
    : '/clubs';
}

function AuthShell({ eyebrow, title, description, children }) {
  return <main className="screen auth-screen"><Link className="wordmark auth-mark" to="/">HSU HUB</Link><section className="auth-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>{children}</main>;
}

export function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = safeDestination(location.state?.from);
  const errorCode = params.get('error');
  const error = errorCode
    ? LOGIN_ERRORS[errorCode] ?? '카카오 로그인을 완료하지 못했어요. 다시 시도해 주세요.'
    : '';
  const kakaoHref = `/api/v1/auth/kakao/start?returnTo=${encodeURIComponent(destination)}`;

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [destination, navigate, user]);

  return <AuthShell eyebrow="WELCOME BACK" title="다시 만나 반가워요" description={destination !== '/clubs' ? '로그인하면 요청한 화면으로 돌아갑니다.' : '로그인하면 동아리 목록으로 돌아갑니다.'}><div className="auth-actions">{error && <p className="form-error" role="alert">{error}</p>}<a className="kakao-login-button" href={kakaoHref}>카카오로 계속하기</a></div></AuthShell>;
}
