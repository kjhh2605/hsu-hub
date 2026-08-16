#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=ops/lib/common.sh
source "$repo_root/ops/lib/common.sh"
require_command aws
require_command jq

image_tag=${1:?usage: ops/deploy.sh IMAGE_TAG}
[[ "$image_tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || {
  echo 'invalid ECR image tag' >&2
  exit 2
}

instance_id=$(stack_output InstanceId)
repository_uri=$(stack_output BackendRepositoryUri)
repository_name=${repository_uri#*/}
aws_cli ecr describe-images --repository-name "$repository_name" \
  --image-ids "imageTag=$image_tag" >/dev/null

deployment_env=$(mktemp)
payload=$(mktemp)
trap 'rm -f "$deployment_env" "$payload"' EXIT
domain_name=${DOMAIN_NAME:-hsu-hub.site}
cat > "$deployment_env" <<EOF
AWS_REGION=$AWS_REGION
REPOSITORY_URI=$repository_uri
DATABASE_SECRET_ARN=$(stack_output DatabaseSecretArn)
SESSION_SECRET_ARN=$(stack_output SessionSecretArn)
SERVICE_DATA_BUCKET=$(stack_output ServiceDataBucketName)
BACKUP_ROLE_ARN=$(stack_output BackupRoleArn)
FROM_EMAIL=no-reply@$domain_name
EOF

compose_b64=$(encode_file "$repo_root/deploy/docker-compose.yml")
runtime_deploy_b64=$(encode_file "$repo_root/deploy/runtime-deploy.sh")
runtime_backup_b64=$(encode_file "$repo_root/deploy/runtime-backup.sh")
service_b64=$(encode_file "$repo_root/deploy/hsu-hub-backup.service")
timer_b64=$(encode_file "$repo_root/deploy/hsu-hub-backup.timer")
env_b64=$(encode_file "$deployment_env")

cat > "$payload" <<EOF
set -euo pipefail
install -d -m 750 /opt/hsu-hub /opt/hsu-hub/logs
chown 10001:10001 /opt/hsu-hub/logs
printf '%s' '$compose_b64' | base64 -d > /opt/hsu-hub/docker-compose.yml
printf '%s' '$runtime_deploy_b64' | base64 -d > /opt/hsu-hub/runtime-deploy.sh
printf '%s' '$runtime_backup_b64' | base64 -d > /opt/hsu-hub/runtime-backup.sh
printf '%s' '$env_b64' | base64 -d > /opt/hsu-hub/deployment.env
printf '%s' '$service_b64' | base64 -d > /etc/systemd/system/hsu-hub-backup.service
printf '%s' '$timer_b64' | base64 -d > /etc/systemd/system/hsu-hub-backup.timer
chmod 600 /opt/hsu-hub/deployment.env
chmod 750 /opt/hsu-hub/runtime-deploy.sh /opt/hsu-hub/runtime-backup.sh
systemctl daemon-reload
systemctl enable --now hsu-hub-backup.timer
/opt/hsu-hub/runtime-deploy.sh '$repository_uri:$image_tag'
EOF

ssm_run_payload "$instance_id" "$payload"
