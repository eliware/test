# Troubleshooting

Run `eliware-test --help` to confirm supported command forms. To run one focused
test through npm, use `npm test -- tests/example.test.mjs`. npm consumes the `--`
separator; the harness receives only `tests/example.test.mjs` and invokes Jest
for that path. The equivalent direct invocation is
`node bin/eliware-test.mjs tests/example.test.mjs`. The path must be under
`tests/`, must exist, and its filename must end in `.test.*` or `.spec.*` with
one of these extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, or
`.cts`. Missing or unsupported paths are rejected rather than silently
expanding to the full suite. Supported Jest option/value forms include the
wrapper's declared options such as `--testNamePattern "case name"`; option
values are forwarded unchanged and are not counted as focused paths. Ambiguous
or multiple actual focused paths are rejected.

For a failure, preserve the stage diagnostics and collect `node --version`,
the exact command, and a redacted package configuration. Do not include
credentials, tokens, private environment values, coverage artifacts, or
generated runtime output.

[Return to documentation](README.md).
