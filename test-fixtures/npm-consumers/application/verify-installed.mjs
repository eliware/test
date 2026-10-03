import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const installed = JSON.parse(
  await readFile(new URL("./node_modules/@eliware/test/package.json", import.meta.url), "utf8"),
);
const result = spawnSync(
  process.execPath,
  ["./node_modules/@eliware/test/bin/eliware-test.mjs", "--version"],
  { encoding: "utf8" },
);
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.trim(), installed.version);
