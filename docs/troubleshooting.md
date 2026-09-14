# Troubleshooting

Run `eliware-test --help` to confirm supported command forms. Use
`npm test -- <focused Jest paths>` for a focused run; missing paths are
rejected rather than silently expanding to the full suite.

For a failure, preserve the stage diagnostics and collect `node --version`,
the exact command, and a redacted package configuration. Do not include
credentials, tokens, private environment values, coverage artifacts, or
generated runtime output.

[Return to documentation](README.md).
