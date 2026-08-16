import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { StoreProvider } from '@/store/AppStore';
import { ADMIN_SCREENS, FIGMA_DESKTOP_FRAME_COUNT } from '@/routes/screenMap';

/**
 * 전체 라우트 스모크 테스트.
 * 모든 화면이 React 경고/에러 없이 마운트되는지 확인한다.
 */

function renderAt(path) {
  return render(
    <StoreProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StoreProvider>,
  );
}

const ROUTES = [
  ...ADMIN_SCREENS.map((s) => [s.path, s.title]),
  ['/', '루트 → 대시보드 리다이렉트'],
  ['/admin/recruitments/new', '위저드 → 페이지 편집 리다이렉트'],
  ['/screens', '전체 화면 목록'],
  ['/this-route-does-not-exist', '404'],
];

describe('전체 라우트 스모크', () => {
  let errorSpy;

  beforeEach(() => {
    window.localStorage.clear();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    errorSpy.mockRestore();
  });

  it.each(ROUTES)('%s (%s) 가 경고/에러 없이 렌더된다', (path) => {
    const { container } = renderAt(path);

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent.length).toBeGreaterThan(10);

    const messages = errorSpy.mock.calls
      .map((c) => (typeof c[0] === 'string' ? c[0] : String(c[0]?.message ?? c[0] ?? '')))
      .filter((m) => m.trim().length > 0)
      .filter((m) => !/Not implemented:/.test(m)); // jsdom 미구현 API는 앱 문제가 아님

    expect(messages).toEqual([]);
  });

  it('Figma 데스크톱 프레임 16개를 12개 화면으로 커버하고, 신규 화면 2개를 더해 14개다', () => {
    // 프레임 16개 = 고유 12개 + 국문 변형 4개
    expect(FIGMA_DESKTOP_FRAME_COUNT).toBe(16);
    expect(ADMIN_SCREENS).toHaveLength(14);

    const fromFigma = ADMIN_SCREENS.filter((s) => s.node !== '-');
    const newlyDesigned = ADMIN_SCREENS.filter((s) => s.node === '-');
    expect(fromFigma).toHaveLength(12);
    expect(newlyDesigned.map((s) => s.title)).toEqual(['지원자 상세 검토', '운영진 설정']);

    // 국문 변형이 매핑된 화면
    const withAlt = ADMIN_SCREENS.filter((s) => s.altNode);
    expect(withAlt.map((s) => s.title)).toEqual([
      '운영진 대시보드',
      '지원자 목록',
      '면접 슬롯 상세 정보',
      '면접 평가 수행',
    ]);
  });

  it('모든 화면이 고유한 경로를 가진다', () => {
    const paths = ADMIN_SCREENS.map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('루트(/)는 대시보드로 리다이렉트된다', () => {
    renderAt('/');
    // 대시보드에만 있는 KPI 라벨
    expect(document.body.textContent).toContain('총 지원자');
  });
});
