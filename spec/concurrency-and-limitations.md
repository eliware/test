# Concurrency and intentional limitations

## 9. Concurrency and shared workspace artifacts

`@eliware/test` uses the consumer's current worktree as its validation
workspace. Jest coverage remains there for inspection. The runner does not move
or merge artifacts and does not provide a separate Jest concurrency model.

The supported model is one active validation per worktree. Users or CI must
allocate separate worktrees for concurrent developers, agents, or jobs. The
runner does not create worktrees, locks, or coordinate overlapping processes.
Same-worktree overlap is unsupported and its results are not guaranteed.

The toolkit keeps stage sequencing in one orchestration boundary; injected
seams are the supported isolation mechanism for stage tests, not a promise of
separately published stage modules.

## 10. Intentional limitations

- Istanbul policy discovery is complete; directory enumeration is deterministic
  and source inspection uses at most six concurrent readers.
- The CLI centralizes sequencing and uses injected filesystem/process seams.
- Injected lint collaborators may return a numeric exit code or an object with
  an integer `code` and optional string `output`.
- The local Windows npm-shim test is conditional when its shim is unavailable;
  Windows CI supplies platform evidence.
- Coverage text parsing is whole-buffer because captured input is bounded.
- Text fallback cannot independently prove its table originated from Jest.

## 11. Explicitly out of scope

This package does not promise project-specific smoke, integration, regression,
end-to-end, deployment, or product workflows; same-worktree concurrency
coordination; arbitrary Jest option discovery; structured diagnostics; an
abort-signal API; semantic coverage-candidate merging; coverage correctness
beyond producer evidence; guessing ambiguous focused mappings; or proof that
fallback text came from a specific reporter.
