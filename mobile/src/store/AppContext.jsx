import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { reducer } from './reducer.js';
import * as L from './logic.js';
import { AppStatus } from '../data/constants.js';

const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(L.STORAGE_KEY);
    if (!raw) return L.initialState();
    const parsed = JSON.parse(raw);
    // 시드 구조가 바뀌면 초기화 (버전 필드 없는 구버전 방어)
    if (!parsed || !parsed.clubs || !parsed.recruitments) return L.initialState();
    return { ...L.initialState(), ...parsed, toasts: [] };
  } catch {
    return L.initialState();
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const timers = useRef(new Map());

  useEffect(() => {
    try {
      const { toasts, ...persist } = state;
      localStorage.setItem(L.STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* storage 사용 불가 환경 무시 */
    }
  }, [state]);

  // 토스트 자동 소멸
  useEffect(() => {
    state.toasts.forEach((t) => {
      if (timers.current.has(t.id)) return;
      const h = setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST', id: t.id });
        timers.current.delete(t.id);
      }, 2600);
      timers.current.set(t.id, h);
    });
  }, [state.toasts]);

  const value = useMemo(() => {
    const toast = (message, tone = 'default') => dispatch({ type: 'TOAST', message, tone });

    const actions = {
      toast,
      login: (provider) => dispatch({ type: 'LOGIN', provider }),
      logout: () => dispatch({ type: 'LOGOUT' }),
      setRedirect: (to) => dispatch({ type: 'SET_REDIRECT', to }),
      completeProfile: (profile) => dispatch({ type: 'COMPLETE_PROFILE', profile }),
      setRole: (role) => {
        dispatch({ type: 'SET_ROLE', role });
        toast(role === 'admin' ? '운영진 모드로 전환했습니다.' : '지원자 모드로 전환했습니다.');
      },
      reset: () => {
        dispatch({ type: 'RESET' });
        toast('데모 데이터를 초기화했습니다.');
      },

      saveDraft: (recruitmentId, draft) =>
        dispatch({ type: 'SAVE_DRAFT', recruitmentId, draft }),
      clearDraft: (recruitmentId) => dispatch({ type: 'CLEAR_DRAFT', recruitmentId }),

      /** 지원서 제출 — 중복/마감 규칙 검증 후 처리 */
      submitApplication: (recruitmentId, clubId, draft) => {
        const guard = L.canApply(state, recruitmentId);
        if (!guard.ok) {
          toast(guard.reason, 'error');
          return { ok: false, reason: guard.reason };
        }
        dispatch({ type: 'SUBMIT_APPLICATION', recruitmentId, clubId, draft });
        return { ok: true };
      },

      updateApplication: (appId, patch) => {
        const app = L.getApplication(state, appId);
        const guard = L.canEditApplication(state, app);
        if (!guard.ok) {
          toast(guard.reason, 'error');
          return { ok: false };
        }
        dispatch({ type: 'UPDATE_APPLICATION', id: appId, patch });
        toast('지원서를 수정했습니다.', 'success');
        return { ok: true };
      },

      cancelApplication: (appId) => {
        const app = L.getApplication(state, appId);
        const guard = L.canCancelApplication(state, app);
        if (!guard.ok) {
          toast(guard.reason, 'error');
          return { ok: false };
        }
        dispatch({ type: 'CANCEL_APPLICATION', id: appId });
        toast('지원이 취소되었습니다.', 'success');
        return { ok: true };
      },

      /** 면접 슬롯 예약 / 변경 — 정원·자격·기한 검증 */
      bookSlot: (appId, slotId) => {
        const app = L.getApplication(state, appId);
        const guard = L.canBookInterview(state, app);
        if (!guard.ok) {
          toast(guard.reason, 'error');
          return { ok: false };
        }
        const slot = L.findSlot(state, slotId);
        if (!slot) {
          toast('선택한 면접 시간을 찾을 수 없습니다.', 'error');
          return { ok: false };
        }
        if (app.interviewSlotId === slotId) {
          toast('이미 예약된 시간입니다.');
          return { ok: false };
        }
        if (L.slotIsFull(state, slot)) {
          toast('선택한 시간대는 마감되었습니다.', 'error');
          return { ok: false };
        }
        // 재예약이면 기존 예약 변경 기한 확인
        if (app.interviewSlotId) {
          const ch = L.canChangeBooking(state, app);
          if (!ch.ok) {
            toast(ch.reason, 'error');
            return { ok: false };
          }
        }
        dispatch({ type: 'BOOK_SLOT', appId, slotId });
        return { ok: true };
      },

      cancelBooking: (appId) => {
        const app = L.getApplication(state, appId);
        const guard = L.canChangeBooking(state, app);
        if (!guard.ok) {
          toast(guard.reason, 'error');
          return { ok: false };
        }
        dispatch({ type: 'CANCEL_BOOKING', appId });
        toast('면접 예약이 취소되었습니다. 다시 예약해 주세요.', 'success');
        return { ok: true };
      },

      readNoti: (id) => dispatch({ type: 'READ_NOTI', id }),
      readAllNoti: () => {
        dispatch({ type: 'READ_ALL_NOTI' });
        toast('모든 알림을 읽음으로 표시했습니다.');
      },

      adminSetMemo: (id, isMe, memo) =>
        dispatch({ type: 'ADMIN_SET_MEMO', id, isMe, memo }),
      adminSetInternal: (id, isMe, internalStatus) => {
        dispatch({ type: 'ADMIN_SET_INTERNAL', id, isMe, internalStatus });
      },
      adminDecide: (id, isMe, decision) => {
        dispatch({ type: 'ADMIN_DECIDE', id, isMe, decision });
        toast(
          decision === 'PASS' ? '서류 합격으로 처리했습니다.' : '불합격으로 처리했습니다.',
          decision === 'PASS' ? 'success' : 'default'
        );
      },
      adminFinalize: (id, isMe, decision) => {
        dispatch({ type: 'ADMIN_FINALIZE', id, isMe, decision });
        toast(decision === 'PASS' ? '최종 합격 처리했습니다.' : '최종 불합격 처리했습니다.');
      },
      adminSetAttendance: (id, isMe, value) =>
        dispatch({ type: 'ADMIN_SET_ATTENDANCE', id, isMe, value }),
      dismissToast: (id) => dispatch({ type: 'DISMISS_TOAST', id }),
    };

    const sel = {
      club: (id) => L.getClub(state, id),
      recruitment: (id) => L.getRecruitment(state, id),
      recruitmentOfClub: (clubId) => L.recruitmentOfClub(state, clubId),
      application: (id) => L.getApplication(state, id),
      myApplications: () => L.myApplications(state),
      applicationForRecruitment: (rid) => L.applicationForRecruitment(state, rid),
      unreadCount: () => L.unreadCount(state),
      sessionsOfRecruitment: (rid) => L.sessionsOfRecruitment(state, rid),
      findSlot: (id) => L.findSlot(state, id),
      sessionOfSlot: (id) => L.sessionOfSlot(state, id),
      slotBooked: (slot) => L.slotBooked(state, slot),
      slotRemaining: (slot) => L.slotRemaining(state, slot),
      slotIsFull: (slot) => L.slotIsFull(state, slot),
      adminApplicants: () => L.adminApplicants(state),
      adminApplicant: (id) => L.adminApplicant(state, id),
      canApply: (rid) => L.canApply(state, rid),
      canEditApplication: (app) => L.canEditApplication(state, app),
      canCancelApplication: (app) => L.canCancelApplication(state, app),
      canBookInterview: (app) => L.canBookInterview(state, app),
      canChangeBooking: (app) => L.canChangeBooking(state, app),
      rosterOfSlot: (slotId) => {
        const mine = state.applications
          .filter((a) => a.interviewSlotId === slotId)
          .map((a) => ({ ...a, name: state.user.name, department: state.user.department, isMe: true }));
        const others = state.others
          .filter((a) => a.interviewSlotId === slotId)
          .map((a) => ({ ...a, isMe: false }));
        return [...mine, ...others];
      },
      /** 지원 가능한 모집 (탐색 화면) */
      openRecruitments: () =>
        state.recruitments
          .filter((r) => new Date(r.closeAt) >= new Date())
          .sort((a, b) => new Date(a.closeAt) - new Date(b.closeAt)),
      closedRecruitments: () =>
        state.recruitments.filter((r) => new Date(r.closeAt) < new Date()),
    };

    return { state, dispatch, actions, sel, AppStatus };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}
