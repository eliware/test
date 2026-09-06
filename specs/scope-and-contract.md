# Scope and package contract

## 1. Scope and status

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects.

This document is part of the normative contract for the published CLI.

## 2. Supported environment and package contract

- The package's implementation and canonical source/test architecture use
  native ESM and `.mjs` files; Node.js 26 or newer is required. Focused-path
  validation accepts the documented JavaScript and TypeScript extensions
  under conventional test directories.
- Consumers use npm and the conventional `node_modules` installation layout.
- Jest and Oxlint are npm runtime dependencies and are resolved from the consumer
  workspace using their package contracts.
- The package exposes the `eliware-test` executable.
- Package metadata, lockfile, README, release notes, and packed-file allowlist
  must remain synchronized.
- Consumers use `eliware-test` for `test` and `eliware-test --lint` for `lint`.
- Process execution uses Node child-process APIs and argument arrays, not Unix
  pipelines, shell quoting, `grep`, or platform-specific executable names.
- Internal orchestration and helper functions have documented, injectable
  result shapes for deterministic composition and testing; the CLI remains
  the consumer boundary.

## 3. CLI boundary

The supported consumer boundary is the `eliware-test` executable. Consumers
replace their `npm test` command with this CLI.

The CLI is the supported boundary. Internal modules are implementation seams,
and their documented result shapes exist for deterministic composition and
testing rather than as a second consumer-facing command interface.
