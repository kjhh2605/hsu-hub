# HSU Hub production infrastructure

This repository defines the production pilot in TypeScript CDK without performing an AWS deployment. It creates an authoritative Route 53 zone and CloudFront certificate in `us-east-1`, then deploys the application platform in `ap-northeast-2`: a two-AZ VPC with one NAT Gateway, private EC2/SSM compute, encrypted EBS, an internal ALB exposed only through two frontend-specific CloudFront VPC Origins, ECR, three private S3 buckets, Secrets Manager, CloudWatch, alarms, and GitHub OIDC roles.

The third S3 bucket is intentionally partitioned by prefix. The backend role can access only `uploads/*` through the S3 gateway endpoint, the backup role is write-only to `backups/*`, and the restore role is read-only to `backups/*`. S3 data-access logs use `access-logs/s3/*`; backups and their noncurrent versions expire after 14 days. CloudFront and ALB request access logs are intentionally disabled because Kakao returns one-time OAuth codes and state in the callback query string, which both services otherwise record verbatim. CloudWatch metrics, rejected VPC flow logs, and query-free application/system logs remain enabled.

## Required context and external prerequisites

No value below is guessed by CDK. Supply each required context value to `cdk synth`, `cdk diff`, and `cdk deploy`:

| Context | Requirement |
| --- | --- |
| `account` | 12-digit production AWS account ID |
| `region` | `ap-northeast-2` for the approved pilot |
| `domainName` | Registrable domain, approved as `hsu-hub.site` |
| `githubRepository` | Exact `owner/repository` allowed by OIDC |
| `githubEnvironment` | Protected environment, approved as `production` |
| `operationsPrincipalArn` | Pre-existing IAM operations role in the same account; CDK attaches scoped SSM access and trusts it for restore drills |
| `alertEmail` | Required monitored address; the SNS subscription must be confirmed |
| `kakaoSecretArn` | Complete ARN of the pre-created Kakao credential secret in the production account and `ap-northeast-2` |

Before the first deploy:

1. Own `hsu-hub.site` and be able to update its registrar nameservers. The new hosted zone output is not effective until those nameservers are delegated.
2. Create the operations role named by `operationsPrincipalArn`. Its human operators should use short-term credentials. AWS CLI `2.32.0` or later supports `aws login`; confirm the intended account with `aws sts get-caller-identity` before any deployment.
3. Bootstrap both regions with the current CDK CLI. Apply the organization's permissions boundary when required:

   ```bash
   npx cdk bootstrap aws://ACCOUNT_ID/us-east-1
   npx cdk bootstrap aws://ACCOUNT_ID/ap-northeast-2
   ```

4. Make a reviewed one-time deployment with an authorized bootstrap identity. This creates the GitHub OIDC provider and deployment role. Do not attempt to use the pipeline before this step because the pipeline role does not yet exist.
5. Delegate the registrar nameservers, wait for ACM DNS validation, and verify both CloudFront aliases.
6. In Kakao Developers, create the production application, use its REST API key as `clientId`, activate Kakao Login and the Client Secret, and register these redirect URIs:

   - `https://hsu-hub.site/api/v1/auth/kakao/callback`
   - `https://admin.hsu-hub.site/api/v1/auth/kakao/callback`
   - `http://localhost:5173/api/v1/auth/kakao/callback` for the applicant local reverse proxy
   - `http://localhost:5174/api/v1/auth/kakao/callback` for the operator local reverse proxy

7. Configure `account_email` as required consent and enable provision after collecting the email through Kakao Account. Complete any Kakao business-app or personal-information review required before production email consent is available.
8. Publish a privacy policy that states why the Kakao service user ID and email are collected and how long each value is retained.
9. Pre-create the Kakao credential secret in the production account and `ap-northeast-2`. Its JSON value must contain exactly the runtime keys shown below; CDK imports the secret by complete ARN, creates no value, and grants the instance role read access only to that secret:

   ```json
   {
     "clientId": "KAKAO_REST_API_KEY",
     "clientSecret": "KAKAO_CLIENT_SECRET"
   }
   ```

10. In the GitHub `production` environment, require human approval and set `AWS_DEPLOY_ROLE_ARN`, `AWS_ACCOUNT_ID`, `OPERATIONS_PRINCIPAL_ARN`, `ALERT_EMAIL`, and `KAKAO_SECRET_ARN`. `KAKAO_SECRET_ARN` is the complete ARN from the previous step, not either credential value. Protect `main`; the OIDC trust accepts only `repo:OWNER/REPOSITORY:environment:production`.
11. Confirm the backend image runs as UID `10001`, exposes port `8080`, writes `/var/log/hsu-hub/application.log`, provides `/actuator/health`, and accepts the environment variables in `deploy/docker-compose.yml`.
12. Before the first Kakao-only release, verify `SELECT COUNT(*) FROM users` is `0` and take the normal pre-deploy backup. Migration V5 deliberately aborts before destructive DDL when any legacy user exists; it is an empty, not-yet-deployed platform cutover and has no automatic rollback path. If the count is nonzero, stop and design an explicit account migration instead of bypassing the guard.

## Safe validation and first deployment

Use a real account ID and operations role ARN even for offline synthesis; no AWS call is made by `--lookups false`:

```bash
cd infrastructure
npm ci
npm test
npm run build
npm run synth -- --lookups false \
  -c account=ACCOUNT_ID \
  -c region=ap-northeast-2 \
  -c domainName=hsu-hub.site \
  -c githubRepository=OWNER/REPOSITORY \
  -c githubEnvironment=production \
  -c operationsPrincipalArn=arn:aws:iam::ACCOUNT_ID:role/HsuHubOperators \
  -c alertEmail=alerts@example.com \
  -c kakaoSecretArn=arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:/hsu-hub/production/kakao-AbCdEf
```

Before an authorized production change, run `cdk diff` for both stacks and review replacements. Stateful resources use retention policies and both stacks have CloudFormation termination protection. The ALB and EC2 instance also use deletion/termination protection, so an intentional teardown requires a separately approved protection change.

The production workflow is manual-only for mutation. Its GitHub environment approval gate runs CDK, backend tests, an immutable ECR build, a HIGH/CRITICAL Trivy image scan, SSM Compose deployment, versioned frontend sync/invalidation, and smoke hooks. Pull requests run only tests, TypeScript compilation, strict synthesis, cdk-nag, HIGH/CRITICAL Trivy configuration scanning, and shell/Compose contract checks. `infrastructure/.trivyignore` contains only the four architecture exceptions explained in the risk list; adding an exception requires security review.

## Runtime operations

All commands honor `AWS_PROFILE`, `AWS_REGION`, and `PLATFORM_STACK`. Verify the active identity before running them.

- Deploy an ECR tag already scanned and pushed: `bash ops/deploy.sh sha-GIT_SHA`
- Roll the backend back to the previous healthy immutable image: `bash ops/rollback.sh`
- Create an on-demand encrypted dump: `bash ops/backup.sh`
- Prove the latest dump restores into an isolated disposable MySQL volume: `bash ops/restore-drill.sh latest`
- Restore a specific dump in the drill: `bash ops/restore-drill.sh backups/mysql/YYYY-MM-DDTHH-MM-SSZ.sql.gz`
- Roll both frontend roots back from a retained release prefix: `bash ops/rollback-frontend.sh sha-GIT_SHA`
- Run public and API smoke hooks: `bash ops/smoke.sh`
- Open an administrative shell: `aws ssm start-session --target INSTANCE_ID`

`runtime-deploy.sh` automatically restores the previous image if the new backend fails its health check. Successful deployments retain `current-image` and `previous-image` on the host. Flyway must remain backward compatible with one prior image; destructive schema cleanup belongs in a later release.

The systemd timer runs the MySQL dump daily at 18:00 UTC (03:00 KST) with up to 15 minutes of jitter. A release-readiness owner must run `ops/restore-drill.sh` before pilot launch and after any material schema or backup-script change. Record the SSM command ID, backup key, table count, duration, and result in the release evidence. A real production overwrite is deliberately not automated: approve maintenance, take a fresh backup, stop the backend, validate the chosen dump in the drill, restore MySQL under the operations incident procedure, restart the previous compatible image, and run smoke plus application data-integrity checks.

Database, session, and Kakao credential rotation is coordinated rather than automatic. During maintenance, update the appropriate Secrets Manager value, redeploy the application so the root-only runtime environment is refreshed, verify health and Kakao authentication, and invalidate old HSU Hub sessions where appropriate. Database rotation must update MySQL credentials in the same window; Kakao Client Secret rotation must be coordinated with the Kakao developer application. Keep the existing secret ARN when rotating its value. Never place secret values in SSM commands, GitHub variables, logs, or Compose source files.

## Monitoring and risks

CloudWatch receives rejected VPC flow logs, application logs, cloud-init logs, EC2 CPU/status metrics, CloudWatch Agent memory/EBS usage, ALB 5xx, and unhealthy-target metrics. The operational alarm topic is KMS encrypted and retains its SNS email subscription; it is unrelated to removed authentication email. Confirm the required alert subscription and test every alarm before launch.

Accepted or pre-launch risks:

- EC2 and MySQL share one instance and one failure domain; a host or AZ failure requires restore and is not highly available.
- One NAT Gateway reduces pilot cost but is an AZ dependency and recurring cost center.
- Private-instance internet egress is restricted to TCP 443 through that NAT; DNS is restricted to the VPC resolver and time sync to the Amazon link-local service. The HTTPS destination cannot be IP-allowlisted because AWS/ECR endpoints and OS package mirrors change; add interface endpoints and an egress proxy for stronger destination control.
- The two distributions have no WAF in this 30-user MVP. Private origin, application rate limits, security headers, and strict authentication are baseline controls; reassess WAF before wider launch.
- The CloudFront VPC Origin service ENIs use HTTP to the internal-only ALB. Viewer traffic is TLS 1.2+, and this unencrypted hop never leaves the private VPC; use private-origin TLS before the threat model requires in-VPC encryption.
- All three buckets use SSE-S3 because the centralized bucket receives S3 server-access logs with broad service compatibility. Move application data/backups to a dedicated SSE-KMS bucket when the fixed three-bucket constraint is lifted.
- The centralized third bucket contains data, backups, and S3 access logs under isolated prefixes. Separate logging and backup buckets are the first scale/compliance improvement.
- CloudFront and ALB request access logs stay disabled while the OAuth callback transports `code` and `state` in its query string. If request logging is reintroduced, use field-selectable logging that excludes query strings and Referer, and add a release assertion preventing those fields.
- Restore drills use a 15-minute presigned URL transported as base64 through SSM command history. It expires quickly but should be treated as sensitive operational metadata.
- CloudFront VPC Origin, NAT Gateway, CloudWatch ingestion, retained EBS/S3 versions, and cross-region custom resources incur cost even at low traffic. Configure budget alarms outside this stack before deployment.
- OAC and VPC Origin support must be available in the target account/region, and both regions must remain CDK-bootstrapped.
