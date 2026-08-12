# HSU Club Landing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive student-facing HSU Club landing page that explains the fragmented current application journey, demonstrates the connected service experience, and sends students to `/explore`.

**Architecture:** Create an independent Vite + React 18 static site consistent with the sibling `mobile` and `web` prototypes. Keep all page copy and comparison data in one content module, compose the page from focused section components, and build product previews as local semantic React markup so the page has no runtime API dependency.

**Tech Stack:** React 18.3.1, Vite 5.4.8, Vitest 2.1.2, Testing Library 16, Lucide React, plain CSS with design tokens

## Global Constraints

- The primary audience is Hansung University students deciding whether to use HSU Club.
- The primary CTA copy is exactly `모집 중인 동아리 보기` and links to `/explore`.
- The core promise is exactly `동아리 지원부터 면접까지, 한곳에서 끝내세요.`
- Frame the problem as one application journey split across tools; do not criticize the individual tools.
- Show exactly two standalone feature stories: `모집 탐색` and `지원 관리`.
- `간편 지원` appears only as a step in the connected journey, not as a standalone feature.
- Do not include unverified user counts, partner-club counts, testimonials, or performance statistics.
- Support 320px through 1440px layouts without horizontal scrolling.
- Respect `prefers-reduced-motion: reduce` and provide visible keyboard focus.
- Reuse React `18.3.1`, Vite `5.4.8`, and Vitest `2.1.2` to match sibling projects.

---

## File Structure

- `package.json`: scripts and locked dependencies for the standalone landing app
- `vite.config.js`: React plugin and jsdom test environment
- `eslint.config.js`: focused lint rules for React and hooks
- `index.html`: metadata, description, theme color, and app root
- `src/main.jsx`: React root and stylesheet imports
- `src/App.jsx`: semantic page composition only
- `src/content/landingContent.js`: CTA destination, hero copy, comparison rows, journey steps, and feature story content
- `src/components/BrandMark.jsx`: accessible HSU Club wordmark
- `src/components/Header.jsx`: sticky navigation and CTA
- `src/components/Hero.jsx`: hero copy, CTA group, and character-scene asset
- `src/components/Comparison.jsx`: desktop table/mobile card comparison
- `src/components/Journey.jsx`: four-step connected flow
- `src/components/FeatureShowcase.jsx`: two alternating feature story blocks
- `src/components/ProductPreviews.jsx`: focused static previews for Explore, Club detail, Applications, and Interview slots
- `src/components/FinalCta.jsx`: closing conversion section
- `src/components/Footer.jsx`: service identity and policy placeholders
- `src/components/Reveal.jsx`: IntersectionObserver enhancement with no-JS-safe visible default
- `src/assets/hsu-character-journey.webp`: generated single-scene character artwork based on the supplied school character
- `src/styles/tokens.css`: colors, typography, spacing, radius, shadow, motion tokens
- `src/styles/base.css`: reset, global typography, focus, and shared utilities
- `src/styles/landing.css`: section layouts, components, responsive behavior, and reduced-motion overrides
- `src/test/setup.js`: Testing Library matchers
- `src/test/landing.test.jsx`: content, link, and accessibility contracts
- `.gitignore`: generated dependencies, build output, and Visual Companion state

### Task 1: Application Shell and Content Contract

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/content/landingContent.js`
- Create: `src/test/setup.js`
- Create: `src/test/landing.test.jsx`

**Interfaces:**
- Produces: `CTA_HREF: string`, `comparisonRows: Array<{step:string,current:string,hsu:string}>`, `journeySteps: Array<{title:string,description:string}>`, `featureStories: Array<{id:string,eyebrow:string,title:string,description:string,points:string[]}>`
- Consumes: no prior task interfaces

- [ ] **Step 1: Write the failing page contract test**

```jsx
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

test('renders the core promise and two feature stories', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '동아리 지원부터 면접까지, 한곳에서 끝내세요.' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '모집 중인 동아리를 한눈에' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '지원한 순간부터 면접까지 놓치지 않게' })).toBeInTheDocument();
});

test('points every primary CTA to explore', () => {
  render(<App />);
  const links = screen.getAllByRole('link', { name: '모집 중인 동아리 보기' });
  expect(links.length).toBeGreaterThanOrEqual(3);
  links.forEach((link) => expect(link).toHaveAttribute('href', '/explore'));
});
```

- [ ] **Step 2: Run the test and confirm the shell is missing**

Run: `npm test`
Expected: FAIL because `src/App.jsx` and the test configuration do not exist.

- [ ] **Step 3: Create the Vite shell and content module**

Create React/Vite files pinned to the versions in Global Constraints. Export the following content shape:

```js
export const CTA_HREF = '/explore';
export const comparisonRows = [
  { step: '모집 확인', current: '에브리타임과 인스타그램에서 동아리별 공고를 각각 탐색', hsu: '현재 모집 중인 동아리와 일정을 한곳에서 확인' },
  { step: '지원', current: '공고마다 연결된 별도의 Google Form으로 이동', hsu: '공고 확인 후 서비스 안에서 바로 지원' },
  { step: '지원 이후', current: '지원 내역과 전형 진행 상황을 별도로 확인', hsu: '내가 지원한 동아리와 현재 단계를 한 화면에서 확인' },
  { step: '면접 조율', current: '별도의 Google Sheets 링크에서 가능 시간을 확인·기입', hsu: '가능한 슬롯을 선택하고 예약 결과를 즉시 확인' },
];
```

Compose `App` with temporary semantic section headings so the contract test passes before visual components exist.

- [ ] **Step 4: Install dependencies and run tests**

Run: `npm install && npm test`
Expected: all contract tests PASS.

- [ ] **Step 5: Commit the working shell**

```bash
git add landing-site/package.json landing-site/package-lock.json landing-site/vite.config.js landing-site/eslint.config.js landing-site/index.html landing-site/.gitignore landing-site/src
git commit -m "feat: scaffold HSU Club landing content"
```

### Task 2: Brand Shell, Hero, and Character Artwork

**Files:**
- Create: `src/components/BrandMark.jsx`
- Create: `src/components/Header.jsx`
- Create: `src/components/Hero.jsx`
- Create: `src/assets/hsu-character-journey.webp`
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/landing.css`
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Modify: `src/test/landing.test.jsx`

**Interfaces:**
- Consumes: `CTA_HREF` and hero content from `landingContent.js`
- Produces: `<Header />`, `<Hero />`, and CSS tokens used by every later section

- [ ] **Step 1: Add failing accessibility tests for the hero**

```jsx
test('gives the hero scene meaningful alternative text', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /HSU 캐릭터가 여러 모집 도구 사이에서/ })).toBeInTheDocument();
});

test('provides section navigation', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: '기존 방식과 비교' })).toHaveAttribute('href', '#compare');
  expect(screen.getByRole('link', { name: '주요 기능' })).toHaveAttribute('href', '#features');
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --run src/test/landing.test.jsx`
Expected: FAIL because the image and navigation links are absent.

- [ ] **Step 3: Generate and integrate the single-scene character artwork**

Use the supplied school character as an image reference. Generate a wide editorial illustration with the original navy line-art character centered among labeled generic UI cards for 에브리타임, 인스타그램, Google Form, and Google Sheets, with visual flow converging on one HSU Club mobile panel. Save the optimized output as `src/assets/hsu-character-journey.webp`; keep tool text labels as HTML overlays when generative text is unclear.

- [ ] **Step 4: Implement header, hero, and foundational CSS**

Use semantic elements, a sticky translucent header, two-column desktop hero, stacked mobile hero, 44px minimum CTA height, and exact hero copy from the spec. Import styles in this order:

```jsx
import './styles/tokens.css';
import './styles/base.css';
import './styles/landing.css';
```

- [ ] **Step 5: Run tests and production build**

Run: `npm test && npm run build`
Expected: all tests PASS and Vite emits `dist/` without errors.

- [ ] **Step 6: Commit the branded hero**

```bash
git add landing-site/src landing-site/index.html
git commit -m "feat: add branded landing hero"
```

### Task 3: Comparison and Connected Journey

**Files:**
- Create: `src/components/Comparison.jsx`
- Create: `src/components/Journey.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/landing.css`
- Modify: `src/test/landing.test.jsx`

**Interfaces:**
- Consumes: `comparisonRows` and `journeySteps` from `landingContent.js`
- Produces: `<Comparison id="compare" />` and `<Journey />`

- [ ] **Step 1: Add failing exact-content tests**

```jsx
test('describes the four real-world tool transitions', () => {
  render(<App />);
  ['모집 확인', '지원', '지원 이후', '면접 조율'].forEach((step) => {
    expect(screen.getByText(step)).toBeInTheDocument();
  });
  expect(screen.getByText('공고마다 연결된 별도의 Google Form으로 이동')).toBeInTheDocument();
  expect(screen.getByText('별도의 Google Sheets 링크에서 가능 시간을 확인·기입')).toBeInTheDocument();
});

test('keeps apply as a journey step rather than a feature heading', () => {
  render(<App />);
  expect(screen.getByText('지원하기')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '간편 지원' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and confirm missing sections**

Run: `npm test -- --run src/test/landing.test.jsx`
Expected: FAIL on the four comparison labels and journey step.

- [ ] **Step 3: Implement responsive comparison and journey components**

Render one semantic comparison table for desktop and one semantic list for mobile, using CSS media queries to show only the appropriate presentation. Add the four-step journey with ordered-list semantics and decorative connectors marked `aria-hidden="true"`.

- [ ] **Step 4: Run tests and lint**

Run: `npm test && npm run lint`
Expected: all tests and lint PASS.

- [ ] **Step 5: Commit the explanatory sections**

```bash
git add landing-site/src
git commit -m "feat: explain the connected application journey"
```

### Task 4: Product Previews and Feature Stories

**Files:**
- Create: `src/components/ProductPreviews.jsx`
- Create: `src/components/FeatureShowcase.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/landing.css`
- Modify: `src/test/landing.test.jsx`

**Interfaces:**
- Consumes: `featureStories` from `landingContent.js`
- Produces: `<FeatureShowcase id="features" />`, `ExplorePreview`, `ApplicationsPreview`, and `InterviewPreview`

- [ ] **Step 1: Add failing feature proof tests**

```jsx
test('shows only the two agreed standalone feature stories', () => {
  render(<App />);
  expect(screen.getAllByTestId('feature-story')).toHaveLength(2);
  expect(screen.getByText('카테고리 탐색')).toBeInTheDocument();
  expect(screen.getByText('진행 상태 확인')).toBeInTheDocument();
  expect(screen.getByText('면접 시간 선택·변경')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --run src/test/landing.test.jsx`
Expected: FAIL because the feature story blocks and preview elements do not exist.

- [ ] **Step 3: Build semantic static product previews**

Recreate the existing mobile prototype's visual language with compact cards: category chips and open recruitment cards for Explore; status pills and timeline rows for Applications; date chips and available-seat buttons for Interview. Mark purely decorative device chrome `aria-hidden="true"`, and retain visible text for the product proof.

- [ ] **Step 4: Implement alternating feature story layout**

Use two large story rows that alternate copy and preview positions at desktop widths and stack copy before preview on mobile. Do not introduce a carousel or auto-rotation.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`
Expected: all tests PASS and production build succeeds.

- [ ] **Step 6: Commit the feature proof**

```bash
git add landing-site/src
git commit -m "feat: showcase student discovery and application tracking"
```

### Task 5: Closing CTA, Motion, and Full Verification

**Files:**
- Create: `src/components/FinalCta.jsx`
- Create: `src/components/Footer.jsx`
- Create: `src/components/Reveal.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/landing.css`
- Modify: `src/test/landing.test.jsx`
- Create: `README.md`

**Interfaces:**
- Consumes: `CTA_HREF`, closing CTA copy, and policy-link labels from `landingContent.js`
- Produces: complete page, optional reveal enhancement, and developer run instructions

- [ ] **Step 1: Add failing footer and reduced-motion contract tests**

```jsx
test('renders the closing CTA and service footer', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '놓치고 싶지 않은 동아리를 지금 찾아보세요.' })).toBeInTheDocument();
  expect(screen.getByText('한성대학교 학생을 위한 동아리 모집·지원 서비스')).toBeInTheDocument();
  expect(screen.getByText('© 2026 HSU Club')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --run src/test/landing.test.jsx`
Expected: FAIL because the closing sections are absent.

- [ ] **Step 3: Implement closing sections and progressive reveal**

Use `IntersectionObserver` only as an enhancement. Content must default to visible; JavaScript adds `data-reveal-ready` before hidden/reveal states apply. Disconnect observers after reveal. The reduced-motion media query must set `animation-duration: 0.01ms`, remove transforms, and use `scroll-behavior: auto`.

- [ ] **Step 4: Document local operation**

Document `npm install`, `npm run dev`, `npm test`, `npm run lint`, and `npm run build`, plus the `/explore` CTA placeholder and the generated-character asset source.

- [ ] **Step 5: Run the full automated verification**

Run: `npm test && npm run lint && npm run build`
Expected: tests, lint, and production build all PASS.

- [ ] **Step 6: Run responsive visual verification**

Start `npm run dev -- --host 127.0.0.1`, capture 1440x1100, 1024x900, 768x1024, 390x844, and 320x800 views, and inspect for horizontal overflow, clipped Korean text, overlap, focus visibility, and readable product previews. Fix any issue and rerun Step 5.

- [ ] **Step 7: Commit the completed landing page**

```bash
git add landing-site
git commit -m "feat: complete HSU Club student landing page"
```
