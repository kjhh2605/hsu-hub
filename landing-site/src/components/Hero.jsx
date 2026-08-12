import { ArrowDown, ArrowRight } from 'lucide-react';
import heroArtwork from '../assets/hsu-character-journey.webp';
import { CTA_HREF, hero } from '../content/landingContent.js';

const toolLabels = [
  { name: '에브리타임', className: 'tool-label tool-label--everytime' },
  { name: '인스타그램', className: 'tool-label tool-label--instagram' },
  { name: 'Google Form', className: 'tool-label tool-label--form' },
  { name: 'Google Sheets', className: 'tool-label tool-label--sheets' },
];

export default function Hero() {
  return (
    <section className="hero section" id="top">
      <div className="hero-grid container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1>{hero.title}</h1>
          <p className="hero-description">{hero.description}</p>
          <div className="hero-actions">
            <a className="button button--large" href={CTA_HREF}>
              모집 중인 동아리 보기
              <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a className="text-link" href="#compare">
              어떻게 달라졌나요?
              <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="hero-journey">
            <span aria-hidden="true" />
            {hero.journeyLabel}
          </p>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-ring" aria-hidden="true" />
          <div className="hero-art-card">
            <img
              src={heroArtwork}
              alt="HSU 캐릭터가 여러 모집 도구 사이에서 흩어진 지원 과정을 HSU Club 하나로 모으는 장면"
            />
            {toolLabels.map((tool) => (
              <span className={tool.className} key={tool.name} aria-hidden="true">
                {tool.name}
              </span>
            ))}
          </div>
          <div className="hero-note" aria-hidden="true">
            <span>01</span>
            흩어진 과정에서
            <strong>하나의 흐름으로</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
