# Out of scope

This document records behavior the v5 CLI intentionally does not provide.

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
- Project-specific smoke, integration, regression, deployment, and E2E tests
  remain consumer responsibilities.
- A supported runtime library API is out of scope; the public interface is
  the `eliware-test` CLI.
