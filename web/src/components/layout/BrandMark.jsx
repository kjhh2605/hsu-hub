import React from 'react';
import { cx } from '@/components/ui';

/** UniClub 로고 마크 */
export function BrandMark({ size = 32, className }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-[9px] bg-grad-primary text-white shadow-primary',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 20" width={size * 0.55} height={size * 0.46} fill="currentColor">
        <path d="M12 0 24 5.5v2.2L12 13.2 3.4 9.3v5.2h-2V8.4L0 7.7V5.5L12 0Zm0 15.4 7.4-3.4v4.1c0 .7-.4 1.3-1 1.6-1.9.9-4 1.4-6.4 1.4s-4.5-.5-6.4-1.4c-.6-.3-1-.9-1-1.6V12l7.4 3.4Z" />
      </svg>
    </span>
  );
}

export default BrandMark;
