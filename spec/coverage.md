# Coverage enforcement

Every in-scope implementation file must reach 100% statements, branches,
functions, and lines independently. Coverage is a regression guard, not proof
of behavioral correctness.

## Text coverage

The parser recognizes the standard Jest table, including CRLF and ANSI output,
and reports only incomplete files. Zero-valued metrics are gaps. Percentage-only
values are complete only when exactly `100%` (optional zeroes may follow).
Annotated values must agree with their raw counter ratio after rounding to two
decimal places. Malformed annotations and ratios fail closed as gaps.

## Istanbul JSON coverage

Candidates are considered in order:

1. `coverage/coverage-final.json`
2. `coverage/coverage.json`
3. `coverage.json`

Stale candidates are removed before Jest runs. Missing, malformed, empty, or
structurally unusable candidates advance to the next candidate; other read
errors fail. The first usable candidate is authoritative and candidates are
not merged. If none is usable, completed bounded Jest output is used only when
it contains a structurally valid coverage table; otherwise validation fails
closed.

Malformed or missing counter maps are reported conservatively as explicit
unknown uncovered diagnostics. An Istanbul `l` map is authoritative for line
coverage. Statement, branch, function, and line metrics remain independent.
Multiple statements on one line make that line uncovered when any statement is
uncovered.

## Focused coverage and diagnostics

Focused file-only runs map `tests/foo.test.mjs` to `src/foo.mjs` only when
exactly one supported source candidate exists. Zero or multiple candidates
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
