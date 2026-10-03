# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm](https://img.shields.io/npm/v/@eliware/test)](https://www.npmjs.com/package/@eliware/test) [![License](https://img.shields.io/github/license/eliware/test)](https://github.com/eliware/test/blob/main/LICENSE) [![CI](https://github.com/eliware/test/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/test/actions/workflows/ci.yaml)

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

The CLI supports validation of repository structure, documentation,
conventions, tests, coverage, packaging, and repository checks. The aggregate
stages depend on the repository's declared profiles. It does not perform live
operational validation.

Package description: Shared deterministic repository validation for Eliware projects. Author:
Eliware <eliware@eliware.org>. Repository: https://github.com/eliware/test. License: MIT.

## Requirements

Node.js 26 and npm 12 or later are required. Before validation, `eliware-test`
checks the active npm version and stops if it is older than 12 or cannot be
determined. `--help` and `--version` remain available without this check.

## Setup

For development in this repository, install the locked dependencies:

```text
npm ci
```

In a consuming repository, use Node.js 26 (`>=26 <27`) and npm 12 or later, and install the public
CLI as a development dependency:

```text
npm install --save-dev @eliware/test
```

## Usage

After installing the package in a consuming repository, run validation with
`eliware-test`:

```text
eliware-test
eliware-test --help
eliware-test --version
eliware-test --debug-timing # runs aggregate validation and reports timing
eliware-test --lint
eliware-test --format
eliware-test --format-check
eliware-test --audit
eliware-test tests/example.test.mjs
```

The following package-maintainer commands require this repository checkout;
they are not commands for consumers of the installed package:

```text
npm test
npm run lint
npm run format
npm run format:check
npm run audit
npm run pack
npm run smoke -- --target C:\path\to\consumer
node bin/eliware-test.mjs --pack
```

Package-content validation with `npm run pack` or `--pack` applies only when the
repository selects the `npm-published` profile.

`npm run pack` is the lightweight package-content check included in aggregate
validation. The opt-in `npm run smoke -- --target <path>` command builds and
installs a tarball from this checkout in one existing consumer repository and
runs that repository's `npm test`. It installs with `--no-save` and
`--package-lock=false`, leaving consumer manifests and lockfiles unchanged. The
outdated check omits only the exact unpublished candidate during this smoke
run; all other dependencies still use the normal registry check. Prepare the
target and install its dependencies first; the command does not clone
repositories or create worktrees. It saves and restores the previous
`@eliware/test` installation and local executable shims after the run.
The temporary manifest and lockfile are kept consistent, and only the local
`node_modules/@eliware/test` package is replaced. It does not touch system-wide
symlinks or junctions. Use a disposable target
because consumer tests may create their own output files.

For npm-published repositories, the npm-published profile defines the exact
package-content allowlist. The general profile does not add files to that
allowlist; `specs/` is included only when required by the package runtime, as
with `@eliware/test`.

The application profile places runtime launchers in `bin/` and implementation
modules in `src/`; npm-published applications include `bin/` in their exact
allowlist. Libraries place public runtime entrypoints and any TypeScript
declarations under `src/`.

`package.json` is the source of truth for the version in this checkout. The npm
badge reports the latest version published in the public registry; it does not
identify or verify the version in this checkout.

When a repository-local Jest cannot be resolved, `eliware-test` uses the Jest
dependency it ships while keeping the consumer repository as Jest's working
directory. It reads supported Jest settings from the consumer's `package.json`
and discovers tests and source files from that root. Repository validation
rejects separate `jest.config.*` files; place Jest settings in `package.json`.

Each validation invocation creates `eliware-test.lock` in the repository root
before running, and removes it when the process exits normally. A concurrent
validation invocation exits immediately if that file already exists.
Informational `--help` and `--version` commands do not run validation rules and
do not acquire the lock. If a process is forcibly stopped and leaves the file
behind, confirm no validation run is active, then remove the stale
`eliware-test.lock` file before retrying. The file is ignored by Git.

`npm run format` and `--format` mutate files; `npm run format:check` and
`--format-check` only validate formatting. `--pack` validates the package
contents without publishing it.

Each of `--lint`, `--format`, `--format-check`, `--audit`, and `--pack` uses a
mode-specific argument policy. Audit accepts only `--no-fund` and
`--no-progress`; lint accepts only `--threads=<positive-count>`; pack has its
own allowlist. For `--format` and `--format-check`, only non-path Prettier
options are accepted; positional file paths are rejected. Formatting scope comes
from the wrapper's maintained-file set, not positional path arguments. The wrapper rejects options that replace its
selected write/check mode, canonical configuration, or required file coverage.
Non-path Prettier options are forwarded unless they conflict with wrapper-owned
mode, configuration, or required coverage settings. Prettier handles the
individual option semantics and reports unsupported options itself.
Arguments after `--` are treated as tool arguments and must still pass the
selected mode's argument policy; the separator does not bypass its allowlist.
Accepted arguments are forwarded after wrapper-owned arguments. Prettier
arguments that override the selected mode, canonical formatting configuration,
or required file coverage are rejected.

The five public tool modes are `--lint`, `--format`, `--format-check`,
`--audit`, and `--pack`. Invoke package-level scripts with `npm run <script>`;
`eliware-test` accepts its documented modes and focused test paths, not npm
script names as positional arguments.

Legacy `--ignore-*` flags are unsupported. Coverage and monolith enforcement
remain enabled for all validation modes.

`--debug-timing` streams stage timing and per-suite start/completion durations
through the selected CLI output writer. It does not print a separate Jest timing
report at the end. Programmatic callers that omit a writer do not receive an
implicit process-global timing stream.

## Development

Run `npm test` for aggregate validation. For targeted stages, use
`npm run lint`, `npm run format:check`, `npm run audit`, or `npm run pack` as
applicable; `npm run format` writes formatted files.

Use native ESM `.mjs` modules, keep `src/` and `tests/` mirrored, and add
focused regression tests for behavior changes. Each mirrored test must contain
an executable Jest `test` or `it` declaration and import its exact matching
source module; comments, strings, and unrelated imports do not count.

Aggregate validation rejects all tracked symlinks by reading mode `120000` from
the Git index. It covers links to files and directories without resolving their
targets, so detection does not depend on Windows symlink privileges or checkout
behavior. The check fails when Git index inspection is unavailable.

## Testing

For this npm-published package, `npm test` runs aggregate Jest, lint,
format-check, audit, outdated-dependency, and pack validation. In consuming
repositories, `npm test` is the aggregate validation entrypoint and selects
stages from the profiles declared in `package.json`; see the
[conventions](specs/conventions/) for the canonical profile stage requirements.
Pack validation runs only when the `npm-published` profile applies. One
repository-relative `.test.*` or
`.spec.*` file under `tests/` can be supplied to
`eliware-test`. `.test.*` and `.spec.*` files may use `.js`, `.jsx`, `.ts`,
`.tsx`, `.mjs`, `.cjs`, `.mts`, or `.cts` extensions.
Focused extension support does not change the source/test mirroring requirement:
each maintained `.mjs` source module must have its mirrored `.test.mjs` test.
Mirror validation inventories every file under `src/` and `tests/`. In library
repositories, a `.d.ts` declaration is allowed only beside a same-basename
`.mjs` implementation; it belongs to that module's mirror unit and must pass
the library typecheck.
Jest reporter names in `package.json` must be strings; per-reporter option
tuples are unsupported because the harness supplies its own reporters.

The canonical workflow inventory is `.github/workflows/ci.yaml` and
`.knit/deploy.yaml`, plus `.github/workflows/publish.yaml` when npm or GHCR
publication applies. No other GitHub Actions or Knit workflow YAML files are
allowed. Each allowed workflow must be a single YAML document and meet its
applicable profile conventions.

## Troubleshooting

When validation fails, rerun the reported focused path to diagnose that test,
then rerun `npm test` to verify the aggregate validation gate before handoff.

The v11 orchestration and convention-check registry are implemented as focused
native ESM modules under `src/`.

Application and library architecture guidance is selected only when the
corresponding profile is declared in `package.json.eliware.apply`. Some profile
requirements remain advisory or specification-only when they do not have a
deterministic check; their canonical wording remains in the local profile
specifications.

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
`--lint`, `--format`, `--format-check`, `--audit`, and `--pack`. Each tool mode
has a mode-specific argument policy. Audit accepts only `--no-fund` and
`--no-progress`, lint accepts only `--threads=<positive-count>`, and pack uses
its own allowlist. `--debug-timing` may appear once before a tool mode and cannot
be passed after `--`. Formatting modes accept non-path Prettier options and reject
positional file paths. The wrapper forwards supported options unless they
replace the write/check mode, canonical configuration, or required file
coverage; Prettier rejects unsupported options. Wrapper-owned
settings and options that weaken required checks are rejected. Wrapper
arguments precede arguments after `--`. Mode arguments must follow the selected
mode or the `--` separator; arguments before a mode are rejected. Arguments
after `--` remain subject to that mode's allowlist and do not bypass wrapper
validation.

To run one focused test, pass one existing repository-relative `.test.*` or `.spec.*` file under `tests/`;
the path must appear before an optional `--` separator. Arguments after `--` are
forwarded to Jest and do not select focused validation; in aggregate mode, forwarded Jest arguments can change which tests Jest runs.
test filenames support `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`,
`.cjs`, `.mts`, and `.cts` extensions:

```sh
eliware-test tests/checks/example.test.mjs
```

Examples and package-level shortcuts are shown under Usage. `--format` mutates
files; `--format-check` is read-only. `--pack` is read-only package validation
and does not publish. The commands do not authorize release, deployment, or
other destructive external actions. Legacy `--ignore-*` flags are unsupported.
Supported platforms are Windows, macOS, and Linux with Node.js 26 and npm
available. Validation evidence: Windows is exercised during development and CI
validates Ubuntu. macOS compatibility is inferred from Ubuntu's POSIX filesystem
behavior; the project does not claim direct macOS validation.

## Exit codes

Exit code `0` is success, `8` is Jest failure, `10` is coverage failure, `12` is lint
failure, `14` is an internal tool failure, `17` is a package-check failure, and
`18` is a convention, configuration, argument, format, or format-check failure.
Rejected wrapper arguments, unsupported mode combinations, and rejected
forwarded tool arguments return exit code `18`.
Every failed convention check includes the check ID, the observed failure, and
the complete matching directive, including all `dos`, `donts`, and examples
when present. The canonical profile specifications live in `specs/conventions/`
and are read directly by the harness. Output also redacts recognized secret
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
