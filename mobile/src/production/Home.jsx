import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return <main className="screen home-screen"><div className="home-orbit orbit-one" /><div className="home-orbit orbit-two" /><header><span className="wordmark light">HSU HUB</span><span className="home-chip">한성대학교</span></header><section className="home-hero"><p>YOUR CAMPUS, CONNECTED</p><h1>캠퍼스의 모든 시작을<br />한 곳에서.</h1><span>동아리를 발견하고, 나에게 맞는 활동에 지원해 보세요.</span></section><nav className="service-grid" aria-label="서비스 선택"><Link className="service-card active" to="/clubs"><span className="service-number">01</span><div className="service-icon">✦</div><strong>동아리</strong><p>함께할 사람과<br />새로운 경험 찾기</p><b>둘러보기 →</b></Link><button className="service-card" disabled><span className="service-number">02</span><div className="service-icon">⌂</div><strong>시설예약</strong><p>교내 공간을<br />간편하게 예약하기</p><b>준비 중</b></button></nav><footer>HANSUNG UNIVERSITY · STUDENT HUB</footer></main>;
}
