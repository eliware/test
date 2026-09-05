# Consumer usage

Install `@eliware/test` as a development dependency, set `test` to
`eliware-test`, and set `lint` to `eliware-test --lint`. Run `npm test` from
the consumer repository with Node.js 26 or newer.

The normal command validates workspace policy, runs Jest with coverage, checks
the mirrored source/test layout, runs Oxlint, enforces monolith limits, and
runs defined package checks. Use `npm test -- tests/example.test.mjs` for a
focused test path. See the [root README](../README.md) for all supported flags.
