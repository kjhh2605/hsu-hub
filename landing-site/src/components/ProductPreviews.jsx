import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  Search,
  UserRound,
} from 'lucide-react';

function PhoneShell({ children, label, className = '' }) {
  return (
    <div className={`phone-shell ${className}`} aria-label={label}>
      <div className="phone-top" aria-hidden="true">
        <span>9:41</span>
        <span className="phone-notch" />
        <span>● ●</span>
      </div>
      <div className="phone-screen">{children}</div>
      <span className="phone-home" aria-hidden="true" />
    </div>
  );
}

function PhoneNav({ active = 'home' }) {
  const items = [
    { id: 'home', Icon: Home },
    { id: 'search', Icon: Search },
    { id: 'bell', Icon: Bell },
    { id: 'profile', Icon: UserRound },
  ];
  return (
    <div className="preview-nav" aria-hidden="true">
      {items.map(({ id, Icon }) => (
        <Icon className={active === id ? 'is-active' : ''} key={id} size={16} />
      ))}
    </div>
  );
}

export function ExplorePreview() {
  return (
    <div className="preview-stage preview-stage--discover">
      <div className="preview-orbit preview-orbit--one" aria-hidden="true" />
      <div className="preview-orbit preview-orbit--two" aria-hidden="true" />
      <PhoneShell label="HSU Club 동아리 탐색 화면" className="phone-shell--discover">
        <div className="preview-page-head">
          <div>
            <small>안녕하세요, 김한성님</small>
            <strong>어떤 동아리를 찾고 있나요?</strong>
          </div>
          <Bell size={18} />
        </div>
        <div className="preview-search">
          <Search size={14} />
          동아리 이름이나 활동을 검색해보세요
        </div>
        <div className="preview-chips">
          <span className="is-active">전체</span>
          <span>IT</span>
          <span>공연</span>
          <span>학술</span>
        </div>
        <div className="preview-section-row">
          <strong>지금 모집 중</strong>
          <span>전체보기</span>
        </div>
        <article className="club-preview-card club-preview-card--blue">
          <div className="club-preview-cover">
            <span>IT</span>
            <b>LIKELION</b>
          </div>
          <div className="club-preview-info">
            <small>D-5 · 3월 15일 마감</small>
            <strong>멋쟁이사자처럼 14기</strong>
            <p>함께 아이디어를 서비스로 만들어요</p>
          </div>
        </article>
        <article className="club-preview-card club-preview-card--navy">
          <div className="club-preview-cover">
            <span>공연</span>
            <b>BRILLANTE</b>
          </div>
          <div className="club-preview-info">
            <small>D-8 · 3월 18일 마감</small>
            <strong>브릴란떼 신입 단원 모집</strong>
          </div>
        </article>
        <PhoneNav active="search" />
      </PhoneShell>
      <div className="preview-float-card preview-float-card--category" aria-hidden="true">
        <span>카테고리</span>
        <strong>원하는 활동부터</strong>
        <div><i /> <i /> <i /> <i /></div>
      </div>
      <div className="preview-float-card preview-float-card--deadline" aria-hidden="true">
        <CalendarDays size={16} />
        <span>모집 마감</span>
        <strong>한눈에 확인</strong>
      </div>
    </div>
  );
}

export function ApplicationPreview() {
  return (
    <div className="preview-stage preview-stage--track">
      <div className="track-grid" aria-hidden="true" />
      <PhoneShell label="HSU Club 나의 지원 현황 화면" className="phone-shell--track-main">
        <div className="preview-simple-head">
          <div>
            <small>MY APPLICATIONS</small>
            <strong>나의 지원</strong>
          </div>
          <Bell size={18} />
        </div>
        <div className="application-summary">
          <small>진행 중인 지원</small>
          <strong>2</strong>
          <span>이번 학기</span>
        </div>
        <article className="application-card">
          <div className="application-card-top">
            <span className="mini-club-logo">L</span>
            <div>
              <strong>멋쟁이사자처럼</strong>
              <small>14기 아기사자 모집</small>
            </div>
            <span className="status-pill">면접 대기</span>
          </div>
          <div className="status-track" aria-label="지원 진행 상태">
            <span className="is-done"><i><Check size={8} /></i>지원</span>
            <span className="is-done"><i><Check size={8} /></i>서류</span>
            <span className="is-current"><i>3</i>면접</span>
            <span><i>4</i>최종</span>
          </div>
          <button type="button">면접 시간 선택하기 <ChevronRight size={13} /></button>
        </article>
        <article className="application-card application-card--muted">
          <div className="application-card-top">
            <span className="mini-club-logo mini-club-logo--violet">B</span>
            <div>
              <strong>Brillante</strong>
              <small>오케스트라 단원 모집</small>
            </div>
            <span className="status-pill status-pill--review">서류 검토</span>
          </div>
        </article>
        <PhoneNav active="home" />
      </PhoneShell>

      <PhoneShell label="HSU Club 면접 시간 선택 화면" className="phone-shell--track-side">
        <div className="interview-head">
          <ChevronLeft size={17} />
          <strong>면접 시간 선택</strong>
          <span />
        </div>
        <div className="interview-club">
          <span className="mini-club-logo">L</span>
          <div><strong>멋쟁이사자처럼</strong><small>14기 면접</small></div>
        </div>
        <div className="date-strip">
          <span><small>월</small>17</span>
          <span className="is-active"><small>화</small>18</span>
          <span><small>수</small>19</span>
          <span><small>목</small>20</span>
        </div>
        <p className="slot-title"><Clock3 size={14} /> 가능한 시간</p>
        <div className="slot-list">
          <button type="button"><span>14:00</span><small>3자리 남음</small></button>
          <button className="is-selected" type="button"><span>14:30</span><small>선택됨</small></button>
          <button type="button"><span>15:00</span><small>1자리 남음</small></button>
        </div>
        <button className="slot-confirm" type="button">이 시간으로 예약하기</button>
      </PhoneShell>
      <div className="preview-float-card preview-float-card--notice" aria-hidden="true">
        <span className="notice-check"><Check size={14} /></span>
        <div><small>면접 예약 완료</small><strong>3월 18일 14:30</strong></div>
      </div>
    </div>
  );
}
