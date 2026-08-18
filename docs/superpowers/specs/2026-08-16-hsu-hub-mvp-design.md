# HSU Hub MVP Design

**Date:** 2026-08-16
**Status:** Superseded for authentication by [2026-08-18-kakao-auth-design.md](./2026-08-18-kakao-auth-design.md); non-authentication scope remains applicable
**Domains:** `hsu-hub.site`, `admin.hsu-hub.site`

## 1. Purpose

This MVP turns the existing disconnected React prototypes into one deployed service with two complete flows:

1. A student opens the public home, signs in with a verified Hansung University email account, browses clubs, opens a recruitment, completes its form, and reaches the submission-complete screen.
2. A club operator edits their club profile, publishes a recruitment and form, and views submissions for their own club, including inline PDF preview or an external link in a new tab.

The pilot targets about 30 users. The design favors a small operational footprint, strict access boundaries, and an end-to-end deployable slice over high-traffic scaling features.

## 2. Existing Project Context

The repository currently contains three independent Vite applications:

- `mobile/`: a 390px applicant prototype with club discovery, detail, application, completion, and additional out-of-scope flows.
- `web/`: a desktop operator prototype with recruitment authoring, a form builder, applicant management, and additional out-of-scope flows.
- `landing-site/`: a separate promotional site that is not part of this MVP.

Both product prototypes use seed data and browser storage. They do not share data or contracts. There is no Java backend, database schema, infrastructure as code, production authentication, or real file upload.

Implementation must preserve the approved visual flows from `mobile/` and `web/` while replacing seed/local-only behavior with shared backend data. Existing routes outside the approved MVP must not be present in production navigation or routing.

## 3. Scope

### 3.1 In scope

- Public home with `동아리` and disabled `시설예약` entries.
- Email/password signup for `@hansung.ac.kr` only.
- Email verification, login, logout, forgotten-password, and password-reset flows.
- Authenticated club list and club/recruitment detail.
- Operator-managed persistent club introduction, activity information, and cover image.
- One concurrently active recruitment per club, with historical recruitments retained.
- Recruitment authoring wizard with the existing page, stage, form, and review steps.
- Stage schedule configuration for document result, interview, and final result dates.
- Dynamic application forms and a live mobile preview.
- Final application submission, optionally including one resume PDF or one HTTPS link.
- Operator-only applicant list and submission detail for the operator's own club.
- Inline PDF preview served by the backend.
- Production hosting, TLS, DNS, email delivery, monitoring, backup, and deployment automation.

### 3.2 Explicitly out of scope

- Facility reservation; the home entry is visible as `준비 중` and has no destination.
- Applicant profile fields and application-form autofill.
- My applications, application modification, cancellation, and resubmission.
- Notifications.
- Interview booking, interview session management, attendance, and evaluation.
- Pass/fail decisions and result publication.
- Operator notes and scoring.
- Operator invitations, role management, and permission-setting screens.
- Service-admin UI.
- Operator server-side drafts or resume-after-login authoring.
- Published recruitment or form editing.
- Existing prototype dashboard, settings, screen index, and any other unapproved route.

Configured interview and result dates are retained as recruitment schedule data and may be displayed, but they do not activate interview or result-management behavior in this MVP.

## 4. Key Product Decisions

- Only the home and required authentication pages are available before login.
- Club list, club detail, application, and all operator pages require an authenticated, email-verified session.
- `User.role` represents service-level role: `USER` or `SERVICE_ADMIN`.
- Club operations are authorized through `ClubUser` and a single `clubRole=OPERATOR` value.
- A user may operate more than one club. The operator header shows a club selector only when multiple `ClubUser` mappings exist.
- Club and `ClubUser` seed records are inserted or changed directly in the database; the MVP has no registration UI for them.
- A newly inserted club appears in the list with name and category. Missing content uses a neutral fallback cover and no invented introduction.
- Club introduction and cover persist independently of recruitment state and change only when an operator edits them.
- The cover is both the club-list thumbnail and the background of the club-detail hero shown in the approved reference. A dark overlay preserves text contrast.
- Club detail remains viewable outside recruitment dates, but applying is disabled.
- A user may submit once per recruitment. Submission cannot be edited or canceled.
- Applicant account email is not shown in the application list or detail. Identity information is visible only when the operator asks for it as a form question and the applicant enters it.
- The starter form may include editable basic-information questions such as name and student number, but none are populated from the account.
- Applicant text/choice draft values are stored only in the browser. A selected PDF is never persisted in browser storage and must be reselected after refresh.
- Operator wizard state exists only in browser memory until final publish. Navigation or refresh triggers a loss warning.
- Published recruitment content and form schema are immutable, so submitted answers always retain their original meaning.

## 5. Deployment Architecture

### 5.1 Request path

`hsu-hub.site` and `admin.hsu-hub.site` each use a dedicated CloudFront distribution:

- Default behavior serves a dedicated private frontend artifact S3 bucket through Origin Access Control (OAC).
- `/api/*` disables caching and forwards methods, request bodies, session cookies, the CSRF header, and required query parameters to the same CloudFront VPC Origin.
- The VPC Origin is a Spring Boot service on an EC2 instance in a private subnet. The instance has no public IPv4 address and no public API hostname.

The two hostnames deliberately retain separate host-only login cookies. A user signs in separately on the applicant and operator sites.

### 5.2 Compute and database

A single EC2 instance runs two Docker Compose services:

- Spring Boot backend.
- MySQL.

MySQL binds only to the Compose network. Its data directory uses an encrypted EBS volume. This is an accepted pilot trade-off: backend and database share a failure domain, but the cost and operating model fit the expected 30 users.

The private subnet uses a NAT Gateway for controlled outbound access. SSH ingress is not allowed. Operators use AWS Systems Manager for instance administration and deployment commands.

### 5.3 S3 boundaries

S3 is not placed inside a VPC. Access is made private through service policies:

- Applicant frontend artifact bucket: readable only by its CloudFront OAC.
- Operator frontend artifact bucket: readable only by its CloudFront OAC.
- Upload bucket for club covers and resume PDFs: accessible only by the backend EC2 IAM role through an S3 Gateway Endpoint and restrictive bucket/endpoint policies.
- Backup bucket/path: writable only by the backup role and readable only by explicitly authorized maintenance operations.

Clients never receive an S3 upload or download URL. Cover images and PDFs pass through the Spring service after authentication and authorization.

### 5.4 Supporting services

- Route 53 manages DNS for the two hostnames.
- ACM supplies viewer certificates; CloudFront certificates are created in `us-east-1` as required by CloudFront.
- SES sends verification and password-reset mail from `no-reply@hsu-hub.site` after domain verification and production-access approval.
- ECR stores backend images.
- Secrets Manager stores the database password, session secret material, and deployment secrets.
- CloudWatch receives application/system logs and alarms.
- AWS CDK in TypeScript defines the deployable infrastructure.

AWS references:

- [CloudFront VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)
- [CloudFront S3 origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [S3 Gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html)

## 6. Backend Architecture

The backend is one Spring Boot/Spring Modulith application organized by business domain. Every module uses hexagonal boundaries: domain model, application use cases and ports, then inbound/outbound adapters.

### 6.1 Modules

- `identity`: signup, email verification, authentication, sessions, password reset.
- `club`: club profile, cover assignment, club membership and club-role authorization.
- `recruitment`: immutable published recruitment, stages, form schema, and active-period rules.
- `application`: final submission, dynamic answers, duplicate protection, applicant queries.
- `file`: file validation, metadata, object lifecycle, and an S3 storage port.
- `mail`: email templates and an SES delivery adapter.

Cross-module access uses exposed application ports, not another module's repositories. Spring Modulith verification and ArchUnit tests enforce package and dependency rules.

### 6.2 Controller documentation convention

Each REST controller implements a matching `*ControllerDocs` interface. Swagger annotations, Korean operation summaries, Korean descriptions, documented status codes, and response examples live in that interface. Controllers contain request mapping/delegation only, apart from Spring MVC annotations needed by the concrete adapter.

Examples:

- `AuthController implements AuthControllerDocs`
- `ClubController implements ClubControllerDocs`
- `OperatorRecruitmentController implements OperatorRecruitmentControllerDocs`

## 7. Domain and Data Model

Flyway owns all schema changes. MySQL uses `utf8mb4` and UTC timestamps.

### 7.1 Identity

`users`

- `id`
- `email_normalized` with a unique constraint
- `password_hash`
- `email_verified_at`
- `service_role`: `USER | SERVICE_ADMIN`
- `status`: `ACTIVE | LOCKED | WITHDRAWN`
- audit timestamps

`email_verification_tokens` and `password_reset_tokens`

- user ID
- SHA-256 token hash
- expiration and consumed timestamps
- creation metadata

`user_sessions`

- opaque session identifier hash
- user ID
- creation, last-seen, and expiration timestamps
- revoked timestamp

### 7.2 Club

`clubs`

- `id`, `name`, `category`
- persistent short introduction and detailed introduction
- activity period and activity place
- nullable cover `file_asset_id`
- audit timestamps

`club_users`

- `user_id`, `club_id`
- `club_role=OPERATOR`
- a unique constraint on the user/club pair

A user may be mapped to more than one club. The selected club ID is part of the operator request path, but the server independently verifies the matching `ClubUser(OPERATOR)` row before reading or changing data.

### 7.3 Recruitment and form

`recruitments`

- `id`, `club_id`, title, quota
- open and close timestamps
- immutable structured content blocks
- publication timestamp
- audit metadata

The displayed state is derived from time: `SCHEDULED`, `OPEN`, or `CLOSED`. The application service locks the club row and rejects a new publication when its open/close interval overlaps another published recruitment for the club.

`recruitment_stages`

- recruitment ID
- type: `DOCUMENT | DOCUMENT_RESULT | INTERVIEW | FINAL_RESULT`
- label, start/end timestamp, enabled flag

`application_forms`, `form_steps`, `form_questions`, and `question_options` store ordered, immutable form structure. Supported question types are:

- short text
- long text
- single choice
- multiple choice
- dropdown
- email
- telephone
- resume: PDF or HTTPS URL
- required consent

Questions store required state, labels, help text, placeholders, length limits, and type-specific configuration. A resume question allows exactly one of PDF or URL when answered.

A form may contain at most one resume question. This keeps the final multipart submission bounded to one PDF and matches the approved MVP flow.

### 7.4 Applications and files

`applications`

- `id`, non-guessable public ID
- internal user ID and recruitment ID
- submission timestamp
- unique constraint on `(user_id, recruitment_id)`

`application_answers`

- application and question IDs
- normalized string value or ordered JSON choice array

`resume_submissions`

- application and question IDs
- either `file_asset_id` or validated HTTPS URL
- a database check constraint requires exactly one value

`file_assets`

- UUID object key, original filename, media type, byte size, SHA-256
- purpose: `CLUB_COVER | RESUME`
- audit metadata

Account email remains reachable through the internal application/user relationship for integrity and abuse handling, but applicant APIs and operator DTOs omit it.

## 8. Frontend Architecture and Routes

A root npm workspace contains the two production apps and a shared form package. The shared package owns question-type constants, schema parsing, client validation, and the mobile form renderer. The operator live preview and applicant form import the same renderer.

The backend independently repeats all validation and remains authoritative.

### 8.1 Applicant site

The applicant site renders the same 390px product viewport on desktop and mobile.

Public routes:

- `/`
- `/login`
- `/signup`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Verified-session routes:

- `/clubs`
- `/clubs/:clubId`
- `/apply/:recruitmentId`
- `/apply/:recruitmentId/review`
- `/apply/:recruitmentId/done`

Flow:

1. The home shows `동아리` and disabled `시설예약` choices.
2. Selecting clubs while signed out sends the user to login and restores `/clubs` after success.
3. The club list includes every seeded club. Recruitment badges are derived from the active period.
4. Club detail uses the cover in the hero with category, recruitment state, name, and introduction over a contrast overlay.
5. Apply is enabled only during the open interval and only before the user has submitted.
6. Form steps are rendered from the published schema.
7. A final review screen displays all answers and the chosen PDF filename or URL.
8. A successful atomic submission navigates to the completion screen.

Browser draft storage is namespaced by user and recruitment ID. It excludes files and is cleared on successful submission.

### 8.2 Operator site

Public route:

- `/login`

Operator routes:

- `/admin/club`
- `/admin/recruitments`
- `/admin/recruitments/new/page`
- `/admin/recruitments/new/stages`
- `/admin/recruitments/new/form`
- `/admin/recruitments/new/review`
- `/admin/applicants`
- `/admin/applicants/:applicationId`

The authoring wizard keeps the existing four visible steps. The stage step retains document-result, interview, and final-result schedule configuration even though the downstream workflows are absent.

The recruitment list contains published history only because operator drafts are excluded. The applicant list filters by recruitment. When a form has a semantic name question, its answer is the display name; otherwise the UI uses `지원자 {publicId}`.

The operator header keeps the current club context. It omits the selector for one mapping and presents a compact selector for multiple mappings; changing it reloads club, recruitment, and applicant queries within the newly authorized scope.

PDF responses render in a sandboxed inline viewer sourced from the backend file endpoint. HTTPS link responses open in a new tab with `noopener,noreferrer`.

### 8.3 Removed production routes

The production route maps and navigation do not include prototype dashboard, screen index, applicant history/profile/notification, interview, result, evaluation, role management, or settings pages. Direct navigation returns the generic 404 page. Their APIs are not implemented.

## 9. API Contract

All JSON success and failure responses use one `ApiResponse<T>` class:

```json
{
  "success": true,
  "code": "OK",
  "message": "요청이 성공했습니다.",
  "data": {},
  "errors": [],
  "timestamp": "2026-08-16T12:00:00Z",
  "requestId": "01J..."
}
```

The response retains meaningful HTTP status codes. Validation errors include the form question ID or request-field name and a Korean user message.

Binary image/PDF success responses return bytes and cannot be wrapped in JSON. Errors from those endpoints still use `ApiResponse`.

### 9.1 Status and error contract

- `400 BAD_REQUEST`: malformed JSON, multipart, or token.
- `401 UNAUTHORIZED`: missing, expired, or revoked session.
- `403 FORBIDDEN`: unverified email or insufficient operator scope.
- `404 NOT_FOUND`: missing or deliberately concealed resource/route.
- `409 CONFLICT`: duplicate application or overlapping active recruitment.
- `413 PAYLOAD_TOO_LARGE`: file/request limit exceeded.
- `422 UNPROCESSABLE_ENTITY`: email domain or dynamic-form validation failure.
- `503 SERVICE_UNAVAILABLE`: required storage or mail dependency unavailable.

`@RestControllerAdvice` maps typed application exceptions to this contract. Internal exception text and stack traces are never returned to clients.

### 9.2 Endpoint groups

Identity:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/email-verifications/resend`
- `POST /api/v1/auth/email-verifications/confirm`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password-resets/request`
- `POST /api/v1/auth/password-resets/confirm`
- `GET /api/v1/auth/session`

Applicant:

- `GET /api/v1/clubs`
- `GET /api/v1/clubs/{clubId}`
- `GET /api/v1/clubs/{clubId}/cover`
- `GET /api/v1/recruitments/{recruitmentId}/form`
- `POST /api/v1/recruitments/{recruitmentId}/applications`

Operator:

- `GET /api/v1/operator/clubs`
- `GET /api/v1/operator/clubs/{clubId}`
- `PATCH /api/v1/operator/clubs/{clubId}`
- `PUT /api/v1/operator/clubs/{clubId}/cover`
- `GET /api/v1/operator/clubs/{clubId}/recruitments`
- `POST /api/v1/operator/clubs/{clubId}/recruitments`
- `GET /api/v1/operator/recruitments/{recruitmentId}/applications`
- `GET /api/v1/operator/applications/{applicationId}`
- `GET /api/v1/operator/applications/{applicationId}/resume`

The final application endpoint accepts `multipart/form-data` with one JSON payload part and at most one PDF part. An idempotency key plus the database unique constraint protects against repeated clicks and retries.

## 10. File Processing

Files are processed entirely by Spring:

1. Limit the resume file part to 10 MiB and the complete multipart request to 12 MiB so JSON and multipart framing do not reduce the allowed file size.
2. Sanitize and length-limit the original filename.
3. Validate the extension, declared content type, detected MIME type, and file signature.
4. Require `%PDF-` and detected `application/pdf` for resumes.
5. Allow JPEG, PNG, or WebP covers up to 5 MiB and verify their signatures and decodability.
6. Calculate SHA-256 while streaming to a temporary backend file or bounded stream.
7. Upload under an unguessable UUID key; never use a client filename as a key.
8. Write database metadata in the associated transaction.
9. Delete the object as compensation when database work fails; an S3 lifecycle rule clears abandoned temporary objects.
10. Return success only after the object and database reference are durable.

Cover replacement uploads the new object, commits the new reference, then removes the old object. Failed old-object cleanup is retried asynchronously and covered by lifecycle policy.

Resume content is returned only after application ownership is checked against the operator's clubs. The response uses `Content-Type: application/pdf`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`, a restrictive Content Security Policy, and no public caching.

External resume links must parse as absolute HTTPS URLs. The backend rejects non-HTTPS schemes and malformed hosts.

## 11. Authentication and Security

- The frontend immediately validates `@hansung.ac.kr` for user feedback.
- The backend independently normalizes the address and enforces the exact domain during signup and verification-mail resend. A bypassed frontend receives `422 EMAIL_DOMAIN_NOT_ALLOWED`.
- Passwords require at least 10 characters and use Argon2id.
- Verification tokens expire after 24 hours; reset tokens expire after 30 minutes.
- Token hashes, not raw tokens, are stored. Tokens are one-time use.
- Signup and password-reset request endpoints use non-enumerating responses.
- Unverified accounts cannot establish an application session.
- Authentication, signup, and mail-trigger endpoints use per-IP and per-email rate limits.
- Server sessions use opaque identifiers in host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookies.
- CSRF protection remains enabled for state-changing requests.
- Every operator use case derives permitted clubs from the authenticated user. A client-supplied path ID grants no authority; it must match a `ClubUser(OPERATOR)` row.
- `SERVICE_ADMIN` may pass that club-scope check for service-wide maintenance through the same endpoints, but no service-admin-specific page, club selector, or endpoint is shipped. Normal users always need a `ClubUser(OPERATOR)` mapping.
- Application answers, tokens, password material, external links, PDF bytes, and sensitive filenames are excluded from logs.
- Security headers include HSTS, frame restrictions except the controlled PDF viewer, content-type sniff protection, referrer policy, and a restrictive CSP.

## 12. Error and Consistency Behavior

- SES failure leaves the account unverified and permits a rate-limited resend.
- S3 failure creates no application row.
- Database failure after upload triggers immediate object compensation.
- Duplicate application retries resolve to the same successful result when the idempotency record exists; a different payload for the same key returns conflict.
- Concurrent recruitment publication locks the club and rejects overlapping intervals.
- The server validates answers against the immutable published form, including required state, lengths, choices, email/phone syntax, consent, and resume exclusivity.
- Every response carries a request ID also present in structured server logs.
- UI errors use Korean guidance and retain safe form inputs where possible.

## 13. Testing Strategy

Backend:

- Unit tests for active periods, overlapping recruitment, duplicate submission, all question types, resume exclusivity, token expiry, and club scoping.
- Spring Modulith and ArchUnit tests for module boundaries and hexagonal dependency direction.
- MockMvc tests for `ApiResponse`, HTTP status codes, binary exceptions, Korean Swagger descriptions, CSRF, and session behavior.
- Testcontainers tests with MySQL and an S3-compatible test service for Flyway, constraints, upload/compensation, and repository scoping.
- Security regression tests for direct-object reference attacks, cross-club access, frontend domain-check bypass, forged PDFs, oversized files, malformed images, and hostile URL schemes.

Frontend:

- Vitest and Testing Library tests for route guards, login restoration, authoring wizard, shared form rendering, browser drafts, live preview, PDF/link branches, and hidden routes.
- Contract fixtures shared between operator preview and applicant form to prove identical rendering and validation behavior.

End to end:

- Playwright covers signup, captured verification link, login, club browse, application submission, operator listing, answer detail, PDF inline response, and link target behavior.
- k6 smoke tests use 30 concurrent virtual users for club-list reads and controlled application submissions.
- Production smoke tests repeat the core flow after deployment without retaining test personal data.

## 14. Delivery and Operations

GitHub Actions uses AWS OIDC federation rather than long-lived access keys.

Pipeline gates:

1. Install from lockfiles.
2. Run frontend lint/tests and production builds.
3. Run backend unit, architecture, integration, and OpenAPI tests.
4. Build and scan the backend container.
5. Deploy CDK changes with an explicit production approval environment.
6. Push the backend image to ECR.
7. Use SSM to pull and restart the Compose application, with Flyway migration on startup.
8. Sync each FE artifact to its OAC-protected bucket and invalidate its CloudFront distribution.
9. Run production health and end-to-end smoke tests.

Rollback uses the previously tagged ECR image and versioned frontend artifacts. Database migrations must be backward compatible for one application version; destructive cleanup is deferred to a later release.

CloudWatch alarms cover EC2 health, CPU, memory agent metrics, EBS usage, application 5xx rate, and failed health checks. MySQL is dumped daily, encrypted, stored in S3, and retained for 14 days. A restore drill is part of release readiness before pilot launch.

## 15. Acceptance Criteria

The MVP is complete only when all of the following are true in the production domains:

- The public home works while signed out; every non-auth content route requires login.
- A non-Hansung email is rejected by both FE and backend.
- A Hansung email can sign up, verify through SES, log in, log out, and reset its password.
- A DB-seeded club appears with name/category before profile completion.
- An authorized operator can save introduction/activity data and upload a valid cover.
- The cover appears in the list and approved detail-hero location.
- A published recruitment appears only under its club and is open only during its configured interval.
- A live operator preview uses the same rendering as the applicant form.
- Every supported question type is accepted and validated by the backend.
- A required resume accepts exactly one valid PDF up to 10 MiB or one HTTPS link.
- The application is stored exactly once and cannot be edited, canceled, or submitted again.
- The operator sees only applications for mapped clubs and never receives the account email in DTOs.
- A valid PDF previews inline through Spring; S3 is never directly exposed.
- A submitted link opens in a safe new tab.
- Out-of-scope routes and APIs return 404 and are absent from navigation.
- EC2 and upload S3 have no direct public access path.
- Automated tests, backup, monitoring, deployment, rollback, and production smoke checks pass.
