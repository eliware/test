import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectCalls } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-ast-traversal.mjs";
import { collectImports } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-import-analysis.mjs";

function collect(source) {
  const program = parse(source, { sourceType: "module", plugins: ["topLevelAwait"] }).program;
  const calls = [];
  const unsupported = [];
  collectCalls(program, new Map(), collectImports(program), calls, unsupported);
  return { calls, unsupported };
}

test("collects statically bound subprocess commands", () => {
  const { calls, unsupported } = collect(
    'import { spawnSync } from "node:child_process"; const command = "npm"; spawnSync(command, ["test"]);',
  );
  expect(calls).toEqual([
    expect.objectContaining({ kind: "spawnSync", command: "npm", args: ["test"] }),
  ]);
  expect(unsupported).toEqual([]);
});

test("collects imported child-process calls and unsupported side effects", () => {
  const { calls, unsupported } = collect(
    'import { spawnSync } from "node:child_process"; import * as child from "node:child_process"; import * as fs from "node:fs"; spawnSync("npm", ["test"]); child.spawnSync("npm", ["test"]); fs.rm("x");',
  );
  expect(calls).toHaveLength(2);
  expect(unsupported).toHaveLength(1);
});

test("propagates static bindings through loop traversal", () => {
  const { calls, unsupported } = collect(
    'import { spawnSync } from "node:child_process"; const command = "npm"; const args = ["test"]; for (const [name, values] of [[command, args]]) { spawnSync(name, values); }',
  );
  expect(calls).toEqual([expect.objectContaining({ command: "npm", args: ["test"] })]);
  expect(unsupported).toEqual([]);
});

test("records unsupported classifications from call analysis", () => {
  const { unsupported } = collect(
    'import { rm } from "node:fs"; rm("x"); require("x"); unknown();',
  );
  expect(unsupported).toHaveLength(3);
});

test("rejects unapproved namespace subprocess operations and indirect aliases", () => {
  const { calls, unsupported } = collect(
    'import * as child from "node:child_process"; child.fork("worker.js"); const run = child.execSync; run("npm test");',
  );
  expect(calls).toEqual([]);
  expect(unsupported).toHaveLength(2);
});

test("finds subprocess commands inside invoked local functions", () => {
  const { calls, unsupported } = collect(
    'import { spawnSync } from "node:child_process"; function deploy() { spawnSync("npm", ["publish"]); } deploy();',
  );
  expect(calls).toEqual([
    expect.objectContaining({ kind: "spawnSync", command: "npm", args: ["publish"] }),
  ]);
  expect(unsupported).toHaveLength(1);
});

test("omits argument arrays for exec subprocess calls", () => {
  const { calls } = collect(
    'import { exec, execSync } from "node:child_process"; exec("echo hi"); execSync("echo hi");',
  );
  expect(calls).toEqual([
    expect.objectContaining({ kind: "exec", args: [] }),
    expect.objectContaining({ kind: "execSync", args: [] }),
  ]);
});

test("accepts empty and primitive AST values", () => {
  const calls = [];
  const unsupported = [];
  const imports = { names: new Map(), namespaces: new Set(), sideEffectNamespaces: new Set() };
  collectCalls(null, new Map(), imports, calls, unsupported);
  collectCalls("text", new Map(), imports, calls, unsupported);
  expect(calls).toEqual([]);
  expect(unsupported).toEqual([]);
});
