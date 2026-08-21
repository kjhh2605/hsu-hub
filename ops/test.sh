#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

required_files=(
  deploy/docker-compose.yml
  deploy/runtime-deploy.sh
  deploy/runtime-backup.sh
  deploy/hsu-hub-backup.service
  deploy/hsu-hub-backup.timer
  ops/lib/common.sh
  ops/deploy.sh
  ops/rollback.sh
  ops/backup.sh
  ops/restore-drill.sh
  ops/rollback-frontend.sh
  ops/smoke.sh
)

for relative_path in "${required_files[@]}"; do
  test -f "$repo_root/$relative_path" || {
    echo "missing required operations file: $relative_path" >&2
    exit 1
  }
done

while IFS= read -r script; do
  bash -n "$script"
done < <(find "$repo_root/deploy" "$repo_root/ops" -type f -name '*.sh' -print)

grep -q 'read_only: true' "$repo_root/deploy/docker-compose.yml"
grep -q 'no-new-privileges:true' "$repo_root/deploy/docker-compose.yml"
grep -q 'assume-role' "$repo_root/deploy/runtime-backup.sh"
grep -q 'image scan' "$repo_root/.github/workflows/production.yml"
grep -q -- '--timeout 20m' "$repo_root/.github/workflows/production.yml"
grep -q '(cd backend && ./gradlew test bootJar)' "$repo_root/.github/workflows/production.yml"
grep -q 'reusing existing immutable backend image' "$repo_root/.github/workflows/production.yml"
grep -q 'apk upgrade --no-cache' "$repo_root/backend/Dockerfile"
grep -q 'docker-compose-linux-x86_64' "$repo_root/ops/deploy.sh"
grep -q 'v5.5.0' "$repo_root/ops/deploy.sh"
grep -q 'c57ab918abd5b05ca7e7d0f275875dd1330a695074f309dc9eab1b49efafcd4b' "$repo_root/ops/deploy.sh"
grep -q 'sha256sum -c' "$repo_root/ops/deploy.sh"
grep -q 'SSM_COMMAND_TIMEOUT_SECONDS' "$repo_root/ops/lib/common.sh"
if grep -q 'ssm wait command-executed' "$repo_root/ops/lib/common.sh"; then
  echo 'SSM command helper still uses the short AWS CLI waiter' >&2
  exit 1
fi
grep -q 'KAKAO_SECRET_ARN' "$repo_root/ops/deploy.sh"
grep -q 'KAKAO_SECRET_ARN' "$repo_root/deploy/runtime-deploy.sh"
grep -q 'KAKAO_SECRET_ARN' "$repo_root/.github/workflows/production.yml"
grep -q 'HSU_KAKAO_CLIENT_ID' "$repo_root/deploy/docker-compose.yml"
grep -q 'HSU_KAKAO_CLIENT_SECRET' "$repo_root/deploy/docker-compose.yml"
grep -q 'HSU_KAKAO_APPLICANT_ORIGIN' "$repo_root/deploy/docker-compose.yml"
grep -q 'HSU_KAKAO_ADMIN_ORIGIN' "$repo_root/deploy/docker-compose.yml"
grep -Eq 'SPRING_PROFILES_ACTIVE:[[:space:]]+prod$' "$repo_root/deploy/docker-compose.yml"
grep -q 'HSU_STORAGE_BUCKET:' "$repo_root/deploy/docker-compose.yml"
if grep -q 'HSU_HUB_S3_BUCKET:' "$repo_root/deploy/docker-compose.yml"; then
  echo 'storage bucket environment variable does not match hsu.storage.bucket' >&2
  exit 1
fi

stale_auth_mail_pattern='FROM_''EMAIL|SES_PRODUCTION_ACCESS_''ACKNOWLEDGED|sesProductionAccess''Acknowledged'
if grep -R -nE "$stale_auth_mail_pattern" \
  "$repo_root/infrastructure" \
  "$repo_root/deploy" \
  "$repo_root/ops" \
  "$repo_root/.github/workflows/production.yml" \
  "$repo_root/INFRASTRUCTURE.md"; then
  echo 'stale authentication-mail deployment setting found' >&2
  exit 1
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  ECR_IMAGE=example.invalid/hsu-hub/backend:test \
  DB_USERNAME=hsuhub \
  DB_PASSWORD=testpassword \
  SESSION_SECRET=testsession \
  AWS_REGION=ap-northeast-2 \
  S3_BUCKET=test-bucket \
  KAKAO_CLIENT_ID=test-client-id \
  KAKAO_CLIENT_SECRET=test-client-secret \
  KAKAO_APPLICANT_ORIGIN=https://hsu-hub.site \
  KAKAO_ADMIN_ORIGIN=https://admin.hsu-hub.site \
    docker compose -f "$repo_root/deploy/docker-compose.yml" config --quiet
fi

echo 'operations contract checks passed'
