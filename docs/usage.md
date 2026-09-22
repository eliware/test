# Usage

Install dependencies with `npm ci`, then run `npm test` or
`npm run format:check`. Use `eliware-test --help` for the supported CLI modes,
including linting, formatting, timing diagnostics, and focused Jest execution.

## Configuration

Repositories declare their applicable convention documents in
`package.json.eliware.apply`. Authorized rule exemptions are recorded in
`package.json.eliware.exempt` with the rule ID, reason, approver, approval
timestamp, and expiry.

The validator uses the repository's declared configuration and does not infer
applicability from its files, dependencies, or project shape.

## Common commands

```text
npm test
npm run lint
npm run format
npm run format:check
npm run audit
npm run pack
eliware-test --help
eliware-test --version
```

The normal test command runs the configured validation stages. The five public
tool modes forward additional arguments to their underlying tools:

```text
eliware-test --lint --fix
eliware-test --format --ignore-path custom.ignore
eliware-test --format-check --ignore-path custom.ignore
eliware-test --audit --omit=dev
eliware-test --pack --pack-destination artifacts
```

The normal test command runs the configured validation stages. Use
`npm run audit` and `npm run pack` for the isolated audit and package
validation stages. The public CLI equivalents are `node bin/eliware-test.mjs
--audit` and `node bin/eliware-test.mjs --pack`; npm script names are not
accepted as direct CLI arguments.

To validate one focused Jest path, pass it after the npm separator. Focused
paths are rejected when they do not exist, and coverage is narrowed to an
unambiguous mirrored source module when possible. Focused validation also
checks the selected Jest run's coverage and output, runs Oxlint and Prettier
only on the selected source/test pair, and validates that pair's mirroring and
test contract. Repository-wide checks such as audit, pack, dependency,
documentation, workflow, and unrelated source/test checks remain skipped:

```text
npm test -- tests/example.test.mjs
```

`--debug-timing` streams completed stage and test timing while validation is
running. Jest runs in-band by default. Jest option/value pairs are forwarded
unchanged, and a value is not interpreted as a focused path. Tests that stop making progress for 15 seconds are
terminated with a diagnostic, and individual tests taking more than five
seconds are reported as slow. These safeguards apply without
`--debug-timing`.

Coverage and monolith checks are always enforced by the public validation
commands; no public ignore flags bypass them.

Compatibility boundaries

The validator resolves Jest, Oxlint, Prettier, and npm from the consumer
repository or supported Node.js/Windows executable locations. Workflow parsing
normalizes YAML 1.1 `true` keys and equivalent runner/input spellings before
domain checks consume them. External authority references may be unavailable
only when they are registered in `docs/authority-map.json` as cross-repository
references; unregistered or local references must resolve and fail otherwise.
Git-sensitive checks use Git
metadata when available and retain filesystem discovery only for non-Git test
fixtures.
