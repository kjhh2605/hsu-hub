import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../components/layout.jsx';
import { Badge, Card, EmptyState, IconButton, Input } from '../components/ui.jsx';
import { Bell, Compass, MapPin, Search, Users } from '../components/icons.jsx';
import { CATEGORIES, CATEGORY_LABEL } from '../data/constants.js';
import { dDay, fmtShort } from '../utils/date.js';

export default function ExploreScreen() {
  const { state, sel } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const items = useMemo(() => {
    const open = sel.openRecruitments();
    const closed = sel.closedRecruitments();
    const all = [...open, ...closed].map((r) => ({ r, club: sel.club(r.clubId) }));
    return all.filter(({ r, club }) => {
      if (!club) return false;
      if (cat !== 'all' && club.category !== cat) return false;
      const key = `${club.name} ${club.tagline} ${r.title}`.toLowerCase();
      return key.includes(q.trim().toLowerCase());
    });
  }, [state, q, cat, sel]);

  return (
    <>
      <TopBar
        brand
        right={
          <IconButton label="알림" onClick={() => nav('/notifications')}>
            <Bell />
          </IconButton>
        }
      />
      <Screen pad={false}>
        <div className="px16 mt16 col g4">
          <h1 className="t-display">동아리 탐색</h1>
          <p className="t-body-s ink2">
            이번 학기 모집 중인 동아리 {sel.openRecruitments().length}곳을 만나보세요.
          </p>
        </div>

        <div className="px16 mt16 rel">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="동아리 이름 또는 키워드 검색"
            aria-label="동아리 검색"
            style={{ paddingLeft: 44 }}
          />
          <span
            className="ink4"
            style={{ position: 'absolute', left: 30, top: 15, pointerEvents: 'none' }}
            aria-hidden
          >
            <Search size={18} />
          </span>
        </div>

        <div className="chip-row mt12" role="group" aria-label="카테고리 필터">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="px16 mt16 col g12">
          {items.length === 0 && (
            <EmptyState
              icon={<Compass size={26} />}
              title="조건에 맞는 동아리가 없어요"
              desc={'검색어나 카테고리를 바꿔보세요.'}
            />
          )}

          {items.map(({ r, club }) => {
            const closed = new Date(r.closeAt) < new Date();
            const myApp = state.auth.loggedIn ? sel.applicationForRecruitment(r.id) : null;
            return (
              <Card
                as="button"
                key={r.id}
                variant="tap"
                className="card--tap"
                onClick={() => nav(`/clubs/${club.id}`)}
              >
                <div className="p16 col g12">
                  <div className="row between g8">
                    <div className="row g12 grow" style={{ minWidth: 0 }}>
                      <span
                        className="center shrink0"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: club.heroTone,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 15,
                          display: 'flex',
                        }}
                        aria-hidden
                      >
                        {club.shortName.slice(0, 2)}
                      </span>
                      <span className="col g2 grow" style={{ minWidth: 0 }}>
                        <span className="row g6">
                          <Badge tone="primary">{CATEGORY_LABEL[club.category]}</Badge>
                          {closed ? (
                            <Badge tone="neutral">모집 마감</Badge>
                          ) : (
                            <Badge tone="mint">모집 중</Badge>
                          )}
                        </span>
                        <span className="t-h4 clamp1">{club.name}</span>
                      </span>
                    </div>
                    <span className={`t-cap-b shrink0 ${closed ? 'ink3' : 'c-danger'}`}>
                      {dDay(r.closeAt)}
                    </span>
                  </div>

                  <p className="t-body-s ink2 clamp2">{club.tagline}</p>

                  <div className="row between">
                    <div className="row g12">
                      <span className="row g4 t-cap ink3">
                        <Users size={14} /> {club.recruitCount}명 모집
                      </span>
                      <span className="row g4 t-cap ink3">
                        <MapPin size={14} /> {club.place}
                      </span>
                    </div>
                    {myApp && <Badge tone="accent">지원함</Badge>}
                  </div>

                  <div className="row between t-cap ink3" style={{ borderTop: '1px solid var(--c-line-soft)', paddingTop: 10 }}>
                    <span>
                      접수 {fmtShort(r.openAt)} ~ {fmtShort(r.closeAt)}
                    </span>
                    <span>지원 {r.stats.total}명</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}
