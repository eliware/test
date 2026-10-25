# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm](https://img.shields.io/npm/v/@eliware/test)](https://www.npmjs.com/package/@eliware/test) [![License](https://img.shields.io/github/license/eliware/test)](https://github.com/eliware/test/blob/main/LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/test/actions/workflows/ci.yaml)

Shared deterministic repository validation for Eliware projects

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
- [Links](#links)
- [License](#license)

## Features

Eliware Test validates repositories with deterministic checks selected by `package.json.eliware.apply`.

## Requirements

Use Node.js 26 or newer and npm 12 or newer.

## Setup

Install Eliware Test as a development dependency:

```text
npm install --save-dev @eliware/test
```

## Usage

Run validation from the repository root:

```text
eliware-test
```

Read the [user guide](docs/README.md) and [profile guide](docs/profiles.md) for setup and profile details.
Read [specifications](specs/README.md) for the authoritative requirements.
Read [release notes](RELEASE_NOTES.md) for changes by version.

## Development

Read the [validation guide](docs/validation.md) for contributor instructions.

## Testing

Run `npm test` to validate the repository.

## Troubleshooting

Read the [troubleshooting guide](docs/troubleshooting.md) to resolve validation failures.

## Security

Do not share credentials, private data, or generated validation output.
Read the [troubleshooting guide](docs/troubleshooting.md#share-safe-diagnostics) before sharing diagnostics.

## Configuration

Set repository profiles in `package.json.eliware.apply`.
Read the [profile guide](docs/profiles.md) for profile selection and combinations.

## Operations

Eliware Test validates repositories. It does not publish packages or deploy services.

## Commands

Run `eliware-test --help` to read the supported commands.

## Exit codes

Read the [troubleshooting guide](docs/troubleshooting.md#read-exit-codes) for exit code meanings.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## Links

- [Home Page](https://eliware.org)
- [GitHub Org](https://github.com/eliware)
- [GitHub Repo](https://github.com/eliware/test)
- [Bug Reports](https://github.com/eliware/test/issues)
- [npm](https://www.npmjs.com/package/@eliware/test)
- [Discord](https://discord.gg/M6aTR9eTwN)

## License

[MIT © Eliware](LICENSE)
