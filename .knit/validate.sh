#!/usr/bin/env bash
set -eu

: "${KNIT_COMMIT_SHA:?KNIT_COMMIT_SHA is required for exact-commit validation}"

case "$KNIT_COMMIT_SHA" in
  ''|*[!0123456789abcdefABCDEF]*)
    echo 'invalid KNIT_COMMIT_SHA: expected a 40-character hexadecimal SHA' >&2
    exit 2
    ;;
esac

if [ "${#KNIT_COMMIT_SHA}" -ne 40 ]; then
  echo 'invalid KNIT_COMMIT_SHA: expected a 40-character hexadecimal SHA' >&2
  exit 2
fi

workdir="$(mktemp -d)"
cleanup() {
  git worktree remove --force "$workdir" >/dev/null 2>&1 || true
  rm -rf "$workdir"
}
trap cleanup EXIT

echo "Knit validation: ${KNIT_REPOSITORY:-repository} @ ${KNIT_COMMIT_SHA}"
git fetch --no-tags origin "$KNIT_COMMIT_SHA"
git worktree add --detach "$workdir" "$KNIT_COMMIT_SHA" >/dev/null

cd "$workdir"
npm ci
npm test
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run

echo 'Knit validation passed.'
