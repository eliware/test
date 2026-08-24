# Eliware standard testing toolkit

## Purpose

`@eliware/test` provides the shared baseline test tooling for Eliware Node.js
projects and libraries. It keeps routine test, coverage, and lint behavior
consistent across Linux and Windows while allowing each project to retain its
own smoke, integration, regression, end-to-end, and other specialized tests.

This package is a development standard, not a replacement for project-specific
testing. A project must still define and run any tests required by its own
runtime, API, deployment, or product behavior.

Reducing routine test output is a primary design goal. These commands run
frequently during AI-assisted development, so repetitive passing test output
and already-complete coverage reports waste substantial context and token
budget. The default output should be concise enough to remain useful in an
interactive development session.

## Required project commands

Projects adopting this toolkit use these scripts:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

`npm test` is the normal development and CI baseline. It runs the full unit
test suite with coverage, reports only coverage gaps, and then runs lint. When
everything passes and no gaps exist, it should print a short success summary,
not the individual passing test names, verbose Jest report, or full coverage
table.

`npm run lint` runs lint only. It must fail on both lint errors and warnings.

## Combined test behavior

The default `eliware-test` command must:

1. Run the repository's configured Jest test suite with coverage enabled.
2. Suppress individual passing test names, passing suite details, snapshots,
   timing noise, and the full coverage table during successful runs.
3. Preserve concise failure diagnostics, including the failed test names,
   assertion messages, relevant stack traces, and the failing stage.
4. Display a concise table containing only files with a statement, branch,
   function, or line coverage value below 100%.
5. Omit every file already at 100% statements, branches, functions, and lines.
6. Fail when any coverage gap exists.
7. Run Oxlint with warnings treated as failures.
8. Suppress passing lint details and print only warnings/errors or a compact
   success result.
9. Fail if tests, coverage, or lint fail.
10. Return a nonzero exit code for any failed stage.

The complete test runner output may be captured internally so the normal
command remains focused on actionable gaps. On failure, enough diagnostics must
remain available to identify the failed stage and reproduce it. A successful
run with no gaps should ideally be one or two lines, for example:

```text
Tests passed: 184 | Coverage: 100×4 | Lint: 0 warnings
```

The tool must never trade away failure information merely to reduce output.

## Standalone lint behavior

`eliware-test --lint` runs only Oxlint from the consuming repository. It must
use the repository's source tree as the lint target and must reject warnings;
there is no warning-tolerant mode in the standard baseline.

## Focused tests

Arguments after `npm test --` are forwarded to the unit-test runner so a
developer can run a focused test without invoking the entire suite, for
example:

```text
npm test -- tests/client.test.mjs
npm test -- -t "rejects invalid options"
```

Focused runs still use coverage and the same failure rules. The standalone
lint command remains available when only linting is needed.

## Cross-platform requirements

The implementation must use Node.js APIs and child-process argument arrays.
It must not depend on Unix shell pipelines, `grep`, shell quoting, or platform-
specific executable names. It must work with npm's Windows command resolution,
Windows CRLF output, Linux LF output, and ANSI-formatted runner output.

Coverage parsing must recognize the standard Jest text table and determine
gaps from all four metrics: statements, branches, functions, and lines. A
summary that is numerically 100% but has raw uncovered counters must not be
treated as complete.

## Coverage standard

Every in-scope, non-barrel implementation file must reach:

- 100% statements;
- 100% branches;
- 100% functions; and
- 100% lines.

Coverage is a regression feedback mechanism and an AI-development guardrail.
It does not prove that behavior is correct and does not replace meaningful
integration, regression, smoke, or end-to-end tests.

## Project-specific tests

The toolkit must not require or invent project-specific commands such as:

- `test:unit`;
- `test:smoke`;
- `test:integration`;
- `test:regression`; or
- `test:e2e`.

Projects that need those checks may define their own scripts and CI jobs. Their
release and deployment procedures must document and run the applicable checks
in addition to this baseline.

## CI and release expectations

CI must run the baseline on both Ubuntu and Windows. Lint warnings are failures
and must block publication. Release validation must confirm the latest required
Ubuntu and Windows checks passed before publishing.

The toolkit itself must test its command orchestration, failure propagation,
coverage filtering, argument forwarding, ANSI/CRLF handling, and Windows/Linux
process invocation behavior.

## Bundled baseline distribution

`@eliware/test` is the single bundled baseline tool. Consumer repositories must
not need direct Jest or Oxlint dependencies for the standard workflow.

The package must:

- use the scoped name `@eliware/test`;
- publish with an initial package version of `1.0.0`;
- declare Jest and Oxlint as runtime dependencies bundled by the package;
- expose the `eliware-test` executable;
- include complete npm metadata, keywords, repository information, licensing,
  and an explicit packed-file allowlist;
- keep package metadata and the lockfile synchronized.

The consumer standard scripts are:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint"
  }
}
```

The toolkit repository may invoke its own executable through
`node bin/eliware-test.mjs` because npm does not link a package's own `bin`
entry during that package's scripts. Its `npm test` and `npm run lint` commands
must nevertheless exercise the same self-entrypoint and behavior.

## Existing-project migration

Migration documentation must instruct project owners to:

1. Remove direct Jest and Oxlint development dependencies unless they are
   required by runtime code or a separate documented workflow.
2. Install `@eliware/test` as a development dependency.
3. Replace the standard `test` script with `eliware-test`.
4. Replace the standard `lint` script with `eliware-test --lint`.
5. Run `npm install` and review the synchronized lockfile.
6. Keep smoke, integration, regression, and end-to-end checks project-defined
   and separate from the baseline commands.

## Generated coverage JSON

After a successful Jest run, the toolkit should look for generated Istanbul/Jest
JSON coverage in this order:

1. `coverage/coverage-final.json`;
2. `coverage/coverage.json`;
3. `coverage.json`.

When available, JSON is the authoritative source for exact uncovered statement
locations, branch locations, and function names. If no usable JSON exists, the
tool falls back to the standard Jest text table. Stale generated JSON must not
be reused for a new run.

Coverage-gap output should identify the affected file and exact uncovered
locations, while successful output remains minimal.

## Intentional validation fixtures

The toolkit may retain excluded fixtures for regression testing its diagnostics:

- an intentionally failing test fixture verifies failed-test output;
- a passing test with an uncovered branch verifies coverage-gap output.

These fixtures must be excluded from the normal full suite and invoked only by
explicit regression tests or validation commands. Their existence must not
make the standard self-test fail.

## Generated artifacts and repository hygiene

Consumer repositories should ignore generated artifacts including:

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

Source tests, lockfiles, configuration, and intentionally shipped fixtures
must remain trackable. Ignoring coverage output must never be used to conceal
coverage gaps.

## Documentation and contributor guidance

The package must provide a README describing installation, migration, consumer
commands, focused tests, coverage/lint behavior, generated artifacts, and the
separation of project-specific test tiers. It must also provide `AGENTS.md`
with contributor, package, validation, and migration guidance.
