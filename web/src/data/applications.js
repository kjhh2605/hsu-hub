/**
 * 더미 데이터 — 지원서 폼 스키마.
 * 운영진 '모집 생성 · 폼 빌더' 화면이 편집하는 산출물이며,
 * '지원자 상세 검토' 화면이 질문 라벨을 찾을 때도 사용한다.
 */

export const FIELD_TYPES = [
  { type: 'text', label: '단문', icon: 'Type', desc: '한 줄 텍스트' },
  { type: 'textarea', label: '장문', icon: 'AlignLeft', desc: '여러 줄 서술형' },
  { type: 'radio', label: '단일선택', icon: 'CircleDot', desc: '보기 중 하나' },
  { type: 'checkbox', label: '다중선택', icon: 'CheckSquare', desc: '보기 여러 개' },
  { type: 'select', label: '드롭다운', icon: 'ChevronDown', desc: '목록에서 선택' },
  { type: 'tel', label: '연락처', icon: 'Phone', desc: '전화번호 형식 검증' },
  { type: 'email', label: '이메일', icon: 'Mail', desc: '이메일 형식 검증' },
  { type: 'file', label: '파일', icon: 'Upload', desc: '첨부 업로드' },
  { type: 'url', label: '링크', icon: 'Link', desc: 'URL 입력' },
  { type: 'consent', label: '동의', icon: 'Shield', desc: '약관 동의 체크' },
];

/** 타입 → 표시 라벨 (팔레트에 없는 타입도 안전하게 처리) */
export const fieldTypeLabel = (type) =>
  FIELD_TYPES.find((t) => t.type === type)?.label ?? type;

export const FORM_SCHEMAS = {
  'rec-likelion-12': {
    id: 'form-likelion',
    recruitmentId: 'rec-likelion-12',
    steps: [
      {
        id: 'step-1',
        title: '기본 정보',
        desc: '지원자 프로필에서 자동으로 채워집니다.',
        fields: [
          { id: 'name', type: 'text', label: '이름', required: true, autofill: 'name', placeholder: '홍길동' },
          { id: 'studentId', type: 'text', label: '학번', required: true, autofill: 'studentId', placeholder: '20231234' },
          { id: 'department', type: 'text', label: '학과', required: true, autofill: 'department' },
          {
            id: 'grade',
            type: 'select',
            label: '학년',
            required: true,
            autofill: 'grade',
            options: [
              { value: '1', label: '1학년' },
              { value: '2', label: '2학년' },
              { value: '3', label: '3학년' },
              { value: '4', label: '4학년' },
              { value: '5', label: '초과학기' },
            ],
          },
          { id: 'phone', type: 'tel', label: '연락처', required: true, autofill: 'phone', placeholder: '010-0000-0000' },
          { id: 'email', type: 'email', label: '이메일', required: true, autofill: 'email' },
        ],
      },
      {
        id: 'step-2',
        title: '지원 동기',
        desc: '자유롭게 작성하도록 안내합니다.',
        fields: [
          {
            id: 'motivation',
            type: 'textarea',
            label: '멋쟁이사자처럼에 지원한 이유를 알려주세요.',
            required: true,
            maxLength: 1000,
            minLength: 100,
            placeholder: '개발을 배우고 싶은 계기, 만들고 싶은 서비스 등을 적어주세요.',
          },
          {
            id: 'experience',
            type: 'textarea',
            label: '협업 또는 개발 경험이 있다면 소개해 주세요.',
            required: false,
            maxLength: 800,
            placeholder: '없다면 “없음”이라고 적어주셔도 됩니다.',
          },
          {
            id: 'track',
            type: 'radio',
            label: '희망 트랙을 선택해 주세요.',
            required: true,
            options: [
              { value: 'fe', label: '프론트엔드' },
              { value: 'be', label: '백엔드' },
              { value: 'design', label: '디자인' },
              { value: 'pm', label: '기획/PM' },
            ],
          },
          {
            id: 'skills',
            type: 'checkbox',
            label: '사용해 본 도구를 모두 선택해 주세요.',
            required: false,
            options: [
              { value: 'html', label: 'HTML/CSS' },
              { value: 'js', label: 'JavaScript' },
              { value: 'react', label: 'React' },
              { value: 'python', label: 'Python' },
              { value: 'figma', label: 'Figma' },
              { value: 'git', label: 'Git' },
            ],
          },
        ],
      },
      {
        id: 'step-3',
        title: '활동 가능 여부 · 첨부',
        desc: '마지막 단계입니다.',
        fields: [
          {
            id: 'availability',
            type: 'checkbox',
            label: '참석 가능한 정기 세션 시간을 모두 선택해 주세요.',
            required: true,
            options: [
              { value: 'tue19', label: '화요일 19:00' },
              { value: 'wed19', label: '수요일 19:00' },
              { value: 'thu19', label: '목요일 19:00' },
              { value: 'sat14', label: '토요일 14:00' },
            ],
          },
          { id: 'portfolio', type: 'url', label: '포트폴리오 / GitHub 링크', required: false, placeholder: 'https://' },
          { id: 'file', type: 'file', label: '포트폴리오 파일 (PDF, 10MB 이하)', required: false, accept: '.pdf' },
          {
            id: 'agreePrivacy',
            type: 'consent',
            label: '개인정보 수집 및 이용에 동의합니다. (필수)',
            required: true,
            detail: '수집항목: 이름, 학번, 학과, 연락처, 이메일 · 보유기간: 모집 종료 후 6개월',
          },
          { id: 'agreeMarketing', type: 'consent', label: '동아리 소식 수신에 동의합니다. (선택)', required: false },
        ],
      },
    ],
  },
};

/** 필드 id → 라벨 조회 (지원자 상세 검토에서 사용) */
export function findFieldLabel(recruitmentId, fieldId) {
  const schema = FORM_SCHEMAS[recruitmentId] ?? FORM_SCHEMAS['rec-likelion-12'];
  for (const step of schema.steps) {
    const f = step.fields.find((x) => x.id === fieldId);
    if (f) return f.label;
  }
  return fieldId;
}

export const getFormSchema = (recruitmentId) =>
  FORM_SCHEMAS[recruitmentId] ?? FORM_SCHEMAS['rec-likelion-12'];
