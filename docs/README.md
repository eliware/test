# @eliware/test documentation

This directory contains the end-user documentation entrypoint for the
`@eliware/test` CLI. It is intended for maintainers configuring a consumer
repository, while the root [README.md](../README.md) remains the quick-start
reference.

## Setup

Install the package as a development dependency with `npm install --save-dev
@eliware/test`, then configure the consumer's `package.json`:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

Use Node.js 26 or newer and the conventional npm `node_modules` layout. Run
`npm test` from the consumer repository. Focused paths can be forwarded with
`npm test -- tests/example.test.mjs`; missing focused paths are reported before
Jest starts.

## Quick start

The normal workflow runs repository policy and convention checks, focused-path
validation, Jest with coverage, source/test mapping, Oxlint, monolith limits,
and any defined `audit`, `pack`, `build`, or `typecheck` scripts. Missing
package scripts are skipped.

Supported profiles are:

- **Normal:** `npm test`
- **Lint-only:** `npm run lint` or `eliware-test --lint`
- **Focused:** `npm test -- tests/example.test.mjs`
- **Diagnostic:** `eliware-test --ignore-100x4`,
  `eliware-test --ignore-monolith-limits`, or `eliware-test --no-runInBand`

Valid CLI options are `--help`, `--version`, `--lint`, `--ignore-100x4`,
`--ignore-monolith-limits`, `--workers=N`, `--debug-timing`,
`--runInBand`, and `--no-runInBand`. See [`../.env.example`](../.env.example)
for the only supported environment variable and its permissible value.

## Operation and validation

The CLI runs workspace policy checks, deterministic repository-convention
validation, focused-path validation, Jest with coverage, the 100%
statements/branches/functions/lines gate, source/test mapping, and Oxlint.
Convention and other pre-test failures stop before Jest. Defined consumer
`audit`, `pack`, `build`, and `typecheck` scripts are checked afterward;
undefined scripts are skipped. Examples are documentation only and are not
executed by the validator.

Coverage output is replaced by the latest run. The tool does not back up or
restore an older coverage directory. Use `eliware-test --help` for supported
diagnostic flags and exit-code behavior.

## Troubleshooting and safety

Read the emitted grouped diagnostics first. Run `npm run lint` to isolate lint
and workspace-policy failures, or run a defined package script directly to
isolate a package-check failure. The CLI runs project tests and passes through
the invoking environment, so do not run it against untrusted code while
sensitive credentials are present. Scrub fixtures and test output for secrets
before validation; comprehensive secret detection is not provided.

## Further reference

- [`usage.md`](usage.md) — supported consumer workflow and command profiles
- [`troubleshooting.md`](troubleshooting.md) — diagnosing common validation failures

- [README quick start](../README.md)
- [Normative specification](../SPEC.md)
- [Specification documents](../specs/)
- [Release notes](../RELEASE_NOTES.md)
- [Consumer example](../examples/)
