#!/usr/bin/env bash
set -euo pipefail

install_dir=/opt/hsu-hub
deployment_env="$install_dir/deployment.env"
runtime_env="$install_dir/runtime.env"
compose_file="$install_dir/docker-compose.yml"
requested_image=${1:?usage: runtime-deploy.sh ECR_IMAGE}

test -f "$deployment_env"
# shellcheck disable=SC1090
source "$deployment_env"

case "$requested_image" in
  "${REPOSITORY_URI}":*) ;;
  *) echo "image must belong to ${REPOSITORY_URI}" >&2; exit 2 ;;
esac

database_json=$(aws --region "$AWS_REGION" secretsmanager get-secret-value \
  --secret-id "$DATABASE_SECRET_ARN" --query SecretString --output text)
database_username=$(jq -er '.username' <<<"$database_json")
database_password=$(jq -er '.password' <<<"$database_json")
session_secret=$(aws --region "$AWS_REGION" secretsmanager get-secret-value \
  --secret-id "$SESSION_SECRET_ARN" --query SecretString --output text)
kakao_json=$(aws --region "$AWS_REGION" secretsmanager get-secret-value \
  --secret-id "$KAKAO_SECRET_ARN" --query SecretString --output text)
kakao_client_id=$(jq -er '.clientId' <<<"$kakao_json")
kakao_client_secret=$(jq -er '.clientSecret' <<<"$kakao_json")

write_runtime_env() {
  local image=$1
  umask 077
  {
    printf 'ECR_IMAGE=%s\n' "$image"
    printf 'DB_USERNAME=%s\n' "$database_username"
    printf 'DB_PASSWORD=%s\n' "$database_password"
    printf 'SESSION_SECRET=%s\n' "$session_secret"
    printf 'AWS_REGION=%s\n' "$AWS_REGION"
    printf 'S3_BUCKET=%s\n' "$SERVICE_DATA_BUCKET"
    printf 'KAKAO_CLIENT_ID=%s\n' "$kakao_client_id"
    printf 'KAKAO_CLIENT_SECRET=%s\n' "$kakao_client_secret"
    printf 'KAKAO_APPLICANT_ORIGIN=%s\n' "$KAKAO_APPLICANT_ORIGIN"
    printf 'KAKAO_ADMIN_ORIGIN=%s\n' "$KAKAO_ADMIN_ORIGIN"
  } > "$runtime_env"
}

registry=${REPOSITORY_URI%%/*}
aws --region "$AWS_REGION" ecr get-login-password |
  docker login --username AWS --password-stdin "$registry"

current_image=''
test ! -f "$install_dir/current-image" || current_image=$(<"$install_dir/current-image")
write_runtime_env "$requested_image"

docker compose --env-file "$runtime_env" -f "$compose_file" config --quiet
docker compose --env-file "$runtime_env" -f "$compose_file" pull
docker compose --env-file "$runtime_env" -f "$compose_file" up -d --remove-orphans

healthy=false
for _ in $(seq 1 36); do
  if curl --silent --fail --max-time 3 http://127.0.0.1:8080/actuator/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done

if [[ "$healthy" != true ]]; then
  docker compose --env-file "$runtime_env" -f "$compose_file" logs --tail=200 backend >&2 || true
  if [[ -n "$current_image" && "$current_image" != "$requested_image" ]]; then
    echo "new release failed health check; restoring $current_image" >&2
    write_runtime_env "$current_image"
    docker compose --env-file "$runtime_env" -f "$compose_file" up -d --remove-orphans
  fi
  exit 1
fi

if [[ -n "$current_image" && "$current_image" != "$requested_image" ]]; then
  printf '%s\n' "$current_image" > "$install_dir/previous-image"
fi
printf '%s\n' "$requested_image" > "$install_dir/current-image"
chmod 600 "$runtime_env" "$install_dir/current-image"
test ! -f "$install_dir/previous-image" || chmod 600 "$install_dir/previous-image"
docker image prune --force --filter 'until=168h' >/dev/null
echo "deployed $requested_image"
