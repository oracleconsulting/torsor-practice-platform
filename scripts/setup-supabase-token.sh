#!/usr/bin/env bash
# =============================================================================
# Set up SUPABASE_ACCESS_TOKEN in GitHub Actions and ~/.zshrc
# =============================================================================
# Prompts for a fresh Supabase access token (silent input, no shell history),
# stores it as the SUPABASE_ACCESS_TOKEN secret on this GitHub repo, and
# updates ~/.zshrc so local CLI commands keep working.
#
# Usage:
#   ./scripts/setup-supabase-token.sh
#   # or, from a fresh terminal:
#   bash <(curl -sS https://raw.githubusercontent.com/oracleconsulting/torsor-practice-platform/main/scripts/setup-supabase-token.sh)
# =============================================================================

set -euo pipefail

REPO="oracleconsulting/torsor-practice-platform"
ZSHRC="$HOME/.zshrc"

bold=$(tput bold 2>/dev/null || echo '')
green=$(tput setaf 2 2>/dev/null || echo '')
red=$(tput setaf 1 2>/dev/null || echo '')
reset=$(tput sgr0 2>/dev/null || echo '')

echo "${bold}Supabase access token setup${reset}"
echo "Repo:    $REPO"
echo "Zshrc:   $ZSHRC"
echo

# ---------------------------------------------------------------------------
# Pre-flight: gh CLI authed?
# ---------------------------------------------------------------------------

if ! command -v gh >/dev/null 2>&1; then
  echo "${red}ERROR: GitHub CLI (gh) is not installed.${reset}"
  echo "Install with: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "${red}ERROR: gh is not logged in. Run: gh auth login${reset}"
  exit 1
fi

# ---------------------------------------------------------------------------
# Read the new token securely
# ---------------------------------------------------------------------------

echo "Paste the new Supabase access token below."
echo "(You will NOT see it as you type. That is correct.)"
echo "Token starts with: sbp_"
echo
printf "Token: "
# -s = silent (no echo), -r = raw (do not interpret backslashes)
IFS= read -rs TOKEN
echo
echo

if [[ -z "${TOKEN:-}" ]]; then
  echo "${red}ERROR: empty token. Aborting.${reset}"
  exit 1
fi

if [[ ! "$TOKEN" =~ ^sbp_ ]]; then
  echo "${red}ERROR: token does not start with 'sbp_'. Looks wrong; aborting.${reset}"
  exit 1
fi

if [[ "${#TOKEN}" -lt 30 ]]; then
  echo "${red}ERROR: token is suspiciously short (${#TOKEN} chars). Aborting.${reset}"
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Push to GitHub Actions secret
# ---------------------------------------------------------------------------

echo "${bold}1/3${reset}  Setting GitHub Actions secret SUPABASE_ACCESS_TOKEN..."
if printf '%s' "$TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN --repo "$REPO" --body -; then
  echo "      ${green}✓${reset} Secret set on $REPO"
else
  echo "      ${red}✗ Failed.${reset}"
  unset TOKEN
  exit 1
fi
echo

# ---------------------------------------------------------------------------
# 2. Update ~/.zshrc
# ---------------------------------------------------------------------------

echo "${bold}2/3${reset}  Updating $ZSHRC..."

if [[ ! -f "$ZSHRC" ]]; then
  touch "$ZSHRC"
fi

# Backup first time only
if [[ ! -f "$ZSHRC.before-supabase-token-update.bak" ]]; then
  cp "$ZSHRC" "$ZSHRC.before-supabase-token-update.bak"
fi

# Replace any existing export line, or append if missing.
if grep -q '^export SUPABASE_ACCESS_TOKEN=' "$ZSHRC"; then
  # macOS sed needs '' after -i. Use a safe delimiter that won't appear in tokens.
  TMP=$(mktemp)
  awk -v val="$TOKEN" '
    /^export SUPABASE_ACCESS_TOKEN=/ {
      print "export SUPABASE_ACCESS_TOKEN=" val
      next
    }
    { print }
  ' "$ZSHRC" > "$TMP"
  mv "$TMP" "$ZSHRC"
  echo "      ${green}✓${reset} Replaced existing line"
else
  printf '\nexport SUPABASE_ACCESS_TOKEN=%s\n' "$TOKEN" >> "$ZSHRC"
  echo "      ${green}✓${reset} Appended export line"
fi

# Make sure SUPABASE_PROJECT_REF is set too
if ! grep -q '^export SUPABASE_PROJECT_REF=' "$ZSHRC"; then
  printf 'export SUPABASE_PROJECT_REF=mvdejlkiqslwrbarwxkw\n' >> "$ZSHRC"
  echo "      ${green}✓${reset} Added SUPABASE_PROJECT_REF=mvdejlkiqslwrbarwxkw"
fi

# Activate in the current shell (only effective when the script is sourced;
# when run via `bash <(curl …)` we can only export within this subshell so
# we instruct the user to start a new tab for full effect).
export SUPABASE_ACCESS_TOKEN="$TOKEN"
export SUPABASE_PROJECT_REF=mvdejlkiqslwrbarwxkw

unset TOKEN
echo

# ---------------------------------------------------------------------------
# 3. Verify
# ---------------------------------------------------------------------------

echo "${bold}3/3${reset}  Verifying..."

if gh secret list --repo "$REPO" 2>/dev/null | grep -q '^SUPABASE_ACCESS_TOKEN'; then
  echo "      ${green}✓${reset} GitHub secret present"
else
  echo "      ${red}✗${reset} GitHub secret not found in list"
fi

if grep -q '^export SUPABASE_ACCESS_TOKEN=sbp_' "$ZSHRC"; then
  echo "      ${green}✓${reset} ~/.zshrc contains a token starting with sbp_"
else
  echo "      ${red}✗${reset} ~/.zshrc not updated correctly"
fi

echo
echo "${green}${bold}Done.${reset}"
echo
echo "Open a new terminal tab/window so the new token is loaded for local commands."
echo "(Or in this same window, run:  ${bold}source ~/.zshrc${reset})"
echo
echo "GitHub Actions will now auto-deploy edge functions on every push to main."
echo "View deploy runs:  https://github.com/$REPO/actions"
