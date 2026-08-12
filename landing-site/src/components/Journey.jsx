import {
  CalendarCheck2,
  ClipboardPenLine,
  Search,
  Waypoints,
} from 'lucide-react';
import { journeySteps } from '../content/landingContent.js';

const icons = [Search, ClipboardPenLine, Waypoints, CalendarCheck2];

export default function Journey() {
  return (
    <section className="journey section">
      <div className="container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">02 · CONNECTED JOURNEY</p>
          <h2>하나의 흐름으로 이어지는 동아리 지원</h2>
          <p>공고를 발견한 순간부터 면접을 확정할 때까지 이어서 진행해요.</p>
        </div>
        <ol className="journey-list">
          {journeySteps.map((step, index) => {
            const Icon = icons[index];
            return (
              <li key={step.title}>
                <div className="journey-icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <span className="journey-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < journeySteps.length - 1 && (
                  <span className="journey-connector" aria-hidden="true">
                    <span />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
