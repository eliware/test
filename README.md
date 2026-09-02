# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/test [![npm version](https://img.shields.io/npm/v/@eliware/test.svg)](https://www.npmjs.com/package/@eliware/test)[![license](https://img.shields.io/github/license/eliware/test.svg)](LICENSE)[![build status](https://github.com/eliware/test/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/test/actions)

Shared baseline test, coverage, and lint tooling for Eliware Node.js projects. The package bundles Jest and Oxlint so consuming repositories do not need direct Jest or Oxlint dependencies.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Consumer Setup](#consumer-setup)
- [Commands](#commands)
- [Secondary Knit Validation](#secondary-knit-validation)
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
- Secondary Linux-side validation through the Knit deployment workflow.
- Native ESM package with a repository-local CLI.

## Requirements

- Node.js 26 or newer.
- npm.
- A Node.js project that keeps its tests under `tests/`.

## Installation

Install the package as a development dependency:

```bash
npm install --save-dev @eliware/test
```

## Consumer Setup

In an existing project, remove `jest`, `oxlint`, and related direct test-tool dependencies from `devDependencies` unless the project uses them at runtime or retains a separate documented workflow. Replace the standard scripts with:

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

`npm test` runs the consuming repository's Jest suite with coverage, reports only coverage gaps, then runs bundled Oxlint. Test failures, coverage gaps, lint errors, and lint warnings fail the command.

`npm run lint` runs only bundled Oxlint against the consuming repository.

Use `eliware-test --help` or `eliware-test -h` for command and invocation examples. Supported Jest filters must follow npm's `--` separator:

```text
npm test -- -t "focused test name"
npm test -- tests/client.test.mjs
npm test -- -t "rejects invalid options"
```

Wrapper-managed flags such as `--runInBand` and `--coverage` are rejected because the tool controls them. Use `eliware-test --version` or `eliware-test -v` to print the installed package version without running tests or lint.

Use `eliware-test --ignore-100x4` for diagnostic or transitional runs when tests and lint should run but coverage enforcement should be skipped. Coverage is still collected and the success summary reports `Coverage: ignored`; the normal CI baseline must continue enforcing 100×4 coverage.

Lint automatically excludes `.git`, `node_modules`, `coverage`, `.nyc_output`, `test-results`, `dist`, `build`, and package archives. Missing `.gitignore` files produce a warning with recommended entries but do not fail the run.

Output is agent-friendly by default: successful runs are summarized, child-process output is bounded with an explicit truncation notice, repeated failure lines are deduplicated, and coverage paths are normalized to the workspace.

For troubleshooting argument forwarding, set `ELIWARE_TEST_DEBUG=1` to show the exact Jest arguments received by the wrapper. This is disabled by default and should not be enabled in routine CI output.

When JSON coverage reports a gap, the output includes the four per-file percentages, comma-delimited uncovered lines, exact statement and branch locations, uncovered function names and locations, and a test-focused fix hint. Malformed or empty coverage JSON is ignored so the runner falls back to the Jest text report instead of accidentally treating missing coverage as complete.

When a focused test path is supplied, the wrapper verifies that the path exists before starting Jest. A missing path fails with a focused-path error instead of silently running the full suite. When every forwarded argument is a test path, the wrapper uses Jest's strict `--runTestsByPath` mode so only those files run.

For focused paths that follow the standard mirrored layout, coverage is scoped to matching source files (`tests/foo.test.mjs` maps to `src/foo.mjs`). This prevents imported modules from appearing as focused-run coverage gaps. If a focused path cannot be mapped unambiguously, the full coverage gate is kept.

Smoke, integration, regression, end-to-end, and other project-specific tests remain defined by the consuming project.

## Secondary Knit Validation

This repository includes `.knit/deploy.yaml` and `.knit/validate.sh` for a second, Linux-side validation path. Knit validates the exact webhook commit in a disposable worktree and runs install, test, lint, typecheck, audit, and pack checks. The script is bounded to five minutes per remote command, cleans up its worktree on success or failure, and fails closed when `KNIT_COMMIT_SHA` is missing or malformed. Keep this workflow validation-only; release and deployment actions should remain separate.

## Recommended `.gitignore` Entries

The test command generates coverage reports and may leave local package or test artifacts. Consumer repositories should exclude these generated files:

```gitignore
node_modules/
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

See [`spec.md`](spec.md) for the implementation contract and [`RELEASE_NOTES.md`](RELEASE_NOTES.md) for changes.

## Errors / Troubleshooting

Run `eliware-test --help` to inspect supported options. Use `ELIWARE_TEST_DEBUG=1` only when diagnosing argument forwarding, and verify that focused test paths exist before retrying a filtered run.

## Security

The runner executes the consuming repository's local tests and linter. Review test configuration and dependencies before running it in an untrusted repository. Do not place credentials in source, test output, coverage data, or configuration committed to version control.

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
