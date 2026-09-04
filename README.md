# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test

Shared testing, coverage checks, and linting for Eliware Node.js projects.
Jest and Oxlint are included, so consuming projects do not need to install
them directly.

For the complete technical contract—including coverage rules, focused tests,
process behavior, workspace ownership, limitations, and release requirements,
see [`SPEC.md`](SPEC.md). This README is intentionally limited to common
setup and commands.

## Requirements

- Node.js 26 or newer
- A Node.js project with Jest-discoverable tests

## Installation

```sh
npm install --save-dev @eliware/test
```

In the consuming project's `package.json`:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

Run `npm install` after editing `package.json` so the lockfile stays current.

## Commands

```text
npm test                         Run tests, enforce 100×4 coverage, and lint
npm run lint                    Run lint only
npm test -- tests/api.test.mjs  Run a focused test file
npm test -- -t "test name"      Run tests matching a name
eliware-test --help             Show supported options
eliware-test --version          Print the installed version
```

Advanced options include `--no-runInBand` for diagnostic worker behavior and
`--ignore-monolith-limits` for temporary refactoring runs. Both are supported
diagnostic options; normal validation should use their defaults.

Tests run with coverage and are followed by linting. A successful run prints a
short summary; failures include actionable diagnostics. The normal baseline
requires 100% statements, branches, functions, and lines coverage.

Use `npm test -- --no-runInBand` only for a diagnostic run that needs Jest's
default worker behavior. Use `eliware-test --ignore-100x4` only for diagnostic
or transitional runs; tests and lint still run, but coverage enforcement is
skipped.

Source modules are limited to 100 lines and test files to 200 lines. Pure
barrels, generated files, and explicitly justified configuration exemptions
are excluded. Violations fail with stable exit code 15 and must be decomposed
with mirrored tests. During refactoring, use
`eliware-test --ignore-monolith-limits`; it still runs the suite and other
validation, but CI and release runs must enforce the limit. See `SPEC.md` for
the full contract.

Configuration exemptions belong in the consuming package's `package.json` and
must include both a glob pattern and a non-empty reason:

```json
{
  "eliwareTest": {
    "monolithLimits": {
      "exemptions": [
        { "pattern": "src/public/index.mjs", "reason": "pure export barrel" }
      ]
    }
  }
}
```

When several people or jobs work at the same time, give each one a separate
Git worktree or workspace. Coverage reports stay in the current worktree so
they can be inspected after the run. Do not run overlapping validations in
one worktree.

## Consumer migration

1. Remove direct Jest and Oxlint development dependencies unless the project
   needs them for another purpose.
2. Install `@eliware/test` as a development dependency.
3. Set `test` to `eliware-test` and `lint` to `eliware-test --lint`.
4. Run `npm install` and review the lockfile.
5. Keep smoke, integration, regression, and end-to-end checks separate.

## Recommended `.gitignore` entries

The test command creates local coverage artifacts. Consumer
repositories should normally ignore:

```gitignore
node_modules/
coverage/
coverage.json
.nyc_output/
test-results/
*.tgz
```

Keep source tests, configuration, lockfiles, and intentionally shipped
fixtures tracked. Do not use ignore rules to hide coverage gaps.

## Development

```text
node bin/eliware-test.mjs
npm test
npm run lint
```

The normal `npm test` command runs Jest, coverage enforcement, and lint.
Typecheck, audit, and package checks are consumer-specific release workflows;
they are not run by this package's application command.
Packaging is validated separately with `npm pack --dry-run`.

Use the release runbooks before publication. Never tag, publish, push, or
deploy without explicit authorization.

## Troubleshooting

Use `eliware-test --help` for supported command forms. When invoking through
npm, put Jest arguments after npm's `--` separator. Set
`ELIWARE_TEST_DEBUG=1` only when troubleshooting argument forwarding.

The package's stable interface is the CLI. See [`SPEC.md`](SPEC.md) for the
complete behavior contract and limitations.

## Security

The default mode intentionally uses the consumer's full environment, matching
direct `npm test` and Jest behavior. This package does not change Jest or try
to overcome its limitations. Do not run it against an untrusted workspace
while sensitive credentials are available.

## Support

Open an issue in the [GitHub repository](https://github.com/eliware/test/issues).

## License

MIT. See [`LICENSE`](LICENSE).

## Links

- [`SPEC.md`](SPEC.md) — complete implementation contract
- [`RELEASE_NOTES.md`](RELEASE_NOTES.md) — release history
