import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState } from '../components/ui.jsx';
import { Award, Bell, Calendar, CheckCircle, ChevronRight, FileText, Info } from '../components/icons.jsx';
import { AppStatus, NOTI_CATEGORIES } from '../data/constants.js';
import { fmtRelative } from '../utils/date.js';

const KIND_STYLE = {
  INTERVIEW_INVITE: { Icon: Calendar, bg: 'var(--c-primary)', fg: '#fff', label: '면접 예약 안내' },
  INTERVIEW_BOOKED: { Icon: CheckCircle, bg: 'var(--c-mint)', fg: 'var(--c-success-ink)', label: '면접 예약 확정' },
  DOC_PASSED: { Icon: CheckCircle, bg: 'var(--c-primary)', fg: '#fff', label: '서류 합격' },
  DOC_FAILED: { Icon: Info, bg: 'var(--c-tint-400)', fg: 'var(--c-ink-2)', label: '서류 결과' },
  DOC_RESULT: { Icon: FileText, bg: 'var(--c-tint-400)', fg: 'var(--c-ink-2)', label: '서류 결과 발표' },
  FINAL_PASSED: { Icon: Award, bg: 'var(--c-mint)', fg: 'var(--c-success-ink)', label: '최종 합격' },
  FINAL_FAILED: { Icon: Info, bg: 'var(--c-tint-400)', fg: 'var(--c-ink-2)', label: '최종 결과' },
  SUBMITTED: { Icon: FileText, bg: 'var(--c-tint-200)', fg: 'var(--c-primary)', label: '접수 완료' },
  SYSTEM: { Icon: Info, bg: 'var(--c-tint-400)', fg: 'var(--c-ink-2)', label: '시스템 알림' },
};

export default function NotificationsScreen() {
  const { state, sel, actions } = useApp();
  const nav = useNavigate();
  const [cat, setCat] = useState('all');

  const items = useMemo(() => {
    const list = cat === 'all' ? state.notifications : state.notifications.filter((n) => n.category === cat);
    return [...list].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [state.notifications, cat]);

  const unread = sel.unreadCount();

  /** 알림 → 해당 화면으로 라우팅 (비즈니스 로직 정합성 유지) */
  const open = (n) => {
    actions.readNoti(n.id);
    if (!n.applicationId) {
      nav('/profile');
      return;
    }
    const app = sel.application(n.applicationId);
    if (!app) {
      actions.toast('연결된 지원 내역을 찾을 수 없습니다.', 'error');
      return;
    }
    if (n.kind === 'INTERVIEW_INVITE' || n.kind === 'DOC_PASSED') {
      nav(app.status === AppStatus.INTERVIEW_SCHEDULED
        ? `/applications/${app.id}/interview`
        : `/applications/${app.id}/interview/pick`);
      return;
    }
    if (n.kind === 'INTERVIEW_BOOKED') {
      nav(`/applications/${app.id}/interview`);
      return;
    }
    nav(`/applications/${app.id}`);
  };

  return (
    <>
      <TopBar brand />
      <Screen pad={false}>
        <div className="px16 mt16 row between">
          <div className="col g2">
            <span className="t-over c-primary">UPDATE CENTER</span>
            <h1 className="t-h2">새로운 소식</h1>
          </div>
          {unread > 0 && (
            <button type="button" className="row g4 t-cap-b c-primary" onClick={actions.readAllNoti}>
              <CheckCircle size={15} /> 모두 읽음
            </button>
          )}
        </div>

        <div className="chip-row mt12" role="group" aria-label="알림 분류">
          {NOTI_CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="px16 mt16 col g8">
          {items.length === 0 && (
            <EmptyState icon={<Bell size={26} />} title="알림이 없습니다" desc={'새로운 소식이 도착하면\n이곳에서 알려드릴게요.'} />
          )}

          {items.map((n) => {
            const s = KIND_STYLE[n.kind] ?? KIND_STYLE.SYSTEM;
            const club = n.clubId ? sel.club(n.clubId) : null;
            return (
              <Card
                as="button"
                key={n.id}
                className={`card--tap card--pad row-top g12${n.read ? '' : ''}`}
                style={{ background: n.read ? 'var(--c-surface-alt)' : 'var(--c-surface)', opacity: n.read ? 0.85 : 1 }}
                onClick={() => open(n)}
              >
                <span
                  className="center shrink0"
                  style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.fg, display: 'flex' }}
                  aria-hidden
                >
                  <s.Icon size={19} />
                </span>
                <span className="col g4 grow" style={{ minWidth: 0 }}>
                  <span className="row between g8">
                    <span className={`t-cap-b ${n.read ? 'ink3' : 'c-primary'}`}>{n.title}</span>
                    <span className="t-cap ink3 shrink0">{fmtRelative(n.at)}</span>
                  </span>
                  {club && <span className="t-h4 clamp1">{club.name}</span>}
                  <span className="t-body-s ink2 clamp2">{n.body}</span>
                  {n.cta && (
                    <span className="row g4 t-cap-b c-primary mt4">
                      {n.cta} <ChevronRight size={13} />
                    </span>
                  )}
                </span>
                {!n.read && <span className="dot dot--8 shrink0" style={{ background: 'var(--c-primary)', marginTop: 4 }} />}
              </Card>
            );
          })}
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}
