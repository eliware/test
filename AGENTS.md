# AGENTS.md

## Project

Build `@eliware/test`, the Eliware repository validator, with Node.js 26 or newer and native ESM.

## Scope and boundaries

The package runs deterministic checks for repositories.
It does not run semantic reviews or publish releases.

## Layout

Keep implementation in `src/`, launchers in `bin/`, and tests in `tests/`.
Keep fixtures in `test-fixtures/`, user guides in `docs/`, and specifications in `specs/`.

## Development

Give each source and test module one purpose.
Mirror each `src/` `.mjs` file with exactly one same-path `tests/` `.test.mjs` file.

## Validation

Run `npm test` for aggregate validation.
Run `npm run lint`, `npm run audit`, `npm run format`, and `npm run format:check` as separate checks.

## Security

Do not expose credentials, secrets, or private data.

## Changes

Keep user guides current when behavior changes.

## Application

Run focused tests first during development.
Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Prevent repeated full-suite runs during development.
Run the full `npm test` suite for final validation before a commit, milestone, or release.

## CLI

Use README.md and docs/ for CLI usage instructions.

## npm publication

Follow Eliware Operations procedures for release approval.
