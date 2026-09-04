# Scope and package contract

## 1. Scope and status

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects. It is a
development tool, not a replacement for project-specific smoke, integration,
regression, end-to-end, deployment, or product tests.

This document is part of the normative contract for the published CLI.
Intentional limitations describe supported behavior that is deliberately
constrained. Out of scope identifies behavior this package does not promise.

## 2. Supported environment and package contract

- Source and tests use native ESM and `.mjs` files; Node.js 26 or newer is
  required.
- Jest and Oxlint are runtime dependencies and are resolved from the consumer
  workspace using their package contracts.
- The package exposes the `eliware-test` executable.
- Package metadata, lockfile, README, release notes, and packed-file allowlist
  must remain synchronized.
- Consumers use `eliware-test` for `test` and `eliware-test --lint` for `lint`.
- Process execution uses Node child-process APIs and argument arrays, not Unix
  pipelines, shell quoting, `grep`, or platform-specific executable names.
