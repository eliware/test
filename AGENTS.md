# Instruction scope

These instructions apply repository-wide to the Eliware Test validation CLI and its source, specifications, tests, and README.md.

# Read before changing

Read the relevant README.md, specifications, implementation, and tests before changing behavior. Check subdirectory instructions before editing nested files.

# Authoritative sources

Repository requirements are owned by eliware/conventions, documentation by eliware/docs, and operational procedures by eliware/operations. Treat those sources and the checked-in specs as authoritative.

# Repository identity

Purpose: provide the Eliware Test repository's Node.js 26 validation CLI, implemented as native ESM `.mjs` modules.

# Scope and boundaries

The project validates consumer repositories and does not publish, deploy, release, synchronize, or modify external systems. Keep project-specific guidance within this scope and do not weaken shared requirements.

# Required structure

Keep `src/` and `tests/` mirrored, preserve native ESM module structure, and keep specifications, implementation, tests, and documentation aligned.

# Security and secrets

Protect credentials, tokens, secrets, and machine-specific values. Never commit secret values; use defensive environment copies and redact sensitive child-process output.

# Validation

Use Node.js 26. Run `npm test` for aggregate validation; it includes Jest, lint, format-check, audit, and package checks. Use `npm run lint`, `npm run format`, `npm run format:check`, `npm run audit`, or `npm run pack` for targeted stages, and use `git diff --check` for whitespace validation. Public CLI entrypoints and commands include `--help`, `--version`, `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.

# Approved deviations

Record every approved deviation or exception with its reason, approver, and expiry. Do not use deviations to weaken shared requirements.

# Change control and authorization

Make actionable, current, concise changes within the requested scope. Preserve contract behavior, regression tests, machine-readable specifications, and documented authorization boundaries.

# Subdirectory instructions

No more-specific subdirectory instructions currently apply. Check for a nearer `AGENTS.md` before changing files in a subdirectory.

## Application concerns

Document relevant configuration, shutdown behavior, and workflow boundaries when changing application-facing validation.
