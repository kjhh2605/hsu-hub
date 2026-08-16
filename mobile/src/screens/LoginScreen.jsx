import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Button } from '../components/ui.jsx';
import { Logo } from '../components/icons.jsx';

const PROVIDERS = [
  { id: 'kakao', label: '카카오로 시작하기', bg: '#FEE500', fg: '#3C1E1E', mark: 'K' },
  { id: 'google', label: 'Google로 시작하기', bg: '#FFFFFF', fg: '#0B1C30', mark: 'G', border: true },
  { id: 'apple', label: 'Apple로 시작하기', bg: '#0B1C30', fg: '#FFFFFF', mark: '' },
];

export default function LoginScreen() {
  const { state, actions } = useApp();
  const nav = useNavigate();

  const onLogin = (id) => {
    actions.login(id);
    const to = state.user.profileComplete ? state.auth.redirectTo || '/explore' : '/onboarding';
    nav(to, { replace: true });
  };

  return (
    <main className="screen" style={{ background: 'var(--c-bg)' }}>
      <div className="col center" style={{ padding: '64px 16px 24px' }}>
        <div
          className="center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: '#fff',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,.1)',
            display: 'flex',
            marginBottom: 16,
          }}
        >
          <Logo size={44} />
        </div>
        <h1 className="t-h2">CampusConnect</h1>
        <p className="t-body-s ink3 mt4">더 나은 캠퍼스 라이프의 시작</p>
      </div>

      <div className="px16">
        <div className="card card--pad20 col g12">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="row center g8"
              onClick={() => onLogin(p.id)}
              style={{
                height: 56,
                borderRadius: 8,
                background: p.bg,
                color: p.fg,
                border: p.border ? '1px solid var(--c-line)' : 'none',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              <span
                className="center"
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 800,
                  background: p.id === 'apple' ? '#fff' : 'rgba(0,0,0,.06)',
                  color: p.id === 'apple' ? '#0B1C30' : p.fg,
                }}
              >
                {p.mark}
              </span>
              {p.label}
            </button>
          ))}
        </div>

        <p className="t-cap ink3 center-text pre mt24">
          {'로그인 후 이전에 작성하시던\n지원서 작성 페이지로 자동 연결됩니다.'}
        </p>

        <div className="row jcenter g16 mt16" style={{ opacity: 0.6 }}>
          <span className="t-cap ink2">이용약관</span>
          <span style={{ width: 1, height: 12, background: 'var(--c-line)' }} />
          <span className="t-cap ink2">개인정보처리방침</span>
        </div>

        <div className="col center mt32" aria-hidden>
          <div
            className="row aend jcenter g8"
            style={{
              width: 192,
              height: 120,
              background: 'var(--c-tint-200)',
              borderRadius: '9999px 9999px 0 0',
              paddingBottom: 8,
              opacity: 0.7,
            }}
          >
            <span style={{ width: 12, height: 48, borderRadius: 999, background: 'var(--c-primary-20)' }} />
            <span style={{ width: 12, height: 80, borderRadius: 999, background: 'rgba(0,88,190,.3)' }} />
            <span style={{ width: 12, height: 64, borderRadius: 999, background: 'var(--c-primary-20)' }} />
          </div>
        </div>

        <div className="mt16">
          <Button variant="ghost" block size="sm" onClick={() => nav('/explore')}>
            먼저 둘러보기
          </Button>
        </div>
      </div>
      <div className="screen-bottom-space" />
    </main>
  );
}
