import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useOperator } from './OperatorContext';

const LOGIN_ERRORS = {
  kakao_cancelled: '카카오 로그인이 취소됐습니다. 다시 시도해 주세요.',
  kakao_email_required: '유효하고 인증된 카카오계정 이메일이 필요해요.',
  kakao_login_failed: '카카오 로그인을 완료하지 못했습니다. 다시 시도해 주세요.',
};

function safeDestination(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !/[\\\u0000-\u001f\u007f]/.test(value)
    ? value
    : '/admin/club';
}

export default function OperatorLogin() {
  const { user, loading } = useOperator();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const destination = safeDestination(location.state?.from);
  const errorCode = params.get('error');
  const error = errorCode
    ? LOGIN_ERRORS[errorCode] ?? '카카오 로그인을 완료하지 못했습니다. 다시 시도해 주세요.'
    : '';
  const kakaoHref = `/api/v1/auth/kakao/start?returnTo=${encodeURIComponent(destination)}`;

  useEffect(() => {
    if (!loading && user) navigate(destination, { replace: true });
  }, [destination, loading, navigate, user]);

  return <main className="operator-login"><section className="login-art"><div className="login-grid" /><span className="prod-brand inverted"><b>H</b><strong>HSU HUB</strong></span><div><p>CLUB OPERATIONS</p><h2>좋은 모집은<br />명확한 흐름에서<br />시작됩니다.</h2><span>동아리 소개부터 지원서 확인까지, 한 곳에서 운영하세요.</span></div><footer>HANSUNG UNIVERSITY · 2026</footer></section><section className="login-panel"><div className="login-card"><p>OPERATOR ACCESS</p><h1>운영진 로그인</h1><span>카카오 로그인 후 승인된 동아리 운영 권한을 확인합니다.</span>{error && <p className="prod-error" role="alert">{error}</p>}<a className="kakao-login-button" href={kakaoHref}>카카오로 계속하기</a></div></section></main>;
}
