import '@testing-library/jest-dom/vitest';

// jsdom lacks matchMedia — provide a minimal stub used by responsive helpers.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom lacks real scroll APIs (window.scrollTo throws "Not implemented")
window.scrollTo = () => {};
Element.prototype.scrollTo = function scrollTo() {};
Element.prototype.scrollIntoView = function scrollIntoView() {};

// Deterministic clock for D-day / timeAgo assertions is set per-test where needed.
