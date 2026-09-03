# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test)[![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE)[![build status](https://github.com/eliware/test/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/test/actions/workflows/nodejs.yml)

Shared Jest testing, coverage enforcement, and Oxlint validation for Eliware Node.js projects. The package bundles Jest and Oxlint so consuming repositories do not need direct Jest or Oxlint dependencies.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Consumer Setup](#consumer-setup)
- [Commands](#commands)
- [Recommended `.gitignore` Entries](#recommended-gitignore-entries)
- [Development](#development)
- [Errors / Troubleshooting](#errors--troubleshooting)
- [Security](#security)
- [Support](#support)
- [License](#license)
- [Links](#links)

## Features

- Shared Jest test execution with coverage enforcement.
- Bundled Oxlint execution for consuming repositories.
- Agent-friendly summaries, bounded output, and normalized coverage paths.
- Focused test-path validation and strict `--runTestsByPath` handling.
- Detailed coverage-gap diagnostics with uncovered lines, branches, statements, and functions.
- Optional diagnostic coverage bypass through `--ignore-100x4`.
- Fail-closed coverage validation for annotated and malformed reports.
- Explicit focused-test selection and optional sanitized child-process environments.
- Native ESM package with a repository-local CLI.

## Requirements

- Node.js 26 or newer.
- npm.
- A Node.js project with Jest-discoverable test files; `tests/` is the
  recommended standard location for consumer-owned tests.

## Installation

Install the package as a development dependency:

```bash
npm install --save-dev @eliware/test
```

## Consumer Setup

In an existing consuming project, remove `jest`, `oxlint`, and related direct test-tool dependencies from `devDependencies` unless the project uses them at runtime or retains a separate documented workflow. Replace the standard scripts with:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

Run `npm install` after editing `package.json` so the lockfile stays synchronized.

## Commands

`npm test` runs the consuming repository's unfiltered Jest suite with coverage, reports only coverage gaps or failures, then runs bundled Oxlint. Successful child output controlled by this package is intentionally suppressed and replaced by a minimal summary; npm may still print its own lifecycle notices, and the package may print a missing `.gitignore` warning before that summary; gap runs emit detailed diagnostics. Captured child-process output is bounded in JavaScript characters and marked when truncated. Generated coverage-gap details are rendered separately and are not subject to that capture bound. Test failures, coverage gaps, lint errors, and lint warnings fail the command. Supplying extension-qualified focused file paths runs only those selected tests; paths combined with Jest name/config filters use Jest's normal filter semantics. The repository's own Windows-specific shim test is conditional when a Windows shim is unavailable; consumer CI should provide the required platform checks.

`npm run lint` runs only bundled Oxlint against the consuming repository. Runs
sharing one consumer working directory must be serialized because each run
cleans and reads that workspace's coverage artifacts; the tool deliberately
does not create a cross-process lock. Use CI job/workspace serialization when
parallel invocations are possible.

Pass `eliware-test --sanitize-env` to run Jest and Oxlint with an empty base
environment; explicitly supplied tool variables are still forwarded. The
default inherits the consumer environment for normal npm and tool resolution.
Use the sanitized mode in CI when the workspace or its dependencies are not
fully trusted.

Coverage text parsing remains whole-buffer because captured output is capped at
16 KiB. The orchestration function and injected APIs are intentionally kept as
advanced composition seams; the CLI is the stable consumer interface. Named
TypeScript interfaces document those seams, while direct parser diagnostics are
best-effort. Empty or malformed line data is handled with finite metrics, and
unmappable focused paths intentionally retain broad coverage enforcement.

The wrapper suppresses successful child-process output that it controls; npm
lifecycle notices and non-failing workspace warnings may still be printed.

Captured child-process diagnostics are bounded to 16 KiB and may include a
truncation marker when a child process emits more output. Generated coverage
gap details are rendered separately and are not included in that capture
limit; terminal process-error text may be included within the final bounded
diagnostic without preserving exact original omission accounting. Direct
coverage-parser calls are
best-effort diagnostics; malformed or incomplete JSON is not authoritative,
and the runner falls back to a validated text report or fails closed. JSON
coverage uses Istanbul `l` line counters when present; without `l`, line
coverage is derived from statement locations. Malformed `l` maps are rejected
as unusable evidence.

Use `eliware-test --help` or `eliware-test -h` for command and invocation examples. When invoking through npm, put Jest filters after npm's `--` separator; direct `eliware-test` calls receive those filters as ordinary arguments:

The package entry point also exports parser and orchestration functions for
advanced integrations. Those functions are a typed composition surface and
require injected process collaborators; ordinary consumers should use the
CLI scripts above, whose defaults and exit-code contract are stable.

```text
npm test -- -t "focused test name"
npm test -- tests/client.test.mjs
npm test -- -t "rejects invalid options"
```

Wrapper-managed flags such as `--coverage` are rejected because the tool
controls them. `--runInBand` is silently accepted; use `--no-runInBand` only
for the explicit opt-out described below. Use `eliware-test --version` or
`eliware-test -v` to print the installed package version without running tests
or lint.

Jest runs in-band by default. Pass `npm test -- --no-runInBand` only when a
diagnostic run explicitly needs Jest's default parallel execution; this opt-out
disables the wrapper's in-band setting for that invocation.

Path values consumed by Jest options such as `--config` and `--projects` are
delegated to Jest and are not treated as focused test paths by the wrapper.
The wrapper skips those option values while checking positional focused paths;
use an explicit test path outside an option value when strict path selection is
required.

Use `eliware-test --ignore-100x4` for diagnostic or transitional runs when tests and lint should run but coverage enforcement should be skipped. Coverage is still collected and the success summary reports `Coverage: ignored`; the normal CI baseline must continue enforcing 100×4 coverage.

Lint automatically excludes `.git`, `node_modules`, `coverage`, `.nyc_output`, `test-results`, `dist`, `build`, and package archives. Missing `.gitignore` files produce a warning with recommended entries but do not fail the run.

Output is agent-friendly by default: successful runs are summarized, captured child-process output including any truncation notice is bounded at 16 KiB of JavaScript string length (UTF-16 code units), while formatted coverage-gap details are intentionally rendered separately from that capture bound, and final diagnostics remain bounded after terminal process errors are appended. Repeated failure lines are deduplicated, and coverage paths are normalized to the workspace. The bound is intentionally not a byte-level transport limit. Diagnostics are human-readable text; structured output is not part of the package contract.

Combined stdout/stderr diagnostics preserve each stream's captured content but
do not promise ordering between the two child-process streams.

Coverage-gap details are rendered outside the child capture bound, with each
detail category limited to 20 displayed entries.

For troubleshooting argument forwarding, set `ELIWARE_TEST_DEBUG=1` to show the exact Jest arguments received by the wrapper. This is disabled by default and should not be enabled in routine CI output. Annotated coverage percentages are compared after rounding to two decimal places; the displayed percentage must match the raw counter ratio at that precision, but an annotated value below 100% remains a gap even if it rounds to 100%. Percentage-only values must be exactly `100%` (optionally followed only by zeroes) to be complete.
Accepted percentage syntax is numeric digits with an optional decimal point and
digits, optionally followed by a raw-counter annotation such as `(4/5)`;
the decimal point must be followed by at least one digit (`100.%` is invalid),
and malformed suffixes or contradictory annotations are rejected as coverage
gaps.

The runner inherits the consumer's environment so repository tooling resolves normally. Do not run it against an untrusted repository while sensitive credentials or other secrets are present in the environment.

Advanced API callers should treat collaborator injection as a test/composition
seam, not as the primary consumer interface. The CLI is the supported consumer
boundary; parser and orchestration exports are advanced public composition APIs
for testing and integration, while process helpers remain private.

When JSON coverage reports a gap, the output includes the four per-file percentages, comma-delimited uncovered lines, exact statement and branch locations, uncovered function names and locations, and a test-focused fix hint. Malformed or empty coverage JSON advances through the documented JSON candidates and then falls back to the Jest text report; filesystem errors while reading coverage are surfaced and fail the command instead of being treated as complete.

The JSON coverage parser is intentionally best-effort because its output is diagnostic. It reports malformed counters, missing locations, and incomplete metadata as conservative gaps where possible. For coverage candidates, malformed JSON, empty or unusable JSON, and missing files advance to the next candidate; other filesystem read errors fail the run. The runner remains the authoritative enforcement boundary: it selects trusted current-run coverage artifacts, rejects unusable evidence, and fails closed when no usable coverage report exists. Consumers should rely on the runner result rather than treating direct parser diagnostics as a strict coverage schema. Captured diagnostics are bounded to 16 KiB; successful child output is suppressed in normal mode, while failures, coverage gaps, and `ELIWARE_TEST_DEBUG=1` diagnostics are emitted.

For example, a focused run maps `tests/api/status.test.mjs` to
`src/api/status.mjs` when that source exists. A gap is reported as
`src/api/status.mjs | 80% | 50% | 100% | 80% | uncovered lines: 12, 18`,
followed by the exact uncovered statement, branch, and function locations.

When a focused test path is supplied, the wrapper verifies that the path exists before starting Jest. A missing path fails with a focused-path error instead of silently running the full suite. When every forwarded argument is a test path, the wrapper uses Jest's strict `--runTestsByPath` mode so only those files run.

Strict file selection applies to arbitrary extension-qualified paths; narrow
coverage mapping is limited to the documented mirrored `tests`/`test`/`spec`
to `src` layout. Other focused paths retain broad coverage enforcement.

For focused paths that follow the standard mirrored layout, coverage is scoped to matching source files (`tests/foo.test.mjs` maps to `src/foo.mjs`). This prevents imported modules from appearing as focused-run coverage gaps. If a focused path cannot be mapped unambiguously, the full coverage gate is kept.

Selection and coverage scope are separate: file-only invocations select only
the supplied files; mixed path/name/config invocations follow Jest semantics.
Unmappable focused paths retain broad coverage enforcement.

Smoke, integration, regression, end-to-end, and other project-specific tests remain defined by the consuming project.

Mirrored focused coverage mapping preserves supported source extensions such as
`.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.jsx`, and `.tsx`; if a source
cannot be found unambiguously, broad coverage enforcement remains enabled.
Strict file-only selection applies to conventional paths containing `tests`,
`test`, or `spec`; other Jest file paths remain delegated to Jest's normal
selection semantics.

The exported orchestration functions are advanced, injection-based composition
APIs and are versioned with the package; consuming projects should use the CLI
commands above for the stable interface.

## Recommended `.gitignore` Entries

The test command generates coverage reports and may leave local package or test artifacts. Consumer repositories should exclude these generated files:

```gitignore
node_modules/
dist/
build/
coverage/
.nyc_output/
test-results/
*.tgz
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

Keep source tests, configuration, lockfiles, and intentionally shipped fixtures tracked. Do not ignore coverage gaps as a substitute for fixing or testing the uncovered behavior.

## Development

```bash
npm install
npm test
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

This package intentionally uses `node bin/eliware-test.mjs` for its own `test` and `lint` scripts so it can validate the local runner implementation before that runner is published. Consuming repositories must use the standard `eliware-test` and `eliware-test --lint` commands described above.

The package's own scripts exercise the local CLI; a consuming repository's
scripts exercise that repository's Jest suite and lint target.

See [`spec.md`](spec.md) for the implementation contract and [`RELEASE_NOTES.md`](RELEASE_NOTES.md) for changes.

## Errors / Troubleshooting

### Exit codes

The wrapper uses stable, distinct exit codes for its failure categories. A
Jest or Oxlint child-process exit code is retained in the diagnostic text but
does not replace the wrapper code.

| Code | Failure |
| ---: | --- |
| 2 | Workspace setup |
| 3 | Istanbul-ignore policy violation |
| 4 | Invalid or unsupported argument |
| 5 | Focused-path validation |
| 6 | Focused test path missing |
| 7 | Coverage cleanup |
| 8 | Jest failed to start |
| 9 | Jest test failure |
| 10 | Coverage report failure |
| 11 | Coverage gap |
| 12 | Oxlint failed to start |
| 13 | Oxlint failure or warning |
| 14 | Unexpected CLI/internal failure |

After tests, coverage, and lint pass, `npm test` also runs
`npm audit --omit=dev --audit-level=moderate --ignore-scripts` and
`npm pack --dry-run --ignore-scripts`.
Failures in those checks return distinct exit codes `15` and `16` respectively.
Exit code `0` means all validation completed successfully.

Run `eliware-test --help` to inspect supported options. Use `ELIWARE_TEST_DEBUG=1` only when diagnosing argument forwarding, and verify that focused test paths exist before retrying a filtered run.

Advanced `runToolkit` callers should pass the same argument list they intend
the wrapper to normalize; the wrapper removes a standalone `--` separator and
uses that normalized list consistently for path validation, focused selection,
and Jest execution. The CLI remains the supported consumer interface.

## Security

The runner executes the consuming repository's local tests and linter, and
child processes inherit the consumer environment. Review test configuration
and dependencies before running it in an untrusted repository; consumer code
can read or expose inherited credentials. Do not place credentials in source,
test output, coverage data, or configuration committed to version control.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## License

This package is distributed under the terms in [`LICENSE`](LICENSE).

## Links

- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/test)
- [GitHub Org](https://github.com/eliware)
- [Discord](https://discord.gg/M6aTR9eTwN)
