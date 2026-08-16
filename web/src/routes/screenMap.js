/**
 * Figma 데스크톱 프레임(1280px) → 라우트 매핑 표.
 * ScreenIndex 화면과 App 라우터가 이 목록을 공유한다.
 *
 * fileKey: hn4ONvQL88NrjhvOQFquO0
 *
 * Figma 데스크톱 프레임 16개 = 고유 화면 12개 + "(국문)" 한국어 변형 4개.
 * 국문 변형은 동일 화면이므로 같은 라우트에 altFigma/altNode 로 매핑한다.
 * 여기에 콘솔이 실제로 동작하려면 필요한 화면 2개(지원자 상세 검토, 운영진 설정)를
 * 데스크톱 레이아웃으로 새로 설계해 더해 총 14개 화면이다.
 */

export const ADMIN_SCREENS = [
  {
    figma: '운영진 대시보드',
    node: '1:2194',
    altFigma: '운영진 대시보드 (국문)',
    altNode: '1:5636',
    path: '/admin',
    title: '운영진 대시보드',
    group: '대시보드',
    desc: 'KPI · 지원자 추이 · 전환 퍼널 · 트랙 분포 · 할 일 · 최근 활동',
  },
  {
    figma: '모집 목록 관리',
    node: '1:2456',
    path: '/admin/recruitments',
    title: '모집 목록 관리',
    group: '모집',
    desc: '모집 공고 목록 · 상태 필터 · 복제/삭제 · 카드/테이블 뷰',
  },
  {
    figma: '모집 생성: 페이지 편집',
    node: '1:2730',
    path: '/admin/recruitments/new/page',
    title: '모집 생성 · 페이지 편집',
    group: '모집',
    desc: '공고 기본 정보 · 블록 에디터 · 실시간 미리보기',
  },
  {
    figma: '모집 생성: 전형 설정',
    node: '1:2968',
    path: '/admin/recruitments/new/stages',
    title: '모집 생성 · 전형 설정',
    group: '모집',
    desc: '전형 단계 · 일정 · 알림 발송 · 결과 발표 방식',
  },
  {
    figma: '모집 생성: 폼 빌더',
    node: '1:3268',
    path: '/admin/recruitments/new/form',
    title: '모집 생성 · 폼 빌더',
    group: '모집',
    desc: '필드 팔레트 · 폼 캔버스 · 속성 패널 · 미리보기',
  },
  {
    figma: '모집 생성: 검토 및 게시',
    node: '1:3518',
    path: '/admin/recruitments/new/review',
    title: '모집 생성 · 검토 및 게시',
    group: '모집',
    desc: '검증 체크리스트 · 요약 · 즉시/예약 게시',
  },
  {
    figma: '지원자 목록 (운영진)',
    node: '1:3990',
    altFigma: '지원자 명단 관리 (국문)',
    altNode: '1:5929',
    path: '/admin/applicants',
    title: '지원자 목록',
    group: '지원자',
    desc: '검색·필터·정렬 · 다중 선택 일괄 처리 · 페이지네이션',
  },
  {
    // Figma 에는 데스크톱 프레임이 없다. ("지원서 상세 검토 (운영진 모드)" #1:5393 은 390px 모바일 설계)
    // 지원자 목록에서 행을 열 수 있어야 하므로 데스크톱 레이아웃으로 새로 설계했다.
    figma: '(신규) 지원자 상세 검토',
    node: '-',
    path: '/admin/applicants/apl-001',
    title: '지원자 상세 검토',
    group: '지원자',
    desc: '지원서 전문 · 평가 점수 · 메모 스레드 · 합격/보류/불합격',
  },
  {
    figma: '결과 발표 대상 검토',
    node: '1:3759',
    path: '/admin/results',
    title: '결과 발표 대상 검토',
    group: '결과',
    desc: '합격/보류/불합격 칸반 · 발표 문구 · 발송 채널',
  },
  {
    figma: '면접 세션 관리 (운영진)',
    node: '1:4291',
    path: '/admin/interviews',
    title: '면접 세션 관리',
    group: '면접',
    desc: '세션·슬롯 현황 · 캘린더/리스트 뷰 · 예약률',
  },
  {
    figma: '면접 세션 생성',
    node: '1:4609',
    path: '/admin/interviews/new',
    title: '면접 세션 생성',
    group: '면접',
    desc: '시간·슬롯 길이 기반 슬롯 자동 생성 · 미리보기',
  },
  {
    figma: '면접 슬롯 상세 정보',
    node: '1:4889',
    altFigma: '면접 슬롯 상세 정보 (국문)',
    altNode: '1:6461',
    path: '/admin/interviews/ses-1/slots/slot-2',
    title: '면접 슬롯 상세 정보',
    group: '면접',
    desc: '배정 지원자 · 배정/해제 · 체크인',
  },
  {
    figma: '면접 평가 수행',
    node: '1:5125',
    altFigma: '면접 평가 수행 (국문)',
    altNode: '1:6190',
    path: '/admin/interviews/evaluate/apl-002',
    title: '면접 평가 수행',
    group: '면접',
    desc: '질문 가이드 · 평가 시트 · 가중 총점 · 면접 타이머',
  },
  {
    figma: '(신규) 운영진 설정',
    node: '-',
    path: '/admin/settings',
    title: '운영진 설정',
    group: '설정',
    desc: '동아리 정보 · 운영진 관리 · 알림 · 권한',
  },
];

/** Figma 데스크톱 프레임 총 개수 (국문 변형 포함) */
export const FIGMA_DESKTOP_FRAME_COUNT = ADMIN_SCREENS.reduce(
  (n, s) => n + (s.node === '-' ? 0 : 1) + (s.altNode ? 1 : 0),
  0,
);

export const ALL_SCREENS = ADMIN_SCREENS;
