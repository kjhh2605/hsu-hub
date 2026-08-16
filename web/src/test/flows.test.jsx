import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { StoreProvider, reducer, initialState, STORAGE_KEY } from '@/store/AppStore';

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
/* 리듀서 단위 검증                                                     */
/* ================================================================== */

describe('스토어 리듀서 · 지원자', () => {
  it('setApplicantStatus 가 여러 명을 한 번에 처리하고 라벨/톤도 갱신한다', () => {
    const s = reducer(initialState, {
      type: 'setApplicantStatus',
      ids: ['apl-001', 'apl-002', 'apl-003'],
      status: 'docPass',
    });
    ['apl-001', 'apl-002', 'apl-003'].forEach((id) => {
      const a = s.applicants.find((x) => x.id === id);
      expect(a.status).toBe('docPass');
      expect(a.statusLabel).toBe('서류 합격');
      expect(a.tone).toBe('mint');
    });
    expect(s.applicants.find((x) => x.id === 'apl-004').status).not.toBe('docPass');
  });

  it('toggleApplicantStar 가 즐겨찾기를 켜고 끈다', () => {
    let s = reducer(initialState, { type: 'toggleApplicantStar', id: 'apl-002' });
    const before = initialState.applicants.find((a) => a.id === 'apl-002').starred;
    expect(s.applicants.find((a) => a.id === 'apl-002').starred).toBe(!before);
    s = reducer(s, { type: 'toggleApplicantStar', id: 'apl-002' });
    expect(s.applicants.find((a) => a.id === 'apl-002').starred).toBe(before);
  });

  it('addApplicantMemo 가 메모를 추가하고 카운트를 올린다', () => {
    const before = initialState.applicants.find((a) => a.id === 'apl-002');
    const s = reducer(initialState, { type: 'addApplicantMemo', id: 'apl-002', text: '테스트 메모' });
    const after = s.applicants.find((a) => a.id === 'apl-002');
    expect(after.memoCount).toBe(before.memoCount + 1);
    expect(after.memos.at(-1).text).toBe('테스트 메모');
    expect(after.memos.at(-1).author).toBe(initialState.admin.name);
  });

  it('setApplicantScore 가 개별 평가 항목만 바꾼다', () => {
    const s = reducer(initialState, { type: 'setApplicantScore', id: 'apl-001', criterion: 'fit', value: 5 });
    const a = s.applicants.find((x) => x.id === 'apl-001');
    expect(a.scores.fit).toBe(5);
    expect(a.scores.motivation).toBe(initialState.applicants[0].scores.motivation);
  });
});

describe('스토어 리듀서 · 면접', () => {
  it('createSession / addSlot / assign / remove / deleteSlot / deleteSession 전체 흐름', () => {
    const session = { id: 'ses-test', name: '테스트', date: '2099-04-01', slots: [], status: 'open', interviewers: [] };
    let s = reducer(initialState, { type: 'createSession', session });
    expect(s.sessions.find((x) => x.id === 'ses-test')).toBeTruthy();

    s = reducer(s, {
      type: 'addSlot',
      sessionId: 'ses-test',
      slot: { id: 'sl-1', start: '10:00', end: '10:30', capacity: 1, booked: 0, applicantIds: [] },
    });
    expect(s.sessions.find((x) => x.id === 'ses-test').slots).toHaveLength(1);

    s = reducer(s, { type: 'assignApplicantToSlot', sessionId: 'ses-test', slotId: 'sl-1', applicantId: 'apl-005' });
    const slot = s.sessions.find((x) => x.id === 'ses-test').slots[0];
    expect(slot.applicantIds).toContain('apl-005');
    expect(slot.booked).toBe(1);
    // 배정 시 지원자 상태도 '면접 예정' 으로 전이한다
    expect(s.applicants.find((a) => a.id === 'apl-005').status).toBe('interviewScheduled');

    s = reducer(s, { type: 'removeApplicantFromSlot', sessionId: 'ses-test', slotId: 'sl-1', applicantId: 'apl-005' });
    expect(s.sessions.find((x) => x.id === 'ses-test').slots[0].booked).toBe(0);

    s = reducer(s, { type: 'deleteSlot', sessionId: 'ses-test', slotId: 'sl-1' });
    expect(s.sessions.find((x) => x.id === 'ses-test').slots).toHaveLength(0);

    s = reducer(s, { type: 'deleteSession', id: 'ses-test' });
    expect(s.sessions.find((x) => x.id === 'ses-test')).toBeUndefined();
  });

  it('updateSession 이 상태만 바꾸고 슬롯은 보존한다', () => {
    const s = reducer(initialState, { type: 'updateSession', id: 'ses-1', patch: { status: 'closed' } });
    const ses = s.sessions.find((x) => x.id === 'ses-1');
    expect(ses.status).toBe('closed');
    expect(ses.slots).toHaveLength(initialState.sessions[0].slots.length);
  });

  it('assignApplicantToSlot 은 정원을 넘겨 booked 를 올리지 않는다', () => {
    // slot-1 은 capacity 1 / booked 1 (이미 만석)
    const s = reducer(initialState, {
      type: 'assignApplicantToSlot',
      sessionId: 'ses-1',
      slotId: 'slot-1',
      applicantId: 'apl-030',
    });
    const slot = s.sessions.find((x) => x.id === 'ses-1').slots.find((sl) => sl.id === 'slot-1');
    expect(slot.booked).toBe(1);
  });

  it('saveEvaluation 이 면접 점수를 100점으로 환산하고 상태를 전이한다', () => {
    const s = reducer(initialState, {
      type: 'saveEvaluation',
      applicantId: 'apl-002',
      payload: {
        scores: { motivation: 5, skill: 4, fit: 5, communication: 4 },
        recommendation: 'pass',
        notes: '좋음',
      },
    });
    const a = s.applicants.find((x) => x.id === 'apl-002');
    expect(a.status).toBe('interviewDone');
    expect(a.interviewScore).toBe(90); // (18/20)*100
    expect(s.evaluations['apl-002'].recommendation).toBe('pass');
    expect(s.evaluations['apl-002'].submittedAt).toBeTruthy();
  });
});

describe('스토어 리듀서 · 모집', () => {
  it('publishRecruitment 가 새 공고와 폼 스키마를 함께 등록한다', () => {
    const before = initialState.recruitments.length;
    const s = reducer(initialState, { type: 'publishRecruitment', mode: 'now' });
    expect(s.recruitments).toHaveLength(before + 1);
    expect(s.recruitments[0].status).toBe('open');
    expect(s.recruitments[0].title).toBe(initialState.recruitmentDraft.title);
    expect(s.formSchemas[s.recruitments[0].id].steps).toHaveLength(
      initialState.recruitmentDraft.formSteps.length,
    );
    expect(s.recruitmentDraft.published).toBe(true);
  });

  it('예약 게시는 status 를 scheduled 로 만든다', () => {
    const s = reducer(initialState, { type: 'publishRecruitment', mode: 'schedule' });
    expect(s.recruitments[0].status).toBe('scheduled');
  });

  it('비활성 전형 단계는 게시된 공고에 포함되지 않는다', () => {
    let s = reducer(initialState, {
      type: 'patchRecruitmentStage',
      id: 'st3',
      patch: { enabled: false },
    });
    s = reducer(s, { type: 'publishRecruitment', mode: 'now' });
    expect(s.recruitments[0].stages.map((x) => x.id)).not.toContain('st3');
  });

  it('복제/상태변경/삭제가 동작한다', () => {
    let s = reducer(initialState, { type: 'duplicateRecruitment', id: 'rec-likelion-12' });
    expect(s.recruitments[0].title).toMatch(/복사/);
    expect(s.recruitments[0].status).toBe('draft');
    expect(s.recruitments[0].applicantCount).toBe(0);

    s = reducer(s, { type: 'setRecruitmentStatus', id: 'rec-likelion-12', status: 'closed' });
    expect(s.recruitments.find((r) => r.id === 'rec-likelion-12').status).toBe('closed');

    const n = s.recruitments.length;
    s = reducer(s, { type: 'deleteRecruitment', id: 'rec-likelion-12' });
    expect(s.recruitments).toHaveLength(n - 1);
  });

  it('setFormSteps 가 폼 빌더 결과를 저장한다', () => {
    const steps = [{ id: 'x', title: '단일 스텝', fields: [{ id: 'f1', type: 'text', label: '이름' }] }];
    const s = reducer(initialState, { type: 'setFormSteps', steps });
    expect(s.recruitmentDraft.formSteps).toEqual(steps);
  });
});

describe('스토어 리듀서 · 결과 발표', () => {
  it('moveResultTarget 은 대상을 중복 없이 이동시킨다', () => {
    const id = initialState.resultBatch.passIds[0];
    const s = reducer(initialState, { type: 'moveResultTarget', id, to: 'fail' });
    expect(s.resultBatch.passIds).not.toContain(id);
    expect(s.resultBatch.failIds).toContain(id);
    expect(s.resultBatch.holdIds).not.toContain(id);
  });

  it('publishResults 가 합격/불합격 대상 상태를 실제로 반영한다', () => {
    const s = reducer(initialState, { type: 'publishResults', mode: 'now' });
    expect(s.resultBatch.status).toBe('published');
    initialState.resultBatch.failIds.forEach((id) => {
      expect(s.applicants.find((a) => a.id === id).status).toBe('docFail');
    });
    initialState.resultBatch.passIds.forEach((id) => {
      expect(['docPass', 'finalPass']).toContain(s.applicants.find((a) => a.id === id).status);
    });
  });

  it('patchResultBatch 로 문구와 채널을 수정한다', () => {
    const s = reducer(initialState, {
      type: 'patchResultBatch',
      patch: { passTemplate: '축하합니다 {이름}님', channels: { push: false, email: true, kakao: true } },
    });
    expect(s.resultBatch.passTemplate).toBe('축하합니다 {이름}님');
    expect(s.resultBatch.channels.kakao).toBe(true);
  });
});

describe('스토어 리듀서 · 알림 / 설정 / 운영진', () => {
  it('알림 읽음/전체읽음/삭제', () => {
    let s = reducer(initialState, { type: 'readNotification', id: 'n1' });
    expect(s.notifications.find((n) => n.id === 'n1').read).toBe(true);
    s = reducer(s, { type: 'readAllNotifications' });
    expect(s.notifications.every((n) => n.read)).toBe(true);
    const len = s.notifications.length;
    s = reducer(s, { type: 'deleteNotification', id: 'n3' });
    expect(s.notifications).toHaveLength(len - 1);
  });

  it('setSetting 이 설정값을 저장한다', () => {
    const s = reducer(initialState, { type: 'setSetting', key: 'notifyNewApplication', value: false });
    expect(s.settings.notifyNewApplication).toBe(false);
  });

  it('운영진 초대 / 권한 변경 / 제거', () => {
    let s = reducer(initialState, { type: 'inviteMember', email: 'new@campus.ac.kr', role: 'reviewer' });
    const added = s.members.at(-1);
    expect(added.email).toBe('new@campus.ac.kr');
    expect(added.pending).toBe(true);

    s = reducer(s, { type: 'setMemberRole', id: 'm-3', role: 'manager' });
    expect(s.members.find((m) => m.id === 'm-3').role).toBe('manager');

    const n = s.members.length;
    s = reducer(s, { type: 'removeMember', id: 'm-5' });
    expect(s.members).toHaveLength(n - 1);
  });

  it('patchClub 이 동아리 정보를 수정한다', () => {
    const s = reducer(initialState, { type: 'patchClub', patch: { name: '새 이름' } });
    expect(s.club.name).toBe('새 이름');
  });
});

/* ================================================================== */
/* 화면 간 플로우 (UI 조작 → 상태 반영)                                 */
/* ================================================================== */

describe('E2E: 지원자 일괄 처리', () => {
  it('2명 선택 → 서류 합격 처리하면 상태 배지가 바뀐다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants');

    const boxes = screen.getAllByRole('checkbox');
    await user.click(boxes[1]);
    await user.click(boxes[2]);

    expect(await screen.findByText(/2명 선택/)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /서류 합격/ })[0]);

    await waitFor(() => {
      expect(screen.getAllByText('서류 합격').length).toBeGreaterThan(0);
      expect(screen.queryByText(/2명 선택/)).not.toBeInTheDocument();
    });
  });
});

describe('E2E: 모집 생성 위저드 4단계 통과 → 게시', () => {
  it('페이지 편집 → 전형 설정 → 폼 빌더 → 검토에서 게시까지 이동한다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/recruitments/new/page');

    await user.click(screen.getAllByRole('button', { name: /^다음/ })[0]);
    await waitFor(() => expect(screen.getAllByText(/전형 설정/).length).toBeGreaterThan(0));

    await user.click(screen.getAllByRole('button', { name: /^다음/ })[0]);
    await waitFor(() => expect(screen.getAllByText(/폼 빌더/).length).toBeGreaterThan(0));

    await user.click(screen.getAllByRole('button', { name: /^다음/ })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /게시하기/ }).length).toBeGreaterThan(0),
    );
  });
});

describe('E2E: 알림 패널', () => {
  it('헤더 알림 버튼을 열고 모두 읽음 처리하면 배지가 사라진다', async () => {
    const user = userEvent.setup();
    renderApp('/admin');

    const bell = screen.getByRole('button', { name: /알림 3건 읽지 않음/ });
    await user.click(bell);

    const panel = await screen.findByRole('dialog', { name: '알림 목록' });
    expect(panel).toBeInTheDocument();
    expect(screen.getAllByText(/미검토 지원서가 5건 남았습니다/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /모두 읽음/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument();
    });
  });

  it('알림을 삭제하면 목록에서 사라진다', async () => {
    const user = userEvent.setup();
    renderApp('/admin');
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await screen.findByRole('dialog', { name: '알림 목록' });

    const del = screen.getByRole('button', { name: /미검토 지원서가 5건 남았습니다 삭제/ });
    await user.click(del);

    await waitFor(() => {
      expect(screen.queryByText(/미검토 지원서가 5건 남았습니다/)).not.toBeInTheDocument();
    });
  });
});

describe('E2E: 상태 영속화', () => {
  it('지원자 상태를 바꾸면 localStorage 에 저장된다', async () => {
    const user = userEvent.setup();
    renderApp('/admin/applicants');

    // '미검토' 로 필터링해 선택 대상이 확실히 pending 이 되게 한다
    await user.click(screen.getAllByRole('button', { name: /미검토/ })[0]);
    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));

    const before = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    const beforePending = (before.applicants ?? initialState.applicants).filter(
      (a) => a.status === 'pending',
    ).length;

    await user.click(screen.getAllByRole('checkbox')[1]);
    await user.click(screen.getAllByRole('button', { name: /서류 합격/ })[0]);

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw);
      // 미검토 1건이 줄어들었다
      expect(parsed.applicants.filter((a) => a.status === 'pending')).toHaveLength(
        beforePending - 1,
      );
    });
  });

  it('저장된 상태가 있으면 새 세션에서 복원된다', async () => {
    const seeded = {
      ...initialState,
      club: { ...initialState.club, name: '복원된 동아리명' },
      ui: { toasts: [] },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    renderApp('/admin/settings');
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('복원된 동아리명').length).toBeGreaterThan(0);
    });
  });
});
