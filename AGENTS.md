# AGENTS.md

## Project

Purpose: provide the Eliware Test repository's Node.js 26 validation CLI, implemented as native ESM `.mjs` modules.

## Scope and boundaries

These repository-wide instructions govern the project. This repository owns the validation CLI only; its boundaries exclude consumer repository requirements and implementation. It does not publish, deploy, release, synchronize, or modify external systems. Keep project-specific guidance within the validation CLI scope.

## Layout

Keep `src/` and `tests/` mirrored, preserve native ESM module structure, and keep specifications, implementation, tests, and documentation aligned.

## Development

Before changing files, read README.md, this AGENTS.md, any applicable nearer AGENTS.md instructions, and applicable documentation, specifications, implementation, and tests. This AGENTS.md applies repository-wide; nearer AGENTS.md instructions apply within their subdirectories, so check them before editing nested files.

Every source and test module must have a single responsibility: one cohesive purpose and one reason to change. Business-logic modules and coordinators are both valid, including coordinators of coordinators, when each module does only its own responsibility. When a change introduces a distinct responsibility, create a focused submodule with a mirrored test and wire it through its owner; do not add the new responsibility to an existing module. During ordinary review, do not ignore mixed responsibilities you notice; refactor them as part of the change. The enforced maxima of 100 source lines and 200 test lines are separate blocking limits: passing them does not prove a module is cohesive or permit mixed responsibilities.

Shared repository requirements are maintained in `specs/conventions/`, and operational procedures are documented in eliware/operations.

## Validation

Use Node.js 26 and npm 12 or later. `eliware-test` checks the active npm version before validation; `--help` and `--version` remain available independently. Run `npm test` for aggregate validation; it includes Jest, lint, format-check, audit, and package checks. Use `npm run lint`, `npm run format`, `npm run format:check`, `npm run audit`, or `npm run pack` for targeted stages (`pack` is available in this npm-published repository). `npm run format` writes formatted files; use `npm run format:check` for read-only formatting validation. As optional supplemental whitespace hygiene, you may run `git diff --check`; it is not an eliware-test validation stage. The CLI entrypoint is `bin/eliware-test.mjs`; public commands include `--help`, `--version`, `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.

## Security

Protect credentials, tokens, secrets, and machine-specific values. Never commit secret values; use defensive environment copies and redact sensitive child-process output.

## Changes

Make actionable, current, concise changes within the requested scope. Preserve contract behavior, regression tests, machine-readable specifications, and documented authorization boundaries.

Project-specific guidance may add requirements, but it must not weaken or silently reinterpret shared conventions. Document any approved deviation and its scope. Check for nearer AGENTS.md instructions before changing nested files. When changing application-facing validation, document relevant configuration, shutdown behavior, and workflow boundaries.

## Application

The application entrypoint is `bin/eliware-test.mjs`. Validation runs locally or in CI; it does not publish, deploy, release, synchronize, or modify external systems. The CLI has no runtime configuration files or environment settings; `package.json.eliware.apply` is repository metadata, and CLI options are arguments rather than runtime configuration. Preserve these boundaries and safe process shutdown when changing application behavior.

## CLI

The executable `eliware-test` maps to `bin/eliware-test.mjs`. `--help` prints usage and `--version` reports the package version; informational commands must be used alone. Public modes are `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`; validation modes are mutually exclusive. `--debug-timing` is wrapper-owned: it may appear once before a focused path or tool mode (or alone for aggregate validation) and is rejected after `--`; arguments after `--` are forwarded to the selected tool subject to its allowlist. Each tool mode has a specific argument policy: lint accepts only `--threads=<positive-count>`, audit accepts only `--no-fund` and `--no-progress`, scope-changing audit options such as `--omit` are rejected, and format/format-check/pack use their own allowlists. Formatting modes reject positional file paths and use the wrapper-owned repository scope. Tool arguments must follow the mode flag or the `--` separator; arguments before the mode flag are rejected. The default behavior with no arguments runs the aggregate validation stages. With no tool mode, at most one repository-relative `.test.*` or `.spec.*` test file under `tests/` may be supplied before an optional `--` separator; paths after the separator are rejected. POSIX, drive-qualified, and UNC absolute paths are rejected. Test files with `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, or `.cts` extensions are supported and run only that test with applicable focused validation. With no focused path, `npm test` runs the aggregate stages. Invalid paths, multiple focused paths, combined tool modes, and unsupported argument combinations fail with a non-zero code. Exit codes are 0 (success), 8 (Jest), 10 (coverage), 12 (lint), 14 (internal), 17 (package), and 18 (convention/configuration/argument/format); rejected wrapper or forwarded tool arguments and unsupported mode combinations return 18. Node.js 26 with npm is required. Supported platforms are Windows, macOS, and Linux. Validation evidence: Windows is exercised during development and CI validates Ubuntu. macOS compatibility is inferred from Ubuntu's POSIX filesystem behavior; the project does not claim direct macOS validation. `--format` writes formatted files; use `--format-check` for a read-only check. `--pack` validates package contents and does not publish. No CLI mode authorizes release, deployment, or other external changes.

Formatting modes reject positional file paths and use the wrapper-owned repository scope. With no tool mode, a focused test path must appear before an optional `--` separator; test paths after the separator are rejected rather than forwarded to Jest.

## npm publication

The package is public as `@eliware/test`; `package.json.version` is the source of truth for its release version. Its exact `package.json.files` allowlist is `bin/`, `src/`, `specs/`, `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, and `RELEASE_NOTES.md`. Validate packed contents with `node bin/eliware-test.mjs --pack` or `npm run pack`; the pack validation must pass before publication. The publication workflow must use npm provenance and verify that `@eliware/test` at the exact `package.json.version` is visible in the public npm registry at `registry.npmjs.org`. Eli and the project developer run TagIt preflight together; Eli decides whether the result is release-ready and instructs DevOps; DevOps executes the release. Publication requires explicit authorization through the applicable Eliware Operations handoff; these instructions do not authorize publishing.
