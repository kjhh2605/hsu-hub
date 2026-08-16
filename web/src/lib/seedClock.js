/**
 * 더미데이터용 기준 시계.
 *
 * 데이터에 고정 날짜(2025-03-08 등)를 박아두면 시간이 지날수록
 * "마감 N일 경과", "1년 전" 같은 이상한 라벨이 노출된다.
 * 그래서 모든 시드 날짜를 오늘 기준 상대값으로 만든다.
 *
 * ANCHOR 는 모듈 로드 시 한 번만 계산되므로 한 세션 안에서는 값이 흔들리지 않는다.
 */

const now = new Date();

/** 오늘 00:00 */
export const ANCHOR = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const pad = (n) => String(n).padStart(2, '0');

/** 오늘 + n일 → Date */
export function dayFrom(n) {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() + n);
  return d;
}

/** 오늘 + n일 → 'YYYY-MM-DD' */
export function ymd(n) {
  const d = dayFrom(n);
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
}

/** 오늘 + n일 → 'MM-DD' (차트 축 라벨) */
export function md(n) {
  const d = dayFrom(n);
  return [pad(d.getMonth() + 1), pad(d.getDate())].join('-');
}

/** 오늘 + n일 h시 m분 → ISO(+09:00) 문자열 */
export function iso(n, h = 9, m = 0) {
  const d = dayFrom(n);
  const date = [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
  const time = [pad(h), pad(m), '00'].join(':');
  return date + 'T' + time + '+09:00';
}

/** 지금으로부터 h시간 전 → ISO(+09:00) 문자열 */
export function hoursAgo(h) {
  const d = new Date(now.getTime() - h * 3600 * 1000);
  const date = [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
  const time = [pad(d.getHours()), pad(d.getMinutes()), '00'].join(':');
  return date + 'T' + time + '+09:00';
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘 + n일 → '8월 7일 (금)' */
export function dayLabel(n) {
  const d = dayFrom(n);
  return d.getMonth() + 1 + '월 ' + d.getDate() + '일 (' + WEEKDAYS[d.getDay()] + ')';
}

/** 오늘 + n일 → '8월 7일' */
export function shortDay(n) {
  const d = dayFrom(n);
  return d.getMonth() + 1 + '월 ' + d.getDate() + '일';
}

/**
 * 지금 모집하는 대상 학기.
 * 다음에 시작하는 학기를 기준으로 한다. (1학기 3월 시작 / 2학기 9월 시작)
 *  - 1~2월  → 올해 1학기
 *  - 3~8월  → 올해 2학기
 *  - 9~12월 → 내년 1학기
 */
export function currentSemester() {
  const y = ANCHOR.getFullYear();
  const m = ANCHOR.getMonth() + 1;
  if (m <= 2) return y + '-1학기';
  if (m <= 8) return y + '-2학기';
  return y + 1 + '-1학기';
}

/** 그 다음 학기 (모집 생성 위저드 기본값) */
export function nextSemester() {
  const cur = currentSemester();
  const [y, t] = cur.split('-');
  return t.startsWith('1') ? y + '-2학기' : Number(y) + 1 + '-1학기';
}

/**
 * 모집 전형 타임라인 오프셋 (오늘 기준 일수).
 * 스토리: 서류 접수는 어제 마감 → 서류 발표 2일 후 → 면접 6~8일 후 → 최종 발표 11일 후
 */
export const TIMELINE = {
  openAt: -17,
  closeAt: -1,
  docResult: 2,
  interviewFrom: 6,
  interviewTo: 8,
  finalResult: 11,
};
