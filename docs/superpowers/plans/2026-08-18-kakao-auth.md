# Kakao Authentication Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all email/password authentication and authentication email delivery with backend-driven Kakao Login while retaining revocable opaque HSU Hub sessions.

**Architecture:** The Spring backend owns the Kakao authorization-code flow, retrieves only the Kakao service user ID and required verified email, then creates or updates a local user and issues the existing host-only session cookie. The applicant and operator SPAs expose only a Kakao Login action; AWS infrastructure imports a pre-created Kakao credential secret and removes SES.

**Tech Stack:** Java 21, Spring Boot 3.5.5, Spring MVC `RestClient`, JPA, Flyway/MySQL, JUnit 5/MockMvc, React 18, React Router, Vitest, AWS CDK TypeScript, Bash/Docker Compose

**Spec:** `docs/superpowers/specs/2026-08-18-kakao-auth-design.md`

## Global Constraints

- Any Kakao Account may join; do not reintroduce the `@hansung.ac.kr` domain restriction.
- Request and store only the Kakao service user ID and `account_email`; never request nickname or profile scopes.
- Reject Kakao identities whose email is missing, invalid, or unverified.
- Use Kakao service user ID, never email, as the account identity key.
- Do not persist or log Kakao authorization codes, access tokens, refresh tokens, or provider response bodies.
- Keep seven-day opaque HSU Hub sessions in `user_sessions`; do not add JWT access or refresh tokens.
- Keep applicant and operator sessions host-local and independent.
- Keep operational SNS alert email; remove only user-authentication email and SES.
- Preserve the user-owned untracked `.env` and `docs/hand-off/` paths.
- Follow red-green-refactor for every behavior change and capture the expected failing output before production edits.

## File Ownership and Parallel Execution

The approved execution uses Orca orchestration with three isolated child worktrees because parallel workers must make independent commits without sharing a Git index.

- **BE worker — Tasks 1–4:** owns `backend/**` only.
- **FE worker — Tasks 5–6:** owns `mobile/**` and `web/**` only.
- **Infra worker — Tasks 7–8:** owns `infrastructure/**`, `deploy/**`, `ops/**`, `.github/workflows/production.yml`, and `INFRASTRUCTURE.md` only.
- **Coordinator — Task 9:** owns integration, design/plan status, cross-tree search, cherry-picks, and full verification.

Workers must not modify another worker's files or revert concurrent changes. Each worker reads the spec and this plan, commits only owned paths, and reports every commit hash through its Orca `worker_done` message.

## File Structure

### Backend

- Create `backend/src/main/java/site/hsu/hub/identity/application/port/KakaoIdentityClient.java`: provider boundary and minimal identity record.
- Create `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoOAuthProperties.java`: validated Kakao endpoints, credentials, and frontend origins.
- Create `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoOAuthConfiguration.java`: bounded-timeout `RestClient` wiring.
- Create `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoRestClient.java`: token exchange and `/v2/user/me` mapping.
- Create `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/OAuthStateCodec.java`: state-cookie encoding, comparison, and return-path validation.
- Create `backend/src/test/java/site/hsu/hub/identity/adapter/out/kakao/KakaoRestClientTest.java` and `backend/src/test/java/site/hsu/hub/identity/adapter/in/web/OAuthStateCodecTest.java`.
- Create `backend/src/main/resources/db/migration/V5__replace_email_auth_with_kakao.sql`.
- Modify the existing identity entity, repository, service, controller/docs, security configuration, error codes, app configuration, API/session tests, Flyway test, and package boundary.
- Delete email/password token entities/repositories, `EmailAddress`, their tests, and all `backend/src/main/java/site/hsu/hub/mail/**` files.

### Frontend

- Modify `mobile/src/production/AuthPages.jsx` to contain Kakao Login only.
- Modify applicant routing, guard/context, tests, and authentication styles.
- Modify `web/src/production/Login.jsx`, `OperatorContext.jsx`, operator tests, and authentication styles.

### Infrastructure and operations

- Modify CDK config and platform stack to import and grant access to a Kakao secret, remove SES, and stamp a trusted frontend identifier on each API origin.
- Modify infrastructure tests, production workflow, Compose/runtime deployment, operations contract tests, and `INFRASTRUCTURE.md`.

---

### Task 1: Kakao Provider Client

**Files:**
- Create: `backend/src/main/java/site/hsu/hub/identity/application/port/KakaoIdentityClient.java`
- Create: `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoOAuthProperties.java`
- Create: `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoOAuthConfiguration.java`
- Create: `backend/src/main/java/site/hsu/hub/identity/adapter/out/kakao/KakaoRestClient.java`
- Create: `backend/src/test/java/site/hsu/hub/identity/adapter/out/kakao/KakaoRestClientTest.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`

**Interfaces:**
- Produces: `KakaoIdentityClient.exchange(String code, URI redirectUri): KakaoIdentity`
- Produces: `KakaoIdentity(long serviceUserId, String email, boolean emailValid, boolean emailVerified)`
- Produces: configuration keys `hsu.kakao.client-id`, `client-secret`, `authorize-uri`, `token-uri`, `user-info-uri`, `applicant-origin`, and `admin-origin`

- [ ] **Step 1: Write failing provider contract tests**

Use `MockRestServiceServer.bindTo(RestClient.Builder)` so only the Kakao network boundary is mocked. Assert that the token request is form-encoded with the exact code and redirect URI, the user request sends `Authorization: Bearer access-token` and `property_keys=["kakao_account.email"]`, and the mapped result is exact:

```java
assertThat(result).isEqualTo(new KakaoIdentity(
    123456789L, "user@example.com", true, true
));
```

Add separate tests that a non-2xx token response and a malformed user body throw `ApiException` with `ErrorCode.KAKAO_LOGIN_FAILED`. Assert exception messages never contain `access-token`, `refresh-token`, or the provider body.

- [ ] **Step 2: Run the provider test and verify RED**

Run: `cd backend && ./gradlew test --tests '*KakaoRestClientTest'`

Expected: compilation fails because `KakaoIdentityClient` and `KakaoRestClient` do not exist.

- [ ] **Step 3: Define the provider port and identity record**

```java
public interface KakaoIdentityClient {
    KakaoIdentity exchange(String code, URI redirectUri);

    record KakaoIdentity(long serviceUserId, String email,
                         boolean emailValid, boolean emailVerified) {}
}
```

Keep the port under `identity.application.port`; it must not expose Kakao access/refresh token types.

- [ ] **Step 4: Implement validated properties and bounded HTTP wiring**

Enable `KakaoOAuthProperties` with `@ConfigurationProperties("hsu.kakao")` and `@Validated`. Require nonblank client ID/secret, HTTPS provider endpoint URIs, and explicit applicant/admin origins. Configure a `JdkClientHttpRequestFactory` with five-second connect and response timeouts, then build the `RestClient` used only by `KakaoRestClient`.

Production defaults:

```yaml
hsu:
  kakao:
    client-id: ${HSU_KAKAO_CLIENT_ID}
    client-secret: ${HSU_KAKAO_CLIENT_SECRET}
    authorize-uri: https://kauth.kakao.com/oauth/authorize
    token-uri: https://kauth.kakao.com/oauth/token
    user-info-uri: https://kapi.kakao.com/v2/user/me
    applicant-origin: ${HSU_KAKAO_APPLICANT_ORIGIN:https://hsu-hub.site}
    admin-origin: ${HSU_KAKAO_ADMIN_ORIGIN:https://admin.hsu-hub.site}
```

Test configuration uses non-secret literals `test-client-id` and `test-client-secret` so Spring context tests do not depend on local `.env`.

- [ ] **Step 5: Implement token exchange and user retrieval**

Use small private Jackson DTO records. The token DTO exposes only `access_token`; do not add refresh-token storage. The user DTO maps:

```java
record KakaoUserResponse(long id, @JsonProperty("kakao_account") KakaoAccount account) {}
record KakaoAccount(String email,
    @JsonProperty("is_email_valid") Boolean emailValid,
    @JsonProperty("is_email_verified") Boolean emailVerified) {}
```

Translate HTTP, decoding, missing-token, and malformed-identity failures to `KAKAO_LOGIN_FAILED` without copying the cause body into the API message.

- [ ] **Step 6: Run focused and full backend tests**

Run: `cd backend && ./gradlew test --tests '*KakaoRestClientTest'`

Expected: all `KakaoRestClientTest` tests pass.

Run: `cd backend && ./gradlew test`

Expected: existing backend tests pass before the old authentication path is removed.

- [ ] **Step 7: Commit Task 1**

```bash
git add backend
git commit -m "feat(backend): add Kakao identity client"
```

---

### Task 2: Kakao User Upsert and Local Session Creation

**Files:**
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/UserEntity.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/UserRepository.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/application/AuthService.java`
- Create: `backend/src/test/java/site/hsu/hub/identity/application/KakaoAuthServiceTest.java`
- Modify: `backend/src/main/java/site/hsu/hub/common/exception/ErrorCode.java`

**Interfaces:**
- Consumes: `KakaoIdentityClient.exchange(String, URI)` from Task 1.
- Produces: `AuthService.loginWithKakao(String code, URI redirectUri, String ip): LoginResult`.
- Produces: `UserRepository.findByKakaoUserId(long): Optional<UserEntity>`.

- [ ] **Step 1: Write failing service tests**

Cover one behavior per test using a fake `KakaoIdentityClient` and real H2 repositories:

```java
var result = auth.loginWithKakao("one-time-code", redirectUri, "203.0.113.1");
assertThat(users.findByKakaoUserId(123456789L)).get()
    .extracting(UserEntity::email).isEqualTo("user@example.com");
assertThat(result.rawSession()).isNotBlank();
```

Add tests for repeat login not creating a second user, changed email updating the same user, invalid/unverified/missing email rejection, and locked/withdrawn local user rejection.

- [ ] **Step 2: Run the service test and verify RED**

Run: `cd backend && ./gradlew test --tests '*KakaoAuthServiceTest'`

Expected: compilation fails because `loginWithKakao`, `kakaoUserId`, and `findByKakaoUserId` do not exist.

- [ ] **Step 3: Add transitional Kakao fields and repository lookup**

Add nullable `Long kakaoUserId` temporarily so the old login tests compile until Task 4. Add a new constructor and email updater:

```java
public UserEntity(long kakaoUserId, String email) { /* ACTIVE/USER plus timestamps */ }
public Long kakaoUserId() { return kakaoUserId; }
public void updateEmail(String email, Instant now) { this.email = email; this.updatedAt = now; }
```

Add `Optional<UserEntity> findByKakaoUserId(Long kakaoUserId)`.

- [ ] **Step 4: Implement Kakao login in the application service**

`loginWithKakao` must rate-limit `kakao-login:ip:<ip>`, call the provider, require nonblank email plus both Boolean flags equal to `true`, and execute user lookup/upsert plus session creation in one transaction. Normalize email with `trim().toLowerCase(Locale.ROOT)` but never use it for lookup or merge:

```java
KakaoIdentity identity = kakao.exchange(code, redirectUri);
String email = requireVerifiedEmail(identity);
UserEntity user = users.findByKakaoUserId(identity.serviceUserId())
    .map(existing -> { existing.updateEmail(email, now); return existing; })
    .orElseGet(() -> users.save(new UserEntity(identity.serviceUserId(), email)));
requireActive(user);
return createSession(user, now);
```

Return stable errors:

```java
KAKAO_LOGIN_FAILED(HttpStatus.BAD_GATEWAY, "카카오 로그인을 완료하지 못했습니다."),
KAKAO_EMAIL_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY,
    "유효하고 인증된 카카오계정 이메일이 필요합니다.")
```

- [ ] **Step 5: Run service and regression tests**

Run: `cd backend && ./gradlew test --tests '*KakaoAuthServiceTest'`

Expected: all Kakao service tests pass.

Run: `cd backend && ./gradlew test`

Expected: all backend tests still pass with both transitional paths present.

- [ ] **Step 6: Commit Task 2**

```bash
git add backend
git commit -m "feat(backend): create sessions from Kakao identities"
```

---

### Task 3: OAuth Start, State, Callback, and Session Cookie

**Files:**
- Create: `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/OAuthStateCodec.java`
- Create: `backend/src/test/java/site/hsu/hub/identity/adapter/in/web/OAuthStateCodecTest.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/AuthController.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/AuthControllerDocs.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/security/SecurityConfiguration.java`
- Modify: `backend/src/test/java/site/hsu/hub/SecuritySessionTest.java`
- Modify: `backend/src/test/java/site/hsu/hub/ApiContractTest.java`

**Interfaces:**
- Consumes: `AuthService.loginWithKakao` from Task 2.
- Produces: `GET /api/v1/auth/kakao/start?returnTo=<relative-path>`.
- Produces: `GET /api/v1/auth/kakao/callback`.
- Consumes trusted `X-HSU-Frontend: applicant|admin` set by infrastructure in Task 7.

- [ ] **Step 1: Write failing state-codec tests**

Assert that issue/verify round-trips `/apply/42?step=2`, rejects a different returned state, and reduces these inputs to `/clubs`: `https://evil.example`, `//evil.example`, `/\\evil`, a CRLF-containing value, and an empty value.

Define the interface exercised by the test:

```java
OAuthStateCodec.PendingLogin pending = codec.issue(rawReturnTo);
OAuthStateCodec.PendingLogin verified = codec.verify(pending.cookieValue(), pending.state());
```

- [ ] **Step 2: Run the codec test and verify RED**

Run: `cd backend && ./gradlew test --tests '*OAuthStateCodecTest'`

Expected: compilation fails because `OAuthStateCodec` does not exist.

- [ ] **Step 3: Implement state encoding and constant-time comparison**

Generate the state with `TokenSupport.newRawToken()`. Encode `state + "\n" + safeReturnTo` using URL-safe Base64 without padding. Decode defensively and compare UTF-8 state bytes using `MessageDigest.isEqual`. Throw `ApiException(BAD_REQUEST, "로그인 요청이 만료되었거나 올바르지 않습니다.")` on any invalid cookie/state.

- [ ] **Step 4: Write failing MockMvc start/callback tests**

For start, send `X-HSU-Frontend: applicant`, assert a 302 to `https://kauth.kakao.com/oauth/authorize`, exact `scope=account_email`, and an OAuth state cookie containing `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=300`, and no `Domain`.

For callback, extract `state` from the start redirect and cookie, stub `KakaoIdentityClient`, then assert the callback sets `__Host-HSU_SESSION` with the existing security attributes and redirects to the original internal path. Add cases for provider denial, state mismatch, missing code, unverified email, and unknown `X-HSU-Frontend`.

- [ ] **Step 5: Run the web tests and verify RED**

Run: `cd backend && ./gradlew test --tests '*SecuritySessionTest' --tests '*ApiContractTest'`

Expected: new start/callback expectations fail with 404 because the routes do not exist.

- [ ] **Step 6: Implement start and callback controller methods**

Use constants:

```java
static final String SESSION_COOKIE = "__Host-HSU_SESSION";
static final String OAUTH_COOKIE = "__Host-HSU_OAUTH";
static final String FRONTEND_HEADER = "X-HSU-Frontend";
```

Map `applicant` and `admin` only to the configured origins. Build callback URI as `<origin>/api/v1/auth/kakao/callback`. Build the Kakao authorization redirect with `UriComponentsBuilder`, never string concatenation. Rate-limit both start and callback entry by client IP so malformed/denied callbacks are covered even when no provider exchange occurs. On callback, expire the OAuth cookie on every path. Successful callbacks redirect to the verified return path; failures redirect to `/login?error=kakao_cancelled`, `/login?error=kakao_email_required`, or `/login?error=kakao_login_failed` on the same configured origin.

```java
rate.check("kakao-start:ip:" + ip(request), 20, Duration.ofMinutes(10));
rate.check("kakao-callback:ip:" + ip(request), 30, Duration.ofMinutes(10));
URI callback = origins.callbackUri(request.getHeader(FRONTEND_HEADER));
```

- [ ] **Step 7: Permit only the two OAuth GET endpoints and retain session/CSRF behavior**

Add `/api/v1/auth/kakao/start` and `/api/v1/auth/kakao/callback` to the public matcher. Do not disable CSRF globally. `POST /auth/logout` remains protected by the existing CSRF cookie/header contract.

- [ ] **Step 8: Run focused and full backend tests**

Run: `cd backend && ./gradlew test --tests '*OAuthStateCodecTest' --tests '*SecuritySessionTest' --tests '*ApiContractTest'`

Expected: focused tests pass.

Run: `cd backend && ./gradlew test`

Expected: the complete backend suite passes.

- [ ] **Step 9: Commit Task 3**

```bash
git add backend
git commit -m "feat(backend): expose Kakao OAuth callback flow"
```

---

### Task 4: Remove Email Authentication, Mail, and Legacy Schema

**Files:**
- Create: `backend/src/main/resources/db/migration/V5__replace_email_auth_with_kakao.sql`
- Modify: `backend/src/main/java/site/hsu/hub/identity/application/AuthService.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/UserEntity.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/UserRepository.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/AuthController.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/web/AuthControllerDocs.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/adapter/in/security/SecurityConfiguration.java`
- Modify: `backend/src/main/java/site/hsu/hub/identity/package-info.java`
- Modify: `backend/src/main/java/site/hsu/hub/common/exception/ErrorCode.java`
- Modify: `backend/src/test/java/site/hsu/hub/ApiContractTest.java`
- Modify: `backend/src/test/java/site/hsu/hub/FlywayMySqlTest.java`
- Modify: `backend/build.gradle`
- Delete: `backend/src/main/java/site/hsu/hub/identity/domain/EmailAddress.java`
- Delete: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/EmailVerificationTokenEntity.java`
- Delete: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/EmailVerificationTokenRepository.java`
- Delete: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/PasswordResetTokenEntity.java`
- Delete: `backend/src/main/java/site/hsu/hub/identity/adapter/out/persistence/PasswordResetTokenRepository.java`
- Delete: `backend/src/main/java/site/hsu/hub/mail/**`
- Delete: `backend/src/test/java/site/hsu/hub/identity/domain/EmailAddressTest.java`

**Interfaces:**
- Retains only OAuth start/callback, session, and logout authentication endpoints.
- Final `UserEntity` requires `(long kakaoUserId, String email)` and has no password/verification methods.

- [ ] **Step 1: Replace legacy API tests with removal assertions**

For every removed POST endpoint, perform the request with `csrf()` and assert wrapped `404 NOT_FOUND`. Update the OpenAPI test to require `카카오 로그인` and reject the old signup description:

```java
assertThat(openApiJson).contains("카카오 로그인")
                       .doesNotContain("한성대학교 이메일과 10자 이상의 비밀번호");
```

- [ ] **Step 2: Extend the Flyway test before writing the migration**

Expect five migrations. Query `information_schema.columns` and `information_schema.tables` to assert `users.kakao_user_id` and `users.email` exist, while `password_hash`, `email_verified_at`, `email_verification_tokens`, and `password_reset_tokens` do not.

- [ ] **Step 3: Run removal/migration tests and verify RED**

Run: `cd backend && ./gradlew test --tests '*ApiContractTest' --tests '*FlywayMySqlTest'`

Expected: old endpoints still return success/security responses and the migration count/schema assertions fail.

- [ ] **Step 4: Add the destructive empty-platform migration**

Use this operation order so foreign keys are removed before columns:

```sql
DROP TABLE password_reset_tokens;
DROP TABLE email_verification_tokens;
ALTER TABLE users DROP INDEX email_normalized;
ALTER TABLE users CHANGE COLUMN email_normalized email VARCHAR(190) NOT NULL;
ALTER TABLE users ADD COLUMN kakao_user_id BIGINT NOT NULL AFTER id;
ALTER TABLE users ADD CONSTRAINT uq_users_kakao_user_id UNIQUE (kakao_user_id);
CREATE INDEX ix_users_email ON users(email);
ALTER TABLE users DROP COLUMN password_hash, DROP COLUMN email_verified_at;
```

This migration intentionally assumes the undeployed platform has no legacy users, as approved in the spec.

- [ ] **Step 5: Remove legacy endpoints and backend types**

Delete signup, password login, verification, resend, and reset methods/DTOs/docs. Remove password encoder configuration and old public matchers. Simplify `authenticate` so active status and session validity are sufficient. Remove `EMAIL_DOMAIN_NOT_ALLOWED`, `MAIL_UNAVAILABLE`, AWS SES dependency, the entire mail module, and the identity module's `mail::api` dependency.

- [ ] **Step 6: Make the Kakao user mapping final**

Make `kakaoUserId` a non-null primitive `long`/`Long` JPA column named `kakao_user_id`, remove old constructors/password fields, and retain email as a mutable non-identity attribute.

- [ ] **Step 7: Run backend verification**

Run: `cd backend && ./gradlew clean test bootJar`

Expected: all tests pass, the MySQL migration test executes five migrations when Docker is available, and `build/libs/hsu-hub-backend.jar` is created.

- [ ] **Step 8: Search backend for removed authentication artifacts**

Run:

```bash
rg -n "signup|password-resets|email-verifications|PasswordEncoder|password_hash|email_verified_at|MailSender|sesv2|hansung\\.ac\\.kr" \
  backend/src/main/java backend/src/main/resources/application.yml backend/build.gradle
```

Expected: no matches. General application-form question type `email` is outside this search and remains supported.

- [ ] **Step 9: Commit Task 4**

```bash
git add backend
git commit -m "refactor(backend): remove email authentication"
```

---

### Task 5: Applicant Kakao Login UI

**Files:**
- Modify: `mobile/src/production/AuthPages.jsx`
- Modify: `mobile/src/App.jsx`
- Modify: `mobile/src/auth/AuthContext.jsx`
- Modify: `mobile/src/production/Layout.jsx`
- Modify: `mobile/src/__tests__/production.test.jsx`
- Modify: `mobile/src/styles/production.css`

**Interfaces:**
- Consumes: backend `GET /api/v1/auth/kakao/start?returnTo=<encoded-relative-path>`.
- Consumes: callback query error values `kakao_cancelled`, `kakao_email_required`, `kakao_login_failed`.

- [ ] **Step 1: Replace applicant authentication tests first**

Assert the guarded `/clubs` route renders a link named `카카오로 계속하기` whose href is `/api/v1/auth/kakao/start?returnTo=%2Fclubs`. Assert `/login?error=kakao_email_required` renders `유효하고 인증된 카카오계정 이메일이 필요해요.` Assert `/signup`, `/verify-email`, `/forgot-password`, and `/reset-password` render the generic 404 and no email/password fields.

- [ ] **Step 2: Run applicant tests and verify RED**

Run: `npm run test --workspace mobile`

Expected: tests fail because the current login form and removed routes still exist.

- [ ] **Step 3: Reduce auth context and guard to session presence**

Delete the credential-posting `login` method and all `emailVerified` normalization. Rename `RequireVerified` to `RequireAuth` and guard with `if (!user)`. Keep session bootstrap and CSRF-protected logout unchanged.

- [ ] **Step 4: Replace the applicant auth UI**

Keep `AuthShell` but export only `Login`. Compute the destination from router state, accept only a single-slash relative path, and construct:

```jsx
const kakaoHref = `/api/v1/auth/kakao/start?returnTo=${encodeURIComponent(destination)}`;
<a className="kakao-login-button" href={kakaoHref}>카카오로 계속하기</a>
```

Map only the three stable error query values to Korean copy; unknown values use `카카오 로그인을 완료하지 못했어요. 다시 시도해 주세요.` Remove fields, submit handlers, signup footer, and reset links.

- [ ] **Step 5: Remove applicant routes and add focused Kakao styling**

Remove all auth routes except `/login`. Style the anchor with Kakao yellow `#FEE500`, near-black text, clear focus-visible outline, disabled-free semantics, and the existing mobile width/radius tokens.

- [ ] **Step 6: Run applicant tests and build**

Run: `npm run test --workspace mobile && npm run build --workspace mobile`

Expected: all applicant tests pass and Vite production build exits 0.

- [ ] **Step 7: Commit Task 5**

```bash
git add mobile
git commit -m "feat(mobile): replace email auth with Kakao Login"
```

---

### Task 6: Operator Kakao Login UI

**Files:**
- Modify: `web/src/production/Login.jsx`
- Modify: `web/src/production/OperatorContext.jsx`
- Modify: `web/src/test/production.contract.test.jsx`
- Modify: `web/src/styles/production.css`

**Interfaces:**
- Consumes: the same backend start endpoint and error query values as Task 5.
- Retains: operator club authorization loaded from `/auth/session` then `/operator/clubs`.

- [ ] **Step 1: Write failing operator login tests**

Assert unauthenticated `/admin/club` shows `카카오로 계속하기` linking to `/api/v1/auth/kakao/start?returnTo=%2Fadmin%2Fclub`, contains no email/password inputs, and maps `kakao_email_required` to the same Korean requirement message.

- [ ] **Step 2: Run operator tests and verify RED**

Run: `npm run test --workspace web`

Expected: login tests fail because the email/password form remains.

- [ ] **Step 3: Remove credential login from operator context**

Delete `login(credentials)` and the `emailVerified` gate. A successful session object is authenticated; then load `/operator/clubs` exactly as before. Keep logout and club selection behavior.

- [ ] **Step 4: Replace the operator login form**

Keep the existing art panel and operator copy. Replace labels and submit state with the same plain anchor flow used by the applicant UI. Validate the router-state destination before encoding it, defaulting to `/admin/club`. Map callback errors from `useSearchParams`.

- [ ] **Step 5: Run operator tests and build**

Run: `npm run test --workspace web && npm run build --workspace web`

Expected: all operator tests pass and the Vite production build exits 0.

- [ ] **Step 6: Search both frontends for removed auth UI**

Run:

```bash
rg -n "signup|verify-email|forgot-password|reset-password|emailVerified|비밀번호|인증 메일|학교 이메일" mobile/src web/src
```

Expected: no matches.

- [ ] **Step 7: Commit Task 6**

```bash
git add web
git commit -m "feat(web): replace operator login with Kakao Login"
```

---

### Task 7: CDK Kakao Secret, Trusted Frontend Origin, and SES Removal

**Files:**
- Modify: `infrastructure/lib/config.ts`
- Modify: `infrastructure/lib/platform-stack.ts`
- Modify: `infrastructure/test/config.test.ts`
- Modify: `infrastructure/test/platform-stack.test.ts`

**Interfaces:**
- Produces: required CDK context `kakaoSecretArn`.
- Produces: stack output `KakaoSecretArn`.
- Produces: origin-only header `X-HSU-Frontend: applicant|admin`.

- [ ] **Step 1: Write failing configuration tests**

Replace the SES acknowledgement test with a required Kakao secret ARN test. The accepted fixture is:

```text
arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:/hsu-hub/production/kakao-AbCdEf
```

Reject a secret from another account or region. Remove `sesProductionAccessAcknowledged` from the config fixture and interface.

- [ ] **Step 2: Write failing platform assertions**

Assert zero `AWS::SES::EmailIdentity` resources, an IAM `secretsmanager:GetSecretValue` statement scoped to the configured Kakao ARN, `KakaoSecretArn` output, and two CloudFront API origins whose custom headers contain applicant/admin values.

- [ ] **Step 3: Run infrastructure tests and verify RED**

Run: `cd infrastructure && npm test`

Expected: tests fail because SES exists and Kakao secret/header configuration does not.

- [ ] **Step 4: Replace SES config with Kakao secret config**

Add `kakaoSecretArn: string` to `HsuHubConfig`, require it, and validate with an ARN expression bound to the configured region and account. Delete all SES production acknowledgement parsing and return values.

- [ ] **Step 5: Import and grant only the external Kakao secret**

```ts
const kakaoSecret = secretsmanager.Secret.fromSecretCompleteArn(
  this, 'KakaoSecret', config.kakaoSecretArn,
);
kakaoSecret.grantRead(instanceRole);
```

Remove the SES import, `EmailIdentity`, DKIM/MAIL FROM ownership, and send-email grant. Add `KakaoSecretArn` to stack outputs. Do not create or populate the external secret in CloudFormation.

- [ ] **Step 6: Give each distribution a trusted frontend marker**

Create two VPC origins to the same ALB, with identical timeout/protocol settings but different custom headers:

```ts
customHeaders: { 'X-HSU-Frontend': 'applicant' }
customHeaders: { 'X-HSU-Frontend': 'admin' }
```

Pass the matching origin into each `frontendDistribution` call. The browser cannot override these origin custom-header values.

- [ ] **Step 7: Run infrastructure tests and TypeScript build**

Run: `cd infrastructure && npm test && npm run build`

Expected: all infrastructure tests pass and `tsc` exits 0.

- [ ] **Step 8: Commit Task 7**

```bash
git add infrastructure
git commit -m "feat(infra): provision Kakao authentication secret access"
```

---

### Task 8: Runtime Deployment, CI, and Infrastructure Documentation

**Files:**
- Modify: `deploy/docker-compose.yml`
- Modify: `deploy/runtime-deploy.sh`
- Modify: `ops/deploy.sh`
- Modify: `ops/test.sh`
- Modify: `.github/workflows/production.yml`
- Modify: `INFRASTRUCTURE.md`

**Interfaces:**
- Consumes: `KakaoSecretArn` output from Task 7.
- Secret JSON contract: `{ "clientId": "...", "clientSecret": "..." }`.
- Produces backend environment: `HSU_KAKAO_CLIENT_ID`, `HSU_KAKAO_CLIENT_SECRET`, `HSU_KAKAO_APPLICANT_ORIGIN`, `HSU_KAKAO_ADMIN_ORIGIN`.

- [ ] **Step 1: Extend operations contract checks first**

Require `KAKAO_SECRET_ARN` in deployment files, require both Kakao environment names in Compose, and reject stale `FROM_EMAIL`, `SES_PRODUCTION_ACCESS_ACKNOWLEDGED`, and `sesProductionAccessAcknowledged` strings.

- [ ] **Step 2: Run operations checks and verify RED**

Run: `bash ops/test.sh`

Expected: the new Kakao assertions fail and stale SES/mail variables are found.

- [ ] **Step 3: Pass the Kakao secret ARN through deployment**

`ops/deploy.sh` reads `KakaoSecretArn` alongside the database/session outputs and writes it to `deployment.env`. It also writes the fixed production origins. `runtime-deploy.sh` retrieves the secret once and extracts both required keys with `jq -er`, then writes them to the root-only runtime env file without printing their values.

- [ ] **Step 4: Update Compose environment**

Remove `FROM_EMAIL`. Add:

```yaml
HSU_KAKAO_CLIENT_ID: ${KAKAO_CLIENT_ID:?KAKAO_CLIENT_ID is required}
HSU_KAKAO_CLIENT_SECRET: ${KAKAO_CLIENT_SECRET:?KAKAO_CLIENT_SECRET is required}
HSU_KAKAO_APPLICANT_ORIGIN: ${KAKAO_APPLICANT_ORIGIN:?KAKAO_APPLICANT_ORIGIN is required}
HSU_KAKAO_ADMIN_ORIGIN: ${KAKAO_ADMIN_ORIGIN:?KAKAO_ADMIN_ORIGIN is required}
```

Update the optional Docker Compose validation in `ops/test.sh` with non-secret test values.

- [ ] **Step 5: Replace the workflow deployment gate**

Delete `SES_PRODUCTION_ACCESS_ACKNOWLEDGED`. Add `KAKAO_SECRET_ARN: ${{ vars.KAKAO_SECRET_ARN }}` and pass `-c kakaoSecretArn="$KAKAO_SECRET_ARN"` to both synth and deploy commands.

- [ ] **Step 6: Rewrite infrastructure authentication setup documentation**

Remove SES from the architecture summary, context table, deployment command, and rotation notes. Document the exact secret JSON keys, registered callback URIs, required `account_email` consent, Kakao Client Secret activation, privacy-policy prerequisite, and GitHub repository variable `KAKAO_SECRET_ARN`. Retain the operational SNS alert-email documentation.

- [ ] **Step 7: Run operations and infrastructure verification**

Run: `bash ops/test.sh`

Expected: `operations contract checks passed`.

Run: `cd infrastructure && npm test && npm run build`

Expected: all tests and TypeScript build pass after workflow/runtime integration.

- [ ] **Step 8: Commit Task 8**

```bash
git add infrastructure deploy ops .github/workflows/production.yml INFRASTRUCTURE.md
git commit -m "chore: replace SES deployment with Kakao credentials"
```

---

### Task 9: Coordinator Integration and Full Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-08-18-kakao-auth-design.md`
- Verify: all files owned by the three workers

**Interfaces:**
- Consumes: all BE, FE, and Infra worker commits and `worker_done` reports.
- Produces: one integrated branch with verified Kakao authentication and no authentication-email runtime path.

- [ ] **Step 1: Inspect each worker result before integration**

For every worker, inspect `worker_done`, `git show --stat <commit>`, and the owned-path diff. Reject edits outside ownership and send a follow-up through the same Orca dispatch/terminal when correction is required.

- [ ] **Step 2: Cherry-pick worker commits by subsystem**

Cherry-pick BE commits in their reported order, then FE commits, then Infra commits. Resolve only genuine integration conflicts; do not overwrite `.env` or `docs/hand-off/`.

- [ ] **Step 3: Mark the design approved**

Change the design header to:

```markdown
**Status:** Approved
```

- [ ] **Step 4: Run cross-repository removal searches**

Run:

```bash
rg -n "password-resets|email-verifications|/auth/signup|/auth/login|PasswordEncoder|password_hash|email_verified_at|MailSender|sesv2|SES_PRODUCTION_ACCESS_ACKNOWLEDGED|sesProductionAccessAcknowledged|FROM_EMAIL" \
  backend/src/main/java backend/src/main/resources/application.yml backend/build.gradle \
  mobile/src web/src infrastructure deploy ops .github INFRASTRUCTURE.md
```

Expected: no matches.

Run:

```bash
rg -n "KAKAO_CLIENT_SECRET|clientSecret" . \
  -g '!docs/superpowers/plans/2026-08-18-kakao-auth.md' \
  -g '!docs/superpowers/specs/2026-08-18-kakao-auth-design.md' \
  -g '!.env'
```

Expected: only environment/property names and secret JSON-key parsing; no credential value.

- [ ] **Step 5: Run all frontend tests and builds**

Run: `npm test && npm run build`

Expected: all workspace tests pass; applicant and operator production bundles build.

- [ ] **Step 6: Run complete backend verification**

Run: `cd backend && ./gradlew clean test bootJar`

Expected: Gradle exits 0 with all tests passing and the boot JAR produced. Confirm whether Docker was available and therefore whether `FlywayMySqlTest` ran or was skipped.

- [ ] **Step 7: Run infrastructure and operations verification**

Run: `cd infrastructure && npm test && npm run build`

Expected: all Vitest tests pass and TypeScript compilation exits 0.

Run: `bash ops/test.sh`

Expected: `operations contract checks passed`.

- [ ] **Step 8: Run strict CDK synthesis**

Run from `infrastructure/` with non-secret validation fixtures:

```bash
npm run synth -- --lookups false \
  -c account=123456789012 \
  -c region=ap-northeast-2 \
  -c domainName=hsu-hub.site \
  -c githubRepository=hsu-club/hsu-hub \
  -c githubEnvironment=production \
  -c operationsPrincipalArn=arn:aws:iam::123456789012:role/HsuHubOperators \
  -c alertEmail=alerts@example.com \
  -c kakaoSecretArn=arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:/hsu-hub/production/kakao-AbCdEf
```

Expected: synthesis and cdk-nag exit 0 with no SES identity in the template.

- [ ] **Step 9: Review the final diff and commit integration metadata**

Run: `git diff --check HEAD~1..HEAD` for each cherry-picked commit and `git status --short` for unexpected paths. Commit only the approved design-status/plan metadata if it is not already committed:

```bash
git add docs/superpowers/specs/2026-08-18-kakao-auth-design.md docs/superpowers/plans/2026-08-18-kakao-auth.md
git commit -m "docs: finalize Kakao authentication implementation plan"
```

- [ ] **Step 10: Report deployment prerequisites separately from code completion**

State that code verification does not configure the external Kakao developer app or create the referenced Secrets Manager secret. List the required Kakao console settings and secret creation as operator actions, without claiming production login works until those external steps and an actual callback smoke test succeed.
