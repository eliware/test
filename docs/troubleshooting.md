# Troubleshooting

Run `eliware-test --help` to see valid commands.
Run one or more focused tests with `eliware-test tests/example.test.mjs`.
You can also run `node bin/eliware-test.mjs tests/example.test.mjs`.
The test path must exist under `tests/`.
Its name must end in `.test.*` or `.spec.*`.
Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.
The CLI rejects missing or unsupported paths. It does not expand them to the full suite.
You may pass supported Jest options, such as `--testNamePattern "case name"`.
The CLI forwards option values unchanged. It does not treat them as test paths.
The CLI accepts multiple test paths before an optional `--` separator.
It rejects ambiguous paths and paths after `--`.

When a command fails, save its diagnostics.
Also collect `node --version`, the exact command, and redacted package settings.
Do not include credentials, tokens, private environment values, coverage files, or generated output.

[Return to documentation](README.md).
