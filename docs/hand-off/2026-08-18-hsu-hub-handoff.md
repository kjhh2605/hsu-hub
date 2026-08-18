# HSU Hub MVP 핸드오프

> 기준 시각: 2026-08-18 KST  
> 상태: 구현과 DNS/인증 설정 완료, Amazon SES production access 승인 대기  
> 원격 저장소: <https://github.com/kjhh2605/hsu-hub>

## 1. 한눈에 보는 현재 상태

- FE, BE, AWS 인프라 구현은 완료됐다.
- 통합 결과는 원격 `main`에 게시됐다.
- Route 53 위임, CloudFront용 ACM 인증서, SES 도메인 DKIM, custom MAIL FROM 검증은 완료됐다.
- `HsuHubDnsCertificate` 스택은 배포 완료됐다.
- `HsuHubPlatform` 스택과 실제 애플리케이션은 아직 배포하지 않았다.
- Amazon SES production access는 Support 사례 `178689454500130`에서 승인 대기 중이다.
- AWS Support가 요구한 발송량, 수신자 관리, bounce/complaint 처리, 메일 예시 등의 추가 설명은 2026-08-17에 제출했다.
- 회원가입 이메일 인증에 필요하지 않은 `alerts@hsu-hub.site` 수신 포워딩은 사용자 요청에 따라 구현하지 않았다.

## 2. 저장소와 브랜치

### 기준 커밋

| 대상 | 커밋 | 설명 |
| --- | --- | --- |
| 원격 `main` | `7c146be` | 취약한 개발 의존성 업데이트까지 포함한 최신 게시본 |
| 통합 머지 | `f9cbfd0` | `prod-v0` 구현을 `main`으로 병합 |
| 현재 워크스페이스 `prod-v0` | `c15b0f2` | 인증 보안 계약 정렬 |
| 통합 보정 | `182d027` | 지원 상태 계약, CI workspace 명령, 생성물 추적 제거 |
| 인프라 병합 | `452c61c` | AWS 인프라 통합 |
| 백엔드 병합 | `8e2e5e8` | 백엔드 MVP 통합 |
| 프런트엔드 병합 | `643494d` | 지원자/운영자 프런트엔드 통합 |

현재 문서를 작성한 워크스페이스는 다음과 같다.

```text
/Users/gnar/orca/workspaces/hsu-club/prod-v0
branch: prod-v0
HEAD: c15b0f2
```

로컬 `main`은 별도 worktree에 있다.

```text
/Users/gnar/orca/projects/hsu-club
branch: main
HEAD: 7c146be
```

`prod-v0`는 원격 `main`보다 `f9cbfd0`, `7c146be` 두 커밋 뒤에 있다. 후속 작업은 원격 `main` 또는 로컬 main worktree에서 시작하는 것을 권장한다. main worktree의 사용자 소유 미추적 디렉터리 `.archive-mobile-webview/`는 삭제하거나 덮어쓰지 않는다.

### 병렬 구현 결과

| 영역 | 구현 커밋 | 주요 범위 |
| --- | --- | --- |
| FE | `c2f0093` | 지원자 모바일 UI, 운영자 웹 UI, 인증/CSRF/API 연동 |
| BE | `3d58603` | Spring Boot API, 인증, 동아리/모집/지원서, 파일, SES 어댑터 |
| Infra | `f9653e4` | CDK, GitHub Actions, 배포/롤백/백업/복구 스크립트 |

## 3. 구현 범위

### 프런트엔드

- `mobile/`: 지원자용 React/Vite 애플리케이션
- `web/`: 운영자용 React/Vite 애플리케이션
- `packages/form/`: 동적 지원서 공용 폼 패키지
- host-only 세션 쿠키와 `__Host-XSRF-TOKEN`/`X-XSRF-TOKEN` 계약 적용
- 회원가입, 이메일 인증, 로그인, 비밀번호 재설정, 동아리 조회, 지원서 작성/제출 구현
- 운영자 모집 게시, 지원자 목록/상세, 이력서 PDF 흐름 구현

### 백엔드

- Spring Boot, Spring Security, JPA, Flyway, MySQL
- `@hansung.ac.kr`만 회원가입 허용
- Argon2id 비밀번호 해시
- 24시간 이메일 인증 토큰, 30분 비밀번호 재설정 토큰
- opaque server session과 host-only Secure/HttpOnly/SameSite 쿠키
- CSRF, 요청 ID, 공통 `ApiResponse` 오류 envelope
- IP/이메일 단위 인증·메일 발송 rate limit
- 중복 회원가입과 비밀번호 재설정의 비열거형 응답
- 동아리 운영 권한을 서버에서 재검증하는 범위 제어
- idempotency key 기반 지원서 중복 제출 방지
- SES 발신 주소: `no-reply@hsu-hub.site`

### 인프라

- CDK TypeScript
- 앱 리전: `ap-northeast-2`(서울)
- CloudFront 인증서 리전: `us-east-1`(AWS 필수 조건)
- Route 53, ACM, CloudFront, S3, VPC, NAT Gateway, private EC2/SSM, internal ALB/VPC Origin
- ECR, Secrets Manager, KMS, CloudWatch, SNS, SES
- GitHub OIDC 배포 역할과 운영 역할용 SSM 정책
- 백엔드 immutable image 배포, 실패 시 자동 롤백
- 프런트엔드 versioned release와 CloudFront invalidation
- MySQL 일일 백업, 복구 드릴, 롤백 스크립트

상세 설계는 [`../superpowers/specs/2026-08-16-hsu-hub-mvp-design.md`](../superpowers/specs/2026-08-16-hsu-hub-mvp-design.md), 운영 설명은 [`../../INFRASTRUCTURE.md`](../../INFRASTRUCTURE.md)를 참고한다.

## 4. 검증 이력

마지막 전체 통합 검증은 2026-08-17에 원격 `main`과 동일한 코드에서 수행했다.

| 검증 | 결과 |
| --- | --- |
| 프런트엔드 테스트 | 16개 통과: form 5, mobile 5, web 6 |
| 프런트엔드 빌드 | mobile/web production build 통과 |
| 백엔드 | `./gradlew clean test bootJar` 통과 |
| 인프라 테스트 | 14개 통과 |
| 인프라 TypeScript | `npm run build` 통과 |
| CDK strict synth | 실제 account/repository context로 통과 |
| 운영 스크립트 계약 | `bash ops/test.sh` 통과 |
| npm 운영 의존성 audit | 취약점 0건 |
| 전체 npm audit | `js-yaml`을 4.3.1로 갱신 후 취약점 0건 |

CDK synth에 사용한 핵심 context는 아래와 같다. `sesProductionAccessAcknowledged=true`는 오프라인 검증 및 DNS 전용 배포에서 사용됐으며, 플랫폼 배포 승인을 의미하지 않는다.

```text
account=004376454721
region=ap-northeast-2
domainName=hsu-hub.site
githubRepository=kjhh2605/hsu-hub
githubEnvironment=production
operationsPrincipalArn=arn:aws:iam::004376454721:role/HsuHubOperators
alertEmail=alerts@hsu-hub.site
```

## 5. AWS 현황

### 계정과 리전

| 항목 | 값 |
| --- | --- |
| AWS account | `004376454721` |
| 애플리케이션/SES | `ap-northeast-2` |
| CloudFront ACM | `us-east-1` |
| 운영 역할 | `arn:aws:iam::004376454721:role/HsuHubOperators` |
| CDK bootstrap | 양쪽 리전 모두 version 32, `CREATE_COMPLETE` 확인 |

작업 당시 root 로그인 세션으로 최초 부트스트랩과 스택 배포를 수행했다. 후속 작업 전 반드시 `aws login`과 `aws sts get-caller-identity`로 계정을 다시 확인한다. 2026-08-18 문서 작성 시점의 기존 CLI 로그인 세션은 만료 상태였다.

### DNS와 인증서

| 항목 | 값/상태 |
| --- | --- |
| CloudFormation stack | `HsuHubDnsCertificate` / `CREATE_COMPLETE` |
| Hosted zone ID | `Z06282063MT1D4CZ77KKA` |
| ACM certificate | `arn:aws:acm:us-east-1:004376454721:certificate/5b5598ee-8668-4bb0-9c31-e3f9cea2731f` |
| ACM status | `ISSUED` |
| SAN | `hsu-hub.site`, `admin.hsu-hub.site` |

권한 네임서버는 아래 네 개로 Gabia에 위임됐고 공개 DNS 전파까지 확인했다.

```text
ns-219.awsdns-27.com
ns-1755.awsdns-27.co.uk
ns-1070.awsdns-05.org
ns-1021.awsdns-63.net
```

### SES

| 항목 | 상태 |
| --- | --- |
| Region | `ap-northeast-2` |
| Domain identity | `hsu-hub.site`, verified |
| Easy DKIM | `SUCCESS` |
| Custom MAIL FROM | `mail.hsu-hub.site`, `SUCCESS` |
| Sender | `no-reply@hsu-hub.site` |
| Account suppression | `BOUNCE`, `COMPLAINT` 활성화 확인 |
| Production access | 승인 대기 |
| Support case | `178689454500130` |

Support 사례에는 다음 내용을 추가로 제출했다.

- 약 30명 파일럿
- 정확한 `@hansung.ac.kr` 주소만 허용
- 회원가입 인증과 사용자 요청 비밀번호 재설정만 발송
- 마케팅/대량 발송/구매 목록 없음
- 평상시 하루 10건 미만, 파일럿 최대 예상 하루 100건 미만
- IP/이메일 rate limit
- SES account-level bounce/complaint suppression
- 24시간 인증 링크와 30분 재설정 링크 예시
- verified domain, DKIM, MAIL FROM, SPF, DMARC 상태
- 공개 GitHub 저장소 링크

### 아직 없는 리소스

`HsuHubPlatform` 스택은 아직 배포하지 않았다. 따라서 다음 리소스도 아직 없다.

- 실제 CloudFront distributions와 서비스 A/AAAA alias
- VPC/NAT/EC2/internal ALB
- ECR backend repository
- application/data S3 buckets
- runtime Secrets Manager secrets
- GitHub OIDC provider와 `GitHubDeploymentRole`
- 실제 백엔드/프런트엔드 배포

## 6. 최초 플랫폼 배포 전 중요 주의사항

### 6.1 수동 SES identity와 CDK 리소스 충돌

SES production access 심사를 위해 `hsu-hub.site` identity와 필수 DNS 레코드를 AWS CLI/Route 53로 먼저 만들었다. 반면 `HsuHubPlatform`의 [`platform-stack.ts`](../../infrastructure/lib/platform-stack.ts)는 `AWS::SES::EmailIdentity`와 다음 Route 53 레코드를 새로 생성하도록 정의돼 있다.

- DKIM CNAME 3개
- `mail.hsu-hub.site` MX
- `mail.hsu-hub.site` SPF TXT

현재 상태에서 바로 `HsuHubPlatform`을 배포하면 identity 중복 또는 Route 53 record set 중복으로 실패할 수 있다.

권장 정리 절차는 다음과 같다.

1. SES production access가 실제로 승인됐는지 확인한다.
2. 현재 identity와 DNS 레코드를 읽기 전용 명령으로 다시 기록한다.
3. 수동 SES identity를 삭제한다.
4. 수동으로 만든 DKIM CNAME 3개와 `mail.hsu-hub.site` MX/TXT만 삭제한다.
5. `_dmarc.hsu-hub.site` TXT는 CDK가 만들지 않으므로 유지한다.
6. `cdk diff HsuHubPlatform`에서 삭제/교체가 없음을 다시 검토한다.
7. CDK가 SES identity와 DNS 레코드를 소유하도록 `HsuHubPlatform`을 배포한다.
8. 새 DKIM과 MAIL FROM이 `SUCCESS`로 돌아왔는지 확인한 후 애플리케이션을 배포한다.

대안은 CDK를 수정해 기존 SES identity와 레코드를 import하는 것이다. 이 경우 반드시 인프라 테스트를 먼저 추가하고, 소유권과 삭제 정책을 명확히 한 뒤 진행한다. 두 방식을 섞지 않는다.

### 6.2 `alerts@hsu-hub.site`는 현재 수신되지 않음

사용자는 `ALERT_EMAIL=alerts@hsu-hub.site`를 지정했지만 회원가입 인증에 필수가 아닌 메일 수신/포워딩 구현은 생략하도록 요청했다. 따라서 플랫폼의 SNS email subscription은 생성돼도 확인 메일을 수신하거나 구독을 확정할 수 없다.

이는 회원가입 인증 메일 발송을 막지는 않지만 운영 경보가 사람에게 전달되지 않는 launch gap이다. 출시 전 다음 중 하나를 선택한다.

- `ALERT_EMAIL`을 실제 수신 가능한 주소로 변경한다.
- `alerts@hsu-hub.site` 수신/포워딩을 별도 범위로 구현한다.

## 7. GitHub 현황

### 저장소와 환경

- Repository: `kjhh2605/hsu-hub` (public)
- Default branch: `main`
- `production` environment 생성 완료
- Required reviewer: `kjhh2605`
- Deployment branch policy: `main`만 허용
- `prevent_self_review=false`

### 변수

2026-08-18 확인 결과:

| Scope | 변수 | 값/상태 |
| --- | --- | --- |
| Repository | `AWS_ACCOUNT_ID` | `004376454721` |
| Repository | `OPERATIONS_PRINCIPAL_ARN` | `arn:aws:iam::004376454721:role/HsuHubOperators` |
| Production environment | `ALERT_EMAIL` | `alerts@hsu-hub.site` |
| Repository/Environment | `SES_PRODUCTION_ACCESS_ACKNOWLEDGED` | 미등록 |
| Repository/Environment | `AWS_DEPLOY_ROLE_ARN` | 미등록, 플랫폼 최초 배포 후 등록 |

중요: workflow의 `validate` job에는 `environment: production`이 없다. 따라서 production environment에만 있는 `ALERT_EMAIL`은 validate 단계에서 빈 값이 된다. 가장 단순한 해결은 `ALERT_EMAIL`을 repository variable에도 등록하는 것이다.

```bash
gh variable set ALERT_EMAIL \
  --repo kjhh2605/hsu-hub \
  --body 'alerts@hsu-hub.site'
```

SES 승인 후 repository variable도 설정한다.

```bash
gh variable set SES_PRODUCTION_ACCESS_ACKNOWLEDGED \
  --repo kjhh2605/hsu-hub \
  --body 'true'
```

### Actions 상태

현재 production workflow 실행 이력은 한 건이며 실패 상태다.

- Run: <https://github.com/kjhh2605/hsu-hub/actions/runs/31955293141>
- 원인: push 직후 repository variables가 job 시작보다 늦게 등록돼 CDK context가 빈 값이었다.
- 코드 테스트 실패가 원인은 아니다.
- `ALERT_EMAIL` scope와 SES 승인 변수를 정리한 뒤 재실행한다.

## 8. SES 승인 후 실행 순서

### 8.1 AWS 상태 확인

```bash
aws login
aws sts get-caller-identity
aws sesv2 get-account \
  --region ap-northeast-2 \
  --query '{ProductionAccessEnabled:ProductionAccessEnabled,EnforcementStatus:EnforcementStatus}'
aws sesv2 get-email-identity \
  --region ap-northeast-2 \
  --email-identity hsu-hub.site
```

`ProductionAccessEnabled=true`일 때만 다음 단계로 이동한다.

### 8.2 canonical main 준비

```bash
cd /Users/gnar/orca/projects/hsu-club
git status --short --branch
git fetch origin
git pull --ff-only origin main
```

`.archive-mobile-webview/` 등 사용자 소유 미추적 파일을 보존한다.

### 8.3 수동 SES 리소스와 CDK 소유권 정리

6.1의 절차에 따라 identity와 중복 DNS 레코드를 정확히 식별하고 정리한다. 삭제 전 Hosted Zone ID `Z06282063MT1D4CZ77KKA`와 record set 값을 다시 확인한다. 광범위한 삭제나 glob을 사용하지 않는다.

### 8.4 전체 재검증

```bash
npm ci
npm test
npm run build
npm audit --audit-level=high

(cd backend && ./gradlew clean test bootJar)

(cd infrastructure && npm ci && npm test && npm run build)

bash ops/test.sh
```

### 8.5 CDK diff와 최초 플랫폼 배포

```bash
cd infrastructure

npx cdk diff HsuHubPlatform \
  --lookups false \
  -c account=004376454721 \
  -c region=ap-northeast-2 \
  -c domainName=hsu-hub.site \
  -c githubRepository=kjhh2605/hsu-hub \
  -c githubEnvironment=production \
  -c operationsPrincipalArn=arn:aws:iam::004376454721:role/HsuHubOperators \
  -c alertEmail=alerts@hsu-hub.site \
  -c sesProductionAccessAcknowledged=true
```

diff에서 예상하지 않은 삭제나 replacement가 없음을 확인한 뒤 배포한다.

```bash
npx cdk deploy HsuHubPlatform \
  --require-approval never \
  --outputs-file cdk-outputs.json \
  --lookups false \
  -c account=004376454721 \
  -c region=ap-northeast-2 \
  -c domainName=hsu-hub.site \
  -c githubRepository=kjhh2605/hsu-hub \
  -c githubEnvironment=production \
  -c operationsPrincipalArn=arn:aws:iam::004376454721:role/HsuHubOperators \
  -c alertEmail=alerts@hsu-hub.site \
  -c sesProductionAccessAcknowledged=true
```

### 8.6 GitHub OIDC 배포 역할 등록

배포 출력에서 `GitHubDeploymentRoleArn`을 읽어 등록한다.

```bash
deploy_role_arn=$(aws cloudformation describe-stacks \
  --region ap-northeast-2 \
  --stack-name HsuHubPlatform \
  --query "Stacks[0].Outputs[?OutputKey=='GitHubDeploymentRoleArn'].OutputValue | [0]" \
  --output text)

gh variable set AWS_DEPLOY_ROLE_ARN \
  --repo kjhh2605/hsu-hub \
  --body "$deploy_role_arn"
```

### 8.7 production workflow 실행

```bash
gh workflow run production.yml \
  --repo kjhh2605/hsu-hub \
  --ref main \
  -f deploy=true
```

GitHub `production` environment 승인 화면에서 검토 후 승인한다. workflow는 인프라 검증, backend test/build/scan/push, SSM runtime 배포, frontend publish, CloudFront invalidation, smoke 순으로 실행된다.

### 8.8 출시 검증

최소 확인 항목:

- `https://hsu-hub.site`가 200을 반환한다.
- `https://admin.hsu-hub.site`가 200을 반환한다.
- `/actuator/health`가 CloudFront API 경유로 healthy다.
- 신규 `@hansung.ac.kr` 계정이 가입된다.
- `no-reply@hsu-hub.site`에서 인증 메일이 도착한다.
- 인증 링크가 한 번만 사용되고 24시간 만료 정책을 따른다.
- 인증 후 로그인/로그아웃이 동작한다.
- 비밀번호 재설정 메일과 30분 만료가 동작한다.
- 운영자 권한 사용자는 자신의 동아리 모집/지원서만 볼 수 있다.
- 지원서 중복 제출과 권한 우회가 차단된다.
- 최신 백업 생성과 격리 복구 드릴을 수행하고 command ID/backup key/결과를 기록한다.

## 9. 운영 명령

저장소 루트 기준:

```bash
# 배포
bash ops/deploy.sh sha-GIT_SHA

# 백엔드 롤백
bash ops/rollback.sh

# 프런트엔드 롤백
bash ops/rollback-frontend.sh sha-GIT_SHA

# 즉시 백업
bash ops/backup.sh

# 최신 백업 복구 드릴
bash ops/restore-drill.sh latest

# smoke
bash ops/smoke.sh
```

운영 명령 실행 전 항상 `AWS_PROFILE`, `AWS_REGION`, `PLATFORM_STACK`, 활성 AWS identity를 확인한다. secret 값은 명령 인자, GitHub 변수, 로그, Compose 소스에 직접 넣지 않는다.

## 10. 완료 기준

다음 항목이 모두 충족돼야 MVP 배포 완료로 간주한다.

- [ ] SES production access 승인
- [ ] 수동 SES 리소스와 CDK 소유권 충돌 해소
- [ ] GitHub repository variables 보완
- [ ] `HsuHubPlatform` `CREATE_COMPLETE`
- [ ] `GitHubDeploymentRoleArn` 등록
- [ ] production workflow 성공
- [ ] backend image와 두 frontend 배포 완료
- [ ] 두 공개 도메인과 API smoke 통과
- [ ] 실제 한성대 이메일 회원가입 인증 성공
- [ ] 비밀번호 재설정 성공
- [ ] backup/restore drill 성공 및 증적 기록
- [ ] 실제 수신 가능한 운영 경보 주소 확정 또는 포워딩 구현

