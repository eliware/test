# Usage

## Requirements

Use Node.js 26 or newer and npm 12 or newer.
The CLI checks the active npm version before validation.
It skips this check for `--help` and `--version`.

## Install Eliware Test

Install the package with a development dependency in the consumer repository:

```text
npm install --save-dev @eliware/test
```

Install the locked dependencies after you add the package:

```text
npm install
```

Use `npm ci` in CI when the repository has a lockfile.
Run `npm test` in CI to start aggregate validation.
Aggregate validation includes lint and format checks.
Do not add separate CI steps for those checks.

## Configure the repository

Set the shared scripts and profiles in `package.json`:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint",
    "audit": "eliware-test --audit",
    "format": "eliware-test --format",
    "format:check": "eliware-test --format-check"
  },
  "eliware": {
    "id": "E-0",
    "apply": ["general"]
  }
}
```

Replace `E-0` with the assigned repository ID.
List all profiles that apply in `package.json.eliware.apply`.
Use the canonical profile order in [Profiles](profiles.md).
The CLI does not infer profiles from files or dependencies.

Set `package.json.eliware.exempt` only when Eli approves a waiver.
Each waiver requires a unique known `ruleId`, a `reason`, approver `Eli`, an approval timestamp, and an expiry date or `null`.

Use the field names and value types shown in this example:

```json
{
  "ruleId": "E-0.1.0.1.10",
  "reason": "An upstream file cannot be changed.",
  "approver": "Eli",
  "approvalTimestamp": "2026-10-20T12:00:00Z",
  "expiry": null,
  "paths": ["src/generated/**"]
}
```

Replace the example rule ID, cause, timestamp, and path with approved values.
Use a rule ID that exists in the selected profiles.
Use `paths` to limit the waiver to matching repository-relative paths.

Add a `paths` array to skip repository-relative paths during that rule only.
Use an exact path when it has no wildcard.
Use `*` to match in one path segment.
Use `**` to match zero or more path segments.
The same path rules apply to checks that read the Git index.

When the Docs repo map lists a repository, its `exemptions` list must match the
repository's package exemption list. Omitted lists count as empty lists.
The validator checks `repo-map.yaml` against `repo-map-schema.yaml` beside it when the schema exists.

Omit `paths` or use an empty array to skip the rule and its child checks.
Use forward slashes in paths. Do not use absolute paths or dot navigation segments.
The CLI rejects invalid, expired, or unknown exemptions.

Use this order for `package.json.eliware` keys: `id`, `apply`, then optional `exempt`.

## Run commands

Run commands from the consumer repository root:

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
```

With no arguments, the CLI runs aggregate validation.
Use `--help` for command syntax and `--version` for the CLI version.
Use `--debug-timing` alone or before a focused path or tool mode.
Do not combine informational commands or validation modes.

Pass `--debug-timing` through the test script when you use npm:

```text
npm test -- --debug-timing
```

## Use tool modes

Use `--lint` to run Oxlint on repository files.
Set the lint worker count with `--threads=<positive-count>`.
Without this option, Oxlint selects its default worker count.

Use `--format` to write Prettier output for the repository.
Use `--format-check` to check Prettier output without writing files.
Both modes use repository scope and the repository configuration.
Pass supported Prettier options after `--format` or `--format-check`.
Do not pass paths or options that change the mode, configuration, or file scope.

Use `--audit` to run `npm audit` by itself.
The command uses JSON output and high severity by default.
Pass `--no-fund` to hide fund notices.
Pass `--no-progress` to hide progress notices.
Both notices remain enabled by default.
The command rejects options that change audit scope or severity.

Use `--pack` to check package contents with `npm pack`.
The command disables scripts, uses dry-run mode, and returns JSON by default.
Pass npm pack options after the mode.
Set npm pack logging with `--loglevel=<level>`.
The command rejects options that change package selection, output location, or dry-run behavior.

The check runs only when `npm-published` applies.
It does not publish a package.

Put mode arguments after the mode or `--`.
Do not pass arguments before a tool mode.
Do not pass npm script names to the CLI.

## Run focused tests

Pass one or more repository-relative test paths in `tests/`:

```text
npm test -- tests/example.test.mjs
npm test -- tests/first.test.mjs tests/second.test.mjs
npm test -- tests/example.test.mjs -- --testNamePattern "case name"
```

Use paths with `.test.*` or `.spec.*` names.
Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
Put all test paths before an optional `--`.
Put only supported Jest options after the separator.
Do not use absolute paths or parent-directory paths.
Do not combine focused paths with a tool mode.

The CLI checks lint, formatting, and layout for each selected test and its matching source file.
It runs other checks only when their rules can use the selected files.
Read [Validation](validation.md) for coverage and stage details.

## Read specifications

Read [Profiles](profiles.md) to select repository profiles.
Read the profile files in [`specs/conventions/`](../specs/conventions/README.md) for exact rules.
Read [ordering specifications](../specs/conventions/ordering/README.md) for cross-profile order rules.

## Package contents and releases

The `eliware-test` command runs `bin/eliware-test.mjs`.
The package is native ESM and publishes that command through `package.json.bin`.

`package.json.files` lists the files included in the npm package.
This package includes `src/`, `bin/`, `docs/`, `specs/`, and `dictionary/`.
It also includes `README.md`, `AGENTS.md`, `LICENSE`, and `RELEASE_NOTES.md`.
The package check permits other runtime files.
It rejects tests, fixtures, build output, credentials, and lock files.

Set `package.json.version` to a numeric `MAJOR.MINOR.PATCH` value.
Add a dated section for the current version to `RELEASE_NOTES.md`.
Add a matching `v<version>` Git tag for each published release.
Each earlier release section must match an existing Git tag.

Run `npm test -- --pack` in this checkout to check package contents.
Run `eliware-test --pack` in a consumer repository to check its package contents.

[Return to documentation](README.md).
