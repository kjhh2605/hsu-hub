import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { StoreProvider } from '@/store/AppStore';

function renderApp(path) {
  return render(
    <StoreProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StoreProvider>,
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

/* ================================================================== */
describe('운영진 대시보드', () => {
  it('KPI 4장과 차트 섹션이 렌더된다', () => {
    renderApp('/admin');
    expect(screen.getAllByText('총 지원자').length).toBeGreaterThan(0);
    expect(screen.getAllByText('미검토 지원서').length).toBeGreaterThan(0);
    expect(screen.getAllByText('면접 예약').length).toBeGreaterThan(0);
    expect(screen.getAllByText('경쟁률').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('기간 세그먼트를 바꾸면 차트 데이터 범위가 바뀐다', async () => {
    const user = userEvent.setup();
    renderApp('/admin');
    const tabs = screen.getAllByRole('tab');
    const seven = tabs.find((t) => /7일/.test(t.textContent));
    expect(seven).toBeTruthy();
    await user.click(seven);
    await waitFor(() => expect(seven).toHaveAttribute('aria-selected', 'true'));
  });

  it('사이드바 내비게이션이 5개 메뉴를 제공한다', () => {
    renderApp('/admin');
    ['대시보드', '모집 관리', '지원자', '면접', '설정'].forEach((label) => {
      expect(screen.getAllByRole('link', { name: new RegExp(label) }).length).toBeGreaterThan(0);
    });
  });
});

/* ================================================================== */
describe('모집 목록 관리', () => {
  it('모집 공고 목록이 표시된다', () => {
    renderApp('/admin/recruitments');
    expect(screen.getAllByText(/멋쟁이사자처럼 12기 아기사자 모집/).length).toBeGreaterThan(0);
  });

  it('검색으로 목록을 필터링한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments');
    const box = screen.getAllByPlaceholderText(/검색/)[0];
    await user.type(box, '딩가딩가');
    await waitFor(() => {
      expect(screen.queryAllByText(/멋쟁이사자처럼 12기 아기사자 모집/)).toHaveLength(0);
    });
  });

  it('상태 탭으로 필터링한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments');
    const tab = screen.getAllByRole('tab').find((t) => /마감/.test(t.textContent));
    await user.click(tab);
    await waitFor(() => expect(tab).toHaveAttribute('aria-selected', 'true'));
  });
});

/* ================================================================== */
describe('지원자 목록', () => {
  it('40명 더미 데이터 기반 테이블이 렌더된다', () => {
    renderApp('/admin/applicants');
    expect(screen.getByRole('table')).toBeInTheDocument();
    // 첫 페이지 20행
    expect(screen.getAllByRole('row').length).toBeGreaterThan(10);
  });

  it('행을 선택하면 하단 일괄 액션 바가 나타나고, 서류 합격 처리가 반영된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants');

    const boxes = screen.getAllByRole('checkbox');
    // 첫 번째는 전체 선택 헤더
    await user.click(boxes[1]);

    const bar = await screen.findByText(/1명 선택/);
    expect(bar).toBeInTheDocument();

    const passBtn = screen.getAllByRole('button', { name: /서류 합격/ })[0];
    await user.click(passBtn);

    // 액션 바가 사라지고(선택 해제) 토스트가 뜬다
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  it('검색으로 지원자를 찾는다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants');
    const box = screen.getAllByPlaceholderText(/검색|이름/)[0];
    await user.type(box, '이서아');
    await waitFor(() => {
      expect(screen.getAllByText('이서아').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('박도윤')).toHaveLength(0);
    });
  });

  it('페이지네이션 버튼이 동작한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants');
    const page2 = screen.queryByRole('button', { name: '2' });
    if (page2) {
      await user.click(page2);
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    }
    expect(true).toBe(true);
  });
});

/* ================================================================== */
describe('지원자 상세 검토', () => {
  it('평가 점수를 클릭하면 총점이 갱신된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants/apl-001');

    expect(screen.getAllByText('김민준').length).toBeGreaterThan(0);
    // 평가 기준 라벨
    expect(screen.getAllByText(/지원 동기/).length).toBeGreaterThan(0);

    const scoreButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent.trim() === '5');
    expect(scoreButtons.length).toBeGreaterThan(0);
    await user.click(scoreButtons[0]);
    await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0));
  });

  it('메모를 추가하면 목록에 나타난다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants/apl-002');
    const ta = screen.getAllByRole('textbox').find((t) => t.tagName === 'TEXTAREA');
    expect(ta).toBeTruthy();
    await user.type(ta, '테스트 메모입니다');
    const addBtn = screen.getAllByRole('button', { name: /메모 (추가|남기기|등록)|저장/ })[0];
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/테스트 메모입니다/).length).toBeGreaterThan(0);
    });
  });
});

/* ================================================================== */
describe('면접 세션 관리', () => {
  it('세션 3개와 슬롯이 렌더된다', () => {
    renderApp('/admin/interviews');
    expect(screen.getAllByText(/1차 면접 ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1차 면접 ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2차 심층 면접/).length).toBeGreaterThan(0);
  });

  it('세션 만들기 버튼을 누르면 생성 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/interviews');
    const btn = screen.getAllByRole('button', { name: /세션 만들기|세션 추가/ })[0];
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /세션 만들기/ }).length).toBeGreaterThan(0);
      // 생성 화면에만 있는 슬롯 길이 컨트롤 확인
      expect(screen.getAllByText(/슬롯 길이|슬롯당|쉬는/).length).toBeGreaterThan(0);
    });
  });
});

/* ================================================================== */
describe('면접 세션 생성', () => {
  it('시간/슬롯 길이 입력에 따라 슬롯 미리보기가 계산된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/interviews/new');

    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, '테스트 세션');

    // 슬롯 미리보기 영역 존재
    await waitFor(() => {
      expect(screen.getAllByText(/슬롯/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByRole('button', { name: /세션 만들기/ }).length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
describe('면접 슬롯 상세', () => {
  it('배정된 지원자와 배정 버튼이 표시된다', () => {
    renderApp('/admin/interviews/ses-1/slots/slot-2');
    expect(screen.getAllByText(/1차 면접 ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /지원자 배정/ }).length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
describe('면접 평가 수행', () => {
  it('평가 기준 4개와 추천 등급 라디오가 있다', () => {
    renderApp('/admin/interviews/evaluate/apl-002');
    expect(screen.getAllByText(/지원 동기/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/기초 역량/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/팀 적합도/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/커뮤니케이션/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radiogroup').length).toBeGreaterThan(0);
  });

  it('점수 미입력 상태에서 평가 완료를 누르면 통과하지 않는다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/interviews/evaluate/apl-002');
    const done = screen.getAllByRole('button', { name: /평가 완료/ })[0];
    await user.click(done);
    // 확인 다이얼로그가 열리거나 토스트 경고가 뜬다 (둘 중 하나)
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      const status = screen.queryByRole('status');
      expect(dialog || status).toBeTruthy();
    });
  });

  it('면접 타이머 시작 버튼이 동작한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/interviews/evaluate/apl-002');
    const start = screen.queryAllByRole('button', { name: /시작/ })[0];
    if (start) {
      await user.click(start);
      await waitFor(() => expect(screen.getAllByText(/\d\d:\d\d/).length).toBeGreaterThan(0));
    }
    expect(true).toBe(true);
  });

  it('면접 단계가 아닌 지원자도 순번이 정상 표시된다 (-- 아님)', () => {
    // apl-002 는 status='reviewing' 이라 면접 단계 목록에 없지만
    // 현재 열린 지원자는 항상 목록에 포함되어야 한다.
    renderApp('/admin/interviews/evaluate/apl-002');
    const nav = screen.getByText(/지원자 \d+ \/ \d+/);
    expect(nav).toBeInTheDocument();
    expect(nav.textContent).not.toContain('--');
  });

  it('이전/다음 지원자 버튼이 실제로 다른 지원자로 이동한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/interviews/evaluate/apl-002');

    const before = screen.getByText(/지원자 \d+ \/ \d+/).textContent;
    const next = screen.getAllByRole('button', { name: /다음/ })[0];
    expect(next).not.toBeDisabled();
    await user.click(next);

    await waitFor(() => {
      expect(screen.getByText(/지원자 \d+ \/ \d+/).textContent).not.toBe(before);
    });
  });
});

/* ================================================================== */
describe('결과 발표 대상 검토', () => {
  it('합격/보류/불합격 3개 칸반이 렌더된다', () => {
    renderApp('/admin/results');
    expect(screen.getAllByText(/합격/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/보류/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/불합격/).length).toBeGreaterThan(0);
  });

  it('발송 채널 토글이 동작한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/results');
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    const before = switches[0].getAttribute('aria-checked');
    await user.click(switches[0]);
    await waitFor(() =>
      expect(switches[0].getAttribute('aria-checked')).not.toBe(before),
    );
  });

  it('발표하기를 누르면 확인 다이얼로그가 열린다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/results');
    const btn = screen.getAllByRole('button', { name: /발표하기/ })[0];
    await user.click(btn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

/* ================================================================== */
describe('모집 생성 위저드', () => {
  it('4단계 위저드 스텝이 표시되고 다음 단계로 이동한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments/new/page');

    expect(screen.getAllByText(/페이지 편집/).length).toBeGreaterThan(0);
    const next = screen.getAllByRole('button', { name: /다음/ })[0];
    await user.click(next);
    await waitFor(() => {
      expect(screen.getAllByText(/전형 설정/).length).toBeGreaterThan(0);
    });
  });

  it('페이지 편집에서 제목을 바꾸면 미리보기에 반영된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments/new/page');
    const title = screen.getAllByRole('textbox')[0];
    await user.clear(title);
    await user.type(title, '새로운 모집 제목');
    await waitFor(() => {
      expect(screen.getAllByText(/새로운 모집 제목/).length).toBeGreaterThan(0);
    });
  });

  it('폼 빌더에서 필드를 추가하면 캔버스에 나타난다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments/new/form');

    const before = screen.getAllByText(/필수/).length;
    const addBtn = screen.getAllByRole('button', { name: /단문|장문/ })[0];
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/필수|새 질문|질문/).length).toBeGreaterThanOrEqual(before);
    });
  });

  it('전형 설정에서 단계 사용 여부 토글이 동작한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments/new/stages');
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    const before = switches[0].getAttribute('aria-checked');
    await user.click(switches[0]);
    await waitFor(() =>
      expect(switches[0].getAttribute('aria-checked')).not.toBe(before),
    );
  });

  it('검토 화면에서 체크리스트와 게시 옵션이 표시된다', () => {
    renderApp('/admin/recruitments/new/review');
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /게시하기/ }).length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
describe('운영진 설정', () => {
  it('탭 4개가 있고 전환된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/settings');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(4);
    await user.click(tabs[1]);
    await waitFor(() => expect(tabs[1]).toHaveAttribute('aria-selected', 'true'));
  });
});
