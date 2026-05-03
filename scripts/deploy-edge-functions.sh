#!/usr/bin/env bash
# =============================================================================
# Deploy Supabase Edge Functions
# =============================================================================
# Usage:
#   ./scripts/deploy-edge-functions.sh fn1 fn2 fn3...   # deploy named functions
#   ./scripts/deploy-edge-functions.sh --changed        # deploy functions touched
#                                                       # since last main commit
#   ./scripts/deploy-edge-functions.sh --all            # deploy everything
#
# Requirements:
#   - SUPABASE_ACCESS_TOKEN env var (sourced from ~/.zshrc by default)
#   - npx (npm)
#   - git
#
# Behaviour:
#   - Strips `max_execution_time` keys from supabase/config.toml before deploy
#     (CLI rejects them) and restores the original on exit.
#   - Skips deploys when no functions are detected (so it's safe to run blind
#     in CI / pre-push hooks).
#   - When --changed is used, an edit to supabase/functions/_shared/** is
#     treated as "all GA functions" because they import the shared modules.
#
# =============================================================================

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-mvdejlkiqslwrbarwxkw}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT_DIR/supabase/config.toml"
CONFIG_BAK="$CONFIG.bak"

cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# Resolve list of functions to deploy
# ---------------------------------------------------------------------------

declare -a FUNCTIONS=()

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <fn1> [fn2 ...] | --changed | --all" >&2
  exit 1
fi

if [[ "${1:-}" == "--all" ]]; then
  while IFS= read -r d; do
    name="$(basename "$d")"
    [[ -f "$d/index.ts" ]] && FUNCTIONS+=("$name")
  done < <(find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_*')
elif [[ "${1:-}" == "--changed" ]]; then
  # Compare working tree + last commit against origin/main; deploy any function
  # whose folder was touched. A change anywhere under _shared/ triggers all
  # functions that import any shared module.
  base="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)"
  changed_paths="$(git diff --name-only "$base"...HEAD 2>/dev/null || true)
$(git diff --name-only)
$(git ls-files --others --exclude-standard supabase/functions/)"

  if echo "$changed_paths" | grep -q '^supabase/functions/_shared/'; then
    echo "[deploy] _shared/ change detected — collecting all functions importing it"
    while IFS= read -r d; do
      name="$(basename "$d")"
      if [[ -f "$d/index.ts" ]] && grep -q "_shared/" "$d/index.ts" 2>/dev/null; then
        FUNCTIONS+=("$name")
      fi
    done < <(find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_*')
  fi

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if [[ "$path" =~ ^supabase/functions/([^/]+)/ ]]; then
      name="${BASH_REMATCH[1]}"
      [[ "$name" == _* ]] && continue
      [[ ! -f "supabase/functions/$name/index.ts" ]] && continue
      FUNCTIONS+=("$name")
    fi
  done <<< "$changed_paths"

  # de-duplicate
  if [[ ${#FUNCTIONS[@]} -gt 0 ]]; then
    IFS=$'\n' read -r -d '' -a FUNCTIONS < <(printf '%s\n' "${FUNCTIONS[@]}" | sort -u && printf '\0')
  fi
else
  FUNCTIONS=("$@")
fi

if [[ ${#FUNCTIONS[@]} -eq 0 ]]; then
  echo "[deploy] No edge functions to deploy. Nothing to do."
  exit 0
fi

echo "[deploy] Project: $PROJECT_REF"
echo "[deploy] Functions to deploy (${#FUNCTIONS[@]}):"
printf '  - %s\n' "${FUNCTIONS[@]}"
echo

# ---------------------------------------------------------------------------
# Verify access token is available
# ---------------------------------------------------------------------------

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.zshrc" ]]; then
    # shellcheck source=/dev/null
    source "$HOME/.zshrc" 2>/dev/null || true
  fi
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "[deploy] ERROR: SUPABASE_ACCESS_TOKEN is not set." >&2
  echo "        Add it to ~/.zshrc or export it before running." >&2
  exit 1
fi
export SUPABASE_ACCESS_TOKEN

# ---------------------------------------------------------------------------
# Strip max_execution_time from config.toml (CLI rejects it). Restore on exit.
# ---------------------------------------------------------------------------

cleanup() {
  if [[ -f "$CONFIG_BAK" ]]; then
    mv -f "$CONFIG_BAK" "$CONFIG"
    echo "[deploy] Restored supabase/config.toml"
  fi
}
trap cleanup EXIT

if [[ -f "$CONFIG" ]]; then
  cp "$CONFIG" "$CONFIG_BAK"
  sed '/^max_execution_time/d' "$CONFIG_BAK" > "$CONFIG"
fi

# ---------------------------------------------------------------------------
# Per-function max timeouts (seconds). Long-running ones (Opus deep-mode
# advisory chat, multi-stage sprint plan / value analysis generation) need
# the full 400s Pro window; everything else is fine on the default 150s.
# ---------------------------------------------------------------------------

function timeout_for_fn() {
  case "$1" in
    advisory-agent|generate-sprint-plan-part1|generate-sprint-plan-part2|generate-value-analysis|generate-fit-profile|generate-five-year-vision|generate-six-month-shift|generate-advisory-brief|generate-insight-report|generate-director-alignment|generate-roadmap|generate-discovery-report-pass1|generate-discovery-report-pass2|generate-discovery-report-pass2a|generate-discovery-report-pass2b|generate-discovery-analysis|process-sa-transcript)
      echo "400"
      ;;
    *)
      echo ""  # default
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Deploy each function
# ---------------------------------------------------------------------------

failed=()
for fn in "${FUNCTIONS[@]}"; do
  echo "=========================================="
  echo "[deploy] $fn"
  echo "=========================================="
  fn_timeout="$(timeout_for_fn "$fn")"
  deploy_args=("functions" "deploy" "$fn" "--project-ref" "$PROJECT_REF")
  if [[ -n "$fn_timeout" ]]; then
    deploy_args+=("--max-timeout" "$fn_timeout")
    echo "[deploy] Setting max-timeout=${fn_timeout}s"
  fi
  if npx --yes supabase "${deploy_args[@]}"; then
    echo "[deploy] ✓ $fn"
  else
    echo "[deploy] ✗ $fn FAILED" >&2
    failed+=("$fn")
  fi
  echo
done

if [[ ${#failed[@]} -gt 0 ]]; then
  echo "[deploy] FAILED (${#failed[@]}):"
  printf '  - %s\n' "${failed[@]}"
  exit 1
fi

echo "[deploy] All ${#FUNCTIONS[@]} function(s) deployed successfully."
