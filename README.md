# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test) [![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/test/actions)

Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [RELEASE_NOTES.md](RELEASE_NOTES.md) · [examples](examples/README.md)

## Table of Contents

[Features](#features) · [Requirements](#requirements) · [Setup](#setup) ·
[Usage](#usage) · [Development](#development) · [Testing](#testing) ·
[Troubleshooting](#troubleshooting) · [Security](#security) ·
[Support](#support) · [License](#license) · [Links](#links)

## Features

The CLI validates repository structure, documentation, conventions, tests,
coverage, packaging, and supported operational checks.

## Requirements

Node.js 26 is required.

## Setup

```text
npm ci
```

## Usage

Commands are exposed through the `eliware-test` CLI.

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

The architecture/common-stack requirements E-1.20.3, E-1.20.4, E-1.20.5, and
E-1.20.9 are explicitly advisory-only in the bundled profile; their current
runtime stubs do not claim deterministic enforcement.

## Security

Never commit secrets, credentials, private runtime state, or generated output.

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

- [Documentation](docs/README.md)
- [Specifications](specs/README.md)
- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/test)
- [GitHub Org](https://github.com/eliware)
- [npm Package](https://www.npmjs.com/package/@eliware/test)
- [Release Notes](RELEASE_NOTES.md)
- [Discord](https://discord.gg/M6aTR9eTwN)

## Purpose

`@eliware/test` is the shared deterministic validation CLI for Eliware
repositories using the current published validation contracts.

Description: Shared deterministic repository validation for Eliware projects.
Keywords: eliware, testing, validation, jest, oxlint, prettier, cli.
Author: Eliware <eliware@eliware.org>.
License: MIT.
Repository: https://github.com/eliware/test.

## Authority and scope

Test owns the validator architecture, public CLI lifecycle, deterministic
check execution, and validation acceptance contract. Docs owns cross-repository
documentation and authority mapping; Conventions owns the policies Test
validates; Operations owns cross-cutting release, deployment, and publication
procedures. Test consumes those policies and does not redefine them.

For web applicability, document routes, assets, configuration, ports, browser
validation, and deployment boundaries. Library applicability additionally
requires public API, packaging, and examples documentation. This repository
does not apply the library or web profiles and therefore has no examples
surface to index. The focused CLI command above is an invocation example, not
a missing examples catalog.

Exit codes identify the failed validation stage: `0` is success, `8` is Jest
failure, `10` is coverage failure, `12` is lint failure, `14` is an internal
tool failure, `17` is a package-check failure, and `18` is a convention,
configuration, argument, format, or format-check failure. Validation output is
intended to preserve actionable diagnostics and does not print secrets or
arbitrary environment values. The CLI performs no deploy, publish, release,
or destructive repository operation.

Child-process diagnostics use bounded, pattern-based redaction; captured output
is not a comprehensive secret scanner. Callers must not emit credentials or
other arbitrary sensitive values to child output. Checks execute in declared
order and share a validation context so later stages can consume earlier
results.

## Configuration

Repository convention applicability is declared in `package.json` under
`eliware.apply`. Test-specific directives are documented in
[specs/directives.json](specs/directives.json).

## Validation

```text
npm test
npm run lint
npm run format:check
npm run audit
npm run pack
git diff --check
```

## Operations

This package performs local and CI validation only. Release, publication,
deployment, and other operational changes are controlled by the applicable
Eliware runbooks and are not performed by `eliware-test`.
