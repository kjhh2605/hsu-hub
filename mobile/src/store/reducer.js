import { AppStatus, InternalStatus } from '../data/constants.js';
import { initialState, makeNotification, findSlot, getClub } from './logic.js';

let tid = 0;

const patchApp = (state, id, patch) => ({
  ...state,
  applications: state.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
});

const patchOther = (state, id, patch) => ({
  ...state,
  others: state.others.map((a) => (a.id === id ? { ...a, ...patch } : a)),
});

export function reducer(state, action) {
  switch (action.type) {
    /* ── auth ── */
    case 'LOGIN':
      return {
        ...state,
        auth: { ...state.auth, loggedIn: true, provider: action.provider },
      };
    case 'LOGOUT':
      return { ...initialState(), toasts: state.toasts };
    case 'SET_REDIRECT':
      return { ...state, auth: { ...state.auth, redirectTo: action.to } };
    case 'COMPLETE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.profile, profileComplete: true },
      };
    case 'SET_ROLE':
      return { ...state, user: { ...state.user, role: action.role } };

    /* ── draft ── */
    case 'SAVE_DRAFT':
      return {
        ...state,
        drafts: { ...state.drafts, [action.recruitmentId]: action.draft },
      };
    case 'CLEAR_DRAFT': {
      const next = { ...state.drafts };
      delete next[action.recruitmentId];
      return { ...state, drafts: next };
    }

    /* ── application ── */
    case 'SUBMIT_APPLICATION': {
      const { recruitmentId, clubId, draft } = action;
      const id = `app-${Date.now()}`;
      const app = {
        id,
        userId: state.user.id,
        recruitmentId,
        clubId,
        fieldId: draft.fieldId,
        status: AppStatus.SUBMITTED,
        internalStatus: InternalStatus.UNREVIEWED,
        submittedAt: new Date().toISOString(),
        answers: { ...draft.answers },
        portfolio: draft.portfolioFileName
          ? {
              fileName: draft.portfolioFileName,
              sizeMb: draft.portfolioSizeMb ?? 0,
              pages: draft.portfolioPages ?? 0,
              link: draft.portfolioLink || '',
            }
          : draft.portfolioLink
            ? { fileName: '', sizeMb: 0, pages: 0, link: draft.portfolioLink }
            : null,
        interviewSlotId: null,
        memo: '',
        evaluations: [],
      };
      const club = getClub(state, clubId);
      const drafts = { ...state.drafts };
      delete drafts[recruitmentId];
      return {
        ...state,
        applications: [app, ...state.applications],
        drafts,
        notifications: [
          makeNotification({
            category: 'result',
            kind: 'SUBMITTED',
            title: '지원서 접수 완료',
            body: `${club?.name ?? '동아리'} 지원서가 정상적으로 접수되었습니다. 서류 결과 발표를 기다려 주세요.`,
            clubId,
            applicationId: id,
            cta: '지원 상세 보기',
          }),
          ...state.notifications,
        ],
        lastSubmittedId: id,
      };
    }

    case 'UPDATE_APPLICATION':
      return patchApp(state, action.id, action.patch);

    case 'CANCEL_APPLICATION': {
      const app = state.applications.find((a) => a.id === action.id);
      let next = patchApp(state, action.id, {
        status: AppStatus.CANCELED,
        interviewSlotId: null,
      });
      if (app?.interviewSlotId) next = releaseNothing(next); // 슬롯 카운트는 파생값이라 별도 처리 불필요
      return next;
    }

    /* ── interview booking ── */
    case 'BOOK_SLOT': {
      const next = patchApp(state, action.appId, {
        interviewSlotId: action.slotId,
        status: AppStatus.INTERVIEW_SCHEDULED,
      });
      const slot = findSlot(next, action.slotId);
      const app = next.applications.find((a) => a.id === action.appId);
      const club = getClub(next, app?.clubId);
      return {
        ...next,
        notifications: [
          makeNotification({
            category: 'schedule',
            kind: 'INTERVIEW_BOOKED',
            title: '면접 예약 확정',
            body: `${club?.name ?? '동아리'} 면접이 ${slot?.date} ${slot?.start}에 확정되었습니다.`,
            clubId: app?.clubId,
            applicationId: action.appId,
            cta: '예약 상세 보기',
          }),
          ...next.notifications,
        ],
      };
    }

    case 'CANCEL_BOOKING':
      return patchApp(state, action.appId, {
        interviewSlotId: null,
        status: AppStatus.DOC_PASSED,
      });

    /* ── notifications ── */
    case 'READ_NOTI':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };
    case 'READ_ALL_NOTI':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    /* ── admin ── */
    case 'ADMIN_SET_MEMO':
      return action.isMe
        ? patchApp(state, action.id, { memo: action.memo })
        : patchOther(state, action.id, { memo: action.memo });

    case 'ADMIN_SET_INTERNAL':
      return action.isMe
        ? patchApp(state, action.id, { internalStatus: action.internalStatus })
        : patchOther(state, action.id, { internalStatus: action.internalStatus });

    case 'ADMIN_DECIDE': {
      const { id, isMe, decision } = action;
      const pass = decision === 'PASS';
      const patch = {
        status: pass ? AppStatus.DOC_PASSED : AppStatus.REJECTED,
        internalStatus: pass ? InternalStatus.PASS_PREDICTED : InternalStatus.FAIL_PREDICTED,
      };
      let next = isMe ? patchApp(state, id, patch) : patchOther(state, id, patch);
      const target = isMe
        ? next.applications.find((a) => a.id === id)
        : next.others.find((a) => a.id === id);
      const club = getClub(next, target?.clubId);
      if (isMe) {
        next = {
          ...next,
          notifications: [
            makeNotification({
              category: 'result',
              kind: pass ? 'DOC_PASSED' : 'DOC_FAILED',
              title: pass ? '서류 합격 · 면접 예약 안내' : '서류 결과 발표',
              body: pass
                ? `${club?.name ?? '동아리'} 서류 전형에 합격하셨습니다! 면접 일정을 선택해 주세요.`
                : `${club?.name ?? '동아리'} 서류 전형 결과가 발표되었습니다.`,
              clubId: target?.clubId,
              applicationId: id,
              cta: pass ? '일정 예약하기' : '지원 상세 보기',
            }),
            ...next.notifications,
          ],
        };
      }
      return next;
    }

    case 'ADMIN_FINALIZE': {
      const { id, isMe, decision } = action;
      const pass = decision === 'PASS';
      const patch = { status: pass ? AppStatus.FINAL_PASSED : AppStatus.REJECTED };
      let next = isMe ? patchApp(state, id, patch) : patchOther(state, id, patch);
      if (isMe) {
        const target = next.applications.find((a) => a.id === id);
        const club = getClub(next, target?.clubId);
        next = {
          ...next,
          notifications: [
            makeNotification({
              category: 'result',
              kind: pass ? 'FINAL_PASSED' : 'FINAL_FAILED',
              title: pass ? '최종 합격 알림' : '최종 결과 발표',
              body: pass
                ? `축하합니다! ${club?.name ?? '동아리'} 정회원으로 최종 선발되셨습니다.`
                : `${club?.name ?? '동아리'} 최종 결과가 발표되었습니다.`,
              clubId: target?.clubId,
              applicationId: id,
              cta: '지원 상세 보기',
            }),
            ...next.notifications,
          ],
        };
      }
      return next;
    }

    case 'ADMIN_SET_ATTENDANCE':
      return action.isMe
        ? patchApp(state, action.id, { attendance: action.value })
        : patchOther(state, action.id, { attendance: action.value });

    /* ── toast ── */
    case 'TOAST': {
      tid += 1;
      return {
        ...state,
        toasts: [...state.toasts, { id: tid, message: action.message, tone: action.tone }],
      };
    }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case 'RESET':
      return initialState();

    default:
      return state;
  }
}

function releaseNothing(s) {
  return s;
}
