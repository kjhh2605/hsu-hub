import { ArrowRight } from 'lucide-react';
import heroArtwork from '../assets/hsu-character-journey.webp';
import { CTA_HREF, finalCta } from '../content/landingContent.js';

export default function FinalCta() {
  return (
    <section className="final-cta section">
      <div className="container final-cta-card">
        <div className="final-cta-grid" aria-hidden="true" />
        <div className="final-cta-copy">
          <p className="eyebrow">{finalCta.eyebrow}</p>
          <h2>{finalCta.title}</h2>
          <p>{finalCta.description}</p>
          <a className="button button--large button--light" href={CTA_HREF}>
            모집 중인 동아리 보기
            <ArrowRight size={19} aria-hidden="true" />
          </a>
        </div>
        <div className="final-cta-character" aria-hidden="true">
          <img src={heroArtwork} alt="" />
        </div>
        <div className="final-cta-badge" aria-hidden="true">
          <span>HSU</span>
          <strong>CLUB</strong>
        </div>
      </div>
    </section>
  );
}
