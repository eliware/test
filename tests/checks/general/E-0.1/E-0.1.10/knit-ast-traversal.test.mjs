import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectCalls } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-ast-traversal.mjs";
import { collectImports } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-import-analysis.mjs";

function collect(source) {
  const program = parse(source, { sourceType: "module", plugins: ["topLevelAwait"] }).program;
  const calls = [];
  collectCalls(program, new Map(), collectImports(program), calls);
  return calls;
}

test("collects direct and namespace subprocess calls with static arguments", () => {
  expect(
    collect(
      'import { spawnSync } from "node:child_process"; import * as child from "child_process"; const command = "npm"; spawnSync(command, ["test"]); child.spawnSync("npm", ["ci"]);',
    ),
  ).toEqual([
    expect.objectContaining({ kind: "spawnSync", command: "npm", args: ["test"] }),
    expect.objectContaining({ kind: "spawnSync", command: "npm", args: ["ci"] }),
  ]);
});

test("propagates static bindings through supported loops", () => {
  expect(
    collect(
      'import { spawnSync } from "node:child_process"; const command = "npm"; const args = ["test"]; for (const [name, values] of [[command, args]]) spawnSync(name, values);',
    ),
  ).toEqual([expect.objectContaining({ command: "npm", args: ["test"] })]);
});

test("omits argument arrays for exec subprocess calls", () => {
  expect(
    collect(
      'import { exec, execSync } from "node:child_process"; exec("echo hi"); execSync("echo hi");',
    ),
  ).toEqual([
    expect.objectContaining({ kind: "exec", args: [] }),
    expect.objectContaining({ kind: "execSync", args: [] }),
  ]);
});

test("ignores empty and primitive AST values", () => {
  const calls = [];
  const imports = { names: new Map(), namespaces: new Set() };
  collectCalls(null, new Map(), imports, calls);
  collectCalls("text", new Map(), imports, calls);
  expect(calls).toEqual([]);
});
