import { iso, hoursAgo, shortDay } from '@/lib/seedClock';

/** 더미 데이터 — 운영진 계정 / 팀 멤버 / 콘솔 알림 / 설정 */

export const ADMIN_USER = {
  id: 'u-admin',
  name: '이서연',
  avatar: '👩‍💼',
  email: 'seoyeon@campus.ac.kr',
  role: 'owner', // owner | manager | reviewer | viewer
  roleLabel: '대표',
  clubId: 'likelion',
  position: '멋쟁이사자처럼 12기 운영진 · 대표',
  permissions: ['recruitment:write', 'applicant:review', 'interview:manage', 'result:publish', 'member:manage'],
  lastLoginAt: hoursAgo(2),
};

/** 운영진 팀 멤버 (설정 > 운영진 관리) */
export const ADMIN_MEMBERS = [
  {
    id: 'm-1',
    name: '이서연',
    avatar: '👩‍💼',
    email: 'seoyeon@campus.ac.kr',
    role: 'owner',
    lastActiveAt: hoursAgo(2),
    reviewCount: 62,
  },
  {
    id: 'm-2',
    name: '박준호',
    avatar: '🧑‍💻',
    email: 'junho@campus.ac.kr',
    role: 'manager',
    lastActiveAt: hoursAgo(3),
    reviewCount: 48,
  },
  {
    id: 'm-3',
    name: '최윤아',
    avatar: '👩‍🎨',
    email: 'yuna@campus.ac.kr',
    role: 'reviewer',
    lastActiveAt: hoursAgo(15),
    reviewCount: 35,
  },
  {
    id: 'm-4',
    name: '정하늘',
    avatar: '🧑‍🎓',
    email: 'haneul@campus.ac.kr',
    role: 'reviewer',
    lastActiveAt: hoursAgo(46),
    reviewCount: 12,
  },
  {
    id: 'm-5',
    name: '한지호',
    avatar: '👨‍🔬',
    email: 'jiho@campus.ac.kr',
    role: 'viewer',
    lastActiveAt: hoursAgo(96),
    reviewCount: 0,
  },
];

export const ADMIN_ROLES = [
  { value: 'owner', label: '대표', desc: '모든 권한 · 운영진 관리 가능' },
  { value: 'manager', label: '매니저', desc: '모집·면접·결과 발표 관리' },
  { value: 'reviewer', label: '심사위원', desc: '지원서 검토 및 면접 평가' },
  { value: 'viewer', label: '조회 전용', desc: '통계와 목록 열람만 가능' },
];

/** 권한 매트릭스 (설정 > 권한) */
export const PERMISSION_MATRIX = [
  { key: 'recruitment:write', label: '모집 공고 작성/게시', owner: true, manager: true, reviewer: false, viewer: false },
  { key: 'form:edit', label: '지원서 폼 편집', owner: true, manager: true, reviewer: false, viewer: false },
  { key: 'applicant:review', label: '지원서 검토·평가', owner: true, manager: true, reviewer: true, viewer: false },
  { key: 'applicant:status', label: '합격/불합격 처리', owner: true, manager: true, reviewer: false, viewer: false },
  { key: 'interview:manage', label: '면접 세션·슬롯 관리', owner: true, manager: true, reviewer: false, viewer: false },
  { key: 'result:publish', label: '결과 발표 발송', owner: true, manager: false, reviewer: false, viewer: false },
  { key: 'member:manage', label: '운영진 초대·권한 변경', owner: true, manager: false, reviewer: false, viewer: false },
  { key: 'stats:view', label: '통계 열람', owner: true, manager: true, reviewer: true, viewer: true },
];

/** 콘솔 알림 (운영진 관점) */
export const NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'reminder',
    title: '미검토 지원서가 5건 남았습니다',
    body: `서류 마감이 지났습니다. 서류 발표 예정일(${shortDay(2)})까지 검토를 완료해 주세요.`,
    createdAt: hoursAgo(1),
    read: false,
    important: true,
    consoleTo: '/admin/applicants',
  },
  {
    id: 'n2',
    type: 'result',
    title: '서류 발표가 예약되어 있습니다',
    body: `${shortDay(2)} 10:00에 합격 23명 · 불합격 6명에게 발송됩니다. 문구를 최종 확인해 주세요.`,
    createdAt: hoursAgo(4),
    read: false,
    important: true,
    consoleTo: '/admin/results',
  },
  {
    id: 'n3',
    type: 'interview',
    title: `${shortDay(7)} 면접 슬롯이 거의 찼습니다`,
    body: '남은 자리 3석. 서류 합격자 대비 슬롯이 부족할 수 있어 추가 개설을 권장합니다.',
    createdAt: hoursAgo(20),
    read: false,
    important: false,
    consoleTo: '/admin/interviews',
  },
  {
    id: 'n4',
    type: 'system',
    title: '새 지원서 3건이 접수되었습니다',
    body: '마감 당일 접수가 집중되었습니다. 트랙별 분포는 대시보드에서 확인할 수 있습니다.',
    createdAt: hoursAgo(28),
    read: true,
    important: false,
    consoleTo: '/admin',
  },
  {
    id: 'n5',
    type: 'comment',
    title: '박준호님이 지원자에 메모를 남겼습니다',
    body: '“포트폴리오 완성도 좋음. 다만 협업 경험 확인 필요.”',
    createdAt: hoursAgo(36),
    read: true,
    important: false,
    consoleTo: '/admin/applicants/apl-005',
  },
  {
    id: 'n6',
    type: 'system',
    title: '최윤아님이 운영진 초대를 수락했습니다',
    body: '권한: 심사위원. 설정에서 권한을 변경할 수 있습니다.',
    createdAt: hoursAgo(72),
    read: true,
    important: false,
    consoleTo: '/admin/settings',
  },
];

/** 설정 > 알림 */
export const SETTINGS_SCHEMA = [
  {
    section: '지원자 활동 알림',
    items: [
      { key: 'notifyNewApplication', label: '새 지원서 접수', desc: '지원서가 제출될 때마다 알립니다', type: 'toggle', value: true },
      { key: 'notifyUnreviewed', label: '미검토 누적 경고', desc: '미검토 지원서가 20건을 넘으면 알립니다', type: 'toggle', value: true },
      { key: 'notifyDeadline', label: '전형 마감 임박', desc: '각 전형 마감 1일 전에 알립니다', type: 'toggle', value: true },
    ],
  },
  {
    section: '면접 알림',
    items: [
      { key: 'notifySlotFull', label: '슬롯 마감 임박', desc: '남은 면접 자리가 5석 이하일 때 알립니다', type: 'toggle', value: true },
      { key: 'notifyNoShow', label: '면접 불참 기록', desc: '체크인되지 않은 지원자를 면접 종료 후 알립니다', type: 'toggle', value: false },
    ],
  },
  {
    section: '팀 알림',
    items: [
      { key: 'notifyTeamMemo', label: '운영진 메모', desc: '다른 운영진이 메모를 남기면 알립니다', type: 'toggle', value: true },
      { key: 'notifyStatusChange', label: '합격/불합격 처리', desc: '다른 운영진의 상태 변경 내역을 알립니다', type: 'toggle', value: false },
      { key: 'emailDigest', label: '주간 이메일 요약', desc: '매주 월요일 아침 모집 현황 요약 발송', type: 'toggle', value: true },
    ],
  },
  {
    section: '콘솔 환경',
    items: [
      {
        key: 'density',
        label: '테이블 밀도',
        type: 'select',
        value: 'comfortable',
        options: [
          { value: 'comfortable', label: '기본' },
          { value: 'compact', label: '조밀하게' },
        ],
      },
      {
        key: 'language',
        label: '언어',
        type: 'select',
        value: 'ko',
        options: [
          { value: 'ko', label: '한국어' },
          { value: 'en', label: 'English' },
        ],
      },
    ],
  },
];
