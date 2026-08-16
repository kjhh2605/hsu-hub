/**
 * 도메인 상수 — 지원 상태 머신 / 라벨 / 카테고리
 *
 * 지원(Application) 상태 흐름
 *   DRAFT ─submit→ SUBMITTED ─운영진 검토 시작→ DOC_REVIEW
 *      ├─ 운영진 "합격(면접으로)" → DOC_PASSED ─면접 예약→ INTERVIEW_SCHEDULED
 *      │                                              └─면접 종료→ INTERVIEW_DONE → FINAL_PASSED | REJECTED
 *      └─ 운영진 "불합격"        → REJECTED
 *   지원자 취소 → CANCELED
 */
export const AppStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  DOC_REVIEW: 'DOC_REVIEW',
  DOC_PASSED: 'DOC_PASSED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_DONE: 'INTERVIEW_DONE',
  FINAL_PASSED: 'FINAL_PASSED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
};

/** 지원자에게 보이는 공개 상태 라벨 + 톤 */
export const STATUS_META = {
  DRAFT: { label: '작성 중', tone: 'neutral' },
  SUBMITTED: { label: '접수 완료', tone: 'primary' },
  DOC_REVIEW: { label: '서류 평가중', tone: 'neutral' },
  DOC_PASSED: { label: '면접 예약 대기', tone: 'primary' },
  INTERVIEW_SCHEDULED: { label: '면접 예정', tone: 'primary' },
  INTERVIEW_DONE: { label: '면접 완료', tone: 'neutral' },
  FINAL_PASSED: { label: '최종 합격', tone: 'mint' },
  REJECTED: { label: '불합격', tone: 'danger' },
  CANCELED: { label: '지원 취소', tone: 'neutral' },
};

/** 운영진 내부 상태 라벨 (지원자에게 노출되지 않음) */
export const INTERNAL_META = {
  UNREVIEWED: { label: '미검토', tone: 'neutral' },
  REVIEWING: { label: '검토 중', tone: 'accent' },
  PASS_PREDICTED: { label: '합격 예정', tone: 'mint' },
  FAIL_PREDICTED: { label: '불합격 예정', tone: 'danger' },
  HOLD: { label: '보류', tone: 'outline' },
};

export const InternalStatus = {
  UNREVIEWED: 'UNREVIEWED',
  REVIEWING: 'REVIEWING',
  PASS_PREDICTED: 'PASS_PREDICTED',
  FAIL_PREDICTED: 'FAIL_PREDICTED',
  HOLD: 'HOLD',
};

/** 지원 진행 4단계 스테퍼 (Figma "내 지원 현황" 카드) */
export const STEPS = ['서류제출', '서류검토', '면접', '최종발표'];

/**
 * 상태 → 스테퍼 진행도
 * done: 완료된 단계 수, active: 현재 진행 중 인덱스(-1이면 없음)
 */
export function stepProgress(status) {
  switch (status) {
    case AppStatus.SUBMITTED:
      return { done: 1, active: 1 };
    case AppStatus.DOC_REVIEW:
      return { done: 1, active: 1 };
    case AppStatus.DOC_PASSED:
      return { done: 2, active: 2 };
    case AppStatus.INTERVIEW_SCHEDULED:
      return { done: 2, active: 2 };
    case AppStatus.INTERVIEW_DONE:
      return { done: 3, active: 3 };
    case AppStatus.FINAL_PASSED:
      return { done: 4, active: -1 };
    case AppStatus.REJECTED:
      return { done: 1, active: -1 };
    default:
      return { done: 0, active: 0 };
  }
}

/** 상태별 지원자 안내 문구 */
export const STATUS_MESSAGE = {
  SUBMITTED: '지원서가 성공적으로 접수되었습니다. 결과를 기다려 주세요.',
  DOC_REVIEW: '지원서가 접수되어 현재 운영진이 꼼꼼히 검토 중입니다.',
  DOC_PASSED: '축하합니다! 서류 전형에 합격하셨습니다. 면접 일정을 선택해 주세요.',
  INTERVIEW_SCHEDULED: '면접 일정이 확정되었습니다. 아래 정보를 확인해 주세요.',
  INTERVIEW_DONE: '면접이 완료되었습니다. 최종 결과를 기다려 주세요.',
  FINAL_PASSED: '최종 합격을 진심으로 축하드립니다! 환영식 일정을 확인해 주세요.',
  REJECTED: '아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다.',
  CANCELED: '지원이 취소되었습니다.',
};

/** 동아리 카테고리 */
export const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'it', label: 'IT/개발' },
  { id: 'design', label: '디자인' },
  { id: 'music', label: '음악/공연' },
  { id: 'art', label: '예술/사진' },
  { id: 'academic', label: '학술/연구' },
  { id: 'sports', label: '스포츠' },
];

export const CATEGORY_LABEL = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c.label;
  return acc;
}, {});

/** 알림 카테고리 */
export const NOTI_CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'result', label: '지원 결과' },
  { id: 'schedule', label: '일정 안내' },
  { id: 'notice', label: '공지사항' },
];

/** 학과 목록 (프로필/지원서 공용) */
export const DEPARTMENTS = [
  '컴퓨터공학과',
  '소프트웨어학과',
  '데이터사이언스학과',
  '전자공학과',
  '산업디자인학과',
  '시각디자인학과',
  '경영학과',
  '경제학과',
  '심리학과',
  '신문방송학과',
  '체육학과',
];
