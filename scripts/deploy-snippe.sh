#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="vvtipknififdybbmrduo"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js/npm is required for the Supabase CLI. Install Node.js 20+ and try again." >&2
  exit 1
fi

read -r -p "Public menu URL (https://...): " SITE_URL
if [[ ! "$SITE_URL" =~ ^https://[^[:space:]]+$ ]]; then
  echo "Enter the public HTTPS URL customers use for the menu." >&2
  exit 1
fi

printf "This will update Snippe secrets and deploy to Supabase project %s.\n" "$PROJECT_REF"
read -r -p "Type DEPLOY to continue: " CONFIRM
if [[ "$CONFIRM" != "DEPLOY" ]]; then
  echo "Cancelled. No secrets were changed."
  exit 1
fi

read -r -s -p "Rotated Snippe API key (input hidden): " SNIPPE_API_KEY
printf '\n'
read -r -s -p "Snippe webhook signing secret (input hidden): " SNIPPE_WEBHOOK_SECRET
printf '\n'
if [[ ! "$SNIPPE_API_KEY" =~ ^snp_[[:alnum:]_-]+$ ]]; then
  echo "The Snippe API key format looks incorrect. No secrets were changed." >&2
  exit 1
fi
if [[ ! "$SNIPPE_WEBHOOK_SECRET" =~ ^whsec_[[:xdigit:]]+$ ]]; then
  echo "The webhook secret format looks incorrect. No secrets were changed." >&2
  exit 1
fi

SECRETS_FILE="$(mktemp)"
chmod 600 "$SECRETS_FILE"
cleanup() {
  rm -f "$SECRETS_FILE"
  unset SNIPPE_API_KEY SNIPPE_WEBHOOK_SECRET
}
trap cleanup EXIT HUP INT TERM
printf 'SNIPPE_API_KEY=%s\nSNIPPE_WEBHOOK_SECRET=%s\nSITE_URL=%s\n' \
  "$SNIPPE_API_KEY" "$SNIPPE_WEBHOOK_SECRET" "$SITE_URL" > "$SECRETS_FILE"
unset SNIPPE_API_KEY SNIPPE_WEBHOOK_SECRET

npx --yes supabase@latest projects list >/dev/null
npx --yes supabase@latest secrets set --env-file "$SECRETS_FILE" --project-ref "$PROJECT_REF" --yes
npx --yes supabase@latest functions deploy snippe-checkout --no-verify-jwt --project-ref "$PROJECT_REF"

echo "Snippe checkout deployed. Run supabase/snippe-payment-migration.sql in the Supabase SQL Editor if you have not already run it."
