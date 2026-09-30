# Usage

Use Node.js 26 (`>=26 <27`). Install `@eliware/test` in the consumer repository
and use its `eliware-test` command for validation. Package scripts such as `npm test` and
`npm run format:check` are not added automatically by installing the package;
each consumer repository defines its own scripts to invoke `eliware-test`.
Use `eliware-test --help` for the supported CLI modes,
including linting, formatting, timing diagnostics, and focused Jest execution.
Focused `.test.*` and `.spec.*` test files under `tests/`
with `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, or `.cts` extensions.

## Configuration

Repositories declare their applicable convention documents in
`package.json.eliware.apply`. Authorized rule exemptions are recorded in
`package.json.eliware.exempt` with the rule ID, reason, approver, approval
timestamp, and expiry.

The validator uses the repository's declared configuration and does not infer
applicability from its files, dependencies, or project shape.

## Common commands

```text
eliware-test --help
eliware-test --version
eliware-test
eliware-test --lint
eliware-test --format-check
eliware-test --audit
```

The following npm scripts are available only in this package's own repository:
`npm test`, `npm run lint`, `npm run format`, `npm run format:check`,
`npm run audit`, and `npm run pack`. Package validation with `--pack` applies
only when the `npm-published` profile is selected.

The normal test command runs the configured validation stages. Each public
tool mode has its own accepted arguments. Audit accepts only `--no-fund` and
`--no-progress`; lint accepts only `--threads=<positive-count>`. Options such
as `--omit` that narrow the dependency scope are rejected. Pack also has its
own allowlist. Wrapper-owned settings and arguments
that weaken required checks are rejected:

```text
eliware-test --lint --fix
eliware-test --format --log-level=warn
eliware-test --format-check --log-level=debug
eliware-test --audit --no-fund
```

Lint argument forwarding is limited to a positive Oxlint thread count. Other
lint options are rejected before Oxlint starts. Validation modes select the
applicable check; repository inventory remains lazy and traverses the paths
requested by that check when it asks for repository-wide entries.

The `--pack` mode runs `npm pack` validation. The npm package contract it checks
applies to repositories that select the `npm-published` profile.

Tool modes may not be combined with a focused Jest test path. Paths supplied
to a tool mode are forwarded as tool arguments; focused paths are reserved for
the unscoped Jest validation command. Wrapper tool arguments precede arguments
after `--`, and each group preserves its original order.
Prettier arguments that override the selected mode, canonical formatting
configuration, or required maintained-file coverage are rejected.

The normal test command runs the configured validation stages. In the
`@eliware/test` repository checkout only, use `npm run audit` and
`npm run pack` for the isolated audit and package validation stages. Consumer
repositories use `eliware-test --audit` and `eliware-test --pack` (or
`node bin/eliware-test.mjs --audit` and `node bin/eliware-test.mjs --pack`);
npm script names are not accepted as direct CLI arguments.

To validate one focused Jest path, pass its repository-relative path to
`eliware-test`. Focused
paths are rejected when they do not exist, and coverage is narrowed to an
unambiguous mirrored source module when possible. Focused validation also
checks the selected Jest run's coverage and output, runs Oxlint and Prettier
only on the selected source/test pair, and validates that pair's mirroring and
test contract. It also runs convention checks explicitly marked safe for focused
validation. Those checks may inspect repository-level configuration or
metadata, so a focused run does not mean every repository-wide check is skipped.
Convention checks not marked safe for focused validation, including the
aggregate audit and pack stages, remain skipped:

```text
eliware-test tests/example.test.mjs
```

`--debug-timing` streams completed stage timing while validation is running.
The final timing summary, including per-test durations, is written after
validation completes. The timing stream is written to the CLI writer supplied
by the invocation; programmatic callers that omit a writer receive no live timing
stream. Jest runs in-band by default. Jest option/value pairs are forwarded
unchanged, and a value is not
interpreted as a focused path. If Jest produces no observable progress for 15
seconds, the watchdog terminates the run; this is a no-progress limit rather
than a per-test or total-duration limit. Individual tests taking more than five
seconds are reported as slow. These safeguards apply without
`--debug-timing`. On timeout, the harness requests graceful child termination,
escalates to forced termination after a one-second grace period, and reports
whether the child's close was observed. It returns an unconfirmed timeout
diagnostic if close is still not observed after the bounded confirmation
period; cleanup of every descendant process cannot be guaranteed.

Coverage and monolith checks are always enforced by the public validation
commands; no public ignore flags bypass them.

## Compatibility boundaries

The validator resolves Jest, Oxlint, Prettier, and npm from the consumer
repository or supported Node.js/Windows executable locations. Workflow parsing
normalizes YAML 1.1 `true` keys and equivalent runner/input spellings before
domain checks consume them. Structured references must resolve within the
consumer repository; external repository paths are rejected.
Git-sensitive checks use Git
metadata when available and retain filesystem discovery only for non-Git test
fixtures.
