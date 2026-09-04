# @eliware/test 4.0.0 release checklist

Status legend: `[x]` done, `[~]` partially complete/in progress, `[ ]` not
started or waiting on approval/authorization.

This checklist tracks the work required to move the repository from the
current 3.0.0 development state to a convention-compliant 4.0.0 release.
It is intentionally uncommitted until the audit and preparation work is
reviewed.

## Current audit baseline

- [x] Node.js 26 is declared and the package uses native ESM (`type: module`)
  and `.mjs` files.
- [x] `bin/eliware-test.mjs` is a thin launcher; CLI behavior lives under
  `src/application/`.
- [x] `src/` is organized by responsibility with focused subordinate modules.
- [x] Source/test mapping currently reports `missingTests: []` and
  `orphanTests: []`.
- [x] Current source and test file counts are both 118.
- [x] The architecture audit is complete: source modules are focused, all are
  within the implementation limit, and orchestrators delegate subordinate
  behavior.
- [x] The coverage test architecture audit is complete: the former 375-line
  `tests/coverage/coverage.test.mjs` is now a 58-line facade test and all test
  files are within the 200-line limit.
- [~] The worktree is dirty with the current refactoring and deletions; no
  release preparation may begin until every change is explained and committed.
- [x] CI and Knit validation no longer invoke the non-applicable
  `npm run typecheck`; typechecking remains consumer-specific as documented.
- [x] `package.json` remains version `3.0.0`; no version or release metadata
  may change until exact `4.0.0` approval is obtained.
- [x] No convention deviations are currently recorded for this repository;
  no unexplained exception was found during the audit.

## Milestone 1 — Convention and architecture closure

### Source and module architecture

- [x] Review every `src/**/*.mjs` against the single-responsibility rule in
  `module-and-test-architecture.md`.
- [x] Review all public and application orchestrators for thin coordination
  only; current orchestrators delegate validation, parsing, transformation,
  policy, execution, and reporting to subordinate modules.
- [x] Run the project monolith check with normal limits (100 source lines and
  200 test lines); the current tree has no source or test violations.
- [x] Split `tests/coverage/coverage.test.mjs` into cohesive mirrored test
  modules without creating a catch-all replacement.
- [x] Re-run the exact source/test mapping validator after every structural
  change; the current result is zero missing and orphan pairs.
- [x] Review pure barrels and configuration exemptions; no Istanbul ignores,
  coverage exclusions, or monolith exemptions are present.

### Test architecture

- [x] Ensure every production module has exactly one mirrored test module;
  current validation reports zero missing and orphan pairs.
- [x] Keep cross-module tests at the lowest common composition level.
- [x] Keep end-to-end assertions limited to actual CLI/orchestrator behavior.
- [x] Remove redundant tests only after confirming meaningful behavior remains
  covered at the owning module or composition level.
- [x] Maintain genuine 100% statements, branches, functions, and lines
  coverage without adding unjustified Istanbul ignores.

### Commit point

- [ ] Commit the architecture/test-structure milestone as focused commits,
  one cohesive extraction or test-tree correction per commit.
- [ ] Record focused validation for each commit and confirm no unrelated files
  are included.

## Milestone 2 — Convention and documentation alignment

- [~] Compare implementation behavior with `SPEC.md` line by line; the CLI
  contract has been smoke-checked and documented drifts corrected, but a
  formal line-by-line review remains.
- [ ] Update `SPEC.md` only for the approved 4.0.0 contract; do not document
  behavior merely because the current implementation happens to do it.
- [x] Reconcile `README.md`, `SPEC.md`, `RELEASE_NOTES.md`, `package.json`,
  `package-lock.json`, workflow files, and packed-file allowlists for the
  current 3.0.0 CLI contract. The package intentionally exposes only its
  executable; no `exports`, `main`, or declaration surface is promised.
- [x] Ensure README documents purpose, setup, configuration, validation,
  security/environment behavior, limitations, and operations.
- [~] Ensure release notes describe all breaking changes from 3.0.0; current
  contract corrections are recorded, but 4.0.0 release notes await approval.
- [x] No convention-drift entry is required; the audit found no applicable
  intentional deviation that documentation could not resolve.
- [x] Verify `.knit/deploy.yaml` remains explicit and its validation command
  source agrees with the repository’s actual release gates.

### Commit point

- [ ] Commit documentation and explicit drift records separately from source
  refactoring.

## Milestone 3 — Validation workflow closure

- [x] Typechecking is not applicable to this native-ESM CLI package; the invalid
  workflow invocations were removed and README/SPEC document it as
  consumer-specific.
- [x] Typechecking is not required for this JavaScript CLI; no script or
  configuration is needed.
- [x] Confirm CI runs on Ubuntu and Windows for pushes, pull requests, and
  version tags.
- [x] Confirm CI uses Node 26 and `npm ci`.
- [x] Confirm validation includes `npm test`, `npm run lint`, audit, and
  `npm pack --dry-run`.
- [x] Confirm lint warnings fail validation.
- [x] Confirm publication is tag-only and `id-token: write` is limited to the
  publish job.
- [x] Run locally (completed with `npm ci`, `npm test`, `npm run lint`,
  `npm audit --omit=dev --audit-level=moderate`, and `npm pack --dry-run`):

  ```text
  npm ci
  npm test
  npm run lint
  npm audit --omit=dev --audit-level=moderate
  npm pack --dry-run
  ```

### Commit point

- [ ] Commit workflow and validation-gate corrections separately.
- [ ] Verify the committed state, not only the working tree, with the complete
  local validation set.

## Milestone 4 — Package and release preparation

- [x] Review `npm pack --dry-run` and confirm only intended files are shipped:
  `bin/`, `src/`, intentional `docs/`, README, SPEC, license, and release
  notes.
- [x] Confirm tests, coverage output, fixtures, debug logs, archives, and
  workspace state are not accidentally packed.
- [x] Review runtime and development dependencies for stale or unnecessary
  entries; removed the unused TypeScript dependency because typechecking is
  not applicable.
- [x] Confirm package scripts, binary metadata, repository metadata, keywords,
  exports/types declarations, lockfile, and file allowlist agree.
- [ ] Review all breaking changes and confirm 4.0.0 is an intentional major
  generation change.
- [ ] Obtain explicit approval for the exact version `4.0.0` before editing
  package version, release notes, or starting release preparation.
- [ ] After approval, run `tagit notes` and review its output.
- [ ] Update `package.json`, `package-lock.json`, and `RELEASE_NOTES.md` for
  the approved 4.0.0 release.
- [ ] Commit release preparation as focused metadata/documentation commits.

### Commit point

- [ ] Record the exact release-preparation commit SHA and confirm the worktree
  is clean.

## Milestone 5 — Push, preflight, and publication handoff

- [ ] Obtain explicit authorization to push.
- [ ] Run `tagit push` and record all CI workflow URLs.
- [ ] Run `tagit preflight` and wait for all required checks.
- [ ] Do not proceed while tests, coverage, lint, audit, package validation,
  metadata, exact-commit, or Knit checks fail.
- [ ] If preflight fails, fix the cause, commit it, push again, and rerun
  preflight.
- [ ] After preflight passes, hand DevOps the repository, exact commit,
  approved version, release summary, CI links, local validation, and warnings.
- [ ] DevOps verifies the exact approved version before running:

  ```text
  tagit release --version 4.0.0
  tagit release-wait
  ```

- [ ] Independently verify npm publication, package version, source commit,
  release tag, and provenance.

## Milestone 6 — Finalization and rollback readiness

- [ ] If deployment is needed, hand GitOps the published version, immutable
  digest, source commit, release evidence, validation, and rollback value.
- [ ] Use the GitOps staging PR for application-owned deployment changes; do
  not edit protected GitOps `main` directly.
- [ ] Verify final application behavior after publication/deployment.
- [ ] Record release version/tag, source and release SHAs, publication result,
  CI/preflight links, validation performed, warnings, and rollback status.
- [ ] Confirm the previous known-good release and rollback procedure are
  identified before declaring 4.0.0 complete.

## Final release evidence

- [ ] Clean worktree at release handoff
- [x] Convention audit complete with explicit drift dispositions
- [x] Source/test mapping exact
- [x] No unexplained monoliths
- [x] 100×4 coverage
- [x] Zero lint warnings
- [~] Ubuntu CI passed (local equivalent passes; CI evidence not collected)
- [~] Windows CI passed (local equivalent passes; CI evidence not collected)
- [x] Audit passed
- [x] Package dry-run passed
- [ ] Exact-version approval recorded
- [ ] Preflight passed
- [ ] Publication independently verified
- [ ] Final release record completed
