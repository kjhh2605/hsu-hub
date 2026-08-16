# CampusConnect Mobile

Figma `CampusConnect` 앱뷰(390px 모바일 화면 전체)를 React 로 구현한 프로토타입입니다.
더미 데이터가 내장되어 있어 백엔드 없이 실제 사용자 흐름을 그대로 눌러볼 수 있습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 71개 테스트 (비즈니스 로직 33 + 화면/라우팅 38)
npm run build
```

데스크톱 브라우저에서는 390×844 목업 프레임 안에, 모바일 폭에서는 전체 화면으로 렌더됩니다.

## 화면 & 라우트

| 라우트 | 화면 | Figma 프레임 |
| --- | --- | --- |
| `/login` | 로그인 (카카오/구글/애플) | 로그인 (MVP) |
| `/onboarding` | 기본 프로필 등록 | 기본 프로필 등록 (MVP) |
| `/explore` | 동아리 탐색 (검색·카테고리) | 하단 탭 `탐색` |
| `/clubs/:clubId` | 동아리 상세 (혜택/일정/FAQ) | 동아리 상세 정보 (고도화) |
| `/apply/:recruitmentId` | 지원서 작성 1·2·3단계 | 지원서 작성 1~3단계 (MVP) |
| `/apply/:recruitmentId/done` | 지원 완료 | 지원 완료 (MVP) |
| `/applications` | 나의 지원 현황 | 내 지원 현황 (고도화) |
| `/applications/:appId` | 제출 지원서 상세 (수정/취소) | 제출 지원서 상세 (MVP) |
| `/applications/:appId/interview/pick` | 면접 시간 선택 | 면접 시간 선택 (고도화) |
| `/applications/:appId/interview/booked` | 면접 예약 완료 | 면접 예약 완료 (MVP) |
| `/applications/:appId/interview` | 면접 예약 상세 (변경/취소) | 면접 예약 상세 (MVP) |
| `/notifications` | 알림 목록 (분류·읽음) | 알림 목록 (MVP) |
| `/profile` | 프로필 및 설정 (모드 전환) | 프로필 및 설정 (MVP) |
| `/admin/applicants` | 지원자 명단 관리 | 지원자 명단 관리 (고도화) |
| `/admin/applicants/:id` | 지원서 상세 검토 (평가/합불) | 지원서 상세 검토 (운영진 모드) |
| `/admin/sessions` | 면접 세션·슬롯 관리 | 면접 세션 관리 (고도화) |
| `/admin/sessions/:slotId` | 면접 슬롯 상세 (명단·출석) | 면접 슬롯 상세 정보 |

Figma 에 화면이 없던 `탐색(동아리 목록)` 은 하단 탭이 참조하고 있어, 동일 디자인 토큰으로 새로 구성했습니다.

## 비즈니스 로직

지원 상태 머신 (`src/data/constants.js`):

```
DRAFT → SUBMITTED → DOC_REVIEW ─┬─ (운영진 합격) → DOC_PASSED → INTERVIEW_SCHEDULED → FINAL_PASSED
                                └─ (운영진 불합격) → REJECTED
지원자 취소 → CANCELED
```

적용된 규칙 (`src/store/logic.js`, 테스트로 검증):

- **중복 지원 제한** — 모집별 `policy.maxApplications` 기준으로 재지원 차단
- **마감 처리** — `closeAt` 이후에는 지원·수정·취소 불가
- **수정 정책** — `policy.allowEdit` 이고 서류 단계일 때만 지원서 수정 가능
- **면접 예약 자격** — `DOC_PASSED` 이상만 예약, 정원(`capacity`) 초과 슬롯은 마감 처리
- **좌석 파생 계산** — 슬롯 예약 인원은 예약 데이터에서 파생되므로 재예약·취소 시 좌석이 자동 반환
- **변경 기한** — 면접 시작 `policy.rescheduleHours` 시간 전까지만 변경/취소
- **운영진 결정 → 지원자 반영** — 합불 처리 시 공개 상태 변경 + 알림 생성, 내부 상태/메모는 지원자에게 미노출
- **로그인 복귀** — 비로그인 상태로 보호 라우트 접근 시 로그인 후 원래 화면으로 복귀

## 데모 시나리오

앱 진입 시 지원 내역 3건이 서로 다른 상태로 준비되어 있습니다.

1. **면접 예약** — `내 지원` → 크리에이티브 메이커스(면접 예약 대기) → `면접 시간 선택하기` → 잔여석 슬롯 선택 → 예약 확정 → 예약 상세에서 변경/취소
2. **신규 지원** — `탐색` → 알고리즘 학회 코드베이스 → `지금 바로 지원하기` → 3단계 작성(자동 저장·글자수·필수 검증) → 제출 → 완료
3. **중복 지원 차단** — 이미 지원한 크리에이티브 메이커스에 다시 지원 시도
4. **운영진 흐름** — `프로필` → `운영진 모드로 전환` → 지원자 명단 → 최지우(미검토) → 메모 저장 → `합격 (면접으로)` → 명단 상태 변경 확인
5. **알림 연동** — `알림` 탭에서 항목을 누르면 상태에 맞는 화면으로 이동

상태는 `localStorage` 에 저장됩니다. `프로필 → 데모 데이터 초기화` 로 되돌릴 수 있습니다.

## 구조

```
src/
├─ data/          constants.js(상태 머신·라벨) · seed.js(더미 데이터)
├─ store/         logic.js(순수 규칙·셀렉터) · reducer.js · AppContext.jsx
├─ components/    ui.jsx(프리미티브) · layout.jsx(탭·가드) · icons.jsx
├─ screens/       화면 17개 (admin/ 하위 4개)
├─ styles/        tokens.css(Figma 토큰) · base · utilities · components
└─ __tests__/     logic.test.js · flow.test.jsx
```
