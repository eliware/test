# AGENTS.md

## Project

Purpose: provide the Eliware Test repository's Node.js 26 validation CLI, implemented as native ESM `.mjs` modules.

## Scope and boundaries

These repository-wide instructions govern the project. The project validates consumer repositories and does not publish, deploy, release, synchronize, or modify external systems. Important boundaries: these instructions include only this repository's validation CLI and exclude authority over consumer repositories or external systems; keep project-specific guidance within this scope.

## Layout

Keep `src/` and `tests/` mirrored, preserve native ESM module structure, and keep specifications, implementation, tests, and documentation aligned.

## Development

Read the relevant README.md, specifications, implementation, and tests before changing behavior. This AGENTS.md applies repository-wide; nearer AGENTS.md instructions apply within their subdirectories, so check them before editing nested files.

Repository requirements are owned by eliware/conventions, documentation by eliware/docs, and operational procedures by eliware/operations.

## Validation

Use Node.js 26. Run `npm test` for aggregate validation; it includes Jest, lint, format-check, audit, and package checks. Use `npm run lint`, `npm run format`, `npm run format:check`, `npm run audit`, or `npm run pack` for targeted stages, and use `git diff --check` for whitespace validation. The CLI entrypoint is `bin/eliware-test.mjs`; public commands include `--help`, `--version`, `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.

## Security

Protect credentials, tokens, secrets, and machine-specific values. Never commit secret values; use defensive environment copies and redact sensitive child-process output.

## Changes

Make actionable, current, concise changes within the requested scope. Preserve contract behavior, regression tests, machine-readable specifications, and documented authorization boundaries.

Record approved deviations or exceptions with their reason, approver, and expiry; do not use them to weaken shared requirements. Check for nearer AGENTS.md instructions before changing nested files. When changing application-facing validation, document relevant configuration, shutdown behavior, and workflow boundaries.

## Application

The application entrypoint is `bin/eliware-test.mjs`. Validation runs locally or in CI; it does not publish, deploy, release, synchronize, or modify external systems. The CLI has no runtime configuration files or environment settings; `package.json.eliware.apply` is repository metadata, and CLI options are arguments rather than runtime configuration. Preserve these boundaries and safe process shutdown when changing application behavior.

## CLI

The executable `eliware-test` maps to `bin/eliware-test.mjs`. `--help` prints usage and `--version` reports the package version; informational commands must be used alone. Public modes are `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`; validation modes are mutually exclusive. The five tool modes forward extra arguments to Oxlint, Prettier, npm audit, or npm pack, with wrapper arguments before arguments supplied after `--`. The default behavior with no arguments runs the aggregate validation stages. With no tool mode, at most one focused test path under `tests/` may be supplied; it runs only that test and applicable focused validation. With no focused path, `npm test` runs the aggregate stages. Invalid paths, multiple focused paths, combined tool modes, and unsupported argument combinations fail with a non-zero code. Exit codes are 0 (success), 8 (Jest), 10 (coverage), 12 (lint), 14 (internal), 17 (package), and 18 (convention/configuration/argument/format). Node.js 26 with npm is required; Windows, macOS, and Linux are intended targets, while CI currently validates Ubuntu. `--format` writes formatted files; use `--format-check` for a read-only check. `--pack` validates package contents and does not publish. No CLI mode authorizes release, deployment, or other external changes.

## npm publication

The package is public as `@eliware/test`; `package.json.version` is the source of truth for its release version, currently `8.0.0` (not yet published). Its exact `package.json.files` allowlist is `bin/`, `src/`, `specs/`, `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, and `RELEASE_NOTES.md`. Validate packed contents with `node bin/eliware-test.mjs --pack` or `npm run pack`; the pack validation must pass before publication. The publication workflow must use npm provenance and verify that the exact package version exists in the public registry as defined by the release procedure. Publication requires explicit authorization through the applicable Eliware Operations handoff; these instructions do not authorize publishing.
