# Output, workspace policy, and process trust

## 7. Output and diagnostics

Successful child output controlled by the wrapper is suppressed and replaced
by a concise summary. npm lifecycle notices and non-failing workspace warnings
may still appear. Failures preserve useful test names, assertions, stacks, lint
findings, and coverage details.

Captured child diagnostics are bounded to 16 KiB of JavaScript string length.

When a child exceeds its timeout, the runner sends `SIGTERM`, waits briefly,
sends `SIGKILL`, waits briefly again, and sends a final `SIGKILL`. It then
continues with the timeout result; if the child never closes, diagnostics
explicitly report that an unkillable child process remains.
Truncation is explicit, repeated failure lines are deduplicated, and absolute
coverage paths are normalized relative to the workspace. stdout and stderr are
captured independently. `ELIWARE_TEST_DEBUG=1` enables exact forwarded-Jest
argument and selected coverage-fallback diagnostics. Structured diagnostics
are not currently exposed.

## 8. Workspace policy and process trust

Discovery and linting exclude `.git`, `node_modules`, `coverage`, `.nyc_output`,
`test-results`, `dist`, `build`, and package archives. Missing `.gitignore`
produces a warning with recommended entries but does not fail validation.

The default child environment is inherited intentionally to preserve drop-in
compatibility with direct `npm test` and Jest behavior. The package does not
provide a sanitized or secret-redacting mode and does not create a new security
boundary. Consumers must not run default mode against an untrusted workspace
while secrets are present.

Bundled Oxlint and npm invocations use Node's executable and supported
package/runtime entrypoint contracts, preserving argument-array boundaries on
Windows and Unix-like systems. CI is the authoritative source of required
Windows evidence.
