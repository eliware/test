# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

@eliware/test [![npm](https://img.shields.io/npm/v/@eliware/test)](https://www.npmjs.com/package/@eliware/test) [![License](https://img.shields.io/github/license/eliware/test)](https://github.com/eliware/test/blob/main/LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/test/actions/workflows/ci.yaml)

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Configuration](#configuration)
- [Operations](#operations)
- [Commands](#commands)
- [Exit codes](#exit-codes)
- [Support](#support)
- [License](#license)
- [Links](#links)

## Features

The CLI checks repository structure, documentation, conventions, and profiles.
It selects validation stages from `package.json.eliware.apply`.
Jest and coverage run when the applied profile requires them.
Package checks run for the `npm-published` profile.
Eliware Test owns this CLI, not the repositories that it checks.
It does not run live operational checks.

Package description: Shared deterministic repository validation for Eliware projects
Author: Eliware <eliware@eliware.org>
License: MIT

## Requirements

Use Node.js 26 and npm 12 or later.
The CLI checks the npm version before validation.
It stops when npm is too old or its version is unknown.
`--help` and `--version` skip this check.

## Setup

Install locked dependencies for development:

```text
npm ci
```

Install the public package in a consumer repository:

```text
npm install --save-dev @eliware/test
```

Use Node.js 26 (`>=26 <27`) and npm 12 or later.

## Usage

Run validation in a consumer repository:

```text
eliware-test
eliware-test --help
eliware-test --version
eliware-test --debug-timing
eliware-test --lint
eliware-test --format
eliware-test --format-check
eliware-test --audit
eliware-test --pack
eliware-test tests/example.test.mjs
```

Package-maintainer commands need this checkout:

```text
npm test
npm run lint
npm run format
npm run format:check
npm run audit
npm run pack
node bin/eliware-test.mjs --pack
```

The `--pack` mode is available everywhere.
It checks package contents only for the `npm-published` profile.
The `npm run pack` script is required for this package and that profile.

Run the opt-in smoke command from this checkout or an installed package:

```text
npm run smoke -- --target ../consumer-copy
```

The target must be an existing, disposable consumer repository.
Smoke does not create or prepare the target.
It packs this package, installs the tarball, runs the consumer's `npm test`,
and restores the package paths that it changed.
It installs in local `node_modules` without saving dependencies or changing lockfiles.
It restores the manifest, lockfiles, package directory, and local executable shims.
Other files created by consumer tests remain in the target.
Use a disposable copy or worktree.
Smoke rejects targets inside this checkout, including links to it.
If restore fails, it reports the backup path for recovery.
It omits only the unpublished candidate from the outdated check.
It does not touch system-wide links, create copies, or create worktrees.
Windows directory links return as junctions.
Smoke rejects a captured file link before changes on Windows.

The npm-published profile defines the package file allowlist.
The general profile does not add files to that allowlist.
Include `specs/` only when package runtime needs it, as this package does.

Applications put launchers in `bin/` and code in `src/`.
Published applications include `bin/` in the exact package allowlist.
Libraries put public entrypoints and TypeScript declarations in `src/`.
`package.json.version` sets this checkout's version.
The npm badge shows the latest public version.

The CLI uses consumer Jest when available.
Otherwise, it uses the bundled Jest from the consumer's working directory.
It reads supported Jest settings from the consumer's `package.json`.
It rejects separate Jest config files.

Each validation run creates `eliware-test.lock` in the repository root.
It removes the lock when the process exits normally.
A concurrent run stops if the lock exists.
Help and version commands do not create the lock.
If a stopped process leaves a stale lock, confirm no run is active, then remove it.
Git ignores this file.

`npm run format` and `--format` write formatted files.
`npm run format:check` and `--format-check` only check formatting.
The CLI accepts modes and focused test paths, not npm script names.
Legacy `--ignore-*` options are unsupported.
Aggregate validation enforces repository-wide coverage and module-size rules.
A focused run checks only the selected source module for coverage.
It does not report unrelated module coverage failures.

`--debug-timing` streams stage times and Jest suite times.
It does not write a separate Jest report.
Programmatic callers must provide an output writer to receive timing data.

## Development

Run `npm test` for aggregate validation.
Run `npm run lint`, `npm run format:check`, `npm run audit`, or `npm run pack` as needed.
Use `npm run format` to change formatting.
Use native ESM `.mjs` modules and mirror `src/` in `tests/`.
Add focused regression tests for behavior changes.
Each mirrored test needs an executable Jest `test` or `it` declaration.
It must import its exact source module.

Aggregate validation reads tracked symlink modes from the Git index.
It rejects tracked links to files and directories.
It does not resolve link targets.
Validation fails when it cannot read the Git index.

## Testing

In this npm-published repository, `npm test` runs lint, format check, audit,
outdated, pack, conventions, Jest, and coverage in that order.
It runs typecheck for library repositories and build for web repositories.
Consumer repositories use `npm test` and select stages from their profiles.
See [conventions](specs/conventions/) for profile requirements.

Run all enabled stages and convention checks before Jest.
Run Jest only when those earlier checks pass.
Convention checks can read completed stage results from the run cache.
The CLI returns the highest code when multiple stages fail.

Run one repository-relative `.test.*` or `.spec.*` path under `tests/`.
Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
Every maintained `.mjs` source still needs one mirrored `.test.mjs` file.
The mirror check inventories all files under `src/` and `tests/`.
In libraries, a `.d.ts` file must sit beside a same-name `.mjs` source.
The typecheck script must validate that declaration.
Jest reporter names in `package.json` must be strings.
Reporter option tuples are unsupported.

The workflow allowlist is `.github/workflows/ci.yaml` and `.knit/deploy.yaml`.
Add `.github/workflows/publish.yaml` when npm or GHCR publication applies.
Do not add other GitHub Actions or Knit workflow YAML files.
Each allowed workflow must contain one YAML document and pass its profile rules.

## Troubleshooting

Run the reported focused test path to diagnose a failure.
Then run `npm test` to check the full validation gate.
See [Troubleshooting](docs/troubleshooting.md) for more help.

The v11 orchestration and check registry use focused ESM modules under `src/`.
Application and library guidance applies only when their profiles are selected.
Some profile requirements are advisory because no deterministic check can enforce them.

## Security

Never commit secrets, credentials, private runtime data, or generated output.
The CLI redacts known secrets from child-process diagnostics when possible.
This does not guarantee removal of every secret.
Do not print secrets in child-process output.

## Configuration

The CLI has no runtime settings, environment variables, or consumer config files.
Profile selection is repository metadata in `package.json.eliware.apply`.
CLI options are command arguments, not runtime configuration.

## Operations

Start the CLI with `eliware-test` or `bin/eliware-test.mjs`.
The runner manages child-process shutdown.
Validation runs locally or in CI.
It does not release, publish, deploy, or make operational changes.
Use the applicable Eliware Operations procedures for those actions.

## Commands

The executable is `eliware-test`.
It runs `bin/eliware-test.mjs`.
`--help` prints usage. `--version` prints the package version.
Other modes are `--debug-timing`, `--lint`, `--format`, `--format-check`, `--audit`, and `--pack`.

Each tool mode has an argument allowlist.
Audit accepts only `--no-fund` and `--no-progress`.
Lint accepts only `--threads=<positive-count>`.
Pack and formatting modes use their own allowlists.
Formatting modes reject file paths and use repository scope.
The CLI rejects options that weaken required checks.
Put tool arguments after the mode or after `--`.
The CLI rejects arguments before the mode.
Arguments after `--` still follow the mode allowlist.

For example, `eliware-test --audit --no-fund` passes the allowed flag to npm.

To run one focused test, pass one existing repository-relative test path under `tests/`.
Put the path before optional `--`.
Only supported non-path Jest options may follow `--`.
The CLI rejects paths after `--`.
Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.

```text
eliware-test tests/checks/example.test.mjs
```

`--format` writes files. `--format-check` does not.
`--pack` checks package contents. It does not publish.
No command authorizes a release, deployment, or external change.
Legacy `--ignore-*` options are unsupported.
Supported platforms are Windows, macOS, and Linux with Node.js 26 and npm.
Development tests Windows. CI tests Ubuntu.
macOS support is inferred from Ubuntu behavior, not direct testing.

## Exit codes

Code `0` means success. Code `1` means unclassified or configuration failure.
Codes `2` through `12` mean Jest, unexpected output, coverage, lint, format,
audit, outdated, pack, typecheck, build, and convention failure.
The CLI returns the highest code when failures have different codes.
Invalid arguments and configuration errors return code `1`.
Each failed convention check reports its ID, observed failure, and full directive.
The directive includes examples and child rules when present.
The CLI does not truncate or summarize that directive.
Canonical profile specs live in `specs/conventions/`.
The CLI reads those specs directly.
Validation does not deploy, publish, release, or change external systems.

## Support

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

Use the [Eliware Discord community](https://discord.gg/M6aTR9eTwN),
[GitHub issues](https://github.com/eliware/test/issues), or email eliware@eliware.org.
Include the command, Node.js version, and redacted diagnostics.

## License

[license](LICENSE)

## Links

- Documentation: [docs](docs/README.md) · [specifications](specs/README.md)
- [Usage](docs/usage.md) · [Troubleshooting](docs/troubleshooting.md) · [Support](docs/support.md)
- [Canonical repository profile specifications](specs/conventions/README.md)
- [Home Page](https://github.com/eliware/test#readme)
- [GitHub repository](https://github.com/eliware/test.git)
- [Eliware](https://eliware.org)
- [GitHub organization](https://github.com/eliware)
- [npm Package](https://www.npmjs.com/package/@eliware/test)
- [Release Notes](RELEASE_NOTES.md)
- [Discord](https://discord.gg/M6aTR9eTwN)
