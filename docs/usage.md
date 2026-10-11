# Usage

## Requirements

Use Node.js 26 or later and npm 12 or later.
The CLI checks the active npm version before validation.
It skips this check for `--help` and `--version`.

## Install Eliware Test

Install the package as a development dependency in the consumer repository:

```text
npm install --save-dev @eliware/test
```

Install the locked dependencies after you add the package:

```text
npm install
```

Use `npm ci` in CI when the repository has a lockfile.
Run `npm test` in CI to start aggregate validation.

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
List every applicable profile in `package.json.eliware.apply`.
Use the canonical profile order in [Profiles](profiles.md).
The CLI does not infer profiles from files or dependencies.

Set `package.json.eliware.exempt` only for an approved rule exemption.
Each exemption needs a unique known `ruleId`, a reason, approver `Eli`, an approval timestamp, and an expiry date or `null`.
The CLI rejects invalid, expired, or unknown exemptions.

The `package.json.eliware` keys must appear in this order: `id`, `apply`, then optional `exempt`.

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

## Use tool modes

Use `--lint` to run lint checks.
Pass `--threads=<positive-count>` only when you need to set the lint thread count.

Use `--format` to write formatted files.
Use `--format-check` to check formatting without writing files.
Formatting modes use the repository scope.
They reject file paths and options that change the mode, configuration, or file scope.

Use `--audit` to run the audit check by itself.
Audit accepts only `--no-fund` and `--no-progress`.
It rejects options that change audit scope or severity.

Use `--pack` to check package contents.
The check runs only when `npm-published` applies.
It does not publish a package.

Put mode arguments after the mode or after `--`.
Do not pass arguments before a tool mode.
Do not pass npm script names as CLI arguments.

## Run focused tests

Pass one or more repository-relative test paths under `tests/`:

```text
eliware-test tests/example.test.mjs
eliware-test tests/first.test.mjs tests/second.test.mjs
eliware-test tests/example.test.mjs -- --testNamePattern "case name"
```

Use `.test.*` or `.spec.*` names.
Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
Put every test path before an optional `--` separator.
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

[Return to documentation](README.md).
