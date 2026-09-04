# Known Issues Checklist

Source: `codescope release` run on 2026-09-04. The release verdict was
`block`.

## Correctness and lifecycle

## Reliability

## Architecture policy

## Cross-platform behavior

## Tests

## Review notes

- CodeScope reported no security, performance, or documentation issues.
- No CodeScope ignore is appropriate yet; each finding requires a code,
  contract, or test decision.

## Additional CodeScope review findings

## Checklist maintenance notes

- Add release validation for packed-artifact smoke installation and metadata,
  lockfile, README, SPEC, and release-note consistency.
- The lifecycle wording in `spec/cli.md` must be reconciled with the
  architecture-gate findings before any item is marked resolved.

## Second follow-up CodeScope findings

- [ ] **P1 — Stale valid coverage artifacts can be accepted**
  - Location: `src/coverage/read-coverage.mjs:15-31`
  - A structurally valid report from an older run may be accepted if cleanup or
    report replacement is incomplete.
  - Define freshness/ownership semantics and test stale-candidate behavior.

## Third follow-up CodeScope findings

## Release validation additions
