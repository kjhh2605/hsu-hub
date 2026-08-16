import { describe, expect, it } from 'vitest';
import { reducer } from '../store/reducer.js';
import * as L from '../store/logic.js';
import { AppStatus, InternalStatus, stepProgress } from '../data/constants.js';

const base = () => L.initialState();

const draft = {
  name: '김캠퍼',
  department: '경영학과',
  studentId: '20231234',
  phone: '010-1234-5678',
  fieldId: 'f-beginner',
  answers: { q1: '알고리즘을 꾸준히 공부하고 싶습니다.' },
  agree: true,
};

describe('지원 가능 여부 (중복/마감)', () => {
  it('이미 지원한 모집에는 다시 지원할 수 없다', () => {
    const s = base();
    const guard = L.canApply(s, 'r-cm-12'); // seed: app-1 이 이미 존재
    expect(guard.ok).toBe(false);
    expect(guard.existing?.id).toBe('app-1');
  });

  it('마감된 모집에는 지원할 수 없다', () => {
    const s = base();
    const guard = L.canApply(s, 'r-photo-24'); // closeAt 이 과거
    expect(guard.ok).toBe(false);
    expect(guard.reason).toMatch(/마감/);
  });

  it('미지원 + 진행 중 모집은 지원 가능하다', () => {
    const s = base();
    expect(L.canApply(s, 'r-algo-32').ok).toBe(true);
  });
});

describe('지원서 제출', () => {
  it('제출 시 SUBMITTED 상태의 지원서와 알림이 생성된다', () => {
    const s0 = base();
    const before = s0.notifications.length;
    const s1 = reducer(s0, {
      type: 'SUBMIT_APPLICATION',
      recruitmentId: 'r-algo-32',
      clubId: 'c-algo',
      draft,
    });
    const created = L.applicationForRecruitment(s1, 'r-algo-32');
    expect(created).toBeTruthy();
    expect(created.status).toBe(AppStatus.SUBMITTED);
    expect(created.internalStatus).toBe(InternalStatus.UNREVIEWED);
    expect(created.fieldId).toBe('f-beginner');
    expect(s1.notifications.length).toBe(before + 1);
    expect(s1.notifications[0].applicationId).toBe(created.id);
  });

  it('제출 후 해당 모집의 임시저장 초안이 삭제된다', () => {
    let s = base();
    s = reducer(s, { type: 'SAVE_DRAFT', recruitmentId: 'r-algo-32', draft });
    expect(s.drafts['r-algo-32']).toBeTruthy();
    s = reducer(s, { type: 'SUBMIT_APPLICATION', recruitmentId: 'r-algo-32', clubId: 'c-algo', draft });
    expect(s.drafts['r-algo-32']).toBeUndefined();
  });

  it('제출 후에는 중복 지원이 차단된다', () => {
    let s = base();
    s = reducer(s, { type: 'SUBMIT_APPLICATION', recruitmentId: 'r-algo-32', clubId: 'c-algo', draft });
    expect(L.canApply(s, 'r-algo-32').ok).toBe(false);
  });
});

describe('수정 / 취소 정책', () => {
  it('allowEdit=true & 서류 단계면 수정 가능', () => {
    const s = base();
    const app = L.getApplication(s, 'app-2'); // DOC_REVIEW, r-band-34(allowEdit true)
    expect(L.canEditApplication(s, app).ok).toBe(true);
  });

  it('면접 단계 진입 후에는 수정 불가', () => {
    const s = base();
    const app = L.getApplication(s, 'app-1'); // DOC_PASSED
    expect(L.canEditApplication(s, app).ok).toBe(false);
  });

  it('결과 발표된 지원은 취소 불가', () => {
    const s = base();
    const app = L.getApplication(s, 'app-3'); // FINAL_PASSED
    expect(L.canCancelApplication(s, app).ok).toBe(false);
  });

  it('취소하면 CANCELED 로 바뀌고 목록에서 제외된다', () => {
    let s = base();
    s = reducer(s, { type: 'CANCEL_APPLICATION', id: 'app-2' });
    expect(L.getApplication(s, 'app-2').status).toBe(AppStatus.CANCELED);
    expect(L.myApplications(s).some((a) => a.id === 'app-2')).toBe(false);
  });
});

describe('면접 예약 규칙', () => {
  it('서류 합격자만 예약할 수 있다', () => {
    const s = base();
    expect(L.canBookInterview(s, L.getApplication(s, 'app-1')).ok).toBe(true);
    expect(L.canBookInterview(s, L.getApplication(s, 'app-2')).ok).toBe(false);
  });

  it('정원이 찬 슬롯은 full 로 판정된다', () => {
    const s = base();
    const full = L.findSlot(s, 'ses-cm-1-s1'); // reserved 4 / capacity 4
    expect(L.slotIsFull(s, full)).toBe(true);
    expect(L.slotRemaining(s, full)).toBe(0);
  });

  it('타 지원자 예약이 슬롯 인원에 반영된다', () => {
    const s = base();
    const slot = L.findSlot(s, 'ses-cm-1-s4'); // reserved 1 + app-o1
    expect(L.slotBooked(s, slot)).toBe(2);
    expect(L.slotRemaining(s, slot)).toBe(2);
  });

  it('예약하면 INTERVIEW_SCHEDULED 로 바뀌고 잔여석이 줄어든다', () => {
    let s = base();
    const before = L.slotRemaining(s, L.findSlot(s, 'ses-cm-1-s6'));
    s = reducer(s, { type: 'BOOK_SLOT', appId: 'app-1', slotId: 'ses-cm-1-s6' });
    const app = L.getApplication(s, 'app-1');
    expect(app.status).toBe(AppStatus.INTERVIEW_SCHEDULED);
    expect(app.interviewSlotId).toBe('ses-cm-1-s6');
    expect(L.slotRemaining(s, L.findSlot(s, 'ses-cm-1-s6'))).toBe(before - 1);
  });

  it('재예약하면 이전 슬롯 좌석이 반환된다', () => {
    let s = base();
    s = reducer(s, { type: 'BOOK_SLOT', appId: 'app-1', slotId: 'ses-cm-1-s6' });
    const afterFirst = L.slotRemaining(s, L.findSlot(s, 'ses-cm-1-s6'));
    s = reducer(s, { type: 'BOOK_SLOT', appId: 'app-1', slotId: 'ses-cm-2-s1' });
    expect(L.slotRemaining(s, L.findSlot(s, 'ses-cm-1-s6'))).toBe(afterFirst + 1);
    expect(L.getApplication(s, 'app-1').interviewSlotId).toBe('ses-cm-2-s1');
  });

  it('예약 취소 시 DOC_PASSED 로 복귀하고 좌석이 반환된다', () => {
    let s = base();
    s = reducer(s, { type: 'BOOK_SLOT', appId: 'app-1', slotId: 'ses-cm-1-s6' });
    const booked = L.slotBooked(s, L.findSlot(s, 'ses-cm-1-s6'));
    s = reducer(s, { type: 'CANCEL_BOOKING', appId: 'app-1' });
    expect(L.getApplication(s, 'app-1').status).toBe(AppStatus.DOC_PASSED);
    expect(L.getApplication(s, 'app-1').interviewSlotId).toBe(null);
    expect(L.slotBooked(s, L.findSlot(s, 'ses-cm-1-s6'))).toBe(booked - 1);
  });

  it('예약이 없으면 변경/취소가 불가하다', () => {
    const s = base();
    expect(L.canChangeBooking(s, L.getApplication(s, 'app-1')).ok).toBe(false);
  });

  it('변경 기한(면접 N시간 전)을 지나면 변경 불가', () => {
    let s = base();
    // 과거 날짜 슬롯을 만들어 기한 초과 상황 재현
    s = {
      ...s,
      sessions: s.sessions.map((ses) =>
        ses.id === 'ses-cm-1'
          ? { ...ses, slots: ses.slots.map((x) => ({ ...x, date: '2000-01-01' })) }
          : ses
      ),
    };
    s = reducer(s, { type: 'BOOK_SLOT', appId: 'app-1', slotId: 'ses-cm-1-s6' });
    expect(L.canChangeBooking(s, L.getApplication(s, 'app-1')).ok).toBe(false);
  });
});

describe('운영진 심사 결정', () => {
  it('합격 처리 시 DOC_PASSED + 면접 안내 알림이 생성된다', () => {
    let s = base();
    const before = s.notifications.length;
    s = reducer(s, { type: 'ADMIN_DECIDE', id: 'app-2', isMe: true, decision: 'PASS' });
    const app = L.getApplication(s, 'app-2');
    expect(app.status).toBe(AppStatus.DOC_PASSED);
    expect(app.internalStatus).toBe(InternalStatus.PASS_PREDICTED);
    expect(s.notifications.length).toBe(before + 1);
    expect(s.notifications[0].kind).toBe('DOC_PASSED');
    // 합격 후 실제로 예약 가능해야 함
    expect(L.canBookInterview(s, app).ok).toBe(true);
  });

  it('불합격 처리 시 REJECTED 가 되고 예약이 불가하다', () => {
    let s = base();
    s = reducer(s, { type: 'ADMIN_DECIDE', id: 'app-2', isMe: true, decision: 'FAIL' });
    const app = L.getApplication(s, 'app-2');
    expect(app.status).toBe(AppStatus.REJECTED);
    expect(L.canBookInterview(s, app).ok).toBe(false);
  });

  it('타 지원자 결정은 내 알림을 만들지 않는다', () => {
    let s = base();
    const before = s.notifications.length;
    s = reducer(s, { type: 'ADMIN_DECIDE', id: 'app-o4', isMe: false, decision: 'PASS' });
    expect(s.others.find((a) => a.id === 'app-o4').status).toBe(AppStatus.DOC_PASSED);
    expect(s.notifications.length).toBe(before);
  });

  it('최종 합격 처리 시 FINAL_PASSED 가 된다', () => {
    let s = base();
    s = reducer(s, { type: 'ADMIN_FINALIZE', id: 'app-1', isMe: true, decision: 'PASS' });
    expect(L.getApplication(s, 'app-1').status).toBe(AppStatus.FINAL_PASSED);
  });

  it('메모/내부 상태는 본인·타 지원자 모두 저장된다', () => {
    let s = base();
    s = reducer(s, { type: 'ADMIN_SET_MEMO', id: 'app-o2', isMe: false, memo: '추가 확인 필요' });
    s = reducer(s, { type: 'ADMIN_SET_INTERNAL', id: 'app-o2', isMe: false, internalStatus: InternalStatus.HOLD });
    const o = s.others.find((a) => a.id === 'app-o2');
    expect(o.memo).toBe('추가 확인 필요');
    expect(o.internalStatus).toBe(InternalStatus.HOLD);
  });
});

describe('알림', () => {
  it('개별/전체 읽음 처리가 동작한다', () => {
    let s = base();
    expect(L.unreadCount(s)).toBeGreaterThan(0);
    s = reducer(s, { type: 'READ_NOTI', id: 'n-1' });
    expect(s.notifications.find((n) => n.id === 'n-1').read).toBe(true);
    s = reducer(s, { type: 'READ_ALL_NOTI' });
    expect(L.unreadCount(s)).toBe(0);
  });
});

describe('스테퍼 진행도', () => {
  it('상태별 단계가 단조 증가한다', () => {
    const order = [
      AppStatus.SUBMITTED,
      AppStatus.DOC_REVIEW,
      AppStatus.DOC_PASSED,
      AppStatus.INTERVIEW_SCHEDULED,
      AppStatus.INTERVIEW_DONE,
      AppStatus.FINAL_PASSED,
    ];
    const dones = order.map((st) => stepProgress(st).done);
    for (let i = 1; i < dones.length; i += 1) {
      expect(dones[i]).toBeGreaterThanOrEqual(dones[i - 1]);
    }
    expect(stepProgress(AppStatus.FINAL_PASSED).done).toBe(4);
  });
});

describe('검증 로직', () => {
  it('프로필 필수값을 검증한다', () => {
    expect(Object.keys(L.validateProfile({})).length).toBe(4);
    expect(
      Object.keys(
        L.validateProfile({ name: '홍길동', department: '경영학과', studentId: '20240001', phone: '010-1234-5678' })
      ).length
    ).toBe(0);
  });

  it('학번/연락처 형식 오류를 잡아낸다', () => {
    const e = L.validateProfile({ name: 'a', department: 'b', studentId: '12', phone: '123' });
    expect(e.studentId).toBeTruthy();
    expect(e.phone).toBeTruthy();
  });

  it('2단계에서 필수 문항 미작성을 잡아낸다', () => {
    const s = base();
    const r = L.getRecruitment(s, 'r-cm-12');
    const e = L.validateApplyStep(2, { fieldId: '', answers: {} }, r);
    expect(e.fieldId).toBeTruthy();
    expect(e.q1).toBeTruthy();
  });

  it('글자수 초과를 잡아낸다', () => {
    const s = base();
    const r = L.getRecruitment(s, 'r-cm-12');
    const long = 'ㄱ'.repeat(501);
    const e = L.validateApplyStep(2, { fieldId: 'f-dev', answers: { q1: long, q2: 'ok', q3: 'ok', q4: '평일 오후 (18:00-21:00)' } }, r);
    expect(e.q1).toMatch(/500자/);
  });

  it('3단계 동의 누락을 잡아낸다', () => {
    const s = base();
    const r = L.getRecruitment(s, 'r-cm-12');
    expect(L.validateApplyStep(3, { agree: false }, r).agree).toBeTruthy();
    expect(L.validateApplyStep(3, { agree: true }, r).agree).toBeUndefined();
  });

  it('포트폴리오 링크 형식을 검증한다', () => {
    const s = base();
    const r = L.getRecruitment(s, 'r-algo-32');
    const bad = L.validateApplyStep(2, { fieldId: 'f-beginner', answers: { q1: 'ok' }, portfolioLink: 'notion.so' }, r);
    expect(bad.portfolioLink).toBeTruthy();
  });
});

describe('운영진 데이터 집계', () => {
  it('관리 동아리의 지원자만 조회된다', () => {
    const s = base();
    const list = L.adminApplicants(s);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.clubId === s.user.managedClubId)).toBe(true);
    expect(list.some((a) => a.isMe)).toBe(true);
  });

  it('로그아웃 시 상태가 초기화된다', () => {
    let s = base();
    s = reducer(s, { type: 'LOGIN', provider: 'kakao' });
    expect(s.auth.loggedIn).toBe(true);
    s = reducer(s, { type: 'LOGOUT' });
    expect(s.auth.loggedIn).toBe(false);
  });
});
