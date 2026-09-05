# Repository conventions

The normal CLI run performs deterministic repository-convention validation
before Jest. It reports missing required paths, invalid basic package metadata,
broken local README links, incomplete specification indexes, unsafe or missing
`.env.example` entries, and examples without discoverable run instructions.
Diagnostics are grouped, sorted, deduplicated, and returned with exit code 18.

The required top-level paths are `README.md`, `AGENTS.md`,
`RELEASE_NOTES.md`, `docs/`, `specs/`, `examples/`, and `.env.example`.
Repositories that genuinely cannot provide one may list its exact relative
path in `package.json`:

```json
{
  "eliwareTest": {
    "conventions": {
      "exceptions": ["examples"]
    }
  }
}
```

Exceptions are explicit path-level waivers only; they do not disable checks
that can still run. Examples are inspected but never executed by this layer.

Specification discovery is intentionally shallow and deterministic: Markdown
documents directly inside `specs/` are the specification set. The overview
must link to each of those documents. Nested directories under `specs/` are
not part of the discoverable specification set and are not required to be
indexed by the convention validator; repositories needing nested material
should link it from a top-level specification document.
