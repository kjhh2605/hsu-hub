#!/usr/bin/env bash
set -euo pipefail

applicant_url=${APPLICANT_URL:-https://hsu-hub.site}
admin_url=${ADMIN_URL:-https://admin.hsu-hub.site}

curl --fail --silent --show-error --max-time 15 "$applicant_url/" >/dev/null
curl --fail --silent --show-error --max-time 15 "$admin_url/" >/dev/null
status=$(curl --silent --show-error --max-time 15 --output /dev/null --write-out '%{http_code}' \
  "$applicant_url/api/v1/auth/session")
case "$status" in
  200|401|403) ;;
  *) echo "unexpected session endpoint status: $status" >&2; exit 1 ;;
esac
echo "production smoke passed (session endpoint HTTP $status)"
