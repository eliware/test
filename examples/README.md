# Minimal consumer example

This example shows the supported v5 consumer setup with a mirrored `src/` and
`tests/` tree.

## Examples

- [`minimal-consumer/`](minimal-consumer/) — minimal setup with Jest, coverage,
  and lint commands

## Prerequisites

- Node.js 26 or newer
- npm

## Install and run

From this directory:

```sh
npm install
npm test
npm run lint
```

Expected output includes a passing Jest run, `100×4` coverage, and zero lint
warnings. Remove generated `node_modules/`, coverage output, and the lockfile
after trying it if you do not want to retain them.

Examples use safe placeholders only; never add real secrets or private
endpoints to an example.

Return to the [root README](../README.md) for the consumer workflow.
