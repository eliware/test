import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { analyzeKnitScriptAst } from "../../../../../src/checks/general/E-0.1/E-0.1.10/analyze-knit-script-ast.mjs";

function analyze(source) {
  return analyzeKnitScriptAst(
    parse(source, {
      sourceType: "module",
      plugins: ["importAttributes", "topLevelAwait"],
      allowUndeclaredExports: true,
    }),
  );
}

test("collects ordered subprocess commands and detects leading executable code", () => {
  const source =
    'import { spawnSync } from "node:child_process"; spawnSync("git", ["pull"]); spawnSync("npm", ["ci"]);';
  const result = analyze(source);
  expect(result.calls.map(({ command }) => command)).toEqual(["git", "npm"]);
  expect(result.leadingExecutable).toBe(false);
  expect(analyze(`console.log("before"); ${source}`).leadingExecutable).toBe(true);
});

test("detects executable declarations and statements before the first command", () => {
  const command = 'import { spawnSync } from "node:child_process"; spawnSync("git", ["pull"]);';
  for (const statement of [
    "const setup = initialize();",
    "class Setup { static value = initialize(); }",
    "process.env.X;",
    'if (enabled) { initialize("before"); }',
  ])
    expect(analyze(`${statement} ${command}`).leadingExecutable).toBe(true);

  expect(analyze(`const value = 1; ${command}`).leadingExecutable).toBe(false);
});

test("keeps inert declarations and sorts subprocess calls", () => {
  const result = analyze(
    'export default function setup() {} import { spawnSync } from "node:child_process"; spawnSync("git", ["pull"]); spawnSync("npm", ["ci"]);',
  );
  expect(result.leadingExecutable).toBe(false);
  expect(result.calls.map(({ command }) => command)).toEqual(["git", "npm"]);
});

test("returns no commands for an empty script", () => {
  expect(analyze("")).toEqual({ calls: [], leadingExecutable: false });
});
