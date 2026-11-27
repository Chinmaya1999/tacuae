#!/usr/bin/env bash
# Checks the deployed site from outside. Counts every problem, then fails the job so it is clearly visible.
#   verify-live.sh https://example.com
set -uo pipefail
base="${1:?site address}"
errors=0
fail() { echo "::error::$1"; errors=$((errors + 1)); }
expect() { # path status
  local code
  code=$(curl -s -m 10 --retry 10 --retry-delay 3 --retry-all-errors -o /dev/null -w '%{http_code}' "$base$1")
  # retries cover a server that is still starting; expected 401 and 404 answers are not retried
  if [ "$code" = "$2" ]; then echo "ok  $1 ($code)"; else fail "$1 answered $code, expected $2"; fi
}
for p in / /about-us /services /products /projects /contact /login /register /sitemap.xml /robots.txt; do expect "$p" 200; done
expect /api/content 200
expect /api/account/me 200
expect /api/designs 401
expect /api/admin/stats 401
expect /api/does-not-exist 404
headers=$(curl -sI -m 10 "$base/")
for h in content-security-policy x-content-type-options x-frame-options; do grep -qi "^$h:" <<<"$headers" || fail "missing header: $h"; done
echo "live check errors: $errors"
[ "$errors" -eq 0 ]
