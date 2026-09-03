# Release notes

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
- Pre-release validation passed: tests with 100% statements, branches,
  functions, and lines coverage; lint with zero warnings; npm audit with zero
  moderate-or-higher vulnerabilities; package smoke import; and npm pack
  dry-run.
- Cross-platform CI passed on Ubuntu and Windows in run
  [32702565402](https://github.com/eliware/test/actions/runs/32702565402).
