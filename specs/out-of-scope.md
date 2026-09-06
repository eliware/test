# Out of scope

This document records behavior the v6 CLI intentionally does not provide.

- Project-specific smoke, integration, regression, end-to-end, deployment,
  and product workflows remain consumer responsibilities.
- The CLI does not provide same-worktree concurrency coordination. Concurrent
  runs, unrelated external manipulation of transient workspace paths, and
  symbolic-link-based source/test trees are not supported validation models.
- The CLI does not provide a separate Jest concurrency model, an abort-signal
  API, or a supported runtime-library embedding API; the public interface is
  the `eliware-test` command.
- The CLI does not merge coverage candidates, select them by recency, infer
  ambiguous focused mappings, or prove that fallback text originated from a
  particular reporter.
- Diagnostic path normalization supports the documented Windows and POSIX
  path contracts. Arbitrary mixed-separator representations outside those
  contracts are not a supported input model.
- The convention validator checks deterministic structure, links, headings,
  required markers, and safe placeholders. It does not judge subjective prose
  quality, elegance, or whether an exception is substantively justified.

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
- Internal monolith measurement helpers are not standalone consumer commands,
  but their documented inputs and result shapes are validated test seams.
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
- A supported runtime library API is out of scope; the public interface is
  the `eliware-test` CLI.
- Treating Istanbul metadata maps with unmatched counter keys as valid
  coverage, including non-empty function metadata with an empty function
  counter map, is out of scope. Such reports are structurally unusable.
- Persisting timing diagnostics as workspace artifacts is out of scope. Timing
  data is captured in memory for the current run only; malformed timing data
  produces a warning and never replaces the primary test failure.
- On filesystems without usable `dev` and `ino` identity fields, coverage
  freshness cannot prove that an identical replacement file is the same or a
  different artifact when contents and timestamps also match. Stable contents
  and timestamps are the strongest supported signal in that environment.
- Coordinating concurrent worktree runs, validating unsupported package-manager
  layouts, and treating internal toolkit defaults as consumer configuration
  are out of scope.
- The boundary does not guarantee delivery through a caller-supplied output
  sink that throws. It guarantees the structured failure result; diagnostic
  emission through a faulty sink is best effort.
- Invalid or throwing diagnostic writers are not required to receive a second
  fallback diagnostic channel. Boundary failures guarantee `code`, `category`,
  and applicable details, not successful output delivery.
- The wrapper does not maintain a complete list of Jest options or infer their
  validity. Options outside the wrapper's documented flags are forwarded to
  Jest unchanged, which remains responsible for accepting or rejecting them.
- Testing unsupported Node/npm installation layouts is out of scope. The
  Windows npm fallback is validated only for the documented internal layout;
  other layouts may fail with the normal child-process startup diagnostic.
- Release-review tooling may request evidence for commands such as
  `check:docs`, audit, or pack; missing evidence is an incomplete validation
  record, not proof that the command failed.
- Project-specific smoke, integration, regression, deployment, and E2E tests,
  release orchestration, Git publishing, tagging, CI monitoring, and deployment
  remain outside this CLI's responsibility.
