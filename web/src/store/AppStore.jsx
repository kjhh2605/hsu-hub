import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { ADMIN_USER, ADMIN_MEMBERS, NOTIFICATIONS, SETTINGS_SCHEMA } from '@/data/user';
import { FORM_SCHEMAS } from '@/data/applications';
import { APPLICANTS, INTERVIEW_SESSIONS, RESULT_BATCH, DASHBOARD } from '@/data/admin';
import { RECRUITMENTS, CLUBS } from '@/data/clubs';
import { ymd, iso, nextSemester } from '@/lib/seedClock';

const STORAGE_KEY = 'uniclub.admin.state.v2';

/* ------------------------------------------------------------------ */
/* initial state                                                       */
/* ------------------------------------------------------------------ */

const flattenSettings = () => {
  const out = {};
  SETTINGS_SCHEMA.forEach((s) => s.items.forEach((i) => (out[i.key] = i.value)));
  return out;
};

const clone = (v) => JSON.parse(JSON.stringify(v));

export const initialState = {
  admin: clone(ADMIN_USER),
  members: clone(ADMIN_MEMBERS),
  club: clone(CLUBS.find((c) => c.id === ADMIN_USER.clubId) ?? CLUBS[0]),
  notifications: clone(NOTIFICATIONS),
  settings: flattenSettings(),
  formSchemas: clone(FORM_SCHEMAS),
  recruitments: clone(RECRUITMENTS),
  applicants: clone(APPLICANTS),
  sessions: clone(INTERVIEW_SESSIONS),
  resultBatch: clone(RESULT_BATCH),
  dashboard: clone(DASHBOARD),
  /** applicantId -> { scores, recommendation, notes, questionMemos, submittedAt } */
  evaluations: {},
  /** 모집 생성 위저드 임시 상태 */
  recruitmentDraft: {
    id: 'rec-new',
    clubId: 'likelion',
    title: '멋쟁이사자처럼 13기 아기사자 모집',
    semester: nextSemester(),
    summary: '비전공자도 12주 만에 서비스를 만드는 IT 창업 동아리',
    cover: 'grad-primary',
    quota: 30,
    blocks: [
      { id: 'b1', type: 'heading', text: '우리는 이런 활동을 합니다' },
      { id: 'b2', type: 'list', items: ['주 1회 정기 세션', '아이디어톤 / 해커톤', '3인 1팀 실전 프로젝트'] },
      { id: 'b3', type: 'heading', text: '이런 분을 찾습니다' },
      { id: 'b4', type: 'list', items: ['끝까지 완성해 본 경험을 원하는 분', '비전공이지만 개발이 궁금한 분'] },
      { id: 'b5', type: 'callout', text: '지원 전 FAQ를 꼭 확인해 주세요!' },
    ],
    tags: ['비전공환영', '포트폴리오', '해커톤'],
    stages: [
      { id: 'st1', type: 'document', label: '서류 전형', from: ymd(21), to: ymd(34), enabled: true },
      { id: 'st2', type: 'docResult', label: '서류 발표', from: ymd(37), to: ymd(37), enabled: true },
      { id: 'st3', type: 'interview', label: '면접 전형', from: ymd(40), to: ymd(42), enabled: true },
      { id: 'st4', type: 'finalResult', label: '최종 발표', from: ymd(45), to: ymd(45), enabled: true },
    ],
    notifyPush: true,
    notifyEmail: true,
    resultMode: 'batch',
    formSteps: clone(FORM_SCHEMAS['rec-likelion-12'].steps),
    published: false,
  },
  ui: {
    toasts: [],
  },
};

/* ------------------------------------------------------------------ */
/* reducer                                                             */
/* ------------------------------------------------------------------ */

let toastSeq = 0;

const APPLICANT_STATUS_META = {
  pending: { statusLabel: '미검토', tone: 'neutral' },
  reviewing: { statusLabel: '검토중', tone: 'primary' },
  docPass: { statusLabel: '서류 합격', tone: 'mint' },
  docFail: { statusLabel: '서류 불합격', tone: 'danger' },
  interviewScheduled: { statusLabel: '면접 예정', tone: 'primary' },
  interviewDone: { statusLabel: '면접 완료', tone: 'slate' },
  finalPass: { statusLabel: '최종 합격', tone: 'mint' },
  finalFail: { statusLabel: '최종 불합격', tone: 'danger' },
};

function reducer(state, action) {
  switch (action.type) {
    /* ---------- notifications ---------- */
    case 'readNotification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };
    case 'readAllNotifications':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'deleteNotification':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case 'pushNotification':
      return {
        ...state,
        notifications: [
          { id: `n-${Date.now()}`, read: false, createdAt: new Date().toISOString(), ...action.payload },
          ...state.notifications,
        ],
      };

    /* ---------- settings / club / members ---------- */
    case 'setSetting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'patchClub':
      return { ...state, club: { ...state.club, ...action.patch } };
    case 'setMemberRole':
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.id ? { ...m, role: action.role } : m)),
      };
    case 'inviteMember':
      return {
        ...state,
        members: [
          ...state.members,
          {
            id: `m-${Date.now()}`,
            name: action.email.split('@')[0],
            avatar: '🙂',
            email: action.email,
            role: action.role ?? 'reviewer',
            lastActiveAt: null,
            reviewCount: 0,
            pending: true,
          },
        ],
      };
    case 'removeMember':
      return { ...state, members: state.members.filter((m) => m.id !== action.id) };

    /* ---------- applicants ---------- */
    case 'setApplicantStatus': {
      const ids = new Set(action.ids);
      const meta = APPLICANT_STATUS_META[action.status] ?? {};
      return {
        ...state,
        applicants: state.applicants.map((a) =>
          ids.has(a.id) ? { ...a, status: action.status, ...meta } : a,
        ),
      };
    }
    case 'toggleApplicantStar':
      return {
        ...state,
        applicants: state.applicants.map((a) => (a.id === action.id ? { ...a, starred: !a.starred } : a)),
      };
    case 'addApplicantMemo':
      return {
        ...state,
        applicants: state.applicants.map((a) =>
          a.id !== action.id
            ? a
            : {
                ...a,
                memoCount: a.memoCount + 1,
                memos: [
                  ...a.memos,
                  { id: `m-${Date.now()}`, author: state.admin.name, at: new Date().toISOString(), text: action.text },
                ],
              },
        ),
      };
    case 'setApplicantScore':
      return {
        ...state,
        applicants: state.applicants.map((a) =>
          a.id !== action.id ? a : { ...a, scores: { ...a.scores, [action.criterion]: action.value } },
        ),
      };

    /* ---------- evaluations ---------- */
    case 'saveEvaluation': {
      const ev = { ...action.payload, submittedAt: new Date().toISOString() };
      const total = Object.values(ev.scores ?? {}).reduce((s, v) => s + Number(v || 0), 0);
      return {
        ...state,
        evaluations: { ...state.evaluations, [action.applicantId]: ev },
        applicants: state.applicants.map((a) =>
          a.id !== action.applicantId
            ? a
            : {
                ...a,
                status: 'interviewDone',
                ...APPLICANT_STATUS_META.interviewDone,
                interviewScore: Math.round((total / (4 * 5)) * 100),
                scores: ev.scores ?? a.scores,
              },
        ),
      };
    }

    /* ---------- interview sessions ---------- */
    case 'createSession':
      return { ...state, sessions: [...state.sessions, action.session] };
    case 'updateSession':
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };
    case 'deleteSession':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case 'addSlot':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id !== action.sessionId ? s : { ...s, slots: [...s.slots, action.slot] },
        ),
      };
    case 'deleteSlot':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id !== action.sessionId ? s : { ...s, slots: s.slots.filter((sl) => sl.id !== action.slotId) },
        ),
      };
    case 'assignApplicantToSlot':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id !== action.sessionId
            ? s
            : {
                ...s,
                slots: s.slots.map((sl) =>
                  sl.id !== action.slotId
                    ? sl
                    : {
                        ...sl,
                        applicantIds: sl.applicantIds.includes(action.applicantId)
                          ? sl.applicantIds
                          : [...sl.applicantIds, action.applicantId],
                        booked: Math.min(sl.capacity, sl.booked + 1),
                      },
                ),
              },
        ),
        applicants: state.applicants.map((a) =>
          a.id !== action.applicantId
            ? a
            : { ...a, status: 'interviewScheduled', ...APPLICANT_STATUS_META.interviewScheduled },
        ),
      };
    case 'removeApplicantFromSlot':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id !== action.sessionId
            ? s
            : {
                ...s,
                slots: s.slots.map((sl) =>
                  sl.id !== action.slotId
                    ? sl
                    : {
                        ...sl,
                        applicantIds: sl.applicantIds.filter((i) => i !== action.applicantId),
                        booked: Math.max(0, sl.booked - 1),
                      },
                ),
              },
        ),
      };

    /* ---------- recruitment wizard ---------- */
    case 'patchRecruitmentDraft':
      return { ...state, recruitmentDraft: { ...state.recruitmentDraft, ...action.patch } };
    case 'patchRecruitmentStage':
      return {
        ...state,
        recruitmentDraft: {
          ...state.recruitmentDraft,
          stages: state.recruitmentDraft.stages.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
      };
    case 'setFormSteps':
      return { ...state, recruitmentDraft: { ...state.recruitmentDraft, formSteps: action.steps } };
    case 'publishRecruitment': {
      const d = state.recruitmentDraft;
      const newRec = {
        id: `rec-${Date.now().toString().slice(-6)}`,
        clubId: d.clubId,
        title: d.title,
        status: action.mode === 'schedule' ? 'scheduled' : 'open',
        semester: d.semester,
        openAt: d.stages[0]?.from ? `${d.stages[0].from}T09:00:00+09:00` : iso(21, 9, 0),
        closeAt: d.stages[0]?.to ? `${d.stages[0].to}T23:59:00+09:00` : iso(34, 23, 59),
        quota: Number(d.quota) || 0,
        applicantCount: 0,
        viewCount: 0,
        bookmarkCount: 0,
        stages: d.stages.filter((s) => s.enabled),
        tags: d.tags?.length ? d.tags : ['신규'],
        highlight: action.mode === 'schedule' ? '게시 예약됨' : '모집중',
      };
      return {
        ...state,
        recruitments: [newRec, ...state.recruitments],
        recruitmentDraft: { ...state.recruitmentDraft, published: true },
        formSchemas: {
          ...state.formSchemas,
          [newRec.id]: { id: `form-${newRec.id}`, recruitmentId: newRec.id, steps: d.formSteps },
        },
      };
    }
    case 'setRecruitmentStatus':
      return {
        ...state,
        recruitments: state.recruitments.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
      };
    case 'deleteRecruitment':
      return { ...state, recruitments: state.recruitments.filter((r) => r.id !== action.id) };
    case 'duplicateRecruitment': {
      const src = state.recruitments.find((r) => r.id === action.id);
      if (!src) return state;
      return {
        ...state,
        recruitments: [
          {
            ...src,
            id: `${src.id}-copy-${Date.now().toString().slice(-4)}`,
            title: `${src.title} (복사)`,
            status: 'draft',
            applicantCount: 0,
            viewCount: 0,
          },
          ...state.recruitments,
        ],
      };
    }

    /* ---------- result publishing ---------- */
    case 'patchResultBatch':
      return { ...state, resultBatch: { ...state.resultBatch, ...action.patch } };
    case 'moveResultTarget': {
      const { id, to } = action;
      const b = state.resultBatch;
      const strip = (arr) => arr.filter((x) => x !== id);
      const next = { passIds: strip(b.passIds), failIds: strip(b.failIds), holdIds: strip(b.holdIds) };
      const key = to === 'pass' ? 'passIds' : to === 'fail' ? 'failIds' : 'holdIds';
      next[key] = [...next[key], id];
      return { ...state, resultBatch: { ...b, ...next } };
    }
    case 'publishResults':
      return {
        ...state,
        resultBatch: { ...state.resultBatch, status: action.mode === 'schedule' ? 'scheduled' : 'published' },
        applicants: state.applicants.map((a) => {
          if (state.resultBatch.passIds.includes(a.id) && a.status !== 'finalPass') {
            return { ...a, status: 'docPass', ...APPLICANT_STATUS_META.docPass };
          }
          if (state.resultBatch.failIds.includes(a.id)) {
            return { ...a, status: 'docFail', ...APPLICANT_STATUS_META.docFail };
          }
          return a;
        }),
      };

    /* ---------- ui ---------- */
    case 'toast':
      toastSeq += 1;
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: [
            ...state.ui.toasts,
            { id: `t-${Date.now()}-${toastSeq}`, tone: 'default', ...action.payload },
          ].slice(-4),
        },
      };
    case 'dismissToast':
      return { ...state, ui: { ...state.ui, toasts: state.ui.toasts.filter((t) => t.id !== action.id) } };

    case 'resetAll':
      return clone(initialState);

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* context                                                             */
/* ------------------------------------------------------------------ */

const StoreContext = createContext(null);

function loadPersisted() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // shallow-merge 로 코드 업데이트에서 추가된 키를 보존한다.
    return { ...clone(initialState), ...parsed, ui: { ...initialState.ui, toasts: [] } };
  } catch {
    return null;
  }
}

export function StoreProvider({ children, preloadedState }) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => preloadedState ?? loadPersisted() ?? clone(initialState),
  );

  const timers = useRef({});

  // persist (transient ui.toasts 제외)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const { ui, ...rest } = state;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, ui: { ...ui, toasts: [] } }));
    } catch {
      /* storage 사용 불가 — 프로토타입은 영속화 없이도 동작한다 */
    }
  }, [state]);

  // auto-dismiss toasts
  useEffect(() => {
    state.ui.toasts.forEach((t) => {
      if (timers.current[t.id]) return;
      timers.current[t.id] = setTimeout(() => {
        dispatch({ type: 'dismissToast', id: t.id });
        delete timers.current[t.id];
      }, t.duration ?? 2600);
    });
  }, [state.ui.toasts]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** 편의 훅: toast 발생 */
export function useToast() {
  const { dispatch } = useStore();
  return useMemo(
    () => ({
      show: (message, opts = {}) => dispatch({ type: 'toast', payload: { message, ...opts } }),
      success: (message, opts = {}) =>
        dispatch({ type: 'toast', payload: { message, tone: 'success', ...opts } }),
      error: (message, opts = {}) => dispatch({ type: 'toast', payload: { message, tone: 'error', ...opts } }),
      info: (message, opts = {}) => dispatch({ type: 'toast', payload: { message, tone: 'info', ...opts } }),
    }),
    [dispatch],
  );
}

export { reducer, STORAGE_KEY, APPLICANT_STATUS_META };
