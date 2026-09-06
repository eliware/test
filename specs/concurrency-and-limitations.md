# Concurrency and workspace artifacts

## Concurrency and shared workspace artifacts

`@eliware/test` uses the consumer's current worktree as its validation
workspace. Each Jest run writes coverage to an isolated temporary directory;
after the run, the validated directory is promoted to the consumer's
`coverage/` directory for inspection. The runner does not merge reports and
does not provide a separate Jest concurrency model.

Validation uses one active run per worktree. Users or CI allocate separate
worktrees for concurrent developers, agents, or jobs.

The toolkit coordinates its validation stages internally. Those implementation
boundaries are not consumer APIs; consumers should invoke the CLI.

## Supported operational constraints

Coverage promotion replaces the consumer's existing `coverage/` directory by
moving the validated temporary directory into its place. Previous results are
not retained: no backup, rollback directory, restoration attempt, or
post-promotion cleanup is performed.

The CLI adapter explicitly enables monolith enforcement for normal runs. The
toolkit's lower-level defaults are internal composition and test seams, not an
alternate consumer configuration contract.

Convention collection caches directory traversal and file-content snapshots so
all convention checks inspect the same deterministic inputs.

- Istanbul policy discovery is complete; directory enumeration is deterministic
  and source inspection uses at most six concurrent readers.
- The CLI centralizes sequencing and uses injected filesystem/process seams.
