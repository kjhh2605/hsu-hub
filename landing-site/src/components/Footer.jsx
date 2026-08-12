import BrandMark from './BrandMark.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <BrandMark inverted />
          <p>한성대학교 학생을 위한 동아리 모집·지원 서비스</p>
        </div>
        <nav aria-label="서비스 정책">
          <a href="/terms">이용약관</a>
          <a href="/privacy">개인정보처리방침</a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 HSU Club</span>
        <span>Made for Hansung students</span>
      </div>
    </footer>
  );
}
