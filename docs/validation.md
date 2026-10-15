# Validation

Eliware Test runs deterministic checks for the selected profiles.
It does not publish, deploy, release, or change external systems.
It does not run semantic reviews.

## Aggregate validation

Run this command from the consumer repository root:

```text
eliware-test
```

The CLI selects checks from `package.json.eliware.apply`.
It runs enabled work in this order:

1. Lint.
2. Format check.
3. npm audit.
4. npm outdated.
5. Package check when `npm-published` applies.
6. Typecheck when `library` applies.
7. Build when `web` applies.
8. Convention checks.
9. Jest and coverage.

The CLI may skip a stage when its profile does not apply.
It runs all earlier stages and checks before Jest.
It skips Jest when an earlier stage fails.
It reports every failure and returns the highest failure code.
The CLI calls Jest directly; it does not call the consumer's `npm test` script.

## Focused validation

Pass one or more test paths to select a focused run:

```text
eliware-test tests/example.test.mjs
eliware-test tests/one.test.mjs tests/two.test.mjs
```

The CLI runs only the selected Jest tests.
It checks lint, format, and applicable layout rules for each selected test and matching source module.
It checks coverage for each matching source module.
It runs other checks only when their rules can use the selected files.
It skips repository-wide checks that cannot use the focused file list.

Pass a Jest option after `--`:

```text
eliware-test tests/example.test.mjs -- --testNamePattern "case name"
```

Put every test path before `--`.
Do not pass tool modes with focused paths.
The CLI rejects paths outside `tests/`, absolute paths, and parent traversal.
The CLI also rejects options that replace its Jest configuration, reporters, coverage, or test selection.

Application and library profiles require one matching `.test.mjs` file for each maintained `.mjs` source.
Each application or library test must register an executable Jest test and import its exact source module.
Library declaration files must sit beside matching `.mjs` source files.

## Jest and coverage

The CLI uses Jest from the consumer when available.
Otherwise, it uses the bundled Jest.
It reads supported Jest settings from `package.json`.
It rejects separate Jest configuration files.
Configured reporter names must be strings.
Reporter option objects are not supported.

The CLI always runs Jest with `--runInBand`, `--detectOpenHandles`, and `--no-cache`.
It adds its progress reporter and coverage reports.
It keeps the consumer's required coverage settings.
The selected profile rules define required coverage thresholds.

Before each Jest run, the CLI clears the consumer's `coverage/` directory.
Jest writes coverage reports and `jest-console-output.json` to that directory.
The CLI keeps these files after the run.
The CLI does not use system temp or user folders for its temporary files.

Each test suite has a five-second limit.
A separate 15-second watchdog covers startup and pauses between suites.
Output does not reset either limit.
The CLI requests a graceful stop after a timeout.
It forces a stop after one second.
The CLI reports an error if the child process does not close.

## Read the summary

After a clean aggregate or focused run, the CLI reports:

- The number of checks, Jest suites, and tests.
- The number of lint warnings, format issues, audit issues, and pack issues.
- The time for checks, Jest, and the full run.
- The exit code on the last line.

Use `--debug-timing` to see stage and suite times as they run.
The option does not create a separate timing report.

## README links

The general profile checks local README links and Markdown fragments.
It checks supported links in Markdown and quoted HTML attributes.
It does not fetch external links or fragments.
It ignores links in code spans and fenced code blocks.
Read the general convention files for the supported link forms.

## Repository specifications

The CLI parses every YAML file under `specs/`.
It checks YAML syntax for every file.
It checks the directives schema only when a YAML document has a top-level `directives` key.
It checks unique rule IDs across all directive files.
It checks each `specs/` index against its direct YAML files and child indexes.
Read the profile rules for the full `specs/` layout.

## Repository map and links

The general check reads `../docs/repo-map.yaml` when the file exists.
When it finds a matching entry, it compares the repository ID, description, keywords, and profiles.
Without a map, the package metadata supplies the repository description and rule ID namespace.
The CLI checks local README links and fragments without network access.
It does not check whether an external website responds.

## Security and scope

The CLI checks tracked links through the Git index.
It rejects tracked file and directory symlinks.
It does not resolve symlink targets.
Keep secrets out of child-process output.
The CLI redacts known secrets when it writes diagnostics.
That redaction cannot find every secret.
Eliware Test runs validation only; it does not change a release or deployment system.

[Return to documentation](README.md).
