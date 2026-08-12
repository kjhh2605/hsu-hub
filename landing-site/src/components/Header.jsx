import { ArrowUpRight } from 'lucide-react';
import { CTA_HREF } from '../content/landingContent.js';
import BrandMark from './BrandMark.jsx';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandMark />
        <nav className="header-nav" aria-label="페이지 주요 메뉴">
          <a href="#compare">기존 방식과 비교</a>
          <a href="#features">주요 기능</a>
        </nav>
        <a className="button button--small" href={CTA_HREF}>
          모집 중인 동아리 보기
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
