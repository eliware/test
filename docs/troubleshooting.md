# Troubleshooting

Run `eliware-test --help` to confirm supported command forms. Use
`npm test -- <focused Jest path>` (or `node bin/eliware-test.mjs <focused Jest path>`)
for a focused run; missing paths are
rejected rather than silently expanding to the full suite.

For a failure, preserve the stage diagnostics and collect `node --version`,
the exact command, and a redacted package configuration. Do not include
credentials, tokens, private environment values, coverage artifacts, or
generated runtime output.

[Return to documentation](README.md).
Focused validation uses exactly one test path after npm's `--` separator, for
example `npm test -- --testNamePattern "case name" tests/example.test.mjs`.
Direct CLI use is `node bin/eliware-test.mjs tests/example.test.mjs`.
Jest option values are forwarded unchanged and are not counted as focused
paths; ambiguous or multiple actual focused paths are rejected.
