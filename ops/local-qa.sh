#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
backend_dir="$repo_root/backend"

mysql_container=${HSU_QA_MYSQL_CONTAINER:-hsu-hub-local-qa-db-13306}
mysql_host_port=${HSU_QA_MYSQL_PORT:-13306}
db_name=${HSU_QA_DB_NAME:-hsu_hub}
db_user=${HSU_QA_DB_USER:-hsu_hub}
db_password=${HSU_QA_DB_PASSWORD:-hsu_hub_local}
mysql_image=${HSU_QA_MYSQL_IMAGE:-mysql:8.4}
qa_kakao_user_id=${HSU_QA_KAKAO_USER_ID:-9000000001}
qa_email=${HSU_QA_EMAIL:-operator@local.test}
qa_session=${HSU_QA_SESSION:-local-qa-session}
qa_club_id=${HSU_QA_CLUB_ID:-}

backend_pid=''
frontend_pid=''

usage() {
  cat <<'EOF'
Usage: ops/local-qa.sh

Starts the local MySQL container, Spring backend, and operator Vite app,
then seeds one OPERATOR user/session for browser QA.

Optional environment variables:
  HSU_QA_CLUB_ID          Club id to map (default: first seeded club)
  HSU_QA_MYSQL_CONTAINER  MySQL container name
  HSU_QA_MYSQL_PORT       Host port for MySQL (default: 13306)
  HSU_QA_SESSION          Browser session value (default: local-qa-session)
  HSU_KAKAO_CLIENT_ID     Kakao client id (dummy value is enough for seeded QA)
  HSU_KAKAO_CLIENT_SECRET Kakao client secret (dummy value is enough for seeded QA)
EOF
}

if [[ ${1:-} == '--help' || ${1:-} == '-h' ]]; then
  usage
  exit 0
fi

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "required command not found: $1" >&2
    exit 1
  }
}

require_command docker
require_command curl
require_command npm
require_command lsof
require_command pgrep

kill_process_tree() {
  local process_pid=$1
  local child_pid
  for child_pid in $(pgrep -P "$process_pid" 2>/dev/null || true); do
    kill_process_tree "$child_pid"
  done
  kill "$process_pid" 2>/dev/null || true
}

cleanup() {
  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill_process_tree "$frontend_pid"
  fi
  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill_process_tree "$backend_pid"
  fi
}
trap cleanup EXIT INT TERM

if lsof -nP -iTCP:8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Port 8080 is already in use. Stop the existing backend and run this script again." >&2
  exit 1
fi

if docker inspect "$mysql_container" >/dev/null 2>&1; then
  docker start "$mysql_container" >/dev/null 2>&1 || true
  published_port=$(docker port "$mysql_container" 3306/tcp 2>/dev/null || true)
  if [[ "$published_port" != *":$mysql_host_port"* ]]; then
    echo "MySQL container '$mysql_container' is not published on host port $mysql_host_port." >&2
    echo "Use a new HSU_QA_MYSQL_CONTAINER name or remove only that local QA container." >&2
    exit 1
  fi
else
  docker run --name "$mysql_container" \
    -e MYSQL_DATABASE="$db_name" \
    -e MYSQL_USER="$db_user" \
    -e MYSQL_PASSWORD="$db_password" \
    -e MYSQL_RANDOM_ROOT_PASSWORD=yes \
    -p "$mysql_host_port:3306" \
    -d "$mysql_image" >/dev/null
fi

echo "Waiting for MySQL container: $mysql_container"
mysql_ready=false
for _ in $(seq 1 60); do
  if docker exec -e MYSQL_PWD="$db_password" "$mysql_container" \
    mysqladmin ping -h 127.0.0.1 -u"$db_user" --silent >/dev/null 2>&1; then
    mysql_ready=true
    break
  fi
  sleep 2
done

if [[ "$mysql_ready" != true ]]; then
  echo "MySQL did not become ready within 120 seconds." >&2
  exit 1
fi

if [[ ! -x "$repo_root/web/node_modules/.bin/vite" ]]; then
  echo "Installing frontend dependencies..."
  npm ci --prefix "$repo_root"
fi

echo "Starting Spring backend on http://127.0.0.1:8080"
(
  cd "$backend_dir"
  DB_URL="jdbc:mysql://127.0.0.1:$mysql_host_port/$db_name?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC" \
  DB_USERNAME="$db_user" \
  DB_PASSWORD="$db_password" \
  HSU_KAKAO_CLIENT_ID="${HSU_KAKAO_CLIENT_ID:-local-qa-client}" \
  HSU_KAKAO_CLIENT_SECRET="${HSU_KAKAO_CLIENT_SECRET:-local-qa-secret}" \
  HSU_KAKAO_APPLICANT_ORIGIN=http://localhost:5173 \
  HSU_KAKAO_ADMIN_ORIGIN=http://localhost:5174 \
  CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5174 \
  SPRING_PROFILES_ACTIVE=local \
    ./gradlew --no-daemon bootRun
) &
backend_pid=$!

echo "Waiting for backend health endpoint"
backend_ready=false
for _ in $(seq 1 90); do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8080/actuator/health >/dev/null 2>&1; then
    backend_ready=true
    break
  fi
  sleep 2
done

if [[ "$backend_ready" != true ]]; then
  echo "Backend did not become ready within 180 seconds." >&2
  exit 1
fi

if [[ "$qa_club_id" =~ ^[0-9]+$ ]]; then
  club_expression="$qa_club_id"
else
  club_expression='(SELECT id FROM clubs ORDER BY id LIMIT 1)'
fi

echo "Seeding local OPERATOR data"
docker exec -i -e MYSQL_PWD="$db_password" "$mysql_container" \
  mysql --protocol=tcp -h 127.0.0.1 -u"$db_user" "$db_name" <<SQL
INSERT INTO users (kakao_user_id, email, service_role, status, created_at, updated_at)
VALUES ($qa_kakao_user_id, '$qa_email', 'USER', 'ACTIVE', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE email = VALUES(email), status = 'ACTIVE', updated_at = UTC_TIMESTAMP(6);

SET @qa_user_id = (SELECT id FROM users WHERE kakao_user_id = $qa_kakao_user_id);
SET @qa_club_id = $club_expression;

INSERT INTO club_users (user_id, club_id, club_role)
VALUES (@qa_user_id, @qa_club_id, 'OPERATOR')
ON DUPLICATE KEY UPDATE club_role = 'OPERATOR';

INSERT INTO user_sessions (session_hash, user_id, created_at, last_seen_at, expires_at)
VALUES (SHA2('$qa_session', 256), @qa_user_id, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE user_id = @qa_user_id, revoked_at = NULL, last_seen_at = UTC_TIMESTAMP(6), expires_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 1 DAY);
SQL

echo "Starting operator frontend on http://localhost:5174"
(
  cd "$repo_root"
  npm run dev --workspace web
) &
frontend_pid=$!

cat <<EOF

Local QA is ready.

1. Open: http://localhost:5174
2. To use the seeded operator session, open DevTools Console on that page and run:

document.cookie = '__Host-HSU_SESSION=$qa_session; Path=/; Secure'; location.reload();

Press Ctrl-C to stop backend/frontend. The MySQL container is kept for reuse:
  $mysql_container
EOF

wait "$frontend_pid"
