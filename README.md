# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test) [![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/test/actions)

Documentation: [docs](docs/README.md) · [specifications](specs/README.md)

## Purpose

`@eliware/test` is the shared deterministic validation CLI for Eliware
repositories. This repository is the native v8 implementation; it does not
provide a v7 compatibility layer.

Description: Shared deterministic repository validation for Eliware projects.
Keywords: eliware, testing, validation, jest, oxlint, prettier, cli.
Author: Eliware <eliware@eliware.org>.
License: MIT.
Repository: https://github.com/eliware/test.

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
eliware-test --help
eliware-test --version
eliware-test --ignore-100x4
eliware-test --ignore-monolith-limits
eliware-test --debug-timing
```

The two `--ignore-*` flags bypass enforcement and are diagnostic-only. They
must not be used for release validation or CI and require approved
transitional use.

The v8 orchestration and convention-check registry are implemented as focused
native ESM modules under `src/`.

## Authority and scope

Test owns the validator architecture, public CLI lifecycle, deterministic
check execution, and validation acceptance contract. Docs owns cross-repository
documentation and authority mapping; Conventions owns the policies Test
validates; Operations owns cross-cutting release, deployment, and publication
procedures. Test consumes those policies and does not redefine them.

For web applicability, document routes, assets, configuration, ports, browser
validation, and deployment boundaries. Library applicability additionally
requires public API, packaging, and examples documentation.

Exit codes identify the failed validation stage: `0` is success, `8` is Jest
failure, `10` is coverage failure, `12` is lint failure, `14` is an internal
tool failure, `17` is a package-check failure, and `18` is a convention
failure. Validation output is intended to preserve actionable diagnostics and
does not print secrets or arbitrary environment values. The CLI performs no
deploy, publish, release, or destructive repository operation.

## Configuration

Repository convention applicability is declared in `package.json` under
`eliware.apply`. Test-specific directives are documented in
[specs/directives.json](specs/directives.json).

## Validation

```text
npm test
npm run lint
npm run format:check
git diff --check
```

## Operations

This package performs local and CI validation only. Release, publication,
deployment, and other operational changes are controlled by the applicable
Eliware runbooks and are not performed by `eliware-test`.

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

- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/test)
- [GitHub Org](https://github.com/eliware)
- [npm Package](https://www.npmjs.com/package/@eliware/test)
- [Release Notes](RELEASE_NOTES.md)
- [Discord](https://discord.gg/M6aTR9eTwN)
