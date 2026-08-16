#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=ops/lib/common.sh
source "$repo_root/ops/lib/common.sh"
require_command aws
require_command jq

instance_id=$(stack_output InstanceId)
payload=$(mktemp)
trap 'rm -f "$payload"' EXIT
printf '%s\n' 'set -euo pipefail' '/opt/hsu-hub/runtime-backup.sh' > "$payload"
ssm_run_payload "$instance_id" "$payload"
