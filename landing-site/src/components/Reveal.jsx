import { useEffect, useRef } from 'react';

export default function Reveal({ children, className = '' }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    document.documentElement.dataset.revealReady = 'true';

    if (!('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`reveal ${className}`.trim()} ref={elementRef}>
      {children}
    </div>
  );
}
