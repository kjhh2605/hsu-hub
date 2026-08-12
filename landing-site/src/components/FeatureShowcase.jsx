import { Check } from 'lucide-react';
import { featureStories } from '../content/landingContent.js';
import { ApplicationPreview, ExplorePreview } from './ProductPreviews.jsx';

const previews = {
  discover: ExplorePreview,
  track: ApplicationPreview,
};

export default function FeatureShowcase() {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="section-heading features-heading">
          <p className="eyebrow">03 · PRODUCT PREVIEW</p>
          <h2>학생의 지원 흐름을 위해 만든 두 가지 핵심</h2>
          <p>기능을 더하는 대신, 찾고 지원한 뒤 결과를 확인하는 흐름에 집중했어요.</p>
        </div>

        <div className="feature-stories">
          {featureStories.map((feature, index) => {
            const Preview = previews[feature.id];
            return (
              <article
                className={`feature-story${index % 2 ? ' feature-story--reverse' : ''}`}
                data-testid="feature-story"
                key={feature.id}
              >
                <div className="feature-copy">
                  <div className="feature-index">
                    <span>0{index + 1}</span>
                    <i aria-hidden="true" />
                    <b>{feature.eyebrow}</b>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <ul>
                    {feature.points.map((point) => (
                      <li key={point}>
                        <span aria-hidden="true"><Check size={13} /></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <Preview />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
