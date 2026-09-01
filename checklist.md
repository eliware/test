# `@eliware/test` implementation checklist

Status meanings: `DONE` is implemented and locally verified; `HALF-DONE` is
partially implemented or lacks complete platform evidence; `NOT STARTED` has
not been completed.

## Package and consumer contract

- [DONE] Scoped package name `@eliware/test`.
- [DONE] Initial package version `1.0.0`; current released version is `2.2.0`.
- [HALF-DONE] Release `2.3.0` implementation and release notes are prepared;
  publication and release verification remain outstanding.
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
- [DONE] Validate focused paths before invoking Jest to prevent accidental broad-suite runs.
- [DONE] Support direct-invocation separators and reject invalid lint combinations.
- [DONE] Provide `--help` and `-h` usage guidance.
- [DONE] Provide `--version` and `-v` package version reporting.
- [DONE] Provide opt-in forwarded-argument diagnostics with `ELIWARE_TEST_DEBUG=1`.
- [DONE] Return nonzero codes for test, coverage, and lint failures.
- [DONE] Support explicit `--ignore-100x4` coverage-enforcement opt-out.
- [DONE] Preserve failed-test diagnostics.
- [DONE] Suppress routine passing output and emit minimal success output.
- [DONE] Report only coverage-gap files.
- [DONE] Use Node child-process APIs and argument arrays.
- [DONE] Complete independent Linux and Windows execution verification.

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
- [DONE] Test exact focused-argument forwarding and Windows npm shim behavior.
- [DONE] Test strict multi-file focused selection with Jest path mode.
- [DONE] Scope mirrored focused coverage and retain broad enforcement for
  unmappable focused paths.
- [DONE] Test ANSI and CRLF handling.
- [DONE] Add excluded intentionally failing fixture.
- [DONE] Add excluded passing coverage-gap fixture.
- [DONE] Add explicit cross-platform CI execution evidence.

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
- [DONE] `2.2.0` documentation and implementation changes are committed,
  pushed, published, and verified through preflight.
- [DONE] Pre-release handoff verification on the latest Ubuntu/Windows CI run.
- [DONE] `2.2.0` release handoff, tagging, npm publication, and registry
  verification completed; deployment is not applicable to this library.
