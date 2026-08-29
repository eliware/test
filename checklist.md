# `@eliware/test` implementation checklist

Status meanings: `DONE` is implemented and locally verified; `HALF-DONE` is
partially implemented or lacks complete platform evidence; `NOT STARTED` has
not been completed.

## Package and consumer contract

- [DONE] Scoped package name `@eliware/test`.
- [DONE] Initial package version `1.0.0`.
- [DONE] Native ESM and `.mjs` implementation.
- [DONE] Bundled Jest and Oxlint runtime dependencies.
- [DONE] CLI executable and public exports/declarations.
- [DONE] Full npm metadata and explicit packed-file allowlist.
- [DONE] Consumer migration instructions in README and AGENTS.md.
- [DONE] Consumer scripts documented as `eliware-test` and `eliware-test --lint`.
- [DONE] Toolkit self-scripts invoke `node bin/eliware-test.mjs`.
- [DONE] Project-specific smoke/integration/regression/E2E separation documented.

## Orchestration and output

- [DONE] Run bundled Jest with coverage.
- [DONE] Run bundled Oxlint after successful tests.
- [DONE] Run lint only with `--lint`.
- [DONE] Treat lint warnings as failures.
- [DONE] Forward focused test arguments.
- [DONE] Return nonzero codes for test, coverage, and lint failures.
- [DONE] Preserve failed-test diagnostics.
- [DONE] Suppress routine passing output and emit minimal success output.
- [DONE] Report only coverage-gap files.
- [DONE] Use Node child-process APIs and argument arrays.
- [HALF-DONE] Complete independent Linux and Windows execution verification.

## Coverage

- [DONE] Parse Jest text coverage tables.
- [DONE] Parse all four metrics independently.
- [DONE] Detect raw uncovered counters even with misleading percentages.
- [DONE] Ignore complete files.
- [DONE] Read `coverage/coverage-final.json`, `coverage/coverage.json`, or `coverage.json`.
- [DONE] Report exact JSON uncovered statement lines, branch locations, and function names.
- [DONE] Avoid stale generated JSON between runs.
- [DONE] Support documented logic-free barrel exclusions.
- [DONE] Enforce 100×4 coverage for the toolkit self-test.

## Tests and fixtures

- [DONE] Test argument parsing and focused forwarding.
- [DONE] Test command orchestration and stage failure propagation.
- [DONE] Test coverage filtering and exact JSON reporting.
- [DONE] Test concise success and failure diagnostics.
- [DONE] Test ANSI and CRLF handling.
- [DONE] Add excluded intentionally failing fixture.
- [DONE] Add excluded passing coverage-gap fixture.
- [HALF-DONE] Add explicit cross-platform CI execution evidence.

## Documentation and hygiene

- [DONE] Warn when `.gitignore` is missing without failing the run.
- [DONE] Centralize and apply standard workspace exclusions.
- [DONE] Bound and deduplicate agent-facing subprocess diagnostics.
- [DONE] Normalize coverage paths for concise output.

- [DONE] README includes setup, migration, commands, coverage, test tiers, and ignore guidance.
- [DONE] AGENTS.md includes contributor and migration standards.
- [DONE] `.gitignore` excludes coverage and generated local artifacts.
- [DONE] Release notes include the implementation changes.
- [DONE] Ubuntu/Windows CI workflow is defined.
- [DONE] Local audit and package dry-run checks pass.
- [HALF-DONE] Worktree is prepared but not committed/pushed.
- [NOT STARTED] Pre-release handoff verification on latest Ubuntu/Windows CI runs.
- [NOT STARTED] Release authorization, tagging, publishing, or deployment.
