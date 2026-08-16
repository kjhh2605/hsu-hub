#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=ops/lib/common.sh
source "$repo_root/ops/lib/common.sh"
require_command aws
require_command jq

backup_key=${1:-latest}
instance_id=$(stack_output InstanceId)
bucket=$(stack_output ServiceDataBucketName)
restore_role=$(stack_output RestoreRoleArn)

credentials=$(aws_cli sts assume-role --role-arn "$restore_role" \
  --role-session-name "restore-drill-$(date -u +%Y%m%dT%H%M%SZ)" \
  --duration-seconds 3600 --output json)
access_key=$(jq -er '.Credentials.AccessKeyId' <<<"$credentials")
secret_key=$(jq -er '.Credentials.SecretAccessKey' <<<"$credentials")
session_token=$(jq -er '.Credentials.SessionToken' <<<"$credentials")

if [[ "$backup_key" == latest ]]; then
  # The single-quoted expression is JMESPath, not shell interpolation.
  # shellcheck disable=SC2016
  backup_key=$(AWS_ACCESS_KEY_ID=$access_key AWS_SECRET_ACCESS_KEY=$secret_key AWS_SESSION_TOKEN=$session_token \
    aws --region "$AWS_REGION" s3api list-objects-v2 --bucket "$bucket" --prefix backups/mysql/ \
    --query 'reverse(sort_by(Contents[?!ends_with(Key, `.sha256`)],&LastModified))[0].Key' --output text)
fi
[[ "$backup_key" == backups/mysql/*.sql.gz ]] || {
  echo "invalid or missing backup key: $backup_key" >&2
  exit 2
}

presigned_url=$(AWS_ACCESS_KEY_ID=$access_key AWS_SECRET_ACCESS_KEY=$secret_key AWS_SESSION_TOKEN=$session_token \
  aws --region "$AWS_REGION" s3 presign "s3://${bucket}/${backup_key}" --expires-in 900)
url_b64=$(printf '%s' "$presigned_url" | base64 | tr -d '\n')
payload=$(mktemp)
trap 'rm -f "$payload"' EXIT
cat > "$payload" <<EOF
set -euo pipefail
archive=\$(mktemp /tmp/hsu-hub-restore-drill-XXXXXX.sql.gz)
volume=hsu-hub-restore-drill-\$(date +%s)
container=hsu-hub-restore-drill
password=restore-drill-\$(date +%s)-\$RANDOM
cleanup() { docker rm -f "\$container" >/dev/null 2>&1 || true; docker volume rm "\$volume" >/dev/null 2>&1 || true; rm -f "\$archive"; }
trap cleanup EXIT
url=\$(printf '%s' '$url_b64' | base64 -d)
curl --fail --location --silent --show-error "\$url" --output "\$archive"
gzip -t "\$archive"
docker volume create "\$volume" >/dev/null
docker run -d --name "\$container" -e MYSQL_ROOT_PASSWORD="\$password" -v "\$volume:/var/lib/mysql" mysql:8.4.6 >/dev/null
for _ in \$(seq 1 30); do docker exec "\$container" mysqladmin ping -uroot -p"\$password" --silent && break; sleep 3; done
docker exec "\$container" mysqladmin ping -uroot -p"\$password" --silent
gzip -dc "\$archive" | docker exec -i "\$container" mysql -uroot -p"\$password"
table_count=\$(docker exec "\$container" mysql -N -uroot -p"\$password" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='hsuhub'")
test "\$table_count" -gt 0
echo "restore drill passed for $backup_key with \$table_count tables"
EOF
ssm_run_payload "$instance_id" "$payload"
