import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { analyzeKnitScriptAst } from "../../../../../src/checks/general/E-0.1/E-0.1.10/analyze-knit-script-ast.mjs";

function analyze(source) {
  return analyzeKnitScriptAst(parse(source, {
    sourceType: "module",
    plugins: ["importAttributes", "topLevelAwait"],
  }));
}

test("collects ordered static subprocess commands and detects leading executable code", () => {
  const result = analyze(`
    import { spawnSync } from "node:child_process";
    const command = "npm";
    spawnSync(command, ["test"]);
  `);
  expect(result.calls.map(({ command, args }) => [command, ...args])).toEqual([["npm", "test"]]);
  expect(result.unsupported).toEqual([]);
  expect(result.leadingExecutable).toBe(false);
  expect(analyze('console.log("before"); import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);').leadingExecutable).toBe(true);
});

test("marks unsupported imports and dynamic operations", () => {
  const result = analyze(`
    import { spawnSync } from "node:child_process";
    import { readFile } from "node:fs/promises";
    import "custom-side-effect";
    readFile("file");
    spawnSync(command, args);
  `);
  expect(result.calls).toHaveLength(2);
  expect(result.calls.map(({ command }) => command)).toEqual(["file", undefined]);
  expect(result.unsupported.length).toBeGreaterThanOrEqual(3);
});

test("returns no commands for an empty script", () => {
  expect(analyze("")).toEqual({ calls: [], unsupported: [], leadingExecutable: false });
});
