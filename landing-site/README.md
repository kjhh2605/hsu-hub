# HSU Club Landing

한성대학교 학생에게 HSU Club의 모집 탐색·지원 관리 경험을 소개하는 정적 랜딩사이트입니다.

## 실행

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

개발 서버 기본 주소는 `http://localhost:5175`입니다.

## 콘텐츠와 연결

- 모든 주요 CTA는 현재 `/explore`로 연결됩니다. 학생용 서비스가 별도 도메인으로 배포되면 `src/content/landingContent.js`의 `CTA_HREF`만 변경하면 됩니다.
- 페이지 카피, 비교표, 여정, 기능 설명은 `src/content/landingContent.js`에서 관리합니다.
- 히어로의 HSU 캐릭터 장면은 사용자가 제공한 학교 캐릭터를 참조해 OpenAI 내장 이미지 생성 도구로 제작하고 WebP로 최적화했습니다.

## 구조

```text
src/
├── assets/       캐릭터 히어로 자산
├── components/   페이지 섹션과 제품 미리보기
├── content/      랜딩 카피와 데이터
├── styles/       디자인 토큰, 기본 스타일, 반응형 페이지 스타일
└── test/         사용자에게 보이는 콘텐츠와 링크 계약 테스트
```
