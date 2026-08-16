/** 공통 유틸 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n) => String(n).padStart(2, '0');

export function parseDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 2025-03-15 → "3월 15일 (토)" */
export function formatDayLabel(v) {
  const d = parseDate(v);
  if (!d) return '';
  return d.getMonth() + 1 + '월 ' + d.getDate() + '일 (' + WEEKDAYS[d.getDay()] + ')';
}

/** ISO → "2025.03.15 22:14" */
export function formatDateTime(v) {
  const d = parseDate(v);
  if (!d) return '';
  return (
    d.getFullYear() +
    '.' +
    pad(d.getMonth() + 1) +
    '.' +
    pad(d.getDate()) +
    ' ' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  );
}

/** ISO → "2025.03.15" */
export function formatDate(v) {
  const d = parseDate(v);
  if (!d) return '';
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
}

/** 상대 시간: "3시간 전" */
export function timeAgo(v, now = new Date()) {
  const d = parseDate(v);
  if (!d) return '';
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + '일 전';
  return formatDate(d);
}

/** D-day 계산 (양수 = 남은 일수) */
export function daysUntil(v, now = new Date()) {
  const d = parseDate(v);
  if (!d) return null;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86400000);
}

export function ddayLabel(v, now = new Date()) {
  const n = daysUntil(v, now);
  if (n == null) return '';
  if (n === 0) return 'D-DAY';
  if (n > 0) return 'D-' + n;
  return '마감 ' + Math.abs(n) + '일 경과';
}

/** 오전/오후 표기 */
export function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [hStr, m] = hhmm.split(':');
  const h = Number(hStr);
  const suffix = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return suffix + ' ' + h12 + ':' + m;
}

export function formatRange12(start, end) {
  if (!start || !end) return '';
  const [sh] = start.split(':').map(Number);
  const suffix = sh < 12 ? '오전' : '오후';
  const to12 = (t) => {
    const [h, m] = t.split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + pad(m);
  };
  return suffix + ' ' + to12(start) + ' ~ ' + to12(end);
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export const num = (n) => (n ?? 0).toLocaleString('ko-KR');

/** 폼 유효성 검사: 폼 스키마 1 스텝 검증 */
export function validateStep(step, answers) {
  const errors = {};
  (step?.fields ?? []).forEach((f) => {
    const v = answers[f.id];
    if (f.required) {
      const empty =
        v == null ||
        v === '' ||
        (Array.isArray(v) && v.length === 0) ||
        (f.type === 'consent' && v !== true);
      if (empty) {
        errors[f.id] = f.type === 'consent' ? '필수 동의 항목입니다.' : '필수 입력 항목입니다.';
        return;
      }
    }
    if (f.minLength && typeof v === 'string' && v.length > 0 && v.length < f.minLength) {
      errors[f.id] = f.minLength + '자 이상 입력해 주세요. (현재 ' + v.length + '자)';
    }
    if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[f.id] = '이메일 형식이 올바르지 않습니다.';
    }
    if (f.type === 'tel' && v && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(String(v).replace(/\s/g, ''))) {
      errors[f.id] = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    if ((f.type === 'url' || f.id === 'portfolio') && v && !/^https?:\/\/.+/.test(v)) {
      errors[f.id] = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.';
    }
  });
  return errors;
}

/** 스텝 완성도(%) */
export function stepCompletion(step, answers) {
  const fields = step?.fields ?? [];
  if (!fields.length) return 100;
  const filled = fields.filter((f) => {
    const v = answers[f.id];
    return !(v == null || v === '' || (Array.isArray(v) && v.length === 0) || v === false);
  }).length;
  return pct(filled, fields.length);
}

/** 검색 매칭 (부분 문자열) */
export function matches(haystack, needle) {
  if (!needle) return true;
  return String(haystack ?? '')
    .toLowerCase()
    .includes(String(needle).toLowerCase());
}

/** 배열 groupBy */
export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

/** 평가 총점 → 100점 환산 */
export function weightedScore(scores, criteria) {
  let total = 0;
  criteria.forEach((c) => {
    const v = Number(scores?.[c.id] ?? 0);
    total += (v / c.max) * c.weight;
  });
  return Math.round(total);
}
