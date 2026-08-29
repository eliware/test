# Release notes

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

## Unreleased

- Scaffolded the `@eliware/test` package and CLI entrypoint.
- Added bundled Jest/Oxlint orchestration, focused-test forwarding, concise
  output, coverage-gap filtering, and cross-platform process handling.
- Pre-release validation passed: tests with 100% statements, branches,
  functions, and lines coverage; lint with zero warnings; npm audit with zero
  moderate-or-higher vulnerabilities; package smoke import; and npm pack
  dry-run.
- Cross-platform CI passed on Ubuntu and Windows in run
  [32702565402](https://github.com/eliware/test/actions/runs/32702565402).
