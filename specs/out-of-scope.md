# Out of scope

This document records behavior the v6 CLI intentionally does not provide.

- Sanitized or selectively inherited child environments are out of scope; the
  CLI intentionally passes through the invoking environment.
- Comprehensive secret detection or redaction is out of scope. Consumers
  must scrub code, fixtures, and logs before running tests.
- Guaranteed descendant-process cleanup on every platform is out of scope;
  Windows cleanup is limited to best-effort direct-child termination.
- Coverage backup and restoration are out of scope. The latest validated
  coverage directory overwrites the consumer's existing `coverage/` directory.
- Dynamic coverage merging or recency-based candidate selection is out of
  scope. Fixed candidate precedence is authoritative.
- Compatibility with nonstandard Node.js/npm installation layouts or package
  managers outside the internal Eliware environment is out of scope. The
  Windows npm fallback supports the documented conventional layout only.
- Convention exceptions are not a general disable switch. The validator does
  not provide per-check waivers for package metadata, README content,
  specifications, environment safety, examples, or badges; repositories must
  satisfy those checks when the corresponding path exists.
- Internal monolith measurement helpers are not standalone public APIs. The
  supported pipeline validates `--workers=N` before invoking them; rejecting
  malformed worker values supplied by direct helper callers is outside scope.
- A stale but structurally usable coverage JSON report is not promoted as
  current evidence. The resolver may skip it and use valid current Jest text
  coverage instead; proving that those two artifacts are identical is outside
  scope. If no valid current evidence exists, coverage fails closed.
- With freshness tracking enabled, a fresh malformed JSON candidate is
  authoritative failure evidence even when a lower-priority candidate is
  usable. Treating that malformed current artifact as skippable is outside the
  coverage contract; without freshness tracking, the normal text-fallback path
  remains supported.
- Semantic judgment of documentation prose is out of scope. Documentation
  checks validate deterministic structure, links, headings, required markers,
  and safe placeholders; they do not decide whether prose is elegant,
  complete, or understandable to a human reviewer.
- Project-specific smoke, integration, regression, deployment, and E2E tests
  remain consumer responsibilities.
- A supported runtime library API is out of scope; the public interface is
  the `eliware-test` CLI.
- Treating Istanbul metadata maps with unmatched counter keys as valid
  coverage, including non-empty function metadata with an empty function
  counter map, is out of scope. Such reports are structurally unusable.
- Requiring immediate child-process settlement on an `error` event when no
  `close` event has arrived is out of scope. The documented timeout and signal
  escalation contract remains authoritative.
- Guaranteed removal of optional timing diagnostics after a failed Jest run is
  out of scope. Timing parsing and cleanup are best effort; cleanup warnings
  must not replace the primary test failure or become a release gate.
- Inferring values for undocumented Jest options, coordinating concurrent
  worktree runs, validating unsupported package-manager layouts, and treating
  internal toolkit defaults as consumer configuration are out of scope.
- The boundary does not guarantee delivery through a caller-supplied output
  sink that throws. It guarantees the structured failure result; diagnostic
  emission through a faulty sink is best effort.
- Bare value options whose next token begins with `-` are rejected as
  ambiguous; option-like values must use the documented equals form. Supporting
  arbitrary Jest option grammars is out of scope.
- Release-review tooling may request evidence for commands such as
  `check:docs`, audit, or pack; missing evidence is an incomplete validation
  record, not proof that the command failed.
- Coverage does not have precedence over later post-test failures. The tool
  intentionally runs package-script, monolith, and lint checks after coverage
  evidence fails; those failures take precedence in that order, with coverage
  returned only when the later checks pass. Treating this documented precedence
  as a correctness defect is out of scope.
