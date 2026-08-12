export default function BrandMark({ inverted = false }) {
  return (
    <a
      className={`brand-mark${inverted ? ' brand-mark--inverted' : ''}`}
      href="#top"
      aria-label="HSU Club 홈"
    >
      <span className="brand-symbol" aria-hidden="true">
        <span>H</span>
      </span>
      <span>HSU Club</span>
    </a>
  );
}
