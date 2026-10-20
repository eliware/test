# Troubleshooting

## Check a failure

Read the full diagnostic and rule ID.
The CLI prints the matching rule and its full directive.
Run the failed test path by itself when the error names one test.
Run `eliware-test --debug-timing` to see stage and suite times.
Use `eliware-test --help` to check valid commands.

## Resolve frequent errors

### The CLI rejects npm

Install npm version 12 or newer.
Run `npm --version` to read the active version.
The CLI also fails when it cannot read that version.
Use `--help` or `--version` when you want information.

### The CLI reports a lock file

The lock file prevents overlapping runs in one repository.
Wait until the active run exits.
Remove `eliware-test.lock` only after you confirm that no run is active.

### A profile check fails

Read the full directive that the CLI prints.
Check `package.json.eliware.apply` and the matching profile convention file.
Use only approved exemptions in `package.json.eliware.exempt`.

### A focused test path fails

Pass an existing `.test.*` or `.spec.*` path in `tests/`.
Use a repository-relative path.
Put all test paths before `--`.
Put only supported Jest options after `--`.
Read [Usage](usage.md) for the supported extensions and examples.

### Jest reports a timeout

Each suite has a ten-second limit.
A 15-second watchdog also covers startup and pauses between suites.
Use `--debug-timing` to find the slow suite.
Jest runs in-band and checks for open handles.
Close timers, streams, servers, and child processes in the test that creates them.

### The smoke command fails

Use an existing disposable consumer with dependencies installed.
Run smoke from the source checkout or installed Eliware Test package.
Read [Smoke test](smoke.md) for restore and recovery steps.

## Read exit codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| `0`  | Validation passed.                                  |
| `1`  | CLI input, configuration, or an unclassified error. |
| `2`  | Jest failed.                                        |
| `3`  | Jest produced unexpected output.                    |
| `4`  | Coverage does not satisfy its required threshold.   |
| `5`  | Lint failed.                                        |
| `6`  | Formatting failed.                                  |
| `7`  | npm audit failed.                                   |
| `8`  | A dependency is outdated.                           |
| `9`  | Package validation failed.                          |
| `10` | Typecheck failed.                                   |
| `11` | Build failed.                                       |
| `12` | A convention check failed.                          |

When multiple checks fail, the CLI returns the highest code.

## Share safe diagnostics

Record the command and Node.js version.
Share the full diagnostic after you remove private values.
Do not share credentials, tokens, private environment values, coverage files, or generated output.
The CLI redacts known secret patterns from child-process output.
This redaction cannot find all secrets.

[Return to documentation](README.md).
