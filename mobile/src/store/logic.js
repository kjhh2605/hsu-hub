import { AppStatus, InternalStatus } from '../data/constants.js';
import {
  seedUser,
  seedClubs,
  seedRecruitments,
  seedSessions,
  seedApplications,
  seedOtherApplicants,
  seedNotifications,
} from '../data/seed.js';
import { slotDateTime } from '../utils/date.js';

export const STORAGE_KEY = 'campusconnect.state.v1';

export function initialState() {
  return {
    booted: true,
    auth: { loggedIn: false, provider: null, redirectTo: null },
    user: { ...seedUser },
    clubs: seedClubs,
    recruitments: seedRecruitments,
    sessions: seedSessions.map((s) => ({ ...s, slots: s.slots.map((x) => ({ ...x })) })),
    applications: seedApplications.map((a) => ({ ...a })),
    others: seedOtherApplicants.map((a) => ({ ...a })),
    notifications: seedNotifications.map((n) => ({ ...n })),
    drafts: {}, // recruitmentId -> draft
    toasts: [],
  };
}

/* ─────────────── Selectors ─────────────── */
export const getClub = (s, id) => s.clubs.find((c) => c.id === id) || null;
export const getRecruitment = (s, id) => s.recruitments.find((r) => r.id === id) || null;
export const getApplication = (s, id) => s.applications.find((a) => a.id === id) || null;

export const recruitmentOfClub = (s, clubId) =>
  s.recruitments.find((r) => r.clubId === clubId) || null;

export const myApplications = (s) =>
  s.applications
    .filter((a) => a.userId === s.user.id && a.status !== AppStatus.CANCELED)
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

export const applicationForRecruitment = (s, recruitmentId) =>
  s.applications.find(
    (a) =>
      a.userId === s.user.id &&
      a.recruitmentId === recruitmentId &&
      a.status !== AppStatus.CANCELED
  ) || null;

export const unreadCount = (s) => s.notifications.filter((n) => !n.read).length;

export const allSlots = (s) => s.sessions.flatMap((x) => x.slots);

export const findSlot = (s, slotId) => allSlots(s).find((x) => x.id === slotId) || null;

export const findSession = (s, sessionId) =>
  s.sessions.find((x) => x.id === sessionId) || null;

export const sessionOfSlot = (s, slotId) =>
  s.sessions.find((x) => x.slots.some((y) => y.id === slotId)) || null;

/** 슬롯 실제 예약 인원 = 더미 타 지원자(reserved) + 우리 데이터상 예약자 */
export function slotBooked(s, slot) {
  const mine = s.applications.filter((a) => a.interviewSlotId === slot.id).length;
  const others = s.others.filter((a) => a.interviewSlotId === slot.id).length;
  return (slot.reserved || 0) + mine + others;
}

export const slotRemaining = (s, slot) => Math.max(0, slot.capacity - slotBooked(s, slot));
export const slotIsFull = (s, slot) => slotRemaining(s, slot) === 0;

export const sessionsOfRecruitment = (s, recruitmentId) =>
  s.sessions.filter((x) => x.recruitmentId === recruitmentId);

/** 운영진이 관리하는 동아리의 지원자 목록 (본인 지원 포함) */
export function adminApplicants(s) {
  const clubId = s.user.managedClubId;
  const mine = s.applications
    .filter((a) => a.clubId === clubId && a.status !== AppStatus.CANCELED)
    .map((a) => ({
      ...a,
      name: s.user.name,
      department: s.user.department,
      admissionYear: s.user.admissionYear,
      avatarColor: s.user.avatarColor,
      isMe: true,
      score: a.score ?? null,
    }));
  const others = s.others
    .filter((a) => a.clubId === clubId)
    .map((a) => ({ ...a, isMe: false }));
  return [...mine, ...others].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
}

export function adminApplicant(s, id) {
  return adminApplicants(s).find((a) => a.id === id) || null;
}

/* ─────────────── Rule guards ─────────────── */
export function canApply(s, recruitmentId) {
  const r = getRecruitment(s, recruitmentId);
  if (!r) return { ok: false, reason: '모집 공고를 찾을 수 없습니다.' };
  if (new Date(r.closeAt) < new Date())
    return { ok: false, reason: '모집이 마감되었습니다.' };
  const existing = applicationForRecruitment(s, recruitmentId);
  if (existing) {
    const limit = r.policy?.maxApplications ?? 1;
    if (limit <= 1)
      return { ok: false, reason: '이미 이 모집에 지원하셨습니다. (중복 지원 제한)', existing };
  }
  return { ok: true };
}

export function canEditApplication(s, app) {
  if (!app) return { ok: false, reason: '지원서를 찾을 수 없습니다.' };
  const r = getRecruitment(s, app.recruitmentId);
  if (!r?.policy?.allowEdit)
    return { ok: false, reason: '이 모집은 제출 후 수정이 허용되지 않습니다.' };
  if (new Date(r.closeAt) < new Date())
    return { ok: false, reason: '모집 마감 후에는 수정할 수 없습니다.' };
  if (![AppStatus.SUBMITTED, AppStatus.DOC_REVIEW].includes(app.status))
    return { ok: false, reason: '전형이 진행되어 수정할 수 없습니다.' };
  return { ok: true };
}

export function canCancelApplication(s, app) {
  if (!app) return { ok: false, reason: '지원서를 찾을 수 없습니다.' };
  // 결과가 확정된 지원은 마감 여부와 무관하게 취소 불가 (더 구체적인 사유를 먼저 안내)
  if ([AppStatus.FINAL_PASSED, AppStatus.REJECTED].includes(app.status))
    return { ok: false, reason: '결과가 발표된 지원은 취소할 수 없습니다.' };
  const r = getRecruitment(s, app.recruitmentId);
  if (new Date(r.closeAt) < new Date())
    return { ok: false, reason: '모집 마감 후에는 취소할 수 없습니다.' };
  return { ok: true };
}

export function canBookInterview(s, app) {
  if (!app) return { ok: false, reason: '지원서를 찾을 수 없습니다.' };
  if (![AppStatus.DOC_PASSED, AppStatus.INTERVIEW_SCHEDULED].includes(app.status))
    return { ok: false, reason: '서류 합격자만 면접을 예약할 수 있습니다.' };
  return { ok: true };
}

/** 면접 변경/취소 기한 (정책: rescheduleHours 전까지) */
export function canChangeBooking(s, app) {
  if (!app?.interviewSlotId) return { ok: false, reason: '예약된 면접이 없습니다.' };
  const slot = findSlot(s, app.interviewSlotId);
  if (!slot) return { ok: false, reason: '면접 슬롯을 찾을 수 없습니다.' };
  const r = getRecruitment(s, app.recruitmentId);
  const hours = r?.policy?.rescheduleHours ?? 24;
  const limit = slotDateTime(slot).getTime() - hours * 3600000;
  if (Date.now() > limit)
    return { ok: false, reason: `면접 ${hours}시간 전까지만 변경할 수 있습니다.` };
  return { ok: true };
}

/* ─────────────── Validation ─────────────── */
export function validateProfile(p) {
  const e = {};
  if (!p.name?.trim()) e.name = '이름을 입력해주세요.';
  if (!p.department) e.department = '학과를 선택해주세요.';
  if (!/^\d{8,9}$/.test((p.studentId || '').trim()))
    e.studentId = '학번은 숫자 8~9자리입니다.';
  if (!/^01\d-?\d{3,4}-?\d{4}$/.test((p.phone || '').replace(/\s/g, '')))
    e.phone = '올바른 연락처 형식이 아닙니다.';
  return e;
}

export function validateApplyStep(step, draft, recruitment) {
  const e = {};
  if (step === 1) {
    if (!draft.name?.trim()) e.name = '이름을 입력해주세요.';
    if (!draft.department) e.department = '학과를 선택해주세요.';
    if (!/^\d{8,9}$/.test((draft.studentId || '').trim()))
      e.studentId = '학번은 숫자 8~9자리입니다.';
    if (!/^01\d-?\d{3,4}-?\d{4}$/.test((draft.phone || '').replace(/\s/g, '')))
      e.phone = '올바른 연락처 형식이 아닙니다.';
  }
  if (step === 2) {
    if (!draft.fieldId) e.fieldId = '지원 분야를 선택해주세요.';
    for (const q of recruitment.questions) {
      const v = (draft.answers?.[q.id] ?? '').toString().trim();
      if (q.required && !v) e[q.id] = '필수 문항입니다.';
      else if (q.maxLength && v.length > q.maxLength)
        e[q.id] = `${q.maxLength}자 이내로 작성해주세요.`;
    }
    if (draft.portfolioLink && !/^https?:\/\/.+/.test(draft.portfolioLink))
      e.portfolioLink = 'http(s):// 로 시작하는 URL을 입력해주세요.';
  }
  if (step === 3) {
    if (!draft.agree) e.agree = '개인정보 수집·이용에 동의해주세요.';
  }
  return e;
}

/* ─────────────── Notification factory ─────────────── */
let nid = 1000;
export function makeNotification({ category, kind, title, body, clubId, applicationId, cta }) {
  nid += 1;
  return {
    id: `n-${nid}`,
    category,
    kind,
    title,
    body,
    clubId: clubId ?? null,
    applicationId: applicationId ?? null,
    cta: cta ?? null,
    at: new Date().toISOString(),
    read: false,
  };
}

export { AppStatus, InternalStatus };
