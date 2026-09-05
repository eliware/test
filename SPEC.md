# `@eliware/test` specification

This is the normative overview and table of contents for the published CLI
contract. Statements using **must** or **must not** are requirements. The
linked documents contain the detailed contract; this file resolves scope and
provides the stable navigation entrypoint.

## Contract sections

1. [Scope and package contract](spec/scope-and-contract.md)
2. [CLI commands, lifecycle, limits, and focused tests](spec/cli.md)
3. [Coverage enforcement](spec/coverage.md)
4. [Output, workspace policy, and process trust](spec/diagnostics-and-policy.md)
5. [Concurrency and intentional limitations](spec/concurrency-and-limitations.md)
6. [Out-of-scope behavior, migration, fixtures, and release](spec/migration-and-release.md)

## Scope summary

`@eliware/test` is the shared baseline for routine Jest execution, coverage
enforcement, and Oxlint validation in Eliware Node.js projects.

The stable consumer interface is the `eliware-test` CLI. Consumers use
`eliware-test` for `test` and `eliware-test --lint` for `lint`; the intended
integration is replacing the consumer project's `npm test` command with this
CLI. Contributor setup uses `node bin/eliware-test.mjs` for the repository's own
self-tests; consumers invoke the installed `eliware-test` command.

The CLI adapter converts validation results to numeric process exit codes.
Internal toolkit/test callers receive a structured result containing the same
numeric `code` plus a stable `category`; these implementation seams are not
supported consumer APIs.

The contract requires Node.js 26 or newer, native ESM, Jest and Oxlint as npm
runtime dependencies resolved from the consumer workspace first with the
package runtime as fallback, Node child-process APIs with argument arrays,
strict 100×4 coverage, exact mirrored `.mjs` source/test modules under `src/`
and `tests/`, and synchronized
package metadata and documentation.

## Validation summary

The normal validation sequence is workspace policy, focused-argument
validation, coverage cleanup, source/test architecture mapping, Jest with
coverage, coverage evidence validation, Oxlint with warnings denied, monolith
enforcement, and
optional consumer package-script checks. Stages stop at the first applicable
failure. See the linked sections for
stable exit codes, diagnostic behavior, focused-test rules, coverage fallback,
workspace ownership, and release limitations.

The README provides user-facing setup and command examples. This
specification, including its linked sections, is the authoritative technical
contract.
