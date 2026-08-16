#!/usr/bin/env bash
set -euo pipefail

install_dir=/opt/hsu-hub
# shellcheck disable=SC1091
source "$install_dir/deployment.env"
runtime_env="$install_dir/runtime.env"
compose_file="$install_dir/docker-compose.yml"
test -f "$runtime_env"

credentials=$(aws --region "$AWS_REGION" sts assume-role \
  --role-arn "$BACKUP_ROLE_ARN" \
  --role-session-name "mysql-backup-$(date -u +%Y%m%dT%H%M%SZ)" \
  --duration-seconds 3600 \
  --output json)
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN
AWS_ACCESS_KEY_ID=$(jq -er '.Credentials.AccessKeyId' <<<"$credentials")
AWS_SECRET_ACCESS_KEY=$(jq -er '.Credentials.SecretAccessKey' <<<"$credentials")
AWS_SESSION_TOKEN=$(jq -er '.Credentials.SessionToken' <<<"$credentials")

timestamp=$(date -u +%Y-%m-%dT%H-%M-%SZ)
backup_file=$(mktemp "/tmp/hsu-hub-${timestamp}-XXXXXX.sql.gz")
checksum_file="${backup_file}.sha256"
trap 'rm -f "$backup_file" "$checksum_file"' EXIT

docker compose --env-file "$runtime_env" -f "$compose_file" exec -T db \
  sh -c 'exec mysqldump --single-transaction --routines --events --databases "$MYSQL_DATABASE" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD"' |
  gzip -9 > "$backup_file"
gzip -t "$backup_file"
sha256sum "$backup_file" | awk '{print $1}' > "$checksum_file"

object_key="backups/mysql/${timestamp}.sql.gz"
aws --region "$AWS_REGION" s3 cp "$backup_file" "s3://${SERVICE_DATA_BUCKET}/${object_key}" \
  --sse AES256 --only-show-errors
aws --region "$AWS_REGION" s3 cp "$checksum_file" "s3://${SERVICE_DATA_BUCKET}/${object_key}.sha256" \
  --sse AES256 --only-show-errors
echo "$object_key"
