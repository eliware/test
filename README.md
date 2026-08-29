# @eliware/test

Shared baseline test, coverage, and lint tooling for Eliware Node.js projects.
The package bundles Jest and Oxlint so consuming repositories do not need
direct Jest or Oxlint dependencies.

## Requirements

Node.js 26 or newer and npm. The package uses native ESM and is intended for
Node.js projects that keep their tests under `tests/`.

## Consumer setup

```text
npm install --save-dev @eliware/test
```

In an existing project, remove `jest`, `oxlint`, and related direct test-tool
dependencies from `devDependencies` unless the project uses them at runtime
or retains a separate documented workflow. Replace the standard scripts with:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

Run `npm install` after editing `package.json` so the lockfile stays
synchronized.

## Commands

`npm test` runs the consuming repository's Jest suite with coverage, reports
only coverage gaps, then runs bundled Oxlint. Test failures, coverage gaps,
lint errors, and lint warnings fail the command.

`npm run lint` runs only bundled Oxlint against the consuming repository.

Use `eliware-test --help` or `eliware-test -h` for command and invocation
examples. Jest arguments must follow npm's `--` separator, for example
`npm test -- --runInBand`.

Lint automatically excludes `.git`, `node_modules`, `coverage`, `.nyc_output`,
`test-results`, `dist`, `build`, and package archives. Missing `.gitignore`
files produce a warning with recommended entries but do not fail the run.

Output is agent-friendly by default: successful runs are summarized, child
process output is bounded with an explicit truncation notice, repeated failure
lines are deduplicated, and coverage paths are normalized to the workspace.

For troubleshooting argument forwarding, set `ELIWARE_TEST_DEBUG=1` to show
the exact Jest arguments received by the wrapper. This is disabled by default
and should not be enabled in routine CI output.

When JSON coverage reports a gap, the output includes the four per-file
percentages, comma-delimited uncovered lines, exact statement and branch
locations, uncovered function names and locations, and a test-focused fix hint.

Arguments after `npm test --` are forwarded to Jest:

```text
npm test -- tests/client.test.mjs
npm test -- -t "rejects invalid options"
```

When a focused test path is supplied, the wrapper verifies that the path exists
before starting Jest. A missing path fails with a focused-path error instead of
silently running the full suite.

Smoke, integration, regression, end-to-end, and other project-specific tests
remain defined by the consuming project.

## Secondary Knit validation

This repository includes `.knit/deploy.yaml` and `.knit/validate.sh` for a
second, Linux-side validation path. Knit validates the exact webhook commit in
a disposable worktree and runs install, test, lint, typecheck, audit, and pack
checks. The script is bounded to five minutes per remote command, cleans up its
worktree on success or failure, and fails closed when `KNIT_COMMIT_SHA` is
missing or malformed. Keep this workflow validation-only; release and
deployment actions should remain separate.

## Recommended `.gitignore` entries

The test command generates coverage reports and may leave local package or test
artifacts. Consumer repositories should exclude these generated files:

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

Keep source tests, configuration, lockfiles, and intentionally shipped
fixtures tracked. Do not ignore coverage gaps as a substitute for fixing or
testing the uncovered behavior.

## Security

The runner executes the consuming repository's local tests and linter. Review
test configuration and dependencies before running it in an untrusted
repository. Do not place credentials in source, test output, coverage data,
or configuration committed to version control.

## Development

```text
npm install
npm test
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

This package intentionally uses `node bin/eliware-test.mjs` for its own
`test` and `lint` scripts so it can validate the local runner implementation
before that runner is published. Consuming repositories must use the standard
`eliware-test` and `eliware-test --lint` commands described above.

See [`spec.md`](spec.md) for the implementation contract and
[`RELEASE_NOTES.md`](RELEASE_NOTES.md) for changes.

## License and support

This package is distributed under the terms in [`LICENSE`](LICENSE). Report
issues at the [GitHub issue tracker](https://github.com/eliware/test/issues).
