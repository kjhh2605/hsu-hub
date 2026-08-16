import { ymd, iso, md, dayLabel, shortDay, currentSemester } from '@/lib/seedClock';

/** 더미 데이터 — 운영진 측: 지원자 명단 / 면접 세션 / 평가 / 대시보드 통계 */

const NAMES = [
  '김민준', '이서아', '박도윤', '최하은', '정시우', '강지유', '조예준', '윤수아',
  '장건우', '임채원', '한지호', '오다은', '서준서', '신아린', '권태윤', '황서윤',
  '안유찬', '송하윤', '류지훈', '문가온', '배소율', '남시윤', '고은우', '심나윤',
  '유하준', '전서연', '노민서', '하지안', '구예서', '변재이', '표주원', '석다인',
  '차현우', '허윤서', '남궁윈', '진하람', '봉시현', '탁예린', '민준혁', '설아윤',
];

const DEPTS = [
  '컴퓨터공학과', '전자공학과', '경영학과', '산업디자인학과', '심리학과',
  '기계공학과', '미디어커뮤니케이션학과', '경제학과', '수학과', '건축학과',
];

const TRACKS = [
  { value: 'fe', label: '프론트엔드' },
  { value: 'be', label: '백엔드' },
  { value: 'design', label: '디자인' },
  { value: 'pm', label: '기획/PM' },
];

/** 결정적(deterministic) 의사 난수 — 새로고침해도 동일한 더미 데이터 */
function seeded(i, mod) {
  return (i * 2654435761) % mod;
}

const STATUS_PLAN = [
  // status, label, tone
  ['docPass', '서류 합격', 'mint'],
  ['reviewing', '검토중', 'primary'],
  ['docFail', '서류 불합격', 'danger'],
  ['interviewScheduled', '면접 예정', 'primary'],
  ['interviewDone', '면접 완료', 'slate'],
  ['finalPass', '최종 합격', 'mint'],
  ['pending', '미검토', 'neutral'],
];

export const APPLICANTS = NAMES.map((name, i) => {
  const [status, statusLabel, tone] = STATUS_PLAN[i % STATUS_PLAN.length];
  const track = TRACKS[seeded(i + 3, 4)];
  const scoreBase = 55 + (seeded(i + 7, 45));
  return {
    id: `apl-${String(i + 1).padStart(3, '0')}`,
    recruitmentId: 'rec-likelion-12',
    name,
    avatar: ['🧑‍💻', '👩‍🎨', '🧑‍🎓', '👨‍🔬', '👩‍💻', '🧑‍🚀'][i % 6],
    studentId: `2023${String(1000 + seeded(i + 11, 8999)).padStart(4, '0')}`,
    department: DEPTS[seeded(i + 5, 10)],
    grade: 1 + (seeded(i + 2, 4)),
    email: `student${i + 1}@campus.ac.kr`,
    phone: `010-${String(1000 + seeded(i + 13, 8999)).padStart(4, '0')}-${String(1000 + seeded(i + 17, 8999)).padStart(4, '0')}`,
    track: track.value,
    trackLabel: track.label,
    status,
    statusLabel,
    tone,
    submittedAt: iso(-9 + (i % 9), 9 + (i % 12), seeded(i + 19, 60)),
    docScore: Math.min(100, scoreBase),
    interviewScore: status === 'interviewDone' || status === 'finalPass' ? Math.min(100, scoreBase - 3) : null,
    starred: i % 7 === 0,
    memoCount: seeded(i + 23, 4),
    reviewerCount: 1 + seeded(i + 29, 3),
    tags: [
      ...(i % 5 === 0 ? ['포트폴리오 우수'] : []),
      ...(i % 4 === 0 ? ['비전공'] : []),
      ...(i % 6 === 0 ? ['재지원'] : []),
    ],
    answers: {
      motivation:
        i % 3 === 0
          ? '학과 수업에서 배운 이론을 실제 서비스로 만들어 보고 싶어 지원했습니다. 특히 사용자 인터페이스를 설계하는 과정에 관심이 많습니다.'
          : '혼자 공부하다 협업의 필요성을 느꼈습니다. 팀 프로젝트를 통해 기획부터 배포까지 경험하고 싶습니다.',
      experience:
        i % 4 === 0
          ? '없음'
          : '교내 해커톤에 2회 참가하여 프로토타입을 제작했습니다. Figma와 React를 사용했습니다.',
      skills: ['html', 'js', ...(i % 2 ? ['react'] : ['python']), ...(i % 3 ? ['git'] : ['figma'])],
      availability: ['tue19', ...(i % 2 ? ['thu19'] : ['sat14'])],
      portfolio: i % 3 === 0 ? `https://github.com/student${i + 1}` : ``,
    },
    memos: [
      ...(i % 3 === 0
        ? [{ id: `m-${i}-1`, author: '이서연', at: iso(-2, 11, 20), text: '지원 동기가 구체적이고 트랙 이해도가 높음. 면접 대상 추천.' }]
        : []),
      ...(i % 5 === 0
        ? [{ id: `m-${i}-2`, author: '박준호', at: iso(-2, 15, 2), text: '포트폴리오 완성도 좋음. 다만 협업 경험 확인 필요.' }]
        : []),
    ],
    scores: {
      motivation: 3 + seeded(i + 31, 3),
      skill: 2 + seeded(i + 37, 4),
      fit: 3 + seeded(i + 41, 3),
      communication: 2 + seeded(i + 43, 4),
    },
  };
});

/** 면접 세션 (운영진) */
export const INTERVIEW_SESSIONS = [
  {
    id: 'ses-1',
    recruitmentId: 'rec-likelion-12',
    name: `1차 면접 · ${shortDay(6)}`,
    date: ymd(6),
    dayLabel: dayLabel(6),
    place: '학생회관 302호 세미나실',
    status: 'open', // open | full | closed | done
    slotMinutes: 30,
    capacityPerSlot: 1,
    interviewers: ['이서연', '박준호'],
    slots: [
      { id: 'slot-1', start: '13:00', end: '13:30', capacity: 1, booked: 1, applicantIds: ['apl-001'] },
      { id: 'slot-2', start: '14:00', end: '14:30', capacity: 1, booked: 1, applicantIds: ['apl-002'] },
      { id: 'slot-3', start: '14:30', end: '15:00', capacity: 1, booked: 0, applicantIds: [] },
      { id: 'slot-4', start: '15:00', end: '15:30', capacity: 1, booked: 1, applicantIds: ['apl-004'] },
      { id: 'slot-5', start: '15:30', end: '16:00', capacity: 1, booked: 0, applicantIds: [] },
      { id: 'slot-6', start: '16:00', end: '16:30', capacity: 1, booked: 1, applicantIds: ['apl-008'] },
      { id: 'slot-7', start: '16:30', end: '17:00', capacity: 1, booked: 0, applicantIds: [] },
      { id: 'slot-8', start: '17:00', end: '17:30', capacity: 1, booked: 0, applicantIds: [] },
    ],
  },
  {
    id: 'ses-2',
    recruitmentId: 'rec-likelion-12',
    name: `1차 면접 · ${shortDay(7)}`,
    date: ymd(7),
    dayLabel: dayLabel(7),
    place: '학생회관 302호 세미나실',
    status: 'open',
    slotMinutes: 30,
    capacityPerSlot: 2,
    interviewers: ['이서연', '최윤아'],
    slots: [
      { id: 'slot-9', start: '11:00', end: '11:30', capacity: 2, booked: 2, applicantIds: ['apl-011', 'apl-012'] },
      { id: 'slot-10', start: '11:30', end: '12:00', capacity: 2, booked: 1, applicantIds: ['apl-015'] },
      { id: 'slot-11', start: '13:00', end: '13:30', capacity: 2, booked: 0, applicantIds: [] },
      { id: 'slot-12', start: '13:30', end: '14:00', capacity: 2, booked: 2, applicantIds: ['apl-018', 'apl-022'] },
      { id: 'slot-13', start: '14:00', end: '14:30', capacity: 2, booked: 0, applicantIds: [] },
      { id: 'slot-14', start: '14:30', end: '15:00', capacity: 2, booked: 1, applicantIds: ['apl-025'] },
    ],
  },
  {
    id: 'ses-3',
    recruitmentId: 'rec-likelion-12',
    name: `2차 심층 면접 · ${shortDay(8)}`,
    date: ymd(8),
    dayLabel: dayLabel(8),
    place: '온라인 (Zoom)',
    status: 'closed',
    slotMinutes: 40,
    capacityPerSlot: 1,
    interviewers: ['이서연', '박준호', '최윤아'],
    slots: [
      { id: 'slot-15', start: '19:00', end: '19:40', capacity: 1, booked: 1, applicantIds: ['apl-006'] },
      { id: 'slot-16', start: '19:40', end: '20:20', capacity: 1, booked: 1, applicantIds: ['apl-013'] },
      { id: 'slot-17', start: '20:20', end: '21:00', capacity: 1, booked: 0, applicantIds: [] },
    ],
  },
];

/** 면접 평가 기준 */
export const EVALUATION_CRITERIA = [
  { id: 'motivation', label: '지원 동기 / 열정', desc: '동아리 활동에 대한 이해와 참여 의지', weight: 30, max: 5 },
  { id: 'skill', label: '기초 역량', desc: '희망 트랙 관련 기본 지식과 학습 능력', weight: 25, max: 5 },
  { id: 'fit', label: '팀 적합도', desc: '협업 태도, 커뮤니티 기여 가능성', weight: 25, max: 5 },
  { id: 'communication', label: '커뮤니케이션', desc: '논리적 전달력과 경청 태도', weight: 20, max: 5 },
];

export const EVALUATION_RECOMMENDATIONS = [
  { value: 'strongPass', label: '강력 추천', tone: 'mint' },
  { value: 'pass', label: '합격', tone: 'primary' },
  { value: 'hold', label: '보류', tone: 'amber' },
  { value: 'fail', label: '불합격', tone: 'danger' },
];

/** 면접 질문 가이드 (평가 화면에서 사용) */
export const INTERVIEW_QUESTIONS = [
  { id: 'q1', category: '아이스브레이킹', text: '간단한 자기소개 부탁드립니다. (1분)' },
  { id: 'q2', category: '지원 동기', text: '여러 IT 동아리 중 멋쟁이사자처럼을 선택한 이유가 무엇인가요?' },
  { id: 'q3', category: '지원 동기', text: '지원서에 적은 “만들고 싶은 서비스”를 조금 더 설명해 주세요.' },
  { id: 'q4', category: '역량', text: '희망 트랙에서 지금 할 수 있는 것과 배우고 싶은 것을 구분해 말씀해 주세요.' },
  { id: 'q5', category: '역량', text: '독학하며 막혔던 문제를 어떻게 해결했는지 사례를 들어주세요.' },
  { id: 'q6', category: '협업', text: '팀에서 의견이 충돌했을 때 어떻게 대응했나요?' },
  { id: 'q7', category: '활동 가능성', text: '주 1회 세션 외 팀 프로젝트에 주당 몇 시간 투입 가능한가요?' },
  { id: 'q8', category: '마무리', text: '마지막으로 궁금한 점이나 하고 싶은 말이 있나요?' },
];

/* ------------------------------------------------------------------ */
/* 대시보드 통계 — APPLICANTS 에서 파생시켜 화면 간 수치가 어긋나지 않게 한다  */
/* ------------------------------------------------------------------ */

const countBy = (fn) => APPLICANTS.filter(fn).length;

const TOTAL_APPLICANTS = APPLICANTS.length;
const PENDING = countBy((a) => a.status === 'pending');
/** 서류 합격 이후 단계에 있는 지원자 */
const DOC_PASSED = countBy((a) =>
  ['docPass', 'interviewScheduled', 'interviewDone', 'finalPass'].includes(a.status),
);
const INTERVIEW_DONE = countBy((a) => ['interviewDone', 'finalPass'].includes(a.status));
const FINAL_PASS = countBy((a) => a.status === 'finalPass');
const TOTAL_SLOTS = INTERVIEW_SESSIONS.reduce((n, s) => n + s.slots.length, 0);
const BOOKED_SLOTS = INTERVIEW_SESSIONS.reduce(
  (n, s) => n + s.slots.reduce((m, sl) => m + sl.booked, 0),
  0,
);
const QUOTA = 30;
const VIEW_COUNT = 3241;

/** 일별 접수 추이 — 합계가 총 지원자 수와 정확히 일치하도록 생성 */
const DAILY_SHAPE = [1, 2, 1, 2, 2, 3, 2, 3, 3, 1, 1, 2, 3, 4, 3, 4, 3];
const DAILY_DATES = Array.from({ length: 17 }, (_, i) => md(-17 + i));
const dailyRaw = DAILY_DATES.map((date, i) => ({ date, count: DAILY_SHAPE[i] }));
const dailySum = dailyRaw.reduce((n, d) => n + d.count, 0);
// 마지막 날짜에 차이를 흡수시켜 합계 = TOTAL_APPLICANTS
dailyRaw[dailyRaw.length - 1].count += TOTAL_APPLICANTS - dailySum;

const TRACK_TONES = { fe: '#0058BE', be: '#2170E4', design: '#4648D4', pm: '#6CF8BB' };
const TRACK_LABELS = { fe: '프론트엔드', be: '백엔드', design: '디자인', pm: '기획/PM' };

export const DASHBOARD = {
  clubName: '멋쟁이사자처럼 12기',
  semester: currentSemester(),
  recruitmentId: 'rec-likelion-12',
  quota: QUOTA,
  kpis: [
    {
      key: 'applicants',
      label: '총 지원자',
      value: TOTAL_APPLICANTS,
      delta: +7,
      deltaLabel: '어제 대비',
      icon: 'Users',
      tone: 'primary',
    },
    {
      key: 'unreviewed',
      label: '미검토 지원서',
      value: PENDING,
      delta: -3,
      deltaLabel: '어제 대비',
      icon: 'FileClock',
      tone: 'amber',
    },
    {
      key: 'interviewBooked',
      label: '면접 예약',
      value: BOOKED_SLOTS,
      suffix: `/ ${TOTAL_SLOTS}`,
      delta: +2,
      deltaLabel: '어제 대비',
      icon: 'CalendarCheck',
      tone: 'mint',
    },
    {
      key: 'competition',
      label: '경쟁률',
      value: Number((TOTAL_APPLICANTS / QUOTA).toFixed(1)),
      suffix: ': 1',
      delta: +0.3,
      deltaLabel: '전기 대비',
      icon: 'TrendingUp',
      tone: 'slate',
    },
  ],
  funnel: [
    { key: 'view', label: '공고 조회', value: VIEW_COUNT },
    { key: 'start', label: '작성 시작', value: Math.round(TOTAL_APPLICANTS * 2.4) },
    { key: 'submit', label: '지원 완료', value: TOTAL_APPLICANTS },
    { key: 'docPass', label: '서류 합격', value: DOC_PASSED },
    { key: 'interview', label: '면접 완료', value: INTERVIEW_DONE },
    { key: 'final', label: '최종 합격', value: FINAL_PASS },
  ],
  dailyApplications: dailyRaw,
  trackDistribution: ['fe', 'be', 'design', 'pm'].map((key) => ({
    key,
    label: TRACK_LABELS[key],
    value: countBy((a) => a.track === key),
    tone: TRACK_TONES[key],
  })),
  todos: [
    { id: 't1', label: '미검토 지원서 ' + PENDING + '건 검토', due: '오늘', done: false, to: '/admin/applicants', tone: 'danger' },
    { id: 't2', label: shortDay(7) + ' 면접 슬롯 2개 추가 개설', due: '내일', done: false, to: '/admin/interviews', tone: 'amber' },
    { id: 't3', label: '서류 합격 발표 문구 확정', due: shortDay(2), done: true, to: '/admin/results', tone: 'mint' },
    { id: 't4', label: '면접관 배정 확정 (3명)', due: shortDay(4), done: false, to: '/admin/interviews', tone: 'primary' },
  ],
  activities: [
    { id: 'a1', who: '박준호', what: '지원자 ' + DOC_PASSED + '명을 서류 합격 처리했습니다.', at: '10분 전', icon: 'CheckCircle2' },
    { id: 'a2', who: '최윤아', what: '“1차 면접 · ' + shortDay(7) + '” 세션을 생성했습니다.', at: '1시간 전', icon: 'CalendarPlus' },
    { id: 'a3', who: '이서연', what: '지원서 폼의 질문 2개를 수정했습니다.', at: '3시간 전', icon: 'PencilLine' },
    { id: 'a4', who: '시스템', what: '지원 마감 D-1 알림이 ' + TOTAL_APPLICANTS + '명에게 발송되었습니다.', at: '어제', icon: 'BellRing' },
    { id: 'a5', who: '박준호', what: '지원자 apl-013에 메모를 남겼습니다.', at: '어제', icon: 'MessageSquare' },
  ],
  /** 파생 지표 — 다른 화면에서도 동일한 수치를 쓰도록 노출 */
  derived: {
    total: TOTAL_APPLICANTS,
    pending: PENDING,
    docPassed: DOC_PASSED,
    interviewDone: INTERVIEW_DONE,
    finalPass: FINAL_PASS,
    totalSlots: TOTAL_SLOTS,
    bookedSlots: BOOKED_SLOTS,
    quota: QUOTA,
    viewCount: VIEW_COUNT,
  },
};

/** 결과 발표 대상 */
export const RESULT_BATCH = {
  id: 'batch-doc-1',
  recruitmentId: 'rec-likelion-12',
  stage: 'docResult',
  stageLabel: '서류 전형 결과',
  scheduledAt: iso(2, 10, 0),
  status: 'draft', // draft | scheduled | published
  passTemplate:
    '{이름}님, 축하합니다! 멋쟁이사자처럼 12기 서류 전형에 합격하셨습니다.\n아래 링크에서 면접 시간을 선택해 주세요. (' +
    shortDay(4) +
    ' 23:59 마감)',
  failTemplate:
    '{이름}님, 멋쟁이사자처럼 12기에 관심 가져주셔서 감사합니다.\n아쉽게도 이번 서류 전형에서는 함께하지 못하게 되었습니다. 다음 기회에 꼭 만나뵙기를 바랍니다.',
  channels: { push: true, email: true, kakao: false },
  passIds: APPLICANTS.filter((a) => ['docPass', 'interviewScheduled', 'interviewDone', 'finalPass'].includes(a.status)).map((a) => a.id),
  failIds: APPLICANTS.filter((a) => a.status === 'docFail').map((a) => a.id),
  holdIds: APPLICANTS.filter((a) => ['reviewing', 'pending'].includes(a.status)).map((a) => a.id),
};

export const getApplicant = (id) => APPLICANTS.find((a) => a.id === id);
export const getSession = (id) => INTERVIEW_SESSIONS.find((s) => s.id === id);
export const getSlot = (slotId) => {
  for (const s of INTERVIEW_SESSIONS) {
    const slot = s.slots.find((sl) => sl.id === slotId);
    if (slot) return { session: s, slot };
  }
  return null;
};
