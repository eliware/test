# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test) [![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/ci.yml/badge.svg)](https://github.com/eliware/test/actions)

## Table of Contents

[Features](#features) · [Requirements](#requirements) · [Setup](#setup) ·
[Usage](#usage) · [Development](#development) · [Testing](#testing) ·
[Troubleshooting](#troubleshooting) · [Security](#security) ·
[Configuration](#configuration) · [Operations](#operations) ·
[Commands](#commands) · [Exit codes](#exit-codes) ·
[Support](#support) · [License](#license) · [Links](#links)

## Features

The CLI validates repository structure, documentation, conventions, tests,
coverage, packaging, and supported operational checks.

Package description: Shared deterministic repository validation for Eliware projects. Author: Eliware <eliware@eliware.org>. License: MIT.

## Requirements

Node.js 26 is required.

## Setup

For development in this repository, install the locked dependencies:

```text
npm ci
```

In a consuming repository, install the public CLI as a development dependency:

```text
npm install --save-dev @eliware/test
```

Because `8.0.0` has not been published, that install currently resolves the
latest published package version, not this checkout's version.

## Usage

Run validation with `eliware-test` from the consumer repository or use the
package-level npm scripts below.

`package.json` is the source of truth for the package version. The repository's
current version is `8.0.0`, which has not been published; do not treat that
version as installable from npm until the authorized release handoff verifies
the exact version in the public registry. The npm badge reflects the published
package version, not an unpublished repository version.

```text
npm test
npm run lint
npm run format:check
npm run audit
npm run pack
node bin/eliware-test.mjs --help
node bin/eliware-test.mjs --version
node bin/eliware-test.mjs --debug-timing
node bin/eliware-test.mjs --lint
node bin/eliware-test.mjs --format
node bin/eliware-test.mjs --format-check
node bin/eliware-test.mjs tests/example.test.mjs
```

`--format` mutates files; `--format-check` only validates formatting. `--pack`
validates the package contents without publishing it.

`--lint`, `--format`, `--format-check`, `--audit`, and `--pack` forward extra
arguments to Oxlint, Prettier, npm audit, or npm pack as appropriate.
Wrapper arguments are emitted before arguments supplied after `--`, preserving
their relative order within each group.

All five tool modes are public CLI modes. The npm script forms are supported
package-level shortcuts; arbitrary npm script names are not CLI arguments.

Legacy `--ignore-*` flags are unsupported. Coverage and monolith enforcement
remain enabled for all validation modes.

`--debug-timing` writes timing diagnostics through the selected CLI output
writer. Programmatic callers that omit a writer do not receive an implicit
process-global timing stream.

## Development

Use native ESM `.mjs` modules, keep `src/` and `tests/` mirrored, and add
focused regression tests for behavior changes.

## Testing

Run `npm test` for the aggregate Jest, lint, format-check, audit, and pack
validation stages. Focused test paths can be supplied to `eliware-test`.

## Troubleshooting

When validation fails, rerun the reported focused path first, then inspect the
stage-specific diagnostic and relevant repository contract.

The v8 orchestration and convention-check registry are implemented as focused
native ESM modules under `src/`.

Application and library architecture guidance is selected only when the
corresponding profile is declared in `package.json.eliware.apply`. Requirements
that have no deterministic check are explicitly marked advisory in their
profile-specific bundled check metadata.

## Security

Never commit secrets, credentials, private runtime state, or generated output.

## Configuration

`eliware-test` has no runtime configuration: no runtime settings, environment
variables, or consumer configuration files are supported; runtime defaults are
none. Convention applicability is repository metadata in
`package.json.eliware.apply`; CLI options are documented under Commands and are
not runtime configuration.

## Operations

Startup is a local CLI invocation through `eliware-test` or
`bin/eliware-test.mjs`. Shutdown and child-process termination are handled by
the validation runner. The validation workflow is local or CI validation only;
its boundaries exclude release, publication, deployment, and other operational
changes, which are controlled by the applicable Eliware runbooks.

## Commands

The CLI command entrypoint is `bin/eliware-test.mjs`; the installed executable
is `eliware-test`. `--help` prints usage; `--version` reports the package version.
Other public modes are `--debug-timing`,
`--lint`, `--format`, `--format-check`, `--audit`, and `--pack`. The five tool
modes forward extra arguments to Oxlint, Prettier, npm audit, or npm pack as
appropriate. Wrapper arguments precede arguments after `--`.

Examples and package-level shortcuts are shown under Usage. `--format` mutates
files; `--format-check` is read-only. `--pack` is read-only package validation
and does not publish. The commands do not authorize release, deployment, or
other destructive external actions. Legacy `--ignore-*` flags are unsupported. Platform support is
intended for Windows, macOS, and Linux with Node.js 26 and npm available; CI
currently validates on Ubuntu.

## Exit codes

Exit code `0` is success, `8` is Jest failure, `10` is coverage failure, `12` is lint
failure, `14` is an internal tool failure, `17` is a package-check failure, and
`18` is a convention, configuration, argument, format, or format-check failure.
Every failed convention check includes the check ID, the observed failure, and
a `How to resolve` line selected from the bundled Convention v8 remediation
guidance. The bundled snapshot is regenerated from the adjacent
`eliware/conventions/specs` directory with `node scripts/sync-convention-remediation.mjs`
when directive guidance changes. Output also redacts recognized secret
patterns. The CLI performs no deploy, publish, release, or destructive
repository operation.

## Support

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

Use the [Eliware Discord community](https://discord.gg/M6aTR9eTwN),
[GitHub issues](https://github.com/eliware/test/issues), or
eliware@eliware.org. Include the command, Node.js version, and redacted
diagnostics when requesting help.

## License

[license](LICENSE)

## Links

- Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [RELEASE_NOTES.md](RELEASE_NOTES.md) · [examples](examples/README.md)
- [Documentation](docs/README.md)
- [Specifications](specs/README.md)
- [Authority distribution](specs/authority.json)
- [Global authority map](https://github.com/eliware/docs/blob/main/authority-map.json)
- [Bundled convention remediation snapshot](specs/convention-remediation.json)
- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/test)
- [GitHub Org](https://github.com/eliware)
- [npm Package](https://www.npmjs.com/package/@eliware/test)
- [Release Notes](RELEASE_NOTES.md)
- [Discord](https://discord.gg/M6aTR9eTwN)
