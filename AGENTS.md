# AGENTS.md

## Project

Build the Eliware Test CLI with Node.js 26 or later. Use native ESM.

## Scope and boundaries

This repository owns the validation CLI. It does not own consumer repositories.
Do not use validation to publish, deploy, release, sync, or change external systems.

## Layout

Keep implementation modules under `src/` and launchers under `bin/`.
Keep tests under `tests/`, fixtures under `test-fixtures/`, and examples under `examples/`.
For each `.mjs` file under `src/`, keep one `.test.mjs` file at the same path under `tests/`.
Keep each specification and document in its indexed folder.

## Development

Give each source and test module one clear purpose.
Put each separate task in its own module. Add one matching test.
Keep each coordinator responsible for its workflow.

## Validation

Use Node.js 26 or later and native ESM.
Run `npm test` for aggregate validation.
Run `npm run lint` when you need lint checks.
Run `npm run audit` when you need audit checks.
Run `npm run format` when you need to format files.
Run `npm run format:check` when you need to check file format.
Run `npm run pack` before publication review.

## Security

Protect credentials, tokens, secrets, private data, and machine-specific values.
Redact sensitive child-process output.

## Changes

Keep documentation current and instructions clear.
Follow shared conventions and the Eliware Operations approval process.

## Application

The `eliware-test` executable runs `bin/eliware-test.mjs`.
The CLI runs in a local terminal or in CI. It does not change external systems.
The CLI has no runtime configuration or environment settings.
Stop child processes and all processes that they start after a timeout.

## CLI

Use `--help` to read usage. Use `--version` to read the package version.
With no arguments, run aggregate validation.
The CLI supports `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.
Run informational commands alone. Do not combine validation modes.
Use `--debug-timing` once before a path or tool mode, or alone for aggregate validation.
Without a tool mode, pass one or more repository-relative test paths under `tests/`.
The CLI accepts test files with these extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
Put test paths before an optional `--`.
Do not use absolute paths.
Do not pass test paths after `--`.
Each focused run checks lint, format, and layout for each test and its source module.
Lint accepts only `--threads=<positive-count>`.
Audit accepts only `--no-fund` and `--no-progress`.
Audit rejects options that change the files or packages in scope, such as `--omit`.
Format, format-check, and pack use separate argument allowlists.
Put tool arguments after the tool mode or after `--`.
Do not put tool arguments before the tool mode.
The `--format` and `--format-check` modes reject paths.
The `--format` mode changes files. The `--format-check` mode checks files without changes.
The `--pack` mode checks package contents. It does not publish.
Aggregate validation runs lint, format, audit, outdated, pack, typecheck, build, conventions, and Jest in this order.
Exit codes are 0 for success, 1 for other failures, 2 for Jest, 3 for unexpected output, and 4 for coverage.
Codes 5 to 12 map to lint, format, audit, outdated, pack, typecheck, build, and convention failure.
The CLI supports Windows, macOS, and Linux.
We test Windows and Ubuntu. We use Ubuntu test results as evidence for macOS support.

## npm publication

The public package is `@eliware/test`; `package.json.version` sets its version.
Include `src/`, `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, `RELEASE_NOTES.md`, `bin/`, and `specs/` in the package.
Run package validation before publication review.
Follow the Eliware Operations publication checklist and approval process.
