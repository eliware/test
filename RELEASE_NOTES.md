# Release Notes

## 12.0.0 — 2026-10-10

### Breaking changes

- Require npm-published repositories to include `specs/` in the package and packed tarball.
- Replace JSON workspace runbooks with YAML files that use the shared v12 schema.

### Added

- Split each profile's requirements into deterministic and semantic YAML files.
- Add cross-profile checks and canonical order data for package keys, profile lists, README sections, AGENTS sections, and workflows.
- Add the shared v12 runbook schema. Require workspace runbooks to use this schema and ASD-STE100 instructions.
- Implement deterministic checks for application, CLI, web, library, Discord, MCP server, infrastructure, documentation, workspace, npm, GHCR, and private profiles.
- Require tests to mock Git, npm, audit, lint, format, pack, typecheck, build, Jest, and package-script calls.

### Changed

- Limit general requirements to rules that apply to every repository. Keep profile rules in their own profiles.
- Require every repository to apply general. Enforce profile prerequisites, exclusions, and private-repository rules through the harness specifications.
- Support Node.js 26 or later. Require ESM and place the required `type` key after `version` in `package.json`.
- Apply profile checks and package stages only when the selected profiles require them. Run pack only for npm-published repositories.
- Require the canonical README header, badges, section order, Support block, Links section, and License footer.
- Allow additional runtime files in npm packages. Keep explicit exclusions for tests, build output, credentials, and unsafe files.
- Keep check and test modules focused. Mirror every source module with its own test.
- Remove the `MAIL_OWNER_ADDRESS` convention and Tasklist integration requirements.

### Fixed

- Complete deterministic validation for selected profile requirements that lacked v12 checks.
- Match aggregate success output to the exact text in the harness specification.
- Detect directory changes with full nanosecond timestamps when the platform supports them.
- Report smoke cleanup failures with the run result and preserve recovery details.

## 11.0.0 — 2026-10-03

### Added

- Add smoke validation for a packed release candidate and an existing consumer.
- Check package identity against the repository map when that map is available.
- Detect tracked file and directory links from Git index mode `120000`.
- Check package contents against exact profile-based allowlists.
- Require npm 12. Install `npm@latest` in GitHub workflows.

### Changed

- Set the package version to 11.0.0 and the specification version to 11.0.
- Use `.yaml` workflow names and canonical workflow files.
- Apply the same supported Markdown link checks across profiles.
- Put application entrypoints in `bin/` and library entrypoints in `src/`.
- Run independent stages before Jest. Skip Jest when an earlier stage fails.
- Restrict workflow command parsing and reject shell expansion and multiline commands.
- Improve path handling for drive, UNC, and Windows device paths.
- Bound and redact child output without splitting UTF-8 characters or redaction markers.
- Split coordinators and checks into focused modules with mirrored tests.

### Fixed

- Load canonical Jest and Prettier settings from the convention specs.
- Prevent supported README links from causing false failures.

## 10.0.0 — 2026-10-02

### Breaking changes

- Replace JSON convention files with the v10 YAML specification format.
- Derive required README headings from the structured heading table.

### Added

- Lock each repository during validation to prevent overlapping runs.

### Changed

- Require `npm ci` before `npm test` in CI and Knit workflows.
- Read convention profiles and directives from YAML.
- Organize repository inventory and validation code by responsibility.
- Ignore and remove `.agentx` files during validation.
- Set the check manifest version from `package.json`.
- Require exact Jest and Prettier settings, including 100×4 coverage.

### Fixed

- Count used binaries in npm scripts, Knit commands, and Knit modules.
- Bound secret redaction and suppress incomplete diagnostics.
- Validate secret intervals before indexing them.
- Reject unsafe focused paths and validate start entrypoints.
- Preserve captured Jest output and detect nested credentials.
- Support focused tests in `test/` and preserve their coverage map.
- Treat empty entrypoint metadata as absent and check audit names.
- Handle npm outdated process errors and invalid JSON.
- Route lock cleanup failures through CLI error handling.
- Reuse generated directory records when cached entries remain valid.
- Preserve secret ordering and validate workflow call metadata.
- Reject ambiguous paths during Windows npm resolution.
- Validate audit records, README failures, and multi-suffix Jest configs.
- Limit image attestations to valid GHCR publication jobs.
- Reject empty outdated reports and retry temporary workflow read failures.
- Report each Jest suite once and enforce suite timeouts.
- Bind coverage data to the current run.
- Validate audit structure before reporting vulnerability thresholds.
- Split dependency, PowerShell, and GitHub Actions discovery helpers.
- Redact overlapping secrets and format non-string diagnostics safely.
- Use a balanced tree to find output intervals.
- Bound file caches and reuse unchanged directory listings.
- Restore smoke targets safely and continue independent cleanup steps.
- Accept valid peer metadata even when the package omits a peer dependency.
- Require unconditional Ubuntu validation with adjacent install and test steps.

## 9.0.0 — 2026-10-01

### Breaking changes

- Replace the v8 convention format with v9 specifications.
- Remove authority maps and their package metadata and checks.
- Remove the `fork` profile. Repositories must list their profiles.
- Simplify exemptions. Store them in `package.json` by rule ID.
- Move required Knit commands into `.knit/deploy.yaml`.
- Use `npm ci` followed by `npm test` in CI.

### Changed

- Expand the directive schema and clarify profile boundaries.
- Mark requirements without deterministic proof as semantic review rules.
- Include Knit commands in dependency-use checks.
- Fail when `npm outdated` reports any package.
- Improve README, specification, release note, and navigation rules.
- Split validation coordinators and checks into focused modules.
- Keep success messages specific to the selected command.

### Fixed

- Improve Jest failures, output checks, progress capture, and coverage parsing.
- Improve secret redaction, output limits, shutdown, and Windows npm resolution.
- Correct workflow, package, GHCR, provenance, and lockfile checks.
- Fix inventory refresh, documentation indexing, focused tests, and platform cases.

## 8.0.0 — 2026-09-27

### Added

- Add versioned convention specs and deterministic check discovery.
- Add profile-based checks, exemptions, early config errors, and clear diagnostics.
- Add focused validation for one test and its applicable requirements.
- Add format, format-check, audit, and pack modes with argument allowlists.
- Add source mirrors and checks for workflows, metadata, docs, and publication.

### Changed

- Rebuild the CLI with native ESM and stable command behavior.
- Run only checks required by each repository's selected profiles.
- Align docs, specs, checks, and tests with Eliware rules.
- Update package validation for npm 12 and publication workflows.

### Fixed

- Improve coverage evidence, malformed reports, focused mapping, and diagnostics.
- Improve child startup, output bounds, redaction, shutdown, and portability.
- Fix profile, workflow, package, documentation, and focused-run checks.

## 6.0.1 — 2026-09-06

### Changed

- Make consumer audit, build, and typecheck scripts optional.
- Forward process helpers through lint and use the documented package error code.
- Require a Configuration section in each README.

## 6.0.0 — 2026-09-05

### Added

- Check runtime and npm provenance metadata for publishable packages.
- Require documentation indexes and enforce module-size limits.

### Changed

- Continue validation after an earlier package-script failure.
- Improve Istanbul maps, counters, freshness, fallback evidence, and diagnostics.
- Improve child lifecycle, output limits, timing, paths, and structured errors.

## 5.0.0 — 2026-09-05

### Added

- Check structure, metadata, README links, specs, environment files, and examples.
- Add Eliware identity checks, a specs layout, scope rules, and consumer examples.
- Enforce module size and configured package stages.

### Changed

- Improve coverage freshness, precedence, fallback, reports, and counters.
- Continue stages after coverage failures and print one success summary.
- Improve Windows and Linux script execution; split validation modules.

## 4.0.0 — 2026-09-04

### Breaking changes

- Replace the old implementation with a native ESM CLI.
- Remove legacy top-level modules. Use the `eliware-test` executable.
- Require mirrored `src/` and `tests/` files.
- Require Node.js 26 or later.

### Added

- Add module-size checks, package scripts, optional stages, and smoke validation.
- Improve coverage artifact handling, counters, focus, and diagnostics.
- Add failure codes and improve process and workspace handling.

## 3.0.0 — 2026-09-03

### Changed

- Restrict `--runTestsByPath` to standard test and spec paths.
- Add optional child environments and keep inherited environments by default.
- Fail on near-complete annotated coverage and complete parsed arguments.
- Document coverage freshness, bounded parsing, API stability, and output ownership.

## 2.4.0 — 2026-09-03

### Added

- Report Istanbul coverage gaps by file, line, statement, branch, and function.
- Add public parser APIs, type declarations, tests, and CI typechecking.
- Add `--ignore-100x4`, `--no-runInBand`, and version flags.

### Changed

- Improve focused paths, coverage mapping, process output, and lint warnings.
- Clarify coverage rounding, malformed metadata, forwarded options, and artifacts.

## 2.3.1 — 2026-09-02

### Fixed

- Treat zero coverage as incomplete and fall back from unusable JSON evidence.
- Fail lint when Oxlint reports warnings.

## 2.3.0 — 2026-09-01

### Changed

- Run only focused files and fail when a requested path is missing.
- Reject protected Jest flags and bound child output.
- Keep coverage errors actionable after test failures.

## 2.2.0 — 2026-08-31

### Added

- Apply focused coverage to matching source files when paths mirror.
- Keep broad coverage checks when the focused path cannot map to source.

## 2.1.4 — 2026-08-30

### Added

- Add `--ignore-100x4` as a temporary coverage bypass.
- Keep test execution and coverage collection active with this option.

## 2.1.3 — 2026-08-29

### Added

- Add `--version` and `-v` without running the test suite.

## 2.1.2 — 2026-08-29

### Fixed

- Run multiple focused tests with Jest's strict path selection.
- Add tests to prove unrelated suites do not run.

## 2.1.1 — 2026-08-29

### Added

- Add help flags, separator handling, and clearer lint argument errors.
- Reject invalid focused paths instead of running the full suite.
- Add argument and Windows npm shim tests.

## 2.1.0 — 2026-08-29

### Added

- Add exact-commit Knit validation in a disposable worktree.
- Improve output limits, diagnostics, deduplication, and coverage paths.
- Add default exclusions and warn when `.gitignore` is absent.

## 2.0.0 — 2026-08-24

### Changed

- Align CI and release workflows with Eliware release rules.

## 1.0.3 — 2026-08-24

### Added

- Report coverage percentages, missed lines, locations, functions, and test guidance.

## 1.0.2 — 2026-08-24

### Added

- Enable Jest's `--detectOpenHandles` option and test its forwarding.

## 1.0.1 — 2026-08-24

### Fixed

- Resolve Jest and Oxlint in consumer installs on Windows and Linux.

### Added

- Add declaration typechecking and align package docs with Eliware rules.

## 1.0.0 — 2026-08-24

### Added

- Create the `@eliware/test` package and CLI test runner.
- Add bundled Jest and Oxlint, focused tests, short output, and coverage reports.
- Add cross-platform process handling.
