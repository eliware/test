# Coverage enforcement

Every implementation file included by the producer's coverage report must
reach 100% statements, branches, functions, and lines independently. Focused
runs may select an unambiguous mirrored source file; broad or unmappable runs
use the producer-defined aggregate. This package does not independently
enumerate omitted consumer source files. Coverage is a regression guard, not
proof of behavioral correctness.

Branch counters are consumed as reported by the coverage producer, including
counters marked `default-arg`. Default-argument branches therefore count toward
the branch denominator and must be covered to satisfy the 100×4 requirement,
matching direct Jest coverage behavior.

## Text coverage

The parser recognizes the standard Jest table, including CRLF and ANSI output,
and reports only incomplete files. Zero-valued metrics are gaps. Percentage-only
values are complete only when exactly `100%` (optional zeroes may follow).
Annotated values must agree with their raw counter ratio after rounding to two
decimal places. Malformed annotations and ratios fail closed as gaps. Bare and
annotated ratio counters are limited to 256 decimal digits before BigInt
conversion.

JSON coverage counters must be finite, non-negative safe integers within
JavaScript's `Number.MAX_SAFE_INTEGER` range. Counters outside that range are
not accepted as authoritative evidence because converting them to JavaScript
numbers could change their exact value and misclassify the 100×4 result.
Such a candidate is treated as structurally unusable and follows the normal
fallback and fail-closed rules below.

## Istanbul JSON coverage

Each run writes Jest coverage to an isolated temporary directory. After Jest
finishes, the runner validates that directory, removes the consumer's existing
`coverage/` directory, and moves the completed directory into its place. The
consumer's coverage artifacts are overwritten by the latest run. Previous
coverage is not backed up or restored. Promotion failures return the dedicated
coverage-cleanup outcome.

Candidates are considered in order:

1. `coverage/coverage-final.json`
2. `coverage/coverage.json`
3. `coverage.json`

The runner inspects each configured candidate for fallback and diagnostics
before selecting the first fresh usable report in this fixed order. Lower-
priority candidates never override a higher-priority fresh usable candidate;
the bounded eager inspection is intentional and is not a recency or merge
policy.

Stale candidates are removed before Jest runs. Missing, malformed, empty, or
structurally unusable candidates advance to the next candidate; other read
errors fail. The first usable candidate is authoritative and candidates are
not merged. The selected Jest aggregate is the producer's complete in-scope
source set for that invocation; this package does not independently enumerate
consumer source files or infer that omitted files are uncovered. If none is
usable, completed bounded Jest output is used only when
it contains a structurally valid coverage table; otherwise validation fails
closed.

Malformed or missing counter maps invalidate the candidate report and cause
validation to fail closed when no usable candidate or text fallback remains.
For a run with freshness tracking, a malformed current JSON candidate is not
masked by text output, and a candidate whose freshness cannot be verified is
rejected. Text fallback is used only when JSON candidates are missing, empty,
stale, or otherwise unusable without an unverifiable current artifact.
If freshness tracking is enabled and an initial timestamp lookup fails because
the candidate does not exist yet, the candidate may be read successfully later
and is accepted only when its later timestamp is newer than the run start. A
timestamp lookup that fails for any other reason is an error and does not permit
the candidate to be accepted. This behavior is intentional and accepted: the
reader fails closed rather than treating an unverifiable stale artifact as
fresh.
Coverage validation is reported during post-test validation but does not stop
lint, monolith enforcement, or configured package checks. If those stages pass,
the coverage exit code is returned after all diagnostics are available. A later
stage failure takes precedence because it is the final actionable failure.
Valid reports with incomplete location metadata are rendered as explicit
unknown uncovered diagnostics. An Istanbul `l` map is authoritative for line
coverage. Statement, branch, function, and line metrics remain independent.
Multiple statements on one line make that line uncovered when any statement is
uncovered. Without an `l` map, only statements lacking a valid positive start
line count as unmapped; valid statement locations contribute their observed
counts to the line metric.

## Focused coverage and diagnostics

Runs containing a recognized focused test path map `tests/foo.test.mjs` to
`src/foo.mjs` only when exactly one supported source candidate exists. Additional
Jest name filters do not change that path selection. Zero or multiple candidates
retain broad coverage enforcement. Debug mode reports this fallback; normal
output remains concise.

The source/test validator is stricter than the monolith-size exemption: every
`src/**/*.mjs`, including a pure import/export barrel, must have exactly one
mirrored `tests/**/*.test.mjs` file. This repository has no barrel-only source
modules. Other source/test extensions are outside this architecture bijection;
they may still be passed to Jest as focused paths when Jest supports them.
Alternate pairs such as `tests/foo.spec.mjs` are not canonical pairs and are
reported as orphan tests rather than merged with `tests/foo.test.mjs`.

Coverage-gap diagnostics include normalized paths, four percentages, uncovered
lines, statement/branch locations, function names and locations, and an
actionable testing hint. Executable files must not be hidden with Istanbul
ignore comments.
