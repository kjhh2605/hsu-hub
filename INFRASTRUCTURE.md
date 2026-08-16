# HSU Hub production infrastructure

This repository defines the production pilot in TypeScript CDK without performing an AWS deployment. It creates an authoritative Route 53 zone and CloudFront certificate in `us-east-1`, then deploys the application platform in `ap-northeast-2`: a two-AZ VPC with one NAT Gateway, private EC2/SSM compute, encrypted EBS, an internal ALB exposed only through one CloudFront VPC Origin, ECR, three private S3 buckets, SES, Secrets Manager, CloudWatch, alarms, and GitHub OIDC roles.

The third S3 bucket is intentionally partitioned by prefix. The backend role can access only `uploads/*` through the S3 gateway endpoint, the backup role is write-only to `backups/*`, and the restore role is read-only to `backups/*`. Access logs use `access-logs/*`; backups and their noncurrent versions expire after 14 days.

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
| `sesProductionAccessAcknowledged` | Must be `true`, but only after SES production access is approved in `ap-northeast-2` |

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
6. Request SES production access in `ap-northeast-2`, verify that the domain identity is healthy, and confirm that `no-reply@hsu-hub.site` is authorized. CDK cannot approve SES production access.
7. In the GitHub `production` environment, require human approval and set `AWS_DEPLOY_ROLE_ARN`, `AWS_ACCOUNT_ID`, `OPERATIONS_PRINCIPAL_ARN`, `ALERT_EMAIL`, and `SES_PRODUCTION_ACCESS_ACKNOWLEDGED=true`. Protect `main`; the OIDC trust accepts only `repo:OWNER/REPOSITORY:environment:production`.
8. Confirm the backend image runs as UID `10001`, exposes port `8080`, writes `/var/log/hsu-hub/application.log`, provides `/actuator/health`, and accepts the environment variables in `deploy/docker-compose.yml`.

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
  -c sesProductionAccessAcknowledged=true
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

Database and session secret rotation is coordinated rather than automatic. During maintenance, create the replacement value, update Secrets Manager, redeploy the application, verify health and authentication, and invalidate old sessions where appropriate. Database rotation must update MySQL credentials in the same window. Never place secret values in SSM commands, GitHub variables, logs, or Compose source files.

## Monitoring and risks

CloudWatch receives rejected VPC flow logs, application logs, cloud-init logs, EC2 CPU/status metrics, CloudWatch Agent memory/EBS usage, ALB 5xx, and unhealthy-target metrics. The alarm topic is KMS encrypted. Confirm the required alert subscription and test every alarm before launch.

Accepted or pre-launch risks:

- EC2 and MySQL share one instance and one failure domain; a host or AZ failure requires restore and is not highly available.
- One NAT Gateway reduces pilot cost but is an AZ dependency and recurring cost center.
- Private-instance internet egress is restricted to TCP 443 through that NAT; DNS is restricted to the VPC resolver and time sync to the Amazon link-local service. The HTTPS destination cannot be IP-allowlisted because AWS/ECR endpoints and OS package mirrors change; add interface endpoints and an egress proxy for stronger destination control.
- The two distributions have no WAF in this 30-user MVP. Private origin, application rate limits, security headers, and strict authentication are baseline controls; reassess WAF before wider launch.
- The CloudFront VPC Origin service ENIs use HTTP to the internal-only ALB. Viewer traffic is TLS 1.2+, and this unencrypted hop never leaves the private VPC; use private-origin TLS before the threat model requires in-VPC encryption.
- All three buckets use SSE-S3 because the centralized bucket receives S3, ALB, and CloudFront access logs with broad service compatibility. Move application data/backups to a dedicated SSE-KMS bucket when the fixed three-bucket constraint is lifted.
- The centralized third bucket contains data, backups, and access logs under isolated prefixes. Separate logging and backup buckets are the first scale/compliance improvement.
- Restore drills use a 15-minute presigned URL transported as base64 through SSM command history. It expires quickly but should be treated as sensitive operational metadata.
- CloudFront VPC Origin, NAT Gateway, CloudWatch ingestion, retained EBS/S3 versions, and cross-region custom resources incur cost even at low traffic. Configure budget alarms outside this stack before deployment.
- OAC and VPC Origin support must be available in the target account/region, and both regions must remain CDK-bootstrapped.
