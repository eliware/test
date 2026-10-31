# AGENTS.md

## Project

`@eliware/test` validates Eliware repositories with deterministic checks.
Eliware owns this repository.

## Scope and boundaries

Run checks for the profiles in `package.json.eliware.apply`.
Keep semantic reviews outside this package.

## Layout

Keep source modules in `src/`, launchers in `bin/`, tests in `tests/`, fixtures in
`test-fixtures/`, guides in `docs/`, and specifications in `specs/`.

## Development

Give each source and test module one cohesive purpose.
Mirror each `src/` `.mjs` file with exactly one same-path `tests/` `.test.mjs` file.

## Validation

Use Node.js 26 or newer and native ESM.
Run `npm test` for aggregate validation.
Run `npm run lint` for lint checks.
Run `npm run audit` for dependency checks.
Run `npm run format` to format files.
Run `npm run format:check` to check formatting.

## Security

Keep credentials, secrets, private data, and runtime state out of Git.

## Changes

Update user guides and `RELEASE_NOTES.md` when behavior changes.

## Application

Run focused tests first during development.
Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Prevent repeated full-suite runs during development.
Run the full `npm test` suite for final validation before a commit, milestone, or release.

## CLI

Document CLI commands and exit codes in `README.md` and `docs/usage.md`.

## npm publication

Use `.github/workflows/npm.yaml` for package publication.
Follow the approved release process before publication.
