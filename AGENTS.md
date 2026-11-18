# AGENTS.md

## Project

`@eliware/test` validates Eliware repositories with deterministic checks.
Eliware owns this repository.

## Scope and boundaries

Run checks for profiles in `package.json.eliware.apply`.
Keep semantic reviews outside this package.

## Layout

Keep source modules in `src/`.
Keep launchers in `bin/`.
Keep tests in `tests/`.
Keep fixtures in `test-fixtures/`.
Keep guides in `docs/`.
Keep specifications in `specs/`.

## Development

Use Node.js 26 or newer and native ESM.
Give each source and test module one cohesive purpose.
Mirror each `src/` `.mjs` file with one same-path `tests/` `.test.mjs` file.

## Validation

Run `npm test` for aggregate validation.
Run `npm run lint` for lint checks.
Run `npm run audit` for dependency checks.
Run `npm run format` to format files.
Run `npm run format:check` to check formatting.

## Security

Keep credentials, secrets, private data, and runtime state out of Git.

## Changes

Describe every user-visible change in `RELEASE_NOTES.md`.

## Application

Run focused tests first during development.
Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Prevent repeated full-suite runs during development.
Run the full `npm test` suite for final validation before a commit, milestone, or release.

## CLI

Document CLI commands and exit codes in `README.md` and [the usage guide](docs/usage.md).

## npm publication

Use `.github/workflows/npm.yaml` for package publication.
Follow the approved release process before publication.
