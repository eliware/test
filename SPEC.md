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
`14`, audit failure `15`, pack failure `16`, and build failure `17`.

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
Malformed counters are reported conservatively as uncovered. When an Istanbul
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

The default child environment is inherited so npm, Jest, Oxlint, and consumer
configuration resolve normally. Consumers must not run default mode against an
untrusted workspace while secrets are present. `--sanitize-env` is the
supported isolation mode; an environment allowlist is not part of this release.

Bundled Oxlint and npm invocations use Node's executable and supported
package/runtime entrypoint contracts, preserving argument-array boundaries on
Windows and Unix-like systems. CI, rather than an unavailable local shim, is
the authoritative source of required Windows evidence.

## 8. Intentional limitations

These are supported, documented limitations rather than hidden quality gates:

- Coverage artifacts are workspace-global because they follow Jest's standard
  report locations. Concurrent runs sharing a workspace are unsupported;
  callers must serialize them. The runner creates no cross-process lock,
  per-run artifact directory, or ownership token.
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

## 9. Explicitly out of scope

This package does not promise or implement:

- project-specific smoke, integration, regression, end-to-end, deployment, or
  product workflows;
- automatic cross-process locking or concurrent coverage isolation;
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

## 10. Fixtures, artifacts, migration, and release

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
