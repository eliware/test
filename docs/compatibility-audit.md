# Dead-code and compatibility audit

This inventory records the disposition of the legacy and fallback candidates
reviewed for the v8 validator.

| Area | Disposition | Reason |
| --- | --- | --- |
| `bound-process-output.mjs` | Removed | No production imports; `capture-child-output.mjs` is the active implementation. |
| Jest output classifiers | Retained | Unexpected output, result classification, console detection, slow-test detection, and timing have distinct contracts. |
| Timing reporters and `write-debug-timing.mjs` | Retained | Live reporter, post-run parser, and final duration output serve different output boundaries. |
| `timing.step()` fallback | Removed | Current timer contract is `start()`/`end()`; legacy fallback had no production caller. |
| `--ignore-100x4`, `--ignore-monolith-limits` | Removed | Not part of the supported public v8 command surface. |
| Jest executable fallbacks | Narrowed and retained | Consumer resolution is authoritative; supported package layouts remain, with stable failure diagnostics. |
| npm executable fallbacks | Retained | Required for supported Node.js 26 and Windows environments. |
| Oxlint/Prettier executable metadata handling | Retained | Supports npm package `bin` metadata shapes used by supported package versions. |
| Non-deterministic checks | Retained | They are advisory declarations in the selected registry and are intentionally skipped as enforcement results. |
| Git-tracked-path filesystem fallback | Retained and documented | Used for non-Git test fixtures; real repositories use Git metadata and failures remain closed. |
| External authority-reference fallback | Retained and documented | Cross-repository references may be unavailable; local references still fail when unresolved. |
| YAML `on`/`true`, runner, and attestation input aliases | Centralized | Normalized at the workflow boundary before domain validators consume the data. |
| Repository file collectors | Retained separately | Source/test, repository policy, documentation, and generated-file scans have different roots and exclusion semantics. |
| Authority/reference validators | Retained separately | Documentation and contract profiles validate different schemas and ownership boundaries. |
| Package/version validators | Retained separately | Runtime, publication, package version, and profile authority checks produce independent diagnostics. |
| Broad forwarded Jest arguments | Retained | Required by the current focused-Jest contract; wrapper-owned arguments are filtered before execution. |
| Compatibility-focused tests | Classified | Obsolete tests were removed with dead code; supported Windows, YAML, external-reference, and focused-argument cases remain covered. |

The audit deliberately does not consolidate modules solely to reduce line
count; behaviorally distinct scanners and validators remain separate.
