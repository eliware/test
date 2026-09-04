# Concurrency and workspace artifacts

## 9. Concurrency and shared workspace artifacts

`@eliware/test` uses the consumer's current worktree as its validation
workspace. Each Jest run writes coverage to an isolated temporary directory;
after the run, the validated directory is promoted to the consumer's
`coverage/` directory for inspection. The runner does not merge reports and
does not provide a separate Jest concurrency model.

The supported model is one active validation per worktree. Users or CI allocate
separate worktrees for concurrent developers, agents, or jobs.

The toolkit uses layered stage orchestration: `runToolkit` is the thin main
lifecycle orchestrator, with `runToolkitPreflight`, `runToolkitExecution`, and
`runPostTestValidation` coordinating their respective stages. Injected seams
are the supported isolation mechanism for stage tests.

## 10. Supported operational constraints

- Istanbul policy discovery is complete; directory enumeration is deterministic
  and source inspection uses at most six concurrent readers.
- The CLI centralizes sequencing and uses injected filesystem/process seams.
- Injected lint collaborators may return a numeric exit code or an object with
  an integer `code` and optional string `output`.
- The local Windows npm-shim test is conditional when its shim is unavailable;
  Windows CI supplies platform evidence.
- Coverage text parsing is whole-buffer because captured input is bounded.
- Text fallback cannot independently prove its table originated from Jest.
