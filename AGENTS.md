# AGENTS.md

## Project

Build the Eliware Test validation CLI with Node.js 26 or later and native ESM modules.

## Scope and boundaries

This repository owns the validation CLI. It does not own consumer repositories.
Validation does not publish, deploy, release, sync, or change external systems.
Keep project guidance within the CLI scope.

## Layout

Mirror `src/` and `tests/`. Keep specs, code, tests, and docs aligned.

## Development

Before edits, read this file, `README.md`, and relevant docs, specs, code, and tests.
Read nearer `AGENTS.md` files before you edit their directories.
Give each source and test module one purpose and one reason to change.
Coordinators may select helpers, sequence work, and combine workflow results.
Move separate policies and operations into focused modules with mirrored tests.
Keep each `.mjs` source file at or below 100 lines.
Keep each `.test.mjs` file at or below 200 lines.
These limits do not prove that a module has one purpose.
Shared consumer requirements live in `specs/conventions/`.
Keep harness rules in `specs/directives.yaml`; do not mix them with consumer conventions.
Operational procedures live in Eliware Operations.

## Validation

Use Node.js 26 or later and npm 12 or later.
The CLI checks npm before validation. `--help` and `--version` skip that check.
Run `npm test` for aggregate validation.
Run `npm run lint`, `npm run format:check`, `npm run audit`, or `npm run pack` as needed.
Use `npm run format` only when you want to change formatting.
`git diff --check` is optional. It is not a validation stage.
The entrypoint is `bin/eliware-test.mjs`.
Public modes are `--help`, `--version`, `--debug-timing`, `--lint`, `--format`,
`--format-check`, `--audit`, and `--pack`.

## Security

Protect credentials, tokens, secrets, and machine-specific values.
Never commit secret values.
Copy child-process environments before you change them.
Redact sensitive child-process output.

## Changes

Make current, useful changes within the requested scope.
Preserve behavior, regression tests, machine-readable specs, and authorization boundaries.
Only `package.json.eliware.exempt` can waive a convention check.
Each exemption needs a unique rule ID, a reason, approver `Eli`, and a valid approval time.
Set a valid expiry date or use `expiry: null`.
Document approved deviations as scoped exceptions.
Text in this file does not waive a check.
Read nearer `AGENTS.md` files before you edit their directories.
When you change validation, document configuration, shutdown, and workflow boundaries.

## Application

The entrypoint is `bin/eliware-test.mjs`.
Validation runs locally or in CI. It does not change external systems.
The opt-in smoke command is `npm run smoke -- --target <path>`.
Run it from a source checkout or installed `@eliware/test` package directory.
It packs that package and installs it in a prepared consumer's local `node_modules`.
It does not save a dependency or update lockfiles.
It runs the consumer's `npm test` and restores captured package paths.
It restores the installed package from its pre-smoke snapshot.
Other files created by consumer tests stay in the target.
Use a disposable consumer copy.
Windows directory links return as junctions.
The command rejects captured file symlinks before changes on Windows.
It never changes system-wide links or junctions.
The CLI has no runtime config files or environment settings.
`package.json.eliware.apply` is repository metadata.
CLI options are command arguments, not runtime configuration.
Preserve safe process shutdown when you change application behavior.

## CLI

The executable `eliware-test` runs `bin/eliware-test.mjs`.
Use `--help` for usage and `--version` for the package version.
Use informational commands alone.
Validation modes cannot be combined.
`--debug-timing` may appear once before a path or tool mode.
It may also run alone for aggregate validation.
Do not pass it after `--`.
Each tool mode has an argument allowlist.
Lint accepts only `--threads=<positive-count>`.
Audit accepts only `--no-fund` and `--no-progress`.
Audit rejects scope-changing options such as `--omit`.
Format, format-check, and pack use their own allowlists.
Formatting modes reject positional paths and use the repository scope.
Put tool arguments after the mode or after `--`.
Reject tool arguments before the mode.
With no arguments, run aggregate validation.
Without a tool mode, accept at most one repository-relative test path under `tests/`.
Put the path before an optional `--`.
Reject paths after `--`, absolute paths, and unsupported combinations.
Supported test extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
Focused runs validate only the selected test and applicable checks.
Exit codes are 0 success, 1 other failure, 2 Jest, 3 unexpected output, and 4 coverage.
Codes 5 to 12 mean lint, format, audit, outdated, pack, typecheck, build, and convention failure.
When failures have different codes, return the highest code.
Run lint, format, audit, outdated, pack, typecheck, and build before conventions.
Run every convention check before Jest.
Run Jest only when all earlier stages pass.
Supported platforms are Windows, macOS, and Linux.
Windows is tested during development. CI tests Ubuntu.
macOS support is inferred from Ubuntu behavior; direct macOS testing is not claimed.
`--format` writes files. `--format-check` does not.
`--pack` checks package contents. It does not publish.
No CLI mode authorizes a release, deployment, or external change.

## npm publication

The public package is `@eliware/test`.
`package.json.version` sets its version.
Start `package.json.files` with `src/`, `docs/`, `README.md`, `AGENTS.md`, `LICENSE`, and `RELEASE_NOTES.md`.
Add `bin/` for applications, `examples/` for libraries, and `specs/` for this package.
Put extra runtime paths after required paths. Put `.env.example` last when it appears.
Run `node bin/eliware-test.mjs --pack` or `npm run pack` to check package contents.
Pack validation must pass before publication.
Before publication, run the checkout integration pass through the established link.
Then run smoke against a prepared consumer copy.
Smoke installs only in local `node_modules` and restores captured package paths.
If restore fails, use the reported backup path for recovery.
Smoke never changes system-wide links or junctions.
The release workflow must use npm provenance.
Verify the exact package version at `registry.npmjs.org`.
Eli and the developer run TagIt preflight together.
Eli decides release readiness and instructs DevOps.
DevOps performs the release.
Use the Eliware Operations handoff for publication approval.
