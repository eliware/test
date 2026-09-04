# Coverage test decomposition checklist

Goal: reduce `tests/coverage/coverage.test.mjs` from its current 375 lines to
under the 200-line test limit while preserving behavior, strict source/test
mirroring, and genuine 100×4 coverage.

Status legend: `[x]` done, `[~]` partially complete/in progress, `[ ]` not
started or waiting on approval/authorization.

This checklist is intentionally separate from the broader 4.0.0 release
checklist and is currently unstaged and uncommitted.

## Preconditions and baseline

- [x] Confirm the current source/test mapping with the repository validator.
- [x] Confirm every `src/coverage/*.mjs` already has exactly one mirrored test
  file under `tests/coverage/`.
- [x] Record the current 100×4 coverage result before moving tests: `npm test`
  passes with genuine 100×4 coverage.
- [x] Record the current line counts for all affected source and test files;
  every source file is at most 100 lines and every test file is at most 200.
- [x] Do not add a catch-all replacement test file.
- [x] Do not add Istanbul ignores, coverage exclusions, skipped tests, weaker
  assertions, or fixture exclusions to make the refactor pass.

## Responsibility map

Move each test group to the existing mirrored owner below:

- [x] JSON facade/composition for `parseCoverageJson` →
  `tests/coverage/coverage.test.mjs`
- [x] JSON line maps, same-line semantics, authoritative `l` maps, and
  unmapped statements → `tests/coverage/lines.test.mjs`
- [x] Branch counters, locations, malformed branch metadata, and default
  argument branches → `tests/coverage/branches.test.mjs`
- [x] Function counters, function names, and malformed function metadata →
  `tests/coverage/functions.test.mjs`
- [x] Statement location extraction → `tests/coverage/locations.test.mjs`
- [x] Percentage-only values, ratios, annotations, rounding, BigInt bounds,
  and malformed metric values → `tests/coverage/metric.test.mjs`
- [x] Text table parsing, ANSI, CRLF, headings, separators, malformed rows,
  zero values, and complete rows → `tests/coverage/parse-text-coverage.test.mjs`
- [x] Text-report validation and report-level composition →
  `tests/coverage/parse-text-report.test.mjs`
- [x] Coverage-gap rendering, truncation, paths, locations, function names,
  and remediation text → `tests/coverage/format-gaps.test.mjs`
- [x] Path normalization only → `tests/coverage/normalize-path.test.mjs`
- [x] `percentageWithUnknowns` validation and empty-map behavior →
  `tests/coverage/percentages.test.mjs`
- [x] JSON report validation and threshold composition →
  `tests/coverage/parse-json-report.test.mjs`
- [x] Threshold filtering and gap calculation →
  `tests/coverage/calculate-gaps.test.mjs` and
  `tests/coverage/coverage-thresholds.test.mjs`
- [x] JSON candidate selection, stale artifacts, missing files, and text
  fallback → `tests/coverage/read-coverage.test.mjs`
- [x] Report usability detection →
  `tests/coverage/is-usable-coverage-report.test.mjs`
- [x] Candidate selection precedence →
  `tests/coverage/select-usable-report.test.mjs`
- [x] Text evidence detection → `tests/coverage/text-evidence.test.mjs`
- [x] Coverage-gap object construction → `tests/coverage/build-gap.test.mjs`

## Facade tests to retain

Keep only composition behavior in `coverage.test.mjs`:

- [x] One valid complete JSON report case.
- [x] One incomplete report that composes lower-level statement, branch,
  function, and line gaps.
- [x] One malformed or sparse report safety case.
- [x] One representative cross-metric integration case is covered by the
  facade composition test.
- [x] Keep the resulting file under 200 lines.

## Duplicate review

- [x] Compare repeated `mixed-map.mjs` cases with `lines.test.mjs`,
  `functions.test.mjs`, and the facade test.
- [x] Keep one focused case for mixed mapped/unmapped statements.
- [x] Keep one focused case for missing statement counters.
- [x] Keep one focused case for malformed statement counters.
- [x] Keep one focused case for malformed function counters.
- [x] Compare repeated mapped-covered-line cases and retain only one facade or
  line-level case, depending on which contract it protects.
- [x] Compare malformed branch cases and retain only one lower-level case plus
  one facade case if composition behavior is distinct.
- [x] Preserve all distinct contracts, including:
  - [x] zero-valued metrics fail correctly;
  - [x] annotated ratios use the required rounding;
  - [x] statements, branches, functions, and lines are enforced independently;
  - [x] malformed and empty JSON fall back correctly;
  - [x] authoritative line maps are honored;
  - [x] multiple uncovered statements on one line are retained;
  - [x] candidate precedence and stale-artifact behavior are preserved;
  - [x] focused ambiguity falls back to broad coverage;
  - [x] explicit coverage opt-out still collects coverage while skipping
    enforcement.

## Incremental implementation sequence

- [x] Move metric cases first; run `tests/coverage/metric.test.mjs`.
- [x] Move text-parser cases; run text parser/report tests.
- [x] Move formatting and path cases; run formatter/path tests.
- [x] Move line, branch, function, location, and percentage cases.
- [x] Move JSON report and candidate fallback cases to their existing owners.
- [x] Reduce `coverage.test.mjs` to facade-only composition tests.
- [x] Remove only exact duplicates proven redundant after relocation.
- [x] Keep all test files under 200 lines.

## Validation after each extraction group

- [x] Run the affected focused test files.
- [x] Run the mapping validator and confirm no missing or orphan tests.
- [x] Run coverage and confirm no metric regresses.
- [x] Run the normal monolith check without `--ignore-monolith-limits`.
- [x] Review the diff to confirm assertions were moved, not weakened.

## Final validation

- [x] `npm test`
- [x] `npm run lint`
- [x] Source/test mapping reports zero drift.
- [x] Every source file remains paired with exactly one test file.
- [x] Every source file is within its implementation limit.
- [x] Every test file is at most 200 lines.
- [x] Coverage is genuinely 100% statements, branches, functions, and lines.
- [x] No Istanbul ignores or coverage exclusions were added for this work.
- [x] No public behavior or coverage fallback behavior changed.

## Commit points

- [ ] Commit parser/metric extraction as one focused commit.
- [ ] Commit text parsing/report extraction as one focused commit.
- [ ] Commit JSON line/branch/function/location extraction as one focused
  commit.
- [ ] Commit facade reduction and duplicate removal as one focused commit.
- [x] Keep this checklist unstaged unless explicitly requested otherwise.
