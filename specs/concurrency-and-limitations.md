# Concurrency and workspace artifacts

## Concurrency and shared workspace artifacts

`@eliware/test` uses the consumer's current worktree as its validation
workspace. Each Jest run writes coverage to an isolated temporary directory;
after the run, the validated directory is promoted to the consumer's
`coverage/` directory for inspection. The runner does not merge reports and
does not provide a separate Jest concurrency model.

The supported model is one active validation per worktree. Users or CI allocate
separate worktrees for concurrent developers, agents, or jobs.

The toolkit coordinates its validation stages internally. Those implementation
boundaries are not consumer APIs; consumers should invoke the CLI.

## Supported operational constraints

Coverage promotion may use a fixed, transient rollback pathname while an
existing coverage directory is replaced. That pathname is cleaned up before
promotion and is not a user backup or restoration feature. Concurrent runs or
unrelated external manipulation of that transient pathname are unsupported.

The CLI adapter explicitly enables monolith enforcement for normal runs. The
toolkit's lower-level defaults are internal composition and test seams, not an
alternate consumer configuration contract.

- Istanbul policy discovery is complete; directory enumeration is deterministic
  and source inspection uses at most six concurrent readers.
- The CLI centralizes sequencing and uses injected filesystem/process seams.
- Text fallback cannot independently prove its table originated from Jest.
