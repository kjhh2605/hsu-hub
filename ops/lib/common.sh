#!/usr/bin/env bash

if [[ -z "${AWS_REGION:-}" ]]; then
  AWS_REGION=ap-northeast-2
fi
PLATFORM_STACK=${PLATFORM_STACK:-HsuHubPlatform}

aws_cli() {
  local args=(--region "$AWS_REGION")
  if [[ -n "${AWS_PROFILE:-}" ]]; then
    args+=(--profile "$AWS_PROFILE")
  fi
  aws "${args[@]}" "$@"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "required command not found: $1" >&2
    exit 1
  }
}

stack_output() {
  local key=$1
  local value
  value=$(aws_cli cloudformation describe-stacks \
    --stack-name "$PLATFORM_STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue | [0]" \
    --output text)
  if [[ -z "$value" || "$value" == None ]]; then
    echo "missing CloudFormation output: $key" >&2
    exit 1
  fi
  printf '%s\n' "$value"
}

encode_file() {
  base64 < "$1" | tr -d '\n'
}

ssm_run_payload() {
  local instance_id=$1
  local payload_file=$2
  local payload command_id
  payload=$(encode_file "$payload_file")
  command_id=$(aws_cli ssm send-command \
    --instance-ids "$instance_id" \
    --document-name AWS-RunShellScript \
    --comment "HSU Hub operation" \
    --parameters "$(jq -cn --arg command "printf '%s' '$payload' | base64 -d | bash" '{commands:[$command]}')" \
    --query Command.CommandId \
    --output text)

  local timeout_seconds=${SSM_COMMAND_TIMEOUT_SECONDS:-600}
  [[ "$timeout_seconds" =~ ^[1-9][0-9]*$ ]] || {
    echo 'SSM_COMMAND_TIMEOUT_SECONDS must be a positive integer' >&2
    return 2
  }

  local deadline=$((SECONDS + timeout_seconds))
  local status='Pending'
  while (( SECONDS < deadline )); do
    status=$(aws_cli ssm get-command-invocation \
      --command-id "$command_id" --instance-id "$instance_id" \
      --query Status --output text 2>/dev/null) || status='Pending'
    case "$status" in
      Success|Cancelled|TimedOut|Failed)
        break
        ;;
      Pending|InProgress|Delayed|Cancelling)
        sleep 5
        ;;
      *)
        echo "unexpected SSM command status: $status" >&2
        return 1
        ;;
    esac
  done

  if [[ "$status" != Success && "$status" != Cancelled && "$status" != TimedOut && "$status" != Failed ]]; then
    echo "SSM command did not finish within ${timeout_seconds}s: $command_id" >&2
    return 1
  fi

  aws_cli ssm get-command-invocation \
    --command-id "$command_id" --instance-id "$instance_id" \
    --query '{Status:Status,Stdout:StandardOutputContent,Stderr:StandardErrorContent}' \
    --output json
  [[ "$status" == Success ]]
}
