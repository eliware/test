# Release Notes

## 8.0.0 — 2026-09-24

### Added

- Added versioned, machine-readable convention specifications and deterministic
  discovery/completeness validation for the bundled check registry, selected
  from each repository's declared profiles without a runtime dependency on a
  separate repository.
- Added profile-aware convention stages, rule-level exemption validation,
  fail-fast configuration checks, and actionable diagnostics for missing or
  malformed package configuration and unknown convention identifiers.
- Added focused validation planning and execution, with focused runs checking
  the selected test and applicable focused-file requirements without running
  unrelated repository-wide checks.
- Added `--format`, `--format-check`, `--audit`, and `--pack` public modes;
  tool modes forward additional arguments to their underlying tools.
- Added strict source/test mirroring and checks for canonical workflows,
  package metadata, native ESM, README/documentation surfaces, references,
  authority data, publication metadata, and repository safety.

### Changed

- Reworked the CLI around native ESM modules and stable informational,
  validation, and tool-mode contracts; standardized failure codes and concise
  successful output.
- Refined the validation pipeline to apply only checks required by the
  repository's declared profiles and to enforce bundled check completeness.
- Aligned documentation, specs, checks, and tests with the current Eliware
  conventions; decomposed validation responsibilities into focused modules
  with mirrored tests.
- Updated package validation for npm 12 pack-manifest output and tightened
  publication workflow, provenance, and registry-verification checks.

### Fixed

- Hardened 100×4 coverage evidence selection, zero-total metrics, malformed and
  incomplete reports, focused coverage mapping, cleanup, and diagnostics.
- Hardened child-process startup, output bounds, credential redaction,
  termination, and cross-platform behavior.
- Fixed convention/profile applicability, workflow and package validation,
  documentation indexing, and focused-run false failures.

## 6.0.1 — 2026-09-06

### Changed

- Made consumer `audit`, `build`, and `typecheck` scripts optional; defined
  scripts must still be valid and pass.
- Forwarded injected process collaborators through post-test lint validation
  and normalized package-stage failures to the documented exit code.
- Required a `Configuration` section in every README and aligned CLI
  specifications and regression tests with these behaviors.

## 6.0.0 — 2026-09-05

### Added

- Added runtime and npm provenance metadata checks for publishable packages.
- Added required documentation-index checks and enabled monolith enforcement
  in shared defaults.

### Changed

- Strengthened package-script sequencing and continued later-stage diagnostics
  after earlier failures.
- Hardened Istanbul handling for mapped counters, malformed reports,
  freshness, fallback evidence, and artifact replacement while preserving the
  100×4 and focused-coverage contracts.
- Improved child-process lifecycle handling, bounded diagnostics, timing
  cleanup, path normalization, and structured errors; documented supported
  Windows Node/npm layouts and operational limitations.

## 5.0.0 — 2026-09-05

### Added

- Added deterministic repository convention validation for structure, package
  metadata, README links and sections, specifications, `.env.example`, and
  consumer examples, with grouped diagnostics and path-level exceptions.
- Added public Eliware package identity checks, a `specs/` contract layout,
  explicit out-of-scope documentation, and a minimal consumer example.
- Added monolith enforcement and validation for configured audit, pack, build,
  and typecheck scripts.

### Changed

- Hardened coverage freshness, precedence, fallback evidence, malformed and
  empty reports, artifact promotion, and normalized Istanbul line counters.
- Continued later validation stages after coverage failures and consolidated
  successful output into one summary line.
- Improved Windows/Linux package-script execution and decomposed validation
  modules.

## 4.0.0 — 2026-09-04

### Breaking changes

- Replaced the legacy implementation with a native-ESM CLI and decomposed the
  runner into focused application, coverage, workspace, process, and validation
  modules. Node.js 26 or newer is required.
- Removed `index.mjs`, `index.d.ts`, and legacy top-level module entry points;
  the `eliware-test` executable is the supported consumer interface.
- Enforced mirrored `src/` and `tests/` module layouts. Consumers migrate
  their `test` script to `eliware-test` and `lint` script to
  `eliware-test --lint`.

### Added

- Added configurable monolith measurement, package-script validation, optional
  audit/pack/build/typecheck stages, and packed-consumer smoke validation.
- Added atomic coverage artifact promotion and hardened counter, freshness,
  focused-path, fallback-evidence, and malformed-report validation.
- Added distinct validation exit codes and expanded process, workspace,
  portability, and diagnostic handling.

## 3.0.0 — 2026-09-03

### Changed

- Restricted strict `--runTestsByPath` handling to conventional test/spec
  paths while preserving Jest semantics for source-like paths.
- Added opt-in sanitized child-process environments while retaining inherited
  environments by default.
- Made near-complete annotated coverage fail closed and completed parsed
  argument declarations.
- Documented coverage freshness and fallback evidence, bounded parsing,
  orchestration API stability, output ownership, and percentage grammar.

## 2.4.0 — 2026-09-03

### Added

- Added detailed Istanbul JSON coverage-gap diagnostics for uncovered lines,
  statements, branches, functions, and normalized workspace paths.
- Added public parser/orchestration exports, TypeScript declarations,
  executable-level regression coverage, and consumer CI typechecking.
- Added `--ignore-100x4`, `--no-runInBand`, and `--version`/`-v` support.

### Changed

- Hardened focused-path validation, mirrored source coverage mapping,
  subprocess diagnostics, lint-warning enforcement, and workspace setup errors.
- Clarified coverage rounding, malformed function metadata, forwarded Jest
  options, and coverage artifact boundaries.

## 2.3.1 — 2026-09-02

### Fixed

- Fixed zero-valued text coverage metrics being treated as complete and made
  valid-but-unusable coverage JSON fall back to text evidence.
- Made Oxlint warnings fail validation in combined and lint-only commands.

## 2.3.0 — 2026-09-01

### Changed

- Made focused runs execute only requested files and fail closed when a
  requested path is missing. Focused coverage maps mirrored test paths to
  source files; ambiguous selections retain broad coverage enforcement.
- Rejected protected wrapper-managed Jest flags early and kept subprocess
  output bounded.
- Suppressed coverage diagnostics after test failures so failure output stays
  actionable; hardened malformed JSON and sparse statement-map handling.

## 2.2.0 — 2026-08-31

### Added

- Scoped focused-run coverage enforcement to the matching source files when
  test paths follow the standard mirrored layout.
- Kept broad coverage enforcement for unmappable focused paths and documented
  the focused coverage contract.

## 2.1.4 — 2026-08-30

### Added

- Added `--ignore-100x4` as an explicit diagnostic and transitional opt-out
  from coverage enforcement while retaining test execution and coverage
  collection.

## 2.1.3 — 2026-08-29

### Added

- Added `eliware-test --version` and `eliware-test -v`, reporting the package
  version without running the test suite.

## 2.1.2 — 2026-08-29

### Fixed

- Fixed multi-file focused test execution by using Jest's strict
  `--runTestsByPath` selection and added coverage proving unrelated suites do
  not run.

## 2.1.1 — 2026-08-29

### Added

- Added `--help`/`-h`, direct-invocation separator handling, and clearer
  rejection of invalid lint combinations.
- Added focused-path validation so invalid paths cannot silently trigger the
  broad suite, plus opt-in `ELIWARE_TEST_DEBUG=1` argument diagnostics.
- Added regression coverage for focused arguments and Windows npm shims.

## 2.1.0 — 2026-08-29

### Added

- Added exact-commit secondary validation through Knit using a disposable
  worktree, bounded execution, cleanup, and the full local validation suite.
- Improved agent-facing diagnostics with bounded subprocess output,
  deduplicated failures, normalized coverage paths, and detailed JSON coverage
  gaps.
- Added default workspace exclusions and a non-failing warning when a consumer
  repository lacks `.gitignore`.

## 2.0.0 — 2026-08-24

### Changed

- Aligned continuous integration and release workflows with Eliware release
  conventions.

## 1.0.3 — 2026-08-24

### Added

- Expanded JSON coverage diagnostics with per-metric percentages, uncovered
  lines, exact locations, function names, and test-fix guidance.

## 1.0.2 — 2026-08-24

### Added

- Enabled Jest's `--detectOpenHandles` option in the default test command and
  added regression coverage for forwarding it.

## 1.0.1 — 2026-08-24

### Fixed

- Resolved Jest and Oxlint for consumer installations, including npm-hoisted
  dependency layouts on Windows and Linux.

### Added

- Added declaration typechecking and aligned package documentation with Eliware
  conventions.

## 1.0.0 — 2026-08-24

### Added

- Established the `@eliware/test` package and its command-line test runner.
- Added bundled Jest and Oxlint orchestration, focused-test forwarding,
  concise output, coverage-gap filtering, and cross-platform process handling.
