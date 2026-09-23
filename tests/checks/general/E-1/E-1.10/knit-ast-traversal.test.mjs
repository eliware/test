import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectCalls } from "../../../../../src/checks/general/E-1/E-1.10/knit-ast-traversal.mjs";
import { collectImports } from "../../../../../src/checks/general/E-1/E-1.10/knit-import-analysis.mjs";

test("collects statically bound subprocess calls", () => {
  const program = parse(
    'import { spawnSync } from "node:child_process"; const command = "npm"; spawnSync(command, ["test"]);',
    { sourceType: "module" },
  ).program;
  const calls = [];
  const unsupported = [];
  collectCalls(program, new Map(), collectImports(program), calls, unsupported);
  expect(calls).toEqual([expect.objectContaining({ kind: "spawnSync", command: "npm", args: ["test"] })]);
  expect(unsupported).toEqual([]);
});

function collect(source) {
  const program = parse(source, { sourceType: "module", plugins: ["topLevelAwait"] }).program;
  const calls = [];
  const unsupported = [];
  collectCalls(program, new Map(), collectImports(program), calls, unsupported);
  return { calls, unsupported };
}

test("collects imported child-process calls and unsupported side effects", () => {
  const program = parse(
    'import { spawnSync } from "node:child_process"; import * as fs from "node:fs"; spawnSync("npm", ["test"]); fs.rm("x");',
    { sourceType: "module" },
  ).program;
  const calls = [];
  const unsupported = [];
  collectCalls(program, new Map(), collectImports(program), calls, unsupported);
  expect(calls).toHaveLength(1);
  expect(unsupported).toHaveLength(1);
});

test("handles static loops and bindings while collecting commands", () => {
  const { calls, unsupported } = collect(
    'import { spawnSync } from "node:child_process"; const command = "npm"; const args = ["test"]; const [destructured] = ["x"]; const dynamic = unknown; for (const [name, values] of [[command, args]]) { spawnSync(name, values); } for (item of [["x"]]) { spawnSync(item, []); } for (item of unknown) { spawnSync(item, []); }',
  );
  expect(calls).toHaveLength(3);
  expect(calls[0]).toEqual(expect.objectContaining({ command: "npm", args: ["test"] }));
  expect(unsupported).toHaveLength(1);
});

test("marks dynamic and unsupported call forms", () => {
  const { unsupported } = collect(
    'import { rm } from "node:fs"; import * as fs from "node:fs"; import { spawnSync } from "node:child_process"; rm("x"); fs.rm("x"); unknown(); require("x"); eval("x"); import("x"); process.cwd(); object.run(); spawnSync("echo", []);',
  );
  expect(unsupported.length).toBeGreaterThanOrEqual(6);
});

test("covers nested member roots and exec argument handling", () => {
  const { calls } = collect(
    'import { exec, execSync } from "node:child_process"; import * as child from "node:child_process"; exec("echo hi"); execSync("echo hi"); child.spawnSync("echo", []); child.other("x"); object.deep.run();',
  );
  expect(calls.map(({ kind }) => kind)).toEqual(["exec", "execSync", "spawnSync"]);
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
