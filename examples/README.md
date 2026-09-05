# Minimal consumer example

This example shows the supported v4 consumer setup with a mirrored `src/` and
`tests/` tree.

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
