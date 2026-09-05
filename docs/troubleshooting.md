# Troubleshooting

Read grouped diagnostics from `npm test` first. Use `npm run lint` to isolate
lint and workspace-policy failures, or run a defined package script directly to
isolate a package-check failure. Coverage gaps require tests that cover all
statements, branches, functions, and lines; `--ignore-100x4` is only a
diagnostic opt-out.

Do not run the CLI against untrusted code while sensitive credentials are in
the environment. Scrub fixtures and test output before validation.
