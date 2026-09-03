# `@eliware/test` specification

## 1. Scope and status

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects. It is a
development tool, not a replacement for project-specific smoke, integration,
regression, end-to-end, deployment, or product tests.

This document is the normative contract for the published CLI. Statements
using **must** or **must not** are requirements. **Intentional limitations**
describe supported behavior that is deliberately constrained. **Out of scope**
identifies behavior this package does not promise. The README provides
user-facing examples; this file resolves contract ambiguities.

## 2. Supported environment and package contract

- Source and tests use native ESM and `.mjs` files; Node.js 26 or newer is
  required.
- Jest and Oxlint are runtime dependencies and are resolved from the consumer
  workspace using their package contracts.
- The package exposes the `eliware-test` executable and `@eliware/test` module.
- Package metadata, lockfile, exports, declarations, README, release notes,
  and packed-file allowlist must remain synchronized.
- Consumers use `eliware-test` for `test` and `eliware-test --lint` for `lint`.
  This repository invokes `node bin/eliware-test.mjs` because npm does not link
  a package's own `bin` entry while running its scripts.
- Process execution uses Node child-process APIs and argument arrays, not Unix
  pipelines, shell quoting, `grep`, or platform-specific executable names.

## 3. CLI commands and lifecycle

`eliware-test` runs these stages in order:

1. Scan the workspace for disallowed Istanbul-ignore directives.
2. Check workspace setup and warn, without failing, when `.gitignore` is absent.
3. Validate wrapper-managed and focused-path arguments.
4. Remove stale coverage candidates.
5. Run Jest with coverage.
6. Select and validate coverage evidence.
7. Run `npm run build` only when the consumer has a non-empty `scripts.build`.
8. Run Oxlint with warnings denied.
9. Run npm audit and npm pack through the CLI-wired collaborators.

Build therefore runs after coverage and before lint; audit and pack run after
lint. Audit and pack are wired by the executable, while direct advanced
`runToolkit` callers may omit them.

Stages stop at the first applicable failure. Direct advanced `runToolkit`
callers may omit optional build, audit, or pack collaborators; the executable
CLI supplies them. The package self-test proves tests, coverage, and lint; its
concise output is not evidence that consumer-only stages were visually printed.

`--lint` runs only workspace policy, setup, and Oxlint. It rejects warnings and
test arguments. `--help`/`-h` and `--version`/`-v` are terminal modes and do not
run validation. Version output comes from `package.json`.

Stable wrapper exit codes are: workspace setup `2`, Istanbul policy `3`,
invalid argument `4`, focused-path validation `5`, missing focused path `6`,
coverage cleanup `7`, test startup `8`, test failure `9`, coverage failure
`10`, coverage gap `11`, lint startup `12`, lint failure `13`, internal failure
`14`, audit failure `15`, pack failure `16`, build failure `17`, and monolith
limit failure `18`.

## 5. Implementation and test file-size limits

The normal CLI run enforces focused-file decomposition limits:

- source modules under `src/` may contain at most 300 lines;
- test files under `test/` or `tests/` may contain at most 600 lines;
- pure import/export barrels and generated files are exempt;
- any other exemption must be explicitly configured with a non-empty glob
  pattern and justification under `eliwareTest.monolithLimits.exemptions`.

Every violation is reported with its normalized path, line count, threshold,
and required action: decompose the file into focused modules and add the
corresponding mirrored tests. Every violation fails with exit code 18, and
the diagnostic lists all violations.

`eliware-test --ignore-monolith-limits` is a temporary refactoring bypass. It
still runs Jest, coverage, lint, build, audit, and pack and reports their
failures; it only suppresses the size-limit failure. CI, release, and normal
validation must not use this bypass, but developers may use it while
decomposing existing violations.

## 4. Arguments and focused tests

- Wrapper-owned options (`--coverage`, `--detectOpenHandles`, `--silent`,
  `--coverageReporters`, and `--runTestsByPath`) are rejected because the
  baseline owns those guarantees.
- `--runInBand` is accepted and normalized to the default. `--no-runInBand`
  explicitly opts out for diagnostic runs.
- `--ignore-100x4` skips enforcement only; tests, coverage collection, lint,
  build, audit, and pack behavior otherwise remain unchanged.
- `--sanitize-env` runs child tools with an empty base environment while
  retaining explicitly supplied tool variables.
- A standalone `--` separator is removed once before Jest invocation.
- One shared metadata list defines supported Jest value options; their values
  are never treated as positional focused paths.
- Existing paths under conventional `tests/`, `test/`, or `spec/` directories
  are checked before Jest starts. Missing paths fail clearly and never fall
  back to the full suite. Bare filters and source-like arguments remain Jest's
  responsibility.
- When all positional selections are conventional test paths, the wrapper
  passes `--runTestsByPath`. Mixed path/name/config filters retain Jest
  semantics.

## 5. Coverage enforcement

Every in-scope implementation file must reach 100% statements, branches,
functions, and lines independently. Coverage is a regression guard, not proof
of behavioral correctness.

### Text coverage

The parser recognizes the standard Jest table, including CRLF and ANSI output,
and reports only incomplete files. Zero-valued metrics are gaps. Percentage-only
values are complete only when exactly `100%` (optional zeroes may follow).
Annotated values must agree with their raw counter ratio after rounding to two
decimal places; a displayed value below 100% remains a gap even if its ratio
rounds to 100%. Malformed annotations and ratios fail closed as gaps.

### Istanbul JSON coverage

Candidates are considered in order:

1. `coverage/coverage-final.json`
2. `coverage/coverage.json`
3. `coverage.json`

Stale candidates are removed before Jest runs. Missing, malformed, empty, or
structurally unusable candidates advance to the next candidate; other read
errors fail. The first usable candidate is authoritative and candidates are
not merged. If none is usable, completed bounded Jest output is used only when
it contains a structurally valid coverage table. That completed child output,
after pre-run candidate cleanup, is the intentional text-fallback trust
boundary; provenance beyond the completed invocation is not claimed. Otherwise
validation fails closed.

JSON diagnostics are best-effort, while runner evidence validation is strict.
Malformed or missing counter maps are reported conservatively as explicit
unknown uncovered diagnostics. When an Istanbul
`l` map exists, it is authoritative for line coverage. Statement, branch,
function, and line metrics remain independent; malformed statement data does
not rewrite valid `l` line data. An empty line map with no unknown lines has no
measurable denominator and is complete for that metric. Multiple statements on
one line make that line uncovered when any statement is uncovered.

Focused file-only runs following the mirrored layout map `tests/foo.test.mjs`
to `src/foo.mjs` only when exactly one supported source candidate exists. Zero
or multiple candidates retain broad coverage enforcement. Debug mode reports
this fallback; normal output remains concise.

Coverage-gap diagnostics include normalized paths, four percentages, uncovered
lines, statement/branch locations, function names and locations, and an
actionable testing hint. Pure barrel files may be identified as suggestions;
executable files must not be hidden with Istanbul-ignore comments.

## 6. Output and diagnostics

Successful child output controlled by the wrapper is suppressed and replaced by
a concise summary. npm lifecycle notices and non-failing workspace warnings
may still appear. Failures preserve the stage, useful test names, assertions,
stacks, lint findings, and coverage details.

Captured child diagnostics are bounded to 16 KiB of JavaScript string length,
not bytes. Truncation is explicit, repeated failure lines are deduplicated,
and absolute coverage paths are normalized relative to the workspace. Coverage
gap details are rendered separately from the child-output bound. stdout and
stderr are captured independently and combined without a promise of exact
cross-stream temporal ordering. Decoder replacement is allowed for printable
diagnostics.

`ELIWARE_TEST_DEBUG=1` enables exact forwarded-Jest-argument and selected
coverage-fallback diagnostics. Debug output is disabled by default. Bounded
human-readable text plus the exit code is the stable diagnostics contract;
structured diagnostics are not currently exposed.

## 7. Workspace policy and process trust

Discovery and linting exclude `.git`, `node_modules`, `coverage`, `.nyc_output`,
`test-results`, `dist`, `build`, and package archives. Missing `.gitignore`
produces a warning with recommended entries but does not fail validation.

The default child environment is inherited intentionally to preserve drop-in
compatibility with a direct `npm test` command that invokes Jest. If a project
works when Jest is invoked directly, this package should pass the same ambient
environment through; it does not change Jest behavior, compensate for Jest
limitations, or provide a new security boundary. Consumers must not run the
default mode against an untrusted workspace while secrets are present.
`--sanitize-env` is the explicit opt-in isolation mode. An environment
allowlist and automatic secret redaction are not part of this release.

Bundled Oxlint and npm invocations use Node's executable and supported
package/runtime entrypoint contracts, preserving argument-array boundaries on
Windows and Unix-like systems. CI, rather than an unavailable local shim, is
the authoritative source of required Windows evidence.

## 8. Concurrency and shared workspace artifacts

`@eliware/test` uses the consumer's current worktree as its validation
workspace. Jest's standard coverage locations remain in that worktree so the
developer or agent can inspect `coverage/` and related reports immediately
after the command finishes. The runner does not move coverage artifacts to a
temporary directory, merge artifacts from different runs, or provide a
separate Jest concurrency model.

The supported concurrency model is one active validation per worktree:

Creation and allocation of worktrees, and assurance that validations do not
overlap within a worktree, are the responsibility of the end user or their
CI/automation system. `@eliware/test` does not create worktrees or coordinate
runs.

- Concurrent developers or agents must use separate Git worktrees. Separate
  worktrees provide separate coverage directories and separate workspace
  state, so their validations do not contend with one another.
- A validation owns the worktree-local coverage artifacts for the duration of
  its run. Do not launch overlapping `eliware-test` validations, or an
  independent Jest validation, against the same worktree.
- Same-worktree overlap is unsupported. The runner does not guarantee correct
  results if another process deletes, rewrites, or reads the same coverage
  files concurrently. CI and other automation requiring parallel validation
  must allocate separate workspaces or worktrees.
- The runner does not create a lock or coordinate concurrent processes. A
  caller that needs parallel validation must allocate separate worktrees or
  workspaces; same-worktree overlap is an operational error outside this
  package's contract.

This contract addresses workspace ownership; it does not attempt to fix or
extend Jest's internal worker concurrency behavior.

## 9. Intentional limitations

These are supported, documented limitations rather than hidden quality gates:

- Istanbul policy discovery is complete and serial to bound descriptor pressure
  in arbitrary consumer workspaces. No parallel traversal or startup bound is
  promised.
- `runToolkit` and `runLint` centralize stage sequencing and expose injected
  filesystem/process seams for tests and composition. The CLI is the supported
  consumer API.
- Advanced collaborators may return incomplete results because runtime
  normalization occurs at the boundary. These are typed composition seams, not
  normal consumer setup.
- Build-script syntax and executable availability are delegated to npm. The
  runner detects only whether a non-empty build script is configured.
- The local Windows npm-shim test is conditional when its generated shim is
  unavailable; Windows CI supplies platform evidence.
- Coverage text parsing is whole-buffer because captured input is bounded; no
  streaming parser or byte-level output limit is promised.
- Text fallback cannot independently prove that a structurally valid table was
  not emitted by consumer code; unrelated output that reproduces the Jest table
  shape is outside the threat model.

## 10. Explicitly out of scope

This package does not promise or implement:

- project-specific smoke, integration, regression, end-to-end, deployment, or
  product workflows;
- same-worktree concurrent validation, cross-process Jest coordination, lock
  management, and per-run temporary coverage isolation;
- an inherited-environment allowlist or secret-redaction policy for consumer
  code;
- arbitrary Jest option discovery beyond the shared supported metadata;
- structured diagnostics, machine-readable output, or an abort-signal API;
- semantic merging of multiple coverage candidates;
- coverage correctness beyond supplied producer evidence;
- narrowing ambiguous focused source mappings by guessing a source;
- making incomplete JSON authoritative over a valid text report;
- proving Windows behavior locally when its shim is unavailable; or
- validating consumer build-script syntax before npm runs it.
- proving that fallback text coverage originated from a specific reporter rather
  than the completed child invocation's bounded output.

## 11. Fixtures, artifacts, migration, and release

Diagnostic fixtures may intentionally contain failing tests or uncovered
branches, but they are excluded from the normal full suite and invoked only by
explicit regression tests. Generated `coverage/`, `coverage.json`,
`.nyc_output/`, `test-results/`, build output, package archives, and debug logs
should be ignored. Ignoring generated output must never conceal a coverage gap.

Consumer migration removes direct Jest/Oxlint development dependencies unless
separately required, installs `@eliware/test`, updates `test` and `lint`, runs
npm install, reviews the lockfile, and keeps specialized test tiers separate.
TypeScript projects run typecheck when they ship declarations.

The normal validation set is:

```text
node bin/eliware-test.mjs
npm test
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

CI must provide Ubuntu and Windows coverage. Lint warnings block publication,
and release validation confirms required platform checks, package metadata,
packed files, audit, typecheck, and self-test results before publication. No
tag, publish, push, or deployment is implied by this specification.
