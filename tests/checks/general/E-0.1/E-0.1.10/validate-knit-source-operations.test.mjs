import { expect, test } from "@jest/globals";
import { validateKnitSourceOperations } from "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-source-operations.mjs";

test("rejects source code containing unsupported external operations", () => {
  for (const source of [
    'import fs from "node:fs"; fs.rm("output");',
    'fetch("https://example.test");',
    'https.request("https://example.test");',
    'net.connect(443, "example.test");',
    "process.exit(1);",
    'import { rm as remove } from "node:fs"; remove("output");',
    "exit(1);",
    'request("https://example.test");',
    "process.exit(); harmless();",
  ]) {
    expect(validateKnitSourceOperations(source)).toContain("unsupported filesystem, network, process");
  }
});

test("ignores operation-like comments and string literals", () => {
  expect(validateKnitSourceOperations('const example = `fs.rm("output")`; // fetch("url")')).toBeNull();
  expect(validateKnitSourceOperations('import { spawnSync } from "node:child_process";')).toBeNull();
});

test("rejects computed and unresolved filesystem and network operations", () => {
  for (const source of [
    'import * as fs from "node:fs"; fs["rm"]("output");',
    'import * as fs from "node:fs"; fs[operation]("output");',
    'globalThis["fetch"]("https://example.test");',
    'globalThis[operation]("https://example.test");',
    'process[operation]("SIGTERM");',
    "const p = process; p.exit(1);",
    'const f = fetch; f("https://example.test");',
    'const g = globalThis; g["fetch"]("https://example.test");',
    'const p = process; const alias = p; alias["kill"](1);',
    'const { exit: stop } = process; stop(1);',
    'const { ["exit"]: stop } = process; stop(1);',
    'const { [operation]: stop } = process; stop(1);',
    'const { exit: stop = fallback } = process; stop(1);',
    'const { ...all } = process; all.exit(1);',
    'const { exit: { nestedStop } } = process; nestedStop(1);',
    'const { env: { constructor: construct } } = process; construct("return process")();',
    'const { exit: { ...nestedAll } } = process; nestedAll.call(1);',
    'const { exit: [, nestedStop] } = process; nestedStop(1);',
    'const [processAlias] = process; processAlias.exit(1);',
    'process?.exit(1);',
    'globalThis?.fetch("https://example.test");',
    "function validate() { const p = process; p.exit(1); }",
    'function validate() { const { fetch: request } = globalThis; request("https://example.test"); }',
    'const fetcher = globalThis.fetch; fetcher("https://example.test");',
    'const fetcher = globalThis?.fetch; fetcher("https://example.test");',
  ]) {
    expect(validateKnitSourceOperations(source)).toContain("unsupported filesystem, network, process");
  }
});

test("rejects invalid JavaScript rather than skipping source operation checks", () => {
  expect(validateKnitSourceOperations("const value = ;")).toContain("not valid JavaScript");
});

test("allows non-side-effect member calls and read-only process access", () => {
  expect(validateKnitSourceOperations(
    'import { readFile } from "node:fs"; let deferred; const scalar = 1; const ordinary = ordinaryObject; const { cwd } = process; const { value } = ordinaryObject; const { local } = ordinary; process.cwd(); globalThis.location(); this.run(); object.run(); object[1](); getObject().run();',
  )).toBeNull();
});
