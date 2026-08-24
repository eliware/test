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

When JSON coverage reports a gap, the output includes the four per-file
percentages, comma-delimited uncovered lines, exact statement and branch
locations, uncovered function names and locations, and a test-focused fix hint.

Arguments after `npm test --` are forwarded to Jest:

```text
npm test -- tests/client.test.mjs
npm test -- -t "rejects invalid options"
```

Smoke, integration, regression, end-to-end, and other project-specific tests
remain defined by the consuming project.

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
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

See [`spec.md`](spec.md) for the implementation contract and
[`RELEASE_NOTES.md`](RELEASE_NOTES.md) for changes.

## License and support

This package is distributed under the terms in [`LICENSE`](LICENSE). Report
issues at the [GitHub issue tracker](https://github.com/eliware/test/issues).
