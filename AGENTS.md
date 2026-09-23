# AGENTS.md

## Project

Purpose: provide the Eliware Test repository's Node.js 26 validation CLI, implemented as native ESM `.mjs` modules.

## Scope and boundaries

These repository-wide instructions govern the project. The project validates consumer repositories and does not publish, deploy, release, synchronize, or modify external systems. Keep project-specific guidance within this scope.

## Layout

Keep `src/` and `tests/` mirrored, preserve native ESM module structure, and keep specifications, implementation, tests, and documentation aligned.

## Development

Read the relevant README.md, specifications, implementation, and tests before changing behavior. Check subdirectory instructions before editing nested files.

Repository requirements are owned by eliware/conventions, documentation by eliware/docs, and operational procedures by eliware/operations.

## Validation

Use Node.js 26. Run `npm test` for aggregate validation; it includes Jest, lint, format-check, audit, and package checks. Use `npm run lint`, `npm run format`, `npm run format:check`, `npm run audit`, or `npm run pack` for targeted stages, and use `git diff --check` for whitespace validation. The CLI entrypoint is `bin/eliware-test.mjs`; public commands include `--help`, `--version`, `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.

## Security

Protect credentials, tokens, secrets, and machine-specific values. Never commit secret values; use defensive environment copies and redact sensitive child-process output.

## Changes

Make actionable, current, concise changes within the requested scope. Preserve contract behavior, regression tests, machine-readable specifications, and documented authorization boundaries.

Application concerns: document relevant configuration, shutdown behavior, and workflow boundaries when changing application-facing validation.

## Approved deviations

Record every approved deviation or exception with its reason, approver, and expiry. Do not use deviations to weaken shared requirements.

## Subdirectory instructions

No more-specific subdirectory instructions currently apply. Check for a nearer `AGENTS.md` before changing files in a subdirectory.
