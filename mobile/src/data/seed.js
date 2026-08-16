import { AppStatus, InternalStatus } from './constants.js';

/* ── 날짜 유틸 (기준: 앱 실행 시각) ───────────────── */
const NOW = new Date();
const d = (days, hour = 9, min = 0) => {
  const x = new Date(NOW);
  x.setDate(x.getDate() + days);
  x.setHours(hour, min, 0, 0);
  return x.toISOString();
};
export const SEED_NOW = NOW.toISOString();

/* ── 로그인 계정 (더미) ─────────────────────────── */
export const seedUser = {
  id: 'u-me',
  name: '김캠퍼',
  studentId: '20231234',
  department: '경영학과',
  grade: 3,
  admissionYear: 21,
  phone: '010-1234-5678',
  email: 'campus.kim@university.ac.kr',
  avatarColor: '#0058BE',
  profileComplete: false,
  role: 'applicant', // 'applicant' | 'admin'
  managedClubId: 'c-cm', // 운영진 모드에서 관리하는 동아리
};

/* ── 동아리 ─────────────────────────────────── */
export const seedClubs = [
  {
    id: 'c-cm',
    name: '크리에이티브 메이커스',
    shortName: 'CM',
    category: 'it',
    tagline: '당신의 아이디어가 현실이 되는 곳. 기획부터 디자인, 개발까지 함께 성장하는 실전 프로젝트 동아리입니다.',
    heroTone: '#0058BE',
    intro:
      '크리에이티브 메이커스(CM)는 단순한 스터디를 넘어, 실제 프로덕트를 세상에 내놓는 경험을 지향합니다. 완벽한 실력보다는 실패를 두려워하지 않는 실행력과 끈끈한 팀워크를 중요하게 생각합니다. 새로운 기술에 호기심이 많고, 동료와 함께 성장하는 것에 가치를 두는 분이라면 누구나 환영합니다.',
    memberCount: 48,
    recruitCount: 12,
    period: '1년 (2학기)',
    place: '제1학생회관 302호',
    benefits: [
      { icon: 'rocket', title: '실전 프로젝트 경험', desc: '실제 유저를 대상으로 하는 서비스를 기획하고 런칭합니다.' },
      { icon: 'users', title: '현직자 멘토링', desc: '현업 개발자 선배들의 코드 리뷰와 밀착 멘토링을 제공합니다.' },
      { icon: 'cloud', title: '인프라 지원', desc: 'AWS 크레딧, 노션 팀 플랜 등 개발과 협업에 필요한 툴을 지원합니다.' },
    ],
    timeline: [
      { month: '3월', title: '팀 빌딩 및 아이디어톤', desc: '서로를 알아가고 한 학기 동안 진행할 프로젝트의 씨앗을 발굴합니다.' },
      { month: '5월', title: '중간점검 해커톤', desc: '무박 2일 동안 MVP 모델을 완성하고 현직자 피드백을 받습니다.' },
      { month: '11월', title: '파이널 데모데이', desc: '최종 프로덕트를 대중에게 공개하고, 엔젤 투자자와의 네트워킹을 진행합니다.' },
    ],
    faq: [
      { q: '비전공자나 노베이스도 지원 가능한가요?', a: '물론입니다. 매 학기 초 4주간 기초 트랙을 운영하며, 비전공자 비율이 약 40%입니다. 실행력과 성장 의지를 가장 중요하게 봅니다.' },
      { q: '매주 정기 모임은 언제 진행되나요?', a: '매주 수요일 저녁 7시에 정기 세션이 있고, 팀별 스프린트 미팅은 팀 자율로 진행합니다.' },
      { q: '회비가 있나요?', a: '학기당 3만원이며, 간식/서버 비용/데모데이 운영비로 사용됩니다.' },
    ],
  },
  {
    id: 'c-band',
    name: '중앙밴드 딩가딩가',
    shortName: '딩가딩가',
    category: 'music',
    tagline: '무대 위에서 가장 빛나는 순간. 장르 무관, 열정만 있으면 됩니다.',
    heroTone: '#4648D4',
    intro:
      '30년 전통의 중앙 밴드 동아리입니다. 매 학기 정기공연과 축제 무대를 준비하며, 세션별 파트 연습과 합주를 병행합니다. 악기 경험이 없어도 파트 선배가 1:1로 가르쳐 드립니다.',
    memberCount: 36,
    recruitCount: 8,
    period: '1년 (2학기)',
    place: '학생회관 지하 합주실',
    benefits: [
      { icon: 'rocket', title: '정기 공연 2회', desc: '5월 축제 무대와 11월 정기공연에서 직접 연주합니다.' },
      { icon: 'users', title: '파트별 1:1 레슨', desc: '보컬/기타/베이스/드럼/키보드 파트 선배가 기초부터 지도합니다.' },
      { icon: 'cloud', title: '악기·합주실 무료', desc: '동아리 보유 악기와 합주실을 24시간 이용할 수 있습니다.' },
    ],
    timeline: [
      { month: '3월', title: '신입 파트 배정 & 기초 레슨', desc: '희망 파트를 배정받고 4주간 기초 레슨을 진행합니다.' },
      { month: '5월', title: '봄 축제 무대', desc: '신입 부원 데뷔 무대가 열립니다.' },
      { month: '11월', title: '정기 공연', desc: '전 부원이 참여하는 대규모 정기 공연을 진행합니다.' },
    ],
    faq: [
      { q: '악기를 다뤄본 적이 없어도 되나요?', a: '네, 신입 부원의 절반 이상이 초보로 시작합니다.' },
      { q: '연습은 얼마나 자주 하나요?', a: '파트 연습 주 1회, 공연 4주 전부터는 주 2회 합주가 있습니다.' },
    ],
  },
  {
    id: 'c-photo',
    name: '사진동아리 찰칵',
    shortName: '찰칵',
    category: 'art',
    tagline: '셔터를 누르는 순간, 캠퍼스가 작품이 됩니다.',
    heroTone: '#006C49',
    intro:
      '출사, 암실 작업, 전시 기획까지 사진의 전 과정을 경험하는 동아리입니다. 필름과 디지털 모두 다루며 매 학기 교내 전시를 엽니다.',
    memberCount: 52,
    recruitCount: 15,
    period: '1년 (2학기)',
    place: '예술관 401호 (암실 보유)',
    benefits: [
      { icon: 'rocket', title: '학기별 정기 출사', desc: '국내 출사 4회, 여름 장기 출사 1회를 진행합니다.' },
      { icon: 'users', title: '전시 기획 실무', desc: '기획부터 도록 제작까지 전시 전 과정을 경험합니다.' },
      { icon: 'cloud', title: '장비 대여', desc: '바디/렌즈/조명 장비를 무료로 대여할 수 있습니다.' },
    ],
    timeline: [
      { month: '3월', title: '신입 오리엔테이션 & 첫 출사', desc: '카메라 기초 강의와 캠퍼스 출사를 진행합니다.' },
      { month: '6월', title: '여름 정기 전시', desC: '', desc: '한 학기 작업물을 모아 교내 갤러리에 전시합니다.' },
      { month: '10월', title: '가을 장기 출사', desc: '2박 3일 지방 출사를 다녀옵니다.' },
    ],
    faq: [
      { q: '카메라가 없어도 지원할 수 있나요?', a: '동아리 장비 대여가 가능하여 문제없습니다.' },
      { q: '필름 사진도 배울 수 있나요?', a: '암실을 보유하고 있어 현상·인화까지 배울 수 있습니다.' },
    ],
  },
  {
    id: 'c-algo',
    name: '알고리즘 학회 코드베이스',
    shortName: '코드베이스',
    category: 'academic',
    tagline: '문제 해결의 즐거움. 함께 풀면 더 멀리 갑니다.',
    heroTone: '#2170E4',
    intro:
      '주 1회 알고리즘 스터디와 월 1회 교내 대회를 운영합니다. ICPC·SCPC 등 외부 대회 팀도 함께 꾸립니다.',
    memberCount: 61,
    recruitCount: 20,
    period: '1학기 (연장 가능)',
    place: '공학관 512호',
    benefits: [
      { icon: 'rocket', title: '주간 문제 풀이 세션', desc: '난이도별 스터디 그룹을 배정해 매주 함께 풉니다.' },
      { icon: 'users', title: '외부 대회 팀 매칭', desc: 'ICPC·SCPC 팀 빌딩과 코칭을 지원합니다.' },
      { icon: 'cloud', title: '온라인 저지 프리미엄', desc: '유료 저지 계정과 강의를 제공합니다.' },
    ],
    timeline: [
      { month: '3월', title: '레벨 테스트 & 그룹 배정', desc: '실력에 맞는 스터디 그룹으로 배정합니다.' },
      { month: '7월', title: '여름 부트캠프', desc: '2주간 집중 알고리즘 캠프를 진행합니다.' },
      { month: '9월', title: 'ICPC 예선 참가', desc: '팀 단위로 대회에 참가합니다.' },
    ],
    faq: [
      { q: '어느 정도 실력이 필요한가요?', a: '기초 문법만 알면 충분합니다. 입문 그룹이 따로 있습니다.' },
    ],
  },
];

/* ── 모집 공고 ───────────────────────────────── */
export const seedRecruitments = [
  {
    id: 'r-cm-12',
    clubId: 'c-cm',
    title: '크리에이티브 메이커스 12기 신입 부원 모집',
    generation: '12기',
    status: 'OPEN', // OPEN | CLOSED | UPCOMING
    openAt: d(-10),
    closeAt: d(5, 23, 59),
    docResultAt: d(8, 14),
    interviewFrom: d(10),
    interviewTo: d(14),
    finalResultAt: d(17, 18),
    fields: [
      { id: 'f-pm', label: '기획 / PM', desc: '서비스 기획 및 프로젝트 관리' },
      { id: 'f-design', label: 'UI/UX 디자인', desc: '사용자 경험 및 인터페이스 디자인' },
      { id: 'f-dev', label: '개발', desc: '프론트엔드, 백엔드 등 서비스 개발' },
    ],
    questions: [
      { id: 'q1', type: 'long', required: true, label: '우리 동아리에 지원하게 된 동기는 무엇인가요?', help: '500자 이내로 자유롭게 작성해주세요.', maxLength: 500 },
      { id: 'q2', type: 'long', required: true, label: '가장 기억에 남는 팀 프로젝트 경험과 본인의 역할을 설명해주세요.', help: '협업 방식과 본인의 기여를 중심으로 작성해주세요.', maxLength: 500 },
      { id: 'q3', type: 'short', required: true, label: '가장 자신있는 툴이나 기술스택은 무엇인가요?', help: '예: Figma, React, Python 등', maxLength: 60 },
      { id: 'q4', type: 'choice', required: true, label: '주로 활동 가능한 시간대는 언제인가요?', options: ['평일 오후 (18:00-21:00)', '주말 오전 (09:00-12:00)', '주말 오후 (13:00-18:00)'] },
    ],
    portfolio: { enabled: true, required: false, maxMb: 20 },
    policy: { allowEdit: true, maxApplications: 1, rescheduleHours: 24 },
    stats: { total: 128, docReview: 45, interviewPending: 24, finalPassed: 0 },
  },
  {
    id: 'r-band-34',
    clubId: 'c-band',
    title: '중앙밴드 딩가딩가 34기 모집',
    generation: '34기',
    status: 'OPEN',
    openAt: d(-14),
    closeAt: d(2, 23, 59),
    docResultAt: d(4, 14),
    interviewFrom: d(6),
    interviewTo: d(9),
    finalResultAt: d(12, 18),
    fields: [
      { id: 'f-vocal', label: '보컬', desc: '메인/서브 보컬' },
      { id: 'f-guitar', label: '기타', desc: '일렉/어쿠스틱' },
      { id: 'f-bass', label: '베이스', desc: '베이스 기타' },
      { id: 'f-drum', label: '드럼', desc: '드럼/퍼커션' },
    ],
    questions: [
      { id: 'q1', type: 'long', required: true, label: '동아리에 지원하게 된 동기를 상세히 기술해 주세요.', help: '500자 이내', maxLength: 500 },
      { id: 'q2', type: 'long', required: true, label: '협업 과정에서 갈등이 생겼을 때 본인만의 해결 방법이 있나요?', help: '경험을 곁들여 작성해주세요.', maxLength: 500 },
      { id: 'q3', type: 'short', required: false, label: '본인의 연주 실력을 확인할 수 있는 영상 링크 (선택)', help: 'YouTube 링크 등', maxLength: 200 },
    ],
    portfolio: { enabled: true, required: false, maxMb: 20 },
    policy: { allowEdit: true, maxApplications: 1, rescheduleHours: 24 },
    stats: { total: 74, docReview: 21, interviewPending: 12, finalPassed: 0 },
  },
  {
    id: 'r-photo-24',
    clubId: 'c-photo',
    title: '사진동아리 찰칵 24기 모집',
    generation: '24기',
    status: 'OPEN',
    openAt: d(-20),
    closeAt: d(-2, 23, 59),
    docResultAt: d(-6, 14),
    interviewFrom: d(-5),
    interviewTo: d(-3),
    finalResultAt: d(-1, 18),
    fields: [{ id: 'f-general', label: '일반 부원', desc: '출사/전시 활동 참여' }],
    questions: [
      { id: 'q1', type: 'long', required: true, label: '사진을 통해 표현하고 싶은 것은 무엇인가요?', maxLength: 500 },
    ],
    portfolio: { enabled: true, required: false, maxMb: 20 },
    policy: { allowEdit: false, maxApplications: 1, rescheduleHours: 24 },
    stats: { total: 52, docReview: 0, interviewPending: 0, finalPassed: 15 },
  },
  {
    id: 'r-algo-32',
    clubId: 'c-algo',
    title: '알고리즘 학회 코드베이스 32기 모집',
    generation: '32기',
    status: 'OPEN',
    openAt: d(-3),
    closeAt: d(11, 23, 59),
    docResultAt: d(14, 14),
    interviewFrom: d(16),
    interviewTo: d(19),
    finalResultAt: d(22, 18),
    fields: [
      { id: 'f-beginner', label: '입문 트랙', desc: '기초 문법 이수자' },
      { id: 'f-advanced', label: '심화 트랙', desc: '대회 준비 경험자' },
    ],
    questions: [
      { id: 'q1', type: 'long', required: true, label: '알고리즘 학습 경험과 목표를 작성해주세요.', maxLength: 500 },
      { id: 'q2', type: 'short', required: false, label: '사용 가능한 언어를 적어주세요.', help: '예: C++, Python', maxLength: 60 },
    ],
    portfolio: { enabled: false, required: false, maxMb: 20 },
    policy: { allowEdit: true, maxApplications: 1, rescheduleHours: 12 },
    stats: { total: 156, docReview: 60, interviewPending: 0, finalPassed: 0 },
  },
];

/* ── 면접 세션 / 슬롯 ───────────────────────────── */
function makeSlots(sessionId, date, times, filled) {
  return times.map((t, i) => ({
    id: `${sessionId}-s${i + 1}`,
    sessionId,
    date,
    start: t[0],
    end: t[1],
    capacity: 4,
    reserved: filled[i] ?? 0, // 우리 목록에 없는 타 지원자 예약 수(더미)
  }));
}

const cmDay1 = d(10).slice(0, 10);
const cmDay2 = d(11).slice(0, 10);

export const seedSessions = [
  {
    id: 'ses-cm-1',
    recruitmentId: 'r-cm-12',
    clubId: 'c-cm',
    name: '12기 면접 1일차',
    date: cmDay1,
    place: '학생회관 302호 세미나실',
    interviewers: ['김태현', '이수진'],
    durationMin: 30,
    status: 'OPEN',
    slots: makeSlots(
      'ses-cm-1',
      cmDay1,
      [
        ['10:00', '10:30'],
        ['10:30', '11:00'],
        ['11:00', '11:30'],
        ['14:00', '14:30'],
        ['15:00', '15:30'],
        ['16:30', '17:00'],
      ],
      [4, 2, 3, 1, 1, 0]
    ),
  },
  {
    id: 'ses-cm-2',
    recruitmentId: 'r-cm-12',
    clubId: 'c-cm',
    name: '12기 면접 2일차',
    date: cmDay2,
    place: '학생회관 301호',
    interviewers: ['박지민', '최우진'],
    durationMin: 30,
    status: 'OPEN',
    slots: makeSlots(
      'ses-cm-2',
      cmDay2,
      [
        ['13:00', '13:30'],
        ['13:30', '14:00'],
        ['14:00', '14:30'],
        ['15:00', '15:30'],
      ],
      [0, 2, 4, 1]
    ),
  },
  {
    id: 'ses-band-1',
    recruitmentId: 'r-band-34',
    clubId: 'c-band',
    name: '34기 오디션',
    date: d(6).slice(0, 10),
    place: '학생회관 지하 합주실',
    interviewers: ['정하늘'],
    durationMin: 20,
    status: 'DRAFT',
    slots: makeSlots(
      'ses-band-1',
      d(6).slice(0, 10),
      [
        ['15:00', '15:20'],
        ['15:20', '15:40'],
        ['15:40', '16:00'],
      ],
      [0, 0, 0]
    ),
  },
];

/* ── 내 지원 내역 (더미 시나리오 3건) ───────────────── */
export const seedApplications = [
  {
    id: 'app-1',
    userId: 'u-me',
    recruitmentId: 'r-cm-12',
    clubId: 'c-cm',
    fieldId: 'f-design',
    status: AppStatus.DOC_PASSED,
    internalStatus: InternalStatus.PASS_PREDICTED,
    submittedAt: d(-7, 14, 22),
    answers: {
      q1: '평소 교내 프로젝트를 진행하며 UX 리서치와 실제 프로덕트 디자인 사이의 간극을 줄이고 싶다는 갈증을 느꼈습니다. 귀 동아리가 매 학기 진행하는 서비스 개선 해커톤과 실무진 멘토링 프로그램이 제가 찾던 실전 경험과 일치하여 지원하게 되었습니다.',
      q2: '2학년 2학기 인터랙션 디자인 수업에서 진행한 배리어프리 키오스크 UI 기획 프로젝트가 가장 기억에 남습니다. 저는 팀장 겸 메인 디자이너 역할을 맡아 시각장애인 사용자를 위한 음성 피드백 구조를 설계하고 명도 대비를 최적화했습니다.',
      q3: 'Figma, Framer, React',
      q4: '평일 오후 (18:00-21:00)',
    },
    portfolio: { fileName: '2025_김캠퍼_포트폴리오.pdf', sizeMb: 12.4, pages: 15, link: 'https://notion.so/campus-kim' },
    interviewSlotId: null,
    memo: '',
    evaluations: [],
  },
  {
    id: 'app-2',
    userId: 'u-me',
    recruitmentId: 'r-band-34',
    clubId: 'c-band',
    fieldId: 'f-bass',
    status: AppStatus.DOC_REVIEW,
    internalStatus: InternalStatus.REVIEWING,
    submittedAt: d(-4, 11, 5),
    answers: {
      q1: '어릴 적부터 음악에 대한 열정이 남달랐습니다. 특히 밴드 사운드의 생동감 넘치는 에너지를 동경해왔고, 대학 생활의 꽃이라 할 수 있는 밴드에서 그 에너지를 함께 나누고 싶어 지원하게 되었습니다.',
      q2: '저는 경청과 조율을 가장 중요하게 생각합니다. 갈등이 생기면 각자의 입장을 충분히 들은 뒤, 공통된 목표가 무엇인지 다시 상기시킵니다.',
      q3: 'https://youtube.com/watch?v=sample_video_id',
    },
    portfolio: null,
    interviewSlotId: null,
    memo: '',
    evaluations: [],
  },
  {
    id: 'app-3',
    userId: 'u-me',
    recruitmentId: 'r-photo-24',
    clubId: 'c-photo',
    fieldId: 'f-general',
    status: AppStatus.FINAL_PASSED,
    internalStatus: InternalStatus.PASS_PREDICTED,
    submittedAt: d(-18, 9, 40),
    answers: {
      q1: '일상에서 지나치기 쉬운 장면을 오래 보게 만드는 사진을 찍고 싶습니다. 캠퍼스의 계절 변화를 기록하는 장기 프로젝트를 진행하고 싶습니다.',
    },
    portfolio: { fileName: '찰칵_지원_포트폴리오.pdf', sizeMb: 8.1, pages: 10, link: '' },
    interviewSlotId: null,
    memo: '',
    welcome: { title: '신입생 환영회', at: d(3, 18) },
    evaluations: [],
  },
];

/* ── 운영진 화면용 타 지원자 (c-cm / r-cm-12) ────────── */
export const seedOtherApplicants = [
  {
    id: 'app-o1', userId: 'u-1', name: '김민준', department: '컴퓨터공학과', admissionYear: 22,
    recruitmentId: 'r-cm-12', clubId: 'c-cm', fieldId: 'f-dev',
    status: AppStatus.DOC_PASSED, internalStatus: InternalStatus.PASS_PREDICTED,
    submittedAt: d(-8, 10, 12), score: 92, avatarColor: '#0058BE',
    answers: {
      q1: '학부 수업에서 만든 토이 프로젝트를 실제 사용자에게 배포해보고 싶어 지원했습니다. 특히 사용자 피드백을 반영해 개선하는 사이클을 경험하고 싶습니다.',
      q2: '교내 해커톤에서 4인 팀의 백엔드를 담당해 48시간 안에 API 12개를 구현했습니다. 일정 관리를 위해 작업을 30분 단위로 쪼개 트래킹했습니다.',
      q3: 'TypeScript, NestJS, PostgreSQL',
      q4: '평일 오후 (18:00-21:00)',
    },
    portfolio: { fileName: 'minjun_dev_portfolio.pdf', sizeMb: 9.2, pages: 12, link: 'https://github.com/minjun' },
    memo: '기술 스택 깊이가 인상적. 협업 경험도 충분함.',
    interviewSlotId: 'ses-cm-1-s4',
  },
  {
    id: 'app-o2', userId: 'u-2', name: '이서아', department: '경영학과', admissionYear: 23,
    recruitmentId: 'r-cm-12', clubId: 'c-cm', fieldId: 'f-pm',
    status: AppStatus.DOC_REVIEW, internalStatus: InternalStatus.REVIEWING,
    submittedAt: d(-6, 16, 30), score: 78, avatarColor: '#4648D4',
    answers: {
      q1: '비전공자로서 서비스 기획의 실무 감각을 익히고 싶습니다. 학과에서 배운 시장 분석을 실제 프로덕트에 적용해보고 싶습니다.',
      q2: '학과 창업 경진대회에서 5인 팀 리더를 맡아 시장 조사와 BM 설계를 담당했고, 본선에 진출했습니다.',
      q3: 'Notion, Figma, Excel',
      q4: '주말 오전 (09:00-12:00)',
    },
    portfolio: null,
    memo: '',
    interviewSlotId: null,
  },
  {
    id: 'app-o3', userId: 'u-3', name: '박도윤', department: '시각디자인학과', admissionYear: 21,
    recruitmentId: 'r-cm-12', clubId: 'c-cm', fieldId: 'f-design',
    status: AppStatus.FINAL_PASSED, internalStatus: InternalStatus.PASS_PREDICTED,
    submittedAt: d(-9, 9, 0), score: 88, avatarColor: '#006C49',
    answers: {
      q1: '브랜드 아이덴티티부터 프로덕트 UI까지 일관된 경험을 설계해보고 싶습니다.',
      q2: '교내 전시 브랜딩 프로젝트에서 디자인 리드를 맡아 포스터·리플렛·웹까지 통합 시스템을 만들었습니다.',
      q3: 'Figma, Illustrator, After Effects',
      q4: '주말 오후 (13:00-18:00)',
    },
    portfolio: { fileName: 'doyun_visual.pdf', sizeMb: 15.7, pages: 22, link: '' },
    memo: '포트폴리오 완성도 최상. 디자인 시스템 이해도 높음.',
    interviewSlotId: 'ses-cm-1-s2',
  },
  {
    id: 'app-o4', userId: 'u-4', name: '최지우', department: '소프트웨어학과', admissionYear: 22,
    recruitmentId: 'r-cm-12', clubId: 'c-cm', fieldId: 'f-dev',
    status: AppStatus.SUBMITTED, internalStatus: InternalStatus.UNREVIEWED,
    submittedAt: d(-2, 22, 15), score: null, avatarColor: '#2170E4',
    answers: {
      q1: '혼자 공부하다 보니 코드 리뷰를 받을 기회가 없어서 지원했습니다.',
      q2: '2인 팀으로 학과 시간표 앱을 만들어 200명이 사용했습니다.',
      q3: 'React, Firebase',
      q4: '평일 오후 (18:00-21:00)',
    },
    portfolio: null,
    memo: '',
    interviewSlotId: null,
  },
  {
    id: 'app-o5', userId: 'u-5', name: '정하늘', department: '산업디자인학과', admissionYear: 20,
    recruitmentId: 'r-cm-12', clubId: 'c-cm', fieldId: 'f-design',
    status: AppStatus.REJECTED, internalStatus: InternalStatus.FAIL_PREDICTED,
    submittedAt: d(-11, 13, 45), score: 51, avatarColor: '#BA1A1A',
    answers: {
      q1: '포트폴리오를 채우기 위해 지원했습니다.',
      q2: '개인 작업을 주로 했습니다.',
      q3: 'Photoshop',
      q4: '주말 오후 (13:00-18:00)',
    },
    portfolio: null,
    memo: '협업 경험 부족. 활동 시간 확보 어려움.',
    interviewSlotId: null,
  },
];

/* ── 알림 ───────────────────────────────────── */
export const seedNotifications = [
  {
    id: 'n-1', category: 'schedule', kind: 'INTERVIEW_INVITE',
    title: '면접 예약 안내', clubId: 'c-cm', applicationId: 'app-1',
    body: '서류 합격을 축하드립니다! 면접 일정을 선택해 주세요. 가능한 시간대를 골라 예약을 완료해 주세요.',
    at: d(0, Math.max(0, NOW.getHours() - 1)), read: false, cta: '일정 예약하기',
  },
  {
    id: 'n-2', category: 'result', kind: 'FINAL_PASSED',
    title: '최종 합격 알림', clubId: 'c-photo', applicationId: 'app-3',
    body: '축하합니다! 24기 정회원으로 최종 선발되셨습니다. 오리엔테이션 관련 안내를 확인해 주세요.',
    at: d(-1, 18), read: false, cta: '지원 상세 보기',
  },
  {
    id: 'n-3', category: 'result', kind: 'DOC_RESULT',
    title: '서류 결과 발표', clubId: 'c-band', applicationId: 'app-2',
    body: '지원하신 서류 결과가 곧 발표됩니다. 내 지원 현황에서 상세 결과를 확인해 주세요.',
    at: d(-2, 9), read: true, cta: '지원 상세 보기',
  },
  {
    id: 'n-4', category: 'notice', kind: 'SYSTEM',
    title: '프로필 완성도 안내', clubId: null, applicationId: null,
    body: '프로필 정보가 80% 완성되었습니다. 정보를 더 추가하면 동아리 매칭 확률이 올라갑니다.',
    at: d(-3, 10), read: true, cta: '프로필 수정',
  },
];
