# @eliware/test specifications

This directory contains the normative developer-facing specification for the
`@eliware/test` CLI. Requirements in these documents describe supported
behavior; explanatory history is labeled as such. [`out-of-scope.md`](out-of-scope.md)
lists behavior this package does not promise.

## Specification index

- [`cli.md`](cli.md) — commands, lifecycle, arguments, and limits
- [`concurrency-and-limitations.md`](concurrency-and-limitations.md) — workspace
  concurrency and intentional limitations
- [`conventions.md`](conventions.md) — deterministic repository conventions
- [`coverage.md`](coverage.md) — coverage evidence and 100×4 enforcement
- [`diagnostics-and-policy.md`](diagnostics-and-policy.md) — output and process
  trust boundaries
- [`migration-and-release.md`](migration-and-release.md) — migration and release
  requirements
- [`out-of-scope.md`](out-of-scope.md) — explicit exclusions
- [`scope-and-contract.md`](scope-and-contract.md) — package scope and contract

Return to the [root README](../README.md) for user setup. Implementation and
test changes must keep the specifications synchronized with the CLI.
