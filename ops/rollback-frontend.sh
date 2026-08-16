#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=ops/lib/common.sh
source "$repo_root/ops/lib/common.sh"
require_command aws

release_tag=${1:?usage: ops/rollback-frontend.sh RELEASE_TAG}
[[ "$release_tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || exit 2

for site in Applicant Admin; do
  bucket=$(stack_output "${site}BucketName")
  distribution=$(stack_output "${site}DistributionId")
  aws_cli s3 sync "s3://${bucket}/releases/${release_tag}/" "s3://${bucket}/" \
    --delete --exclude 'releases/*' --only-show-errors
  aws_cli cloudfront create-invalidation --distribution-id "$distribution" --paths '/*' >/dev/null
done
echo "frontend rollback requested for $release_tag"
