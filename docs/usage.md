# Usage

Install dependencies with `npm ci`, then run `npm test` or
`npm run format:check`. Use `eliware-test --help` for the supported CLI modes,
including linting, formatting, timing diagnostics, focused Jest execution,
and explicit coverage or monolith enforcement opt-outs.

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

The normal test command runs the configured validation stages. `audit` and
Use `npm run audit` and `npm run pack` for the isolated audit and package
validation stages. Direct CLI equivalents are `node bin/eliware-test.mjs
--audit` and `node bin/eliware-test.mjs --pack`.

To validate one focused Jest path, pass it after the npm separator. Focused
paths are rejected when they do not exist, and coverage is narrowed to an
unambiguous mirrored source module when possible:

```text
npm test -- tests/example.test.mjs
```

`--debug-timing` streams completed stage and test timing while validation is
running. Jest runs in-band by default; `--no-runInBand` is an explicit
diagnostic opt-out. Tests that stop making progress for 15 seconds are
terminated with a diagnostic, and individual tests taking more than five
seconds are reported as slow. These safeguards apply without
`--debug-timing`.

Use `--ignore-100x4` or `--ignore-monolith-limits` only for approved
diagnostics or transitional work. These flags bypass enforcement and must not
be used for release validation or CI. The former still runs tests and collects
coverage; the latter skips only monolith enforcement.
