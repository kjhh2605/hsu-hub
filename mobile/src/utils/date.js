const WD = ['일', '월', '화', '수', '목', '금', '토'];

export const toDate = (v) => (v instanceof Date ? v : new Date(v));

/** 2025년 3월 15일 (금) */
export function fmtFullDate(v) {
  const x = toDate(v);
  return `${x.getFullYear()}년 ${x.getMonth() + 1}월 ${x.getDate()}일 (${WD[x.getDay()]})`;
}

/** 3월 15일 (금) */
export function fmtDate(v) {
  const x = toDate(v);
  return `${x.getMonth() + 1}월 ${x.getDate()}일 (${WD[x.getDay()]})`;
}

/** 03.15 */
export function fmtShort(v) {
  const x = toDate(v);
  return `${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')}`;
}

/** 2025.03.15 14:22 */
export function fmtDateTime(v) {
  const x = toDate(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}.${p(x.getMonth() + 1)}.${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`;
}

/** 오후 2:30 */
export function fmtTimeKo(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`;
}

/** 방금 전 / 2시간 전 / 어제 / 3일 전 */
export function fmtRelative(v) {
  const diff = Date.now() - toDate(v).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  return fmtShort(v);
}

/** D-5 / D-DAY / 마감 */
export function dDay(v) {
  const target = toDate(v);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t2 = new Date(target);
  t2.setHours(0, 0, 0, 0);
  const day = Math.round((t2 - today) / 86400000);
  if (day < 0) return '마감';
  if (day === 0) return 'D-DAY';
  return `D-${day}`;
}

export function daysLeft(v) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t2 = toDate(v);
  t2.setHours(0, 0, 0, 0);
  return Math.round((t2 - today) / 86400000);
}

export const isPast = (v) => toDate(v).getTime() < Date.now();

/** 슬롯 시각(ISO) 계산 — date(YYYY-MM-DD) + start(HH:mm) */
export function slotDateTime(slot) {
  return new Date(`${slot.date}T${slot.start}:00`);
}

/** 달력 그리드 생성 (해당 월 + 앞뒤 여백) */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    cells.push({ day: prevLast - i, inMonth: false, key: `p${i}` });
  }
  for (let day = 1; day <= lastDay; day++) {
    cells.push({ day, inMonth: true, key: `c${day}`, iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length, inMonth: false, key: `n${cells.length}` });
  }
  return cells;
}

export const MONTH_LABEL = (y, m) => `${y}년 ${m + 1}월`;
export const WEEKDAYS = WD;
