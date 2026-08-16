import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, EmptyState } from '../components/ui.jsx';
import {
  ArrowRight, Calendar, ChevronDown, ChevronUp, Cloud, MapPin, Rocket, Users,
} from '../components/icons.jsx';
import { CATEGORY_LABEL, STATUS_META } from '../data/constants.js';
import { dDay, fmtDate, fmtShort } from '../utils/date.js';

const BENEFIT_ICON = { rocket: Rocket, users: Users, cloud: Cloud };

export default function ClubDetailScreen() {
  const { clubId } = useParams();
  const { state, sel, actions } = useApp();
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const club = sel.club(clubId);
  const recruitment = sel.recruitmentOfClub(clubId);

  if (!club) {
    return (
      <>
        <TopBar title="동아리 정보" back />
        <Screen>
          <EmptyState title="동아리를 찾을 수 없습니다" desc="목록으로 돌아가 다시 시도해주세요." action={<Button onClick={() => nav('/explore')}>탐색으로</Button>} />
        </Screen>
      </>
    );
  }

  const myApp =
    recruitment && state.auth.loggedIn ? sel.applicationForRecruitment(recruitment.id) : null;
  const applyGuard = recruitment ? sel.canApply(recruitment.id) : { ok: false, reason: '모집 공고가 없습니다.' };
  // 비로그인 사용자는 일단 지원 가능으로 보고, 라우트 가드가 로그인 → 복귀를 처리한다
  const guard = state.auth.loggedIn
    ? applyGuard
    : recruitment && new Date(recruitment.closeAt) >= new Date()
      ? { ok: true }
      : { ok: false, reason: '모집이 마감되었습니다.' };
  const closed = recruitment ? new Date(recruitment.closeAt) < new Date() : true;

  const onApply = () => {
    if (myApp) {
      nav(`/applications/${myApp.id}`);
      return;
    }
    if (!guard.ok) {
      actions.toast(guard.reason, 'error');
      return;
    }
    nav(`/apply/${recruitment.id}`);
  };

  return (
    <>
      <TopBar title="Club Details" over="CLUB RECRUIT" back />
      <Screen pad={false}>
        {/* Hero */}
        <div className="px16 mt16">
          <div className="hero" style={{ background: `linear-gradient(140deg, ${club.heroTone} 0%, #0B1C30 100%)` }}>
            <div className="row g8 mb12">
              <Badge tone="primary-solid">{CATEGORY_LABEL[club.category]}</Badge>
              {closed ? <Badge tone="neutral">모집 마감</Badge> : <Badge tone="mint">모집 중</Badge>}
            </div>
            <h1 className="t-display c-white">{club.name}</h1>
            <p className="t-body-s c-white80 mt8 clamp3">{club.tagline}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="px16 mt12">
          <Card pad className="row g4">
            {[
              { ico: <Users size={16} />, label: '모집인원', v: `${club.recruitCount}명` },
              { ico: <Calendar size={16} />, label: '활동기간', v: club.period },
              { ico: <MapPin size={16} />, label: '활동장소', v: club.place },
            ].map((s) => (
              <div key={s.label} className="col center g4 grow" style={{ background: 'rgba(239,244,255,.6)', borderRadius: 12, padding: 10 }}>
                <span className="c-primary">{s.ico}</span>
                <span className="t-cap ink3">{s.label}</span>
                <span className="t-cap-b ink center-text">{s.v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* 모집 일정 */}
        {recruitment && (
          <div className="px16 mt24">
            <h2 className="t-h3 mb12">모집 일정</h2>
            <Card pad className="col g12">
              <Row label="서류 접수" value={`${fmtShort(recruitment.openAt)} ~ ${fmtShort(recruitment.closeAt)}`} strong badge={dDay(recruitment.closeAt)} />
              <Row label="서류 결과 발표" value={fmtDate(recruitment.docResultAt)} />
              <Row label="면접 기간" value={`${fmtShort(recruitment.interviewFrom)} ~ ${fmtShort(recruitment.interviewTo)}`} />
              <Row label="최종 발표" value={fmtDate(recruitment.finalResultAt)} />
            </Card>
          </div>
        )}

        {/* 소개 */}
        <div className="px16 mt24 col g12">
          <h2 className="t-h3 pre">우리는 이런 사람을 찾고 있어요! 🎯</h2>
          <p className="t-body ink2">{club.intro}</p>
        </div>

        {/* 혜택 */}
        <div className="px16 mt24">
          <h2 className="t-h3 mb12">동아리 혜택</h2>
          <div className="col g8">
            {club.benefits.map((b) => {
              const Ico = BENEFIT_ICON[b.icon] || Rocket;
              return (
                <Card key={b.title} pad className="row-top g16">
                  <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--c-primary)', color: '#fff', display: 'flex' }}>
                    <Ico size={18} />
                  </span>
                  <span className="col g4">
                    <span className="t-label">{b.title}</span>
                    <span className="t-body-s ink2">{b.desc}</span>
                  </span>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 활동 타임라인 */}
        <div className="px16 mt24">
          <h2 className="t-h3 mb16">주요 활동 일정</h2>
          <div className="timeline">
            {club.timeline.map((t, i) => (
              <div key={t.month} className={`timeline-item${i === 0 ? ' timeline-item--on' : ''}`}>
                <p className={`t-label ${i === 0 ? 'c-primary' : 'ink2'}`}>{t.month}</p>
                <p className="t-h4 mt4">{t.title}</p>
                <p className="t-body-s ink2 mt4">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="px16 mt24">
          <h2 className="t-h3 mb12">자주 묻는 질문</h2>
          <div className="col g8">
            {club.faq.map((f, i) => {
              const open = openFaq === i;
              return (
                <Card key={f.q} className="card--flat">
                  <button
                    type="button"
                    className="row between g12 p16 full"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : i)}
                  >
                    <span className="t-label" style={{ textAlign: 'left' }}>Q. {f.q}</span>
                    <span className="ink3 shrink0">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                  </button>
                  {open && (
                    <p className="t-body-s ink2" style={{ padding: '0 16px 16px' }}>
                      {f.a}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Screen>

      <div className="actionbar">
        {myApp ? (
          <>
            <div className="row between mb4">
              <span className="t-cap ink3">현재 상태</span>
              <Badge tone={STATUS_META[myApp.status].tone}>{STATUS_META[myApp.status].label}</Badge>
            </div>
            <Button variant="soft" size="lg" block onClick={onApply}>
              내 지원서 보기 <ArrowRight size={18} />
            </Button>
          </>
        ) : (
          <Button variant="primary" size="lg" block disabled={!guard.ok} onClick={onApply}>
            {guard.ok ? '지금 바로 지원하기' : closed ? '모집이 마감되었습니다' : guard.reason}
            {guard.ok && <ArrowRight size={18} />}
          </Button>
        )}
      </div>
    </>
  );
}

function Row({ label, value, strong, badge }) {
  return (
    <div className="row between g8">
      <span className="t-body-s ink3">{label}</span>
      <span className="row g6">
        <span className={strong ? 't-label' : 't-body-s ink'}>{value}</span>
        {badge && <Badge tone="danger">{badge}</Badge>}
      </span>
    </div>
  );
}
