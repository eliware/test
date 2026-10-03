# Release Notes

## 11.0.0 — 2026-10-03

### Changed

- Apply one README link contract across repository profiles, define supported
  Markdown syntax and fragment boundaries, and stop resolving JSON/YAML path
  fields as documentation links.
- Align contributor guidance with the general convention by requiring review of
  the root README, applicable AGENTS instructions, and relevant documentation
  before changing files.
- Distinguish supported platforms from direct validation evidence: Windows is
  exercised during development, Ubuntu is validated in CI, and macOS
  compatibility is inferred from Ubuntu's POSIX filesystem behavior.
- Require CLI README and AGENTS guidance to distinguish supported platforms
  from validation evidence.
- Clarify npm publication guidance with exact-version visibility at the public
  registry and the Eli, project developer, and DevOps release responsibilities.

- Run all Jest-independent checks before Jest and stop before Jest when any
  prerequisite check fails. Skip Jest-result and coverage checks in that case,
  with explicit skipped-stage timing output in `--debug-timing` mode.
- Require npm 12 or later before validation and stop early with a clear diagnostic
  when the npm version is unsupported or cannot be determined. Keep `--help` and
  `--version` available independently.
- Disable directory-list caching on Windows, where deleting files may not update
  parent-directory timestamps and cached repository discovery can become stale.
- Advance the package version to 11.0.0 and all maintained specification
  documents to version 11.0.
- Add the repository E-0 identifier to package metadata.
- Validate package ID, description, keywords, and applied profiles against the
  adjacent repo map when available, with package metadata as the fallback in
  isolated consumer checkouts.
- Enforce the canonical author, repository object and URL, homepage, exact
  Node.js engine, and unique keyword requirements for every repository.
- Enforce the assigned E-number namespace across directive IDs in every YAML
  specification file, including nested specification folders.
- Require the package.json.eliware fields in canonical order: id, apply, and
  optional exempt.
- Reject every Git-index-tracked symlink by mode `120000`, covering file and
  directory links without resolving targets or depending on platform behavior.
- Require the canonical GitHub `ci.yaml`, Knit `deploy.yaml`, and conditional
  publication `publish.yaml` workflow inventory; reject extra workflow files
  and multi-document workflow YAML.
- Validate mirrored Jest tests from their parsed syntax: each must declare an
  executable test and reference its exact source module.
- Enforce canonical GHCR image, pull command, supported tags, and deployment
  boundary markers in the existing README Usage section.
- Standardize npm package contents with an exact profile-derived allowlist,
  reject standalone `.npmignore` files and packaging lifecycle hooks, and
  validate actual packed files and public entrypoints.
- Keep the general profile from imposing `specs/` on npm package allowlists;
  the npm-published profile alone defines published package contents.
- Keep package validation lightweight in `npm test` and add an opt-in targeted
  tarball smoke command that installs the candidate in an existing consumer,
  runs its `npm test`, then restores the prior local package, manifest, lockfile,
  and executable shims without touching system-wide symlinks or junctions.

### Fixed

- Load the canonical Jest and Prettier configurations from the conventions
  bundled with the installed package, so consumer repositories do not need a
  local copy of specs/conventions/general.yaml. Add regression coverage for
  validating without that consumer-side copy.

## 10.0.0 — 2026-10-02

### Breaking changes

- Advance the package and convention set to v10. Replace JSON specification
  documents with side-by-side YAML documents and make the YAML convention
  files the maintained source for profile requirements.
- Derive required README headings from the structured heading table in
  `specs/conventions/general.yaml`. Enforce the exact package title, canonical
  badges, homepage and `.git` repository links, and Discord support block.

### Added

- Serialize validation runs per repository with an atomic root-level
  `eliware-test.lock`; concurrent validation attempts fail immediately. The
  lock is removed when a run exits normally, ignored by Git, and documented
  with recovery guidance for forced termination.

### Changed

- Require GitHub CI command order `npm ci`, then `npm test`, and Knit command
  order `git pull --ff-only origin main`, `npm ci`, then `npm test`. Permit
  repository-specific commands after those sequences and apply a best-effort
  denylist for npm publication and GHCR image publishing; command purpose and
  repository scope remain review responsibilities.
- Read convention profiles and directive specifications from YAML, including
  the updated specs index and YAML-specific directive checks.
- Refactored validation modules around focused responsibilities for repository
  inventory, bounded secret matching, documentation traversal, child-process
  handling, Windows process-tree termination, and Jest report attachment, with
  mirrored tests for the extracted helpers.
- Ignore and remove files or directories whose names begin with `.agentx` at
  the repository root or in any subdirectory.
- Derive the bundled check manifest's major/minor version from `package.json`
  and use package metadata in version-related regression tests instead of
  hard-coded release numbers.
- Standardize `package.json.jest` on one exact golden object, including 100×4
  coverage thresholds; enforce one canonical `package.json.prettier` object,
  reject standalone Prettier configuration files, and allow only `apply` and
  `exempt` keys in `package.json.eliware`.

### Fixed

- Count declared dependency binaries invoked from npm scripts, Knit deployment
  commands (including local `node_modules/.bin` paths), and `.knit/*.mjs`
  validation files as used. References in GitHub workflows alone do not count.
- Harden bounded secret redaction at output boundaries and suppress complete
  diagnostics when secret matching fails or returns incomplete results.
- Validate secret-match intervals and work counts before indexing; suppress
  output on malformed matcher results, with interval indexing backed by a
  separately tested numeric min-heap.
- Reject focused paths containing parent-directory traversal, validate the
  supported start-command entrypoint fallback, and document `.spec.*` focused
  test paths.
- Preserve all captured text around extracted Jest reports, detect auth secrets
  nested in arrays, normalize captured-stream errors, and retain pending output
  in chunks while incremental secret matching advances.
- Resolve focused tests from singular `test/` roots, retain their coverage map,
  and reject CLI informational commands terminated by a signal.
- Treat empty `main`/`bin` metadata as absent for a valid start-script fallback
  and require npm audit vulnerability names to match their map keys.
- Settle npm outdated validation on stdout/stderr errors, verify redaction when
  the decoder completes a secret at finish, and clarify the Jest config rule.
- Clarify that aggregate `npm test` includes outdated-dependency validation.
- Route validation-lock cleanup failures through CLI error handling while
  preserving validation failures, reject child processes that close without an
  exit code, and resolve relative `npm_execpath` values from the invoking
  process directory.
- Reuse generated-directory record projections while cached directory entries
  remain unchanged.
- Preserve secret interval ordering during heap removal, validate nested
  `workflow_dispatch` and `workflow_call` metadata, and deduplicate configured
  Jest timing reporters.
- Reject ambiguous POSIX-style repository roots during Windows npm CLI
  resolution, and clarify that consumer `--pack` validation requires the
  `npm-published` profile.
- Reject duplicate or mis-keyed npm audit vulnerability records, report
  documentation predicate failures with the affected file, and require
  profile-owned `typecheck` and `build` scripts to invoke direct tools.
- Restrict post-test image attestations to GHCR publication jobs with subject,
  digest, and registry-push inputs; normalize validated focused paths before
  passing them on to Jest.
- Reject empty npm outdated reports, retry workflow reads after transient
  failures, propagate repository inventory refresh errors other than missing
  directories, resolve relative `npm_execpath` values from the repository root,
  fall back to platform npm for Windows-style `npm_execpath` values on POSIX,
  terminate child processes after asynchronous spawn errors, accept case-variant
  focused formatter paths, recognize glob-based ignore rules, require exact
  README section headings, detect multi-suffix Jest config files, clarify the
  process runner's fixed capture and no-shell contract, and document that Jest
  settings belong in `package.json`; explain consumer profile and validation
  script setup; suppress unsafe output when secret matching cannot advance at
  the pending-buffer limit, join captured output chunks once, and report
  recoverable guidance when partial-lock cleanup fails.
- Stream one concise progress line per Jest suite in `--debug-timing`, report
  failures once in the selected output mode, enforce a five-second total suite
  timeout, and remove redundant Jest timing-report generation while preserving
  coverage-gap diagnostics.
- Keep Jest coverage freshness bound to a start timestamp even when an executor
  omits its callback; share in-flight source reads for uncacheable AST options
  and use directory metadata to avoid rereading unchanged inventory listings.
- Validate npm audit report structure separately from its high/critical
  threshold: valid findings fail with their diagnostics instead of being
  mislabeled as malformed JSON. Validate lockfile link dependencies and
  nearest-ancestor resolution, and normalize quoted Windows npm PATH entries
  with trailing separators.
- Require unconditional Ubuntu GitHub validation jobs with the adjacent
  `npm ci`/`npm test` pair, validate their conditions and sibling jobs, and
  verify README focused-test extensions do not replace mirrored `.test.mjs`
  source tests.

## 9.0.0 — 2026-10-01

### Breaking changes

- Replaced the v8 convention contract with the v9.0 specification format and
  aligned the package release version to `9.0.0`.
- Removed the cross-repository authority-map system, its package metadata and
  convention profile, and all authority-map validation. Directives remain
  ID-based, and validation now requires every specification directive ID to
  be unique.
- Removed the `fork` profile and its checks. Repositories must declare the
  supported profiles that apply to them.
- Simplified exemption requirements. Repository owners define exemption
  records in `package.json`; the harness skips checks for exempted rule IDs
  while continuing the other validation stages.
- Moved Knit's required pull, install, and test commands into
  `.knit/deploy.yaml`. Repository-specific checks follow `npm test` there;
  they can be written in the deployment file or called from scripts in
  `.knit/`.
- Standardized CI on `npm ci` followed by `npm test`. Library typechecking and
  web application builds run through aggregate `npm test` when those profiles
  apply; they are not separate CI steps.

### Changed

- Expanded the v9 directive schema and convention profiles, clarified profile
  boundaries, and aligned specifications, checks, documentation, and tests.
- Classified checks that cannot prove content safety or semantic completeness
  as non-deterministic review. Deterministic sensitive-content checks no
  longer infer secret status from filenames or incomplete scans.
- Updated dependency-use analysis to include commands in `.knit/deploy.yaml`;
  repositories with no applicable Oxlint files pass that stage, and lockfiles
  are not rejected solely for omitting `resolved` or `integrity` fields.
- Tightened the outdated-dependency check: any package reported by
  `npm outdated` fails, with remediation guidance using `@latest`.
- Refined README and specification indexing requirements, documentation
  navigation, profile-specific README content, release-note checks, and the
  repository's documentation standards.
- Refactored validation coordinators and check modules into smaller,
  single-purpose modules with mirrored tests.
- Kept successful CLI messages specific to the requested mode, while
  preserving the aggregate success summary for full validation.

### Fixed

- Improved Jest failure diagnostics, unexpected-output reporting, progress
  capture, and coverage evidence parsing. Unexpected output findings identify
  the test file and captured text without treating coverage summaries as
  leaked test output.
- Hardened secret redaction, bounded child-process output, process shutdown,
  Windows npm executable discovery, and npm pack manifest parsing.
- Corrected validation of GitHub Actions workflows, GHCR publication and
  attestations, npm provenance, package dependencies, and package-lock
  metadata.
- Fixed repository inventory refresh, documentation/specification indexing,
  focused test selection, and edge cases across profile validation and
  cross-platform execution.

## 8.0.0 — 2026-09-27

### Added

- Added versioned, machine-readable convention specifications and deterministic
  discovery/completeness validation for the bundled check registry, selected
  from each repository's declared profiles without a runtime dependency on a
  separate repository.
- Added profile-aware convention stages, rule-level exemption validation,
  fail-fast configuration checks, and actionable diagnostics for missing or
  malformed package configuration and unknown convention identifiers.
- Added focused validation planning and execution, with focused runs checking
  the selected test and applicable focused-file requirements without running
  unrelated repository-wide checks.
- Added `--format`, `--format-check`, `--audit`, and `--pack` public modes;
  each tool mode validates additional arguments against its own allowlist before
  forwarding supported arguments to its underlying tool.
- Added strict source/test mirroring and checks for canonical workflows,
  package metadata, native ESM, README/documentation surfaces, references,
  authority data, publication metadata, and repository safety.

### Changed

- Reworked the CLI around native ESM modules and stable informational,
  validation, and tool-mode contracts; standardized failure codes and concise
  successful output.
- Refined the validation pipeline to apply only checks required by the
  repository's declared profiles and to enforce bundled check completeness.
- Aligned documentation, specs, checks, and tests with the current Eliware
  conventions; decomposed validation responsibilities into focused modules
  with mirrored tests.
- Updated package validation for npm 12 pack-manifest output and tightened
  publication workflow, provenance, and registry-verification checks.

### Fixed

- Hardened 100×4 coverage evidence selection, zero-total metrics, malformed and
  incomplete reports, focused coverage mapping, cleanup, and diagnostics.
- Hardened child-process startup, output bounds, credential redaction,
  termination, and cross-platform behavior.
- Fixed convention/profile applicability, workflow and package validation,
  documentation indexing, and focused-run false failures.

## 6.0.1 — 2026-09-06

### Changed

- Made consumer `audit`, `build`, and `typecheck` scripts optional; defined
  scripts must still be valid and pass.
- Forwarded injected process collaborators through post-test lint validation
  and normalized package-stage failures to the documented exit code.
- Required a `Configuration` section in every README and aligned CLI
  specifications and regression tests with these behaviors.

## 6.0.0 — 2026-09-05

### Added

- Added runtime and npm provenance metadata checks for publishable packages.
- Added required documentation-index checks and enabled monolith enforcement
  in shared defaults.

### Changed

- Strengthened package-script sequencing and continued later-stage diagnostics
  after earlier failures.
- Hardened Istanbul handling for mapped counters, malformed reports,
  freshness, fallback evidence, and artifact replacement while preserving the
  100×4 and focused-coverage contracts.
- Improved child-process lifecycle handling, bounded diagnostics, timing
  cleanup, path normalization, and structured errors; documented supported
  Windows Node/npm layouts and operational limitations.

## 5.0.0 — 2026-09-05

### Added

- Added deterministic repository convention validation for structure, package
  metadata, README links and sections, specifications, `.env.example`, and
  consumer examples, with grouped diagnostics and path-level exceptions.
- Added public Eliware package identity checks, a `specs/` contract layout,
  explicit out-of-scope documentation, and a minimal consumer example.
- Added monolith enforcement and validation for configured audit, pack, build,
  and typecheck scripts.

### Changed

- Hardened coverage freshness, precedence, fallback evidence, malformed and
  empty reports, artifact promotion, and normalized Istanbul line counters.
- Continued later validation stages after coverage failures and consolidated
  successful output into one summary line.
- Improved Windows/Linux package-script execution and decomposed validation
  modules.

## 4.0.0 — 2026-09-04

### Breaking changes

- Replaced the legacy implementation with a native-ESM CLI and decomposed the
  runner into focused application, coverage, workspace, process, and validation
  modules. Node.js 26 or newer is required.
- Removed `index.mjs`, `index.d.ts`, and legacy top-level module entry points;
  the `eliware-test` executable is the supported consumer interface.
- Enforced mirrored `src/` and `tests/` module layouts. Consumers migrate
  their `test` script to `eliware-test` and `lint` script to
  `eliware-test --lint`.

### Added

- Added configurable monolith measurement, package-script validation, optional
  audit/pack/build/typecheck stages, and packed-consumer smoke validation.
- Added atomic coverage artifact promotion and hardened counter, freshness,
  focused-path, fallback-evidence, and malformed-report validation.
- Added distinct validation exit codes and expanded process, workspace,
  portability, and diagnostic handling.

## 3.0.0 — 2026-09-03

### Changed

- Restricted strict `--runTestsByPath` handling to conventional test/spec
  paths while preserving Jest semantics for source-like paths.
- Added opt-in sanitized child-process environments while retaining inherited
  environments by default.
- Made near-complete annotated coverage fail closed and completed parsed
  argument declarations.
- Documented coverage freshness and fallback evidence, bounded parsing,
  orchestration API stability, output ownership, and percentage grammar.

## 2.4.0 — 2026-09-03

### Added

- Added detailed Istanbul JSON coverage-gap diagnostics for uncovered lines,
  statements, branches, functions, and normalized workspace paths.
- Added public parser/orchestration exports, TypeScript declarations,
  executable-level regression coverage, and consumer CI typechecking.
- Added `--ignore-100x4`, `--no-runInBand`, and `--version`/`-v` support.

### Changed

- Hardened focused-path validation, mirrored source coverage mapping,
  subprocess diagnostics, lint-warning enforcement, and workspace setup errors.
- Clarified coverage rounding, malformed function metadata, forwarded Jest
  options, and coverage artifact boundaries.

## 2.3.1 — 2026-09-02

### Fixed

- Fixed zero-valued text coverage metrics being treated as complete and made
  valid-but-unusable coverage JSON fall back to text evidence.
- Made Oxlint warnings fail validation in combined and lint-only commands.

## 2.3.0 — 2026-09-01

### Changed

- Made focused runs execute only requested files and fail closed when a
  requested path is missing. Focused coverage maps mirrored test paths to
  source files; ambiguous selections retain broad coverage enforcement.
- Rejected protected wrapper-managed Jest flags early and kept subprocess
  output bounded.
- Suppressed coverage diagnostics after test failures so failure output stays
  actionable; hardened malformed JSON and sparse statement-map handling.

## 2.2.0 — 2026-08-31

### Added

- Scoped focused-run coverage enforcement to the matching source files when
  test paths follow the standard mirrored layout.
- Kept broad coverage enforcement for unmappable focused paths and documented
  the focused coverage contract.

## 2.1.4 — 2026-08-30

### Added

- Added `--ignore-100x4` as an explicit diagnostic and transitional opt-out
  from coverage enforcement while retaining test execution and coverage
  collection.

## 2.1.3 — 2026-08-29

### Added

- Added `eliware-test --version` and `eliware-test -v`, reporting the package
  version without running the test suite.

## 2.1.2 — 2026-08-29

### Fixed

- Fixed multi-file focused test execution by using Jest's strict
  `--runTestsByPath` selection and added coverage proving unrelated suites do
  not run.

## 2.1.1 — 2026-08-29

### Added

- Added `--help`/`-h`, direct-invocation separator handling, and clearer
  rejection of invalid lint combinations.
- Added focused-path validation so invalid paths cannot silently trigger the
  broad suite, plus opt-in `ELIWARE_TEST_DEBUG=1` argument diagnostics.
- Added regression coverage for focused arguments and Windows npm shims.

## 2.1.0 — 2026-08-29

### Added

- Added exact-commit secondary validation through Knit using a disposable
  worktree, bounded execution, cleanup, and the full local validation suite.
- Improved agent-facing diagnostics with bounded subprocess output,
  deduplicated failures, normalized coverage paths, and detailed JSON coverage
  gaps.
- Added default workspace exclusions and a non-failing warning when a consumer
  repository lacks `.gitignore`.

## 2.0.0 — 2026-08-24

### Changed

- Aligned continuous integration and release workflows with Eliware release
  conventions.

## 1.0.3 — 2026-08-24

### Added

- Expanded JSON coverage diagnostics with per-metric percentages, uncovered
  lines, exact locations, function names, and test-fix guidance.

## 1.0.2 — 2026-08-24

### Added

- Enabled Jest's `--detectOpenHandles` option in the default test command and
  added regression coverage for forwarding it.

## 1.0.1 — 2026-08-24

### Fixed

- Resolved Jest and Oxlint for consumer installations, including npm-hoisted
  dependency layouts on Windows and Linux.

### Added

- Added declaration typechecking and aligned package documentation with Eliware
  conventions.

## 1.0.0 — 2026-08-24

### Added

- Established the `@eliware/test` package and its command-line test runner.
- Added bundled Jest and Oxlint orchestration, focused-test forwarding,
  concise output, coverage-gap filtering, and cross-platform process handling.
