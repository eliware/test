# Scope and package contract

## 1. Scope and status

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects.

This document is part of the normative contract for the published CLI.

## 2. Supported environment and package contract

- The package's implementation and canonical source/test architecture use
  native ESM and `.mjs` files; Node.js 26 or newer is required. Focused-path
  validation also accepts the documented JavaScript and TypeScript extensions
  under conventional test directories; those paths are outside the strict
  source/test bijection.
- The supported consumer set is Eliware's internal projects using npm and the
  conventional `node_modules` installation layout. Compatibility with other
  package managers or nonstandard installation layouts is not promised.
- Jest and Oxlint are npm runtime dependencies and are resolved from the consumer
  workspace using their package contracts.
- The package exposes the `eliware-test` executable.
- Package metadata, lockfile, README, release notes, and packed-file allowlist
  must remain synchronized.
- Consumers use `eliware-test` for `test` and `eliware-test --lint` for `lint`.
- Process execution uses Node child-process APIs and argument arrays, not Unix
  pipelines, shell quoting, `grep`, or platform-specific executable names.
  The exported `runToolkit` and `runLint` functions exist to provide injectable
  test seams; they are not supported consumer APIs.

## 3. CLI boundary

The supported consumer boundary is the `eliware-test` executable. Consumers
replace their `npm test` command with this CLI.

The CLI is the supported boundary. Internal module structure and orchestration
are implementation details; consumers must not import internal functions.
