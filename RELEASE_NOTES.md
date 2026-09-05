# Release notes

## 6.0.0

### Validation and coverage

- Added runtime and npm provenance metadata checks for publishable packages.
- Strengthened package-script sequencing and continued collecting later-stage
  diagnostics after earlier validation failures.
- Hardened Istanbul coverage handling for mapped counters, malformed reports,
  freshness, fallback evidence, and artifact replacement.
- Preserved the 100×4 coverage contract, focused coverage behavior, source/test
  mapping, monolith enforcement, and configurable six-worker scanning.

### Diagnostics and portability

- Improved child-process lifecycle handling, bounded diagnostics, timing cleanup,
  workspace-path normalization, and stable structured error results.
- Ensured diagnostic writer failures do not escape the public toolkit boundary.
- Documented the supported Windows Node/npm layout and other intentional
  operational limitations.

### Documentation and tests

- Expanded the CLI, coverage, conventions, concurrency, diagnostics, migration,
  and out-of-scope specifications to describe the v6 behavior precisely.
- Added regression coverage for package metadata policies, coverage edge cases,
  output normalization, process behavior, and public-boundary failures.

## 5.0.0

### Repository convention validation

- Added deterministic validation for required repository structure, package
  metadata, README links and sections, specifications, `.env.example`, and
  consumer examples.
- Added grouped, stable, actionable convention diagnostics and documented
  exact path-level exceptions.
- Added public `@eliware/*` package checks for Eliware author identity,
  canonical repository metadata, and existing `bin` targets.
- Added the `specs/` contract layout, explicit out-of-scope documentation,
  public documentation, and a minimal consumer example.

### Validation pipeline and coverage

- Added post-test execution of defined `audit`, `pack`, `build`, and
  `typecheck` scripts; undefined scripts remain silently skipped.
- Hardened coverage parsing, freshness checks, fallback evidence, empty and
  malformed report handling, and coverage artifact promotion.
- Normalized numeric-string Istanbul line counters before line coverage and
  line-map conflict checks.
- Preserved the 100×4 coverage contract, focused coverage behavior, source/test
  mapping, monolith enforcement, and six-worker scanning with `--workers=N`.
- Continued validation after coverage failures so users receive diagnostics
  from later lint, monolith, and package-script stages.
- Consolidated successful validation output into one summary line instead of
  repeating the lint-success message.

### Portability and diagnostics

- Made package-script execution portable across Windows and Linux without
  relying on shell-specific npm executable assumptions.
- Added cross-platform process, workspace, path, and coverage regression
  coverage.
- Improved child-process lifecycle handling, bounded diagnostics, timing
  cleanup, and stable validation exit categories.

### Documentation and metadata

- Updated the public README contents, branding, requirements, migration, CLI
  usage, security, and generated-file guidance for the package's public
  consumer audience.
- Synchronized package and lockfile metadata for the 5.0.0 release.

## 4.0.1

### Documentation and metadata

- Corrected the public README branding, badges, and generated-file ignore
  guidance for the released CLI.
- Organized the normative contract under `specs/`, added the dedicated
  out-of-scope document, and added public documentation and consumer examples
  to the package.
- Added a package-relative Markdown link check and documented it in the
  development and release validation commands.
- Synchronized package and lockfile metadata for the 4.0.1 patch release.

### Validation and portability

- Made defined package-script validation portable on Windows without relying
  on shell execution when invoking npm.
- Added deterministic repository-convention validation for required structure,
  package metadata, local documentation links, specifications, environment
  examples, and consumer examples, with grouped exit-code-18 diagnostics and
  explicit path-level exceptions.

## 4.0.0

### Breaking changes

- Replaced the legacy public implementation with a thin native-ESM CLI and
  decomposed the runner into focused application, coverage, workspace,
  process, and validation modules.
- Removed the obsolete `index.mjs`, `index.d.ts`, and legacy top-level module
  entry points; consumers use the `eliware-test` executable.
- Node.js 26 or newer is required for the native-ESM CLI.
- Migration: set `test` to `eliware-test` and `lint` to `eliware-test --lint`;
  see the README migration guide for the complete upgrade steps.
- Enforced the mirrored `src/` and `tests/` module layout and added diagnostic
  reporting for missing source tests and orphaned test files.
- The previously available declaration and top-level implementation surfaces
  are no longer supported; the `eliware-test` CLI is the only public consumer
  interface. The older exports and declarations described in 2.4.0 are
  historical and are not migration targets.

### Validation and coverage

- Preserved the normal test, 100×4 coverage, and Oxlint validation pipeline,
  with Jest running in-band by default and six parallel workers by default for
  monolith measurement; the worker count is configurable with `--workers=N`.
- Added optional `audit`, `pack`, `build`, and `typecheck` package-script
  checks after the existing validation stages. Undefined scripts are skipped;
  defined scripts must exit successfully; failures use wrapper exit code 17 as
  documented in `specs/cli.md`.
- Hardened coverage parsing and fail-closed evidence validation, including
  malformed statement, branch, function, and explicit line counters; freshness
  checks; focused coverage selection; and fallback handling.
- Promoted isolated coverage results by overwriting the consumer's `coverage/`
  directory with the latest run; previous coverage is not backed up.
- Limited monolith traversal to relevant source and test roots while retaining
  depth, file-count, symlink, and six-worker safeguards.
- Enabled monolith-size enforcement for normal CLI runs; `--ignore-monolith-limits`
  remains an explicit diagnostic or refactoring bypass.
- Enforced exact source/test mapping diagnostics, including absent-root handling
  and validation of injected mapping results.

### Diagnostics and portability

- Improved bounded, deduplicated failure diagnostics, timing cleanup, output
  normalization, and child-process timeout escalation.
- Removed the historical argument-forwarding debug output; `ELIWARE_TEST_DEBUG=1`
  now emits only the fixed coverage-fallback diagnostic.
- Restricted package-script failures to normalized workspace diagnostics and
  invokes npm's CLI through the current Node executable on Windows, avoiding
  shell-dependent `npm.cmd` resolution.
- Preserved injectable process collaborators through the Jest execution stage
  and forwarded lint timing diagnostics correctly.
- Hardened focused-path validation with physical-target containment checks,
  final realpath revalidation, and missing-path rejection without broad-suite
  fallback.
- Added broad Windows/Linux regression coverage for focused paths, runtime
  resolution, workspace discovery, package scripts, process seams, and
  coverage paths.
- Removed obsolete analyzer suppressions and retained explicit tests for the
  intentional coverage edge cases they had previously obscured.

## Historical pre-4.0 releases

The APIs, declaration files, and argument-forwarding debug behavior described
below are historical and are not available in 4.x.

## 3.0.0

- Tightened focused-test handling so only conventional test and spec paths use
  strict `--runTestsByPath` selection; source-like paths retain Jest semantics.
- Preserved the full inherited environment when launching Jest and Oxlint,
  matching direct npm/Jest behavior across consumer workspaces.
- Made near-complete annotated coverage values fail closed, completed parser
  declarations, and added regression coverage for rounding and delegated Jest
  option values.
- Clarified coverage fallback freshness, bounded parsing, orchestration API
  stability, output ownership, and accepted percentage grammar.

## 2.4.0

- Added detailed Istanbul JSON coverage-gap diagnostics with uncovered lines,
  statements, branches, functions, and normalized workspace paths.
- Added strict focused-test path validation and mirrored source coverage
  scoping, while preserving broad enforcement for ambiguous selections.
- Added `--ignore-100x4` for explicit diagnostic coverage-enforcement bypasses
  and `--no-runInBand` for explicit parallel Jest diagnostics.
- Added `--version`/`-v`, public parser and orchestration exports, TypeScript
  declarations, and executable-level regression coverage.
- Hardened subprocess diagnostics with bounded, deduplicated output and
  reliable failure handling; lint warnings now fail validation.
- Clarified coverage semantics: annotated percentages use two-decimal raw-ratio
  rounding, while percentage-only values must be exactly 100%; malformed
  function metadata is handled safely as best-effort diagnostics.
- Normalized workspace-setup failures across combined and lint-only commands,
  expanded Jest value-option handling, and documented focused-path mapping and
  coverage-artifact boundaries.
- Added consumer guidance and CI typechecking.

## 2.3.1

- Fixed zero-valued text coverage metrics being treated as complete, ensuring
  fallback coverage reports still enforce the 100×4 gate.
- Fixed valid but unusable coverage JSON falling through to a false success by
  falling back to text coverage when no instrumented entries are present.
- Enforced Oxlint warnings as failures with `--deny-warnings` in both combined
  and lint-only commands.
- Added regression coverage for empty coverage JSON and zero-valued metrics.

## 2.3.0

- Focused test paths now execute only the requested files and fail closed when
  a requested path is missing, preventing an accidental full-suite run.
- Focused coverage now maps unambiguously mirrored test paths to their source
  files, while unmappable selections retain broad coverage enforcement.
- Protected wrapper-managed Jest flags now fail early with actionable guidance
  instead of being forwarded ambiguously.
- Test failures now report failure diagnostics without additional coverage
  noise, and subprocess output remains bounded to keep agent-facing output
  concise.
- Hardened coverage parsing for malformed JSON and sparse statement maps while
  preserving detailed gap diagnostics.
- Added regression coverage for focused selection, argument validation,
  coverage handling, failure output, and subprocess behavior.

## 2.2.0

- Focused test paths following the standard mirrored layout now scope coverage
  enforcement to their matching source files, avoiding misleading gaps from
  imported modules.
- Unmappable focused paths retain the full coverage gate rather than weakening
  enforcement.
- Test failures now suppress coverage parsing and coverage-table output so the
  failure diagnostics remain the only actionable result.
- Protected wrapper-managed Jest flags now fail early with an actionable
  message, and subprocess capture remains bounded throughout execution.
- Added regression coverage for scoped and fallback behavior, with documentation
  for the focused coverage contract.

## 2.1.4

- Added explicit `--ignore-100x4` coverage-enforcement opt-out for diagnostic
  and transitional runs while retaining test, lint, and coverage collection.
- Added regression coverage for parsing and executing the coverage opt-out.

## 2.1.3

- Added `eliware-test --version` and `eliware-test -v` to report the package
  version directly from `package.json` without running the test suite.
- Added regression coverage for both version flags.

## 2.1.2

- Fixed multi-file focused test execution by using Jest's strict
  `--runTestsByPath` mode for file-only selections.
- Added regression coverage confirming focused paths do not run unrelated
  suites.

## 2.1.1

- Improved command-line usability with `--help`/`-h`, direct-invocation
  separator handling, and clear rejection of invalid lint combinations.
- Added focused-test path validation to prevent an invalid path from silently
  running the broad suite.
- Added opt-in `ELIWARE_TEST_DEBUG=1` diagnostics for troubleshooting exact
  Jest argument forwarding.
- Added regression coverage for focused arguments and Windows npm shims.

## 2.1.0

- Added exact-commit secondary validation guidance using a disposable
  worktree, bounded execution, cleanup, and the full local validation suite.
- Improved agent-facing diagnostics with bounded subprocess output,
  deduplicated failures, normalized coverage paths, and detailed JSON coverage
  gap reporting.
- Added default workspace exclusions and a non-failing warning when a
  consuming repository lacks `.gitignore`.
- Documented the self-test script exception and the consumer migration
  contract.
- Added clearer argument UX with help output, separator handling, focused-path
  validation, and opt-in debug reporting for forwarded Jest arguments.

## 1.0.3

- Expanded JSON coverage diagnostics with per-metric percentages, uncovered
  lines, exact locations, function names, and test-fix guidance.
- Added safe workspace exclusions, missing-`.gitignore` warnings, bounded
  subprocess output, deduplicated failures, and normalized coverage paths.

## 1.0.2

- Enabled Jest's `--detectOpenHandles` option in the default test command.
- Added regression coverage confirming the option is forwarded to Jest.

## 1.0.1

- Fixed Jest and Oxlint resolution for consumers after a normal `npm ci`,
  including npm-hoisted dependency layouts on Windows and Linux.
- Added declaration typechecking and aligned package documentation with the
  current Eliware conventions.

## 1.0.0

- Scaffolded the `@eliware/test` package and CLI entrypoint.
- Added bundled Jest/Oxlint orchestration, focused-test forwarding, concise
  output, coverage-gap filtering, and cross-platform process handling.
- Historical pre-release validation (for 1.0.0 only) recorded tests with 100%
  statements, branches, functions, and lines coverage; lint with zero warnings;
  npm audit with zero moderate-or-higher vulnerabilities; package smoke import;
  and npm pack dry-run. These are historical records, not current application
  gates.
- Cross-platform CI passed on Ubuntu and Windows in run
  [32702565402](https://github.com/eliware/test/actions/runs/32702565402).
