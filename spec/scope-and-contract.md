# Scope and package contract

## 1. Scope and status

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects.

This document is part of the normative contract for the published CLI.

## 2. Supported environment and package contract

- Source and tests use native ESM and `.mjs` files; Node.js 26 or newer is
  required.
- The supported consumer set is Eliware's internal projects using the approved
  package managers and standard workspace installation layout.
- Jest and Oxlint are runtime dependencies and are resolved from the consumer
  workspace using their package contracts.
- The package exposes the `eliware-test` executable.
- Package metadata, lockfile, README, release notes, and packed-file allowlist
  must remain synchronized.
- Consumers use `eliware-test` for `test` and `eliware-test --lint` for `lint`.
- Process execution uses Node child-process APIs and argument arrays, not Unix
  pipelines, shell quoting, `grep`, or platform-specific executable names.

## 3. CLI boundary and orchestration

The supported consumer boundary is the `eliware-test` executable. Consumers
replace their `npm test` command with this CLI.

The intended implementation structure is layered orchestration:

- `runToolkit` is the thin public boundary and main lifecycle orchestrator.
- `runToolkitPreflight` orchestrates preflight operations.
- `runToolkitExecution` orchestrates Jest execution operations.
- `runPostTestValidation` orchestrates post-test validation operations.
- Single-purpose modules beneath those stage orchestrators perform cleanup,
  coverage, lint, monolith checks, reporting, timing, and related operations.

Stage orchestrators may coordinate subordinate operations. They must remain
focused on sequencing and data flow; substantive operations belong in the
dedicated modules beneath them. This is the intentional orchestration
boundary.
