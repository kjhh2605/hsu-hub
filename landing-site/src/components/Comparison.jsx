import {
  ArrowRight,
  CalendarClock,
  Check,
  FileText,
  Search,
  Waypoints,
} from 'lucide-react';
import { comparisonRows } from '../content/landingContent.js';

const icons = [Search, FileText, Waypoints, CalendarClock];

function RowIcon({ index }) {
  const Icon = icons[index];
  return (
    <span className="comparison-step-icon" aria-hidden="true">
      <Icon size={18} />
    </span>
  );
}

export default function Comparison() {
  return (
    <section className="comparison section" id="compare">
      <div className="container">
        <div className="section-heading comparison-heading">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            지금까지의 지원 방식
          </p>
          <h2>지원할 때마다, 몇 개의 앱을 오가고 있나요?</h2>
          <p>
            익숙한 도구는 그대로 편리하지만, 모집부터 면접까지의 흐름은 서로
            이어져 있지 않았어요.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <caption className="sr-only">지금까지의 방식과 HSU Club 비교</caption>
            <thead>
              <tr>
                <th scope="col">지원 단계</th>
                <th scope="col">지금까지의 방식</th>
                <th scope="col">
                  <span className="table-hsu-mark">H</span>
                  HSU Club
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr key={row.step}>
                  <th scope="row">
                    <RowIcon index={index} />
                    {row.step}
                  </th>
                  <td className="comparison-current">{row.current}</td>
                  <td className="comparison-hsu">
                    <Check size={18} aria-hidden="true" />
                    {row.hsu}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className="comparison-cards">
          {comparisonRows.map((row, index) => (
            <li key={row.step}>
              <div className="comparison-card-head">
                <RowIcon index={index} />
                <strong>{row.step}</strong>
              </div>
              <div className="comparison-card-way">
                <span>지금까지</span>
                <p>{row.current}</p>
              </div>
              <ArrowRight className="comparison-card-arrow" size={19} aria-hidden="true" />
              <div className="comparison-card-way comparison-card-way--hsu">
                <span>HSU Club</span>
                <p>{row.hsu}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
