# Troubleshooting

Run `eliware-test --help` to confirm supported command forms. To run one focused
test through npm, use `npm test -- tests/example.test.mjs`. npm consumes the `--`
separator; the harness receives only `tests/example.test.mjs` and invokes Jest
for that path. The equivalent direct invocation is
`node bin/eliware-test.mjs tests/example.test.mjs`. Missing paths are rejected
rather than silently expanding to the full suite.

For a failure, preserve the stage diagnostics and collect `node --version`,
the exact command, and a redacted package configuration. Do not include
credentials, tokens, private environment values, coverage artifacts, or
generated runtime output.

[Return to documentation](README.md).
Focused validation uses exactly one test path after npm's `--` separator. The
separator is consumed by npm and is not forwarded to the harness or Jest.
The supported focused option/value forms are the wrapper's declared Jest value options (including
`--testNamePattern "case name"`); their values are forwarded unchanged and
are not counted as focused paths. Ambiguous or multiple actual focused paths
are rejected.
