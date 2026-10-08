#!/usr/bin/env bash
# Opens (or comments on) a single "falha-automatica" issue so failures reach
# the repository owner by e-mail without flooding them with duplicates.
# Usage: report-failure.sh "<title>" "<optional details file>"
set -euo pipefail
title="$1"
details_file="${2:-}"
body="Uma automação falhou e **nada foi publicado** — o site continua na última versão boa.

Execução: ${RUN_URL:-}
"
if [ -n "$details_file" ] && [ -f "$details_file" ]; then
  body="$body
Problemas encontrados:

$(cat "$details_file")
"
fi
# REST listing is immediate (gh issue list goes through search and lags).
existing=$(gh api "repos/{owner}/{repo}/issues?labels=falha-automatica&state=open&per_page=100" \
  | TITLE="$title" jq -r '[.[] | select(.title == env.TITLE)][0].number // empty')
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "Falhou de novo em $(date -u +%Y-%m-%d).

$body"
else
  gh issue create --title "$title" --label falha-automatica --body "$body"
fi
