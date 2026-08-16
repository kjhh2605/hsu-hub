import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AppProvider } from '../store/AppContext.jsx';
import { STORAGE_KEY, initialState } from '../store/logic.js';

function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>
  );
}

/** 로그인 + 프로필 완료 상태를 미리 심어 인증 화면을 바로 열 수 있게 함 */
function seedLoggedIn(patch = {}) {
  const s = initialState();
  s.auth = { loggedIn: true, provider: 'kakao', redirectTo: null };
  s.user = { ...s.user, profileComplete: true, ...(patch.user ?? {}) };
  delete s.toasts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

const seedAdmin = () => seedLoggedIn({ user: { role: 'admin' } });

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('공개 라우팅', () => {
  it('/ 는 탐색 화면으로 리다이렉트된다', async () => {
    mount('/');
    expect(await screen.findByText('동아리 탐색')).toBeTruthy();
    expect(screen.getByText('크리에이티브 메이커스')).toBeTruthy();
  });

  it('탐색에서 카테고리 필터가 목록을 줄인다', async () => {
    mount('/explore');
    await screen.findByText('동아리 탐색');
    expect(screen.getByText('중앙밴드 딩가딩가')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'IT/개발' }));
    expect(screen.queryByText('중앙밴드 딩가딩가')).toBeNull();
    expect(screen.getByText('크리에이티브 메이커스')).toBeTruthy();
  });

  it('탐색 검색이 동작한다', async () => {
    mount('/explore');
    await screen.findByText('동아리 탐색');
    fireEvent.change(screen.getByLabelText('동아리 검색'), { target: { value: '사진' } });
    expect(screen.getByText('사진동아리 찰칵')).toBeTruthy();
    expect(screen.queryByText('크리에이티브 메이커스')).toBeNull();
  });

  it('동아리 상세가 렌더되고 FAQ 아코디언이 열린다', async () => {
    mount('/clubs/c-cm');
    expect(await screen.findByText('Club Details')).toBeTruthy();
    expect(screen.getByText('동아리 혜택')).toBeTruthy();
    expect(screen.getByText('주요 활동 일정')).toBeTruthy();
    // 첫 FAQ 는 기본 펼침 상태
    expect(screen.getByText(/기초 트랙을 운영하며/)).toBeTruthy();
    const faq1 = screen.getByText(/비전공자나 노베이스도 지원 가능한가요/);
    fireEvent.click(faq1);
    expect(screen.queryByText(/기초 트랙을 운영하며/)).toBeNull();
    fireEvent.click(screen.getByText(/매주 정기 모임은 언제 진행되나요/));
    expect(screen.getByText(/매주 수요일 저녁 7시/)).toBeTruthy();
  });

  it('없는 동아리는 안내 화면을 보여준다', async () => {
    mount('/clubs/no-such');
    expect(await screen.findByText('동아리를 찾을 수 없습니다')).toBeTruthy();
  });

  it('존재하지 않는 경로는 404 화면', async () => {
    mount('/zzz');
    expect(await screen.findByText('존재하지 않는 화면입니다')).toBeTruthy();
  });
});

describe('인증 가드', () => {
  it('비로그인 상태에서 /applications 접근 시 로그인 화면으로 이동', async () => {
    mount('/applications');
    expect(await screen.findByText('CampusConnect')).toBeTruthy();
    expect(screen.getByText('카카오로 시작하기')).toBeTruthy();
  });

  it('로그인 후 프로필이 미완성이면 온보딩으로 이동한다', async () => {
    mount('/login');
    fireEvent.click(await screen.findByText('카카오로 시작하기'));
    expect(await screen.findByText('프로필 설정')).toBeTruthy();
    expect(screen.getByText('자동 완성 안내')).toBeTruthy();
  });

  it('온보딩 검증 실패 시 에러가 표시된다', async () => {
    mount('/login');
    fireEvent.click(await screen.findByText('카카오로 시작하기'));
    await screen.findByText('프로필 설정');
    fireEvent.change(screen.getByLabelText(/학번/), { target: { value: '12' } });
    fireEvent.click(screen.getByText('저장하고 계속하기'));
    expect(await screen.findByText('학번은 숫자 8~9자리입니다.')).toBeTruthy();
  });

  it('온보딩 완료 후 탐색 화면으로 진입한다', async () => {
    mount('/login');
    fireEvent.click(await screen.findByText('카카오로 시작하기'));
    await screen.findByText('프로필 설정');
    fireEvent.click(screen.getByText('저장하고 계속하기'));
    expect(await screen.findByText('동아리 탐색')).toBeTruthy();
  });
});

describe('내 지원 현황 / 지원서 상세', () => {
  beforeEach(seedLoggedIn);

  it('지원 목록에 3건의 더미 지원이 상태별로 표시된다', async () => {
    mount('/applications');
    expect(await screen.findByText('나의 지원 현황')).toBeTruthy();
    expect(screen.getByText('크리에이티브 메이커스')).toBeTruthy();
    expect(screen.getByText('중앙밴드 딩가딩가')).toBeTruthy();
    expect(screen.getByText('사진동아리 찰칵')).toBeTruthy();
    expect(screen.getByText('면접 예약 대기')).toBeTruthy();
    expect(screen.getByText('서류 평가중')).toBeTruthy();
    expect(screen.getByText('최종 합격')).toBeTruthy();
  });

  it('서류 합격 카드에 면접 예약 CTA 가 노출된다', async () => {
    mount('/applications');
    await screen.findByText('나의 지원 현황');
    expect(screen.getByText('면접 시간 선택하기')).toBeTruthy();
  });

  it('지원서 상세가 문항/포트폴리오와 함께 렌더된다', async () => {
    mount('/applications/app-1');
    expect(await screen.findByText('제출 지원서')).toBeTruthy();
    expect(screen.getByText('지원 문항')).toBeTruthy();
    expect(screen.getByText('포트폴리오')).toBeTruthy();
    expect(screen.getByText('2025_김캠퍼_포트폴리오.pdf')).toBeTruthy();
  });

  it('면접 단계 지원서는 수정 버튼이 없다 (정책 반영)', async () => {
    mount('/applications/app-1');
    await screen.findByText('제출 지원서');
    expect(screen.queryByText('수정')).toBeNull();
  });

  it('서류 검토 중 지원서는 수정 모드로 전환된다', async () => {
    mount('/applications/app-2');
    await screen.findByText('제출 지원서');
    fireEvent.click(screen.getByText('수정'));
    expect(screen.getByText('저장')).toBeTruthy();
  });

  it('최종 합격 지원은 취소 불가 사유가 안내된다', async () => {
    mount('/applications/app-3');
    await screen.findByText('제출 지원서');
    expect(screen.getByText('결과가 발표된 지원은 취소할 수 없습니다.')).toBeTruthy();
  });
});

describe('면접 예약 흐름', () => {
  beforeEach(seedLoggedIn);

  it('예약 화면에 오전/오후 슬롯과 마감 표시가 나온다', async () => {
    mount('/applications/app-1/interview/pick');
    expect(await screen.findByText(/면접 시간을/)).toBeTruthy();
    expect(screen.getByText('오전')).toBeTruthy();
    expect(screen.getByText('오후')).toBeTruthy();
    expect(screen.getByText('10:00 - 10:30')).toBeTruthy();
    expect(screen.getByText('마감')).toBeTruthy(); // 정원 4/4 슬롯
  });

  it('슬롯 선택 후 예약하면 확정 화면으로 이동한다', async () => {
    mount('/applications/app-1/interview/pick');
    await screen.findByText(/면접 시간을/);
    fireEvent.click(screen.getByText('16:30 - 17:00'));
    fireEvent.click(screen.getByText('예약 확정하기'));
    expect(await screen.findByText('예약이 완료되었습니다!')).toBeTruthy();
    expect(screen.getByText('면접 팁')).toBeTruthy();
  });

  it('서류 검토 중인 지원은 예약이 차단된다', async () => {
    mount('/applications/app-2/interview/pick');
    expect(await screen.findByText('면접 예약을 할 수 없습니다')).toBeTruthy();
    expect(screen.getByText('서류 합격자만 면접을 예약할 수 있습니다.')).toBeTruthy();
  });

  it('예약이 없으면 예약 상세 화면이 안내를 보여준다', async () => {
    mount('/applications/app-1/interview');
    expect(await screen.findByText('예약된 면접이 없습니다')).toBeTruthy();
  });

  it('예약 후 예약 상세에서 변경/취소가 노출된다', async () => {
    mount('/applications/app-1/interview/pick');
    await screen.findByText(/면접 시간을/);
    fireEvent.click(screen.getByText('16:30 - 17:00'));
    fireEvent.click(screen.getByText('예약 확정하기'));
    fireEvent.click(await screen.findByText('예약 상세 보기'));
    expect(await screen.findByText('면접 예약이 확정되었습니다')).toBeTruthy();
    expect(screen.getByText('예약 변경')).toBeTruthy();
    expect(screen.getByText('예약 취소')).toBeTruthy();
    expect(screen.getByText('면접 유의사항')).toBeTruthy();
  });
});

describe('지원서 작성 3단계 흐름', () => {
  beforeEach(seedLoggedIn);

  it('중복 지원은 차단되고 기존 지원서로 연결된다', async () => {
    mount('/apply/r-cm-12');
    expect(await screen.findByText('지원할 수 없습니다')).toBeTruthy();
    expect(screen.getByText(/중복 지원 제한/)).toBeTruthy();
  });

  it('마감된 모집은 지원 화면에서 차단된다', async () => {
    mount('/apply/r-photo-24');
    expect(await screen.findByText('지원할 수 없습니다')).toBeTruthy();
    expect(screen.getByText('모집이 마감되었습니다.')).toBeTruthy();
  });

  it('1→2→3 단계를 거쳐 제출하면 완료 화면이 나온다', async () => {
    mount('/apply/r-algo-32');
    expect(await screen.findByText('기본 정보 확인')).toBeTruthy();

    // step 1 (프로필에서 자동 채움) → 다음
    fireEvent.click(screen.getByText('다음 단계'));
    expect(await screen.findByText('지원 분야 선택')).toBeTruthy();

    // 필수 미입력 상태로 진행 시 에러
    fireEvent.click(screen.getByText('다음 단계'));
    expect(await screen.findByText('지원 분야를 선택해주세요.')).toBeTruthy();

    // 분야 + 문항 작성
    fireEvent.click(screen.getByText('입문 트랙'));
    const ta = document.querySelector('textarea');
    fireEvent.change(ta, { target: { value: '기초부터 꾸준히 학습하고 싶습니다.' } });
    fireEvent.click(screen.getByText('다음 단계'));

    // step 3 검토
    expect(await screen.findByText('답변 요약')).toBeTruthy();
    const submit = screen.getByText('최종 제출하기').closest('button');
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByText(/개인정보 수집 및 이용에 동의/));
    fireEvent.click(screen.getByText('최종 제출하기'));

    expect(await screen.findByText('지원이 완료되었습니다!')).toBeTruthy();
    expect(screen.getByText('향후 일정 안내')).toBeTruthy();
  });
});

describe('알림', () => {
  beforeEach(seedLoggedIn);

  it('알림 목록이 렌더되고 모두 읽음이 동작한다', async () => {
    mount('/notifications');
    expect(await screen.findByText('새로운 소식')).toBeTruthy();
    expect(screen.getByText('면접 예약 안내')).toBeTruthy();
    fireEvent.click(screen.getByText('모두 읽음'));
    expect(screen.queryByText('모두 읽음')).toBeNull();
  });

  it('카테고리 필터가 목록을 좁힌다', async () => {
    mount('/notifications');
    await screen.findByText('새로운 소식');
    fireEvent.click(screen.getByRole('button', { name: '공지사항' }));
    expect(screen.getByText('프로필 완성도 안내')).toBeTruthy();
    expect(screen.queryByText('최종 합격 알림')).toBeNull();
  });

  it('면접 안내 알림을 누르면 예약 화면으로 이동한다', async () => {
    mount('/notifications');
    await screen.findByText('새로운 소식');
    fireEvent.click(screen.getByText('면접 예약 안내'));
    expect(await screen.findByText(/면접 시간을/)).toBeTruthy();
  });
});

describe('프로필 / 운영진 모드', () => {
  beforeEach(seedLoggedIn);

  it('프로필 화면에 통계와 메뉴가 렌더된다', async () => {
    mount('/profile');
    expect(await screen.findByText('김캠퍼')).toBeTruthy();
    expect(screen.getByText('가입 동아리')).toBeTruthy();
    expect(screen.getByText('내 정보 수정')).toBeTruthy();
    expect(screen.getByText('운영진 모드로 전환')).toBeTruthy();
  });

  it('운영진 모드로 전환하면 지원자 명단으로 이동한다', async () => {
    mount('/profile');
    await screen.findByText('김캠퍼');
    fireEvent.click(screen.getByText('운영진 모드로 전환'));
    expect(await screen.findByText('지원자 명단 관리')).toBeTruthy();
    expect(screen.getByText('김민준')).toBeTruthy();
  });

  it('지원자 모드에서는 운영진 라우트에 접근할 수 없다', async () => {
    mount('/admin/applicants');
    expect(await screen.findByText('김캠퍼')).toBeTruthy(); // /profile 로 리다이렉트
  });
});

describe('운영진 화면', () => {
  beforeEach(seedAdmin);

  it('명단 필터로 상태별 조회가 된다', async () => {
    mount('/admin/applicants');
    await screen.findByText('지원자 명단 관리');
    fireEvent.click(screen.getByRole('button', { name: '최종 합격' }));
    expect(screen.getByText('박도윤')).toBeTruthy();
    expect(screen.queryByText('최지우')).toBeNull();
  });

  it('지원자 검색이 동작한다', async () => {
    mount('/admin/applicants');
    await screen.findByText('지원자 명단 관리');
    fireEvent.change(screen.getByLabelText('지원자 검색'), { target: { value: '이서아' } });
    expect(screen.getByText('이서아')).toBeTruthy();
    expect(screen.queryByText('김민준')).toBeNull();
  });

  it('지원서 검토 화면에서 합격 처리 시 상태가 바뀐다', async () => {
    mount('/admin/applicants/app-o4'); // SUBMITTED
    expect(await screen.findByText('최지우')).toBeTruthy();
    expect(screen.getByText('지원서 답변')).toBeTruthy();
    fireEvent.click(screen.getByText('합격 (면접으로)'));
    fireEvent.click(await screen.findByText('확인'));
    expect(await screen.findByText('내부: 합격 예정')).toBeTruthy();
    expect(screen.getByText('공개: 면접 예약 대기')).toBeTruthy();
  });

  it('내부 메모를 저장할 수 있다', async () => {
    mount('/admin/applicants/app-o2');
    await screen.findByText('이서아');
    const ta = document.querySelector('textarea');
    fireEvent.change(ta, { target: { value: '2차 확인 필요' } });
    fireEvent.click(screen.getByText('저장하기'));
    expect(await screen.findByText('내부 평가 메모를 저장했습니다.')).toBeTruthy();
  });

  it('면접 세션 목록과 슬롯 예약률이 표시된다', async () => {
    mount('/admin/sessions');
    expect(await screen.findByText('면접 일정 현황')).toBeTruthy();
    expect(screen.getByText('12기 면접 1일차')).toBeTruthy();
    expect(screen.getByText('총 면접 슬롯')).toBeTruthy();
    expect(screen.getAllByText('4/4명').length).toBeGreaterThan(0); // 마감된 슬롯
  });

  it('슬롯 상세에서 예약자 명단과 출석 처리가 가능하다', async () => {
    mount('/admin/sessions/ses-cm-1-s4');
    expect(await screen.findByText('면접 슬롯 상세')).toBeTruthy();
    expect(screen.getByText('예약된 지원자')).toBeTruthy();
    expect(screen.getByText('김민준')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '출석' }));
    expect(await screen.findByText(/출석 상태: 출석/)).toBeTruthy();
  });
});

describe('운영진 결정 → 지원자 화면 연동', () => {
  it('운영진의 최종 합격 처리가 지원자 화면에 반영된다', async () => {
    seedAdmin();

    // 1) 운영진: 내 지원(app-1, 면접 단계)을 최종 합격 처리
    const first = mount('/admin/applicants/app-1');
    await screen.findByText('지원서 답변');
    fireEvent.click(screen.getByText('최종 합격'));
    fireEvent.click(await screen.findByText('확인'));
    await screen.findByText('공개: 최종 합격');
    first.unmount();

    // 2) 지원자 모드로 되돌린 뒤 지원 현황 확인
    const s2 = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(s2.applications.find((a) => a.id === 'app-1').status).toBe('FINAL_PASSED');
    s2.user.role = 'applicant';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s2));

    mount('/applications/app-1');
    expect(await screen.findByText('제출 지원서')).toBeTruthy();
    expect(screen.getByText('결과가 발표된 지원은 취소할 수 없습니다.')).toBeTruthy();
  });

  it('타 지원자 서류 합격 처리가 명단 상태에 반영된다', async () => {
    seedAdmin();
    const first = mount('/admin/applicants/app-o4'); // 최지우 · SUBMITTED
    await screen.findByText('최지우');
    fireEvent.click(screen.getByText('합격 (면접으로)'));
    fireEvent.click(await screen.findByText('확인'));
    await screen.findByText('공개: 면접 예약 대기');
    first.unmount();

    mount('/admin/applicants');
    await screen.findByText('지원자 명단 관리');
    fireEvent.click(screen.getByRole('button', { name: '면접 대기' }));
    expect(screen.getByText('최지우')).toBeTruthy();
  });
});
