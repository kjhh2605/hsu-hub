# 동아리 프로필·모집관리 분리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동아리 프로필을 대표 커버·소개글·모집상태의 단일 콘텐츠 관리 화면으로 만들고, 모집관리를 일정·전형·지원서·게시 기능으로 제한한다.

**Architecture:** 초기 Flyway 스키마와 시드를 새 모델로 직접 수정하고 별도 마이그레이션은 추가하지 않는다. Spring club 모듈은 프로필/이미지/상태를 담당하고 recruitment 모듈은 제목·인원·콘텐츠 없이 기간·전형·폼·게시만 담당한다. React 운영자 화면은 프로필 미리보기와 모집 wizard를 분리하고, 모바일 사용자 화면은 프로필 소개를 모집글로 표시하며 유효한 모집에만 지원폼 링크를 제공한다.

**Tech Stack:** Spring Boot 3.5, Spring Data JPA, Flyway 초기 SQL, Java 21, React 18, React Router, Vite, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-18-club-profile-recruitment-separation-design.md`

## Global Constraints

- 운영 데이터 호환은 범위가 아니므로 신규 마이그레이션을 만들지 않고 `V1__create_schema.sql`과 `V2__seed_clubs.sql`을 직접 수정한다.
- 소개글이 사용자 화면에서 표시되는 모집글이며 모집 엔티티에는 제목·인원·콘텐츠를 저장하지 않는다.
- 활동기간·활동장소는 프론트엔드, DTO, 엔티티, SQL 어디에도 남기지 않는다.
- 소개 이미지는 최대 10장, JPEG/PNG/WebP, 파일당 기존 커버와 같은 5MiB 제한을 사용한다.
- 지원 가능 여부는 모집중 상태, 유효한 모집기간, 게시된 지원폼, 미지원 상태를 함께 검증한다.
- 기존 사용자 변경사항이 있는 `SecurityConfiguration`, `application.yml`, `Wizard.jsx`, `api.js`, CSS, 테스트 파일의 무관한 변경을 덮어쓰지 않는다.

---

### Task 1: 초기 데이터 모델과 파일 정책 정리

**Files:**
- Modify: `backend/src/main/resources/db/migration/V1__create_schema.sql`
- Modify: `backend/src/main/resources/db/migration/V2__seed_clubs.sql`
- Modify: `backend/src/main/java/site/hsu/hub/file/domain/FilePurpose.java`
- Modify: `backend/src/main/java/site/hsu/hub/file/domain/FileValidation.java`
- Modify: `backend/src/main/java/site/hsu/hub/file/api/FileStorageService.java`
- Modify: `backend/src/main/java/site/hsu/hub/file/application/FileService.java`
- Create: `backend/src/main/java/site/hsu/hub/club/adapter/out/persistence/ClubIntroductionImageEntity.java`
- Create: `backend/src/main/java/site/hsu/hub/club/adapter/out/persistence/ClubIntroductionImageRepository.java`
- Test: `backend/src/test/java/site/hsu/hub/file/domain/FileValidationTest.java`

**Interfaces:**
- Produces `FileStorageService.storeIntroductionImage(String,String,byte[])` and `ClubIntroductionImageRepository.findByClubIdOrderByDisplayOrder(Long)` for later club service tasks.

- [ ] **Step 1: Write failing validation tests** for a valid introduction image and invalid image bytes; cover the ten-image policy in the club integration test.
- [ ] **Step 2: Run the focused backend test** with `cd backend && ./gradlew test --tests site.hsu.hub.file.domain.FileValidationTest`; confirm the new tests fail before implementation.
- [ ] **Step 3: Update the initial schema**: add `clubs.recruitment_status`, add `club_introduction_images`, remove activity columns, and define `recruitments` with only club/date/audit columns. Remove recruitment title/quota/content checks and update seed inserts.
- [ ] **Step 4: Add the `CLUB_INTRODUCTION` file purpose** and storage method that reuses the existing image validation and file asset lifecycle.
- [ ] **Step 5: Add introduction-image JPA entity/repository** with unique `(club_id, display_order)` and `(club_id, file_asset_id)` constraints.
- [ ] **Step 6: Run the focused file tests** and verify all pass.
- [ ] **Step 7: Commit only this task’s files** with `git add ... && git commit --only ... -m "feat: redefine profile and recruitment schema"`, leaving existing staged user changes untouched.

### Task 2: Club profile backend and image endpoints

**Files:**
- Modify: `backend/src/main/java/site/hsu/hub/club/adapter/out/persistence/ClubEntity.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/application/ClubService.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/adapter/in/web/OperatorClubController.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/adapter/in/web/OperatorClubControllerDocs.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/adapter/in/web/ClubController.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/adapter/in/web/ClubControllerDocs.java`
- Create: `backend/src/main/java/site/hsu/hub/club/domain/ClubRecruitmentStatus.java`
- Test: `backend/src/test/java/site/hsu/hub/BackendFlowIntegrationTest.java`

**Interfaces:**
- Consumes Task 1’s image repository and storage method.
- Produces profile JSON with `recruitmentStatus` and ordered `introductionImages`, plus operator PATCH/upload and public image read endpoints.

- [ ] **Step 1: Add failing integration assertions** that profile JSON has no activity fields, accepts `RECRUITING`/`CLOSED`, rejects eleven images, and returns ordered introduction image metadata.
- [ ] **Step 2: Run `cd backend && ./gradlew test --tests site.hsu.hub.BackendFlowIntegrationTest`** and confirm the new assertions fail.
- [ ] **Step 3: Add `ClubRecruitmentStatus` and simplify `ClubEntity`** to short/detailed introduction, status, and cover only.
- [ ] **Step 4: Extend `ClubService`** to read ordered images, update profile/status/order, upload multiple introduction images, delete removed assets after commit, and validate operator scope.
- [ ] **Step 5: Update operator/public controllers and docs** for PATCH, multipart image upload, and public binary image retrieval.
- [ ] **Step 6: Run backend club integration and architecture tests** with `cd backend && ./gradlew test --tests site.hsu.hub.BackendFlowIntegrationTest --tests site.hsu.hub.ArchitectureTest`.
- [ ] **Step 7: Commit only Task 2 files** with `feat: add club profile gallery and recruitment status`.

### Task 3: Recruitment backend without title, quota, or content

**Files:**
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/domain/RecruitmentCommands.java`
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/adapter/out/persistence/RecruitmentEntity.java`
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/application/RecruitmentService.java`
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/adapter/in/web/OperatorRecruitmentController.java`
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/adapter/in/web/OperatorRecruitmentControllerDocs.java`
- Modify: `backend/src/main/java/site/hsu/hub/recruitment/api/RecruitmentApplicationReader.java`
- Modify: `backend/src/main/java/site/hsu/hub/club/api/ClubRecruitmentSummaryReader.java`
- Modify: `backend/src/main/java/site/hsu/hub/application/application/ApplicationService.java`
- Modify: `backend/src/test/java/site/hsu/hub/BackendFlowIntegrationTest.java`
- Modify: `backend/src/test/java/site/hsu/hub/ApiContractTest.java`

**Interfaces:**
- Consumes `ClubScope` and `ClubRecruitmentStatus` through a club reader/service method for support eligibility.
- Produces `PublishCommand(Instant opensAt, Instant closesAt, List<StageCommand>, FormCommand)` and recruitment views without title/quota/content fields.

- [ ] **Step 1: Update failing backend contract tests** to publish using the reduced command and assert the persisted/view DTO contains no removed fields.
- [ ] **Step 2: Run `cd backend && ./gradlew test --tests site.hsu.hub.BackendFlowIntegrationTest --tests site.hsu.hub.ApiContractTest`** and confirm compile/test failures identify all old fields.
- [ ] **Step 3: Remove title/quota/content from entity, command, request DTO, service view, reader snapshots, and club recruitment summaries.**
- [ ] **Step 4: Make `requireOpen` verify club recruitment status in addition to the date interval and existing form/application checks.**
- [ ] **Step 5: Keep overlap and stage/form validation unchanged, but construct the reduced recruitment entity and payload.**
- [ ] **Step 6: Run all backend tests** with `cd backend && ./gradlew test` and fix only failures caused by the contract change.
- [ ] **Step 7: Commit only Task 3 files** with `feat: remove recruitment copy fields`.

### Task 4: Operator profile UI with live previews and gallery editing

**Files:**
- Modify: `web/src/production/ClubProfile.jsx`
- Modify: `web/src/production/api.js`
- Modify: `web/src/styles/production.css`
- Modify: `web/src/test/production.contract.test.jsx`

**Interfaces:**
- Consumes Task 2’s profile JSON and endpoints.
- Produces UI behavior: cover/list preview, detail/recruitment preview, status toggle, ordered gallery, max-ten client validation, and save flow.

- [ ] **Step 1: Add failing Testing Library tests** for live detail text, status control, no activity inputs, max-ten selection, and multipart introduction-image upload.
- [ ] **Step 2: Run `npm run test --workspace web -- src/test/production.contract.test.jsx`** and confirm the new tests fail.
- [ ] **Step 3: Refactor `ClubProfile.jsx`** into profile fields, cover preview, status control, gallery selection/removal/reordering, and detail preview with images in a horizontal strip.
- [ ] **Step 4: Implement save sequencing**: upload new files, merge returned IDs with retained IDs, PATCH profile/status/order, and clear object URLs after save.
- [ ] **Step 5: Add responsive production CSS** for the two previews, image strip, status control, and empty states without overwriting unrelated dirty CSS changes.
- [ ] **Step 6: Run the focused web test** and `npm run build --workspace web`.
- [ ] **Step 7: Commit only Task 4 files** with `feat: add live club profile editor`.

### Task 5: Recruitment wizard and operator list UI

**Files:**
- Modify: `web/src/production/Wizard.jsx`
- Modify: `web/src/production/Recruitments.jsx`
- Modify: `web/src/styles/production.css`
- Modify: `web/src/test/production.contract.test.jsx`

**Interfaces:**
- Consumes Task 3’s reduced publish DTO.
- Produces a four-step wizard whose first step collects only dates and whose payload contains no title/quota/content.

- [ ] **Step 1: Add failing tests** for date-only first step, absence of title/quota/content controls, exact reduced payload, and publish review checks.
- [ ] **Step 2: Run the focused web contract test** and confirm failures.
- [ ] **Step 3: Remove title, quota, summary, and content from wizard state and `buildPublishPayload`; keep stage/form generation intact.**
- [ ] **Step 4: Rename the first step to `모집 일정`, update review copy, and validate only start/end dates plus stages/questions.**
- [ ] **Step 5: Remove title/quota displays from recruitment history cards while retaining dates, state, and applicant navigation.**
- [ ] **Step 6: Run `npm run test --workspace web`** and `npm run build --workspace web`.
- [ ] **Step 7: Commit only Task 5 files** with `feat: simplify recruitment authoring`.

### Task 6: Applicant profile detail and direct support flow

**Files:**
- Modify: `mobile/src/production/Clubs.jsx`
- Modify: `mobile/src/styles/production.css`
- Modify: `mobile/src/__tests__/production.test.jsx`

**Interfaces:**
- Consumes Task 2/3 public club JSON and image endpoint; keeps existing `/apply/:recruitmentId` route.
- Produces detail page behavior where the profile introduction is the recruitment content and the support CTA directly opens the form.

- [ ] **Step 1: Add failing mobile tests** for no activity fields, introduction image strip, active CTA for recruiting clubs, and disabled CTA for completed clubs.
- [ ] **Step 2: Run `npm run test --workspace mobile` and confirm failures.
- [ ] **Step 3: Update status normalization** to use `recruitmentStatus`, derive support availability from manual status plus valid recruitment state, and remove recruitment title/quota rendering.
- [ ] **Step 4: Render detailed introduction and ordered images as the single detail/recruitment content; keep the CTA link direct to `/apply/:recruitmentId`.**
- [ ] **Step 5: Remove activity grid** and add horizontally scrollable image styling.
- [ ] **Step 6: Run `npm run test --workspace mobile`** and `npm run build --workspace mobile`.
- [ ] **Step 7: Commit only Task 6 files** with `feat: connect club profile to application flow`.

### Task 7: Repository-wide verification and documentation alignment

**Files:**
- Modify: `docs/superpowers/specs/2026-08-16-hsu-hub-mvp-design.md`
- Modify: `backend/src/test/java/site/hsu/hub/MigrationContractTest.java`
- Modify: `backend/src/test/java/site/hsu/hub/FlywayMySqlTest.java` (only if initial schema expectations require an explicit update)
- Modify: `web/src/test/production.contract.test.jsx` (only if final cross-app contract coverage needs consolidation)
- Modify: `mobile/src/__tests__/production.test.jsx` (only if final cross-app contract coverage needs consolidation)

- [ ] **Step 1: Search for removed concepts** with `rg -n "activityPeriod|activityPlace|quota|contentBlocks|recruitment\.title|draft\.title" backend web mobile docs` and remove stale production references while preserving unrelated historical documentation only when explicitly marked.
- [ ] **Step 2: Run backend verification** with `cd backend && ./gradlew test`.
- [ ] **Step 3: Run frontend verification** with `npm test` from the repository root.
- [ ] **Step 4: Run both production builds** with `npm run build` from the repository root.
- [ ] **Step 5: Review `git diff` and `git status --short`** to confirm only requested changes plus the pre-existing user changes are present.
- [ ] **Step 6: Update the MVP design document** so its schema and operator/applicant flow no longer contradict the implemented model.
- [ ] **Step 7: Run the full verification commands again after documentation changes** and report exact results.
