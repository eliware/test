import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
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
    expect(validateKnitSourceOperations(source)).toContain(
      "unsupported filesystem, network, process",
    );
  }
});

test("rejects filesystem operations aliased from imported modules", () => {
  for (const source of [
    'import * as fs from "node:fs"; const remove = fs.rm; remove("output");',
    'import { rm } from "node:fs"; const remove = rm; remove("output");',
  ]) {
    expect(validateKnitSourceOperations(source)).toContain(
      "unsupported filesystem, network, process",
    );
  }
});

test("ignores operation-like comments and string literals", () => {
  expect(
    validateKnitSourceOperations('const example = `fs.rm("output")`; // fetch("url")'),
  ).toBeNull();
  expect(
    validateKnitSourceOperations('import { spawnSync } from "node:child_process";'),
  ).toBeNull();
});

test("allows analyzed top-level subprocess commands and rejects helper subprocess calls", () => {
  const topLevel = 'import * as child from "node:child_process"; child.execSync("npm", ["test"]);';
  const topLevelAst = parse(topLevel, { sourceType: "module" });
  const topLevelCall = topLevelAst.program.body[1].expression;
  expect(
    validateKnitSourceOperations(topLevel, topLevelAst, [{ start: topLevelCall.start }]),
  ).toBeNull();

  const helper =
    'import * as child from "node:child_process"; function helper() { child.execSync("node", ["-e", "work"]); }';
  const helperAst = parse(helper, { sourceType: "module" });
  const helperCall = helperAst.program.body[1].body.body[0].expression;
  expect(validateKnitSourceOperations(helper, helperAst, [{ start: helperCall.start }])).toContain(
    "unsupported filesystem, network, process, or subprocess operation",
  );
});

test("rejects unsupported APIs called through child-process namespaces", () => {
  for (const source of [
    'import * as child from "node:child_process"; child.fork("worker.mjs");',
    'import * as child from "child_process"; child[operation]("worker.mjs");',
    'import * as child from "node:child_process"; child.exec("command");',
    'import "node:child_process";',
    'export { spawn as run } from "node:child_process";',
  ]) {
    expect(validateKnitSourceOperations(source)).toContain(
      "unsupported filesystem, network, process",
    );
  }
});

test("rejects computed and unresolved filesystem and network operations", () => {
  for (const source of [
    'import * as fs from "node:fs"; fs["rm"]("output");',
    'import * as fs from "node:fs"; fs[operation]("output");',
    'globalThis["fetch"]("https://example.test");',
    'globalThis[operation]("https://example.test");',
    "const { process: p } = globalThis; p.exit(1);",
    'process[operation]("SIGTERM");',
    "const p = process; p.exit(1);",
    'const f = fetch; f("https://example.test");',
    'const g = globalThis; g["fetch"]("https://example.test");',
    'const p = process; const alias = p; alias["kill"](1);',
    "const { exit: stop } = process; stop(1);",
    'const { ["exit"]: stop } = process; stop(1);',
    "const { [operation]: stop } = process; stop(1);",
    "const { exit: stop = fallback } = process; stop(1);",
    "const { ...all } = process; all.exit(1);",
    "const { exit: { nestedStop } } = process; nestedStop(1);",
    'const { env: { constructor: construct } } = process; construct("return process")();',
    "const { exit: { ...nestedAll } } = process; nestedAll.call(1);",
    "const { exit: [, nestedStop] } = process; nestedStop(1);",
    "const [processAlias] = process; processAlias.exit(1);",
    "process?.exit(1);",
    'globalThis?.fetch("https://example.test");',
    "function validate() { const p = process; p.exit(1); }",
    'function validate() { const { fetch: request } = globalThis; request("https://example.test"); }',
    'const fetcher = globalThis.fetch; fetcher("https://example.test");',
    'const fetcher = globalThis?.fetch; fetcher("https://example.test");',
  ]) {
    expect(validateKnitSourceOperations(source)).toContain(
      "unsupported filesystem, network, process",
    );
  }
});

test("rejects mutating operations inside uncalled helper functions", () => {
  for (const source of [
    'import * as fs from "node:fs"; function dormant() { fs.writeFileSync("output", "data"); }',
    'function dormant() { fetch("https://example.test"); }',
  ]) {
    expect(validateKnitSourceOperations(source)).toContain(
      "unsupported filesystem, network, process",
    );
  }
});

test("rejects invalid JavaScript rather than skipping source operation checks", () => {
  expect(validateKnitSourceOperations("const value = ;")).toContain("not valid JavaScript");
});

test("allows non-side-effect member calls and read-only process access", () => {
  expect(
    validateKnitSourceOperations(
      'import { readFile } from "node:fs"; let deferred; const scalar = 1; const ordinary = ordinaryObject; const { cwd } = process; const { value } = ordinaryObject; const { local } = ordinary; process.cwd(); globalThis.location(); this.run(); object.run(); object[1](); getObject().run();',
    ),
  ).toBeNull();
});

test("handles cyclic AST-shaped inputs without recursing indefinitely", () => {
  const program = { type: "Program", body: [] };
  program.body.push(program);
  expect(validateKnitSourceOperations("", { program })).toBeNull();
});
