# AGENTS.md

## Project

Build the Eliware Test CLI with Node.js 26 or newer. Use native ESM.

## Scope and boundaries

This repository owns the validation CLI. It does not own consumer repositories.

- Do not publish, deploy, release, sync, or change external systems during validation.

## Layout

- Keep implementation modules in `src/` and launchers in `bin/`.
- Keep test files in `tests/`, fixtures in `test-fixtures/`, and examples in `examples/`.
- Give each source module one test file at the matching path in `tests/`.
- Keep each specification and document in its indexed folder.

## Development

- Give each source and test module one purpose.
- Put each task in its own module and add one matching test.
- Keep each coordinator responsible for its workflow.

## Validation

- Use Node.js 26 or newer and npm 12 or newer.
- Run `npm test` for aggregate validation.
- Run `npm run lint` for lint checks.
- Run `npm run audit` for audit checks.
- Run `npm run format` to format files.
- Run `npm run format:check` to check file format.
- Run `npm run pack` before publication.

## Security

- Prevent disclosure of credentials, tokens, secrets, private data, and machine-specific values.
- Redact sensitive child-process output.

## Changes

- Keep documentation current and instructions simple.
- Follow shared conventions and the Eliware Operations approval steps.

## Application

- The `eliware-test` executable runs `bin/eliware-test.mjs`.
- The CLI runs in a local terminal or in CI. It does not change external systems.
- The CLI has no runtime configuration or environment settings.
- Stop each child task and its descendants after a timeout.
- Run focused tests first during development.
- Run one test file with `npm test -- tests/path/to/example.test.mjs`.
- Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
- Avoid repeated full-suite runs during development.
- Run the full `npm test` suite for final validation before a commit, milestone, or release.

## CLI

- Use `--help` to read usage. Use `--version` to read the package version.
- With no arguments, run aggregate validation.
- The CLI supports `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.
- Run informational commands alone. Do not combine validation modes.
- Put `--debug-timing` before a path or tool mode. Use it alone for aggregate validation.
- Without a tool mode, pass repository-relative test paths in `tests/`.
- Use these test file extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
- Put test paths before an optional `--`.
- Do not use absolute paths or pass test paths after `--`.
- Each focused run checks lint, format, and layout for the selected tests and their source modules.
- Lint accepts only `--threads=<positive-count>`.
- Audit accepts only `--no-fund` and `--no-progress`.
- Audit rejects options that change files or packages in scope. For example, it rejects `--omit`.
- Format, format-check, and pack use their own argument allowlists.
- Put tool arguments after the tool mode or after `--`.
- Do not put tool arguments before the tool mode.
- The `--format` and `--format-check` modes reject paths.
- The `--format` mode changes files. The `--format-check` mode checks files without changes.
- The `--pack` mode checks package contents. It does not publish.
- Aggregate validation runs lint, format, audit, outdated, pack, typecheck, build, conventions, and Jest in this order.
- Exit codes 0 through 4 mean success, general failure, Jest failure, unexpected output, and coverage failure.
- Exit codes 5 through 12 mean lint, format, audit, outdated, pack, typecheck, build, and convention failure.
- The CLI supports Windows, macOS, and Linux.
- Development tests Windows. CI tests Ubuntu. Ubuntu results support macOS compatibility claims.

## npm publication

The public package is `@eliware/test`. `package.json.version` sets its version.

- Include `src/`, `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, `RELEASE_NOTES.md`, `bin/`, and `specs/` in the package.
- Run package validation before publication.
- Follow the Eliware Operations publication checklist and approval steps.
