# Release Notes

## 14.0.0 — 2026-10-20

### Added

- Require content after each required `README.md` and `AGENTS.md` heading.
- Write stage, check, and test timings to `coverage/eliware-test.log` on every run.
- Show elapsed timing details on the console when `--debug-timing` is set.

### Changed

- Set the package version to 14.0.0 and convention schema versions to 14.0.
- Require documentation and release notes in the General profile.
- Increase the Jest suite timeout to 10 seconds.
- Increase the source module limit to 150 lines and the test file limit to 300 lines.
- Require GHCR publication workflows to use the configured token for authentication.
- Update the smoke instructions and the package exemption guidance.
- Show CLI mode options, purposes, and default behavior in help output.
- Update Oxlint to 1.89.0.

### Fixed

- Verify the smoke target before package installation and consumer tests.
- Preserve empty Jest suites and report their results correctly.
- Keep smoke recovery files when target restoration fails.
- Check package entrypoints against declared package targets.
- Use convention data for required README and AGENTS section content.
- Resolve tracked Git paths through the shared repository inventory.
- Keep runbook index validation in the workspace check.
- Split validation helpers and their tests into focused modules.

## 13.0.0 — 2026-10-18

### Breaking changes

- Release version 13.0.0 updates the harness, convention set, and specification schemas to version 13.
- Require repositories to pass checks for their selected profiles and shared language rules.
- Require a repository tag for every release entry before the current package version.
- Reject open-ended release sections in application and library release notes.

### Added

- Add a database profile with database access, backup, certification, and test requirements.
- Add one profile-combination policy for profile prerequisites, exclusions, and publication limits.
- Add exact and wildcard path exemptions for individual rules.
- Add schema checks for exemption data and repository-map records.
- Add a shared language rule and a CSV dictionary for maintained reader-facing text.
- Scan prose in Markdown, source, JSON, YAML, and supported plain-text files.
- Report suggested word alternatives once and state that they are optional examples.
- Check consumer tests for file writes, child commands, external network access, and uncontrolled timers.
- Parse every YAML file under `specs/` and validate directive documents against the bundled schema.
- Limit specification YAML files to 100000 bytes, 100 characters on each line, 1000 lines, and 100 aliases.
- Require specification indexes, valid rule IDs, and unique IDs across specification files.
- Add web requirements for a root `webpack.config.mjs`, `npm run build`, Lighthouse, and screenshot scripts.
- Check GHCR publication workflows, image digests, deployment commands, and attestations.
- Require npm packages to include `specs/` in the package and packed tarball.
- Add user guides for setup, profiles, validation, smoke tests, package contents, and releases.

### Changed

- Require checkout v7, setup-node v7, npm latest, and full Git history in validation workflows.
- Require publication jobs to wait for validation and use restricted permissions.
- Require `GH_TOKEN` for GHCR attestations and identity-based npm provenance.
- Use `git pull` in Knit deployments and set a five-minute timeout for each deployment.
- Keep Jest coverage reports and console logs in the consumer's `coverage/` directory.
- Run Jest in one process with open-handle checks and suite and startup time limits.
- Put related source modules in nested folders and mirror each move in tests.
- Use the root `webpack.config.mjs` model with one or more bundles and a shared build command.
- Use repository-map data when available and package metadata when it is unavailable.
- Apply path exemptions to only the named rule and matching repository paths.
- Limit JavaScript language checks to comments, JSX text, and defined outputs for users.
- Match consumer publication workflows against bundled files without requiring duplicate consumer specs.
- Keep only convention-required content in `README.md` and `AGENTS.md`. Link to user guides.
- Update package dependencies to their latest available releases.

### Fixed

- Exclude machine-readable syntax and required technical text from prose scans.
- Remove valid package and repository names from the language dictionary.
- Find SQL clauses, SVG transform values, and JavaScript User-Agent values correctly.
- Redact sensitive Jest output without hiding short values or npm environment names.
- Apply path exemptions to Git-index checks for ignored files and nested `.gitignore` files.
- Redact sensitive values in package and publisher diagnostics.
- Close gaps in export-barrel, secret-path, publisher, Knit command, and workflow checks.
- Stop validation tests from writing files or calling external tools.
- Restore smoke-test targets safely and find target-directory changes.
- Preserve smoke recovery data when target restoration fails.
- Correct profile, README, AGENTS, workflow, package-order, and web build checks.
- Split validation helpers and tests into focused modules with mirrored test files.

## 12.0.0 — 2026-10-10

### Breaking changes

- Require npm-published repositories to include `specs/` in the package and packed tarball.
- Replace JSON workspace runbooks with YAML files that use the shared v12 schema.

### Added

- Split each profile's requirements into deterministic and semantic YAML files.
- Add shared checks and canonical order data for package keys and files, profile lists, README and AGENTS sections, specification indexes, and workflows.
- Add the shared v12 runbook schema. Require workspace runbooks to use this schema and the shared language rules.
- Add deterministic checks for application, CLI, web, library, Discord, MCP server, infrastructure, documentation, workspace, npm, GHCR, and private profiles.
- Require tests to mock Git, npm, audit, lint, format, pack, typecheck, build, Jest, and package-script calls.
- Allow focused validation to select multiple test files in one command.

### Changed

- Limit general requirements to rules for all repositories. Keep profile rules in their own profiles.
- Require all repositories to apply general. Enforce profile prerequisites, exclusions, and private-repository rules in the harness specifications.
- Support Node.js 26 or newer. Require ESM. Put the required `type` key after `version` in `package.json`.
- Apply profile checks and package stages only when the selected profiles require them. Run pack only for npm-published repositories.
- Run focused lint, format, line-limit, and applicable layout checks on each selected test and its mirrored source.
- Require the canonical README header, badges, section order, Support section, Links section, and License footer.
- Allow more runtime files in npm packages. Exclude tests, build output, credentials, and untrusted files.
- Give each check and test module one purpose. Give each source module its own test.
- Remove the `MAIL_OWNER_ADDRESS` convention and Tasklist integration requirements.
- Show check counts, test counts, issue counts, stage times, and the exit code in clean aggregate and focused summaries.

### Fixed

- Complete deterministic validation for selected profile requirements that lacked v12 checks.
- Find directory changes with full nanosecond timestamps when the platform supports them.
- Report smoke cleanup failures with the run result and preserve recovery details.

## 11.0.0 — 2026-10-03

### Added

- Add smoke validation for a packed release candidate and an existing consumer.
- Check package identity against the repository map when that map is available.
- Find tracked file and directory links from Git index mode `120000`.
- Check package contents against exact profile-based allowlists.
- Require npm 12. Install `npm@latest` in GitHub workflows.

### Changed

- Set the package version to 11.0.0 and the specification version to 11.0.
- Use `.yaml` workflow names and canonical workflow files.
- Apply the same supported Markdown link checks across profiles.
- Put application entrypoints in `bin/` and library entrypoints in `src/`.
- Run all non-Jest stages before Jest. Skip Jest when a prior stage fails.
- Parse workflow commands and reject shell expansion and multiline commands.
- Support Windows paths that start with a volume name, UNC paths, and device paths.
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
- Require exact Jest and Prettier settings, with 100×4 coverage.

### Fixed

- Count used binaries in npm scripts, Knit commands, and Knit modules.
- Limit secret redaction and hide unfinished diagnostics.
- Validate secret intervals before indexing them.
- Reject invalid focused paths and validate package entrypoints.
- Preserve captured Jest output and find nested credentials.
- Support focused tests in `test/` and preserve their coverage map.
- Empty entrypoint metadata is missing. Check audit names.
- Report npm outdated failures and invalid JSON.
- Route lock cleanup failures through CLI error handling.
- Use generated directory records when cached entries stay valid.
- Preserve secret ordering and validate workflow call metadata.
- Reject ambiguous paths during Windows npm resolution.
- Validate audit records, README failures, and multi-suffix Jest configs.
- Limit image attestations to valid GHCR publication jobs.
- Reject empty outdated reports and retry temporary workflow read failures.
- Print one report for each Jest suite and enforce suite time limits.
- Attach coverage data to its run.
- Validate audit structure before reporting vulnerability thresholds.
- Split dependency, PowerShell, and GitHub Actions discovery helpers.
- Redact overlapping secrets and format non-string diagnostics safely.
- Use a balanced tree to find output intervals.
- Limit file caches and use unchanged directory listings again.
- Restore smoke targets safely and run other cleanup steps.
- Accept valid peer metadata when a package omits a peer dependency.
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
- Use semantic rules for requirements without deterministic proof.
- Include Knit commands in dependency-use checks.
- Fail when `npm outdated` reports a package.
- Update README, specification, release notes, and navigation rules.
- Split validation coordinators and checks into focused modules.
- Name success messages for the selected command.

### Fixed

- Update Jest failure handling, output checks, suite status capture, and coverage parsing.
- Update secret redaction, output limits, shutdown, and Windows npm resolution.
- Correct workflow, package, GHCR, provenance, and lockfile checks.
- Repair inventory refresh, documentation indexing, focused tests, and platform cases.

## 8.0.0 — 2026-09-27

### Added

- Add versioned convention specs and deterministic check discovery.
- Add profile checks, exemptions, startup config errors, and concise diagnostics.
- Add focused validation for one test and its applicable requirements.
- Add format, format-check, audit, and pack modes with argument allowlists.
- Add source mirrors and checks for workflows, metadata, docs, and publication.

### Changed

- Move the CLI to native ESM and keep command behavior stable.
- Run only checks required by each repository's selected profiles.
- Align docs, specs, checks, and tests with Eliware rules.
- Update package validation for npm 12 and publication workflows.

### Fixed

- Update coverage results, malformed reports, focused mapping, and diagnostics.
- Update child startup, output limits, redaction, shutdown, and portability.
- Repair profile, workflow, package, documentation, and focused-run checks.

## 6.0.1 — 2026-09-06

### Changed

- Make consumer audit, build, and typecheck scripts optional.
- Forward child-command helpers through lint and use the documented package error code.
- Require a Configuration section in each README.

## 6.0.0 — 2026-09-05

### Added

- Check runtime and npm provenance metadata for publishable packages.
- Require documentation indexes and enforce module-size limits.

### Changed

- Continue validation after an earlier package-script failure.
- Update Istanbul maps, counters, freshness, fallback results, and diagnostics.
- Update child lifecycle, output limits, timing, paths, and structured errors.

## 5.0.0 — 2026-09-05

### Added

- Check structure, metadata, README links, specs, environment files, and examples.
- Add Eliware identity checks, a specs layout, scope rules, and consumer examples.
- Enforce module line limits and configured package stages.

### Changed

- Update coverage freshness, precedence, fallback, reports, and counters.
- Continue stages after coverage failures and print one success summary.
- Update Windows and Linux script execution. Split validation modules.

## 4.0.0 — 2026-09-04

### Breaking changes

- Replace the V11 implementation with a native ESM CLI.
- Remove legacy top-level modules. Use the `eliware-test` executable.
- Require mirrored `src/` and `tests/` files.
- Require Node.js 26 or newer.

### Added

- Add module-size checks, package scripts, optional stages, and smoke validation.
- Add coverage artifact handling, counters, focused runs, and diagnostics.
- Add failure codes and update child-command and workspace handling.

## 3.0.0 — 2026-09-03

### Changed

- Reject `--runTestsByPath` unless the path uses a standard test or spec pattern.
- Add optional child environments and keep inherited environments by default.
- Fail on near-complete annotated coverage and complete parsed arguments.
- Document coverage freshness, bounded parsing, stable API behavior, and output ownership.

## 2.4.0 — 2026-09-03

### Added

- Report Istanbul coverage gaps by file, line, statement, branch, and function.
- Add public parser APIs, type declarations, tests, and CI typechecking.
- Add `--ignore-100x4`, `--no-runInBand`, and version flags.

### Changed

- Update focused paths, coverage mapping, child-command output, and lint warnings.
- Clarify coverage rounding, malformed metadata, forwarded options, and artifacts.

## 2.3.1 — 2026-09-02

### Fixed

- Use fallback data when coverage is zero or its JSON data is unusable.
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

- Add a temporary coverage bypass named `--ignore-100x4`.
- Keep test execution and coverage collection active with this option.

## 2.1.3 — 2026-08-29

### Added

- Add `--version` and `-v` without starting the test suite.

## 2.1.2 — 2026-08-29

### Fixed

- Run multiple focused tests with Jest's strict path selection.
- Add tests to prove unrelated suites do not run.

## 2.1.1 — 2026-08-29

### Added

- Add help flags, separator handling, and clearer lint argument errors.
- Reject invalid focused paths. Do not start the full suite for them.
- Add argument and Windows npm shim tests.

## 2.1.0 — 2026-08-29

### Added

- Add exact-commit Knit validation in a disposable worktree.
- Update output limits, diagnostics, deduplication, and coverage paths.
- Set default exclusions. Report the missing `.gitignore` file.

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
- Add cross-platform command execution.
