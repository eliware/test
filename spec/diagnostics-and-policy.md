# Output, workspace policy, and process trust

## Output and diagnostics

Successful child output controlled by the wrapper is suppressed and replaced
by a concise summary. npm lifecycle notices and non-failing workspace warnings
may still appear. Failures preserve useful test names, assertions, stacks, lint
findings, and coverage details.

Captured child diagnostics are bounded to 16 KiB of JavaScript string length.

When a child exceeds its timeout, the runner sends `SIGTERM`, waits briefly,
sends `SIGKILL`, waits briefly again, and sends a final `SIGKILL`. It then
continues with the timeout result; if the child never closes, diagnostics
explicitly report that an unkillable child process remains.
These signal names and escalation order are the portable Node child-process
contract for this CLI; platform-specific process managers may interpret them
differently, but the runner does not promise platform-specific tree-kill
semantics.
On Linux and macOS, children are started in a process group and that group is
best-effort terminated before the direct child is terminated. Windows and
other platforms receive direct-child termination. Guaranteed cleanup of
arbitrary descendant trees on every platform is out of scope.
Truncation is explicit, repeated failure lines are deduplicated, and absolute
coverage paths are normalized relative to the workspace. stdout and stderr are
decoded independently and then combined into one bounded
diagnostic stream; stream identity is not exposed and arrival order does not
provide reliable stdout/stderr labels. `ELIWARE_TEST_DEBUG=1`
enables only the fixed,
non-sensitive coverage-fallback diagnostic; arbitrary arguments and values are
never printed. Structured diagnostics are not currently exposed.

## Workspace policy and process trust

Discovery and linting exclude `.git`, `node_modules`, `coverage`, `.nyc_output`,
`test-results`, `dist`, `build`, and package archives. Missing `.gitignore`
produces a warning with recommended entries but does not fail validation.

The default child environment is inherited intentionally to preserve drop-in
compatibility with direct `npm test` and Jest behavior. The package does not
provide a sanitized or secret-redacting mode and does not create a new security
boundary. Consumers must not run default mode against an untrusted workspace
while secrets are present.
An opt-in sanitized environment is deliberately out of scope: internal
projects depend on complete environment inheritance, and the complexity of
maintaining a second environment contract is not justified for this CLI.
Secret redaction is best effort only. If Jest or another child process emits a
secret from consumer code, the CLI preserves that diagnostic and passes it
through; the consumer is responsible for scrubbing code, fixtures, and logs.
Full inheritance is intentional and is not an accidental convenience: the
consumer's Jest, lint, and project configuration may depend on any environment
variable supplied by the invoking npm process. The CLI therefore does not
filter, redact, or selectively copy environment variables.

Bundled Oxlint and npm invocations use Node's executable and supported
package/runtime entrypoint contracts, preserving argument-array boundaries on
Windows and Unix-like systems. CI is the authoritative source of required
Windows evidence.
