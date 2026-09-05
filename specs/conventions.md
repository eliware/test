# Repository conventions

The normal CLI run performs deterministic repository-convention validation
before Jest. It reports missing required paths, invalid basic package metadata,
broken local README links, incomplete specification indexes, unsafe or missing
`.env.example` entries, and examples without discoverable run instructions.
Diagnostics are grouped, sorted, deduplicated, and returned with exit code 18.

The required top-level paths are `README.md`, `AGENTS.md`,
`RELEASE_NOTES.md`, `docs/`, `specs/`, `examples/`, and `.env.example`.

The documentation subfolders have these minimum structures:

- The root `README.md` identifies the project, explains its purpose and scope,
  requirements, setup, basic usage, configuration, validation, security,
  support, relevant documentation/specification/example/release-note links,
  and license. Public packages also use the standard branded opening and
  accurate badges.
- `docs/` contains `README.md` as an overview and table of contents plus at
  least two additional Markdown documents containing complete end-user
  documentation. The README identifies the audience and purpose, links to
  every direct child document, briefly describes each, and links back to the
  root README.
- `specs/` contains `README.md` as a developer-facing overview and table of
  contents, at least one additional specification document, and at least one
  additional document explicitly covering out-of-scope behavior. The README
  states scope and normative status, links to every direct child document,
  describes each document, identifies the out-of-scope document, and links
  back to the root README.
- `examples/` contains `README.md` as an overview and table of contents plus at
  least one runnable example. The README states prerequisites, safe setup,
  commands, expected results, placeholder/secret-safety guidance, links to
  every example, and links back to the root README.
  Relative links from the root README to directories must target a directory
  containing `README.md` or `index.md` so navigation has a deterministic entry
  point.
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

For public Eliware packages, the convention validator also requires README
links for the canonical npm package, license file, and CI workflow badges.
