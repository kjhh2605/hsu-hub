# HSU Hub Kakao Authentication Design

**Date:** 2026-08-18  
**Status:** Approved in chat; pending written-spec review  
**Affected applications:** `mobile`, `web`, `backend`, `infrastructure`, deployment automation

## 1. Purpose

Replace every email/password authentication and email-verification feature with Kakao Login. Any Kakao Account may create an HSU Hub account. The service identifies a user by the Kakao service user ID and additionally requires a valid, verified Kakao Account email.

The service keeps its existing opaque, server-side sessions. Kakao access and refresh tokens are used only during the login callback to retrieve the Kakao service user ID and email; HSU Hub does not retain them.

## 2. Product Decisions

- Any Kakao Account may join; Hansung University email-domain restrictions are removed.
- Kakao service user ID is the stable external identity key.
- The only requested Kakao personal-information scope is `account_email`.
- Email is required. Login fails when Kakao does not provide an email or reports it as invalid or unverified.
- Nickname, profile image, name, gender, age, and other Kakao information are not requested or stored.
- Existing email/password accounts are not linked or migrated. The production platform has not been deployed, so the schema is replaced without a legacy-account migration flow.
- Operator access remains explicitly assigned. A user first logs in with Kakao; an administrator then adds the user's internal HSU Hub user ID to `club_users`.
- Applicant and operator hosts continue to use separate host-only sessions. Signing in on one host does not sign the user in on the other.
- Service logout revokes only the HSU Hub session. It does not globally log the user out of Kakao or unlink the Kakao Account.

## 3. Considered Approaches

### 3.1 Backend authorization-code flow with an HSU Hub session — selected

The backend creates the OAuth state, redirects to Kakao, exchanges the returned authorization code server-to-server, retrieves the Kakao user, creates or updates the local user, and issues the existing opaque HSU Hub session cookie.

This keeps Kakao credentials out of browser JavaScript, preserves the current authorization model, and avoids introducing a second long-lived token system.

### 3.2 Spring Security OAuth2 Client end-to-end

Spring Security can own the authorization request and callback, but its default temporary-session and authentication model would need custom success handlers and bridging into the existing opaque session repository. The additional framework integration does not provide enough benefit for this single provider.

### 3.3 JWT access and refresh tokens

This would require refresh-token rotation, replay detection, revocation, forced-logout handling, and secure browser storage. A single backend with an existing session database does not need the distributed, stateless properties that could justify those costs.

## 4. Authentication Flow

1. The frontend navigates the browser to `GET /api/v1/auth/kakao/start?returnTo=<path>`.
2. The backend validates that `returnTo` is an internal relative path, generates a cryptographically random OAuth `state`, and stores the state and return path in a short-lived host-only cookie.
3. The backend redirects to Kakao's authorization endpoint with the REST API key, registered callback URI, `response_type=code`, state, and `account_email` scope.
4. Kakao redirects the browser to `GET /api/v1/auth/kakao/callback` on the same HSU Hub host.
5. The backend compares the query-string state with the state cookie and expires the state cookie immediately.
6. The backend exchanges the authorization code for Kakao tokens using the REST API key, Client Secret, and the exact callback URI.
7. The backend calls Kakao's user-information endpoint and requests only `kakao_account.email` in addition to the default service user ID.
8. The backend requires a service user ID, an email, `is_email_valid=true`, and `is_email_verified=true`.
9. The backend finds the local user by Kakao service user ID. It creates a new active user when none exists, or updates the stored email when it changed.
10. The backend creates the existing seven-day opaque HSU Hub session and sets `__Host-HSU_SESSION` with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
11. The backend discards the Kakao access and refresh tokens and redirects to the validated return path.

The Kakao app registers separate callback URIs for `https://hsu-hub.site` and `https://admin.hsu-hub.site`, plus explicit local-development callback URIs. The backend selects a callback origin only from a configured allowlist; it never trusts an arbitrary Host or forwarded-host value.

## 5. API Contract

The public authentication surface becomes:

- `GET /api/v1/auth/kakao/start?returnTo=...`: start Kakao Login.
- `GET /api/v1/auth/kakao/callback`: validate the callback, create the local session, and redirect.
- `GET /api/v1/auth/session`: return the authenticated user's internal ID, email, and service role.
- `POST /api/v1/auth/logout`: revoke the local session and expire its cookie.

The following endpoints are removed:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/email-verifications/resend`
- `POST /api/v1/auth/email-verifications/confirm`
- `POST /api/v1/auth/password-resets/request`
- `POST /api/v1/auth/password-resets/confirm`

OAuth start and callback are permitted without an HSU Hub session. All other application authorization rules remain unchanged. State-changing application APIs and logout continue to require CSRF protection.

## 6. Backend Boundaries

The identity module gains a small Kakao outbound port and adapter:

- The application service owns HSU Hub login decisions, user upsert, and session creation.
- The Kakao client owns HTTP calls to the token and user-information endpoints and maps provider responses into a provider-neutral login identity containing only Kakao service user ID and email validity data.
- The web adapter owns redirects, the transient OAuth state cookie, the final HSU Hub session cookie, and safe return-path handling.

Kakao calls use bounded connection and response timeouts. Provider response bodies and tokens are never logged. Provider failures are translated into stable HSU Hub login error codes instead of exposing Kakao response details to the browser.

## 7. Data Model and Migration

`users` becomes:

- `id BIGINT`: internal primary key.
- `kakao_user_id BIGINT`: required and unique.
- `email VARCHAR(190)`: required, current Kakao Account email; it is not an identity key.
- `service_role`, `status`, `created_at`, and `updated_at`: retained.

The migration removes `password_hash` and `email_verified_at`, and drops `email_verification_tokens` and `password_reset_tokens`. `user_sessions` and all business-domain foreign keys to the internal user ID remain intact.

Email is updated when the same Kakao service user ID returns a different valid, verified email. The schema does not use email uniqueness to merge accounts. No existing email account is automatically attached to a Kakao identity.

The obsolete email-address domain validator, password encoder configuration, password reset entities and repositories, verification entities and repositories, and mail-sending application boundaries are removed. Generic random-token and hashing support used by HSU Hub sessions remains.

## 8. Frontend Changes

The applicant app removes signup, email verification, verification resend, forgotten-password, and password-reset routes and screens. Its login screen contains one Kakao Login action that preserves the requested internal destination.

The operator app replaces its email/password form with one Kakao Login action. After login, the existing operator guard loads the local session and the user's authorized clubs. A Kakao-authenticated user without a `club_users` mapping remains denied access to operator pages.

Frontend code no longer submits credentials or checks `emailVerified`. Removed authentication URLs resolve through the existing not-found behavior. Callback failures redirect to the appropriate host's login route with a stable error code, which the login screen maps to a Korean message.

## 9. Security and Error Handling

- OAuth state uses a cryptographically secure random value and a five-minute `Secure`, `HttpOnly`, host-only, `SameSite=Lax` cookie.
- The callback always deletes the state cookie, including error paths.
- State mismatch, missing state, expired state, a missing code, or provider denial never creates a session.
- `returnTo` must start with exactly one `/`, must not start with `//`, and must not contain an absolute URL or control characters. Invalid values fall back to the host's default authenticated route.
- Only configured applicant and operator origins may become callback origins.
- Login initiation and failed callbacks are rate-limited by client IP without including tokens or authorization codes in keys or logs.
- A missing, invalid, or unverified Kakao email fails with a user-facing explanation that the Kakao Account must provide a verified email.
- A locked or withdrawn local user cannot create a session even when Kakao authentication succeeds.
- Kakao tokens remain in request-local memory only and are discarded after user retrieval.
- HSU Hub session identifiers remain opaque, randomly generated, stored hashed, and revocable server-side.

## 10. Infrastructure and Operations

Remove authentication-email infrastructure and code:

- AWS SES email identity, DKIM and custom MAIL FROM resources owned by the platform stack.
- Backend SES IAM permissions and AWS SES SDK dependency.
- The `mail` module and runtime mail settings.
- The SES production-access acknowledgement deployment gate and related workflow inputs and tests.

Operational SNS alert email remains because it is unrelated to user authentication.

Kakao credentials are supplied through a pre-created AWS Secrets Manager secret containing the REST API key and Client Secret. CDK accepts the secret ARN as explicit deployment context, grants the runtime instance permission to read only that secret, and passes only the ARN into deployment automation. Runtime scripts retrieve the values into process environment without printing them. Local and test profiles use explicit environment variables or a stub Kakao client; no real credential is committed.

Deployment documentation lists these prerequisites:

- Create and configure the Kakao developer application.
- Activate Kakao Login and Client Secret.
- Register both production callback URIs and the documented local callback URIs.
- Configure `account_email` as required consent and enable provision after collecting information through Kakao Account.
- Complete any Kakao business-app or personal-information review required for production email consent.
- Update the privacy policy to state the purpose and retention of Kakao service user ID and email collection.
- Create the runtime Kakao credential secret and provide its ARN to CDK.

## 11. Test Strategy

Backend tests cover:

- Login start redirect, state cookie attributes, callback URI selection, and safe return-path handling.
- Callback rejection for missing, mismatched, expired, and reused state.
- Provider denial, token exchange failure, malformed provider responses, and timeouts.
- Rejection of missing, invalid, and unverified Kakao email.
- New-user creation, repeat login by Kakao service user ID, and email update without duplicate account creation.
- Locked and withdrawn user rejection.
- HSU Hub session issuance, cookie attributes, session lookup, and logout revocation.
- Removal of the email/password endpoints from the public security allowlist.

Frontend tests cover:

- Applicant and operator Kakao Login actions and preservation of internal destinations.
- Korean callback-error messages.
- Absence of email/password, signup, verification, and password-reset routes and UI.
- Existing protected-route behavior after session loading.

Migration and infrastructure tests cover:

- The final MySQL schema contains `kakao_user_id` and no password or email-token artifacts.
- The platform template contains no SES identity or SES send permission.
- Runtime access is limited to the configured Kakao secret.
- Deployment validation requires the Kakao secret ARN and no longer requires SES production-access acknowledgement.

Final verification runs all frontend tests and production builds, backend clean tests and boot JAR packaging, Flyway's MySQL migration test, infrastructure tests and TypeScript build, CDK synthesis, and operations-script contract tests.

## 12. Out of Scope

- Linking an existing email/password account to Kakao.
- Supporting additional social-login providers.
- JWT access or refresh tokens.
- Persisting Kakao access or refresh tokens.
- Kakao messaging, friend, profile, or logout APIs.
- Operator invitation or self-service role-management UI.
- A user-facing account withdrawal or Kakao unlink flow.
