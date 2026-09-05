# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test) [![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE) [![build status](https://github.com/eliware/test/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/test/actions/workflows/nodejs.yml)

Shared Jest testing, coverage enforcement, and Oxlint validation for Eliware
Node.js projects using npm and the conventional `node_modules` layout.

`@eliware/test` provides one CLI for the routine checks every project should
run. Jest and Oxlint are installed as runtime dependencies, so consuming
projects do not need to install them directly.

## Requirements

- Node.js 26 or newer
- An Eliware internal Node.js project using npm and the conventional
  `node_modules` layout
- Every `src/**/*.mjs` implementation file paired with exactly one
  `tests/**/*.test.mjs` file for normal validation

Focused execution recognizes `.js`, `.mjs`, `.cjs`, `.jsx`, `.tsx`, `.cts`,
`.mts`, and `.ts` paths under `test/`, `tests/`, or `spec/`. Other extensions
require direct Jest execution and do not satisfy the canonical architecture
mapping.

## Install

```sh
npm install --save-dev @eliware/test
```

After configuring the consumer's `test` script as `eliware-test`, use
`npm test -- ...`; use `eliware-test ...` for direct invocation.

Set the consuming project's scripts:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

Review the resulting lockfile and commit it with the package change.

## Common commands

```text
npm test                         Run the full validation pipeline
npm run lint                    Run lint/policy after configuring that script
npm test -- tests/api.test.mjs  Run one focused test file
npm test -- -t "test name"      Run tests matching a name
eliware-test --help             Show supported options
eliware-test --version          Show the installed version
eliware-test --debug-timing     Show pipeline and best-effort Jest timing
```

`eliware-test -v` is an alias for `eliware-test --version`.

The normal test command runs these stages in order:

1. Workspace policy and focused-argument validation
2. Coverage cleanup
3. Source/test mapping
4. Jest with coverage and a 100% statements/branches/functions/lines gate over
   the producer-selected coverage set; focused mirrored runs may narrow it
5. Coverage evidence validation
6. Oxlint with warnings treated as failures
7. Monolith-size enforcement
8. Any defined `audit`, `pack`, `build`, and `typecheck` scripts

Focused runs use a mirrored source file when the test path maps unambiguously;
for example, `tests/api.test.mjs` can scope coverage to `src/api.mjs`. A missing
focused test path fails before Jest runs. If an existing focused test has no
unambiguous mirrored source, coverage retains the producer's broader coverage
set. Coverage validation consumes the producer's report and does not discover
omitted consumer source files independently.

The monolith limits can be customized in `package.json` when a justified
project-specific exception is needed:

```json
{
  "eliwareTest": {
    "monolithLimits": {
      "source": 100,
      "test": 200,
      "exemptions": [
        { "pattern": "src/generated/*", "reason": "Generated source" }
      ]
    }
  }
}
```

Each exemption requires a pattern and a reason; use exemptions sparingly and
prefer splitting hand-written modules. The defaults are 100 source lines and
200 test lines; the boundary is inclusive, so 100 or 200 passes and the next
line fails unless an exemption applies.

Undefined package scripts are skipped.

Use `--ignore-100x4` and `--ignore-monolith-limits` only for diagnostic or
transitional work. They do not disable tests or lint. Use `--workers=N` to
adjust monolith scanning when needed; `N` must be a positive integer and is
consumed by the wrapper, not forwarded to Jest.

Diagnostic options include `--ignore-100x4`, `--ignore-monolith-limits`,
`--no-runInBand`, and `--workers=N`.

For direct CLI diagnostics, use `eliware-test --no-runInBand`,
`eliware-test --ignore-100x4`, `eliware-test --ignore-monolith-limits`, or
`eliware-test --workers=N`. These options are also available after `npm test --`;
for example, `npm test -- --ignore-100x4 --workers=6`.

Supported filters are forwarded, but wrapper-managed Jest options such as
`--coverage`, `--silent`, `--detectOpenHandles`, `--coverageReporters`, and
`--runTestsByPath` are rejected. Use `eliware-test --help` for the contract.
For example, `npm test -- --ignore-100x4` uses a wrapper option, while
`npm test -- -t "test name"` forwards a Jest filter.

Validation stops at the first applicable failure and reports a stable wrapper
exit code. Focused paths are validated before Jest runs; a missing path never silently
falls back to the full suite. The CLI cannot coordinate concurrent runs: do not
overlap validations in one worktree because they may overwrite shared coverage
artifacts. Use separate worktrees for concurrent jobs.

The command-line interface exits with the numeric codes documented in the
specification. Internal and test callers of the toolkit boundary receive a
structured result with `code` and `category`; this is not a supported consumer
library API.

After an interrupted run, stop overlapping jobs and remove stale
`.eliware-test-coverage/` or `coverage.previous/` directories if they are no
longer needed before retrying.

See the [exit-code table](spec/cli.md#3-commands-and-lifecycle) in the
specification for numeric meanings used by CI and troubleshooting.

The most common CI failures are 4 (invalid argument), 9 (test failure),
10/11 (coverage failure or gap), 13 (lint failure), 15 (monolith limit),
16 (source/test mapping drift), and 17 (configured package-script failure).
This is a common-failure summary; see the complete exit-code table for all
workspace, policy, focused-path, cleanup, startup, and internal failures.
Exit code 0 means every applicable stage succeeded.

## Consumer migration

When moving an existing project to this package:

1. Remove direct Jest and Oxlint development dependencies unless required by
   runtime code or a separately documented workflow.
2. Install `@eliware/test` as a development dependency.
3. Set `test` and `lint` to the commands shown above.
4. Keep project-specific smoke, integration, regression, and end-to-end checks
   as separate scripts.

## Generated files

Consumer repositories should normally ignore the generated files listed in
[`spec/migration-and-release.md`](spec/migration-and-release.md):

```gitignore
node_modules/
coverage/
coverage.json
.nyc_output/
.eliware-test-coverage/
coverage.previous/
test-results/
build/
dist/
*.tgz
*.log
```

The runtime warning for a missing `.gitignore` is intentionally shorter, but
these are the complete generated-artifact recommendations.

Istanbul ignore directives are checked before Jest runs. They are allowed
only in pure import/export barrel modules; remove an ignore from executable
code or split the barrel before rerunning validation.

Do not use ignore rules to hide source files or coverage gaps.

## Security and diagnostics

Run the CLI only against trusted workspaces and scrub code, fixtures, and logs
before testing sensitive projects. The consumer environment is passed through,
and child-process diagnostics may preserve secrets printed by consumer code.
See the process-trust specification for the complete behavior.

## Further documentation

- [`SPEC.md`](SPEC.md) — normative behavior, coverage, architecture, and
  limitations
- [`spec/`](spec/) — detailed contract sections
- [`RELEASE_NOTES.md`](RELEASE_NOTES.md) — release history

## Development

```text
node bin/eliware-test.mjs  Repository-local executable validation
npm test                    Consumer-style full validation
npm run lint                Standalone lint/policy diagnostics
```

## License

MIT. See [`LICENSE`](LICENSE).
